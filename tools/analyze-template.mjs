// Structural extractor for Elementor "e-con" rendered pages
// Usage: node tools/analyze-template.mjs <templateId>
import fs from 'node:fs'
import path from 'node:path'

const id = process.argv[2]
const file = path.resolve(`public/templates/${id}/html/rendered.html`)
const html = fs.readFileSync(file, 'utf8')

// Tokenizer: build nested structure from e-con containers + widgets
const tokens = []
const re = /<(e-con|div)\s+([^>]*?)>|<\/(e-con|div)>/g
let m
const stack = []
const roots = []
let widgetCount = 0
while ((m = re.exec(html))) {
  if (m[0].startsWith('</')) {
    stack.pop()
    continue
  }
  const attrs = m[2]
  if (!/data-element_type="(container|widget)"/.test(attrs)) continue
  const cls = /class="([^"]*)"/.exec(attrs)?.[1] ?? ''
  const isWidget = /data-element_type="widget"/.test(attrs)
  const widgetType = /elementor-widget-([a-z0-9_-]+)/.exec(cls)?.[1] ?? ''
  const settings = /data-settings="([^"]*)"/.exec(attrs)?.[1] ?? ''
  const node = {
    depth: stack.length,
    cls: cls.replace(/elementor-element elementor-element-[a-z0-9]+/g, '').trim(),
    widgetType,
    settings: settings ? decodeURIComponent(settings.slice(0, 300)) : '',
    children: [],
    textSnippet: '',
  }
  if (stack.length) stack[stack.length - 1].children.push(node)
  else roots.push(node)
  if (!/\/>$/.test(m[0].trim())) stack.push(node)
}

// attach text after tags: crude—walk html per container start offset
const offsets = []
{
  const re2 = /<(e-con|div)\s+([^>]*?)data-element_type="(container|widget)"/g
  let mm
  while ((mm = re2.exec(html))) {
    const cls = /class="([^"]*)"/.exec(mm[2])?.[1] ?? ''
    offsets.push({ i: mm.index, widgetType: /elementor-widget-([a-z0-9_-]+)/.exec(cls)?.[1] ?? '' })
  }
}
// text between widget start and next 2000 chars
for (const o of offsets) {
  const seg = html.slice(o.i, o.i + 2600)
  const texts = []
  const tre = /<(\w+)[^>]*>([^<>]{2,120})</g
  let tm
  while ((tm = tre.exec(seg)) && texts.length < 6) {
    const txt = tm[2].trim().replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
    if (txt && !/^(function|\{|var |window\.)/.test(txt) && !/<script/i.test(seg.slice(tm.index - 8, tm.index))) texts.push(txt)
  }
  o.texts = texts
}

// walk and print tree
const attach = (nodes, list) => {
  for (const n of nodes) {
    let found = false
    for (const o of list) {
      if (o.i > (n._i ?? 0)) continue
    }
    attach(n.children, list)
  }
}
// order roots/children by offsets? The tokenizer preserved document order (since re walks the doc), so children arrays are in order.
// Now merge widget texts via offsets ordering: count widgets in both passes
let wi = 0
const put = (nodes) => {
  for (const n of nodes) {
    if (n.widgetType) {
      const o = offsets.filter((x) => x.widgetType === n.widgetType)[wi] // naive alignment
      if (o) n.textSnippet = o.texts.join(' | ')
      wi++
    }
    put(n.children)
  }
}
put(roots)

function print(n, ind = 0) {
  const label = n.widgetType ? `W:${n.widgetType}` : 'CON'
  const line = `${'  '.repeat(ind)}${label} ${n.cls.slice(0, 80)}`
  console.log(line + (n.textSnippet && n.widgetType ? `  ⇒ ${n.textSnippet.slice(0, 140)}` : ''))
  n.children.forEach((c) => print(c, ind + 1))
}
console.log(`# structure: ${id}`)
roots.slice(0, 2).forEach((r) => print(r, 0))
