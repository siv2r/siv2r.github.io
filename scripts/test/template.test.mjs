import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderNotePage, renderIndexPage } from '../lib/template.mjs'

const note = {
  slug: 'musig2-linearity-insight',
  bodyHtml: '<p>hello</p>',
  created: '2026-04-01',
  blurb: 'the linearity trick',
  sources: ['https://eprint.iacr.org/2020/1261']
}

test('note page title and h1 are the slug verbatim', () => {
  const html = renderNotePage(note)
  assert.match(html, /<title>musig2-linearity-insight<\/title>/)
  assert.match(html, /<h1>musig2-linearity-insight<\/h1>/)
})

test('canonical and og:url use siv2r.in, not github.io', () => {
  const html = renderNotePage(note)
  assert.match(html, /rel="canonical" href="https:\/\/siv2r\.in\/notes\/musig2-linearity-insight\/"/)
  assert.ok(!html.includes('siv2r.github.io'))
})

test('note page links styles.css, notes.css, and pinned KaTeX css with SRI', () => {
  const html = renderNotePage(note)
  assert.match(html, /href="\/styles\.css"/)
  assert.match(html, /href="\/notes\.css"/)
  assert.match(html, /katex@0\.16\.\d+\/dist\/katex\.min\.css/)
  assert.match(html, /integrity="sha384-/)
})

test('topbar marks notes as current', () => {
  const html = renderNotePage(note)
  assert.match(html, /<a href="\/notes\/" aria-current="page">notes<\/a>/)
})

test('sources footer renders kept links only', () => {
  const html = renderNotePage(note)
  assert.match(html, /eprint\.iacr\.org/)
})

const sections = [
  { heading: 'Bitcoin & FROST', notes: [{ slug: 'musig2-linearity-insight', blurb: null }] },
  { heading: 'Probability', notes: [{ slug: 'conditional-probability', blurb: 'P given B' }] }
]

test('index lists every note with a readable title, its topic, and its blurb', () => {
  const html = renderIndexPage(sections)
  assert.match(html, /<li data-slug="conditional-probability" data-topic="probability"><a href="\/notes\/conditional-probability\/"><span class="title">Conditional probability<\/span><span class="topic">Probability<\/span><span class="blurb">P given B<\/span>/)
  assert.match(html, /<span class="title">MuSig2 linearity insight<\/span><span class="topic">Bitcoin &amp; FROST<\/span>/)
  assert.match(html, /<p class="notes-count" aria-live="polite">2 notes<\/p>/)
})

test('topic filters come from the sections, All first, and ship hidden until JS', () => {
  const html = renderIndexPage(sections)
  const keys = [...html.matchAll(/<button type="button" data-topic="([^"]*)"/g)].map(m => m[1])
  assert.deepEqual(keys, ['', 'bitcoin--frost', 'probability'])
  assert.match(html, /<div class="notes-tools" hidden>/)
  assert.match(html, /src="\/scripts\/notes-index\.js"/)
})

test('featured card is one link with label, title, excerpt, and decorative image', () => {
  const html = renderIndexPage(sections, { featured: { slug: 'musig2-linearity-insight', excerpt: 'Linearity is the trick.', image: '/notes/assets/x.svg' } })
  assert.match(html, /<a class="featured" href="\/notes\/musig2-linearity-insight\/">/)
  assert.match(html, /Featured note<span class="sep">·<\/span>Bitcoin &amp; FROST/)
  assert.match(html, /<span class="featured-excerpt">Linearity is the trick\.<\/span>/)
  assert.match(html, /<img src="\/notes\/assets\/x\.svg" alt=""/)
  assert.ok(!renderIndexPage(sections).includes('class="featured'))
})
