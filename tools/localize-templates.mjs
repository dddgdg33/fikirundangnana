// Localize scraped invitation templates: rewrite every https://attarivitation.com/... asset
// reference inside public/templates/<slug>/html/rendered.html and public/templates/<slug>/css/*.css
// to the local files that were captured in the per-template manifest.json.
//   node tools/localize-templates.mjs
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve('public/templates')

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const slugs = fs
  .readdirSync(ROOT, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((slug) => fs.existsSync(path.join(ROOT, slug, 'manifest.json')))

let grandRemaining = 0

for (const slug of slugs) {
  const dir = path.join(ROOT, slug)
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'))
  const resources = manifest.resources ?? []

  // Map: "origin + pathname" (query stripped) -> local web path served from /templates/<slug>/...
  const map = new Map()
  for (const resource of resources) {
    if (!resource.url || !resource.file) continue
    if (!/^https?:\/\//i.test(resource.url)) continue // skip blob:, data:, etc.
    const localFile = String(resource.file).replace(/\\/g, '/')
    if (!fs.existsSync(path.join(dir, localFile))) continue
    let parsed
    try {
      parsed = new URL(resource.url)
    } catch {
      continue
    }
    const key = parsed.origin + parsed.pathname
    if (!map.has(key)) map.set(key, `/templates/${slug}/${localFile}`)
  }

  const keys = [...map.keys()].sort((a, b) => b.length - a.length)
  const master = new RegExp(`(${keys.map(escapeRegExp).join('|')})(\\?[^"'\\s<>()\\\\]*)?`, 'g')

  const rewrite = (text) => {
    // 1. unescape JSON-escaped slashes inside attarivitation URLs (data-settings / inline scripts)
    text = text.replace(/https?:\\\/\\\/attarivitation\.com[^\s"']*/g, (match) => match.replace(/\\\//g, '/'))
    // 2. replace known manifest URLs (with or without query string) with local paths
    text = text.replace(master, (_full, key) => map.get(key))
    // 3. fallback: any remaining uploads/fonts referenced by basename in local asset folders
    text = text.replace(/https?:\/\/attarivitation\.com\/[^"'\s<>()\\]*/g, (full) => {
      const clean = full.split('#')[0].split('?')[0]
      const base = clean.split('/').pop()
      if (!base) return full
      for (const sub of ['images', 'fonts', 'icons', 'videos']) {
        const folder = path.join(dir, sub)
        if (!fs.existsSync(folder)) continue
        const hit = fs.readdirSync(folder).find((name) => name.toLowerCase() === base.toLowerCase())
        if (hit) return `/templates/${slug}/${sub}/${hit}`
      }
      return full
    })
    return text
  }

  const targets = []
  const htmlPath = path.join(dir, 'html/rendered.html')
  if (fs.existsSync(htmlPath)) targets.push(htmlPath)
  const cssDir = path.join(dir, 'css')
  if (fs.existsSync(cssDir)) {
    for (const name of fs.readdirSync(cssDir)) if (name.endsWith('.css')) targets.push(path.join(cssDir, name))
  }

  const remaining = []
  for (const target of targets) {
    const before = fs.readFileSync(target, 'utf8')
    const after = rewrite(before)
    if (after !== before) fs.writeFileSync(target, after)
    const left = [...after.matchAll(/https?:\/\/attarivitation\.com[^"'\s<>()\\]*/g)].map((m) => m[0])
    if (left.length) {
      remaining.push({ file: path.relative(ROOT, target), count: left.length, sample: [...new Set(left)].slice(0, 6) })
    }
  }

  console.log(`\n=== ${slug} (${map.size} urls mapped) ===`)
  if (!remaining.length) console.log('  OK: no attarivitation.com left in rendered.html/css')
  else for (const item of remaining) console.log(`  LEFT ${item.count} in ${item.file}\n       ${JSON.stringify(item.sample)}`)
  grandRemaining += remaining.reduce((sum, item) => sum + item.count, 0)
}

console.log(`\nTOTAL remaining attarivitation.com references in rendered.html + css: ${grandRemaining}`)
