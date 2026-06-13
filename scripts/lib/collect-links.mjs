import { visit } from 'unist-util-visit'

// Plain-text of an mdast subtree, for backlink excerpts.
function toText(node) {
  if (node.value) return node.value
  if (!node.children) return ''
  return node.children.map(toText).join('')
}

const NOTE_URL = /^\/notes\/([^/#]+)\//

export function remarkCollectLinks() {
  return (tree, file) => {
    file.data.outgoingLinks ??= []
    visit(tree, 'link', (node, _i, parent) => {
      const m = node.url.match(NOTE_URL)
      if (!m) return
      const target = m[1]
      const excerpt = toText(parent || node).replace(/\s+/g, ' ').trim().slice(0, 160)
      file.data.outgoingLinks.push({ target, excerpt })
    })
  }
}

// Extract curated links from a note's `related:` frontmatter field.
// Returns [{ target, excerpt }] with empty excerpts (these links have no prose context).
export function extractRelated(frontmatter) {
  const related = Array.isArray(frontmatter?.related) ? frontmatter.related : []
  const out = []
  for (const entry of related) {
    if (typeof entry !== 'string') continue
    const m = entry.match(/\[\[([^\]]+)\]\]/)
    if (!m) continue
    const target = m[1].split('|')[0].split('#')[0].trim()  // strip alias + heading anchor
    if (target) out.push({ target, excerpt: '' })
  }
  return out
}
