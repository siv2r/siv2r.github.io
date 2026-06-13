import { findAndReplace } from 'mdast-util-find-and-replace'
import { basename, extname } from 'node:path'
import { headingId } from './slug.mjs'

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'])

// opts: { publishSet:Set, resolveImage(name)->absPath|null, resolveExcalidraw(name)->absPath|null }
export function remarkWikiLinks(opts) {
  const { publishSet, resolveImage, resolveExcalidraw } = opts
  return (tree, file) => {
    file.data.assets ??= []
    file.data.unresolved ??= []
    file.data.missingEmbeds ??= []

    findAndReplace(tree, [
      // Embeds first so ![[x]] is consumed before [[x]] is seen.
      [/!\[\[([^\]]+)\]\]/g, (_full, inner) => embed(inner.trim(), file, opts)],
      [/\[\[([^\]]+)\]\]/g, (_full, inner) => link(inner.trim(), file, opts)]
    ])

    function embed(inner) {
      const ext = extname(inner).toLowerCase()
      if (IMAGE_EXT.has(ext)) {
        const abs = resolveImage(inner)
        if (!abs) { file.data.missingEmbeds.push(inner); return { type: 'text', value: '' } }
        file.data.assets.push(abs)
        const name = basename(abs)
        return { type: 'image', url: `/notes/assets/${name}`, alt: basename(inner, ext) }
      }
      if (ext === '.md') {
        const abs = resolveExcalidraw(inner)   // sibling .svg/.png export
        if (!abs) { file.data.missingEmbeds.push(inner); return { type: 'text', value: '' } }
        file.data.assets.push(abs)
        const name = basename(abs)
        return { type: 'image', url: `/notes/assets/${name}`, alt: basename(inner, ext) }
      }
      file.data.missingEmbeds.push(inner)
      return { type: 'text', value: '' }
    }

    function link(inner) {
      const [target, alias] = inner.split('|')
      const [slug, heading] = target.split('#')
      const text = (alias ?? slug).trim()
      const cleanSlug = slug.trim()
      if (publishSet.has(cleanSlug)) {
        const anchor = heading ? `#${headingId(heading.trim())}` : ''
        return { type: 'link', url: `/notes/${cleanSlug}/${anchor}`, children: [{ type: 'text', value: text }] }
      }
      file.data.unresolved.push(cleanSlug)
      return { type: 'text', value: text }
    }
  }
}
