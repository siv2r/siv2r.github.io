// Privacy filter: omit source URLs that look private. Returns kept + skipped.
const PRIVATE_PATTERNS = [
  /gemini\.google\.com/i,
  /canva\.com/i,
  /docs\.google\.com/i,
  /drive\.google\.com/i,
  /notion\.so/i,
  /^https?:\/\/localhost\b/i,
  /^https?:\/\/127\.0\.0\.1\b/i,
  /^file:\/\//i,
  /^(?!https?:\/\/)/i   // anything that isn't an http(s) URL (e.g. relative vault paths like log/...)
]

export function filterSources(urls) {
  const kept = []
  const skipped = []
  for (const url of urls ?? []) {
    if (PRIVATE_PATTERNS.some(re => re.test(url))) skipped.push(url)
    else kept.push(url)
  }
  return { kept, skipped }
}
