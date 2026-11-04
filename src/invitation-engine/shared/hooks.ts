import { useEffect, useMemo, useRef, useState } from 'react'

/* ------------------------------------------------------------------ */
/* Countdown                                                           */
/* ------------------------------------------------------------------ */
export interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  finished: boolean
}

export function useCountdown(targetDate?: string | null): TimeLeft | null {
  const target = useMemo(() => {
    if (!targetDate) return null
    // Kolom DB "time" tanpa zona → perlakukan sebagai waktu lokal.
    const s = targetDate.includes('T') ? targetDate : `${targetDate}T00:00:00`
    const d = new Date(s)
    return isNaN(d.getTime()) ? null : d
  }, [targetDate])

  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!target) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [target])

  if (!target) return null

  const diff = target.getTime() - now
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, finished: true }

  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1_000) % 60),
    finished: false,
  }
}

/* ------------------------------------------------------------------ */
/* Format tanggal acara (id-ID)                                        */
/* ------------------------------------------------------------------ */
const WEEKDAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

export function parseEventDate(date?: string | null, time?: string | null): Date | null {
  if (!date) return null
  const t = time && /^\d{2}:\d{2}/.test(time) ? time : null
  const d = new Date(t ? `${date}T${t}` : `${date}T00:00:00`)
  return isNaN(d.getTime()) ? null : d
}

export function formatDayDate(date?: string | null): string {
  const d = parseEventDate(date)
  if (!d) return ''
  const day = WEEKDAYS[d.getDay()]
  const mon = MONTHS[d.getMonth()]
  const year = d.getFullYear()
  return `${day}, ${d.getDate()} ${mon} ${year}`
}

export function formatShortDate(date?: string | null): string {
  const d = parseEventDate(date)
  if (!d) return ''
  return `${String(d.getDate()).padStart(2, '0')} . ${String(d.getMonth() + 1).padStart(2, '0')} . ${d.getFullYear()}`
}

export function formatTime(time?: string | null): string {
  if (!time) return ''
  return time.slice(0, 5)
}

/* ------------------------------------------------------------------ */
/* Reveal on scroll                                                    */
/* ------------------------------------------------------------------ */
export function useReveal<T extends HTMLElement = HTMLDivElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold: 0.15, ...options },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return { ref, visible }
}
