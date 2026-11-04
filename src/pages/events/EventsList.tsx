import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Archive, Copy, ExternalLink, Pencil, Plus, Search, Trash2, 
  Calendar, CheckCircle2, AlertCircle, X
} from 'lucide-react'
import AdminLayout from '@/components/layout/AdminLayout'
import { supabase } from '@/lib/supabase'
import type { Event } from '@/types'
import { slugifyEventTitle } from '@/utils/eventDraft'

interface EventListItem {
  id: string
  title: string
  bride_name: string | null
  groom_name: string | null
  slug: string
  status: Event['status']
  created_at: string
  event_templates?: { name: string; slug: string } | null
}

type StatusFilter = 'all' | 'draft' | 'published' | 'archived' | 'completed'

const statusLabels: Record<Event['status'], string> = {
  draft: 'Draft',
  published: 'Dipublikasikan',
  archived: 'Diarsipkan',
  completed: 'Selesai',
}

const statusBadgeStyles: Record<Event['status'], string> = {
  draft: 'bg-slate-100 text-slate-700',
  published: 'bg-emerald-50 text-emerald-700',
  archived: 'bg-amber-50 text-amber-800',
  completed: 'bg-blue-50 text-blue-700',
}

function getErrorMessage(error: { code?: string; message?: string }, action: string) {
  if (error.code === '23505') return 'Slug acara sudah digunakan. Ubah slug sebelum mencoba lagi.'
  if (error.code === '42501' || error.code === 'PGRST301') return `Tidak memiliki akses untuk ${action}. Pastikan akun admin masih aktif.`
  return error.message || `Gagal ${action}.`
}

