import fs from 'node:fs'
import path from 'node:path'

const ROOT = 'public/templates'
const set = new Set()
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(p)
    else if (/\.(css|html|js)$/.test(entry.name)) {
      const text = fs.readFileSync(p, 'utf8')
      for (const m of text.matchAll(/https?:\/\/attarivitation\.com[^"'\s<>)\\]*/g)) set.add(m[0].replace(/[?",]$/, ''))
    }
  }
}
walk(ROOT)

const ext = {}
const assets = []
for (const u of set) {
  const clean = u.split('#')[0].split('?')[0]
  const e = (clean.match(/\.([a-z0-9]+)$/i)?.[1] ?? '(none)').toLowerCase()
  ext[e] = (ext[e] ?? 0) + 1
  if (/\.(woff2?|ttf|eot|otf|svg|png|jpe?g|webp|gif|mp4|webm|css|js|ico)$/i.test(clean)) assets.push(clean)
}
console.log('total unique:', set.size, '| asset-like:', assets.length)
console.log('by extension:', ext)
console.log('\nsamples per extension:')
const seen = {}
for (const a of assets) {
  const e = a.split('.').pop().toLowerCase()
  seen[e] = seen[e] ?? []
  if (seen[e].length < 3) seen[e].push(a)
}
for (const [e, list] of Object.entries(seen)) console.log(e, '=>', list.join(' | '))
