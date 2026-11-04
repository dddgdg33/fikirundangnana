// Mirror every remaining https://attarivitation.com asset into
// public/templates/_shared/remote/<path> and rewrite all references (html/css/js) to it.
//   node tools/mirror-remote.mjs            # dry run: report what would be downloaded
//   node tools/mirror-remote.mjs --apply    # download + rewrite
import fs from 'node:fs'
import path from 'node:path'

const APPLY = process.argv.includes('--apply')
const ROOT = path.resolve('public/templates')
const MIRROR = path.join(ROOT, '_shared', 'remote')
const ASSET_RE = /\.(woff2?|ttf|eot|otf|svg|png|jpe?g|webp|gif|mp4|webm|mp3|css|js|json|ico)$/i
const URL_RE = /https?:\/\/attarivitation\.com[^"'\s<>)\\]*/g
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function listFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) listFiles(p, out)
    else if (/\.(html|css|js)$/i.test(entry.name)) out.push(p)
  }
  return out
}

function collect(files) {
  const urls = new Set()
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8')
    for (const match of text.matchAll(URL_RE)) urls.add(match[0].replace(/[?",]$/, ''))
  }
  return urls
}

async function pool(items, worker, limit = 16) {
  const results = []
  let cursor = 0
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await worker(items[index])
    }
  })
  await Promise.all(runners)
  return results
}

const files = listFiles(ROOT)
const urls = collect(files)
const assets = [...urls].filter((u) => ASSET_RE.test(u.split('#')[0].split('?')[0]))
const others = [...urls].filter((u) => !assets.includes(u))

console.log(`scanned ${files.length} files | unique urls ${urls.size} | assets ${assets.length} | others ${others.length}`)
console.log('others:', others.length ? others.slice(0, 25) : '(none)')
if (!APPLY) {
  console.log('\n(dry run) pass --apply to download + rewrite')
  process.exit(0)
}

fs.mkdirSync(MIRROR, { recursive: true })

let downloaded = 0
let bytes = 0
const failures = []
await pool(assets, async (url) => {
  const target = url.split('#')[0].split('?')[0]
  const parsed = new URL(target)
  const rel = decodeURIComponent(parsed.pathname).replace(/^\/+/, '')
  const dest = path.join(MIRROR, rel)
  if (fs.existsSync(dest)) return
  try {
    const res = await fetch(target, { signal: AbortSignal.timeout(30000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.writeFileSync(dest, buf)
    downloaded += 1
    bytes += buf.length
  } catch (error) {
    failures.push(`${url} -> ${error.message}`)
  }
})
console.log(`downloaded ${downloaded} files (${(bytes / 1048576).toFixed(1)} MB), ${failures.length} failures`)
if (failures.length) console.log(failures.slice(0, 15).join('\n'))

// ---------------------------------------------------------------------------
// Rewrite references. Re-scan because mirrored css may reference more assets.
const rewritePass = () => {
  const allFiles = listFiles(ROOT)
  const allUrls = collect(allFiles)
  const map = new Map()
  for (const url of allUrls) {
    const clean = url.split('#')[0].split('?')[0]
    if (!ASSET_RE.test(clean)) continue
    const parsed = new URL(clean)
    const rel = decodeURIComponent(parsed.pathname).replace(/^\/+/, '')
    if (fs.existsSync(path.join(MIRROR, rel))) map.set(parsed.origin + parsed.pathname, `/templates/_shared/remote/${rel}`)
  }
  const keys = [...map.keys()].sort((a, b) => b.length - a.length)
  if (!keys.length) return 0
  const master = new RegExp(`(${keys.map(escapeRegExp).join('|')})(\\?[^"'\\s<>()\\\\]*)?`, 'g')
  let changed = 0
  for (const file of allFiles) {
    const before = fs.readFileSync(file, 'utf8')
    let after = before.replace(/https?:\\\/\\\/attarivitation\.com[^\s"']*/g, (m) => m.replace(/\\\//g, '/'))
    after = after.replace(master, (_full, key) => map.get(key))
    // any remaining remote asset url that is not mirrored -> neutralise it
    after = after.replace(/https?:\/\/attarivitation\.com\/[^"'\s<>()\\]*\.(?:woff2?|ttf|eot|otf|svg|png|jpe?g|webp|gif|mp4|webm|mp3|css|js|json|ico)/gi, '#')
    if (after !== before) {
      fs.writeFileSync(file, after)
      changed += 1
    }
  }
  return changed
}

for (let pass = 0; pass < 4; pass += 1) {
  const changed = rewritePass()
  console.log(`rewrite pass ${pass + 1}: ${changed} files changed`)
  const remaining = [...collect(listFiles(ROOT))].filter((u) => ASSET_RE.test(u.split('#')[0].split('?')[0]))
  console.log(`  remaining asset urls: ${remaining.length}`)
  if (!changed && !remaining.length) break
}

// final sweep: drop remaining non-asset attarivitation references (metadata / demo links)
const finalFiles = listFiles(ROOT)
let neutralised = 0
for (const file of finalFiles) {
  const before = fs.readFileSync(file, 'utf8')
  let after = before.replace(/https?:\\\/\\\/attarivitation\.com[^\s"']*/g, (m) => m.replace(/\\\//g, '/'))
  after = after.replace(/https?:\/\/attarivitation\.com[^"'\s<>()\\]*/g, '#')
  if (after !== before) {
    fs.writeFileSync(file, after)
    neutralised += 1
  }
}
console.log(`final sweep: ${neutralised} files still had attarivitation references`)
