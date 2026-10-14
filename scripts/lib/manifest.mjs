// Parse _published.md into ordered sections, a publish set, and an optional featured note.
// Format: `## Heading` sections, `- [[slug]]` notes, optional `: blurb`,
// and one `Featured: [[slug]]` line (optional `: excerpt`) anywhere outside comments.
export function parseManifest(text) {
  // Remove HTML comment blocks so their example links are never parsed.
  const withoutComments = text.replace(/<!--[\s\S]*?-->/g, '')
  const lines = withoutComments.split('\n')

  const sections = []
  const publishSet = new Set()
  let featured = null
  let current = null

  for (const raw of lines) {
    const line = raw.trimEnd()
    const h2 = line.match(/^##\s+(.+?)\s*$/)
    if (h2) {
      current = { heading: h2[1], notes: [] }
      sections.push(current)
      continue
    }
    const feat = line.match(/^\s*featured:\s*\[\[([^\]|#]+)\]\](.*)$/i)
    if (feat) {
      const excerpt = feat[2].match(/^:\s+(.+)$/)
      featured ??= { slug: feat[1].trim(), excerpt: excerpt ? excerpt[1].trim() : null }
      continue
    }
    const item = line.match(/^\s*-\s*\[\[([^\]|#]+)\]\](.*)$/)
    if (item && current) {
      const slug = item[1].trim()
      const rest = item[2]
      const blurbMatch = rest.match(/^:\s+(.+)$/)
      const blurb = blurbMatch ? blurbMatch[1].trim() : null
      current.notes.push({ slug, blurb })
      publishSet.add(slug)
    }
  }
  return { sections, publishSet, featured }
}
