import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ExternalLink, Save } from 'lucide-react'
import EventWorkspaceLayout from '@/components/layout/EventWorkspaceLayout'
import { supabase } from '@/lib/supabase'
import type { Event, EventTemplate } from '@/types'

/**
 * Registry internal invitation-engine (sumber nama + preview).
 * Tabel event_templates di DB tetap sumber kebenaran UUID/slug/active.
 */
export const TEMPLATE_REGISTRY_ENTRIES: {
  slug: string
  name: string
  category: 'heritage' | 'premium'
  preview: string
  themeBadge?: string
  colorAccent?: string
}[] = [
  { slug: 'heritage-aruna', name: 'Heritage Aruna', category: 'heritage', preview: '/templates/heritage-aruna/screenshots/thumb.jpg', themeBadge: 'Javanese Royal Green', colorAccent: '#1b4332' },
  { slug: 'heritage-sandhayu', name: 'Heritage Sandhayu', category: 'heritage', preview: '/templates/heritage-sandhayu/screenshots/thumb.jpg', themeBadge: 'Classic Sogan Gold', colorAccent: '#b45309' },
  { slug: 'heritage-utary', name: 'Heritage Utary', category: 'heritage', preview: '/templates/heritage-utary/screenshots/thumb.jpg', themeBadge: 'Royal Maroon & Gold', colorAccent: '#800020' },
  { slug: 'premium-01', name: 'Premium 01', category: 'premium', preview: '/templates/premium-01/screenshots/thumb.jpg', themeBadge: 'Midnight Champagne Gold', colorAccent: '#d4af37' },
  { slug: 'premium-02', name: 'Premium 02', category: 'premium', preview: '/templates/premium-02/screenshots/thumb.jpg', themeBadge: 'Sapphire & Electric Sky', colorAccent: '#0284c7' },
  { slug: 'premium-danila', name: 'Premium Danila', category: 'premium', preview: '/templates/premium-danila/screenshots/thumb.jpg', themeBadge: 'Warm Terracotta & Boho', colorAccent: '#ea580c' },
  { slug: 'premium-flara', name: 'Premium Flara', category: 'premium', preview: '/templates/premium-flara/screenshots/thumb.jpg', themeBadge: 'Blush Rose & Pastel Pink', colorAccent: '#e11d48' },
  { slug: 'premium-ivanna', name: 'Premium Ivanna', category: 'premium', preview: '/templates/premium-ivanna/screenshots/thumb.jpg', themeBadge: 'Emerald Royal & Gold', colorAccent: '#059669' },
  { slug: 'premium-kila', name: 'Premium Kila', category: 'premium', preview: '/templates/premium-kila/screenshots/thumb.jpg', themeBadge: 'Editorial Modern Chic', colorAccent: '#78716c' },
]

