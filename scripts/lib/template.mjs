import { titleFromSlug } from './slug.mjs'
import { catSlug } from './graph.mjs'

const KATEX_VERSION = '0.16.47'           // pinned to the rehype-katex render version
const KATEX_SRI = 'sha384-nH0MfJ44wi1dd7w6jinlyBgljjS8EJAh2JBoRad8a3VDw2K69vfaaqm4WnR+gXtA'
const FONTS = 'https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400..700;1,6..72,400&family=Libre+Franklin:wght@400;500;600&family=Overpass+Mono:wght@400;500&display=swap'

function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}

function topbar(active) {
  const cur = (p) => p === active ? ' aria-current="page"' : ''
  return `      <nav class="topbar">
        <a href="/"${cur('home')}>home</a>
        <a href="/work/"${cur('work')}>work</a>
        <a href="https://siv2r.substack.com" rel="external noopener">writing<span class="ext">↗</span></a>
        <a href="/notes/"${cur('notes')}>notes</a>
        <a href="/sivaram-resume.pdf" download>resume<span class="ext">↓</span></a>
        <a href="/contact/"${cur('contact')}>contact</a>
      </nav>`
}

function head({ title, description, canonical, ogType }) {
  return `<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:url" content="${canonical}">
  <meta name="twitter:card" content="summary">
  <link rel="canonical" href="${canonical}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="${FONTS}">
  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="/notes.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@${KATEX_VERSION}/dist/katex.min.css" integrity="${KATEX_SRI}" crossorigin="anonymous">
</head>`
}

export function renderNotePage({ slug, bodyHtml, created, blurb, sources, backlinks }) {
  const title = titleFromSlug(slug)
  const canonical = `https://siv2r.in/notes/${slug}/`
  const description = blurb || title
  const dateLine = created ? `<p class="note-meta">${esc(created)}</p>` : ''
  const src = (sources && sources.length)
    ? `\n    <footer class="note-sources"><span>Sources:</span><ul>${sources.map(u => `<li><a href="${esc(u)}" rel="external noopener">${esc(u)}</a></li>`).join('')}</ul></footer>`
    : ''
  const back = (backlinks && backlinks.length)
    ? `\n    <footer class="note-backlinks"><h2>Linked from</h2><ul>${
        backlinks.map(b => `<li><a href="/notes/${b.from}/">${esc(b.from)}</a>${
          b.excerpt ? `<span class="backlink-excerpt">${esc(b.excerpt)}</span>` : ''}</li>`).join('')
      }</ul></footer>`
    : ''
  return `<!DOCTYPE html>
<html lang="en">
${head({ title, description, canonical, ogType: 'article' })}
<body>
  <div class="container">
    <header>
${topbar('notes')}
    </header>
    <main>
      <article class="note">
        <h1>${esc(title)}</h1>
        ${dateLine}
        ${bodyHtml}${src}${back}
      </article>
    </main>
  </div>
</body>
</html>
`
}

export function renderIndexPage(sections, graphJson) {
  const canonical = 'https://siv2r.in/notes/'
  const body = sections.map(s => {
    const items = s.notes.map(n => {
      const blurb = n.blurb ? ` <span class="note-blurb">${esc(n.blurb)}</span>` : ''
      return `        <li><a href="/notes/${n.slug}/">${esc(n.slug)}</a>${blurb}</li>`
    }).join('\n')
    return `      <section class="note-group" data-category="${catSlug(s.heading)}">\n        <h2>${esc(s.heading)}</h2>\n        <ul>\n${items}\n        </ul>\n      </section>`
  }).join('\n')
  // graphJson is inlined as JSON; node ids/labels are note slugs ([a-z0-9-]+), so no </script> breakout risk.
  const graphBlock = graphJson
    ? `      <a class="skip-graph" href="#note-list">Skip graph, jump to the note list</a>
      <div class="notes-graph-wrap">
        <div id="notes-graph" role="img" aria-label="Interactive graph of the published notes and how they link to each other. The full note list follows below."></div>
      </div>
      <script id="graph-data" type="application/json">${JSON.stringify(graphJson)}</script>
`
    : ''
  const graphScripts = graphJson
    ? `  <script src="/assets/js/force-graph.min.js" defer></script>
  <script src="/assets/js/notes-graph.js" defer></script>
`
    : ''
  return `<!DOCTYPE html>
<html lang="en">
${head({ title: 'notes', description: 'Selected notes on cryptography, Bitcoin, and math.', canonical, ogType: 'website' })}
<body>
  <div class="container">
    <header>
${topbar('notes')}
    </header>
    <main>
      <p class="intro">My thinking box: mental models, aha moments, and random explorations as I learn a topic deeply.</p>
${graphBlock}      <div class="note-index" id="note-list">
${body}
      </div>
    </main>
  </div>
${graphScripts}</body>
</html>
`
}
