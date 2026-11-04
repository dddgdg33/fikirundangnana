import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.join(process.cwd(), 'public', 'templates')
const MIRROR = path.join(ROOT, '_shared', 'remote')
const PUBLIC = path.join(process.cwd(), 'public')
const FONT_RE = /\.(woff2|woff|ttf|eot|otf)$/i

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

let totalMissing = 0

for (const slug of slugs) {
  const files = walk(path.join(ROOT, slug), /\.(html|css)$/i)
  const sheet = files.map((f) => ({ f, text: readFileSync(f, 'utf8') }))

  // 1) kumpulkan @font-face => list of { family, file, urls }
  const faces = [] // { family, file, urls }
  const FACE_RE = /@font-face\s*\{([^}]*)\}/gi
  for (const { f, text } of sheet) {
    let m
    FACE_RE.lastIndex = 0
    while ((m = FACE_RE.exec(text))) {
      const body = m[1]
      const fam = /font-family\s*:\s*([^;]+)/i.exec(body)
      if (!fam) continue
      const urls = []
      const U = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g
      let u
      while ((u = U.exec(body))) urls.push(u[2].trim())
      faces.push({ family: norm(fam[1]), file: f, urls })
    }
  }

  // 2) kumpulkan family yang benar-benar dipakai (font-family / font shorthand / custom prop)
  const used = new Set()
  for (const { text } of sheet) {
    // buang blok @font-face agar tidak dihitung sebagai pemakaian
    const cleaned = text.replace(/@font-face\s*\{[^}]*\}/gi, '')
    const RE = /font-family\s*:\s*([^;}\n]+)/gi
    let m
    while ((m = RE.exec(cleaned))) {
      for (const part of m[1].split(',')) used.add(norm(part))
    }
    const RE2 = /font\s*:\s*([^;}\n]+)/gi
    while ((m = RE2.exec(cleaned))) {
      const parts = m[1].split(/\s+/)
      for (const p of parts) {
        if (/^['"][^'"]+['"]$/.test(p) || /^[a-z][\w-]+$/i.test(p)) {
          // kandidat nama family (hindari angka/unit)
          if (!/^\d/.test(p) && !/^\d+(px|em|rem|%|pt)$/.test(p)) used.add(norm(p))
        }
      }
    }
  }

  const broken = []
  for (const family of used) {
    const decls = faces.filter((x) => x.family === family)
    if (!decls.length) continue // font sistem / tidak ada @font-face
    const hasOkDecl = decls.some((d) => {
      if (!d.urls.length) return false
      return d.urls.some((url) => {
        const bare = url.split('#')[0].split('?')[0]
        if (/^data:/i.test(bare)) return true
        if (/^https?:/i.test(bare)) return false
        const target = bare.startsWith('/')
          ? path.join(PUBLIC, decodeURIComponent(bare))
          : path.resolve(path.dirname(d.file), decodeURIComponent(bare))
        return existsSync(target)
      })
    })
    if (!hasOkDecl) {
      broken.push({
        family,
        urls: [...new Set(decls.flatMap((d) => d.urls))],
        files: [...new Set(decls.map((d) => path.relative(ROOT, d.file)))],
      })
    }
  }

  if (broken.length) {
    totalMissing += broken.length
    console.log(`\n[${slug}] family dipakai & src rusak: ${broken.length}`)
    for (const b of broken)
      console.log(`   - ${b.family}\n       files: ${b.files.join(', ')}\n       ${b.urls.join('\n       ')}`)
  } else {
    console.log(`[${slug}] OK`)
  }
}

console.log(`\nTOTAL family terpakai dengan src rusak: ${totalMissing}`)
