import { visit } from 'unist-util-visit'

// Convert Obsidian callouts (blockquote starting with [!type]) to <div class="callout ...">.
const MARKER = /^\s*\[!(\w+)\]\s?([^\n]*)/

export function rehypeCallouts() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'blockquote') return
      const firstPara = node.children.find(c => c.type === 'element' && c.tagName === 'p')
      if (!firstPara) return
      const firstText = firstPara.children.find(c => c.type === 'text')
      if (!firstText) return
      const m = firstText.value.match(MARKER)
      if (!m) return
      const type = m[1].toLowerCase()
      firstText.value = m[2] + firstText.value.slice(m[0].length) // strip the [!type] marker
      if (firstText.value === '') {
        firstPara.children = firstPara.children.filter(c => c !== firstText)
      }
      node.tagName = 'div'
      node.properties = { className: ['callout', `callout-${type}`] }
    })
  }
}
