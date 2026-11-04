import { mkdir, readFile, writeFile, readdir, stat, access } from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.join(process.cwd(), 'public', 'templates')
const MIRROR = path.join(ROOT, '_shared', 'remote')
// `&` dikecualikan agar tidak ikut menyerap entitas HTML seperti &quot;/&amp; di sekitarnya.
const HOST_RE = /https?:\/\/byattari\.com(\/[^\s"')<>,&]*)?/gi
const ASSET_RE = /\.(woff2?|ttf|eot|otf|svg|png|jpe?g|webp|gif|mp4|webm|mp3|css|js|json|ico)$/i
const GIFT_RE = /https?:\/\/byattari\.com\/gift-regristry\/?/gi

async function walk(dir) {
  const out = []
  for (const entry of await readdir(dir)) {
    const full = path.join(dir, entry)
    const info = await stat(full)
    if (info.isDirectory()) {
      if (full === MIRROR) continue
      out.push(...(await walk(full)))
    } else if (/\.(html|css|js)$/i.test(entry)) out.push(full)
  }
  return out
}

async function exists(file) {
  try {
    await access(file)
    return true
  } catch {
    return false
  }
}

const files = await walk(ROOT)
const downloads = new Map()
let changedFiles = 0
const rewrites = new Map()

for (const file of files) {
  const original = await readFile(file, 'utf8')
  let text = original

  // 1) Aset byattari.com -> mirror lokal
  text = text.replace(HOST_RE, (url) => {
    let pathname
    try {
      pathname = new URL(url).pathname
    } catch {
      return url
    }
    const clean = url.split('?')[0].replace(/[.,;]+$/, '')
    const isAsset = pathname.startsWith('/wp-content/') && ASSET_RE.test(clean)
    if (!isAsset) return url
    downloads.set(pathname, clean)
    const local = '/templates/_shared/remote' + pathname
    rewrites.set(url, local)
    return local
  })

  // 1b) Varian JSON-escaped (https:\/\/byattari.com\/...) di dalam data-settings
  text = text.replace(/https:\\\/\\\/byattari\.com\\\/([^\s"',&]*)/g, (match, rest) => {
    if (!ASSET_RE.test(rest)) return match
    return '/templates\\/_shared\\/remote\\/' + rest
  })

  // 2) Tautan gift-registry -> '#'
  text = text.replace(GIFT_RE, '#')

  // 3) Heading brand byattari -> '#'
  text = text.replace(/href="https:\/\/byattari\.com\/"/g, 'href="#"')

  // 4) Teks footer email -> netral
  text = text.replace(/>attarivitation\.com</g, '>Undangan Digital<')

  // 5) Sisa param origin/forigin yang menyebut attarivitation.com
  text = text.replace(/&(amp;)?origin=[^&"]*/g, '')
  text = text.replace(/&(amp;)?forigin=[^&"]*/g, '')

  if (text !== original) {
    await writeFile(file, text)
    changedFiles++
  }
}

console.log(`files changed: ${changedFiles}`)
console.log(`unique assets to fetch: ${downloads.size}`)

let ok = 0
const failed = []
const entries = [...downloads.entries()]
for (let i = 0; i < entries.length; i += 6) {
  const batch = entries.slice(i, i + 6)
  await Promise.all(
    batch.map(async ([pathname, url]) => {
      const target = path.join(MIRROR, decodeURIComponent(pathname))
      if (await exists(target)) {
        ok++
        return
      }
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(60000) })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const buffer = Buffer.from(await res.arrayBuffer())
        await mkdir(path.dirname(target), { recursive: true })
        await writeFile(target, buffer)
        ok++
        console.log(`  ok   ${(buffer.length / 1024 / 1024).toFixed(2)} MB  ${pathname}`)
      } catch (error) {
        failed.push(`${url} -> ${error.message}`)
      }
    }),
  )
}

console.log(`downloaded/verified: ${ok}`)
if (failed.length) {
  console.log(`failed (${failed.length}):`)
  for (const item of failed) console.log('  ' + item)
}
