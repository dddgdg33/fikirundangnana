import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const PUBLIC_DIR = path.join(ROOT, 'public')
const TEMPLATES_DIR = path.join(PUBLIC_DIR, 'templates')

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.trae', '.agents', 'memory'])
const TEXT_EXT = new Set(['.html', '.css', '.js', '.mjs', '.cjs', '.json', '.ts', '.tsx', '.sql', '.md', '.txt', '.php', '.bin'])

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      walk(path.join(dir, entry.name), out)
    } else if (entry.isFile()) {
      out.push(path.join(dir, entry.name))
    }
  }
  return out
}

const IGNORE_FILES = new Set(['.audit-unused.txt', '.audit-unused.mjs', '.markers.mjs', '.heads.mjs'])
const allFiles = walk(ROOT)
const textFiles = allFiles.filter(
  (f) => TEXT_EXT.has(path.extname(f).toLowerCase()) && !IGNORE_FILES.has(path.basename(f)),
)
const textMap = new Map(textFiles.map((f) => [f, fs.readFileSync(f, 'utf8').replace(/\\/g, '/')]))
const ALL_TEXT = [...textMap.values()].join('\n')

const templateFiles = allFiles.filter((f) => f.startsWith(TEMPLATES_DIR + path.sep))

// basenames that repeat across templates -> basename match is unreliable
const baseCount = new Map()
for (const f of templateFiles) {
  const b = path.basename(f)
  baseCount.set(b, (baseCount.get(b) ?? 0) + 1)
}

const results = []
for (const file of templateFiles) {
  const rel = path.relative(PUBLIC_DIR, file).replace(/\\/g, '/')
  const base = path.basename(file)
  const self = textMap.get(file) ?? ''
  const corpus = self ? ALL_TEXT.replace(self, '') : ALL_TEXT

  const pathCandidates = [`/${rel}`, rel]
  const uniqueBase = (baseCount.get(base) ?? 0) === 1

  let referenced = ''
  for (const c of pathCandidates) {
    if (corpus.includes(c)) { referenced = c; break }
  }
  if (!referenced && uniqueBase && base.length > 3 && corpus.includes(base)) referenced = `basename:${base}`
  // hashed duplicate check: strip _hash suffix  (style.min_637fede86a.css -> style.min.css)
  if (!referenced) {
    const stripped = base.replace(/_[0-9a-f]{8,}(?=\.[^.]+$)/, '')
    if (stripped !== base && corpus.includes(stripped)) referenced = `hash-stripped:${stripped}`
  }
  // dynamic chunk check: any distinctive token (hash / long name) present in corpus
  if (!referenced) {
    const tokens = base.split(/[-._]/).filter((t) => t.length >= 8)
    for (const tk of tokens) {
      if (corpus.includes(tk)) { referenced = `token:${tk}`; break }
    }
  }

  results.push({ rel, base, referenced: Boolean(referenced), how: referenced })
}

const groups = new Map()
for (const r of results) {
  const top = r.rel.replace(/^templates\//, '').split('/')[0]
  if (!groups.has(top)) groups.set(top, [])
  groups.get(top).push(r)
}

let total = 0
let totalBytes = 0
console.log('=== UNREFERENCED FILES ===')
for (const [tpl, items] of [...groups.entries()].sort()) {
  const unref = items.filter((i) => !i.referenced)
  if (!unref.length) continue
  total += unref.length
  console.log(`\n--- ${tpl} : ${unref.length} unreferenced / ${items.length} ---`)
  for (const u of unref) {
    const size = fs.statSync(path.join(PUBLIC_DIR, u.rel)).size
    totalBytes += size
    console.log(`   ${(size / 1024).toFixed(0).padStart(7)} KB  ${u.rel}`)
  }
}
console.log(`\nTOTAL UNREFERENCED: ${total} files, ${(totalBytes / 1024 / 1024).toFixed(1)} MB`)
