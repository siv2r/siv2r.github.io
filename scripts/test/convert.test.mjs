import { test } from 'node:test'
import assert from 'node:assert/strict'
import { convertNote } from '../lib/convert.mjs'

const opts = {
  publishSet: new Set(['lagrange-offset-property']),
  resolveImage: () => null,
  resolveExcalidraw: () => null
}

test('inline and block math render to KaTeX HTML', async () => {
  const { html } = await convertNote('Let $x^2$ and $$\\int_0^1 x\\,dx$$', opts)
  assert.match(html, /class="katex"/)
})

test('a leading H1 is stripped (title comes from the slug)', async () => {
  const { html } = await convertNote('# My Title\n\nbody', opts)
  assert.ok(!html.includes('<h1>'))
  assert.match(html, /body/)
})

test('a non-leading H1 is kept', async () => {
  const { html } = await convertNote('intro\n\n# Later', opts)
  assert.match(html, /<h1[^>]*>Later<\/h1>/)
})

test('headings get ids via rehype-slug', async () => {
  const { html } = await convertNote('## The Section', opts)
  assert.match(html, /id="the-section"/)
})

test('live wikilink resolves through the full pipeline', async () => {
  const { html } = await convertNote('see [[lagrange-offset-property]]', opts)
  assert.match(html, /href="\/notes\/lagrange-offset-property\/"/)
})
