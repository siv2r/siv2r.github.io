import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parseManifest } from '../lib/manifest.mjs'

const sample = readFileSync(
  fileURLToPath(new URL('./fixtures/published.sample.md', import.meta.url)), 'utf8')

test('parses sections in order', () => {
  const { sections } = parseManifest(sample)
  assert.deepEqual(sections.map(s => s.heading), ['Bitcoin & FROST', 'Probability'])
})

test('parses notes in order within a section', () => {
  const { sections } = parseManifest(sample)
  assert.deepEqual(sections[0].notes.map(n => n.slug),
    ['musig2-linearity-insight', 'lagrange-offset-property'])
})

test('captures blurb after the first ": " and keeps later colons', () => {
  const { sections } = parseManifest(sample)
  assert.equal(sections[1].notes[0].blurb, 'P(A given B): the shrunken universe')
})

test('note without a blurb has blurb null', () => {
  const { sections } = parseManifest(sample)
  assert.equal(sections[0].notes[0].blurb, null)
})

test('does NOT ingest example slugs from the comment block', () => {
  const { publishSet } = parseManifest(sample)
  assert.ok(!publishSet.has('note-name'))
  assert.ok(!publishSet.has('wikilink'))
})

test('publishSet contains all listed slugs', () => {
  const { publishSet } = parseManifest(sample)
  assert.equal(publishSet.size, 3)
  assert.ok(publishSet.has('conditional-probability'))
})
