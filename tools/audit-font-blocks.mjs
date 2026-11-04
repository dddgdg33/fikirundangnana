import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.join(process.cwd(), 'public', 'templates')
const MIRROR = path.join(ROOT, '_shared', 'remote')
const PUBLIC = path.join(process.cwd(), 'public')

function walk(dir, exts) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    const info = statSync(full)
    if (info.isDirectory()) {
      if (full === MIRROR) continue
      out.push(...walk(full, exts))
    } else if (exts.test(entry)) out.push(full)
  }
  return out
}

const slugs = readdirSync(ROOT).filter((n) => {
  const f = path.join(ROOT, n)
  return statSync(f).isDirectory() && n !== '_shared'
})

const norm = (s) => s.trim().replace(/^['"]|['"]$/g, '').toLowerCase()

const summary = []

for (const slug of slugs) {
  const files = walk(path.join(ROOT, slug), /\.(html|css)$/i)
  const used = new Set()
  const sheet = files.map((f) => ({ f, text: readFileSync(f, 'utf8') }))
  for (const { text } of sheet) {
    const cleaned = text.replace(/@font-face\s*\{[^}]*\}/gi, '')
    let m
    const RE = /font-family\s*:\s*([^;}\n]+)/gi
    while ((m = RE.exec(cleaned))) for (const p of m[1].split(',')) used.add(norm(p))
    const RE2 = /font\s*:\s*([^;}\n]+)/gi
    while ((m = RE2.exec(cleaned)))
      for (const p of m[1].split(/\s+/)) if (/^[a-z][\w-]*$/i.test(p)) used.add(norm(p))
  }

  const rows = []
  for (const { f, text } of sheet) {
    const FACE_RE = /@font-face\s*\{([^}]*)\}/gi
    let m
    while ((m = FACE_RE.exec(text))) {
      const body = m[1]
      const fam = /font-family\s*:\s*([^;]+)/i.exec(body)
      if (!fam) continue
      const family = norm(fam[1])
      const urls = []
      const U = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g
      let u
      while ((u = U.exec(body))) urls.push(u[2].trim())
      const okAny = urls.some((url) => {
        const bare = url.split('#')[0].split('?')[0]
        if (/^data:/i.test(bare)) return true
        if (/^https?:/i.test(bare)) return false
        const t = bare.startsWith('/')
          ? path.join(PUBLIC, decodeURIComponent(bare))
          : path.resolve(path.dirname(f), decodeURIComponent(bare))
        return existsSync(t)
      })
      if (okAny) continue
      const weight = (/font-weight\s*:\s*([^;]+)/i.exec(body) || [, '?'])[1].trim()
      rows.push({
        family,
        weight,
        used: used.has(family),
        file: path.relative(ROOT, f),
        urls: [...new Set(urls)],
      })
    }
  }

  if (!rows.length) {
    console.log(`[${slug}] semua @font-face resolvable`)
    continue
  }
  console.log(`\n[${slug}] @font-face TIDAK resolvable: ${rows.length}`)
  const seen = new Set()
  for (const r of rows) {
    const key = r.family + '|' + r.weight + '|' + r.file
    if (seen.has(key)) continue
    seen.add(key)
    const nice = r.urls.filter((x) => /\.(woff2?|ttf|otf)(\?|#|$)/i.test(x)).slice(0, 3)
    console.log(`   ${r.used ? '*' : ' '} ${r.family} [${r.weight}] <- ${r.file}`)
    console.log(`        ${nice.length ? nice.join('  ') : r.urls.slice(0, 3).join('  ')}`)
    if (r.used) summary.push(`${slug}  ${r.family} [${r.weight}]`)
  }
}

console.log('\n=== RINGKASAN: family DIPAKAI tapi src rusak ===')
console.log([...new Set(summary)].join('\n') || '(kosong)')
console.log(`total: ${new Set(summary).size}`)
