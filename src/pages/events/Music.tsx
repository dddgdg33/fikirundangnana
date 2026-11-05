import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Save, Upload, X, Music as MusicIcon } from 'lucide-react'
import EventWorkspaceLayout from '@/components/layout/EventWorkspaceLayout'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/main'
import { getSaveErrorMessage, getUploadErrorMessage, SUCCESS_MESSAGES } from '@/utils/errorMessages'

export default function Music() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [musicUrl, setMusicUrl] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (id) fetchEvent()
  }, [id])

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('music_url')
        .eq('id', id)
        .single()

      if (error) throw error
      setMusicUrl(data.music_url || '')
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      const { data, error } = await supabase
        .from('events')
        .update({ music_url: musicUrl })
        .eq('id', id)
        .select('id')
        .maybeSingle()

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

      setSuccessMessage(SUCCESS_MESSAGES.saved)
    } catch (error) {
      console.error('Error saving music:', error)
      setErrorMessage(getSaveErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const handleMusicUpload = async (file?: File) => {
    if (!file || !id) return
    setErrorMessage('')
    setSuccessMessage('')

    // Validate file type
    if (!['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'].includes(file.type)) {
      setErrorMessage('Format file tidak didukung. Gunakan MP3, WAV, OGG, atau M4A.')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Ukuran file maksimal 10 MB.')
      return
    }

    setUploading(true)
    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'mp3'
      const path = `${id}/music/${crypto.randomUUID()}.${extension}`
      const { data, error } = await supabase.storage
        .from('event-media')
        .upload(path, file, { cacheControl: '3600', contentType: file.type })

      if (error) throw error

      const { data: publicUrl } = supabase.storage.from('event-media').getPublicUrl(data.path)
      setMusicUrl(publicUrl.publicUrl)
      setSuccessMessage(SUCCESS_MESSAGES.uploaded)
    } catch (error) {
      console.error('Error uploading music:', error)
      setErrorMessage(getUploadErrorMessage(error))
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveMusic = () => {
    setMusicUrl('')
    setSuccessMessage('')
  }

  if (loading) {
    return <EventWorkspaceLayout><div className="flex justify-center py-12">Memuat data...</div></EventWorkspaceLayout>
  }

  return (
    <EventWorkspaceLayout>
      <div className="space-y-6">
        {errorMessage && (
          <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div role="status" className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            {successMessage}
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Musik Latar</h1>
            <p className="mt-1 text-sm text-gray-500">Atur musik pengiring undangan</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload File Audio</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => void handleMusicUpload(e.currentTarget.files?.[0])}
                disabled={uploading}
                className="hidden"
                id="music-upload"
              />
              <label
                htmlFor="music-upload"
                className="cursor-pointer inline-flex flex-col items-center"
              >
                <Upload className="w-10 h-10 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  {uploading ? 'Mengunggah...' : 'Klik untuk upload file audio'}
                </span>
                <span className="text-xs text-gray-400 mt-1">MP3, WAV, OGG, M4A (max 10MB)</span>
              </label>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">atau gunakan URL</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">URL Musik (MP3/YouTube)</label>
            <input
              type="url"
              value={musicUrl}
              onChange={(e) => setMusicUrl(e.target.value)}
              placeholder="https://example.com/music.mp3"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <p className="mt-1 text-sm text-gray-500">Masukkan URL file audio atau YouTube</p>
          </div>

          {musicUrl && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MusicIcon className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-medium text-gray-900">Preview Musik</span>
                </div>
                <button
                  onClick={handleRemoveMusic}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Hapus
                </button>
              </div>
              <audio controls className="w-full" src={musicUrl}>
                Browser Anda tidak mendukung elemen audio.
              </audio>
            </div>
          )}
        </div>
      </div>
    </EventWorkspaceLayout>
  )
}
