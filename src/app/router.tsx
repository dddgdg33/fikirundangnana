import type { ComponentType } from 'react'
import { createBrowserRouter, Outlet } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'

import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom'

function RouteError() {
  const error = useRouteError()
  let title = 'Terjadi Kesalahan'
  let message = 'Halaman yang Anda cari tidak dapat dimuat atau terjadi gangguan sistem.'

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = 'Halaman Tidak Ditemukan (404)'
      message = 'Maaf, alamat atau tautan undangan yang Anda buka tidak tersedia.'
    } else {
      title = `Kesalahan ${error.status}`
      message = error.statusText || message
    }
  } else if (error instanceof Error) {
    message = error.message
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-slate-200 space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xl">
          !
        </div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            to="/events"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Kembali ke Beranda Acara
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Halaman Utama
          </Link>
        </div>
      </div>
    </div>
  )
}

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
    </div>
  )
}

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <Outlet />
    </ProtectedRoute>
  )
}

/** Ubah default export halaman menjadi modul route lazy agar terpisah per chunk. */
function page(loader: () => Promise<{ default: ComponentType }>) {
  return async () => ({ Component: (await loader()).default })
}

export const router = createBrowserRouter([
  {
    element: <Outlet />,
    HydrateFallback: PageLoader,
    errorElement: <RouteError />,
    children: [
      { path: '/login', lazy: page(() => import('@/pages/auth/Login')) },
      // Event workspace routes - public access for editing
      { path: '/events/:id', lazy: page(() => import('@/pages/events/EventWorkspace')) },
      { path: '/events/:id/preview', lazy: page(() => import('@/pages/events/EventPreview')) },
      { path: '/events/:id/bride-groom', lazy: page(() => import('@/pages/events/BrideGroom')) },
      { path: '/events/:id/schedule', lazy: page(() => import('@/pages/events/Schedule')) },
      { path: '/events/:id/template', lazy: page(() => import('@/pages/events/TemplatePublish')) },
      { path: '/events/:id/publish', lazy: page(() => import('@/pages/events/TemplatePublish')) },
      { path: '/events/:id/gallery', lazy: page(() => import('@/pages/events/Gallery')) },
      { path: '/events/:id/music', lazy: page(() => import('@/pages/events/Music')) },
      { path: '/events/:id/gift', lazy: page(() => import('@/pages/events/Gift')) },
      { path: '/events/:id/editor', lazy: page(() => import('@/pages/events/InvitationContent')) },
      { path: '/events/:id/guests', lazy: page(() => import('@/pages/events/EventGuests')) },
      { path: '/events/:id/rsvp', lazy: page(() => import('@/pages/events/Rsvp')) },
      { path: '/events/:id/wishes', lazy: page(() => import('@/pages/events/Wishes')) },
      { path: '/events/:id/checkin', lazy: page(() => import('@/pages/events/Checkin')) },
      { path: '/events/:id/share-wa', lazy: page(() => import('@/pages/events/ShareWhatsApp')) },
      {
        element: <ProtectedLayout />,
        children: [
          { path: '/dashboard', lazy: page(() => import('@/pages/dashboard/Dashboard')) },
          { path: '/events', lazy: page(() => import('@/pages/events/EventsList')) },
          { path: '/events/create', lazy: page(() => import('@/pages/events/CreateEvent')) },
          { path: '/templates', lazy: page(() => import('@/pages/templates/Templates')) },
          { path: '/guests', lazy: page(() => import('@/pages/guests/Guests')) },
        ],
      },
      { path: '/undangan/:slug', lazy: page(() => import('@/pages/invitation/PublicInvitation')) },
      { path: '/', lazy: page(() => import('@/pages/home/Home')) },
      { path: '*', element: <RouteError /> },
    ],
  },
])
