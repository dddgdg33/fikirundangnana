import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Check, Trash2 } from 'lucide-react'
import EventWorkspaceLayout from '@/components/layout/EventWorkspaceLayout'
import { supabase } from '@/lib/supabase'

interface WishRow {
  id: string
  event_id: string
  name: string
  message: string
  approved: boolean
  created_at: string
}

export default function Wishes() {
  const { id } = useParams()
  const [wishes, setWishes] = useState<WishRow[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (id) void loadWishes()
  }, [id])

  const loadWishes = async () => {
    if (!id) return
    const { data, error } = await supabase
      .from('event_wishes')
      .select('*')
      .eq('event_id', id)
      .order('created_at', { ascending: false })
    if (error) setErrorMessage(error.message)
    else setWishes(data ?? [])
    setLoading(false)
  }

  const toggleApproval = async (wish: WishRow) => {
    const { data, error } = await supabase
      .from('event_wishes')
      .update({ approved: !wish.approved })
      .eq('id', wish.id)
      .eq('event_id', id)
      .select('id')
      .maybeSingle()
    if (error) setErrorMessage(error.message)
    else if (!data) setErrorMessage('Perubahan ucapan tidak tersimpan. Periksa akses admin dan data acara.')
    else setWishes((current) => current.map((item) => item.id === wish.id ? { ...item, approved: !item.approved } : item))
  }

  const deleteWish = async (wishId: string) => {
    if (!window.confirm('Hapus ucapan ini?')) return
    const { data, error } = await supabase.from('event_wishes').delete().eq('id', wishId).eq('event_id', id).select('id').maybeSingle()
    if (error) setErrorMessage(error.message)
    else if (!data) setErrorMessage('Ucapan tidak terhapus. Periksa akses admin dan data acara.')
    else setWishes((current) => current.filter((wish) => wish.id !== wishId))
  }

  return (
    <EventWorkspaceLayout>
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-gray-900">Ucapan &amp; Doa</h1>
          <p className="mt-1 text-sm text-gray-500">{wishes.filter((wish) => !wish.approved).length} menunggu persetujuan</p>
        </header>

        {errorMessage && <p role="alert" className="text-sm text-red-600">{errorMessage}</p>}

        <div className="divide-y divide-gray-200 border-y border-gray-200">
          {loading ? <p className="py-8 text-center text-gray-500">Memuat...</p> : wishes.length === 0 ? <p className="py-8 text-center text-gray-500">Belum ada ucapan</p> : wishes.map((wish) => (
            <article key={wish.id} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-medium text-gray-900">{wish.name}</h2>
                  <span className={`text-xs ${wish.approved ? 'text-green-700' : 'text-amber-700'}`}>{wish.approved ? 'Tayang' : 'Menunggu'}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{wish.message}</p>
                <time className="mt-2 block text-xs text-gray-500">{new Date(wish.created_at).toLocaleString('id-ID')}</time>
              </div>
              <div className="flex shrink-0 gap-3">
                <button type="button" onClick={() => void toggleApproval(wish)} className="flex items-center gap-1 text-sm text-indigo-700">
                  <Check className="h-4 w-4" /> {wish.approved ? 'Sembunyikan' : 'Setujui'}
                </button>
                <button type="button" onClick={() => void deleteWish(wish.id)} aria-label={`Hapus ucapan ${wish.name}`} className="text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </EventWorkspaceLayout>
  )
}
