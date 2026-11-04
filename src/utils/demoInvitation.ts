import type { Event } from '@/types'

const STORAGE_PREFIX = 'attarivitation:demo-invitation:'

export const DEMO_INVITATION_FIELDS = [
  'bride_name',
  'bride_nick',
  'bride_photo',
  'bride_father',
  'bride_mother',
  'bride_ig',
  'groom_name',
  'groom_nick',
  'groom_photo',
  'groom_father',
  'groom_mother',
  'groom_ig',
  'akad_date',
  'akad_time',
  'akad_location',
  'reception_date',
  'reception_time',
  'reception_location',
  'address',
  'maps_url',
  'dress_code',
  'love_story',
  'quote',
  'video_url',
  'music_url',
  'gallery',
  'gift_bank_name',
  'gift_account_number',
  'gift_account_holder',
  'gift_address',
  'gift_recipient',
  'gift_wa',
] as const satisfies readonly (keyof Event)[]

export type DemoInvitationField = (typeof DEMO_INVITATION_FIELDS)[number]
export const DEMO_TEMPLATE_TEXT_FIELDS = ['cover_message'] as const
export type DemoTemplateTextField = (typeof DEMO_TEMPLATE_TEXT_FIELDS)[number]
export const DEMO_TEMPLATE_IMAGE_FIELDS = ['cover_photo', 'feature_photo', 'gift_photo'] as const
export type DemoTemplateImageField = (typeof DEMO_TEMPLATE_IMAGE_FIELDS)[number]
export type DemoInvitationOverrides = Partial<Pick<Event, DemoInvitationField>> & Partial<Record<DemoTemplateTextField | DemoTemplateImageField, string>>

const DEMO_TEMPLATE_TEXT_DEFAULTS: Record<DemoTemplateTextField, string> = {
  cover_message: '“Semoga Allah memberikan berkah kepadamu, I am who I am because of you. You are every reason, every hope and every dream. I’ve ever had and no matter what happens to us in the future, every day we are together is the greatest day of my life. I will always be yours.”',
}

const DEMO_TEMPLATE_IMAGE_DEFAULTS: Record<string, Partial<Record<DemoTemplateImageField, string>>> = {
  'heritage-utary': {
    cover_photo: '/templates/heritage-utary/images/Utary.jpg',
    feature_photo: '/templates/heritage-utary/images/Utary.jpg',
    gift_photo: '/templates/heritage-utary/images/Utary-14.webp',
  },
  'heritage-sandhayu': {
    cover_photo: '/templates/heritage-sandhayu/images/Bagas-Naila-LIBLOP-PICTURE-2630245.webp',
    feature_photo: '/templates/heritage-sandhayu/images/Heritage-Sandhayu-IMG_6435-1-e1771656736942.webp',
    gift_photo: '/templates/heritage-sandhayu/images/Heritage-Sandhayu-IMG_6438.webp',
  },
}
const ALL_DEMO_FIELDS = [...DEMO_INVITATION_FIELDS, ...DEMO_TEMPLATE_TEXT_FIELDS, ...DEMO_TEMPLATE_IMAGE_FIELDS] as const

