const HERITAGE_UTARY_FIELDS = [
  'bride_name', 'bride_nick', 'bride_photo', 'bride_father', 'bride_mother', 'bride_ig',
  'groom_name', 'groom_nick', 'groom_photo', 'groom_father', 'groom_mother', 'groom_ig',
  'akad_date', 'akad_time', 'akad_location', 'reception_date', 'reception_time', 'reception_location',
  'address', 'maps_url', 'dress_code', 'love_story', 'quote', 'video_url', 'gallery',
  'gift_bank_name', 'gift_account_number', 'gift_account_holder', 'gift_address', 'gift_recipient', 'gift_wa',
  'cover_message', 'cover_photo', 'feature_photo', 'gift_photo',
]

export function getSupportedTemplateFields(html: string, templateSlug: string): Set<string> {
  const fields = new Set<string>([
    ...Array.from(html.matchAll(/data-template-field="([^"]+)"/g), (match) => match[1]),
    ...Array.from(html.matchAll(/data-template-image="([^"]+)"/g), (match) => match[1]),
    ...Array.from(html.matchAll(/data-template-href="([^"]+)"/g), (match) => match[1]),
  ])

  if (html.includes('data-template-couple')) {
    fields.add('bride_name')
    fields.add('groom_name')
  }
  if (html.includes('data-template-gallery')) fields.add('gallery')
  if (html.includes('data-template-music')) fields.add('music_url')
  if (fields.has('bride_parents')) {
    fields.add('bride_father')
    fields.add('bride_mother')
  }
  if (fields.has('groom_parents')) {
    fields.add('groom_father')
    fields.add('groom_mother')
  }
  if (templateSlug === 'heritage-utary') HERITAGE_UTARY_FIELDS.forEach((field) => fields.add(field))
  return fields
}
