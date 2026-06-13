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

test('index page lists sections, slugs as link text, and blurbs', () => {
  const html = renderIndexPage([
    { heading: 'Probability', notes: [{ slug: 'conditional-probability', blurb: 'P given B' }] }
  ])
  assert.match(html, /Probability/)
  assert.match(html, /<a href="\/notes\/conditional-probability\/">conditional-probability<\/a>/)
  assert.match(html, /P given B/)
})