export function createDemoInvitationEvent(slug: string): Event {
  const today = new Date()
  const isSandhayu = slug.replace(/^demo-/, '') === 'heritage-sandhayu'
  const dateAfterDays = (days: number) => {
    const date = new Date(today)
    date.setDate(date.getDate() + days)
    return date.toISOString().slice(0, 10)
  }

  return {
    id: '00000000-0000-0000-0000-000000000000',
    slug,
    title: 'Demo Undangan',
    template_id: slug.replace(/^demo-/, ''),
    status: 'published',
    bride_name: 'Nadia Amelia',
    groom_name: 'Rangga Prasetya',
    bride_nick: 'Nadia',
    groom_nick: 'Rangga',
    bride_photo: isSandhayu
      ? '/templates/heritage-sandhayu/images/Heritage-Sandhayu-IMG_6436.webp'
      : slug.replace(/^demo-/, '') === 'heritage-utary'
      ? '/templates/heritage-utary/images/DSC_2580.jpg'
      : '/templates/heritage-aruna/images/Utary-Bride-Groom-CPP-1-e1763011874777.webp',
    groom_photo: isSandhayu
      ? '/templates/heritage-sandhayu/images/Heritage-Sandhayu-IMG_6437.webp'
      : slug.replace(/^demo-/, '') === 'heritage-utary'
      ? '/templates/heritage-utary/images/DSC_2587.jpg'
      : '/templates/heritage-aruna/images/Utary-Bride-Groom-CPW-1-e1762934239256.webp',
    bride_father: 'Bapak Ahmad',
    bride_mother: 'Ibu Sari',
    groom_father: 'Bapak Dedi',
    groom_mother: 'Ibu Lina',
    bride_ig: 'nadiaamelia',
    groom_ig: 'rangga.pras',
    akad_date: dateAfterDays(45),
    akad_time: '08:00',
    akad_location: 'Masjid Agung Demo',
    reception_date: dateAfterDays(45),
    reception_time: '11:00',
    reception_location: 'Pendopo Demo',
    address: 'Jl. Demo No. 1, Kota Contoh',
    maps_url: 'https://maps.google.com',
    dress_code: 'Motif batik',
    love_story: '2019\nPertama bertemu saat kuliah.\n\n2022\nMulai berpacangan.\n\n2025\nLamaran di rumah keluarga.',
    prewedding_photos: isSandhayu
      ? ['/templates/heritage-sandhayu/images/Heritage-Sandhayu-IMG_6436.webp']
      : slug.replace(/^demo-/, '') === 'heritage-utary'
      ? [
          '/templates/heritage-utary/images/Utary.jpg',
          '/templates/heritage-utary/images/DSC_2610.jpg',
        ]
      : [
          '/templates/heritage-aruna/images/Aruna-Home-Fallback.webp',
          '/templates/heritage-aruna/images/Aruna-Group-Floral-3-HD.webp',
        ],
    gallery: isSandhayu
      ? [
          '/templates/heritage-sandhayu/images/Heritage-Sandhayu-IMG_6435-1-e1771656736942.webp',
          '/templates/heritage-sandhayu/images/Heritage-Sandhayu-IMG_6438.webp',
          '/templates/heritage-sandhayu/images/Heritage-Sandhayu-IMG_6437.webp',
          '/templates/heritage-sandhayu/images/Heritage-Sandhayu-IMG_6436.webp',
          '/templates/heritage-sandhayu/images/Heritage-Sandhayu-IMG_6442.webp',
        ]
      : slug.replace(/^demo-/, '') === 'heritage-utary'
      ? [
          '/templates/heritage-utary/images/DSC_2580.jpg',
          '/templates/heritage-utary/images/DSC_2587.jpg',
          '/templates/heritage-utary/images/DSC_2610.jpg',
          '/templates/heritage-utary/images/DSC_2640.jpg',
          '/templates/heritage-utary/images/DSC_2670.jpg',
        ]
      : [
          '/templates/heritage-aruna/images/Utary-Bride-Groom-03-e1763374114498.webp',
          '/templates/heritage-aruna/images/Aruna-Home-Fallback.webp',
          '/templates/heritage-aruna/images/Aruna-Group-Floral-3-HD.webp',
        ],
    video_url: '',
    music_url: '',
    quote: '“Dan segala sesuatu Kami ciptakan berpasang-pasangan agar kamu mengingat (kebesaran Allah)”\nQS. Adz-Dzariyat : 49',
    gift_bank_name: 'BCA',
    gift_account_number: '0123456789',
    gift_account_holder: 'Nadia Amelia',
    gift_address: 'Jl. Demo No. 1, Kota Contoh',
    gift_recipient: 'Nadia',
    gift_wa: '6281234567890',
    created_at: today.toISOString(),
    updated_at: today.toISOString(),
  }
}

export function getDemoInvitationOverrides(slug: string): DemoInvitationOverrides {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}${slug}`) ?? 'null')
    if (!stored || typeof stored !== 'object') return {}

    const storedValues = stored as Record<string, unknown>
    const values: Record<string, unknown> = {}
    for (const field of ALL_DEMO_FIELDS) {
      const value = storedValues[field]
      if (field === 'gallery' && Array.isArray(value) && value.every((item) => typeof item === 'string')) {
        values[field] = value
      } else if (typeof value === 'string') {
        values[field] = value
      }
    }
    return values as DemoInvitationOverrides
  } catch {
    return {}
  }
}

export function getDemoInvitationDefaults(slug: string): DemoInvitationOverrides {
  const event = createDemoInvitationEvent(slug)
  const templateDefaults = DEMO_TEMPLATE_IMAGE_DEFAULTS[event.template_id] ?? {}
  return Object.fromEntries(
    ALL_DEMO_FIELDS.map((field) => [
      field,
      field in templateDefaults
        ? templateDefaults[field as DemoTemplateImageField]
        : field in DEMO_TEMPLATE_TEXT_DEFAULTS
          ? DEMO_TEMPLATE_TEXT_DEFAULTS[field as DemoTemplateTextField]
        : event[field as DemoInvitationField] ?? '',
    ]),
  ) as DemoInvitationOverrides
}

export function getDemoInvitationDraft(slug: string): DemoInvitationOverrides {
  const defaults = getDemoInvitationDefaults(slug)
  const overrides = getDemoInvitationOverrides(slug)
  return { ...defaults, ...overrides }
}

export function saveDemoInvitationOverrides(slug: string, overrides: DemoInvitationOverrides) {
  const values: Record<string, unknown> = {}
  for (const field of ALL_DEMO_FIELDS) {
    const value = overrides[field as keyof DemoInvitationOverrides]
    if (field === 'gallery' && Array.isArray(value)) {
      values[field] = value.filter((item): item is string => typeof item === 'string').slice(0, 10)
    } else if (typeof value === 'string' && value.trim()) {
      values[field] = value.trim()
    }
  }
  const serialized = JSON.stringify(values)
  if (new Blob([serialized]).size > 4 * 1024 * 1024) {
    throw new Error('Total ukuran gambar terlalu besar. Kurangi jumlah atau ukuran gambar.')
  }
  localStorage.setItem(`${STORAGE_PREFIX}${slug}`, serialized)
}
