# Rencana Implementasi: Overhaul Aplikasi Undangan Digital

## Ringkasan Eksekutif

Aplikasi undangan digital berbasis React + TypeScript + Supabase dengan 9 template HTML yang dirender melalui iframe dan komunikasi postMessage. Template Heritage Aruna sudah berfungsi sebagai acuan. Investigasi menemukan arsitektur yang solid namun ada gap implementasi pada:

1. **Template editor**: Form edit template belum memuat data terbaru dari Supabase
2. **Alur pembuatan event**: Sudah lengkap dan berfungsi baik
3. **Preview sync**: Preview tidak refresh otomatis setelah save
4. **Home page**: Sudah ada dan fungsional
5. **Upload & Storage**: Sudah terintegrasi dengan Supabase Storage

## Arsitektur Aplikasi

### Stack Teknologi
- **Frontend**: React 19, TypeScript 7, Vite 8, TailwindCSS
- **Routing**: React Router 7
- **State**: TanStack Query (React Query), Context API untuk auth
- **Backend**: Supabase (PostgreSQL + RLS + Storage + Auth)
- **Build**: `npm run build`, TypeScript compiler + Vite build
- **Test**: `npm test` (Node test runner dengan --experimental-strip-types)
- **Lint**: `oxlint`

### Struktur Direktori

```
d:/pikiri/app/
├── src/
│   ├── app/                      # Router configuration
│   ├── pages/                    # Route components
│   │   ├── auth/                 # Login
│   │   ├── dashboard/            # Dashboard
│   │   ├── events/               # Event CRUD & editor pages
│   │   ├── guests/               # Guest management
│   │   ├── home/                 # Public home page ✓
│   │   ├── invitation/           # Public invitation viewer
│   │   └── templates/            # Admin template editor
│   ├── components/               # Reusable UI components
│   ├── invitation-engine/        # Template rendering system
│   │   ├── templates/            # React wrappers (Heritage*.tsx, Premium*.tsx)
│   │   ├── registry.tsx          # Template registry
│   │   └── types.ts              # Template props interface
│   ├── hooks/                    # useAuth, custom hooks
│   ├── lib/                      # Supabase client
│   ├── services/                 # API services
│   ├── utils/                    # Helper functions
│   └── types/                    # TypeScript types
├── public/
│   └── templates/                # Template HTML files
│       ├── _shared/
│       │   └── invitation-bridge.js  # PostMessage communication
│       └── [template-slug]/
│           └── html/
│               ├── rendered.html     # Scraped template HTML
│               └── source.html       # (optional reference)
├── supabase/
│   ├── schema.sql                # Database schema
│   ├── migrations/               # Schema migrations
│   └── seed-templates.sql        # Template seed data
└── package.json
```

### Alur Data Template

1. **Template Registry**: `src/invitation-engine/registry.tsx` berisi 9 template aktif
2. **Database**: `event_templates` table menyimpan UUID, slug, category, active, demo_data (JSONB)
3. **HTML Files**: `public/templates/[slug]/html/rendered.html` berisi HTML hasil scrape
4. **Bridge**: `invitation-bridge.js` menangani postMessage untuk inject data ke iframe
5. **Template Wrapper**: `TemplateFrame.tsx` membungkus iframe dan mengirim data event
6. **Field Mapping**: `templateCapabilities.ts` mengekstrak field yang didukung dari HTML

### Template yang Tersedia

**Heritage Series** (3 template):
- Heritage Aruna ✓ (Reference - berfungsi sempurna)
- Heritage Sandhayu
- Heritage Utary

**Premium Series** (6 template):
- Premium 01, 02
- Premium Danila, Flara, Ivanna, Kila

### Field Template yang Didukung

Berdasarkan `data-template-*` attributes dalam HTML:
- **Couple**: bride_name, bride_nick, bride_photo, bride_father, bride_mother, bride_ig
- **Couple**: groom_name, groom_nick, groom_photo, groom_father, groom_mother, groom_ig
- **Schedule**: akad_date, akad_time, akad_location, reception_date, reception_time, reception_location
- **Location**: address, maps_url
- **Content**: cover_message, love_story, quote, video_url, music_url, dress_code
- **Photos**: cover_photo, feature_photo, gift_photo, gallery (array)
- **Gift**: gift_bank_name, gift_account_number, gift_account_holder, gift_address, gift_recipient, gift_wa
- **RSVP**: Form handled by bridge script

## Inventaris Template

