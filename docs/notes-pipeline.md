# Notes pipeline: Obsidian vault to static HTML

The `/notes/` section of the site is not hand-written. It is generated from notes
that live in a separate Obsidian vault and compiled into static HTML by a small
Node build. This document is the architecture reference for that pipeline: where
the source lives, how a note becomes a page, and what each module does.

For the operational steps (what to run when you want to publish), see
[PUBLISHING.md](../PUBLISHING.md). This document explains the machinery behind
those steps.

## Two places, one direction

Two distinct locations are involved, and content only ever flows one way.

- **The vault** (`~/Notes/knowledge/`, outside this repo): the authoring surface.
  You write and edit notes here in Obsidian. This is the source of truth, and the
  build never writes back to it.
- **The repo** (`notes/` in this repository): compiled output. Plain HTML
  committed to git and served by GitHub Pages with no build on their side.

The vault path defaults to `~/Notes`. Override it with the `VAULT_PATH`
environment variable.

## Data flow

```
~/Notes/knowledge/
  *.md                 note sources
  _published.md        manifest: which notes publish, in what order, with what blurb
  assets/ , ...        images and Excalidraw exports (searched recursively)
        |
        |  npm run build:notes   (scripts/build-notes.mjs)
        v
  1. parse manifest         lib/manifest.mjs    -> sections + publish set
  2. validate sources       every slug must have a matching *.md, else abort
  3. convert each note       lib/convert.mjs     markdown -> HTML
        wikilinks / embeds      lib/wikilinks.mjs
        Obsidian callouts       lib/callouts.mjs
        GFM, math, headings     remark / rehype plugins
  4. filter sources         lib/sources.mjs     drop private URLs
  5. render pages           lib/template.mjs    wrap in HTML shell + nav
  6. copy referenced assets
  7. atomic swap            .notes-staging/  ->  notes/
        |
        v
notes/
  index.html           grouped list of all published notes
  <slug>/index.html    one directory per note
  assets/              copied images and drawings
```

## The manifest: `_published.md`

Publishing is opt-in. A note exists in the vault but does not appear on the site
until it is listed in `~/Notes/knowledge/_published.md`. The manifest is the only
thing that decides what publishes, in what order, and with what one-line blurb.

The format is plain Markdown, parsed by
[scripts/lib/manifest.mjs](../scripts/lib/manifest.mjs):

```markdown
## Cryptography
- [[otp-security-proof]]: why the one-time pad is information-theoretically secure
- [[nonce-fn-defense-in-depth-inputs]]

## Math
- [[fermats-little-theorem-proof]]: a short proof via the orbit-counting idea
```

- `## Heading` starts a section. Sections render as groups on the index page, in
  document order.
- `- [[slug]]` adds a note to the current section. The `slug` is the note's
  filename without `.md`.
- `- [[slug]]: blurb` adds a note with an optional blurb after the colon. The
  blurb shows on the index and becomes the page's meta description.
- HTML comment blocks (`<!-- ... -->`) are stripped before parsing, so commented
  out example entries never publish.

The parser returns `sections` (ordered, for the index) and `publishSet` (the flat
set of slugs, used to validate sources and to resolve internal links).

## The orchestrator: `build-notes.mjs`

[scripts/build-notes.mjs](../scripts/build-notes.mjs) ties everything together.
Its job is sequencing and safety, not transformation.

1. **Locate the vault.** Resolve `KNOWLEDGE = $VAULT_PATH/knowledge` (default
   `~/Notes/knowledge`). Abort if it does not exist.
2. **Parse the manifest** into sections and a publish set. Abort if the set is
   empty, so a broken manifest can never silently wipe `notes/`.
3. **Pre-flight validation.** Every slug in the manifest must have a matching
   `<slug>.md` source. If any are missing, abort before touching the output.
4. **Convert and render** each note in manifest order (awaited sequentially for
   stable, diff-friendly output):
   - Read the source, split frontmatter with `gray-matter`.
   - `convertNote(content)` produces the body HTML and collects metadata
     (assets to copy, unresolved links, missing embeds).
   - `filterSources(frontmatter.sources)` drops private URLs.
   - `renderNotePage(...)` wraps the body in the page shell and writes it to a
     staging directory.
5. **Render the index** from the manifest sections.
6. **Copy assets.** Every image and drawing referenced during conversion is
   copied into `notes/assets/`.
7. **Atomic swap.** Everything is built under `.notes-staging/` first, then
   `notes/` is removed and replaced in one step. A failed build never leaves
   `notes/` half-written.
8. **Print a report**: notes written, assets copied, plus any unresolved
   wikilinks, skipped private sources, and dropped embeds, so problems are
   visible before you commit.

## Markdown conversion: `convert.mjs`

