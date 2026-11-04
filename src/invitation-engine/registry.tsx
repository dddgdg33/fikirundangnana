import { lazy, type ComponentType } from 'react'
import type { InvitationTemplateProps, TemplateMeta } from './types'

interface TemplateEntry extends TemplateMeta {
  /** Lazy loader agar tiap template menjadi chunk terpisah dan hanya dimuat saat dipakai. */
  load: () => Promise<{ default: ComponentType<InvitationTemplateProps> }>
}

export const TEMPLATES: TemplateEntry[] = [
  {
    id: 'heritage-aruna',
    name: 'Heritage Aruna',
    category: 'heritage',
    preview: '/templates/heritage-aruna/screenshots/thumb.jpg',
    active: true,
    description: 'Desain klasik Jawa dengan palet hijau tua botol, aksen emas keraton, dan ornamen batik tradisional yang anggun.',
    themeBadge: 'Javanese Royal Green',
    colorAccent: '#1b4332',
    load: () => import('./templates/heritage/HeritageAruna'),
  },
  {
    id: 'heritage-sandhayu',
    name: 'Heritage Sandhayu',
    category: 'heritage',
    preview: '/templates/heritage-sandhayu/screenshots/thumb.jpg',
    active: true,
    description: 'Nuansa heritage Jawa klasik bernuansa cokelat hangat, motif batik sogan, dan tipografi kaligrafi klasik.',
    themeBadge: 'Classic Sogan Gold',
    colorAccent: '#b45309',
    load: () => import('./templates/heritage/HeritageSandhayu'),
  },
  {
    id: 'heritage-utary',
    name: 'Heritage Utary',
    category: 'heritage',
    preview: '/templates/heritage-utary/screenshots/thumb.jpg',
    active: true,
    description: 'Kemewahan marun kerajaan dengan sulur emas halus, kartu suvenir eksklusif, dan ornamen berkelas ningrat.',
    themeBadge: 'Royal Maroon & Gold',
    colorAccent: '#800020',
    load: () => import('./templates/heritage/HeritageUtary'),
  },
  {
    id: 'premium-01',
    name: 'Premium 01',
    category: 'premium',
    preview: '/templates/premium-01/screenshots/thumb.jpg',
    active: true,
    description: 'Palet Midnight Gold & Champagne dengan latar gelap eksklusif, ornamen emas berkilau, dan tipografi serif mewah.',
    themeBadge: 'Midnight Champagne Gold',
    colorAccent: '#d4af37',
    load: () => import('./templates/premium/Premium01'),
  },
  {
    id: 'premium-02',
    name: 'Premium 02',
    category: 'premium',
    preview: '/templates/premium-02/screenshots/thumb.jpg',
    active: true,
    description: 'Nuansa Sapphire Blue & Electric Sky dengan latar gelap modern, kartu translusen elegan, dan aksen neon berkelas.',
    themeBadge: 'Sapphire & Electric Sky',
    colorAccent: '#0284c7',
    load: () => import('./templates/premium/Premium02'),
  },
  {
    id: 'premium-danila',
    name: 'Premium Danila',
    category: 'premium',
    preview: '/templates/premium-danila/screenshots/thumb.jpg',
    active: true,
    description: 'Warm Terracotta & Botanical Boho dengan nuansa krem hangat, ornamen floral earthy, dan aksen tembaga anggun.',
    themeBadge: 'Warm Terracotta & Boho',
    colorAccent: '#ea580c',
    load: () => import('./templates/premium/PremiumDanila'),
  },
  {
    id: 'premium-flara',
    name: 'Premium Flara',
    category: 'premium',
    preview: '/templates/premium-flara/screenshots/thumb.jpg',
    active: true,
    description: 'Blush Floral Romance bernuansa mawar lembut, pink pastel feminin, dan sentuhan ruby memikat.',
    themeBadge: 'Blush Rose & Pastel Pink',
    colorAccent: '#e11d48',
    load: () => import('./templates/premium/PremiumFlara'),
  },
  {
    id: 'premium-ivanna',
    name: 'Premium Ivanna',
    category: 'premium',
    preview: '/templates/premium-ivanna/screenshots/thumb.jpg',
    active: true,
    description: 'Emerald Royal Majesty dengan latar zamrud tua mendalam, aksen emas royal, dan ornamen istana megah.',
    themeBadge: 'Emerald Royal & Gold',
    colorAccent: '#059669',
    load: () => import('./templates/premium/PremiumIvanna'),
  },
  {
    id: 'premium-kila',
    name: 'Premium Kila',
    category: 'premium',
    preview: '/templates/premium-kila/screenshots/thumb.jpg',
    active: true,
    description: 'Editorial Minimalist Chic berlatar monokrom hangat, tipografi modern proporsional, dan estetika majalah kontemporer.',
    themeBadge: 'Editorial Modern Chic',
    colorAccent: '#78716c',
    load: () => import('./templates/premium/PremiumKila'),
  },
]

/** Cache komponen lazy agar identitas komponen stabil antar render (menghindari remount). */
const templateCache = new Map<string, ComponentType<InvitationTemplateProps>>()

export function getTemplateMeta(templateId: string): TemplateMeta | undefined {
  return TEMPLATES.find((t) => t.id === templateId)
}

/**
 * Ambil komponen template berdasarkan ID slug (mis. 'heritage-aruna').
 * Komponen dimuat lazy sehingga bundel awal tidak membawa seluruh template.
 * Selalu mengembalikan komponen yang informatif — halaman publik tidak pernah crash.
 */
export function getTemplate(templateId: string): ComponentType<InvitationTemplateProps> {
  const entry = TEMPLATES.find((t) => t.id === templateId)
  if (!entry) return UnknownTemplate

  let component = templateCache.get(entry.id)
  if (!component) {
    component = lazy(entry.load)
    templateCache.set(entry.id, component)
  }
  return component
}

function UnknownTemplate({ event }: InvitationTemplateProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: 'Georgia, serif',
        background: '#faf7f2',
        color: '#4a3f35',
        textAlign: 'center',
      }}
    >
      <div>
        <p style={{ fontSize: '2rem', letterSpacing: '0.2em' }}>THE WEDDING OF</p>
        <h1 style={{ fontWeight: 400, margin: '0.5rem 0 1rem' }}>
          {event.bride_name ?? ''} & {event.groom_name ?? ''}
        </h1>
        <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>
          {event.template_id
            ? `Template "${event.template_id}" belum tersedia. Silakan pilih template lain pada halaman Template & Publikasi.`
            : 'Template belum dipilih untuk event ini.'}
        </p>
        {event.status === 'published' && event.slug && (
          <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>
            Undangan {event.title} — /undangan/{event.slug}
          </p>
        )}
      </div>
    </div>
  )
}
