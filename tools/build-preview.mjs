// Build a self-viewable static preview of a scraped template for design comparison:
//   node tools/build-preview.mjs <templateId>
// Produces public/templates/<id>/preview.html + rewrites self-hosted wp-content
// references inside the captured css and the preview so fonts/images resolve locally.
import fs from 'node:fs'
import path from 'node:path'

const id = process.argv[2]
if (!id) {
  console.error('usage: node tools/build-preview.mjs <templateId>')
  process.exit(1)
}
const dir = path.resolve(`public/templates/${id}`)
const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'))
const resources = manifest.resources ?? []
let html = fs.readFileSync(path.join(dir, 'html/rendered.html'), 'utf8')

// 1. www->local for captured full URLs
for (const r of resources) {
  if (!r.url) continue
  const local = `/templates/${id}/${String(r.file).replace(/\\/g, '/')}`
  if (fs.existsSync(path.join(dir, String(r.file).replace(/\\/g, '/')))) {
    html = html.split(r.url).join(local)
  }
}

// 2. rewrite remaining /wp-content/uploads/... refs to local images/fonts folders
const matchLocal = (basename) => {
  for (const sp of ['fonts', 'images', 'videos', 'icons']) {
    const p = path.join(dir, sp)
    if (!fs.existsSync(p)) continue
    const hit = fs.readdirSync(p).find((f) => path.basename(basename).toLowerCase().includes(f.toLowerCase().slice(0, 14))) ?? null
    if (hit) return `/templates/${id}/${sp}/${hit}`
  }
  return null
}
for (const f of fs.readdirSync(path.join(dir, 'css')).filter((x) => x.endsWith('.css'))) {
  let css = fs.readFileSync(path.join(dir, 'css', f), 'utf8')
  const before = css
  css = css.replace(/\/wp-content\/uploads\/useanyfont\/([^)'"]+)/g, (_, b) => {
    assertFont(b)
    return `/templates/${id}/fonts/${b}`
  })
  css = css.replace(/\/wp-content\/uploads\/(\d{4}\/\d{2}\/[^)'"]+\.(?:webp|jpg|jpeg|png))/g, (_, b) => {
    const local = matchLocal(b)
    return local ?? _
  })
  if (css !== before) fs.writeFileSync(path.join(dir, 'css', f), css)
}
function assertFont(b) {
  return fs.existsSync(path.join(dir, 'fonts', b))
}

html = html.replace(/\/wp-content\/uploads\/useanyfont\/([^)'" ]+)/g, '/templates/' + id + '/fonts/$1')
html = html.replace(/\/wp-content\/uploads\/(\d{4}\/\d{2}\/[^)'" ]+\.(?:webp|jpg|jpeg|png))/g, (full, b) => matchLocal(b) ?? full)
html = html.replace(/<script\b[\s\S]*?<\/script>/gi, '')
fs.writeFileSync(path.join(dir, 'preview.html'), html)
console.log(`${id}: preview.html written (${resources.length} resources)`)