### Template HTML Location
- Path: `d:/pikiri/app/public/templates/[slug]/html/rendered.html`
- Bridge: `d:/pikiri/app/public/templates/_shared/invitation-bridge.js`
- Screenshots: `d:/pikiri/app/public/templates/[slug]/screenshots/full-page.png`

### Field Support Matrix

Template capabilities are dynamically extracted using `getSupportedTemplateFields()`:
- Scans `data-template-field="*"` for text fields
- Scans `data-template-image="*"` for image fields
- Scans `data-template-href="*"` for link fields
- Special markers: `data-template-couple`, `data-template-gallery`, `data-template-music`

### Template Communication Flow

```
React App (TemplateFrame.tsx)
    ↓ postMessage({ type: 'invitation:data', payload: {...} })
iframe (rendered.html + invitation-bridge.js)
    ↓ Listen for 'invitation:data'
    ↓ Apply data to [data-template-*] elements
    ↓ postMessage({ type: 'invitation:ready' }) on load
React App
    ↓ Re-send data on 'invitation:ready'
```

## Masalah Teridentifikasi

### 1. Template Demo Editor (Templates.tsx) ❌
**Lokasi**: `src/pages/templates/Templates.tsx`

**Masalah**:
- Form edit template demo tidak memuat `demo_data` dari Supabase saat pertama dibuka
- `openEditor()` memuat data tapi ada race condition dengan `draftLoadId`
- Preview iframe tidak selalu sync dengan form
- Error handling kurang informatif

**Dampak**: Admin tidak bisa edit contoh template dengan mudah

**Root Cause**: 
- Async data loading tidak konsisten
- Preview refresh logic bergantung pada postMessage manual

### 2. Preview Tidak Update Setelah Save ⚠️
**Lokasi**: Multiple editor pages (BrideGroom, Gallery, Schedule, InvitationContent)

**Masalah**:
- Save berhasil ke Supabase
- Preview iframe menampilkan data lama sampai manual refresh
- No cache invalidation strategy

**Dampak**: User mengira data tidak tersimpan

**Root Cause**:
- Preview iframe tidak reload setelah mutation success
- React Query cache tidak invalidated
- PostMessage re-send tidak triggered

### 3. Upload Image Handling ⚠️
**Lokasi**: BrideGroom.tsx, Gallery.tsx, Templates.tsx

**Masalah Yang Sudah Fixed**:
- Upload sudah ke Supabase Storage ✓
- Error handling untuk ukuran/tipe file ✓
- Public URL generation ✓

**Masalah Minor**:
- Tidak ada image preview sebelum upload
- Tidak ada compression untuk image >2MB
- Loading state kurang jelas

### 4. Event Creation Flow ✓
**Lokasi**: `src/pages/events/CreateEvent.tsx`

**Status**: **SUDAH BERFUNGSI DENGAN BAIK**
- Template selection ✓
- Slug generation & validation ✓
- Form validation ✓
- Database insert ✓
- Navigation ke event workspace ✓

### 5. CRUD Operations ✓
**Status**: **SEBAGIAN BESAR SUDAH BAIK**

**Sudah Berfungsi**:
- Events CRUD ✓
- BrideGroom data ✓
- Schedule (akad/reception) ✓
- Gallery upload ✓
- Music URL ✓
- Gift info ✓
- InvitationContent (love_story, quote, video) ✓

**Perlu Perbaikan**:
- Preview sync setelah save
- Error messaging consistency
- Loading states

### 6. RLS & Permissions ✓
**Status**: **SUDAH BENAR**

RLS policies dari `supabase/schema.sql`:
- `admin_profiles`: Admin can read own profile ✓
- `event_templates`: Admins manage, public read active ✓
- `events`: Admins manage, public read published ✓
- `event_guests`: Admins manage ✓
- `event_rsvps`: Admins manage, public insert ✓
- `event_wishes`: Admins manage, public insert & read approved ✓
- `event_checkins`: Admins manage ✓

**Note**: Check if Storage bucket `event-media` has correct policies.

### 7. Public Home Page ✓
**Lokasi**: `src/pages/home/Home.tsx`

**Status**: **SUDAH ADA DAN FUNGSIONAL**
- Hero section ✓
- Template showcase ✓
- CTA buttons ✓
- Responsive ✓
- Links to `/events/create` and `/login` ✓

## Keputusan Arsitektur

