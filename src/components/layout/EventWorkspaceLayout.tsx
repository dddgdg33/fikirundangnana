import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { 
  LayoutDashboard, Heart, Calendar, FileText, Image, Music, 
  Gift, Users, MessageSquare, QrCode, Settings, ArrowLeft, Menu, X, MessageCircle 
} from 'lucide-react'

const navigation = [
  { name: 'Ringkasan', href: '', icon: LayoutDashboard },
  { name: 'Data Pengantin', href: '/bride-groom', icon: Heart },
  { name: 'Informasi Acara', href: '/schedule', icon: Calendar },
  { name: 'Template', href: '/template', icon: FileText },
  { name: 'Editor Undangan', href: '/editor', icon: Settings },
  { name: 'Galeri Foto', href: '/gallery', icon: Image },
  { name: 'Musik', href: '/music', icon: Music },
  { name: 'Wedding Gift', href: '/gift', icon: Gift },
  { name: 'Daftar Tamu', href: '/guests', icon: Users },
  { name: 'RSVP', href: '/rsvp', icon: Heart },
  { name: 'Ucapan & Doa', href: '/wishes', icon: MessageSquare },
  { name: 'QR Check-in', href: '/checkin', icon: QrCode },
  { name: 'Share WhatsApp', href: '/share-wa', icon: MessageCircle },
  { name: 'Publikasi', href: '/publish', icon: Settings },
]

export default function EventWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams()
  const location = useLocation()
  const basePath = `/events/${id}`
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-slate-200 sticky top-0 z-40">
        <Link to="/events" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </Link>
        <span className="font-semibold text-slate-900 text-sm">Workspace Acara</span>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
          aria-label="Toggle workspace navigation"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-white border-r border-slate-200 flex flex-col shrink-0
        transform transition-transform duration-200 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between">
          <Link 
            to="/events" 
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
            <span>Kembali ke Semua Acara</span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Navigasi Acara
          </div>
          {navigation.map((item) => {
            const href = basePath + item.href
            const isActive = location.pathname === href || (item.href === '' && location.pathname === basePath)
            return (
              <Link
                key={item.name}
                to={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
