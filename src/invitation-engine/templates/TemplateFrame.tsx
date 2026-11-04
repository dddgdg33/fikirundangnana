import { useCallback, useEffect, useRef } from 'react'
import type { InvitationTemplateProps } from '@/invitation-engine/types'
import { supabase } from '@/lib/supabase'

interface TemplateFrameProps extends InvitationTemplateProps {
  /** Slug folder template di public/templates, mis. 'premium-01' */
  slug: string
  /** Nama template untuk judul iframe */
  title: string
}

function formatDate(value: string | undefined, options: Intl.DateTimeFormatOptions) {
  if (!value) return ''
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('id-ID', options).format(date)
}

function formatTime(value?: string) {
  return value ? `${value.slice(0, 5).replace(':', '.')} WIB - Selesai` : ''
}

function formatInstagramUrl(value?: string) {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  return `https://www.instagram.com/${value.replace(/^@/, '')}/`
}

const DATE_LONG: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
const DATE_SHORT: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }

/**
 * Render template hasil scrape di dalam iframe dan kirim data event lewat
 * postMessage (lihat public/templates/_shared/invitation-bridge.js).
 */
export default function TemplateFrame({ slug, title, event, guestName }: TemplateFrameProps) {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const rsvpInFlight = useRef(false)

  const sendData = useCallback(() => {
    frameRef.current?.contentWindow?.postMessage(
      {
        type: 'invitation:data',
        payload: {
          brideName: event.bride_nick || event.bride_name,
          groomName: event.groom_nick || event.groom_name,
          bridePhoto: event.bride_photo,
          groomPhoto: event.groom_photo,
          coverPhoto: event.cover_photo,
          featurePhoto: event.feature_photo,
          giftPhoto: event.gift_photo,
          invitationUrl: window.location.href,
          gallery: [...(event.gallery ?? []), ...(event.prewedding_photos ?? [])].slice(0, 10),
          guestName,
          fields: {
            bride_name: event.bride_name,
            bride_nick: event.bride_nick,
            bride_parents: [event.bride_father, event.bride_mother && `& ${event.bride_mother}`].filter(Boolean).join('\n'),
            groom_name: event.groom_name,
            groom_nick: event.groom_nick,
            groom_parents: [event.groom_father, event.groom_mother && `& ${event.groom_mother}`].filter(Boolean).join('\n'),
            akad_date: formatDate(event.akad_date, DATE_LONG),
            akad_date_short: formatDate(event.akad_date, DATE_SHORT),
            akad_time: formatTime(event.akad_time),
            akad_location: event.akad_location ?? '',
            reception_date: formatDate(event.reception_date, DATE_LONG),
            reception_date_short: formatDate(event.reception_date, DATE_SHORT),
            reception_time: formatTime(event.reception_time),
            reception_location: event.reception_location ?? '',
            reception_month: formatDate(event.reception_date, { month: 'long', year: 'numeric' }),
            address: event.address || event.reception_location || event.akad_location || '',
            dress_code: event.dress_code ?? '',
            cover_message: event.cover_message ?? '',
            quote: event.quote ?? '',
            love_story: event.love_story ?? '',
            video_url: event.video_url ?? '',
            music_url: event.music_url ?? '',
            maps_url: event.maps_url ?? '',
            bride_ig: formatInstagramUrl(event.bride_ig),
            groom_ig: formatInstagramUrl(event.groom_ig),
            gift_bank_name: event.gift_bank_name ?? '',
            gift_account_number: event.gift_account_number ?? '',
            gift_account_holder: event.gift_account_holder ?? '',
            gift_address: event.gift_address ?? '',
            gift_recipient: event.gift_recipient ?? '',
            gift_wa: event.gift_wa ?? '',
          },
        },
      },
      '*',
    )
  }, [event, guestName])

  useEffect(() => {
    sendData()
  }, [sendData])

  useEffect(() => {
    const handleRsvp = async (message: MessageEvent) => {
      if (message.source !== frameRef.current?.contentWindow || message.data?.type !== 'invitation:rsvp-submit') return
      if (rsvpInFlight.current) return

      const payload = message.data.payload || {}
      const name = String(payload.name || '').trim()
      const attendance = payload.attendance
      const guestCount = Math.max(1, Math.min(20, Number.parseInt(String(payload.guestCount || '1').match(/\d+/)?.[0] || '1', 10)))
      const note = String(payload.note || '').trim()
      const formId = String(payload.formId || '')
      const reply = (success: boolean, text: string) => {
        frameRef.current?.contentWindow?.postMessage({
          type: 'invitation:rsvp-result',
          payload: { success, message: text, formId },
        }, '*')
      }

      if (!name || !['yes', 'no', 'maybe'].includes(attendance)) {
        reply(false, 'Nama dan konfirmasi kehadiran wajib diisi.')
        return
      }
      if (event.is_demo) {
        reply(true, 'Form berhasil diisi. RSVP tidak dikirim karena ini hanya halaman preview.')
        return
      }

      rsvpInFlight.current = true
      try {
        const { error } = await supabase.from('event_rsvps').insert({
          event_id: event.id,
          name,
          attendance,
          guest_count: guestCount,
          note: note || null,
        })
        if (error) {
          reply(false, error.message)
          return
        }

        let wishStatus = ''
        if (note) {
          const { error: wishError } = await supabase.from('event_wishes').insert({ event_id: event.id, name, message: note })
          if (wishError) wishStatus = ' RSVP tersimpan, tetapi ucapan belum terkirim.'
        }
        reply(true, `Konfirmasi kehadiran berhasil dikirim.${wishStatus}`)
      } catch (error) {
        reply(false, error instanceof Error ? error.message : 'Konfirmasi gagal dikirim. Silakan coba lagi.')
      } finally {
        rsvpInFlight.current = false
      }
    }

    window.addEventListener('message', handleRsvp)
    return () => window.removeEventListener('message', handleRsvp)
  }, [event.id, event.is_demo])

  useEffect(() => {
    const handleReady = (message: MessageEvent) => {
      if (message.source !== frameRef.current?.contentWindow) return
      if (message.data?.type !== 'invitation:ready') return
      sendData()
    }
    window.addEventListener('message', handleReady)
    return () => window.removeEventListener('message', handleReady)
  }, [sendData])

  const src = `/templates/${slug}/html/rendered.html?to=${encodeURIComponent(guestName)}`

  return (
    <iframe
      ref={frameRef}
      title={`${title} invitation`}
      src={src}
      sandbox='allow-scripts allow-same-origin allow-forms allow-popups'
      onLoad={sendData}
      style={{ display: 'block', width: '100%', height: '100vh', border: 0 }}
    />
  )
}