### 1. Template Rendering: Iframe + PostMessage (Keep Current) ✓
**Rationale**: Template HTML adalah hasil scrape dari WordPress/Elementor. Iframe sandbox mencegah style/script collision dan memberikan isolasi sempurna. PostMessage bridge sudah mature dan bekerja dengan baik.

**Alternative Rejected**: 
- Parse HTML to React components (too fragile, high maintenance)
- Inline HTML with dangerouslySetInnerHTML (security risk, style conflicts)

### 2. Preview Sync: React Query Invalidation + Force Reload
**Decision**: Setelah mutation success, invalidate queries DAN force reload preview iframe dengan query param timestamp.

**Implementation**:
```typescript
// After successful save
queryClient.invalidateQueries(['event', id])
previewRef.current?.contentWindow?.location.reload()
// OR
previewRef.current?.src = `${baseUrl}?t=${Date.now()}`
```

### 3. Image Upload: Supabase Storage (Keep Current) ✓
**Decision**: Keep current Supabase Storage integration. Add optional client-side compression for images >2MB.

**Storage Path Pattern**: `{event_id}/{field}/{uuid}.{ext}`

### 4. Template Demo Data: JSONB in event_templates.demo_data ✓
**Decision**: Store template demo overrides in `demo_data` JSONB column. This allows per-template customization without creating dummy events.

### 5. Field Validation: Runtime Discovery from HTML
**Decision**: Use `getSupportedTemplateFields()` to dynamically discover which fields each template supports. Display only supported fields in editor.

**Rationale**: Templates have different layouts. Some don't have parents' names, some don't have gift section. Runtime discovery prevents showing fields that won't render.

## Risiko & Mitigasi

| Risiko | Kemungkinan | Dampak | Mitigasi |
|--------|-------------|--------|----------|
| Template HTML berubah format | Low | High | Maintain data-template-* contract, add tests |
| Iframe postMessage race condition | Medium | Medium | Add message queue, retry on timeout |
| Storage quota exceeded | Low | High | Add file size limits, cleanup old files |
| RLS policy misconfiguration | Low | Critical | Test with non-admin user, add integration tests |
| Template field mismatch | Medium | Medium | Use field capability detection, graceful degradation |
| Cache invalidation fails | Medium | Low | Add manual refresh button |

## Pertanyaan Terbuka

1. **Storage Bucket Policy**: Apakah `event-media` bucket sudah punya RLS policy yang benar? Perlu diverifikasi.
   - **Action**: Check Supabase dashboard → Storage → event-media → Policies

2. **Template HTML Updates**: Bagaimana workflow untuk update template HTML dari source?
   - **Current**: Manual copy rendered.html ke public/templates/
   - **Proposed**: Document the scrape/update workflow

3. **Demo Events vs Demo Data**: Apakah perlu demo events di database atau cukup demo_data di event_templates?
   - **Decision**: demo_data di event_templates sudah cukup untuk template preview
   - Demo events dengan slug `demo-{template-slug}` dibuat untuk URL publik `/undangan/demo-{slug}`

4. **Field Capability Documentation**: Apakah perlu auto-generate field support matrix untuk setiap template?
   - **Proposed**: Add `npm run template:check` script to audit all templates

## Verifikasi & Testing Plan

### Per-Feature Verification
Setiap task harus diverifikasi dengan:
1. **Build Check**: `npm run build` → no errors
2. **Type Check**: `tsc -b` → no errors  
3. **Lint Check**: `npm run lint` → no errors
4. **Test Run**: `npm test` → existing tests pass
5. **Browser Test**: Manual verification dengan dev server

### Browser Test Scenarios

**Event Creation**:
1. Login sebagai admin
2. Navigate to `/events/create`
3. Pilih template Heritage Aruna
4. Isi form (title, slug, bride/groom names)
5. Click "Buat acara"
6. Verify redirect ke `/events/{id}`

**Template Editor**:
1. Navigate to `/events/{id}/bride-groom`
2. Edit bride name, upload photo
3. Click Save
4. Verify success message
5. Open `/events/{id}/preview`
6. Verify changes appear in preview

**Public Invitation**:
1. Publish event (status = published)
2. Open `/undangan/{slug}` in incognito
3. Verify all fields render correctly
4. Submit RSVP form
5. Verify RSVP saved to database

### Integration Test Requirements

**Critical Paths**:
- [ ] Create event → Edit data → Preview → Publish → View public
- [ ] Upload images → Save → Preview refresh → Public view
- [ ] RSVP submit from public invitation → Admin view RSVP list
- [ ] Template demo edit → Save → Preview update

