import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildGraph } from '../lib/graph.mjs'

const sections = [
  { heading: 'Mathematics', notes: [{ slug: 'a' }, { slug: 'b' }] },
  { heading: 'Bitcoin & FROST', notes: [{ slug: 'd' }] },
  { heading: 'Cryptography', notes: [{ slug: 'c' }] },
]
const publishSet = new Set(['a', 'b', 'c', 'd'])
const noteData = new Map([
  ['a', { outgoing: [{ target: 'b' }, { target: 'b' }, { target: 'ghost1' }] }],
  ['b', { outgoing: [{ target: 'a' }] }],
  ['c', { outgoing: [] }],
  ['d', { outgoing: [] }],
])

test('node count: 4 published + 1 ghost = 5', async () => {
  const { nodes } = await buildGraph(noteData, sections, publishSet)
  assert.equal(nodes.length, 5)
})

test('ghost node has ghost=true and category=null', async () => {
  const { nodes } = await buildGraph(noteData, sections, publishSet)
  const ghost = nodes.find(n => n.id === 'ghost1')
  assert.ok(ghost, 'ghost1 node must exist')
  assert.equal(ghost.ghost, true)
  assert.equal(ghost.category, null)
})

test('published nodes have ghost=false', async () => {
  const { nodes } = await buildGraph(noteData, sections, publishSet)
  for (const id of ['a', 'b', 'c', 'd']) {
    const n = nodes.find(n => n.id === id)
    assert.ok(n, `node ${id} must exist`)
    assert.equal(n.ghost, false)
  }
})

test('category slugs: mathematics, cryptography, bitcoin-and-frost', async () => {
  const { nodes } = await buildGraph(noteData, sections, publishSet)
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]))
  assert.equal(byId['a'].category, 'mathematics')
  assert.equal(byId['b'].category, 'mathematics')
  assert.equal(byId['c'].category, 'cryptography')
  assert.equal(byId['d'].category, 'bitcoin-and-frost')
})

test('exactly 2 undirected edges: a-b and a-ghost1', async () => {
  const { links } = await buildGraph(noteData, sections, publishSet)
  assert.equal(links.length, 2)
  const pairs = links.map(l => [l.source, l.target].sort().join('|')).sort()
  assert.deepEqual(pairs, ['a|b', 'a|ghost1'])
})

test('degree: a=2, b=1, ghost1=1, c=0, d=0', async () => {
  const { nodes } = await buildGraph(noteData, sections, publishSet)
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]))
  assert.equal(byId['a'].degree, 2)
  assert.equal(byId['b'].degree, 1)
  assert.equal(byId['ghost1'].degree, 1)
  assert.equal(byId['c'].degree, 0)
  assert.equal(byId['d'].degree, 0)
})

test('every node has integer x and y coordinates', async () => {
  const { nodes } = await buildGraph(noteData, sections, publishSet)
  for (const n of nodes) {
    assert.ok(Number.isInteger(n.x), `${n.id}.x=${n.x} is not an integer`)
    assert.ok(Number.isInteger(n.y), `${n.id}.y=${n.y} is not an integer`)
  }
})

test('layout is deterministic across two calls', async () => {
  const r1 = await buildGraph(noteData, sections, publishSet)
  const r2 = await buildGraph(noteData, sections, publishSet)
  const pos1 = Object.fromEntries(r1.nodes.map(n => [n.id, { x: n.x, y: n.y }]))
  const pos2 = Object.fromEntries(r2.nodes.map(n => [n.id, { x: n.x, y: n.y }]))
  assert.deepEqual(pos1, pos2)
})
