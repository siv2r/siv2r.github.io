import { titleFromSlug, readableTitle, headingId } from './slug.mjs'

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

export function renderNotePage({ slug, bodyHtml, created, blurb, sources }) {
  const title = titleFromSlug(slug)
  const canonical = `https://siv2r.in/notes/${slug}/`
  const description = blurb || title
  const dateLine = created ? `<p class="note-meta">${esc(created)}</p>` : ''
  const src = (sources && sources.length)
    ? `\n    <footer class="note-sources"><span>Sources:</span><ul>${sources.map(u => `<li><a href="${esc(u)}" rel="external noopener">${esc(u)}</a></li>`).join('')}</ul></footer>`
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
        ${bodyHtml}${src}
      </article>
    </main>
  </div>
</body>
</html>
`
}

// featured: { slug, excerpt, image } or null. Search and topic filters ship hidden and are
// switched on by /scripts/notes-index.js, so without JS this is a plain full list.
export function renderIndexPage(sections, { featured = null } = {}) {
  const canonical = 'https://siv2r.in/notes/'
  const topics = sections.map(s => ({ key: headingId(s.heading), name: s.heading }))
  const total = sections.reduce((n, s) => n + s.notes.length, 0)
  const rows = sections.flatMap((s, i) => s.notes.map(n => {
    const blurb = n.blurb ? `<span class="blurb">${esc(n.blurb)}</span>` : ''
    return `        <li data-slug="${esc(n.slug)}" data-topic="${topics[i].key}"><a href="/notes/${n.slug}/"><span class="title">${esc(readableTitle(n.slug))}</span><span class="topic">${esc(s.heading)}</span>${blurb}</a></li>`
  })).join('\n')
  const buttons = [{ key: '', name: 'All' }, ...topics].map(t =>
    `          <button type="button" data-topic="${t.key}" aria-pressed="${t.key === ''}">${esc(t.name)}</button>`).join('\n')

  let card = ''
  if (featured) {
    const topic = sections.find(s => s.notes.some(n => n.slug === featured.slug))?.heading
    const img = featured.image ? `\n        <img src="${esc(featured.image)}" alt="" decoding="async">` : ''
    card = `
      <a class="featured${featured.image ? '' : ' no-image'}" href="/notes/${featured.slug}/">
        <span class="featured-text">
          <span class="featured-label">Featured note${topic ? `<span class="sep">·</span>${esc(topic)}` : ''}</span>
          <span class="featured-title">${esc(readableTitle(featured.slug))}</span>
          ${featured.excerpt ? `<span class="featured-excerpt">${esc(featured.excerpt)}</span>` : ''}
          <span class="featured-cta">Read the note <span class="arrow" aria-hidden="true">→</span></span>
        </span>${img}
      </a>`
  }

  return `<!DOCTYPE html>
<html lang="en">
${head({ title: 'notes', description: 'Selected notes on cryptography, Bitcoin, and math.', canonical, ogType: 'website' })}
<body>
  <div class="container">
    <header>
${topbar('notes')}
    </header>
    <main class="notes-index">
      <h1>My thinking box</h1>
      <p class="intro">Mental models, aha moments, and random explorations as I learn a topic deeply.</p>${card}
      <div class="notes-tools" hidden>
        <div class="notes-search">
          <label class="visually-hidden" for="notes-q">Search notes</label>
          <input id="notes-q" type="search" placeholder="Find an idea…" autocomplete="off" spellcheck="false">
          <kbd aria-hidden="true">/</kbd>
        </div>
        <div class="notes-topics" role="group" aria-label="Filter by topic">
${buttons}
          <span class="notes-topics-bar" aria-hidden="true"></span>
        </div>
      </div>
      <p class="notes-count" aria-live="polite">${total} notes</p>
      <ol class="notes-list">
${rows}
      </ol>
      <div class="notes-empty" hidden>
        <p>Nothing matches <q class="notes-empty-q"></q>.</p>
        <button type="button" class="notes-clear">Clear search</button>
      </div>
    </main>
  </div>
  <script src="/scripts/notes-index.js" defer></script>
</body>
</html>
`
}
