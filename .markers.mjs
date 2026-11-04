import fs from 'node:fs'
import path from 'node:path'

const base = 'public/templates'
for (const t of fs.readdirSync(base)) {
  const f = path.join(base, t, 'html', 'rendered.html')
  if (!fs.existsSync(f)) continue
  const s = fs.readFileSync(f, 'utf8')
  const m = s.match(/data-template-(?:field|image|href|couple|guest|gallery|music)(?:="[a-z_]+")?/g) || []
  const c = {}
  for (const x of m) c[x] = (c[x] || 0) + 1
  console.log(`\n== ${t} (${m.length})`)
  for (const [k, v] of Object.entries(c).sort()) console.log(`   ${k} x${v}`)
}
