import { useEffect, useRef, useState } from 'react'
import { 
  Eye, Pencil, RotateCcw, Save, X, ExternalLink, 
  Upload, Image as ImageIcon, LoaderCircle, CheckCircle2,
  Heart, Calendar, BookOpen, Gift, Sparkles, Smartphone
} from 'lucide-react'
import AdminLayout from '@/components/layout/AdminLayout'
import { supabase } from '@/lib/supabase'
import type { EventTemplate } from '@/types'
import {
  getDemoInvitationDefaults,
  type DemoInvitationField,
  type DemoInvitationOverrides,
  type DemoTemplateImageField,
  type DemoTemplateTextField,
} from '@/utils/demoInvitation'
import { getSupportedTemplateFields } from '@/utils/templateCapabilities'
import { getTemplateMeta } from '@/invitation-engine/registry'

import { TEMPLATES } from '@/invitation-engine/registry'

type EditableTextField = Exclude<DemoInvitationField, 'bride_photo' | 'groom_photo' | 'gallery'> | DemoTemplateTextField

const fieldLabels: Record<EditableTextField, { label: string; placeholder?: string; type?: string }> = {
  bride_name: { label: 'Nama Lengkap Mempelai Wanita', placeholder: 'Contoh: Nadia Amelia, S.Ked' },
  bride_nick: { label: 'Nama Panggilan Mempelai Wanita', placeholder: 'Nadia' },
  bride_father: { label: 'Nama Ayah Mempelai Wanita', placeholder: 'Bapak Ahmad' },
  bride_mother: { label: 'Nama Ibu Mempelai Wanita', placeholder: 'Ibu Sari' },
  bride_ig: { label: 'Username Instagram Mempelai Wanita', placeholder: 'nadiaamelia' },
  groom_name: { label: 'Nama Lengkap Mempelai Pria', placeholder: 'Contoh: Rangga Prasetya, S.T.' },
  groom_nick: { label: 'Nama Panggilan Mempelai Pria', placeholder: 'Rangga' },
  groom_father: { label: 'Nama Ayah Mempelai Pria', placeholder: 'Bapak Dedi' },
  groom_mother: { label: 'Nama Ibu Mempelai Pria', placeholder: 'Ibu Lina' },
  groom_ig: { label: 'Username Instagram Mempelai Pria', placeholder: 'rangga.pras' },
  akad_date: { label: 'Tanggal Akad Nikah', type: 'date' },
  akad_time: { label: 'Waktu Akad Nikah', placeholder: '08:00 WIB' },
  akad_location: { label: 'Lokasi Akad Nikah', placeholder: 'Masjid Agung Al-Ikhlas' },
  reception_date: { label: 'Tanggal Resepsi', type: 'date' },
  reception_time: { label: 'Waktu Resepsi', placeholder: '11:00 - Selesai' },
  reception_location: { label: 'Lokasi Resepsi', placeholder: 'Ballroom Hotel Mulia' },
  address: { label: 'Alamat Acara Lengkap', placeholder: 'Jl. Jenderal Sudirman No. 10, Jakarta Pusat' },
  maps_url: { label: 'Tautan Google Maps', type: 'url', placeholder: 'https://maps.google.com/...' },
  dress_code: { label: 'Dress Code Tamu', placeholder: 'Batik / Formal Nuansa Earth Tone' },
  love_story: { label: 'Cerita Perjalanan Pasangan (Love Story)', placeholder: 'Kisah perjalanan cinta Anda...' },
  quote: { label: 'Kutipan / Ayat Suci', placeholder: 'Kutipan romantis atau ayat Al-Qur\'an / Alkitab...' },
  video_url: { label: 'Tautan Video (YouTube / Vimeo)', type: 'url', placeholder: 'https://youtube.com/watch?v=...' },
  music_url: { label: 'Tautan Audio Musik Latar (.mp3)', type: 'url', placeholder: 'https://domain.com/music.mp3' },
  cover_message: { label: 'Pesan Sambutan Cover Undangan', placeholder: 'Pesan manis untuk menyambut para tamu undangan...' },
  gift_bank_name: { label: 'Nama Bank / Dompet Digital', placeholder: 'BCA / Mandiri / GoPay' },
  gift_account_number: { label: 'Nomor Rekening / No. HP', placeholder: '1234567890' },
  gift_account_holder: { label: 'Nama Pemilik Rekening', placeholder: 'Nadia Amelia' },
  gift_address: { label: 'Alamat Kirim Hadiah Fisik', placeholder: 'Jl. Merdeka No. 45, Jakarta' },
  gift_recipient: { label: 'Nama Penerima Paket', placeholder: 'Nadia & Rangga' },
  gift_wa: { label: 'Nomor WhatsApp Konfirmasi Hadiah', placeholder: '6281234567890' },
}

