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

test('backlinks footer renders when backlinks are provided', () => {
  const html = renderNotePage({
    ...note,
    backlinks: [{ from: 'random-variable', excerpt: 'uses the OTP idea' }],
  })
  assert.match(html, /class="note-backlinks"/)
  assert.match(html, /Linked from/)
  assert.match(html, /href="\/notes\/random-variable\/"/)
  assert.match(html, /uses the OTP idea/)
})

test('backlinks footer is absent when backlinks is empty', () => {
  const html = renderNotePage({ ...note, backlinks: [] })
  assert.ok(!html.includes('note-backlinks'))
})

test('backlinks footer is absent when backlinks is omitted', () => {
  const html = renderNotePage({ ...note })
  assert.ok(!html.includes('note-backlinks'))
})

test('index page lists sections, slugs as link text, and blurbs', () => {
  const html = renderIndexPage([
    { heading: 'Probability', notes: [{ slug: 'conditional-probability', blurb: 'P given B' }] }
  ])
  assert.match(html, /Probability/)
  assert.match(html, /<a href="\/notes\/conditional-probability\/">conditional-probability<\/a>/)
  assert.match(html, /P given B/)
})

test('index page without graphJson omits graph elements and script tags', () => {
  const html = renderIndexPage([
    { heading: 'Probability', notes: [{ slug: 'conditional-probability', blurb: 'P given B' }] }
  ])
  assert.ok(!html.includes('notes-graph'))
  assert.ok(!html.includes('force-graph.min.js'))
})

test('index page with graphJson renders graph container, data script, and script tags', () => {
  const graphJson = { nodes: [{ id: 'a', label: 'a', category: 'mathematics', ghost: false, degree: 1, x: 1, y: 2 }], links: [] }
  const html = renderIndexPage([{ heading: 'Mathematics', notes: [{ slug: 'a', blurb: 'b' }] }], graphJson)
  assert.match(html, /id="notes-graph"/)
  assert.match(html, /id="graph-data"/)
  assert.match(html, /id="note-list"/)
  assert.match(html, /data-category="mathematics"/)
  assert.match(html, /\/assets\/js\/force-graph\.min\.js/)
  assert.match(html, /\/assets\/js\/notes-graph\.js/)
  assert.ok(html.includes('"id":"a"') || html.includes('"id": "a"'))
})
