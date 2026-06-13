# siv2r.github.io

Personal website. Mostly raw HTML, CSS, and vanilla JS with no build step. The
one exception is `/notes/`, which is generated from an Obsidian vault by a small
Node build (see [Notes](#notes) below).

Deployed at https://siv2r.github.io/ via GitHub Pages.

## Structure

```
.
├── index.html               /
├── work/index.html          /work
├── contact/index.html       /contact
├── notes/                   /notes  (generated, committed)
│   ├── index.html           grouped list of published notes
│   ├── <slug>/index.html    one directory per note
│   └── assets/              copied images and Excalidraw exports
├── 404.html
├── styles.css               shared across all pages
├── notes.css                styling for /notes/ pages only
├── photos/                  portrait-{1..4}.jpg
├── scripts/
│   ├── rotate.js            cross-fades portraits on the home page
│   ├── sync-substack.mjs    run hourly by CI, rewrites the Recent list
│   ├── build-notes.mjs      builds /notes/ from the Obsidian vault
│   ├── build-notes.sh       wrapper for build-notes.mjs
│   ├── lib/                 pipeline modules (manifest, convert, wikilinks, ...)
│   └── test/                node:test units, one per lib module
├── docs/
│   └── notes-pipeline.md    how the notes build works, end to end
├── package.json             Node toolchain for the notes build (remark/rehype/katex)
├── .github/workflows/
│   └── substack-sync.yml
└── pgp.asc                  (to add)
```

## Substack sync

The `Recent from Nonce Sense` list on the home page is regenerated hourly by a GitHub Action. The action fetches `https://siv2r.substack.com/feed`, parses the RSS XML, and rewrites the three `<li>` entries between the `<!-- substack:start -->` and `<!-- substack:end -->` markers in `index.html`.

To trigger manually: Actions tab → `Sync Substack posts` → Run workflow.

## Notes

The `/notes/` section is generated from an Obsidian vault rather than written by
hand. Notes are authored in `~/Notes/knowledge/` and selected for publishing via
a manifest (`_published.md`). Running `npm run build:notes` converts the chosen
notes to static HTML (Markdown, math, wikilinks, embeds, and callouts all handled
at build time) and writes the committed `notes/` tree.

For the publishing steps, see [PUBLISHING.md](PUBLISHING.md). For how the build
works end to end, see [docs/notes-pipeline.md](docs/notes-pipeline.md).

## Portraits

Drop 4 JPGs into `photos/` named `portrait-1.jpg` through `portrait-4.jpg` (roughly 400×490 px, <200 KB each). The home page cross-fades through them every 5 seconds, starting from a random image. Respects `prefers-reduced-motion`.

Add a fifth photo by copying one of the `<img>` elements in `index.html` and naming the file `portrait-5.jpg`.

## Local preview

Any static server works. For example:

```
python3 -m http.server 8080
```

Then open http://localhost:8080/.
