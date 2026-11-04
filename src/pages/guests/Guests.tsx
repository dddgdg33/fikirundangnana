import { useCallback, useEffect, useMemo, useState } from 'react'
import { 
  Plus, Search, Copy, Check, Trash2, Pencil, 
  MessageSquare, Users, CheckCircle2, AlertCircle, X, 
  Download, LoaderCircle
} from 'lucide-react'
import AdminLayout from '@/components/layout/AdminLayout'
import { supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'

type GuestCategory = 'family' | 'friend' | 'colleague' | 'other'

interface EventOption {
  id: string
  title: string
  slug: string
  bride_name: string | null
  groom_name: string | null
}

interface EventGuest {
  id: string
  event_id: string
  name: string
  phone: string | null
  email: string | null
  category: GuestCategory
  group_name: string | null
  invitation_link: string | null
  created_at: string
  events?: { title: string; slug: string; bride_name: string | null; groom_name: string | null } | null
}

interface GuestFormData {
  event_id: string
  name: string
  phone: string
  email: string
  category: GuestCategory
  group_name: string
}

const emptyForm: GuestFormData = {
  event_id: '',
  name: '',
  phone: '',
  email: '',
  category: 'friend',
  group_name: '',
}

const categoryLabels: Record<GuestCategory, string> = {
  family: 'Keluarga',
  friend: 'Teman',
  colleague: 'Rekan Kerja',
  other: 'Lainnya',
}

const categoryColors: Record<GuestCategory, string> = {
  family: 'bg-purple-50 text-purple-700',
  friend: 'bg-blue-50 text-blue-700',
  colleague: 'bg-amber-50 text-amber-800',
  other: 'bg-slate-100 text-slate-700',
}

export default function Guests() {
  const [events, setEvents] = useState<EventOption[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('all')
  const [guests, setGuests] = useState<EventGuest[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | GuestCategory>('all')
  
  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<GuestFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Load list of events for the dropdown
  const loadEvents = useCallback(async () => {
    const { data } = await supabase
      .from('events')
      .select('id, title, slug, bride_name, groom_name')
      .order('created_at', { ascending: false })
    const list = (data ?? []) as EventOption[]
    setEvents(list)
    if (list.length && selectedEventId === 'all') {
      // default can be 'all' or first event
    }
  }, [selectedEventId])

  // Load guests
  const loadGuests = useCallback(async () => {
    setLoading(true)
    let queryBuilder = supabase
      .from('event_guests')
      .select('id, event_id, name, phone, email, category, group_name, invitation_link, created_at, events(title, slug, bride_name, groom_name)')
      .order('created_at', { ascending: false })

    if (selectedEventId !== 'all') {
      queryBuilder = queryBuilder.eq('event_id', selectedEventId)
    }

    const { data, error } = await queryBuilder
    if (!error && data) {
      setGuests(data as unknown as EventGuest[])
    }
    setLoading(false)
  }, [selectedEventId])

  useEffect(() => {
    void loadEvents()
  }, [loadEvents])

  useEffect(() => {
    void loadGuests()
  }, [loadGuests])

  const filteredGuests = useMemo(() => {
    const q = query.trim().toLowerCase()
    return guests.filter((g) => {
      const matchSearch = !q || [g.name, g.phone, g.email, g.group_name].some((v) => v?.toLowerCase().includes(q))
      const matchCategory = categoryFilter === 'all' || g.category === categoryFilter
      return matchSearch && matchCategory
    })
  }, [guests, query, categoryFilter])

  const openAddModal = () => {
    setForm({
      ...emptyForm,
      event_id: selectedEventId !== 'all' ? selectedEventId : (events[0]?.id || ''),
    })
    setEditingId(null)
    setModalError('')
    setShowModal(true)
  }

  const openEditModal = (guest: EventGuest) => {
    setForm({
      event_id: guest.event_id,
      name: guest.name,
      phone: guest.phone || '',
      email: guest.email || '',
      category: guest.category,
      group_name: guest.group_name || '',
    })
    setEditingId(guest.id)
    setModalError('')
    setShowModal(true)
  }

  const handleSaveGuest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.event_id) {
      setModalError('Nama tamu dan pilihan acara wajib diisi.')
      return
    }

    setSaving(true)
    setModalError('')

    const targetEvent = events.find((ev) => ev.id === form.event_id)
    const slug = targetEvent?.slug || 'undangan'
    const link = `${window.location.origin}/undangan/${slug}?to=${encodeURIComponent(form.name.trim())}`

    const payload = {
      event_id: form.event_id,
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      category: form.category,
      group_name: form.group_name.trim() || null,
      invitation_link: link,
    }

    try {
      const request = editingId
        ? supabase.from('event_guests').update(payload).eq('id', editingId).select('id').maybeSingle()
        : supabase.from('event_guests').insert(payload).select('id').maybeSingle()

      const { data, error } = await request
      if (error) throw error
      if (!data) throw new Error('Data tamu tidak tersimpan. Periksa akses akun admin.')

      setShowModal(false)
      setFeedback(`Data tamu “${form.name}” berhasil disimpan!`)
      await loadGuests()
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Gagal menyimpan data tamu.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteGuest = async (guest: EventGuest) => {
    if (!window.confirm(`Hapus tamu “${guest.name}” dari daftar?`)) return
    try {
      const { error } = await supabase.from('event_guests').delete().eq('id', guest.id)
      if (error) throw error
      setGuests((current) => current.filter((g) => g.id !== guest.id))
      setFeedback(`Tamu “${guest.name}” telah dihapus.`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus tamu.')
    }
  }

  const copyInvitationLink = (guest: EventGuest) => {
    const slug = guest.events?.slug || events.find((e) => e.id === guest.event_id)?.slug || ''
    const link = guest.invitation_link || `${window.location.origin}/undangan/${slug}?to=${encodeURIComponent(guest.name)}`
    
    void navigator.clipboard.writeText(link).then(() => {
      setCopiedId(guest.id)
      setFeedback(`Tautan undangan untuk “${guest.name}” telah disalin ke clipboard!`)
      setTimeout(() => setCopiedId(null), 2500)
    })
  }

  const openWhatsApp = (guest: EventGuest) => {
    const phone = (guest.phone || '').replace(/[^0-9]/g, '')
    const targetEvent = guest.events || events.find((e) => e.id === guest.event_id)
    const coupleName = targetEvent ? `${targetEvent.bride_name || 'Mempelai'} & ${targetEvent.groom_name || 'Mempelai'}` : 'Kami'
    const slug = targetEvent?.slug || ''
    const link = guest.invitation_link || `${window.location.origin}/undangan/${slug}?to=${encodeURIComponent(guest.name)}`

    const message = `Halo ${guest.name},\n\nTanpa mengurangi rasa hormat, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk menghadiri momen istimewa pernikahan ${coupleName}.\n\nInformasi lengkap mengenai jadwal dan lokasi acara dapat diakses melalui tautan berikut:\n${link}\n\nMerupakan suatu kehormatan dan kebahagiaan bagi kami apabila berkenan hadir dan memberikan doa restu.\n\nTerima kasih.`
    
    const waUrl = phone 
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`
    
    window.open(waUrl, '_blank')
  }

  const exportExcel = () => {
    if (!filteredGuests.length) return
    const rows = filteredGuests.map((g) => ({
      Nama: g.name,
      Acara: g.events?.title || '-',
      Kategori: categoryLabels[g.category] || g.category,
      Grup: g.group_name || '-',
      Telepon: g.phone || '-',
      Email: g.email || '-',
      Tautan_Undangan: g.invitation_link || '',
    }))

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar Tamu')
    XLSX.writeFile(workbook, `daftar-tamu-${Date.now()}.xlsx`)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Daftar Tamu Undangan</h1>
            <p className="mt-1 text-sm text-slate-500">
              Kelola buku tamu, buat tautan personal otomatis, dan bagikan undangan langsung via WhatsApp.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportExcel}
              disabled={!filteredGuests.length}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Ekspor Excel</span>
            </button>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Tamu</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div role="status" className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{feedback}</span>
            </span>
            <button type="button" onClick={() => setFeedback('')} className="text-emerald-500 hover:text-emerald-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Event Selector & Filter Strip */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Event Selector */}
            <div className="flex items-center gap-2">
              <label htmlFor="event-filter" className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                Pilih Acara:
              </label>
              <select
                id="event-filter"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-1.5 text-xs font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">Semua Acara ({events.length})</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.slug})
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  categoryFilter === 'all'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({guests.length})
              </button>
              {(['family', 'friend', 'colleague', 'other'] as GuestCategory[]).map((cat) => {
                const count = guests.filter((g) => g.category === cat).length
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                      categoryFilter === cat
                        ? 'bg-white text-slate-900 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{categoryLabels[cat]}</span>
                    <span className="text-[10px] ml-1 text-slate-400">({count})</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama tamu, nomor telepon, atau nama grup/meja..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/40 py-2 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Table of Guests */}
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-5 py-3.5">Nama Tamu & Grup</th>
                  <th scope="col" className="px-5 py-3.5">Acara</th>
                  <th scope="col" className="px-5 py-3.5">Kontak</th>
                  <th scope="col" className="px-5 py-3.5">Kategori</th>
                  <th scope="col" className="px-5 py-3.5">Tautan Undangan</th>
                  <th scope="col" className="px-5 py-3.5 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-xs">
                      Memuat daftar tamu...
                    </td>
                  </tr>
                ) : filteredGuests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-14 text-center">
                      <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-800">
                        {guests.length ? 'Tidak ada tamu yang cocok dengan filter pencarian.' : 'Belum ada tamu yang didaftarkan.'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {guests.length ? 'Periksa kembali kata kunci pencarian Anda.' : 'Tambahkan tamu undangan untuk membagikan tautan personal.'}
                      </p>
                      {!guests.length && (
                        <button
                          type="button"
                          onClick={openAddModal}
                          className="mt-3.5 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Tambah Tamu Pertama
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredGuests.map((guest) => {
                    const isCopied = copiedId === guest.id
                    return (
                      <tr key={guest.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-slate-900 block text-xs">
                            {guest.name}
                          </span>
                          {guest.group_name && (
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              Meja / Grup: {guest.group_name}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-600">
                          {guest.events?.title || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-600 font-mono">
                          {guest.phone || guest.email || '-'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-medium ${categoryColors[guest.category]}`}>
                            {categoryLabels[guest.category] || guest.category}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => copyInvitationLink(guest)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                                isCopied
                                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              <span>{isCopied ? 'Tersalin' : 'Salin Link'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openWhatsApp(guest)}
                              title="Bagikan via WhatsApp"
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(guest)}
                              title="Edit Tamu"
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteGuest(guest)}
                              title="Hapus Tamu"
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-100 px-5 py-3 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <span>
              Menampilkan <strong className="font-semibold text-slate-700 font-mono tabular-nums">{filteredGuests.length}</strong> tamu
            </span>
            <span className="text-[11px] text-slate-400">
              Format link otomatis menyertakan parameter nama tamu (?to=Nama)
            </span>
          </div>
        </section>
      </div>

      {/* Add / Edit Guest Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowModal(false)
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/70">
              <h2 className="text-sm font-bold text-slate-900">
                {editingId ? 'Edit Data Tamu' : 'Tambah Tamu Baru'}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            <form onSubmit={handleSaveGuest} className="p-6 space-y-4">
              {modalError && (
                <div role="alert" className="p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Event Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Acara Pernikahan <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={form.event_id}
                  onChange={(e) => setForm({ ...form, event_id: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/40 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="" disabled>Pilih Acara</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.slug})
                    </option>
                  ))}
                </select>
              </div>

              {/* Nama Tamu */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Lengkap Tamu <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="Contoh: Bpk. Bambang & Keluarga"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/40 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Telepon / WhatsApp & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    No. WhatsApp / HP
                  </label>
                  <input
                    type="tel"
                    placeholder="081234567890"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/40 px-3 py-2 text-xs text-slate-900 font-mono focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Email (Opsional)
                  </label>
                  <input
                    type="email"
                    placeholder="tamu@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/40 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Kategori & Grup/Meja */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Kategori Tamu
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as GuestCategory })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/40 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="family">Keluarga</option>
                    <option value="friend">Teman</option>
                    <option value="colleague">Rekan Kerja</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Meja / Grup
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: VIP / Meja 04"
                    value={form.group_name}
                    onChange={(e) => setForm({ ...form, group_name: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/40 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? (
                    <>
                      <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{editingId ? 'Simpan Perubahan' : 'Tambah Tamu'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
