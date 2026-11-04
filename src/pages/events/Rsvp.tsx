import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Save, Trash2, X } from 'lucide-react'
import EventWorkspaceLayout from '@/components/layout/EventWorkspaceLayout'
import { supabase } from '@/lib/supabase'

type Attendance = 'yes' | 'no' | 'maybe'

interface RsvpRow {
  id: string
  event_id: string
  name: string
  attendance: Attendance
  guest_count: number
  note: string | null
  created_at: string
}

interface RsvpForm {
  name: string
  attendance: Attendance
  guest_count: number
  note: string
}

const emptyForm: RsvpForm = { name: '', attendance: 'yes', guest_count: 1, note: '' }

export default function Rsvp() {
  const { id } = useParams()
  const [rows, setRows] = useState<RsvpRow[]>([])
  const [form, setForm] = useState<RsvpForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (id) void loadRsvps()
  }, [id])

  const loadRsvps = async () => {
    if (!id) return
    const { data, error } = await supabase
      .from('event_rsvps')
      .select('*')
      .eq('event_id', id)
      .order('created_at', { ascending: false })
    if (error) setErrorMessage(error.message)
    else setRows(data ?? [])
    setLoading(false)
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
    setErrorMessage('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !form.name.trim()) return
    setSaving(true)
    setErrorMessage('')
    const values = { ...form, name: form.name.trim(), note: form.note.trim() || null, guest_count: Math.max(1, form.guest_count) }
    try {
      const query = editingId
        ? supabase.from('event_rsvps').update(values).eq('id', editingId).eq('event_id', id).select('id').maybeSingle()
        : supabase.from('event_rsvps').insert({ ...values, event_id: id }).select('id').maybeSingle()
      const { data, error } = await query
      if (error) throw error
      if (!data) throw new Error('Perubahan RSVP tidak tersimpan. Periksa akses admin dan data acara.')
      resetForm()
      await loadRsvps()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Gagal menyimpan RSVP.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (rsvpId: string) => {
    if (!id || !window.confirm('Hapus RSVP ini?')) return
    const { data, error } = await supabase.from('event_rsvps').delete().eq('id', rsvpId).eq('event_id', id).select('id').maybeSingle()
    if (error) setErrorMessage(error.message)
    else if (!data) setErrorMessage('RSVP tidak terhapus. Periksa akses admin dan data acara.')
    else setRows((current) => current.filter((row) => row.id !== rsvpId))
  }

  const startEdit = (row: RsvpRow) => {
    setForm({ name: row.name, attendance: row.attendance, guest_count: row.guest_count, note: row.note || '' })
    setEditingId(row.id)
    setShowForm(true)
    setErrorMessage('')
  }

  return (
    <EventWorkspaceLayout>
      <div className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">RSVP</h1>
            <p className="mt-1 text-sm text-gray-500">{rows.length} jawaban tersimpan</p>
          </div>
          <button type="button" onClick={() => { resetForm(); setShowForm(true) }} className="flex items-center rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" /> Tambah RSVP
          </button>
        </header>

        {errorMessage && <p role="alert" className="text-sm text-red-600">{errorMessage}</p>}

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 border-y border-gray-200 py-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <label className="text-sm font-medium text-gray-700">Nama
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
              </label>
              <label className="text-sm font-medium text-gray-700">Kehadiran
                <select value={form.attendance} onChange={(e) => setForm({ ...form, attendance: e.target.value as Attendance })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
                  <option value="yes">Hadir</option><option value="no">Tidak hadir</option><option value="maybe">Belum pasti</option>
                </select>
              </label>
              <label className="text-sm font-medium text-gray-700">Jumlah tamu
                <input type="number" min={1} value={form.guest_count} onChange={(e) => setForm({ ...form, guest_count: Number(e.target.value) })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
              </label>
              <label className="text-sm font-medium text-gray-700">Catatan
                <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
              </label>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="flex items-center rounded-md bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"><Save className="mr-2 h-4 w-4" />{saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Simpan RSVP'}</button>
              <button type="button" onClick={resetForm} className="flex items-center rounded-md border border-gray-300 px-4 py-2"><X className="mr-2 h-4 w-4" />Batal</button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto border-y border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="text-left text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Nama</th><th className="px-4 py-3">Kehadiran</th><th className="px-4 py-3">Jumlah</th><th className="px-4 py-3">Catatan</th><th className="px-4 py-3 text-right">Aksi</th></tr></thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Memuat...</td></tr> : rows.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Belum ada RSVP</td></tr> : rows.map((row) => (
                <tr key={row.id}><td className="px-4 py-3 font-medium text-gray-900">{row.name}</td><td className="px-4 py-3">{row.attendance === 'yes' ? 'Hadir' : row.attendance === 'no' ? 'Tidak hadir' : 'Belum pasti'}</td><td className="px-4 py-3">{row.guest_count}</td><td className="px-4 py-3">{row.note || '-'}</td><td className="px-4 py-3 text-right"><button type="button" onClick={() => startEdit(row)} className="mr-3 text-indigo-700">Edit</button><button type="button" onClick={() => void handleDelete(row.id)} aria-label={`Hapus RSVP ${row.name}`} className="text-red-600"><Trash2 className="h-4 w-4" /></button></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </EventWorkspaceLayout>
  )
}