interface TabConfig {
  id: string
  title: string
  icon: typeof Heart
  fields: EditableTextField[]
  images?: DemoTemplateImageField[]
}

const editorTabs: TabConfig[] = [
  {
    id: 'couple',
    title: 'Mempelai',
    icon: Heart,
    fields: [
      'bride_name', 'bride_nick', 'bride_father', 'bride_mother', 'bride_ig',
      'groom_name', 'groom_nick', 'groom_father', 'groom_mother', 'groom_ig',
    ],
  },
  {
    id: 'schedule',
    title: 'Akad & Resepsi',
    icon: Calendar,
    fields: [
      'akad_date', 'akad_time', 'akad_location',
      'reception_date', 'reception_time', 'reception_location',
      'address', 'maps_url', 'dress_code',
    ],
  },
  {
    id: 'story',
    title: 'Cerita & Media',
    icon: BookOpen,
    fields: ['cover_message', 'quote', 'love_story', 'video_url', 'music_url'],
    images: ['cover_photo', 'feature_photo'],
  },
  {
    id: 'gift',
    title: 'Amplop & Hadiah',
    icon: Gift,
    fields: ['gift_bank_name', 'gift_account_number', 'gift_account_holder', 'gift_address', 'gift_recipient', 'gift_wa'],
    images: ['gift_photo'],
  },
]

const templateImageLabels: Record<DemoTemplateImageField, string> = {
  cover_photo: 'Foto Cover Pembuka',
  feature_photo: 'Foto Banner Section Cerita',
  gift_photo: 'Foto Latar Wedding Gift',
}

async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('Pilih file gambar yang valid.')
  if (file.size > 10 * 1024 * 1024) throw new Error('Ukuran gambar maksimal 10 MB.')

  const image = await createImageBitmap(file)
  const scale = Math.min(1, 1600 / Math.max(image.width, image.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.width * scale))
  canvas.height = Math.max(1, Math.round(image.height * scale))
  canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height)
  image.close()

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error('Gagal memproses gambar.')), 'image/webp', 0.8)
  })
  return blob
}

async function uploadTemplateImage(templateSlug: string, field: string, image: Blob): Promise<string> {
  const path = `template-demos/${templateSlug}/${field}-${crypto.randomUUID()}.webp`
  const { data, error } = await supabase.storage
    .from('event-media')
    .upload(path, image, { cacheControl: '3600', contentType: 'image/webp' })
  if (error) throw error

  return supabase.storage.from('event-media').getPublicUrl(data.path).data.publicUrl
}

