import { test } from 'node:test'
import assert from 'node:assert/strict'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { VFile } from 'vfile'
import { remarkWikiLinks } from '../lib/wikilinks.mjs'

function run(md, opts) {
  const file = new VFile({ value: md })
  file.data.assets = []
  file.data.unresolved = []
  file.data.missingEmbeds = []
  const tree = unified().use(remarkParse).parse(file)
  unified().use(remarkWikiLinks, opts).runSync(tree, file)
  const out = unified().use(remarkStringify).stringify(tree)
  return { out, file }
}

const opts = {
  publishSet: new Set(['musig2-linearity-insight']),
  resolveImage: (name) => name === 'race.png' ? '/abs/race.png' : null,
  resolveExcalidraw: (name) => name === 'curves.md' ? '/abs/curves.svg' : null
}

test('live wikilink becomes a link to /notes/slug/', () => {
  const { out } = run('see [[musig2-linearity-insight]] here', opts)
  assert.match(out, /\[musig2-linearity-insight\]\(\/notes\/musig2-linearity-insight\/\)/)
})

test('alias renders as the alias text', () => {
  const { out } = run('see [[musig2-linearity-insight|MuSig]] here', opts)
  assert.match(out, /\[MuSig\]\(\/notes\/musig2-linearity-insight\/\)/)
})

test('heading anchor is appended', () => {
  const { out } = run('[[musig2-linearity-insight#Key Insight]]', opts)
  assert.match(out, /\/notes\/musig2-linearity-insight\/#key-insight/)
})

test('unpublished target becomes plain text, no link, no badge', () => {
  const { out, file } = run('see [[hardness-assumption]] here', opts)
  assert.ok(!out.includes('('))           // no link syntax
  assert.match(out, /hardness-assumption/)
  assert.deepEqual(file.data.unresolved, ['hardness-assumption'])
})

test('image embed becomes an image and records the asset', () => {
  const { out, file } = run('![[race.png]]', opts)
  assert.match(out, /!\[race\]\(\/notes\/assets\/race\.png\)/)
  assert.deepEqual(file.data.assets, ['/abs/race.png'])
})

test('excalidraw embed resolves to exported svg', () => {
  const { out, file } = run('![[curves.md]]', opts)
  assert.match(out, /\/notes\/assets\/curves\.svg/)
  assert.deepEqual(file.data.assets, ['/abs/curves.svg'])
})

test('missing excalidraw export is dropped and recorded', () => {
  const { out, file } = run('![[missing.md]]', opts)
  assert.ok(!out.includes('missing'))
  assert.deepEqual(file.data.missingEmbeds, ['missing.md'])
})