[scripts/lib/convert.mjs](../scripts/lib/convert.mjs) is a
[unified](https://unifiedjs.com/) processor. Plugin order matters, and the
pipeline is:

```
remarkParse          Markdown -> mdast
remarkGfm            tables, strikethrough, task lists, autolinks
remarkMath           $...$ and $$...$$ -> math nodes
remarkWikiLinks      [[links]] and ![[embeds]]   (custom, lib/wikilinks.mjs)
remarkRehype         mdast -> hast   (allowDangerousHtml: passes raw HTML through)
rehypeRaw            re-parse embedded raw HTML so it becomes real nodes
rehypeSlug           add id="" to headings (github-slugger ids)
rehypeCallouts       Obsidian callouts -> <div class="callout ...">  (custom)
rehypeKatex          render math nodes to HTML at build time
rehypeStringify      hast -> HTML string
```

Two details worth knowing:

- **The leading H1 is stripped** from the source before parsing. The page title
  comes from the slug (rendered as the `<h1>` by the template), so a note's own
  top heading would be a duplicate.
- **Math is pre-rendered.** `rehype-katex` turns math into static HTML at build
  time, so pages need no client-side JavaScript to display equations. The
  template only loads KaTeX's CSS (pinned, with SRI) for fonts and spacing.

The processor runs against a `VFile` whose `file.data` carries three side
channels back to the orchestrator: `assets` (files to copy), `unresolved`
(wikilinks to unpublished notes), and `missingEmbeds` (embeds with no resolvable
file).

## Wikilinks and embeds: `wikilinks.mjs`

[scripts/lib/wikilinks.mjs](../scripts/lib/wikilinks.mjs) is the custom remark
plugin that translates Obsidian's link syntax. Embeds (`![[...]]`) are matched
before links (`[[...]]`) so the `!` form is consumed first.

**Embeds, `![[target]]`:**

- Image extension (`.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`): resolve the
  file by basename across the vault asset dirs, register it for copying, and emit
  an `<img>` pointing at `/notes/assets/<file>`.
- `.md` extension: treated as an Excalidraw drawing. The build looks for a sibling
  `<base>.svg` or `<base>.png` export and embeds that. This is why the Excalidraw
  plugin's SVG auto-export needs to be on.
- Anything else, or a file with no export: dropped, and recorded in
  `missingEmbeds` for the report.

**Links, `[[target|alias]]` or `[[target#heading]]`:**

- If the target slug is in the publish set: emit a link to `/notes/<slug>/`, with
  a `#heading` anchor if present. The anchor is computed with the same
  github-slugger ids that `rehype-slug` assigns, so in-page links land correctly.
- If the target is not published: degrade to plain text (the alias or slug) and
  record it in `unresolved`. Links to private or unpublished notes never leak as
  dead hrefs.

## Callouts: `callouts.mjs`

[scripts/lib/callouts.mjs](../scripts/lib/callouts.mjs) is a rehype plugin that
converts Obsidian callouts into styled blocks. A blockquote whose first paragraph
starts with `[!type]` (for example `> [!note]` or `> [!warning] Title`) becomes a
`<div class="callout callout-<type>">`. The `[!type]` marker is stripped, and any
title text after it is kept as the first line. Styling lives in `notes.css`.

## Source privacy filter: `sources.mjs`

Notes can carry a `sources:` list in their frontmatter, which renders as a footer
on the page. [scripts/lib/sources.mjs](../scripts/lib/sources.mjs) strips entries
that point at private surfaces (Gemini, Canva, Google Docs and Drive, Notion,
`localhost`, `127.0.0.1`, `file://`) before they ever reach the HTML. Kept and
skipped URLs are both reported, so you can see what was withheld.

## Templating: `template.mjs`

[scripts/lib/template.mjs](../scripts/lib/template.mjs) holds the HTML shell. It
has no Markdown knowledge, it only assembles strings.

- `renderNotePage(...)`: the per-note page. Title from the slug, the converted
  body, an optional date line from `frontmatter.created`, and the filtered
  sources footer.
- `renderIndexPage(sections)`: the `/notes/` landing page, grouping notes under
  their manifest headings with blurbs.
- `topbar(active)`: the shared site nav, including the `notes` link. The active
  tab gets `aria-current="page"`.
- `head(...)`: shared `<head>` with Open Graph and Twitter card meta, Google
  Fonts, the global `styles.css`, the notes-only `notes.css`, and the pinned
  KaTeX stylesheet (version and SRI hash kept in sync with `rehype-katex`).

This is the single source for the nav markup used by generated pages. The
hand-written pages (`index.html`, `work/index.html`, `contact/index.html`) carry
their own copy of the same nav and must be kept in sync by hand.

## Slug helpers: `slug.mjs`

[scripts/lib/slug.mjs](../scripts/lib/slug.mjs) is small but load-bearing. The
display title is the slug verbatim (lowercase, hyphens kept), and `headingId`
wraps github-slugger so wikilink anchors match the ids `rehype-slug` emits.

## Output layout

The build writes, and you commit, this tree under `notes/`:

```
notes/
  index.html              grouped list, generated from the manifest
  <slug>/index.html       one clean-URL directory per published note
  assets/                 every referenced image and drawing, flat by basename
```

`notes.css` (at the repo root, loaded by every note page) holds the note-specific
styling that sits on top of the global `styles.css`.

## Tests

Each module is pure and single-purpose, which makes it unit-testable in
isolation. [scripts/test/](../scripts/test/) holds one `node:test` file per
library module, plus a smoke test and a `published.sample.md` fixture. Run them
with:

```
npm test
```

## Adding or changing a note

1. Write or edit the note in the vault (`~/Notes/knowledge/<slug>.md`). If it
   embeds an Excalidraw drawing, make sure the SVG auto-export is on so a sibling
   `.svg` exists.
2. Add, remove, reorder, or re-blurb its entry in `_published.md`.
3. Run `npm run build:notes` (or `scripts/build-notes.sh`).
4. Read the printed report, review the git diff under `notes/`, then commit
   `notes/` and `notes.css`.

## Design principles

- **Source outside the repo.** The vault is the authoring surface, the repo holds
  only compiled output. Authoring tools and publishing stay decoupled.
- **Curation is explicit.** `_published.md` is an allowlist, not
  publish-everything. Nothing leaks by default.
- **Safety over convenience.** Pre-flight validation, a refuse-to-wipe guard, and
  a staging-then-swap mean a bad run cannot corrupt the live `notes/`.
- **Single-concern, tested modules.** Manifest, conversion, wikilinks, callouts,
  and sources are each isolated and independently tested.
