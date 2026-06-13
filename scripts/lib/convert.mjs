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
import { remarkWikiLinks } from './wikilinks.mjs'
import { rehypeCallouts } from './callouts.mjs'

// Remove a single leading level-1 ATX heading; the slug is the canonical title.
function stripLeadingH1(md) {
  return md.replace(/^\s*#\s+.*(\r?\n)+/, '')
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
    .use(rehypeKatex)
    .use(rehypeStringify, { allowDangerousHtml: true })

  const out = await processor.process(file)
  return { html: String(out), data: file.data }
}
