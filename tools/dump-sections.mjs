// Dump ordered top-level sections with text and backgrounds
import fs from 'node:fs'

const id = process.argv[2]
const html = fs.readFileSync(`public/templates/${id}/html/rendered.html`, 'utf8')

// find all e-con containers with e-parent
const re = /<([a-z]+)\b[^>]*class="[^"]*\be-con\b[^"]*\be-parent\b[^"]*"[^>]*>/g
let m
const sections = []
const bodyStart = html.indexOf('<body')
while ((m = re.exec(html))) {
  if (m.index < bodyStart) continue
  const attrs = m[0]
  const elId = /data-id="([a-z0-9]+)"/.exec(attrs)?.[1] ?? ''
  const cls = /class="([^"]*)"/.exec(attrs)?.[1] ?? ''
  let settings = /data-settings="([^"]*)"/.exec(attrs)?.[1] ?? ''
  // find slice until next e-parent start
  const next = html.slice(m.index)
  const nextParent = next.slice(10).search(/<([a-z]+)\b[^>]*\be-con\b[^>]*\be-parent\b/)
  const seg = html.slice(m.index, nextParent > 0 ? m.index + 10 + nextParent : m.index + 30000)
  const texts = [...seg.matchAll(/>([^<>{}]{3,90})</g)]
    .map((x) => x[1].trim().replace(/&amp;/g, '&').replace(/&nbsp;/g, ' '))
    .filter((t) => !/^(function|var |\{|window\.|\$\(|if\()/i.test(t) && !/javascript|css\(|\.(css|js)/i.test(t))
  const imgs = [...seg.matchAll(/url\("?([^")]+\.(?:webp|jpg|jpeg|png))"?|src="([^"]+\.(?:webp|jpg|jpeg|png))"/g)]
    .map((x) => x[1] || x[2])
    .filter((v, i, a) => v && a.indexOf(v) === i)
    .slice(0, 12)
  const wids = [...new Set([...seg.matchAll(/elementor-widget-([a-z0-9_-]+)/g)].map((x) => x[1]))]
  sections.push({ elId, cls, settings: decodeURIComponent(settings).slice(0, 400), texts: [...new Set(texts)].slice(0, 40), wids, imgs })
}

let i = 0
for (const s of sections) {
  i++
  console.log(`\n=== S${i} [${s.elId}] classes="${s.cls.slice(0, 110)}"`)
  if (s.settings) console.log(`  settings: ${s.settings.slice(0, 300)}`)
  if (s.wids.length) console.log(`  widgets: ${s.wids.join(', ')}`)
  if (s.imgs.length) console.log(`  images: ${s.imgs.join('\n          ')}`)
  console.log(`  text: ${s.texts.join(' | ').slice(0, 800)}`)
}
console.log(`\nsections: ${i}`)
