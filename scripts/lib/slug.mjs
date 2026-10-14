import GithubSlugger, { slug as ghSlug } from 'github-slugger'

// The display title is the filename slug, verbatim (lowercase, hyphens kept).
export function titleFromSlug(slug) {
  return slug
}

// Readable list title for the notes index: "musig2-linearity-insight" -> "MuSig2 linearity insight".
// ponytail: hand-kept word list, add an entry when a new acronym or proper name shows up in a slug.
const WORDS = {
  chilldkg: 'ChillDKG', ec: 'EC', frost: 'FROST', shamir: 'Shamir', lagrange: 'Lagrange',
  musig2: 'MuSig2', strauss: 'Strauss', swiftsync: 'SwiftSync', lotus: 'LOTUS', pdf: 'PDF',
  cdf: 'CDF', otp: 'OTP', fermats: "Fermat's"
}
// Hyphenated compounds that should keep their hyphens (or their real spelling).
const PHRASES = {
  'ecmult-multi': 'ecmult_multi', 'one-to-one': 'one~to~one',
  'defense-in-depth': 'defense~in~depth', 'self-contained': 'self~contained'
}

export function readableTitle(slug) {
  let s = slug
  for (const [k, v] of Object.entries(PHRASES)) s = s.replace(k, v)
  const words = s.split('-').map(w => (WORDS[w] ?? w).replaceAll('~', '-'))
  if (/^[a-z]/.test(words[0]) && !words[0].includes('_')) words[0] = words[0][0].toUpperCase() + words[0].slice(1)
  return words.join(' ')
}

// Match rehype-slug ids (it uses github-slugger) for [[note#heading]] anchors.
export function headingId(text) {
  return ghSlug(text)
}

export function newSlugger() {
  return new GithubSlugger()
}
