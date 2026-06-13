import { forceSimulation, forceLink, forceManyBody, forceCenter, forceX, forceY } from 'd3-force'

const W = 760, H = 460   // logical layout box; runtime zoomToFit rescales

function categoryFor(slug, sections) {
  for (const s of sections) for (const n of s.notes) if (n.slug === slug) return s.heading
  return null
}
export function catSlug(heading) {
  return heading.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function buildGraph(noteData, sections, publishSet) {
  // Nodes: published first, then ghost targets.
  const nodes = []
  const byId = new Map()
  for (const slug of publishSet) {
    const heading = categoryFor(slug, sections)
    const n = { id: slug, label: slug, category: heading ? catSlug(heading) : null, ghost: false, degree: 0 }
    nodes.push(n); byId.set(slug, n)
  }
  // Edges: dedup undirected by sorted pair; degree counts unique neighbors. Ghosts created on demand.
  const edgeKey = new Set()
  const links = []
  for (const [from, nd] of noteData) {
    const seen = new Set()
    for (const { target } of nd.outgoing) {
      if (seen.has(target)) continue
      seen.add(target)
      if (!publishSet.has(target)) {
        if (!byId.has(target)) {
          const g = { id: target, label: target, category: null, ghost: true, degree: 0 }
          nodes.push(g); byId.set(target, g)
        }
      }
      const a = from, b = target
      const key = a < b ? `${a}|${b}` : `${b}|${a}`
      if (edgeKey.has(key)) continue
      edgeKey.add(key)
      links.push({ source: a, target: b })
      byId.get(a).degree++; byId.get(b).degree++
    }
  }

  // Deterministic layout. Default d3-force init (phyllotaxis) is deterministic; do NOT add forceCollide (uses randomness).
  const sim = forceSimulation(nodes)
    .force('link', forceLink(links).id(d => d.id).distance(36).strength(1))
    .force('charge', forceManyBody().strength(-60))
    .force('center', forceCenter(W / 2, H / 2))
    .force('x', forceX(W / 2).strength(0.05))
    .force('y', forceY(H / 2).strength(0.05))
    .stop()
  for (let i = 0; i < 300; i++) sim.tick()

  const outNodes = nodes.map(n => ({
    id: n.id, label: n.label, category: n.category, ghost: n.ghost, degree: n.degree,
    x: Math.round(n.x), y: Math.round(n.y),
  }))
  const outLinks = links.map(l => ({ source: l.source.id ?? l.source, target: l.target.id ?? l.target }))
  return { nodes: outNodes, links: outLinks }
}

export function buildBacklinks(noteData) {
  const map = new Map()
  for (const [from, nd] of noteData) {
    const seen = new Set()
    for (const { target, excerpt } of nd.outgoing) {
      if (!noteData.has(target)) continue   // only published targets get backlinks
      if (seen.has(target)) continue        // one backlink entry per source note
      seen.add(target)
      if (!map.has(target)) map.set(target, [])
      map.get(target).push({ from, excerpt })
    }
  }
  return map
}
