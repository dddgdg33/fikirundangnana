import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Wish } from '@/types'

/* ------------------------------------------------------------------ */
/* Buku tamu (event_wishes) — public: insert + read approved           */
/* ------------------------------------------------------------------ */
export function useWishes(eventId?: string, limit = 100) {
  const [wishes, setWishes] = useState<Wish[]>([])
  const [loading, setLoading] = useState(false)

  const fetchWishes = useCallback(async () => {
    if (!eventId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('event_wishes')
      .select('*')
      .eq('event_id', eventId)
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (!error) setWishes(data ?? [])
    else console.error('fetchWishes:', error.message)
    setLoading(false)
  }, [eventId, limit])

  useEffect(() => {
    fetchWishes()
  }, [fetchWishes])

  const addWish = useCallback(
    async (name: string, message: string) => {
      if (!eventId || !name.trim() || !message.trim()) {
        return { error: 'Nama dan ucapan wajib diisi.' }
      }
      const { error } = await supabase
        .from('event_wishes')
        .insert({ event_id: eventId, name: name.trim(), message: message.trim() })
      if (error) return { error: error.message }
      // Policy hanya mengizinkan baca approved; ucapan baru menunggu moderasi.
      await fetchWishes()
      return {}
    },
    [eventId, fetchWishes],
  )

  return { wishes, loading, addWish }
}

/* ------------------------------------------------------------------ */
/* RSVP (event_rsvps) — public: insert; read hanya untuk admin         */
/* ------------------------------------------------------------------ */
export function useRsvpSubmit(eventId?: string) {
  const [submitting, setSubmitting] = useState(false)

  const submitRsvp = useCallback(
    async (payload: { name: string; attendance: 'yes' | 'no' | 'maybe'; guest_count: number; note?: string }) => {
      if (!eventId) return { error: 'Event tidak ditemukan.' }
      if (!payload.name.trim()) return { error: 'Nama wajib diisi.' }
      setSubmitting(true)
      const { error } = await supabase.from('event_rsvps').insert({
        event_id: eventId,
        name: payload.name.trim(),
        attendance: payload.attendance,
        guest_count: Math.max(1, payload.guest_count),
        note: payload.note?.trim() || null,
      })
      setSubmitting(false)
      if (error) return { error: error.message }
      return {}
    },
    [eventId],
  )

  const countRsvps = useCallback(
    async (attendance: 'yes' | 'no' | 'maybe') => {
      if (!eventId) return 0
      const { count, error } = await supabase
        .from('event_rsvps')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('attendance', attendance)
      if (error) {
        console.error('countRsvps:', error.message)
        return 0
      }
      return count ?? 0
    },
    [eventId],
  )

  return { submitting, submitRsvp, countRsvps }
}
