import { test } from 'node:test'
import assert from 'node:assert/strict'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import { VFile } from 'vfile'
import { remarkWikiLinks } from '../lib/wikilinks.mjs'
import { remarkCollectLinks, extractRelated } from '../lib/collect-links.mjs'

const opts = {
  publishSet: new Set(['otp-security-proof', 'another-note']),
  resolveImage: () => null,
  resolveExcalidraw: () => null,
}

function run(md, publishSet = opts.publishSet) {
  const file = new VFile({ value: md })
  file.data.assets = []
  file.data.unresolved = []
  file.data.missingEmbeds = []
  const tree = unified().use(remarkParse).parse(file)
  unified()
    .use(remarkWikiLinks, { ...opts, publishSet })
    .use(remarkCollectLinks)
    .runSync(tree, file)
  return file
}

test('records target and excerpt for a resolved note link', () => {
  const file = run('I explain [[otp-security-proof]] here.')
  assert.equal(file.data.outgoingLinks.length, 1)
  assert.equal(file.data.outgoingLinks[0].target, 'otp-security-proof')
  assert.ok(file.data.outgoingLinks[0].excerpt.includes('otp-security-proof'))
})

test('ignores external markdown links', () => {
  const file = run('see [external](https://example.com)')
  const externalEntries = file.data.outgoingLinks.filter(
    (l) => l.target === 'example.com' || l.target.startsWith('https')
  )
  assert.equal(externalEntries.length, 0)
  assert.equal(file.data.outgoingLinks.length, 0)
})

test('ignores unresolved wikilinks (not in publishSet)', () => {
  const file = run('see [[not-published]]', new Set([]))
  assert.equal(file.data.outgoingLinks.length, 0)
})

test('collects multiple outgoing links from the same note', () => {
  const file = run('See [[otp-security-proof]] and also [[another-note]] for details.')
  assert.equal(file.data.outgoingLinks.length, 2)
  const targets = file.data.outgoingLinks.map((l) => l.target)
  assert.ok(targets.includes('otp-security-proof'))
  assert.ok(targets.includes('another-note'))
})

test('excerpt is trimmed to 160 chars', () => {
  const longText = 'word '.repeat(50)
  const file = run(`${longText}[[otp-security-proof]]${longText}`)
  assert.ok(file.data.outgoingLinks.length >= 1)
  for (const link of file.data.outgoingLinks) {
    assert.ok(link.excerpt.length <= 160)
  }
})

test('extractRelated returns target+empty-excerpt for each wikilink entry', () => {
  const result = extractRelated({ related: ['[[otp-security-proof]]', '[[random-variable]]'] })
  assert.deepEqual(result, [
    { target: 'otp-security-proof', excerpt: '' },
    { target: 'random-variable', excerpt: '' },
  ])
})

test('extractRelated returns empty array for empty related field', () => {
  assert.deepEqual(extractRelated({ related: [] }), [])
})

test('extractRelated returns empty array when related field is absent', () => {
  assert.deepEqual(extractRelated({}), [])
})

test('extractRelated strips alias and heading anchor', () => {
  const result = extractRelated({ related: ['[[slug#Heading|Alias]]'] })
  assert.deepEqual(result, [{ target: 'slug', excerpt: '' }])
})
