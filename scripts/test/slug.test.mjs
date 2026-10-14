import { test } from 'node:test'
import assert from 'node:assert/strict'
import { titleFromSlug, readableTitle, headingId } from '../lib/slug.mjs'

test('title is the slug verbatim, no caps or spacing changes', () => {
  assert.equal(titleFromSlug('nonce-fn-defense-in-depth-inputs'),
    'nonce-fn-defense-in-depth-inputs')
})

test('headingId matches github-slugger output used by rehype-slug', () => {
  assert.equal(headingId('The Shrunken Universe'), 'the-shrunken-universe')
})

test('readableTitle: sentence case, known names, kept compounds', () => {
  assert.equal(readableTitle('musig2-linearity-insight'), 'MuSig2 linearity insight')
  assert.equal(readableTitle('one-to-one-proof-converse-trap'), 'One-to-one proof converse trap')
  assert.equal(readableTitle('ecmult-multi-algorithm-selection'), 'ecmult_multi algorithm selection')
  assert.equal(readableTitle('pdf-and-cdf-basics'), 'PDF and CDF basics')
  assert.equal(readableTitle('fermats-little-theorem-proof'), "Fermat's little theorem proof")
})
