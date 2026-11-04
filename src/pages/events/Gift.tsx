import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Save } from 'lucide-react'
import EventWorkspaceLayout from '@/components/layout/EventWorkspaceLayout'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/main'
import { getSaveErrorMessage, SUCCESS_MESSAGES } from '@/utils/errorMessages'

interface GiftFormData {
  gift_bank_name: string
  gift_account_number: string
  gift_account_holder: string
  gift_address: string
  gift_recipient: string
  gift_wa: string
}

const emptyForm: GiftFormData = {
  gift_bank_name: '',
  gift_account_number: '',
  gift_account_holder: '',
  gift_address: '',
  gift_recipient: '',
  gift_wa: '',
}

export default function Gift() {
  const { id } = useParams()
  const [formData, setFormData] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [savedMessage, setSavedMessage] = useState('')

  useEffect(() => {
    if (id) void fetchGiftDetails()
  }, [id])

  const fetchGiftDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('gift_bank_name, gift_account_number, gift_account_holder, gift_address, gift_recipient, gift_wa')
        .eq('id', id)
        .single()

      if (error) throw error
      setFormData({
        gift_bank_name: data.gift_bank_name || '',
        gift_account_number: data.gift_account_number || '',
        gift_account_holder: data.gift_account_holder || '',
        gift_address: data.gift_address || '',
        gift_recipient: data.gift_recipient || '',
        gift_wa: data.gift_wa || '',
      })
    } catch (error) {
      console.error('Error fetching gift details:', error)
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
      console.error('Error saving gift data:', error)
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
            <h1 className="text-2xl font-bold text-gray-900">Wedding Gift</h1>
            <p className="mt-1 text-sm text-gray-500">Atur rekening dan informasi pengiriman hadiah.</p>
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
          <h2 className="text-lg font-medium text-gray-900">Rekening</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="block text-sm font-medium text-gray-700">
              Bank / E-wallet
              <input
                value={formData.gift_bank_name}
                onChange={(e) => setFormData({ ...formData, gift_bank_name: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Nomor rekening
              <input
                inputMode="numeric"
                value={formData.gift_account_number}
                onChange={(e) => setFormData({ ...formData, gift_account_number: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Nama pemilik rekening
              <input
                value={formData.gift_account_holder}
                onChange={(e) => setFormData({ ...formData, gift_account_holder: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
          </div>
        </section>

        <section className="space-y-4 border-t border-gray-200 py-5">
          <h2 className="text-lg font-medium text-gray-900">Pengiriman hadiah</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-gray-700">
              Nama penerima
              <input
                value={formData.gift_recipient}
                onChange={(e) => setFormData({ ...formData, gift_recipient: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              WhatsApp penerima
              <input
                type="tel"
                value={formData.gift_wa}
                onChange={(e) => setFormData({ ...formData, gift_wa: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
          </div>
          <label className="block text-sm font-medium text-gray-700">
            Alamat pengiriman
            <textarea
              rows={3}
              value={formData.gift_address}
              onChange={(e) => setFormData({ ...formData, gift_address: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
        </section>
      </div>
    </EventWorkspaceLayout>
  )
}
