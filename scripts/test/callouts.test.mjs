import { test } from 'node:test'
import assert from 'node:assert/strict'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { rehypeCallouts } from '../lib/callouts.mjs'

async function run(md) {
  const html = await unified()
    .use(remarkParse).use(remarkRehype).use(rehypeCallouts).use(rehypeStringify)
    .process(md)
  return String(html)
}

test('spaced callout becomes a styled div, marker stripped', async () => {
  const html = await run('> [!info] Heads up\n> body text')
  assert.match(html, /<div class="callout callout-info">/)
  assert.ok(!html.includes('[!info]'))
  assert.match(html, /body text/)
})

test('compact callout (no space after >) is handled', async () => {
  const html = await run('>[!warning]\n>careful')
  assert.match(html, /callout-warning/)
})

test('a plain blockquote is left as a blockquote', async () => {
  const html = await run('> just a quote')
  assert.match(html, /<blockquote>/)
})
