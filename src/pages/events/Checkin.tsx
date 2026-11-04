import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import { Download, RefreshCw } from 'lucide-react'
import EventWorkspaceLayout from '@/components/layout/EventWorkspaceLayout'
import { supabase } from '@/lib/supabase'

interface GuestRow {
  id: string
  name: string
  phone: string | null
  category: string
  checkin_id: string | null    // null = belum check-in
  checked_in_at: string | null
}

export default function Checkin() {
  const { id } = useParams()
  const [guests, setGuests] = useState<GuestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [qrGuest, setQrGuest] = useState<GuestRow | null>(null)
  const qrRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (id) void loadGuests()
  }, [id])

  const loadGuests = async () => {
    if (!id) return
    setLoading(true)
    setErrorMessage('')

    // Load guests + join event_checkins untuk status check-in
    const { data, error } = await supabase
      .from('event_guests')
      .select(`
        id,
        name,
        phone,
        category,
        event_checkins (
          id,
          checked_in_at
        )
      `)
      .eq('event_id', id)
      .order('name', { ascending: true })

    if (error) {
      setErrorMessage(error.message)
      setLoading(false)
      return
    }

    const rows: GuestRow[] = (data ?? []).map((g: any) => {
      const checkin = Array.isArray(g.event_checkins) ? g.event_checkins[0] : g.event_checkins
      return {
        id: g.id,
        name: g.name,
        phone: g.phone,
        category: g.category,
        checkin_id: checkin?.id ?? null,
        checked_in_at: checkin?.checked_in_at ?? null,
      }
    })

    setGuests(rows)
    setLoading(false)
  }

  const handleCheckin = async (guest: GuestRow) => {
    setErrorMessage('')
    if (guest.checkin_id) {
      // Batalkan check-in: hapus dari event_checkins
      const { error } = await supabase
        .from('event_checkins')
        .delete()
        .eq('id', guest.checkin_id)
      if (error) return setErrorMessage(error.message)
      setGuests((current) =>
        current.map((g) =>
          g.id === guest.id ? { ...g, checkin_id: null, checked_in_at: null } : g,
        ),
      )
    } else {
      // Check-in: insert ke event_checkins
      const { data, error } = await supabase
        .from('event_checkins')
        .insert({ event_id: id, guest_id: guest.id })
        .select('id, checked_in_at')
        .maybeSingle()
      if (error) return setErrorMessage(error.message)
      if (!data) return setErrorMessage('Check-in gagal disimpan.')
      setGuests((current) =>
        current.map((g) =>
          g.id === guest.id
            ? { ...g, checkin_id: data.id, checked_in_at: data.checked_in_at }
            : g,
        ),
      )
    }
  }

  const downloadQr = () => {
    if (!qrRef.current || !qrGuest) return
    const canvas = qrRef.current.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `qr-${qrGuest.name.replace(/\s+/g, '-')}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  const checkedInCount = guests.filter((g) => g.checkin_id !== null).length

  return (
    <EventWorkspaceLayout>
      <div className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">QR Check-in</h1>
            <p className="mt-1 text-sm text-gray-500">
              {checkedInCount} / {guests.length} tamu sudah check-in
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadGuests()}
            className="flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </button>
        </header>

        {errorMessage && (
          <p role="alert" className="text-sm text-red-600">
            {errorMessage}
          </p>
        )}

        {/* QR Modal */}
        {qrGuest && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setQrGuest(null)}
          >
            <div
              className="rounded-xl bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-4 text-center text-lg font-semibold text-gray-900">
                {qrGuest.name}
              </h2>
              <div ref={qrRef} className="flex justify-center">
                <QRCodeCanvas value={qrGuest.id} size={240} marginSize={2} />
              </div>
              <p className="mt-2 text-center font-mono text-xs text-gray-500">{qrGuest.id}</p>
              <div className="mt-4 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={downloadQr}
                  className="flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
                >
                  <Download className="mr-2 h-4 w-4" /> Unduh QR
                </button>
                <button
                  type="button"
                  onClick={() => setQrGuest(null)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto border-y border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Waktu Check-in</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Memuat...
                  </td>
                </tr>
              ) : guests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Belum ada tamu. Tambahkan tamu di menu Daftar Tamu terlebih dahulu.
                  </td>
                </tr>
              ) : (
                guests.map((guest) => (
                  <tr key={guest.id} className={guest.checkin_id ? 'bg-green-50' : ''}>
                    <td className="px-4 py-3 font-medium text-gray-900">{guest.name}</td>
                    <td className="px-4 py-3 capitalize text-gray-500">{guest.category}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          guest.checkin_id
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {guest.checkin_id ? 'Hadir' : 'Belum'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {guest.checked_in_at
                        ? new Date(guest.checked_in_at).toLocaleString('id-ID')
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setQrGuest(guest)}
                        className="mr-3 text-xs text-indigo-700"
                      >
                        QR
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleCheckin(guest)}
                        className={`text-xs ${guest.checkin_id ? 'text-red-600' : 'text-green-700'}`}
                      >
                        {guest.checkin_id ? 'Batalkan' : 'Check-in'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </EventWorkspaceLayout>
  )
}
