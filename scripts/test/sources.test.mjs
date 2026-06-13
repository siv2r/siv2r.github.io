import { test } from 'node:test'
import assert from 'node:assert/strict'
import { filterSources } from '../lib/sources.mjs'

test('keeps public sources', () => {
  const { kept, skipped } = filterSources([
    'https://eprint.iacr.org/2020/1261',
    'https://github.com/siv2r/bip-frost-signing'
  ])
  assert.equal(kept.length, 2)
  assert.equal(skipped.length, 0)
})

test('drops Gemini, Canva, Google Docs/Drive, Notion, localhost, file', () => {
  const { kept, skipped } = filterSources([
    'https://gemini.google.com/app/abc',
    'https://www.canva.com/design/DAF/edit',
    'https://docs.google.com/document/d/x',
    'https://drive.google.com/file/d/y',
    'https://www.notion.so/page',
    'http://localhost:3000',
    'file:///Users/me/note.md',
    'https://arxiv.org/abs/1234.5678'
  ])
  assert.deepEqual(kept, ['https://arxiv.org/abs/1234.5678'])
  assert.equal(skipped.length, 7)
})
