import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildBacklinks } from '../lib/graph.mjs'

test('inversion: outgoing edges become backlink entries on the target', () => {
  const nd = new Map([
    ['a', { outgoing: [{ target: 'b', excerpt: 'x' }, { target: 'c', excerpt: 'y' }] }],
    ['b', { outgoing: [] }],
    ['c', { outgoing: [] }],
  ])
  const result = buildBacklinks(nd)
  assert.deepEqual(result.get('b'), [{ from: 'a', excerpt: 'x' }])
  assert.deepEqual(result.get('c'), [{ from: 'a', excerpt: 'y' }])
})

test('unpublished targets are excluded from the backlinks map', () => {
  const nd = new Map([
    ['a', { outgoing: [{ target: 'ghost', excerpt: 'z' }] }],
    ['b', { outgoing: [] }],
  ])
  const result = buildBacklinks(nd)
  assert.equal(result.has('ghost'), false)
})

test('duplicate outgoing edges to the same target produce only one backlink entry', () => {
  const nd = new Map([
    ['a', { outgoing: [{ target: 'b', excerpt: 'first' }, { target: 'b', excerpt: 'second' }] }],
    ['b', { outgoing: [] }],
  ])
  const result = buildBacklinks(nd)
  assert.equal(result.get('b').length, 1)
  assert.equal(result.get('b')[0].from, 'a')
})
