import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Event } from '@/types'
import { getTemplate, getTemplateMeta } from '@/invitation-engine/registry'
import { createDemoInvitationEvent, getDemoInvitationDraft, type DemoInvitationOverrides } from '@/utils/demoInvitation'

interface WithTemplate extends Event {
  event_templates?: { slug: string } | null
}

export default function PublicInvitation() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const guestName = searchParams.get('to') || 'Tamu Undangan'
  const [event, setEvent] = useState<WithTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const editorDraftRef = useRef<DemoInvitationOverrides | null>(null)
  const TemplateComponent = useMemo(
    () => event ? getTemplate(event.event_templates?.slug ?? String(event.template_id ?? '')) : null,
    [event?.event_templates?.slug, event?.template_id],
  )

  const fetchEvent = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      // left join event_templates; jika FK/tabel belum siap tetap ikut terbaca
      const { data, error } = await supabase
        .from('events')
        .select('*, event_templates(slug)')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle()

      if (error) throw error
      if (!data && slug?.startsWith('demo-')) {
        const templateSlug = slug.replace(/^demo-/, '')
        const { data: template } = await supabase
          .from('event_templates')
          .select('id, slug, demo_data')
          .eq('slug', templateSlug)
          .eq('active', true)
          .maybeSingle()

        const localMeta = getTemplateMeta(templateSlug)
        const demoEvent = { ...createDemoInvitationEvent(slug), ...getDemoInvitationDraft(slug) }
        const demoData = template?.demo_data as DemoInvitationOverrides | null
        setEvent({
          ...demoEvent,
          ...(demoData ?? {}),
          ...(editorDraftRef.current ?? {}),
          is_demo: true,
          template_id: template?.id ?? templateSlug,
          event_templates: { slug: template?.slug ?? localMeta?.id ?? templateSlug },
        })
        return
      }
      setEvent(data)
    } catch (error) {
      console.error('Error fetching event:', error)
      if (slug?.startsWith('demo-')) {
        const templateSlug = slug.replace(/^demo-/, '')
        const localMeta = getTemplateMeta(templateSlug)
        setEvent({
          ...createDemoInvitationEvent(slug),
          ...getDemoInvitationDraft(slug),
          is_demo: true,
          template_id: templateSlug,
          event_templates: { slug: localMeta?.id ?? templateSlug },
        })
      }
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    void fetchEvent(true)

    // Keep an already-open preview in sync when an admin saves from another tab.
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void fetchEvent()
    }
    window.addEventListener('focus', refreshWhenVisible)
    document.addEventListener('visibilitychange', refreshWhenVisible)
    return () => {
      window.removeEventListener('focus', refreshWhenVisible)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [fetchEvent])

  useEffect(() => {
    const applyEditorDraft = (message: MessageEvent) => {
      if (message.source !== window.parent || message.origin !== window.location.origin) return
      if (searchParams.get('editorPreview') !== '1' || message.data?.type !== 'template:demo-draft' || !slug?.startsWith('demo-')) return
      if (message.data.slug !== slug.replace(/^demo-/, '') || !message.data.payload || typeof message.data.payload !== 'object') return
      editorDraftRef.current = message.data.payload as DemoInvitationOverrides
      setEvent((current) => current?.is_demo ? { ...current, ...editorDraftRef.current, is_demo: true } : current)
    }
    window.addEventListener('message', applyEditorDraft)
    return () => window.removeEventListener('message', applyEditorDraft)
  }, [searchParams, slug])

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-gray-900'>Undangan tidak ditemukan</h1>
          <p className='mt-2 text-gray-600'>Undangan ini mungkin tidak aktif atau sudah diarsipkan</p>
        </div>
      </div>
    )
  }

  return TemplateComponent ? (
    <Suspense
      fallback={
        <div className='min-h-screen flex items-center justify-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
        </div>
      }
    >
      <TemplateComponent event={event} guestName={guestName} />
    </Suspense>
  ) : null
}
