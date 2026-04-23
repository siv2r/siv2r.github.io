# siv2r.github.io

Personal website — raw HTML, CSS, and vanilla JS. No build step.

Deployed at https://siv2r.github.io/ via GitHub Pages.

## Structure

```
.
├── index.html               /
├── work/index.html          /work
├── contact/index.html       /contact
├── 404.html
├── styles.css               shared across all pages
├── photos/                  portrait-{1..4}.jpg
├── scripts/
│   ├── rotate.js            cross-fades portraits on the home page
│   └── sync-substack.mjs    run hourly by CI, rewrites the Recent list
├── .github/workflows/
│   └── substack-sync.yml
└── pgp.asc                  (to add)
```

## Substack sync

The `Recent from Nonce Sense` list on the home page is regenerated hourly by a GitHub Action. The action fetches `https://siv2r.substack.com/feed`, parses the RSS XML, and rewrites the three `<li>` entries between the `<!-- substack:start -->` and `<!-- substack:end -->` markers in `index.html`.

To trigger manually: Actions tab → `Sync Substack posts` → Run workflow.

## Portraits

Drop 4 JPGs into `photos/` named `portrait-1.jpg` through `portrait-4.jpg` (roughly 400×490 px, <200 KB each). The home page cross-fades through them every 5 seconds, starting from a random image. Respects `prefers-reduced-motion`.

Add a fifth photo by copying one of the `<img>` elements in `index.html` and naming the file `portrait-5.jpg`.

## Local preview

Any static server works. For example:

```
python3 -m http.server 8080
```

Then open http://localhost:8080/.
