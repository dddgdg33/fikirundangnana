import { Suspense, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getTemplate } from '@/invitation-engine/registry'
import type { Event } from '@/types'

interface EventWithTemplate extends Event { event_templates?: { slug: string } | null }

export default function EventPreview() {
  const { id } = useParams()
  const [event, setEvent] = useState<EventWithTemplate | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  
  useEffect(() => {
    let mounted = true
    if (!id) return
    void (async () => {
      try {
        const { data, error: queryError } = await supabase.from('events').select('*, event_templates(slug)').eq('id', id).maybeSingle()
        if (!mounted) return
        if (queryError) setError(queryError.message)
        else if (!data) setError('Acara tidak ditemukan atau Anda tidak memiliki akses.')
        else setEvent(data as EventWithTemplate)
      } catch (queryError) {
        if (mounted) setError(queryError instanceof Error ? queryError.message : 'Gagal memuat acara.')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [id, refreshKey])
  
  // Listen for updates from editor pages via BroadcastChannel
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return
    
    const channel = new BroadcastChannel('event-updates')
    channel.onmessage = (event) => {
      if (event.data.type === 'event-updated' && event.data.eventId === id) {
        // Refresh the preview by triggering a re-fetch
        setRefreshKey(prev => prev + 1)
      }
    }
    
    return () => channel.close()
  }, [id])
  
  const Template = useMemo(
    () => event?.event_templates?.slug ? getTemplate(event.event_templates.slug) : null,
    [event?.event_templates?.slug],
  )

  if (loading) return <main className="p-8 text-center text-slate-600" role="status">Memuat preview...</main>
  if (error || !event) return <main className="p-8 text-center text-red-700" role="alert">{error || 'Acara tidak ditemukan.'}</main>
  if (!Template) return <main className="p-8 text-center text-slate-700">Template acara belum tersedia.</main>
  return <><div className="fixed left-3 top-3 z-[100] flex items-center gap-3 rounded-lg bg-white/95 px-3 py-2 text-sm shadow"><Link to={`/events/${event.id}`} className="inline-flex items-center gap-1 font-medium text-indigo-700"><ArrowLeft className="h-4 w-4" /> Kembali</Link><span className="text-slate-500">Preview draft</span></div><Suspense fallback={<div className="p-8 text-center text-slate-600" role="status">Memuat template...</div>}><Template event={event} guestName="Tamu Undangan" /></Suspense></>
}
