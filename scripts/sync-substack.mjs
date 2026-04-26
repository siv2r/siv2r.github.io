#!/usr/bin/env node
import { readFile, writeFile, rename } from 'node:fs/promises';

const FEED = 'https://siv2r.substack.com/feed';
const HTML = 'index.html';
const START = '<!-- substack:start -->';
const END = '<!-- substack:end -->';
const N = 5;
const SUBTITLE_MAX = 140;

function fmt(dateStr) {
  const d = new Date(dateStr);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const spoken = d.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  });
  return { iso: `${y}-${m}-${day}`, display: `${y}·${m}·${day}`, spoken };
}

function decode(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function esc(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function pick(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return m ? decode(m[1]) : '';
}

function sanitizeSubtitle(raw) {
  const stripped = raw.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  if (stripped.length <= SUBTITLE_MAX) return stripped;
  const cut = stripped.lastIndexOf(' ', SUBTITLE_MAX);
  const head = cut > 0 ? stripped.slice(0, cut) : stripped.slice(0, SUBTITLE_MAX);
  return `${head} …`;
}

const res = await fetch(FEED, { headers: { 'user-agent': 'siv2r-site-sync/1.0' } });
if (!res.ok) throw new Error(`feed fetch failed: ${res.status}`);
const xml = await res.text();

const items = [];
for (const m of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/g)) {
  const block = m[1];
  const title = pick(block, 'title');
  const link = pick(block, 'link');
  const pubDate = pick(block, 'pubDate');
  const subtitle = sanitizeSubtitle(pick(block, 'description'));
  if (title && link && pubDate) items.push({ title, link, pubDate, subtitle });
}

items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
const top = items.slice(0, N);
if (top.length === 0) {
  console.error('no items parsed from feed');
  process.exit(1);
}

const rendered = top
  .map((it, i) => {
    const num = String(i + 1).padStart(2, '0');
    const { iso, display, spoken } = fmt(it.pubDate);
    const subtitleSpan = it.subtitle
      ? `\n              <span class="subtitle">${esc(it.subtitle)}</span>`
      : '';
    return `          <li>
            <a href="${esc(it.link)}">
              <span class="num" aria-hidden="true">№ ${num}</span>
              <span class="title">${esc(it.title)}</span>${subtitleSpan}
              <span class="date"><time datetime="${iso}" aria-label="${esc(spoken)}">${display}</time></span>
            </a>
          </li>`;
  })
  .join('\n');

const html = await readFile(HTML, 'utf8');
const s = html.indexOf(START);
const e = html.indexOf(END);
if (s === -1 || e === -1) throw new Error(`markers not found (${START} / ${END})`);

const block = `${START}\n${rendered}\n${END}`;
const out = html.slice(0, s) + block + html.slice(e + END.length);

if (out === html) {
  console.log('no new blogs were found');
  process.exit(0);
}
const TMP = `${HTML}.tmp`;
await writeFile(TMP, out);
await rename(TMP, HTML);
console.log(`updated ${HTML} with ${top.length} items`);
