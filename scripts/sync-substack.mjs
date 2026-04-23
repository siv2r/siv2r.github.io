#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';

const FEED = 'https://siv2r.substack.com/feed';
const HTML = 'index.html';
const START = '<!-- substack:start -->';
const END = '<!-- substack:end -->';
const N = 3;

function fmt(dateStr) {
  const d = new Date(dateStr);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return { iso: `${y}-${m}-${day}`, display: `${y}·${m}·${day}` };
}

function decode(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
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

const res = await fetch(FEED, { headers: { 'user-agent': 'siv2r-site-sync/1.0' } });
if (!res.ok) throw new Error(`feed fetch failed: ${res.status}`);
const xml = await res.text();

const items = [];
for (const m of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/g)) {
  const block = m[1];
  const title = pick(block, 'title');
  const link = pick(block, 'link');
  const pubDate = pick(block, 'pubDate');
  if (title && link && pubDate) items.push({ title, link, pubDate });
}

const top = items.slice(0, N);
if (top.length === 0) {
  console.error('no items parsed from feed');
  process.exit(1);
}

const rendered = top
  .map(it => {
    const { iso, display } = fmt(it.pubDate);
    return `          <li>
            <a href="${esc(it.link)}">
              <span class="title">${esc(it.title)}</span>
              <span class="date"><time datetime="${iso}">${display}</time></span>
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
  console.log('no changes');
  process.exit(0);
}
await writeFile(HTML, out);
console.log(`updated ${HTML} with ${top.length} items`);
