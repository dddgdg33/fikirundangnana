import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Save } from 'lucide-react'
import EventWorkspaceLayout from '@/components/layout/EventWorkspaceLayout'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/main'
import { getSaveErrorMessage, getUploadErrorMessage, SUCCESS_MESSAGES } from '@/utils/errorMessages'

export default function BrideGroom() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState<'bride_photo' | 'groom_photo' | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [formData, setFormData] = useState({
    bride_name: '', bride_nick: '', bride_photo: '', bride_father: '', bride_mother: '', bride_ig: '',
    groom_name: '', groom_nick: '', groom_photo: '', groom_father: '', groom_mother: '', groom_ig: '',
  })

  useEffect(() => {
    if (id) fetchEvent()
  }, [id])

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('bride_name, bride_nick, bride_photo, bride_father, bride_mother, bride_ig, groom_name, groom_nick, groom_photo, groom_father, groom_mother, groom_ig')
        .eq('id', id)
        .single()

      if (error) throw error
      setFormData({
        bride_name: data.bride_name || '', bride_nick: data.bride_nick || '', bride_photo: data.bride_photo || '',
        bride_father: data.bride_father || '', bride_mother: data.bride_mother || '', bride_ig: data.bride_ig || '',
        groom_name: data.groom_name || '', groom_nick: data.groom_nick || '', groom_photo: data.groom_photo || '',
        groom_father: data.groom_father || '', groom_mother: data.groom_mother || '', groom_ig: data.groom_ig || '',
      })
    } catch (error) {
      console.error('Error loading event:', error)
      setErrorMessage(getSaveErrorMessage(error))
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
        .update(formData)
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
      console.error('Error saving:', error)
      setErrorMessage(getSaveErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (field: 'bride_photo' | 'groom_photo', file?: File) => {
    if (!file || !id) return
    setErrorMessage('')
    setSuccessMessage('')

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMessage('Format file tidak didukung. Gunakan JPG, PNG, atau WebP.')
      return
    }
    
    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Ukuran gambar maksimal 10 MB.')
      return
    }

    setUploadingPhoto(field)
    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${id}/${field}/${crypto.randomUUID()}.${extension}`
      const { data, error } = await supabase.storage
        .from('event-media')
        .upload(path, file, { cacheControl: '3600', contentType: file.type })

      if (error) throw error

      const { data: publicUrl } = supabase.storage.from('event-media').getPublicUrl(data.path)
      setFormData((current) => ({ ...current, [field]: publicUrl.publicUrl }))
      setSuccessMessage(SUCCESS_MESSAGES.uploaded)
    } catch (error) {
      console.error('Error uploading photo:', error)
      setErrorMessage(getUploadErrorMessage(error))
    } finally {
      setUploadingPhoto(null)
    }
  }

  if (loading) {
    return <EventWorkspaceLayout><div className="flex justify-center py-12">Memuat data...</div></EventWorkspaceLayout>
  }

  return (
    <EventWorkspaceLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Data Pengantin</h1>
            <p className="mt-1 text-sm text-gray-500">Kelola data mempelai pria dan wanita</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || uploadingPhoto !== null}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Mempelai Pria</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
              <input
                type="text"
                value={formData.groom_name}
                onChange={(e) => setFormData({ ...formData, groom_name: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nama Panggilan</label>
              <input
                type="text"
                value={formData.groom_nick}
                onChange={(e) => setFormData({ ...formData, groom_nick: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Foto Mempelai Pria</label>
              {formData.groom_photo && <img src={formData.groom_photo} alt="Foto mempelai pria" className="mt-2 h-24 w-24 rounded object-cover" />}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => void handlePhotoUpload('groom_photo', e.currentTarget.files?.[0])}
                disabled={uploadingPhoto !== null}
                className="mt-2 block w-full text-sm text-gray-700"
              />
              {uploadingPhoto === 'groom_photo' && <p className="mt-1 text-sm text-gray-500">Mengunggah foto...</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nama Ayah</label>
              <input
                type="text"
                value={formData.groom_father}
                onChange={(e) => setFormData({ ...formData, groom_father: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nama Ibu</label>
              <input
                type="text"
                value={formData.groom_mother}
                onChange={(e) => setFormData({ ...formData, groom_mother: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Instagram</label>
              <input
                type="text"
                value={formData.groom_ig}
                onChange={(e) => setFormData({ ...formData, groom_ig: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Mempelai Wanita</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
              <input
                type="text"
                value={formData.bride_name}
                onChange={(e) => setFormData({ ...formData, bride_name: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nama Panggilan</label>
              <input
                type="text"
                value={formData.bride_nick}
                onChange={(e) => setFormData({ ...formData, bride_nick: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Foto Mempelai Wanita</label>
              {formData.bride_photo && <img src={formData.bride_photo} alt="Foto mempelai wanita" className="mt-2 h-24 w-24 rounded object-cover" />}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => void handlePhotoUpload('bride_photo', e.currentTarget.files?.[0])}
                disabled={uploadingPhoto !== null}
                className="mt-2 block w-full text-sm text-gray-700"
              />
              {uploadingPhoto === 'bride_photo' && <p className="mt-1 text-sm text-gray-500">Mengunggah foto...</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nama Ayah</label>
              <input
                type="text"
                value={formData.bride_father}
                onChange={(e) => setFormData({ ...formData, bride_father: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nama Ibu</label>
              <input
                type="text"
                value={formData.bride_mother}
                onChange={(e) => setFormData({ ...formData, bride_mother: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Instagram</label>
              <input
                type="text"
                value={formData.bride_ig}
                onChange={(e) => setFormData({ ...formData, bride_ig: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
      </div>
    </EventWorkspaceLayout>
  )
}
