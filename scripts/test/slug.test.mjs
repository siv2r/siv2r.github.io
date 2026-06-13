import { test } from 'node:test'
import assert from 'node:assert/strict'
import { titleFromSlug, headingId } from '../lib/slug.mjs'

test('title is the slug verbatim, no caps or spacing changes', () => {
  assert.equal(titleFromSlug('nonce-fn-defense-in-depth-inputs'),
    'nonce-fn-defense-in-depth-inputs')
})

test('headingId matches github-slugger output used by rehype-slug', () => {
  assert.equal(headingId('The Shrunken Universe'), 'the-shrunken-universe')
})
