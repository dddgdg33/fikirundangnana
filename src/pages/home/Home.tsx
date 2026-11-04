import { ArrowRight, Check, Heart, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

const templates = [
  { name: 'Heritage Aruna', slug: 'heritage-aruna', label: 'Tradisional modern', image: '/templates/heritage-aruna/images/Aruna-Home-Fallback.webp' },
  { name: 'Heritage Sandhayu', slug: 'heritage-sandhayu', label: 'Nuansa alam', image: '/templates/heritage-sandhayu/images/Heritage-Sandhayu-IMG_6436.webp' },
  { name: 'Premium Danila', slug: 'premium-danila', label: 'Elegan', image: '/templates/premium-danila/screenshots/thumb.jpg' },
]

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fffdf9] text-slate-900">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight"><Heart className="h-5 w-5 fill-rose-500 text-rose-500" /> Attarivitation</Link>
        <nav aria-label="Navigasi utama" className="flex items-center gap-3">
          <Link to="/#koleksi" className="hidden rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white sm:block">Lihat template</Link>
          <Link to="/login" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-white">Masuk</Link>
          <Link to="/events/create" className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800">Buat undangan</Link>
        </nav>
      </header>

      <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:pb-28 lg:pt-20">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-white px-3 py-1.5 text-xs font-semibold text-rose-800"><Sparkles className="h-3.5 w-3.5" /> Momen istimewa, dibuat personal</span>
          <h1 className="mt-6 max-w-2xl font-serif text-5xl leading-[1.08] tracking-tight sm:text-6xl">Hari bahagia Anda, <span className="italic text-rose-700">diceritakan</span> dengan indah.</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">Buat undangan digital yang terasa seperti milik Anda. Pilih desain, isi kisah dan detail acara, lalu bagikan satu tautan kepada keluarga dan sahabat.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/events/create" className="inline-flex items-center gap-2 rounded-xl bg-rose-700 px-5 py-3 font-semibold text-white shadow-lg shadow-rose-900/10 hover:bg-rose-800">Mulai buat undangan <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/#koleksi" className="rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-800 hover:bg-slate-50">Jelajahi desain</Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
            {['Mudah disesuaikan', 'Bisa dibuka di ponsel', 'RSVP dalam satu tautan'].map((item) => <li key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-700" />{item}</li>)}
          </ul>
        </div>
        <div className="relative mx-auto w-full max-w-lg">
          <div className="absolute -inset-8 rounded-full bg-rose-100/70 blur-3xl" />
          <div className="relative grid grid-cols-2 gap-4">
            <img src="/templates/heritage-aruna/images/Aruna-Home-Fallback.webp" alt="Contoh tampilan undangan Heritage Aruna" className="mt-12 aspect-[3/4] w-full rounded-[2rem] object-cover shadow-2xl" />
            <div className="mt-0 flex flex-col gap-4">
              <div className="rounded-[2rem] bg-[#f1e9d8] p-6 shadow-xl"><p className="font-serif text-sm uppercase tracking-[.22em] text-rose-900">The wedding of</p><p className="mt-3 font-serif text-3xl text-slate-800">Nadia <span className="italic text-rose-700">&amp;</span> Rangga</p><div className="mt-6 h-px bg-rose-900/20" /><p className="mt-5 text-sm leading-6 text-slate-600">Sebuah hari, sebuah cerita, dan orang-orang tersayang yang merayakannya bersama.</p></div>
              <img src="/templates/heritage-sandhayu/images/Heritage-Sandhayu-IMG_6436.webp" alt="Contoh desain undangan bernuansa alam" className="aspect-[4/3] w-full rounded-[2rem] object-cover shadow-xl" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-rose-100 bg-white/70 px-5 py-16 sm:px-8">
        <div id="koleksi" className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[.2em] text-rose-700">Koleksi pilihan</p><h2 className="mt-2 font-serif text-3xl sm:text-4xl">Pilih cerita visual Anda</h2></div><Link to="/#koleksi" className="inline-flex items-center gap-2 text-sm font-semibold text-rose-800">Lihat semua template <ArrowRight className="h-4 w-4" /></Link></div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{templates.map((template) => <article key={template.slug} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><img src={template.image || `/templates/${template.slug}/screenshots/thumb.jpg`} alt={`Preview ${template.name}`} className="aspect-[4/3] w-full object-cover" /><div className="flex items-center justify-between p-4"><div><h3 className="font-semibold">{template.name}</h3><p className="mt-1 text-sm text-slate-500">{template.label}</p></div><a href={`/undangan/demo-${template.slug}`} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50">Preview</a></div></article>)}</div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20"><h2 className="text-center font-serif text-3xl sm:text-4xl">Tiga langkah menuju hari bahagia</h2><div className="mt-10 grid gap-8 md:grid-cols-3">{[['01', 'Pilih desain', 'Temukan template yang cocok dengan suasana acara Anda.'], ['02', 'Isi detail acara', 'Tambahkan cerita, jadwal, lokasi, foto, dan informasi tamu.'], ['03', 'Bagikan tautan', 'Simpan undangan dan bagikan kepada orang-orang tersayang.']].map(([number, title, text]) => <div key={number} className="rounded-2xl border border-rose-100 bg-white p-6"><span className="font-serif text-3xl text-rose-300">{number}</span><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></div>)}</div></section>
      <footer className="bg-slate-950 px-5 py-10 text-white sm:px-8"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4"><span className="font-semibold">Attarivitation</span><span className="text-sm text-slate-400">Undangan digital untuk momen yang tak terlupakan</span><Link to="/events/create" className="text-sm font-semibold text-rose-200 hover:text-white">Buat undangan <ArrowRight className="ml-1 inline h-4 w-4" /></Link></div></footer>
    </main>
  )
}
