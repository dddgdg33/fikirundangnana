import fs from 'node:fs'

const files = [
  'public/templates/heritage-aruna/js/m_root_base.bin',
  'public/templates/heritage-aruna/js/m_r78Drb.bin',
  'public/templates/heritage-aruna/js/m_Nuilue.bin',
  'public/templates/heritage-aruna/js/js.bin',
  'public/templates/heritage-aruna/other/next.bin',
  'public/templates/heritage-aruna/other/player.bin',
  'public/templates/heritage-aruna/other/resolve_url.bin',
  'public/templates/heritage-aruna/other/id.bin',
  'public/templates/heritage-aruna/other/log_event.bin',
  'public/templates/heritage-aruna/js/base.js',
]

for (const f of files) {
  try {
    const s = fs.readFileSync(f, 'utf8')
    console.log(`\n===== ${f} (${(s.length / 1024).toFixed(0)} KB)`)
    console.log(JSON.stringify(s.slice(0, 260)))
  } catch (e) {
    console.log(`\n===== ${f} :: ERROR ${e.message}`)
  }
}
