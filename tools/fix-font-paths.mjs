import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.join(process.cwd(), 'public', 'templates')
const MIRROR = path.join(ROOT, '_shared', 'remote')
const PUBLIC = path.join(process.cwd(), 'public')
const FONT_RE = /\.(woff2|woff|ttf|eot|otf)$/i

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

const slugs = readdirSync(ROOT).filter((n) => {
  const f = path.join(ROOT, n)
  return statSync(f).isDirectory() && n !== '_shared'
})

let changedFiles = 0
let replacedRefs = 0

for (const slug of slugs) {
  const manifest = JSON.parse(readFileSync(path.join(ROOT, slug, 'manifest.json'), 'utf8'))
  // basename -> URL lokal absolut
  const localByBase = new Map()
  for (const res of manifest.resources || []) {
    if (!FONT_RE.test(res.file)) continue
    const localPath = res.file.replace(/\\/g, '/')
    localByBase.set(path.basename(localPath), '/templates/' + slug + '/' + localPath)
  }

  for (const file of walk(path.join(ROOT, slug))) {
    const original = readFileSync(file, 'utf8')
    const dir = path.dirname(file)
    let count = 0
    const text = original.replace(URL_RE, (match, quote, rawUrl) => {
      const url = rawUrl.trim()
      const bare = url.split('#')[0].split('?')[0]
      const base = decodeURIComponent(bare.split('/').pop())
      const local = localByBase.get(base)
      if (!local) return match
      const target = url.startsWith('/')
        ? path.join(PUBLIC, decodeURIComponent(bare))
        : path.resolve(dir, decodeURIComponent(bare))
      if (existsSync(target)) return match
      const suffix = url.slice(bare.length) // simpan ?ver / #iefix
      count++
      return `url(${quote}${local}${suffix}${quote})`
    })
    if (text !== original) {
      writeFileSync(file, text)
      changedFiles++
      replacedRefs += count
    }
  }
}

console.log(`files changed : ${changedFiles}`)
console.log(`refs replaced : ${replacedRefs}`)
