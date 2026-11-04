import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Save, Plus, Trash2 } from 'lucide-react'
import EventWorkspaceLayout from '@/components/layout/EventWorkspaceLayout'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/main'
import { getSaveErrorMessage, getUploadErrorMessage, SUCCESS_MESSAGES } from '@/utils/errorMessages'

export default function Gallery() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [gallery, setGallery] = useState<string[]>([])
  const [preweddingPhotos, setPreweddingPhotos] = useState<string[]>([])
  const [activeCollection, setActiveCollection] = useState<'gallery' | 'prewedding_photos'>('gallery')
  const [newUrl, setNewUrl] = useState('')

  const activePhotos = activeCollection === 'gallery' ? gallery : preweddingPhotos
  const totalPhotos = gallery.length + preweddingPhotos.length

  useEffect(() => {
    if (id) fetchEvent()
  }, [id])

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('gallery, prewedding_photos')
        .eq('id', id)
        .single()

      if (error) throw error
      setGallery(Array.isArray(data.gallery) ? data.gallery : [])
      setPreweddingPhotos(Array.isArray(data.prewedding_photos) ? data.prewedding_photos : [])
    } catch (error) {
      console.error('Error loading gallery:', error)
      setErrorMessage(getSaveErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  const addImage = () => {
    if (!newUrl.trim()) return
    if (totalPhotos >= 10) {
      setErrorMessage('Template ini menampilkan maksimal 10 foto galeri dan prewedding.')
      return
    }
    setErrorMessage('')
    setSuccessMessage('')
    if (activeCollection === 'gallery') setGallery((current) => [...current, newUrl.trim()])
    else setPreweddingPhotos((current) => [...current, newUrl.trim()])
    setNewUrl('')
  }

  const uploadImages = async (files: FileList | null) => {
    if (!files || !id) return
    setErrorMessage('')
    setSuccessMessage('')
    const selectedFiles = Array.from(files)
    
    // Validate total count
    if (totalPhotos + selectedFiles.length > 10) {
      setErrorMessage('Template ini menampilkan maksimal 10 foto galeri dan prewedding.')
      return
    }
    
    // Validate file types and sizes
    const invalidFile = selectedFiles.find((file) =>
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
    )
    if (invalidFile) {
      setErrorMessage('Format file tidak didukung. Gunakan JPG, PNG, atau WebP.')
      return
    }
    
    const oversizedFile = selectedFiles.find((file) => file.size > 10 * 1024 * 1024)
    if (oversizedFile) {
      setErrorMessage(`File ${oversizedFile.name} terlalu besar. Maksimal 10 MB per file.`)
      return
    }

    setUploading(true)
    try {
      const uploadedUrls: string[] = []
      for (const file of selectedFiles) {
        const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const path = `${id}/${activeCollection}/${crypto.randomUUID()}.${extension}`
        const { data, error } = await supabase.storage
          .from('event-media')
          .upload(path, file, { cacheControl: '3600', contentType: file.type })
        if (error) throw error

        const { data: publicUrl } = supabase.storage.from('event-media').getPublicUrl(data.path)
        uploadedUrls.push(publicUrl.publicUrl)
      }
      if (activeCollection === 'gallery') setGallery((current) => [...current, ...uploadedUrls])
      else setPreweddingPhotos((current) => [...current, ...uploadedUrls])
      setSuccessMessage(`${uploadedUrls.length} foto berhasil diunggah.`)
    } catch (error) {
      console.error('Error uploading images:', error)
      setErrorMessage(getUploadErrorMessage(error))
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    if (activeCollection === 'gallery') setGallery((current) => current.filter((_, i) => i !== index))
    else setPreweddingPhotos((current) => current.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setSaving(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      const { data, error } = await supabase
        .from('events')
        .update({ gallery, prewedding_photos: preweddingPhotos })
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
      console.error('Error saving gallery:', error)
      setErrorMessage(getSaveErrorMessage(error))
    } finally {
      setSaving(false)
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
            <h1 className="text-2xl font-bold text-gray-900">Galeri Foto</h1>
            <p className="mt-1 text-sm text-gray-500">Kelola foto galeri undangan</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
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

        <div className="bg-white shadow rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2" role="group" aria-label="Jenis foto">
            <button
              type="button"
              onClick={() => setActiveCollection('gallery')}
              aria-pressed={activeCollection === 'gallery'}
              className={`rounded-md border px-3 py-2 text-sm ${activeCollection === 'gallery' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-300 text-gray-700'}`}
            >
              Galeri ({gallery.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCollection('prewedding_photos')}
              aria-pressed={activeCollection === 'prewedding_photos'}
              className={`rounded-md border px-3 py-2 text-sm ${activeCollection === 'prewedding_photos' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-300 text-gray-700'}`}
            >
              Foto Prewedding ({preweddingPhotos.length})
            </button>
            <span className="ml-auto text-sm text-gray-500">{totalPhotos}/10 foto</span>
          </div>

          <div className="flex space-x-2">
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={addImage}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah
            </button>
          </div>

          <label className="block text-sm font-medium text-gray-700">
            Upload foto
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => void uploadImages(e.currentTarget.files)}
              disabled={uploading}
              className="mt-2 block w-full text-sm text-gray-700"
            />
          </label>
          {uploading && <p className="text-sm text-gray-500">Mengunggah foto...</p>}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {activePhotos.map((url, index) => (
              <div key={`${activeCollection}-${url}-${index}`} className="relative group">
                <img src={url} alt={`Gallery ${index}`} className="w-full h-32 object-cover rounded" />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </EventWorkspaceLayout>
  )
}
