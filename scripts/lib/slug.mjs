import GithubSlugger, { slug as ghSlug } from 'github-slugger'

// The display title is the filename slug, verbatim (lowercase, hyphens kept).
export function titleFromSlug(slug) {
  return slug
}

// Match rehype-slug ids (it uses github-slugger) for [[note#heading]] anchors.
export function headingId(text) {
  return ghSlug(text)
}

export function newSlugger() {
  return new GithubSlugger()
}
