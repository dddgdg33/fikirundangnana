import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'

// ---------------------------------------------------------------------------
// Font "Use Any Font" (uaf.css) direferensikan lewat path absolut
// /wp-content/uploads/useanyfont/<file>. Sebagian juga sudah ditulis ulang
// ke /templates/<slug>/fonts/<file>. Skrip ini menyeragamkan semuanya ke
// /wp-content/uploads/useanyfont/<file> (satu salinan lokal bersama) dan
// mengunduh file yang belum ada dari situs asli.
// ---------------------------------------------------------------------------

const ORIGIN = 'https://attarivitation.com'
const UAF_ORIGIN_DIR = '/wp-content/uploads/useanyfont/'
const PUBLIC = path.join(process.cwd(), 'public')
const ROOT = path.join(PUBLIC, 'templates')
const MIRROR = path.join(ROOT, '_shared', 'remote')
const UAF_LOCAL = path.join(PUBLIC, 'wp-content', 'uploads', 'useanyfont')

const UAF_BASE_RE = /^\d+[\w.\-]*\.(woff2|woff|ttf|otf)$/i
const URL_RE = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    const info = statSync(full)
    if (info.isDirectory()) {
      if (full === MIRROR) continue
      out.push(...walk(full))
    } else if (/\.(html|css)$/i.test(entry)) out.push(full)
  }
  return out
}

function resolveLocal(ref, file) {
  const bare = decodeURIComponent(ref.split('#')[0].split('?')[0])
  if (bare.startsWith('/')) return path.join(PUBLIC, bare)
  return path.resolve(path.dirname(file), bare)
}

// kembalikan nama file uaf jika url ini merujuk font uaf, kalau bukan -> null
function uafBaseFrom(url) {
  const bare = decodeURIComponent(url.split('#')[0].split('?')[0])
  const base = bare.split('/').pop()
  if (!base) return null
  if (bare.includes('/wp-content/uploads/useanyfont/')) {
    return UAF_BASE_RE.test(base) ? base : null
  }
  // sudah pernah ditulis ulang ke /templates/<slug>/fonts/<file>
  if (/\/templates\/[^/]+\/fonts\//i.test(bare) && UAF_BASE_RE.test(base)) return base
  return null
}

const slugs = readdirSync(ROOT).filter((n) => {
  const f = path.join(ROOT, n)
  return statSync(f).isDirectory() && n !== '_shared'
})

const needed = new Map() // base -> origin path
const pending = [] // { file, original, urls:[{url, base}] }

for (const slug of slugs) {
  for (const file of walk(path.join(ROOT, slug))) {
    const original = readFileSync(file, 'utf8')
    URL_RE.lastIndex = 0
    let m
    const urls = []
    while ((m = URL_RE.exec(original))) {
      const url = m[2].trim()
      const base = uafBaseFrom(url)
      if (!base) continue
      if (resolveLocal(url, file) !== path.join(UAF_LOCAL, base)) {
        urls.push({ url, base })
        needed.set(base, UAF_ORIGIN_DIR + base)
      }
    }
    if (urls.length) pending.push({ file, original, urls })
  }
}

console.log(`font uaf unik   : ${needed.size}`)

mkdirSync(UAF_LOCAL, { recursive: true })
let downloaded = 0
let failed = 0
const missing = new Set()

for (const [base] of needed) {
  const dest = path.join(UAF_LOCAL, base)
  if (existsSync(dest)) continue
  try {
    const res = await fetch(ORIGIN + UAF_ORIGIN_DIR + base, {
      signal: AbortSignal.timeout(60000),
      headers: { 'user-agent': 'Mozilla/5.0 (local asset mirror)' },
    })
    if (!res.ok) throw new Error(`${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    writeFileSync(dest, buf)
    downloaded++
  } catch (err) {
    failed++
    missing.add(base)
    console.log(`! gagal ${base} : ${err.message}`)
  }
}

let replaced = 0
for (const { file, original, urls } of pending) {
  let out = original
  for (const { url, base } of urls) {
    if (missing.has(base)) continue
    const suffix = url.slice(url.split('#')[0].split('?')[0].length)
    out = out.split(url).join(UAF_ORIGIN_DIR + base + suffix)
    replaced++
  }
  if (out !== original) writeFileSync(file, out)
}

console.log(`\nfonts downloaded : ${downloaded}`)
console.log(`refs replaced    : ${replaced}`)
console.log(`gagal            : ${failed}`)
