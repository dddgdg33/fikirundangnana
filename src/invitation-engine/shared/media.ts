import { useEffect, useRef, useState } from 'react'

/* ------------------------------------------------------------------ */
/* Musik latar                                                         */
/* ------------------------------------------------------------------ */
export function useMusic(src?: string | null) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!src) return
    const audio = new Audio(src)
    audio.loop = true
    audio.preload = 'none'
    audioRef.current = audio
    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [src])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play().catch(() => setPlaying(false))
      setPlaying(true)
    }
  }

  /** Dipanggil setelah "Buka Undangan" — autoplay musik dengan gesture user. */
  const start = () => {
    const audio = audioRef.current
    if (!audio || playing) return
    audio.play().catch(() => setPlaying(false))
    setPlaying(true)
  }

  const stop = () => {
    audioRef.current?.pause()
    setPlaying(false)
  }

  return { playing, toggle, start, stop }
}

/* ------------------------------------------------------------------ */
/* Lightbox sederhana                                                  */
/* ------------------------------------------------------------------ */
export function useLightbox(images?: string[]) {
  const [index, setIndex] = useState<number | null>(null)

  const open = (i: number) => setIndex(i)
  const close = () => setIndex(null)
  const next = () => {
    if (index === null || !images?.length) return
    setIndex((index + 1) % images.length)
  }
  const prev = () => {
    if (index === null || !images?.length) return
    setIndex((index - 1 + images.length) % images.length)
  }

  useEffect(() => {
    if (index === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [index, images?.length])

  return { index, open, close, next, prev }
}
