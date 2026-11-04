import fs from 'node:fs'
import path from 'node:path'

const root = 'public/templates'
const WIDGETS = [
  ['video', /elementor-widget-video/],
  ['gallery', /elementor-widget-gallery|e-gallery-item/],
  ['countdown', /elementor-widget-countdown/],
  ['maps', /elementor-widget-google_maps/],
  ['social', /elementor-social-icon/],
  ['form', /elementor-form/],
  ['timeline', /elementor-widget-timeline/],
  ['image-carousel', /elementor-widget-image-carousel/],
  ['slides', /elementor-widget-slides/],
  ['audio', /data-template-music|<audio/],
  ['lightbox', /elementor-widget-image\b/],
]
const RSVP_FIELDS = ['form_namalengkap', 'form_konfkehadiran', 'form_jumlahtamu', 'form_ucapan']

for (const d of fs.readdirSync(root)) {
  const f = path.join(root, d, 'html', 'rendered.html')
  if (!fs.existsSync(f)) continue
  const h = fs.readFileSync(f, 'utf8')

  // Heading titles -> kira-kira nama section
  const headings = [...new Set([...h.matchAll(/class="elementor-heading-title[^"]*"[^>]*>([^<]{2,60})</g)].map((m) => m[1].trim()))]

  const widgets = WIDGETS.filter(([, re]) => re.test(h)).map(([n]) => n)
  const rsvp = RSVP_FIELDS.filter((x) => h.includes(x))

  console.log('###', d)
  console.log('  widgets:', widgets.join(', ') || '(none)')
  console.log('  rsvp-fields:', rsvp.join(', ') || '(none)')
  console.log('  headings:', headings.slice(0, 40).join(' | ') || '(none)')
}