export default function Templates() {
  const [templates, setTemplates] = useState<EventTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [templateError, setTemplateError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'heritage' | 'premium'>('all')
  const [editingTemplate, setEditingTemplate] = useState<EventTemplate | null>(null)
  const [activeEditorTab, setActiveEditorTab] = useState<string>('couple')
  const [draft, setDraft] = useState<DemoInvitationOverrides>({})
  const [savedMessage, setSavedMessage] = useState('')
  const [imageError, setImageError] = useState('')
  const [processingImages, setProcessingImages] = useState(false)
  const [loadingDraft, setLoadingDraft] = useState(false)
  const [draftLoadFailed, setDraftLoadFailed] = useState(false)
  const [supportedFields, setSupportedFields] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const draftLoadId = useRef(0)
  const editorPreviewRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!editingTemplate) return
    editorPreviewRef.current?.contentWindow?.postMessage({
      type: 'template:demo-draft',
      slug: editingTemplate.slug,
      payload: draft,
    }, window.location.origin)
  }, [draft, editingTemplate])

  useEffect(() => {
    const loadTemplates = async () => {
      setLoadingTemplates(true)
      const { data, error } = await supabase
        .from('event_templates')
        .select('id,slug,name,category,preview_image,updated_at')
        .eq('active', true)
        .order('category', { ascending: true })

      if (error) setTemplateError(error.message)
      if (error || !data || data.length === 0) {
        setTemplates(TEMPLATES.map((t, idx) => ({
          id: `fallback-${idx}`,
          slug: t.id,
          name: t.name,
          category: t.category,
          preview_image: t.preview,
          active: true,
          updated_at: new Date().toISOString(),
        })) as EventTemplate[])
      } else {
        setTemplates(data as EventTemplate[])
      }
      setLoadingTemplates(false)
    }

    void loadTemplates()
  }, [])

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory)

  const openEditor = async (template: EventTemplate) => {
    const loadId = ++draftLoadId.current
    const slug = `demo-${template.slug}`
    
    setDraft(getDemoInvitationDefaults(slug))
    setSavedMessage('')
    setImageError('')
    setEditingTemplate(template)
    setActiveEditorTab('couple')
    setLoadingDraft(true)
    setDraftLoadFailed(false)
    setSupportedFields(new Set())

    try {
      const [templateResult, htmlResult] = await Promise.all([
        template.id.startsWith('fallback-') 
          ? Promise.resolve({ data: null, error: null })
          : supabase.from('event_templates').select('demo_data').eq('id', template.id).maybeSingle(),
        fetch(`/templates/${template.slug}/html/rendered.html?capabilities=${encodeURIComponent(template.updated_at || template.id)}`),
      ])

      if (loadId !== draftLoadId.current) return

      const { data, error } = templateResult
      if (error) {
        setImageError(`Gagal membaca data dari Supabase: ${error.message}`)
      } else if (data?.demo_data && typeof data.demo_data === 'object' && !Array.isArray(data.demo_data)) {
        setDraft((current) => ({ ...current, ...(data.demo_data as DemoInvitationOverrides) }))
      }

      if (htmlResult.ok) {
        const html = await htmlResult.text()
        setSupportedFields(getSupportedTemplateFields(html, template.slug))
      } else {
        const fallbackRes = await fetch('/templates/premium-01/html/rendered.html')
        if (fallbackRes.ok) {
          const html = await fallbackRes.text()
          setSupportedFields(getSupportedTemplateFields(html, 'premium-01'))
        }
      }
    } catch (error) {
      if (loadId === draftLoadId.current) {
        const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tidak terduga.'
        setImageError(`Gagal memuat editor: ${errorMessage}`)
      }
    } finally {
      if (loadId === draftLoadId.current) {
        setLoadingDraft(false)
      }
    }
  }

  const closeEditor = () => {
    draftLoadId.current += 1
    setEditingTemplate(null)
    setLoadingDraft(false)
  }

  const saveDraft = async () => {
    if (!editingTemplate || draftLoadFailed) return
    setSaving(true)
    setImageError('')
    try {
      const nextDraft: DemoInvitationOverrides = { ...draft }
      const imageFields = ['bride_photo', 'groom_photo', 'cover_photo', 'feature_photo', 'gift_photo'] as const
      for (const field of imageFields) {
        const value = nextDraft[field]
        if (typeof value === 'string' && value.startsWith('data:image/')) {
          const image = await (await fetch(value)).blob()
          nextDraft[field] = await uploadTemplateImage(editingTemplate.slug, field, image)
        }
      }
      if (Array.isArray(nextDraft.gallery)) {
        nextDraft.gallery = await Promise.all(nextDraft.gallery.map(async (value, index) => {
          if (!value.startsWith('data:image/')) return value
          const image = await (await fetch(value)).blob()
          return uploadTemplateImage(editingTemplate.slug, `gallery-${index + 1}`, image)
        }))
      }

      const { data, error } = await supabase
        .from('event_templates')
        .update({ demo_data: nextDraft, updated_at: new Date().toISOString() })
        .eq('id', editingTemplate.id)
        .select('id')
        .maybeSingle()
      if (error) throw error
      if (!data) throw new Error('Penyimpanan ditolak. Pastikan Anda memiliki hak akses admin.')

      setDraft(nextDraft)
      
      if (editorPreviewRef.current) {
        const currentSrc = editorPreviewRef.current.src
        const url = new URL(currentSrc)
        url.searchParams.set('t', Date.now().toString())
        editorPreviewRef.current.src = url.toString()
      }
      
      setSavedMessage(`Data contoh tema ${editingTemplate.name} berhasil disimpan!`)
      setEditingTemplate(null)
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'Gagal menyimpan perubahan.')
    } finally {
      setSaving(false)
    }
  }

  const resetDraft = () => {
    if (editingTemplate) setDraft(getDemoInvitationDefaults(`demo-${editingTemplate.slug}`))
    setImageError('')
  }

  const supportsField = (field: string) => supportedFields.has(field)

  const handlePhotoUpload = async (field: 'bride_photo' | 'groom_photo' | DemoTemplateImageField, file?: File) => {
    if (!file) return
    setImageError('')
    setProcessingImages(true)
    try {
      if (!editingTemplate) return
      const image = await compressImage(file)
      const photo = await uploadTemplateImage(editingTemplate.slug, field, image)
      setDraft((current) => ({ ...current, [field]: photo }))
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'Gagal memproses gambar.')
    } finally {
      setProcessingImages(false)
    }
  }

  const handleGalleryUpload = async (files: FileList | null) => {
    if (!files?.length) return
    const currentGallery = Array.isArray(draft.gallery) ? draft.gallery : []
    const remaining = Math.max(0, 10 - currentGallery.length)
    if (!remaining) {
      setImageError('Galeri demo maksimal 10 gambar.')
      return
    }

    setImageError('')
    setProcessingImages(true)
    try {
      if (!editingTemplate) return
      const selected = Array.from(files).slice(0, remaining)
      if (selected.some((file) => !file.type.startsWith('image/') || file.size > 10 * 1024 * 1024)) {
        throw new Error('Pilih gambar maksimal 10 MB per file.')
      }
      const uploaded = await Promise.all(selected.map(async (file, index) => {
        const image = await compressImage(file)
        return uploadTemplateImage(editingTemplate.slug, `gallery-${Date.now()}-${index + 1}`, image)
      }))
      setDraft((current) => ({
        ...current,
        gallery: [...(Array.isArray(current.gallery) ? current.gallery : []), ...uploaded].slice(0, 10),
      }))
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'Gagal memproses gambar.')
    } finally {
      setProcessingImages(false)
    }
  }

  const removeGalleryPhoto = (index: number) => {
    setDraft((current) => ({
      ...current,
      gallery: (Array.isArray(current.gallery) ? current.gallery : []).filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Template Undangan</h1>
            <p className="mt-1 text-sm text-slate-500">
              Katalog tema pernikahan responsif. Buka pratinjau langsung atau sesuaikan teks & foto contoh bawaan.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({templates.length})
            </button>
            <button
              onClick={() => setSelectedCategory('heritage')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                selectedCategory === 'heritage'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Heritage Series
            </button>
            <button
              onClick={() => setSelectedCategory('premium')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                selectedCategory === 'premium'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Premium Series
            </button>
          </div>
        </div>

        {savedMessage && (
          <div role="status" className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{savedMessage}</span>
            </span>
            <button type="button" onClick={() => setSavedMessage('')} className="text-emerald-500 hover:text-emerald-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {templateError && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            Gagal memuat katalog template: {templateError}
          </div>
        )}

        {/* Template Catalog Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => {
            const meta = getTemplateMeta(template.slug)
            const description = template.description || meta?.description || 'Template undangan digital dengan sentuhan desain elegan, animasi halus, dan dukungan musik, video, serta buku tamu.'
            const themeBadge = meta?.themeBadge || `${template.category === 'heritage' ? 'Heritage' : 'Premium'} Series`
            const colorAccent = meta?.colorAccent || (template.category === 'heritage' ? '#800020' : '#4f46e5')

            return (
              <div 
                key={template.slug} 
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden group">
                    <img
                      src={template.preview_image || meta?.preview || `/templates/${template.slug}/screenshots/thumb.jpg`}
                      alt={template.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement
                        if (!img.dataset.fallbackApplied) {
                          img.dataset.fallbackApplied = '1'
                          img.src = `/templates/${template.slug}/screenshots/thumb.jpg`
                        }
                      }}
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/85 text-white backdrop-blur-xs text-[11px] font-semibold shadow-xs">
                      <span className="w-2 h-2 rounded-full ring-1 ring-white/40" style={{ backgroundColor: colorAccent }} />
                      <span>{themeBadge}</span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-bold text-slate-900">{template.name}</h2>
                      <span className="text-xs font-mono text-slate-400">/{template.slug}</span>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {description}
                    </p>
                  </div>
                </div>

              <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 mt-2 flex items-center gap-2">
                <a
                  href={`/undangan/demo-${template.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span>Pratinjau</span>
                </a>
                <button
                  type="button"
                  onClick={() => void openEditor(template)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-2xs"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Contoh</span>
                </button>
              </div>
            </div>
          )
        })}
        </div>

        {loadingTemplates && (
          <div className="py-16 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <LoaderCircle className="w-5 h-5 animate-spin text-indigo-600" />
            <span>Memuat katalog template...</span>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {editingTemplate && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6" 
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEditor()
          }}
        >
          <section 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="demo-editor-title" 
            className="flex h-[92vh] w-full max-w-7xl flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
          >
            {/* Modal Header */}
            <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 id="demo-editor-title" className="text-base font-bold text-slate-900">
                    Edit Data Contoh: {editingTemplate.name}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Perubahan disimpan ke Supabase dan langsung tampil pada pratinjau demo publik template ini.
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={closeEditor} 
                disabled={saving} 
                aria-label="Tutup editor" 
                className="rounded-lg p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            {/* Modal Body: Two-Column Form & Real-Time Preview */}
            <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(380px,.9fr)] overflow-hidden">
              {/* Left Column: Form & Tabs */}
              <div className="flex flex-col h-full border-r border-slate-200 overflow-hidden">
                {/* Tab Navigation */}
                <div className="flex items-center border-b border-slate-200 px-4 bg-white overflow-x-auto shrink-0 gap-1">
                  {editorTabs.map((tab) => {
                    const isActive = activeEditorTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveEditorTab(tab.id)}
                        className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                          isActive
                            ? 'border-indigo-600 text-indigo-700 bg-indigo-50/30'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <tab.icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <span>{tab.title}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Form Fields Content */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                  {imageError && (
                    <div role="alert" className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                      <span>{imageError}</span>
                      {draftLoadFailed && (
                        <button type="button" onClick={() => void openEditor(editingTemplate)} className="font-semibold underline">
                          Muat ulang
                        </button>
                      )}
                    </div>
                  )}

                  {loadingDraft ? (
                    <div className="py-16 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <LoaderCircle className="w-4 h-4 animate-spin text-indigo-600" />
                      <span>Memuat data contoh template...</span>
                    </div>
                  ) : (
                    <>
                      {/* Tab 1: Mempelai */}
                      {activeEditorTab === 'couple' && (
                        <div className="space-y-6">
                          {/* Couple Photos */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                            {supportsField('bride_photo') && (
                              <div className="space-y-2">
                                <span className="block text-xs font-semibold text-slate-700">Foto Mempelai Wanita</span>
                                <div className="flex items-center gap-3">
                                  <div className="w-16 h-16 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden shrink-0">
                                    {draft.bride_photo ? (
                                      <img src={draft.bride_photo} alt="Foto Mempelai Wanita" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-slate-400"><ImageIcon className="w-5 h-5" /></div>
                                    )}
                                  </div>
                                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors">
                                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Ganti Foto</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      disabled={processingImages || loadingDraft}
                                      onChange={(e) => void handlePhotoUpload('bride_photo', e.currentTarget.files?.[0])}
                                      className="sr-only"
                                    />
                                  </label>
                                </div>
                              </div>
                            )}

                            {supportsField('groom_photo') && (
                              <div className="space-y-2">
                                <span className="block text-xs font-semibold text-slate-700">Foto Mempelai Pria</span>
                                <div className="flex items-center gap-3">
                                  <div className="w-16 h-16 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden shrink-0">
                                    {draft.groom_photo ? (
                                      <img src={draft.groom_photo} alt="Foto Mempelai Pria" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-slate-400"><ImageIcon className="w-5 h-5" /></div>
                                    )}
                                  </div>
                                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors">
                                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Ganti Foto</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      disabled={processingImages || loadingDraft}
                                      onChange={(e) => void handlePhotoUpload('groom_photo', e.currentTarget.files?.[0])}
                                      className="sr-only"
                                    />
                                  </label>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Couple Text Fields */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {editorTabs[0].fields.filter(supportsField).map((field) => {
                              const config = fieldLabels[field]
                              return (
                                <div key={field}>
                                  <label className="block text-xs font-medium text-slate-700 mb-1">
                                    {config.label}
                                  </label>
                                  <input
                                    type={config.type || 'text'}
                                    placeholder={config.placeholder}
                                    value={typeof draft[field] === 'string' ? draft[field] : ''}
                                    disabled={loadingDraft}
                                    onChange={(e) => setDraft((c) => ({ ...c, [field]: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Tab 2: Akad & Resepsi */}
                      {activeEditorTab === 'schedule' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {editorTabs[1].fields.filter(supportsField).map((field) => {
                              const config = fieldLabels[field]
                              const isAddress = field === 'address'
                              return (
                                <div key={field} className={isAddress ? 'sm:col-span-2' : ''}>
                                  <label className="block text-xs font-medium text-slate-700 mb-1">
                                    {config.label}
                                  </label>
                                  {isAddress ? (
                                    <textarea
                                      rows={2}
                                      placeholder={config.placeholder}
                                      value={typeof draft[field] === 'string' ? draft[field] : ''}
                                      disabled={loadingDraft}
                                      onChange={(e) => setDraft((c) => ({ ...c, [field]: e.target.value }))}
                                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                  ) : (
                                    <input
                                      type={config.type || 'text'}
                                      placeholder={config.placeholder}
                                      value={typeof draft[field] === 'string' ? draft[field] : ''}
                                      disabled={loadingDraft}
                                      onChange={(e) => setDraft((c) => ({ ...c, [field]: e.target.value }))}
                                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Tab 3: Cerita & Media */}
                      {activeEditorTab === 'story' && (
                        <div className="space-y-5">
                          {/* Section Images */}
                          {editorTabs[2].images?.filter(supportsField).map((field) => (
                            <div key={field} className="pb-4 border-b border-slate-100 flex items-center justify-between gap-4">
                              <div>
                                <span className="block text-xs font-semibold text-slate-800">{templateImageLabels[field]}</span>
                                <span className="text-[11px] text-slate-400">Format JPG, PNG, atau WebP (maks 10 MB)</span>
                              </div>
                              <div className="flex items-center gap-3">
                                {draft[field] && (
                                  <img src={draft[field]} alt="" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                                )}
                                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors">
                                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Unggah</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    disabled={processingImages || loadingDraft}
                                    onChange={(e) => void handlePhotoUpload(field, e.currentTarget.files?.[0])}
                                    className="sr-only"
                                  />
                                </label>
                              </div>
                            </div>
                          ))}

                          {/* Story Text Fields */}
                          {editorTabs[2].fields.filter(supportsField).map((field) => {
                            const config = fieldLabels[field]
                            const isMultiline = field === 'love_story' || field === 'quote' || field === 'cover_message'
                            return (
                              <div key={field}>
                                <label className="block text-xs font-medium text-slate-700 mb-1">
                                  {config.label}
                                </label>
                                {isMultiline ? (
                                  <textarea
                                    rows={field === 'love_story' ? 4 : 2}
                                    placeholder={config.placeholder}
                                    value={typeof draft[field] === 'string' ? draft[field] : ''}
                                    disabled={loadingDraft}
                                    onChange={(e) => setDraft((c) => ({ ...c, [field]: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                ) : (
                                  <input
                                    type={config.type || 'text'}
                                    placeholder={config.placeholder}
                                    value={typeof draft[field] === 'string' ? draft[field] : ''}
                                    disabled={loadingDraft}
                                    onChange={(e) => setDraft((c) => ({ ...c, [field]: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                )}
                              </div>
                            )
                          })}

                          {/* Gallery Photos */}
                          {supportsField('gallery') && (
                            <div className="pt-4 border-t border-slate-100">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <span className="block text-xs font-semibold text-slate-800">Foto Galeri Undangan</span>
                                  <span className="text-[11px] text-slate-400">Maksimal 10 foto ditampilkan dalam galeri</span>
                                </div>
                                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition-colors">
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>Tambah Foto</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    disabled={processingImages || loadingDraft || (Array.isArray(draft.gallery) && draft.gallery.length >= 10)}
                                    onChange={(e) => {
                                      void handleGalleryUpload(e.currentTarget.files)
                                      e.currentTarget.value = ''
                                    }}
                                    className="sr-only"
                                  />
                                </label>
                              </div>

                              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3">
                                {(Array.isArray(draft.gallery) ? draft.gallery : []).map((photo, index) => (
                                  <div key={`${index}-${photo.slice(0, 32)}`} className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-square">
                                    <img src={photo} alt="" className="w-full h-full object-cover" />
                                    <button
                                      type="button"
                                      disabled={loadingDraft}
                                      onClick={() => removeGalleryPhoto(index)}
                                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tab 4: Wedding Gift */}
                      {activeEditorTab === 'gift' && (
                        <div className="space-y-4">
                          {/* Gift Photo */}
                          {editorTabs[3].images?.filter(supportsField).map((field) => (
                            <div key={field} className="pb-4 border-b border-slate-100 flex items-center justify-between gap-4">
                              <div>
                                <span className="block text-xs font-semibold text-slate-800">{templateImageLabels[field]}</span>
                                <span className="text-[11px] text-slate-400">Gambar ilustrasi atau amplop</span>
                              </div>
                              <div className="flex items-center gap-3">
                                {draft[field] && (
                                  <img src={draft[field]} alt="" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                                )}
                                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors">
                                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Unggah</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    disabled={processingImages || loadingDraft}
                                    onChange={(e) => void handlePhotoUpload(field, e.currentTarget.files?.[0])}
                                    className="sr-only"
                                  />
                                </label>
                              </div>
                            </div>
                          ))}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {editorTabs[3].fields.filter(supportsField).map((field) => {
                              const config = fieldLabels[field]
                              const isWide = field === 'gift_address'
                              return (
                                <div key={field} className={isWide ? 'sm:col-span-2' : ''}>
                                  <label className="block text-xs font-medium text-slate-700 mb-1">
                                    {config.label}
                                  </label>
                                  <input
                                    type="text"
                                    placeholder={config.placeholder}
                                    value={typeof draft[field] === 'string' ? draft[field] : ''}
                                    disabled={loadingDraft}
                                    onChange={(e) => setDraft((c) => ({ ...c, [field]: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Right Column: Live Iframe Preview in Mobile Frame */}
              <div className="hidden lg:flex flex-col h-full bg-slate-100 border-l border-slate-200">
                <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <span className="flex items-center gap-2 font-semibold">
                    <Smartphone className="w-4 h-4 text-indigo-600" />
                    <span>Pratinjau Langsung (Sinkronisasi Otomatis)</span>
                  </span>
                  <a
                    href={`/undangan/demo-${editingTemplate.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>Tab Baru</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex-1 p-4 flex items-center justify-center overflow-hidden">
                  <div className="w-[375px] h-full max-h-[640px] bg-white rounded-2xl shadow-lg border-4 border-slate-800 overflow-hidden relative flex flex-col">
                    <div className="h-5 bg-slate-800 flex items-center justify-center">
                      <div className="w-16 h-2.5 bg-slate-900 rounded-full" />
                    </div>
                    <iframe
                      key={editingTemplate.slug}
                      ref={editorPreviewRef}
                      title={`Preview langsung ${editingTemplate.name}`}
                      src={`/undangan/demo-${editingTemplate.slug}?editorPreview=1`}
                      className="w-full flex-1 border-0 bg-white"
                      onLoad={() => editorPreviewRef.current?.contentWindow?.postMessage({
                        type: 'template:demo-draft',
                        slug: editingTemplate.slug,
                        payload: draft,
                      }, window.location.origin)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-3.5 bg-slate-50 shrink-0">
              <button 
                type="button" 
                onClick={resetDraft} 
                disabled={loadingDraft || saving} 
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition-colors shadow-2xs"
              >
                <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
                <span>Reset ke Bawaan</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Tutup
                </button>
                <button 
                  type="button" 
                  onClick={() => void saveDraft()} 
                  disabled={processingImages || loadingDraft || draftLoadFailed || saving} 
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-xs"
                >
                  {saving ? (
                    <>
                      <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      <span>Simpan Perubahan ke Supabase</span>
                    </>
                  )}
                </button>
              </div>
            </footer>
          </section>
        </div>
      )}
    </AdminLayout>
  )
}