export default function EventsList() {
  const [events, setEvents] = useState<EventListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [errorMessage, setErrorMessage] = useState('')
  const [notice, setNotice] = useState('')
  const [busyEventId, setBusyEventId] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('events')
      .select('id, title, bride_name, groom_name, slug, status, created_at, event_templates(name, slug)')
      .order('created_at', { ascending: false })
    if (error) {
      setErrorMessage(getErrorMessage(error, 'memuat daftar acara'))
    } else {
      setEvents((data ?? []) as unknown as EventListItem[])
      setErrorMessage('')
    }
    setLoading(false)
  }, [])

  useEffect(() => { 
    void fetchEvents() 
  }, [fetchEvents])

  const counts = useMemo(() => {
    return {
      all: events.length,
      draft: events.filter((e) => e.status === 'draft').length,
      published: events.filter((e) => e.status === 'published').length,
      archived: events.filter((e) => e.status === 'archived').length,
      completed: events.filter((e) => e.status === 'completed').length,
    }
  }, [events])

  const filteredEvents = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return events.filter((event) => {
      const matchesSearch = !needle || [event.title, event.bride_name, event.groom_name, event.slug]
        .some((value) => value?.toLowerCase().includes(needle))
      return matchesSearch && (statusFilter === 'all' || event.status === statusFilter)
    })
  }, [events, search, statusFilter])

  const archiveEvent = async (event: EventListItem) => {
    if (!window.confirm(`Arsipkan acara “${event.title}”? Tautan publiknya tidak lagi dapat dibuka.`)) return
    setBusyEventId(event.id)
    setErrorMessage('')
    setNotice('')
    const { data, error } = await supabase
      .from('events')
      .update({ status: 'archived' })
      .eq('id', event.id)
      .select('id')
      .maybeSingle()
    if (error) setErrorMessage(getErrorMessage(error, 'mengarsipkan acara'))
    else if (!data) setErrorMessage('Acara tidak berubah. Periksa akses admin dan status acara.')
    else {
      setEvents((current) => current.map((item) => item.id === event.id ? { ...item, status: 'archived' } : item))
      setNotice(`Acara “${event.title}” berhasil diarsipkan.`)
    }
    setBusyEventId(null)
  }

  const deleteEvent = async (event: EventListItem) => {
    if (!window.confirm(`Hapus permanen acara “${event.title}” beserta seluruh data tamu, ucapan, dan RSVP? Tindakan ini tidak dapat dibatalkan.`)) return
    setBusyEventId(event.id)
    setErrorMessage('')
    setNotice('')
    const { data, error } = await supabase.from('events').delete().eq('id', event.id).select('id').maybeSingle()
    if (error) setErrorMessage(getErrorMessage(error, 'menghapus acara'))
    else if (!data) setErrorMessage('Acara tidak terhapus. Periksa akses admin dan data acara.')
    else {
      setEvents((current) => current.filter((item) => item.id !== event.id))
      setNotice(`Acara “${event.title}” dan data terkait berhasil dihapus.`)
    }
    setBusyEventId(null)
  }

  const duplicateEvent = async (event: EventListItem) => {
    setBusyEventId(event.id)
    setErrorMessage('')
    setNotice('')
    try {
      const baseSlug = slugifyEventTitle(`${event.slug}-salinan`).slice(0, 72) || 'acara-salinan'
      let slug = baseSlug
      let suffix = 2
      while (true) {
        const { data: match, error: lookupError } = await supabase.from('events').select('id').eq('slug', slug).maybeSingle()
        if (lookupError) throw lookupError
        if (!match) break
        slug = `${baseSlug}-${suffix++}`
      }

      const { data: source, error: sourceError } = await supabase.from('events').select('*').eq('id', event.id).single()
      if (sourceError) throw sourceError
      const { id: _id, created_at: _createdAt, updated_at: _updatedAt, published_at: _publishedAt, ...payload } = source
      const { data, error } = await supabase.from('events').insert({
        ...payload,
        title: `${event.title} (Salinan)`.slice(0, 120),
        slug,
        status: 'draft',
        published_at: null,
      }).select('id').single()
      if (error) throw error
      if (!data?.id) throw new Error('Salinan acara tidak tersimpan.')
      setNotice(`Salinan acara dibuat sebagai draft: /undangan/${slug}`)
      await fetchEvents()
    } catch (error) {
      setErrorMessage(getErrorMessage(error as { code?: string; message?: string }, 'menyalin acara'))
    } finally {
      setBusyEventId(null)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Semua Acara</h1>
            <p className="mt-1 text-sm text-slate-500">
              Daftar seluruh acara pernikahan yang terdaftar, status publikasi, dan pengaturan workspace.
            </p>
          </div>
          <Link
            to="/events/create"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors shrink-0"
          >
            <Plus className="h-4 w-4" />
            Buat Acara Baru
          </Link>
        </div>

        {/* Feedback Banners */}
        {errorMessage && (
          <div role="alert" className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </span>
            <button type="button" onClick={() => setErrorMessage('')} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {notice && (
          <div role="status" className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{notice}</span>
            </span>
            <button type="button" onClick={() => setNotice('')} className="text-emerald-500 hover:text-emerald-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="search"
                placeholder="Cari berdasarkan judul, nama mempelai, atau slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
              {(['all', 'published', 'draft', 'archived'] as StatusFilter[]).map((st) => {
                const label = st === 'all' ? 'Semua' : statusLabels[st as Event['status']]
                const count = counts[st]
                const isActive = statusFilter === st
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-white text-slate-900 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'bg-slate-200/70 text-slate-600'}`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Events Table Container */}
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs" aria-label="Tabel daftar acara">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-5 py-3.5">Acara & Mempelai</th>
                  <th scope="col" className="px-5 py-3.5">Template Tema</th>
                  <th scope="col" className="px-5 py-3.5">Status</th>
                  <th scope="col" className="px-5 py-3.5">Tanggal Dibuat</th>
                  <th scope="col" className="px-5 py-3.5 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-400 text-sm">
                      Memuat daftar acara...
                    </td>
                  </tr>
                ) : filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-14 text-center">
                      <Calendar className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-800">
                        {events.length ? 'Tidak ada acara yang cocok dengan pencarian / filter.' : 'Belum ada acara pernikahan.'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {events.length ? 'Coba ubah kata kunci pencarian atau reset filter status.' : 'Buat acara baru untuk mulai mendesain undangan digital.'}
                      </p>
                      {events.length ? (
                        <button
                          type="button"
                          onClick={() => { setSearch(''); setStatusFilter('all') }}
                          className="mt-3 text-xs font-semibold text-indigo-600 hover:underline"
                        >
                          Reset Pencarian
                        </button>
                      ) : (
                        <Link
                          to="/events/create"
                          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Buat Acara Pertama
                        </Link>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <Link 
                          to={`/events/${event.id}`} 
                          className="font-semibold text-slate-900 hover:text-indigo-600 block text-sm transition-colors"
                        >
                          {event.title}
                        </Link>
                        <span className="text-xs text-slate-500 block mt-0.5">
                          {event.bride_name || 'Mempelai Wanita'} & {event.groom_name || 'Mempelai Pria'}
                        </span>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                          <code className="text-slate-500 font-mono">/undangan/{event.slug}</code>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-medium text-slate-700 block">
                          {event.event_templates?.name || 'Belum dipilih'}
                        </span>
                        {event.event_templates?.slug && (
                          <span className="text-[11px] text-slate-400 capitalize">
                            {event.event_templates.slug.replace('-', ' ')}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded text-xs font-medium ${statusBadgeStyles[event.status]}`}>
                          {statusLabels[event.status]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500 font-mono tabular-nums">
                        {new Date(event.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {event.status === 'published' && (
                            <a
                              href={`/undangan/${event.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Buka Halaman Publik"
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                          <Link
                            to={`/events/${event.id}`}
                            title="Buka Workspace Acara"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                          >
                            <Pencil className="h-3 w-3" />
                            <span>Kelola</span>
                          </Link>
                          <button
                            type="button"
                            disabled={busyEventId === event.id}
                            onClick={() => void duplicateEvent(event)}
                            title="Buat Salinan Acara"
                            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-40"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          {event.status !== 'archived' && (
                            <button
                              type="button"
                              disabled={busyEventId === event.id}
                              onClick={() => void archiveEvent(event)}
                              title="Arsipkan Acara"
                              className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors disabled:opacity-40"
                            >
                              <Archive className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={busyEventId === event.id}
                            onClick={() => void deleteEvent(event)}
                            title="Hapus Acara"
                            className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Summary Footer */}
          <div className="border-t border-slate-100 px-5 py-3.5 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <span>
              Menampilkan <strong className="font-semibold text-slate-700 font-mono tabular-nums">{filteredEvents.length}</strong> dari <strong className="font-semibold text-slate-700 font-mono tabular-nums">{events.length}</strong> total acara
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Tekan "Kelola" untuk mengedit jadwal, foto, & tamu</span>
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  )
}
