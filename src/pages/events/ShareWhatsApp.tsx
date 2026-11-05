import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MessageCircle, Copy, Save, Users, ArrowLeft } from 'lucide-react'
import EventWorkspaceLayout from '@/components/layout/EventWorkspaceLayout'
import { supabase } from '@/lib/supabase'
import { Event } from '@/types'

interface GuestEntry {
  name: string
  link: string
}

const MESSAGE_TEMPLATES = [
  {
    id: 'formal',
    name: 'Formal',
    template: 'Kepada Yth. {name}\n\nTanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i untuk hadir di acara pernikahan kami.\n\nUndangan lengkap dapat dilihat melalui tautan berikut:\n{link}\n\nMohon maaf apabila ada kesalahan penulisan nama/gelar.\n\nTerima kasih.',
  },
  {
    id: 'casual',
    name: 'Casual',
    template: 'Halo {name}! 👋\n\nKami akan segera menikah dan sangat ingin kehadiranmu di hari bahagia kami!\n\nCek undangan lengkapnya di sini ya:\n{link}\n\nJangan lupa save the date ya! 💕',
  },
  {
    id: 'islamic',
    name: 'Islami',
    template: 'Assalamualaikum {name}\n\nDengan memohon Rahmat dan Ridho Allah SWT, kami bermaksud menyelenggarakan acara pernikahan kami.\n\nKami mengharapkan kehadiran Bapak/Ibu/Saudara/i untuk memberikan doa restu.\n\nUndangan digital dapat diakses melalui:\n{link}\n\nWassalamualaikum Warahmatullahi Wabarakatuh.',
  },
  {
    id: 'short',
    name: 'Singkat',
    template: 'Hai {name}!\n\nUndangan pernikahan kami:\n{link}\n\nMohon doa restu ya! ❤️',
  },
]

export default function ShareWhatsApp() {
  const { id } = useParams()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [guestNames, setGuestNames] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('formal')
  const [guestList, setGuestList] = useState<GuestEntry[]>([])
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (id) fetchEvent()
  }, [id])

  const fetchEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setEvent(data)
    } catch (error) {
      console.error('Error fetching event:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (guestNames.trim()) {
      const names = guestNames.split('\n').filter(n => n.trim())
      const invitationLink = event?.slug
        ? `${window.location.origin}/undangan/${event.slug}`
        : ''

      const list: GuestEntry[] = names.map(name => ({
        name: name.trim(),
        link: `${invitationLink}?to=${encodeURIComponent(name.trim())}`,
      }))
      setGuestList(list)
    } else {
      setGuestList([])
    }
  }, [guestNames, event])

  const generateWhatsAppLink = (guest: GuestEntry) => {
    const template = MESSAGE_TEMPLATES.find(t => t.id === selectedTemplate)
    if (!template) return '#'

    const message = template.template
      .replace('{name}', guest.name)
      .replace('{link}', guest.link)

    const encodedMessage = encodeURIComponent(message)
    return `https://wa.me/?text=${encodedMessage}`
  }

  const handleCopyLink = (guest: GuestEntry) => {
    const template = MESSAGE_TEMPLATES.find(t => t.id === selectedTemplate)
    if (!template) return

    const message = template.template
      .replace('{name}', guest.name)
      .replace('{link}', guest.link)

    navigator.clipboard.writeText(message)
    alert('Pesan berhasil disalin!')
  }

  const handleSave = async () => {
    if (!id || guestList.length === 0) return

    try {
      // Delete existing guests for this event
      await supabase.from('event_guests').delete().eq('event_id', id)

      // Insert new guests
      const guestsToInsert = guestList.map(guest => ({
        event_id: id,
        name: guest.name,
        invitation_link: guest.link,
      }))

      const { error } = await supabase.from('event_guests').insert(guestsToInsert)

      if (error) throw error

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving guests:', error)
      alert('Gagal menyimpan data tamu')
    }
  }

  if (loading) {
    return (
      <EventWorkspaceLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </EventWorkspaceLayout>
    )
  }

  if (!event) {
    return (
      <EventWorkspaceLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">Acara tidak ditemukan</h2>
        </div>
      </EventWorkspaceLayout>
    )
  }

  return (
    <EventWorkspaceLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <Link
              to={`/events/${event.id}`}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Kembali ke Workspace
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Share Undangan via WhatsApp</h1>
            <p className="mt-1 text-sm text-gray-500">
              Generate link WhatsApp untuk setiap tamu dengan nama personal
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={guestList.length === 0}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {saved ? 'Tersimpan!' : 'Simpan Tamu'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-white shadow rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Daftar Nama Tamu
              </h2>
              <p className="text-sm text-gray-500">
                Masukkan nama tamu, satu nama per baris (Enter untuk baris baru)
              </p>
              <textarea
                value={guestNames}
                onChange={(e) => setGuestNames(e.target.value)}
                placeholder="Contoh:&#10;Budi Santoso&#10;Siti Aminah&#10;Ahmad Wijaya"
                rows={15}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="text-sm text-gray-600">
                Total: {guestList.length} tamu
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                Pilih Template Ucapan
              </h2>
              <div className="space-y-2">
                {MESSAGE_TEMPLATES.map((template) => (
                  <label
                    key={template.id}
                    className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                      selectedTemplate === template.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="template"
                      value={template.id}
                      checked={selectedTemplate === template.id}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{template.name}</div>
                      <div className="text-sm text-gray-500 mt-1 whitespace-pre-line">
                        {template.template
                          .replace('{name}', '[Nama Tamu]')
                          .replace('{link}', '[Link Undangan]')}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Tombol Share WhatsApp</h2>
            <p className="text-sm text-gray-500">
              Klik tombol WhatsApp untuk langsung membuka aplikasi WhatsApp dengan pesan yang sudah terisi
            </p>

            {guestList.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Belum ada nama tamu. Masukkan nama di kolom sebelah kiri.
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {guestList.map((guest, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{guest.name}</div>
                      <div className="text-xs text-gray-500 truncate">{guest.link}</div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleCopyLink(guest)}
                        className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        title="Salin pesan"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <a
                        href={generateWhatsAppLink(guest)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        WA
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </EventWorkspaceLayout>
  )
}
