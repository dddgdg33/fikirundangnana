import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Check, ExternalLink, LoaderCircle, Sparkles, 
  Globe, AlertCircle
} from 'lucide-react'
import AdminLayout from '@/components/layout/AdminLayout'
import { supabase } from '@/lib/supabase'
import { TEMPLATE_REGISTRY_ENTRIES } from '@/pages/events/TemplatePublish'
import type { EventTemplate } from '@/types'
import { getCreateEventValidationErrors, slugifyEventTitle, type CreateEventDraft } from '@/utils/eventDraft'
import { getSupabaseErrorMessage } from '@/utils/errorMessages'

const emptyDraft: CreateEventDraft = {
  title: '',
  slug: '',
  bride_name: '',
  groom_name: '',
  template_id: '',
}

function getCreateErrorMessage(error: { code?: string; message?: string }) {
  if (error.code === '23505') return 'Slug ini sudah digunakan oleh acara lain. Silakan pilih slug lain.'
  return getSupabaseErrorMessage(error)
}

export default function CreateEvent() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<EventTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [templatesError, setTemplatesError] = useState('')
  const [draft, setDraft] = useState<CreateEventDraft>(emptyDraft)
  const [slugCustomized, setSlugCustomized] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'heritage' | 'premium'>('all')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CreateEventDraft, string>>>({})
  const [errorMessage, setErrorMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    const loadTemplates = async () => {
      setTemplatesLoading(true)
      const { data, error } = await supabase
        .from('event_templates')
        .select('*')
        .eq('active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true })
      if (!active) return
      if (error) {
        setTemplatesError(getCreateErrorMessage(error))
      } else {
        const rows = (data ?? []) as EventTemplate[]
        setTemplates(rows)
        // Auto-select first template if none selected
        if (rows.length) {
          setDraft((c) => (c.template_id ? c : { ...c, template_id: rows[0].id }))
        }
      }
      setTemplatesLoading(false)
    }
    void loadTemplates()
    return () => { active = false }
  }, [])

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === 'all') return templates
    return templates.filter((t) => t.category === selectedCategory)
  }, [templates, selectedCategory])

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === draft.template_id) ?? null,
    [draft.template_id, templates],
  )

  const updateDraft = (field: keyof CreateEventDraft, value: string) => {
    setDraft((current) => {
      const next = { ...current, [field]: value }
      if (field === 'title' && !slugCustomized) {
        next.slug = slugifyEventTitle(value)
      }
      return next
    })
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
    setErrorMessage('')
  }

  const handleSlugChange = (value: string) => {
    setSlugCustomized(true)
    updateDraft('slug', slugifyEventTitle(value))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validationErrors = getCreateEventValidationErrors(draft)
    setFieldErrors(validationErrors)
    setErrorMessage('')
    if (Object.keys(validationErrors).length) return

    setSaving(true)
    try {
      const { data: existing, error: lookupError } = await supabase
        .from('events')
        .select('id')
        .eq('slug', draft.slug)
        .maybeSingle()
      if (lookupError) throw lookupError
      if (existing) {
        setFieldErrors((current) => ({ ...current, slug: 'Slug ini sudah digunakan. Silakan gunakan kombinasi lain.' }))
        return
      }

      const { data, error } = await supabase
        .from('events')
        .insert({
          title: draft.title.trim(),
          slug: draft.slug,
          template_id: draft.template_id,
          bride_name: draft.bride_name.trim(),
          groom_name: draft.groom_name.trim(),
          status: 'draft',
        })
        .select('id')
        .single()

      if (error) throw error
      if (!data?.id) throw new Error('Data acara belum tersimpan. Silakan coba lagi.')
      navigate(`/events/${data.id}`, { replace: true })
    } catch (error) {
      setErrorMessage(getCreateErrorMessage(error as { code?: string; message?: string }))
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Navigation Breadcrumb & Header */}
        <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
          <Link 
            to="/events" 
            aria-label="Kembali ke semua acara" 
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Buat Acara Baru</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Pilih template tema, isi nama mempelai, dan tentukan tautan publik undangan Anda.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {templatesError && (
          <div role="alert" className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Gagal memuat template: {templatesError}</span>
          </div>
        )}

        {/* Main Form Split */}
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            {/* Step 1: Detail Acara & Mempelai */}
            <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <h2 className="text-base font-semibold text-slate-900">Informasi Acara & Pasangan</h2>
                </div>
                <p className="text-xs text-slate-500 mt-1 ml-8">
                  Data utama ini akan ditampilkan sebagai tajuk cover dan pengenal undangan.
                </p>
              </div>

              <div className="space-y-4">
                {/* Judul Acara */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Judul Acara <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    maxLength={120}
                    value={draft.title}
                    onChange={(e) => updateDraft('title', e.target.value)}
                    aria-invalid={!!fieldErrors.title}
                    placeholder="Contoh: The Wedding of Nadia & Rangga"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  />
                  {fieldErrors.title && <p role="alert" className="mt-1 text-xs text-red-600">{fieldErrors.title}</p>}
                </div>

                {/* Slug Undangan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Slug URL Undangan <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      required
                      maxLength={80}
                      value={draft.slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      aria-invalid={!!fieldErrors.slug}
                      placeholder="nadia-rangga"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-sm text-slate-900 font-mono placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                    <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">Tautan publik: <code className="font-mono text-indigo-700 bg-indigo-50/80 px-1.5 py-0.5 rounded">/undangan/{draft.slug || 'nama-acara'}</code></span>
                  </div>
                  {fieldErrors.slug && <p role="alert" className="mt-1 text-xs text-red-600">{fieldErrors.slug}</p>}
                </div>

                {/* Pasangan Mempelai */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Mempelai Wanita <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      maxLength={120}
                      value={draft.bride_name}
                      onChange={(e) => updateDraft('bride_name', e.target.value)}
                      aria-invalid={!!fieldErrors.bride_name}
                      placeholder="Nama lengkap mempelai wanita"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                    {fieldErrors.bride_name && <p role="alert" className="mt-1 text-xs text-red-600">{fieldErrors.bride_name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Mempelai Pria <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      maxLength={120}
                      value={draft.groom_name}
                      onChange={(e) => updateDraft('groom_name', e.target.value)}
                      aria-invalid={!!fieldErrors.groom_name}
                      placeholder="Nama lengkap mempelai pria"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/40 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                    {fieldErrors.groom_name && <p role="alert" className="mt-1 text-xs text-red-600">{fieldErrors.groom_name}</p>}
                  </div>
                </div>
              </div>
            </section>

            {/* Step 2: Pemilihan Template Undangan */}
            <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Pilih Desain Template</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Template dapat diganti kapan saja dari workspace acara.</p>
                  </div>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-white text-slate-900 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semua ({templates.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('heritage')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                      selectedCategory === 'heritage'
                        ? 'bg-white text-slate-900 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Heritage
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('premium')}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                      selectedCategory === 'premium'
                        ? 'bg-white text-slate-900 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Premium
                  </button>
                </div>
              </div>

              {templatesLoading ? (
                <div role="status" className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
                  <LoaderCircle className="h-5 w-5 animate-spin text-indigo-600" />
                  <span>Memuat katalog template...</span>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">Tidak ada template aktif di kategori ini.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredTemplates.map((template) => {
                    const meta = TEMPLATE_REGISTRY_ENTRIES.find((entry) => entry.slug === template.slug)
                    const selected = template.id === draft.template_id
                    const imgSrc = template.preview_image || meta?.preview || `/templates/${template.slug}/screenshots/thumb.jpg`

                    return (
                      <div
                        key={template.id}
                        onClick={() => updateDraft('template_id', template.id)}
                        className={`group relative cursor-pointer rounded-xl border-2 overflow-hidden transition-all text-left bg-white ${
                          selected
                            ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="aspect-[4/3] bg-slate-100 overflow-hidden relative">
                          <img
                            src={imgSrc}
                            alt={`Preview ${template.name}`}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement
                              if (!img.dataset.fallback) {
                                img.dataset.fallback = '1'
                                img.src = `/templates/${template.slug}/screenshots/thumb.jpg`
                              }
                            }}
                          />
                          {selected && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900/80 text-white backdrop-blur-xs text-[10px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: meta?.colorAccent || '#6366f1' }} />
                            <span className="truncate max-w-[140px]">{meta?.themeBadge || `${template.category} Series`}</span>
                          </div>
                        </div>

                        <div className="p-3 flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-xs text-slate-900 block truncate">
                              {template.name}
                            </span>
                          </div>
                          <a
                            href={`/undangan/demo-${template.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="Buka Demo Template"
                            className="text-xs text-slate-400 hover:text-indigo-600 p-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {fieldErrors.template_id && <p role="alert" className="mt-1 text-xs text-red-600">{fieldErrors.template_id}</p>}
            </section>
          </div>

          {/* Right Summary & Action Sidebar */}
          <aside className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs sticky top-20 space-y-4">
              <h3 className="font-semibold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Ringkasan Acara</span>
              </h3>

              {selectedTemplate ? (
                <div className="space-y-3">
                  <div className="aspect-[4/3] rounded-lg overflow-hidden border border-slate-100 bg-slate-100">
                    <img
                      src={selectedTemplate.preview_image || TEMPLATE_REGISTRY_ENTRIES.find((e) => e.slug === selectedTemplate.slug)?.preview || `/templates/${selectedTemplate.slug}/screenshots/thumb.jpg`}
                      alt={`Preview ${selectedTemplate.name}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider block">Template Terpilih</span>
                    <span className="font-semibold text-sm text-slate-900">{selectedTemplate.name}</span>
                    <span className="text-xs text-slate-500 capitalize block mt-0.5">{selectedTemplate.category} Series</span>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  Pilih salah satu template di sebelah kiri.
                </div>
              )}

              <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Pasangan Mempelai:</span>
                  <span className="font-semibold text-slate-800">
                    {draft.bride_name && draft.groom_name 
                      ? `${draft.bride_name} & ${draft.groom_name}`
                      : draft.bride_name || draft.groom_name || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Tautan Undangan:</span>
                  <span className="font-mono text-indigo-600 truncate block">
                    /undangan/{draft.slug || '...'}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={saving || templatesLoading || !templates.length}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      <span>Menyimpan Acara...</span>
                    </>
                  ) : (
                    <span>Buat Acara Sekarang</span>
                  )}
                </button>
                <Link
                  to="/events"
                  className="w-full text-center py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Batal
                </Link>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </AdminLayout>
  )
}
