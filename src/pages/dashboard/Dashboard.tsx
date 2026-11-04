import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Calendar, Users, Heart, MessageCircle, QrCode, Plus, FileText, 
  ArrowRight, ExternalLink, Sparkles, CheckCircle2
} from 'lucide-react'
import AdminLayout from '@/components/layout/AdminLayout'
import { supabase } from '@/lib/supabase'

interface RecentEvent {
  id: string
  title: string
  slug: string
  bride_name: string | null
  groom_name: string | null
  status: 'draft' | 'published' | 'archived' | 'completed'
  created_at: string
  event_templates?: { name: string; slug: string } | null
}

const statusBadge: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'text-slate-600 bg-slate-100' },
  published: { label: 'Aktif Publik', className: 'text-emerald-700 bg-emerald-50' },
  archived: { label: 'Diarsipkan', className: 'text-amber-800 bg-amber-50' },
  completed: { label: 'Selesai', className: 'text-blue-700 bg-blue-50' },
}

export default function Dashboard() {
  const [counts, setCounts] = useState({ events: 0, active: 0, guests: 0, rsvps: 0, wishes: 0, checkins: 0 })
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [statsError, setStatsError] = useState('')

  useEffect(() => {
    let mounted = true
    setLoading(true)

    void Promise.all([
      supabase.from('events').select('id,status', { count: 'exact' }),
      supabase.from('event_guests').select('id', { count: 'exact' }),
      supabase.from('event_rsvps').select('id', { count: 'exact' }).eq('attendance', 'yes'),
      supabase.from('event_wishes').select('id', { count: 'exact' }),
      supabase.from('event_checkins').select('id', { count: 'exact' }),
      supabase
        .from('events')
        .select('id, title, slug, bride_name, groom_name, status, created_at, event_templates(name, slug)')
        .order('created_at', { ascending: false })
        .limit(5),
    ]).then(([eventsRes, guestsRes, rsvpsRes, wishesRes, checkinsRes, recentRes]) => {
      if (!mounted) return
      setLoading(false)

      const failure = [eventsRes, guestsRes, rsvpsRes, wishesRes, checkinsRes, recentRes].find((r) => r.error)
      if (failure?.error) {
        setStatsError(failure.error.message)
        return
      }

      const rows = eventsRes.data ?? []
      setCounts({
        events: eventsRes.count ?? 0,
        active: rows.filter((row) => row.status === 'published').length,
        guests: guestsRes.count ?? 0,
        rsvps: rsvpsRes.count ?? 0,
        wishes: wishesRes.count ?? 0,
        checkins: checkinsRes.count ?? 0,
      })

      if (recentRes.data) {
        setRecentEvents(recentRes.data as unknown as RecentEvent[])
      }
    })

    return () => { mounted = false }
  }, [])

  const stats = [
    { name: 'Total Acara', value: counts.events, icon: Calendar, note: `${counts.active} aktif dipublikasikan` },
    { name: 'Acara Aktif', value: counts.active, icon: Heart, note: 'Tautan siap dibagikan' },
    { name: 'Total Tamu', value: counts.guests, icon: Users, note: 'Tercatat di buku tamu' },
    { name: 'RSVP Hadir', value: counts.rsvps, icon: CheckCircle2, note: 'Konfirmasi kehadiran' },
    { name: 'Ucapan & Doa', value: counts.wishes, icon: MessageCircle, note: 'Pesan dari para tamu' },
    { name: 'Check-in Lokasi', value: counts.checkins, icon: QrCode, note: 'Tamu tiba di acara' },
  ]

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                Admin Panel
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Ringkasan data operasional undangan digital, kehadiran tamu, dan katalog template.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/events/create"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Buat Acara Baru
            </Link>
          </div>
        </div>

        {statsError && (
          <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 flex items-center justify-between">
            <span>Statistik belum dapat dimuat sepenuhnya: {statsError}</span>
          </div>
        )}

        {/* Metric Cards Grid */}
        <section aria-label="Statistik acara">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div 
                key={stat.name} 
                className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-medium text-slate-500 block uppercase tracking-wider">
                      {stat.name}
                    </span>
                    <span className="mt-2 text-2xl font-bold text-slate-900 block font-mono tabular-nums">
                      {loading ? '—' : stat.value}
                    </span>
                    <span className="mt-1 text-xs text-slate-400 block">
                      {stat.note}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Action Navigation Cards */}
        <section aria-label="Kelola fitur">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/events"
              className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 hover:border-indigo-300 hover:shadow-xs transition-all"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <Calendar className="h-5 w-5" />
                </div>
                <h2 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Semua Acara
                </h2>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Lihat daftar seluruh acara pernikahan, ubah data mempelai, jadwal, dan tautan publik.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-indigo-600">
                <span>Kelola acara</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              to="/templates"
              className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 hover:border-indigo-300 hover:shadow-xs transition-all"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                  <FileText className="h-5 w-5" />
                </div>
                <h2 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Template Undangan
                </h2>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Jelajahi 9 pilihan tema (Heritage & Premium Series), preview tampilan, dan edit data contoh.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-indigo-600">
                <span>Katalog template</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              to="/guests"
              className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 hover:border-indigo-300 hover:shadow-xs transition-all"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <Users className="h-5 w-5" />
                </div>
                <h2 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Daftar Tamu
                </h2>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  Manajemen tamu undangan, buat link undangan personal, dan kirim via WhatsApp.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-indigo-600">
                <span>Kelola buku tamu</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </section>

        {/* Recent Events Table & Workflow Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Events Column */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Acara Terbaru</h2>
                <p className="text-xs text-slate-500 mt-0.5">Daftar acara terakhir yang dibuat atau dimodifikasi</p>
              </div>
              <Link to="/events" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                <span>Lihat semua</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Memuat data acara...</div>
            ) : recentEvents.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">Belum ada acara pernikahan</p>
                <p className="text-xs text-slate-400 mt-1">Mulai dengan membuat acara pertama Anda.</p>
                <Link
                  to="/events/create"
                  className="mt-4 inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Buat Acara Baru
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-xs">
                  <thead className="bg-slate-50/70 text-slate-500 font-medium text-left">
                    <tr>
                      <th className="px-4 py-3">Nama Acara</th>
                      <th className="px-4 py-3">Template</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentEvents.map((evt) => {
                      const badge = statusBadge[evt.status] || { label: evt.status, className: 'bg-slate-100 text-slate-700' }
                      return (
                        <tr key={evt.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-semibold text-slate-900 block truncate max-w-[200px]">
                              {evt.title}
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              {evt.bride_name || 'Mempelai Wanita'} & {evt.groom_name || 'Mempelai Pria'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 font-medium">
                            {evt.event_templates?.name || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${badge.className}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              {evt.status === 'published' && (
                                <a
                                  href={`/undangan/${evt.slug}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-slate-500 hover:text-indigo-600 p-1 rounded"
                                  title="Lihat Tautan Publik"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                              <Link
                                to={`/events/${evt.id}`}
                                className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/70 px-2 py-1 rounded transition-colors"
                              >
                                <span>Kelola</span>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Workflow Guide Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-semibold text-slate-900">Alur Pengelolaan Undangan</h2>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Langkah praktis untuk menyiapkan undangan digital siap sebar:
              </p>

              <ol className="space-y-3 text-xs text-slate-600">
                <li className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-100 font-semibold text-slate-700 flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div>
                    <strong className="text-slate-900 block font-medium">Buat Acara & Slug</strong>
                    <span className="text-slate-500 text-[11px]">Tentukan judul dan URL undangan Anda.</span>
                  </div>
                </li>
                <li className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-100 font-semibold text-slate-700 flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div>
                    <strong className="text-slate-900 block font-medium">Pilih Desain Tema</strong>
                    <span className="text-slate-500 text-[11px]">Tersedia Heritage Series dan Premium Series.</span>
                  </div>
                </li>
                <li className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-100 font-semibold text-slate-700 flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div>
                    <strong className="text-slate-900 block font-medium">Lengkapi Konten Acara</strong>
                    <span className="text-slate-500 text-[11px]">Isi data mempelai, akad, resepsi, galeri & rekening.</span>
                  </div>
                </li>
                <li className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-100 font-semibold text-slate-700 flex items-center justify-center shrink-0">
                    4
                  </span>
                  <div>
                    <strong className="text-slate-900 block font-medium">Kirim & Pantau Kehadiran</strong>
                    <span className="text-slate-500 text-[11px]">Bagikan link tamu personal & scan QR saat hari H.</span>
                  </div>
                </li>
              </ol>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link
                to="/events/create"
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Mulai Buat Undangan
              </Link>
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  )
}
