import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Save } from 'lucide-react'
import EventWorkspaceLayout from '@/components/layout/EventWorkspaceLayout'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/main'
import { getSaveErrorMessage, SUCCESS_MESSAGES } from '@/utils/errorMessages'

interface InvitationContentData {
  love_story: string
  quote: string
  video_url: string
}

const emptyContent: InvitationContentData = { love_story: '', quote: '', video_url: '' }

export default function InvitationContent() {
  const { id } = useParams()
  const [formData, setFormData] = useState(emptyContent)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [savedMessage, setSavedMessage] = useState('')

  useEffect(() => {
    if (id) void fetchContent()
  }, [id])

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('love_story, quote, video_url')
        .eq('id', id)
        .single()

      if (error) throw error
      setFormData({
        love_story: data.love_story || '',
        quote: data.quote || '',
        video_url: data.video_url || '',
      })
    } catch (error) {
      console.error('Error loading content:', error)
      setErrorMessage(getSaveErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!id) return
    setSaving(true)
    setErrorMessage('')
    setSavedMessage('')
    try {
      const { data, error } = await supabase.from('events').update(formData).eq('id', id).select('id').maybeSingle()
      if (error) throw error
      if (!data) throw new Error('Perubahan tidak tersimpan. Acara tidak ditemukan atau akun tidak memiliki akses admin.')
      
      // Invalidate React Query cache for this event
      await queryClient.invalidateQueries({ queryKey: ['event', id] })
      
      // Notify other tabs/windows (e.g., preview) that data was updated
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('event-updates')
        channel.postMessage({ type: 'event-updated', eventId: id })
        channel.close()
      }
      
      setSavedMessage(SUCCESS_MESSAGES.saved)
    } catch (error) {
      console.error('Error saving content:', error)
      setErrorMessage(getSaveErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <EventWorkspaceLayout><div className="flex justify-center py-12">Memuat...</div></EventWorkspaceLayout>
  }

  return (
    <EventWorkspaceLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editor Undangan</h1>
            <p className="mt-1 text-sm text-gray-500">Kelola cerita, kutipan, dan tautan live streaming.</p>
          </div>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex items-center rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>

        {errorMessage && (
          <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {errorMessage}
          </div>
        )}
        {savedMessage && (
          <div role="status" className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            {savedMessage}
          </div>
        )}

        <section className="space-y-4 border-t border-gray-200 py-5">
          <label className="block text-sm font-medium text-gray-700">
            Cerita pasangan
            <textarea
              rows={8}
              value={formData.love_story}
              onChange={(e) => setFormData({ ...formData, love_story: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Kutipan / doa
            <textarea
              rows={4}
              value={formData.quote}
              onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            URL video / live streaming
            <input
              type="url"
              value={formData.video_url}
              onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              placeholder="https://..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
        </section>
      </div>
    </EventWorkspaceLayout>
  )
}