export default function TemplatePublish() {
  const { id } = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [templates, setTemplates] = useState<EventTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [templateId, setTemplateId] = useState('')
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (id) fetchEvent()
  }, [id])

  const fetchEvent = async () => {
    try {
      const [{ data: evData, error: evError }, { data: tplData, error: tplError }] = await Promise.all([
        supabase.from('events').select('*').eq('id', id).single(),
        supabase.from('event_templates').select('*').order('category', { ascending: true }),
      ])
      if (evError) throw evError
      if (tplError) console.warn('event_templates fetch:', tplError.message)
      setEvent(evData)
      if (!tplData || tplData.length === 0) {
        setTemplates(TEMPLATE_REGISTRY_ENTRIES.map((r, idx) => ({
          id: `fallback-${idx}`,
          slug: r.slug,
          name: r.name,
          category: r.category,
          preview_image: r.preview,
          active: true,
          updated_at: new Date().toISOString(),
        })) as EventTemplate[])
      } else {
        setTemplates(tplData)
      }
      setTemplateId(evData.template_id || '')
      setStatus((evData.status as 'draft' | 'published' | 'archived') || 'draft')
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (overrideStatus?: 'draft' | 'published' | 'archived') => {
    if (!event) return
    setSaving(true)
    setErrorMessage('')
    setSuccessMessage('')
    const nextStatus = overrideStatus ?? status
    try {
      const updateData: Record<string, unknown> = { template_id: templateId || null, status: nextStatus }
      if (nextStatus === 'published' && event.status !== 'published') {
        updateData.published_at = new Date().toISOString()
      }
      const { error } = await supabase.from('events').update(updateData).eq('id', id)
      if (error) throw error
      if (overrideStatus) setStatus(overrideStatus)
      setSuccessMessage(
        nextStatus === 'published'
          ? 'Undangan berhasil dipublikasikan! URL undangan sudah bisa diakses publik.'
          : 'Perubahan berhasil disimpan.',
      )
      await fetchEvent()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Gagal menyimpan perubahan.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <EventWorkspaceLayout>
        <div className="flex justify-center py-12">Memuat data...</div>
      </EventWorkspaceLayout>
    )
  }

  return (
    <EventWorkspaceLayout>
      <div className="space-y-6">
        {errorMessage && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{errorMessage}</p>}
        {successMessage && <p role="status" className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">{successMessage}</p>}

        <div className="flex flex-wrap justify-between items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Template &amp; Publikasi</h1>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                event?.status === 'published' ? 'bg-green-100 text-green-800'
                : event?.status === 'archived' ? 'bg-gray-100 text-gray-600'
                : 'bg-yellow-100 text-yellow-800'
              }`}>
                {event?.status === 'published' ? '● Published' : event?.status === 'archived' ? '● Archived' : '● Draft'}
              </span>
              <span className="text-sm text-gray-500">Status saat ini</span>
            </div>
          </div>
          <div className="flex gap-2">
            {event?.status !== 'published' && (
              <button
                type="button"
                onClick={() => void handleSave('published')}
                disabled={saving}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
              >
                🚀 Publish Sekarang
              </button>
            )}
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Pilih Template</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {templates
                .filter((t) => t.active)
                .map((t) => {
                  const meta = TEMPLATE_REGISTRY_ENTRIES.find((r) => r.slug === t.slug)
                  const selected = templateId === t.id
                  return (
                    <button
                      type="button"
                      key={t.id}
                      aria-pressed={selected}
                      onClick={() => setTemplateId(t.id)}
                      className={`w-full text-left border-2 rounded-lg p-4 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        selected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={t.preview_image || meta?.preview}
                        alt={t.name}
                        className="w-full aspect-[3/4] object-cover rounded mb-2"
                      />
                      <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: meta?.colorAccent || '#6366f1' }} />
                        <span className="text-xs text-gray-600 font-medium truncate">{meta?.themeBadge || `${t.category} Series`}</span>
                      </div>
                    </button>
                  )
                })}
              {templates.length === 0 && (
                <p className="text-sm text-gray-500 col-span-3">
                  Tabel event_templates belum berisi data. Jalankan seed templates terlebih dahulu.
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Status Publikasi</label>
            <div className="space-y-2">
              {(['draft', 'published', 'archived'] as const).map((s) => (
                <label key={s} className="flex items-center">
                  <input type="radio" name="status" checked={status === s} onChange={() => setStatus(s)} className="mr-2" />
                  <span className="text-sm">
                    {s === 'draft'
                      ? 'Draft - Hanya bisa dilihat oleh admin'
                      : s === 'published'
                        ? 'Published - Dapat diakses publik'
                        : 'Archived - Dinonaktifkan'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {event?.slug && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700 mb-2">URL Undangan Publik:</p>
              <div className="flex items-center space-x-2">
                <code className="flex-1 px-3 py-2 bg-white border rounded text-sm">
                  /undangan/{event.slug}
                </code>
                <a
                  href={`/undangan/${event.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center px-3 py-2 bg-white border rounded hover:bg-gray-50"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </EventWorkspaceLayout>
  )
}
