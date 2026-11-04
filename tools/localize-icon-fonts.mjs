import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'

// ---------------------------------------------------------------------------
// Font ikon yang dipakai template tapi belum ada file lokalnya.
// Sumber: situs asli (attarivitation.com) — diunduh sekali, lalu direferensikan
// lewat path lokal /templates/<slug>/fonts/<file>.
// ---------------------------------------------------------------------------
const NEEDED = new Map([
  ['eicons.woff2', 'https://attarivitation.com/wp-content/plugins/elementor/assets/lib/eicons/fonts/eicons.woff2'],
  [
    'MaterialIcons-Regular.woff2',
    'https://attarivitation.com/wp-content/plugins/icon-element/assets/material-icons/fonts/MaterialIcons-Regular.woff2',
  ],
  ['Metrize-Icons.woff', 'https://attarivitation.com/wp-content/plugins/icon-element/assets/metrize/fonts/Metrize-Icons.woff'],
  [
    'fa-regular-400.woff2',
    'https://attarivitation.com/wp-content/plugins/elementor/assets/lib/font-awesome/webfonts/fa-regular-400.woff2',
  ],
  ['happy-icons.woff2', 'https://attarivitation.com/wp-content/plugins/happy-elementor-addons/assets/fonts/happy-icons.woff2'],
  // Font Awesome 4 (dipakai tombol "Kirim"/"Delete" yang disuntik lewat guest-form.js)
  [
    'fontawesome-webfont.woff2',
    'https://attarivitation.com/wp-content/plugins/elementor/assets/lib/font-awesome/fonts/fontawesome-webfont.woff2',
  ],
  [
    'fa-v4compatibility.woff2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/webfonts/fa-v4compatibility.woff2',
  ],
])

const ROOT = path.join(process.cwd(), 'public', 'templates')
const MIRROR = path.join(ROOT, '_shared', 'remote')
const PUBLIC = path.join(process.cwd(), 'public')

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

const URL_RE = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g

async function fetchFont(url) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(60000),
    headers: { 'user-agent': 'Mozilla/5.0 (local asset mirror)' },
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return Buffer.from(await res.arrayBuffer())
}

const slugs = readdirSync(ROOT).filter((n) => {
  const f = path.join(ROOT, n)
  return statSync(f).isDirectory() && n !== '_shared'
})

let downloaded = 0
let replaced = 0

for (const slug of slugs) {
  const files = walk(path.join(ROOT, slug))

  for (const file of files) {
    const original = readFileSync(file, 'utf8')
    const tasks = []

    // kumpulkan dulu url mana yang perlu diganti (hindari tulis berulang)
    URL_RE.lastIndex = 0
    let m
    while ((m = URL_RE.exec(original))) {
      const url = m[2].trim()
      const bare = url.split('#')[0].split('?')[0]
      const base = decodeURIComponent(bare.split('/').pop())
      if (!NEEDED.has(base)) continue
      const target = bare.startsWith('/') ? path.join(PUBLIC, decodeURIComponent(bare)) : null
      if (target && existsSync(target)) continue
      tasks.push({ url, bare, base })
    }
    if (!tasks.length) continue

    // unduh file yang belum ada
    for (const base of new Set(tasks.map((t) => t.base))) {
      const dest = path.join(ROOT, slug, 'fonts', base)
      if (existsSync(dest)) continue
      mkdirSync(path.dirname(dest), { recursive: true })
      const buf = await fetchFont(NEEDED.get(base))
      writeFileSync(dest, buf)
      downloaded++
      console.log(`+ download ${slug}/fonts/${base}  (${(buf.length / 1024).toFixed(1)} kB)`)
    }

    // tulis ulang referensi menjadi path lokal absolut
    let out = original
    for (const t of tasks) {
      const suffix = t.url.slice(t.bare.length)
      out = out.split(t.url).join(`/templates/${slug}/fonts/${t.base}${suffix}`)
      replaced++
    }
    if (out !== original) writeFileSync(file, out)
  }
}

console.log(`\nfonts downloaded : ${downloaded}`)
console.log(`refs replaced    : ${replaced}`)
