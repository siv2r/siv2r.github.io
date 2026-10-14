import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeSlug from 'rehype-slug'
import rehypeKatex from 'rehype-katex'
import rehypeStringify from 'rehype-stringify'
import { VFile } from 'vfile'
import { visit, SKIP } from 'unist-util-visit'
import { remarkWikiLinks } from './wikilinks.mjs'
import { rehypeCallouts } from './callouts.mjs'

// Remove a single leading level-1 ATX heading; the slug is the canonical title.
function stripLeadingH1(md) {
  return md.replace(/^\s*#\s+.*(\r?\n)+/, '')
}

// Collect what the page actually shows, for the notes index: plain text (search), first paragraph
// (featured excerpt), first image. Runs before KaTeX, so inline math is still its TeX source and
// display math is skipped rather than indexed as noise.
function rehypeCollectText() {
  const textOf = (node) => {
    let out = ''
    visit(node, (n) => {
      if (n.type !== 'element' && n.type !== 'text') return
      if (n.type === 'element' && (['script', 'style'].includes(n.tagName) || n.properties?.className?.includes('math-display'))) return SKIP
      if (n.type === 'text') out += n.value
    })
    return out.replace(/\s+/g, ' ').trim()
  }
  return (tree, file) => {
    file.data.text = textOf(tree)
    visit(tree, 'element', (n) => {
      if (n.tagName === 'p' && !file.data.excerpt) file.data.excerpt = textOf(n) || null
      if (n.tagName === 'img' && !file.data.firstImage) file.data.firstImage = n.properties.src
    })
  }
}

export async function convertNote(markdown, opts) {
  const file = new VFile({ value: stripLeadingH1(markdown) })
  file.data.assets = []
  file.data.unresolved = []
  file.data.missingEmbeds = []

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkWikiLinks, opts)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeCallouts)
    .use(rehypeCollectText)
    .use(rehypeKatex)
    .use(rehypeStringify, { allowDangerousHtml: true })

  const out = await processor.process(file)
  return { html: String(out), data: file.data }
}
