import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, basename, extname, dirname } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'
import { parseManifest } from './lib/manifest.mjs'
import { filterSources } from './lib/sources.mjs'
import { convertNote } from './lib/convert.mjs'
import { renderNotePage, renderIndexPage } from './lib/template.mjs'

const REPO = dirname(dirname(fileURLToPath(import.meta.url)))
const VAULT = process.env.VAULT_PATH || join(homedir(), 'Notes')
const KNOWLEDGE = join(VAULT, 'knowledge')
const ASSET_DIRS = [join(VAULT, 'assets'), KNOWLEDGE]
const OUT = join(REPO, 'notes')
const STAGING = join(REPO, '.notes-staging')

function die(msg) { console.error(`ERROR: ${msg}`); process.exit(1) }

// Find a file by basename across the asset dirs (recursive, first match).
function findFile(name) {
  for (const dir of ASSET_DIRS) {
    const hit = walkFind(dir, name)
    if (hit) return hit
  }
  return null
}
function walkFind(dir, name) {
  if (!existsSync(dir)) return null
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    const s = statSync(p)
    if (s.isDirectory()) { const r = walkFind(p, name); if (r) return r }
    else if (entry === name) return p
  }
  return null
}

function main() {
  if (!existsSync(KNOWLEDGE)) die(`vault knowledge dir not found at ${KNOWLEDGE} (set VAULT_PATH)`)

  const manifest = parseManifest(readFileSync(join(KNOWLEDGE, '_published.md'), 'utf8'))
  const { sections, publishSet } = manifest
  const slugs = [...publishSet]
  if (slugs.length === 0) die('manifest yielded zero notes, refusing to wipe notes/')

  // Pre-flight: every slug must have a source file.
  const missing = slugs.filter(s => !existsSync(join(KNOWLEDGE, `${s}.md`)))
  if (missing.length) die(`missing source notes: ${missing.join(', ')}`)

  const resolveImage = (name) => findFile(name)
  const resolveExcalidraw = (name) => {
    const base = basename(name, extname(name))
    return findFile(`${base}.svg`) || findFile(`${base}.png`)
  }

  rmSync(STAGING, { recursive: true, force: true })
  mkdirSync(join(STAGING, 'assets'), { recursive: true })

  const report = { notes: 0, assets: 0, unresolved: new Set(), skippedSources: [], missingEmbeds: [] }
  const allAssets = new Set()

  // Convert and write each note (async, awaited sequentially for stable output).
  const run = async () => {
    for (const slug of slugs) {
      const raw = readFileSync(join(KNOWLEDGE, `${slug}.md`), 'utf8')
      const { data: fm, content } = matter(raw)
      const { html, data } = await convertNote(content, { publishSet, resolveImage, resolveExcalidraw })

      const { kept, skipped } = filterSources(fm.sources)
      skipped.forEach(u => report.skippedSources.push(`${slug}: ${u}`))
      data.unresolved.forEach(u => report.unresolved.add(`${slug} -> ${u}`))
      data.missingEmbeds.forEach(e => report.missingEmbeds.push(`${slug}: ${e}`))
      data.assets.forEach(a => allAssets.add(a))

      const created = fm.created ? new Date(fm.created).toDateString() : null
      const page = renderNotePage({ slug, bodyHtml: html, created, blurb: blurbFor(slug, sections), sources: kept })
      mkdirSync(join(STAGING, slug), { recursive: true })
      writeFileSync(join(STAGING, slug, 'index.html'), page)
      report.notes++
    }

    writeFileSync(join(STAGING, 'index.html'), renderIndexPage(sections))

    for (const abs of allAssets) {
      cpSync(abs, join(STAGING, 'assets', basename(abs)))
      report.assets++
    }

    // Swap staging -> notes/
    rmSync(OUT, { recursive: true, force: true })
    cpSync(STAGING, OUT, { recursive: true })
    rmSync(STAGING, { recursive: true, force: true })

    printReport(report)
  }
  return run()
}

function blurbFor(slug, sections) {
  for (const s of sections) for (const n of s.notes) if (n.slug === slug) return n.blurb
  return null
}

function printReport(r) {
  console.log(`\nnotes written: ${r.notes}`)
  console.log(`assets copied: ${r.assets}`)
  if (r.unresolved.size) console.log(`unresolved wikilinks (rendered as plain text):\n  ${[...r.unresolved].join('\n  ')}`)
  if (r.skippedSources.length) console.log(`private sources skipped:\n  ${r.skippedSources.join('\n  ')}`)
  if (r.missingEmbeds.length) console.log(`embeds with no export (dropped):\n  ${r.missingEmbeds.join('\n  ')}`)
  console.log('\ndone. review the diff, then commit.')
}

main()