## Definition of Done

Setiap task dianggap selesai jika:
- [ ] Code changes implemented
- [ ] TypeScript types correct (no `any`, no type errors)
- [ ] Build succeeds (`npm run build`)
- [ ] Linter passes (`npm run lint`)
- [ ] Existing tests pass (`npm test`)
- [ ] Manual browser test verified (screenshot/checklist)
- [ ] No console errors in browser DevTools
- [ ] Changes committed with descriptive message
- [ ] Preview shows updated data after save
- [ ] Works in Chrome dan Firefox (responsive 320px - 1440px)

## Rekomendasi Implementasi

### Pendekatan: Incremental Vertical Slices

**Urutan Prioritas**:
1. **Foundation** (Checkpoint 1): Fix core editor sync issues
2. **Core Features** (Checkpoint 2): Complete CRUD & preview sync
3. **Polish** (Checkpoint 3): UX improvements, error handling, image optimization

**Rationale**: 
- Template rendering architecture sudah solid
- Home page sudah ada
- Event creation flow sudah berfungsi
- Focus pada sync issues dan UX polish

### Tidak Perlu Restrukturisasi FEAT

**Alasan**:
1. Ini adalah **polish & fix**, bukan pembangunan fitur baru yang separable
2. Semua task saling terkait pada preview sync mechanism
3. Checkpoint-based approach sudah cukup untuk verifikasi
4. Total ~8-12 tasks, suitable untuk single implementation loop

**Alternative Considered**: 
- FEAT decomposition menjadi "Editor Sync", "Image Upload", "Error Handling"
- **Rejected**: Terlalu coupled, sulit diparallelisasi, overhead tidak sebanding

## Estimasi Effort

| Phase | Tasks | Estimated Effort | Risk |
|-------|-------|-----------------|------|
| Foundation | 3 tasks | Medium | Low |
| Core Features | 4 tasks | Medium | Medium |
| Polish | 3 tasks | Small-Medium | Low |
| **Total** | **~10 tasks** | **~8-12 hours** | **Low-Medium** |

## Dependency Graph

```
Foundation
├── Fix Template Demo Editor data loading
├── Implement Preview Force Reload after save
└── Add React Query cache invalidation
    ↓
Core Features
├── BrideGroom editor sync
├── Gallery editor sync
├── Schedule editor sync
└── InvitationContent editor sync
    ↓
Polish
├── Improve error messages
├── Add image compression
└── Loading state improvements
```

## Kontrak Implementasi

### Input
- Working application dengan template rendering system
- Supabase schema & migrations
- 9 template HTML files dengan bridge script

### Output
- Template editor loads latest data on open
- Preview updates immediately after save
- All CRUD operations sync correctly
- Consistent error messages
- Improved loading states
- All editor pages verified in browser

### Out of Scope
- Template HTML restructuring
- New template additions
- Payment integration
- Email notifications
- Advanced analytics
- Mobile app
- Template builder/generator

## Catatan Tambahan

### Template HTML Contract

Templates must follow these conventions:
```html
<!-- Text field -->
<p data-template-field="bride_name">Default Name</p>

<!-- Image field (background) -->
<div data-template-image="bride_photo" style="background-image:url(...)"></div>

<!-- Image field (img tag) -->
<img data-template-image="bride_photo" src="..." />

<!-- Link field -->
<a data-template-href="maps_url" href="#">Google Maps</a>

<!-- Special markers -->
<h1 data-template-couple></h1>  <!-- Auto: "Bride & Groom" -->
<div data-template-gallery>
  <a class="e-gallery-item" href="#">
    <div class="e-gallery-image" style="background-image:url(...)"></div>
  </a>
</div>
```

### Supabase Storage Policy Check

Run this in Supabase SQL Editor:
```sql
-- Check if event-media bucket has policies
SELECT * FROM storage.policies WHERE bucket_id = 'event-media';

-- If empty, create policies:
-- (Policies should allow authenticated INSERT, admins SELECT all, public SELECT published)
```

### File Size Limits
- Images: 10MB max (enforced in upload handlers)
- Recommended: Client-side compress >2MB to webp before upload
- Storage quota: Monitor usage, implement cleanup for old files

---

**Prepared by**: Planning Agent
**Date**: 2025-06-XX
**Status**: Ready for Implementation
**Workflow**: wf_26bb71d5d358bde2
