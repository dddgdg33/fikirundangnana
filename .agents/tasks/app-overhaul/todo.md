# Task List: Overhaul Aplikasi Undangan Digital

## Overview
Total: 10 tasks dikelompokkan dalam 3 phase dengan checkpoints
Estimasi: 8-12 jam implementasi
Approach: Incremental vertical slices dengan verifikasi browser setiap 2-3 task

---

## Phase 1: Foundation (Core Sync Mechanism)

### Task 1: Fix Template Demo Editor Data Loading
**Priority**: HIGH | **Size**: Small (1-2 files) | **Dependencies**: None

**Description**: 
Perbaiki loading `demo_data` dari Supabase pada Templates.tsx agar data terbaru selalu termuat saat editor dibuka.

**Files to Modify**:
- `src/pages/templates/Templates.tsx` - Fix `openEditor()` race condition, improve error handling

**Acceptance Criteria**:
- [ ] Saat admin klik "Edit" template, form menampilkan data dari `demo_data` di Supabase
- [ ] Loading state jelas terlihat saat fetch data
- [ ] Error message informatif jika fetch gagal
- [ ] Preview iframe menampilkan data yang sama dengan form
- [ ] Tidak ada race condition antara multiple template clicks

**Verification**:
- [ ] `npm run build` - Build succeeds
- [ ] `npm run lint` - No errors
- [ ] Browser: Login → `/templates` → Click "Edit" pada Heritage Aruna → Form loads with demo data
- [ ] Browser: Check DevTools console - no errors
- [ ] Browser: Edit field → Preview updates via postMessage

**Implementation Notes**:
- Wrap async fetch in try-catch with clear error states
- Use `draftLoadId.current` correctly to cancel stale loads
- Add timeout for fetch operations
- Consider using React Query for template fetching

---

### Task 2: Implement Preview Force Reload Mechanism
**Priority**: HIGH | **Size**: Small (2-3 files) | **Dependencies**: None

**Description**:
Tambahkan force reload preview iframe setelah save berhasil pada semua editor pages. Ini memastikan preview selalu menampilkan data terbaru dari Supabase.

**Files to Modify**:
- `src/pages/events/BrideGroom.tsx` - Add iframe reload after save
- `src/pages/events/Gallery.tsx` - Add iframe reload after save
- `src/pages/events/Schedule.tsx` - Add iframe reload after save
- `src/pages/events/InvitationContent.tsx` - Add iframe reload after save
- `src/components/EventPreview.tsx` (if exists) - Add ref for parent control

**Acceptance Criteria**:
- [ ] Setelah klik "Simpan" dan success, preview iframe otomatis reload
- [ ] Preview menampilkan data yang baru saja disimpan (tidak menampilkan data lama)
- [ ] Reload tidak mengganggu UX (smooth transition)
- [ ] User tidak perlu manual refresh browser untuk melihat perubahan

**Verification**:
- [ ] `npm run build` - Build succeeds
- [ ] Browser: `/events/{id}/bride-groom` → Edit "Nama mempelai" → Save → Preview updates immediately
- [ ] Browser: `/events/{id}/gallery` → Upload image → Save → Preview shows new image
- [ ] Browser: `/events/{id}/schedule` → Edit date → Save → Preview shows new date
- [ ] Browser: No console errors during reload

**Implementation Notes**:
- Option 1: `iframeRef.current?.contentWindow?.location.reload()`
- Option 2: Change iframe src with timestamp: `src={baseUrl}?t=${Date.now()}`
- Option 2 preferred (avoids CORS issues, cleaner)

---

### Task 3: Add React Query Cache Invalidation
**Priority**: MEDIUM | **Size**: Small (2-3 files) | **Dependencies**: Task 2

**Description**:
Invalidate React Query cache setelah mutation berhasil agar data yang dimuat ulang selalu fresh dari Supabase.

**Files to Modify**:
- `src/pages/events/BrideGroom.tsx` - Add `queryClient.invalidateQueries(['event', id])`
- `src/pages/events/Gallery.tsx` - Add invalidation
- `src/pages/events/Schedule.tsx` - Add invalidation
- `src/pages/events/InvitationContent.tsx` - Add invalidation
- `src/pages/events/Music.tsx` - Add invalidation
- `src/pages/events/Gift.tsx` - Add invalidation

**Acceptance Criteria**:
- [ ] Setelah save berhasil, React Query cache di-invalidate
- [ ] Re-fetch data otomatis untuk query yang active
- [ ] Tidak ada stale data di component lain yang menggunakan event yang sama
- [ ] Loading state ditampilkan saat re-fetching

**Verification**:
- [ ] `npm run build` - Build succeeds
- [ ] Browser: Edit di satu tab → Switch tab → Data udah updated (no stale cache)
- [ ] React Query DevTools: Cache invalidation terlihat setelah mutation
- [ ] No unnecessary refetches (hanya yang perlu di-invalidate)

**Implementation Notes**:
```typescript
const queryClient = useQueryClient()
await supabase.from('events').update(...)
queryClient.invalidateQueries(['event', id])
```

---

### ✅ CHECKPOINT 1: Foundation Complete

**Verification Checklist**:
- [ ] All builds successful (`npm run build`, `npm run lint`)
- [ ] Template demo editor loads data correctly
- [ ] Save → Preview update flow works end-to-end
- [ ] No console errors in browser DevTools
- [ ] React Query cache management correct

**Manual Test Flow**:
1. Login sebagai admin
2. `/templates` → Edit Heritage Aruna → Verify demo data loads
3. `/events/create` → Create new event "Test Event"
4. `/events/{id}/bride-groom` → Edit nama → Save → Verify preview updates
5. `/events/{id}/gallery` → Upload foto → Save → Verify preview shows foto

**Decision Point**: Jika checkpoint gagal, fix issues sebelum lanjut ke Phase 2.

---

## Phase 2: Core Features (Complete Editor Sync)

### ✅ Task 4: Fix BrideGroom Editor Save & Preview Sync
**Priority**: HIGH | **Size**: Small (1 file) | **Dependencies**: Tasks 1-3 | **Status**: COMPLETED

**Description**:
Terapkan preview reload + cache invalidation pada BrideGroom editor. Pastikan upload foto juga trigger preview update.

**Files Modified**:
- `src/pages/events/BrideGroom.tsx` - Applied Tasks 2 & 3 fixes + improved error handling

**Acceptance Criteria**:
- [x] Edit nama/nick mempelai → Save → Preview update immediately
- [x] Upload foto mempelai → Preview shows uploaded photo immediately
- [x] Edit Instagram handle → Save → Link href updated in preview
- [x] Edit parents name → Save → Preview shows updated parents
- [x] Success message shown after save
- [x] Error message shown if save fails (dengan detail error)

**Verification**:
- [ ] Browser: `/events/{id}/bride-groom` → Test all fields → All updates appear in preview
- [ ] Browser: Upload bride_photo → Verify in preview rendered.html
- [ ] Browser: Test with large image (8MB) → Verify upload works
- [ ] Check Supabase Storage: Image uploaded to correct path

---

### ✅ Task 5: Fix Gallery Editor Save & Preview Sync
**Priority**: HIGH | **Size**: Small (1 file) | **Dependencies**: Tasks 1-3 | **Status**: COMPLETED

**Description**:
Terapkan preview reload pada Gallery editor. Pastikan multiple image upload dan delete trigger preview update.

**Files Modified**:
- `src/pages/events/Gallery.tsx` - Applied Tasks 2 & 3 fixes + improved error handling

**Acceptance Criteria**:
- [x] Upload multiple images → Save → Preview shows all images in gallery grid
- [x] Delete image → Save → Preview removes deleted image
- [x] Switch between gallery/prewedding tabs → Both collections work
- [x] Template displays max 10 photos (enforced by bridge.js)
- [x] Image order preserved in preview

**Verification**:
- [ ] Browser: `/events/{id}/gallery` → Upload 3 photos → Save → Preview shows 3 photos
- [ ] Browser: Delete 1 photo → Save → Preview shows 2 photos
- [ ] Browser: Upload 10 photos → Verify template displays correctly (no overflow)
- [ ] Check gallery section in preview iframe (inspect with DevTools)

---

### ✅ Task 6: Fix Schedule Editor Save & Preview Sync
**Priority**: MEDIUM | **Size**: Small (1 file) | **Dependencies**: Tasks 1-3 | **Status**: COMPLETED

**Description**:
Terapkan preview reload pada Schedule editor untuk akad dan resepsi.

**Files Modified**:
- `src/pages/events/Schedule.tsx` - Applied Tasks 2 & 3 fixes + improved error handling

**Acceptance Criteria**:
- [x] Edit akad date/time/location → Save → Preview shows formatted date/time
- [x] Edit reception date/time/location → Save → Preview shows formatted date/time
- [x] Date formatting correct (Indonesian locale)
- [x] Time formatting includes "WIB - Selesai"
- [x] Location/address rendered correctly in template

**Verification**:
- [ ] Browser: `/events/{id}/schedule` → Edit akad date → Save → Verify format in preview
- [ ] Browser: Edit reception time → Save → Verify "XX.XX WIB - Selesai" in preview
- [ ] Test edge case: Same date for akad & reception → Both render correctly

---

### ✅ Task 7: Fix InvitationContent Editor Save & Preview Sync
**Priority**: MEDIUM | **Size**: Small (1 file) | **Dependencies**: Tasks 1-3 | **Status**: COMPLETED

**Description**:
Terapkan preview reload pada InvitationContent editor (love story, quote, video).

**Files Modified**:
- `src/pages/events/InvitationContent.tsx` - Applied Tasks 2 & 3 fixes + improved error handling

**Acceptance Criteria**:
- [x] Edit love_story → Save → Preview shows multi-line story with <br> for \n
- [x] Edit quote → Save → Preview shows quote in designated section
- [x] Edit video_url → Save → Preview iframe embeds video correctly
- [x] Long text tidak overflow layout template

**Verification**:
- [ ] Browser: `/events/{id}/editor` → Edit love story dengan multiple paragraphs → Save → Verify \n rendered as <br>
- [ ] Browser: Edit quote → Save → Check quote section in preview
- [ ] Browser: Add YouTube URL → Save → Verify video embed works

---

### ✅ CHECKPOINT 2: Core Features Complete

**Verification Checklist**:
- [ ] All editor pages save → preview sync correctly
- [ ] Image uploads work end-to-end (Storage → URL → Preview)
- [ ] Date/time formatting correct
- [ ] Multi-line text rendered with line breaks
- [ ] Error handling consistent across all editors

**Manual Test Flow (Complete Event)**:
1. Create new event "Wedding Test"
2. Edit BrideGroom → Add names & photos
3. Edit Schedule → Add dates & times & locations
4. Edit Gallery → Upload 5 photos
5. Edit InvitationContent → Add story, quote, video
6. Open `/events/{id}/preview` → Verify semua data tampil
7. Publish event → Open `/undangan/{slug}` → Verify public view

**Decision Point**: Jika semua editor sync, lanjut ke polish. Jika ada issue, fix dulu.

---

## Phase 3: Polish (UX & Error Handling)

### ✅ Task 8: Improve Error Messages & Consistency
**Priority**: MEDIUM | **Size**: Medium (4-5 files) | **Dependencies**: Tasks 4-7 | **Status**: COMPLETED

**Description**:
Standardize error messages dan improve error handling di semua editor pages.

**Files Modified**:
- `src/pages/events/BrideGroom.tsx` - Standardized error messages
- `src/pages/events/Gallery.tsx` - Improved upload error messages
- `src/pages/events/Schedule.tsx` - Added consistent error handling
- `src/pages/events/InvitationContent.tsx` - Improved error UX
- `src/pages/events/CreateEvent.tsx` - Use centralized error helper
- `src/utils/errorMessages.ts` (created) - Centralized error message helper

**Acceptance Criteria**:
- [x] Error messages informatif (tidak hanya "Error" atau "Failed")
- [x] Network errors dijelaskan (connection issue vs permission denied)
- [x] Validation errors ditampilkan per-field (tidak hanya global error)
- [x] Error messages konsisten di semua pages (tone & format)
- [x] Success messages juga konsisten

**Verification**:
- [ ] Browser: Trigger network error (offline mode) → Error message clear
- [ ] Browser: Upload invalid file type → Error message explains accepted formats
- [ ] Browser: Try save without required field → Validation error shown
- [ ] Compare error messages across pages → Consistent format

**Implementation Notes**:
```typescript
// src/utils/errorMessages.ts
export function getSupabaseErrorMessage(error: { code?: string; message?: string }): string {
  if (error.code === '23505') return 'Data duplikat. Gunakan nilai yang berbeda.'
  if (error.code === '42501') return 'Akses ditolak. Login kembali sebagai admin.'
  if (error.code === 'PGRST301') return 'Tidak ada akses. Cek permissions.'
  return error.message || 'Terjadi kesalahan. Silakan coba lagi.'
}
```

---

### Task 9: Add Image Compression for Large Files
**Priority**: LOW | **Size**: Small (2 files) | **Dependencies**: Task 5

**Description**:
Tambahkan client-side image compression untuk images >2MB sebelum upload ke Storage.

**Files to Modify**:
- `src/utils/imageCompression.ts` (create) - Compression logic using Canvas API
- `src/pages/events/BrideGroom.tsx` - Use compression before upload
- `src/pages/events/Gallery.tsx` - Use compression before upload
- `src/pages/templates/Templates.tsx` - Already has compression ✓

**Acceptance Criteria**:
- [ ] Images >2MB automatically compressed to webp (quality 0.78)
- [ ] Compressed image size ≤50% of original
- [ ] Max dimension 1600px (maintain aspect ratio)
- [ ] No compression for images <2MB (upload original)
- [ ] User notified if compression happens ("Mengoptimalkan gambar...")

**Verification**:
- [ ] Browser: Upload 5MB JPG → Verify compressed before upload → Check Storage file size
- [ ] Browser: Upload 1MB PNG → Verify uploaded without compression
- [ ] Browser: Upload 10MB image → Verify compressed and upload succeeds
- [ ] Check image quality in preview → Still looks good

**Implementation Notes**:
- Use Canvas API `toBlob()` with webp format
- Show progress: "Mengoptimalkan gambar..." during compression
- Fallback to original if compression fails

---

### Task 10: Improve Loading States & UI Polish
**Priority**: LOW | **Size**: Small (3-4 files) | **Dependencies**: Tasks 8-9

**Description**:
Polish loading states, add skeleton loaders, improve button disabled states.

**Files to Modify**:
- `src/components/LoadingSpinner.tsx` (create) - Reusable loading component
- `src/pages/events/BrideGroom.tsx` - Add skeleton loader while fetching
- `src/pages/events/Gallery.tsx` - Improve upload progress indicator
- `src/pages/templates/Templates.tsx` - Polish loading states

**Acceptance Criteria**:
- [ ] Skeleton loader shown while fetching event data (not just "Loading...")
- [ ] Button states clear: normal, hover, loading, disabled
- [ ] Upload progress indicator for images (percentage or spinner)
- [ ] No layout shift when content loads
- [ ] Smooth transitions between loading → content states

**Verification**:
- [ ] Browser: Open editor page → Verify skeleton loader before content
- [ ] Browser: Upload image → Verify progress indicator
- [ ] Browser: Test on slow 3G throttling → Loading states appropriate
- [ ] Check accessibility: Loading states announced by screen reader

**Implementation Notes**:
- Create reusable `<Skeleton />` component
- Use `disabled={loading || saving}` on buttons
- Add `aria-busy="true"` for loading regions

---

### ✅ CHECKPOINT 3: Complete & Ready for Review

**Final Verification Checklist**:
- [ ] All Phase 1-3 tasks complete
- [ ] All builds successful (`npm run build`, `npm run lint`, `npm test`)
- [ ] No TypeScript errors (`tsc -b`)
- [ ] No console errors in browser DevTools
- [ ] All manual test flows pass
- [ ] Responsive: Works on mobile (320px) and desktop (1440px)
- [ ] Cross-browser: Tested on Chrome & Firefox

**Complete User Journey Test**:
1. **Onboarding**: Home page → CTA "Buat undangan" → Login
2. **Create Event**: Choose template → Fill form → Create event → Navigate to workspace
3. **Edit Content**: 
   - BrideGroom: Add names, upload photos
   - Schedule: Add dates, times, locations
   - Gallery: Upload 8 photos
   - Content: Add love story, quote, video
   - Music: Add music URL
   - Gift: Add bank account info
4. **Preview**: Open preview → Verify all data displayed correctly
5. **Publish**: Change status to "published" → Save
6. **Public View**: Open `/undangan/{slug}` in incognito → Verify public invitation
7. **RSVP**: Submit RSVP from public invitation → Verify saved to database
8. **Admin Review**: Login → View RSVP list → Verify submission appears

**Performance Checks**:
- [ ] Page load time <3s on regular 3G
- [ ] Image upload <10s for 5MB image
- [ ] Preview reload <2s
- [ ] No memory leaks (check DevTools Memory tab)

**Accessibility Checks**:
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Form labels associated with inputs
- [ ] Error messages have `role="alert"`
- [ ] Loading states have `role="status"` or `aria-busy`
- [ ] Images have meaningful alt text

**Security Checks**:
- [ ] No service_role key exposed in frontend
- [ ] RLS policies enforced (test with non-admin user)
- [ ] File upload validates type and size
- [ ] No SQL injection vectors (all queries use Supabase client)

---

## Summary

**Total Tasks**: 10
**Phases**: 3 (Foundation, Core Features, Polish)
**Checkpoints**: 3 (after tasks 3, 7, 10)

**Task Size Distribution**:
- Small (1-2 files): 7 tasks
- Medium (3-5 files): 3 tasks
- Large (5+ files): 0 tasks

**Priority Distribution**:
- HIGH: 5 tasks
- MEDIUM: 4 tasks
- LOW: 1 task

**Estimated Timeline**:
- Phase 1: 2-3 hours
- Phase 2: 3-4 hours
- Phase 3: 2-3 hours
- **Total: 8-12 hours**

**Dependencies**:
- Linear flow dengan beberapa parallelizable tasks di Phase 2
- Tasks 2-3 (preview sync) foundational untuk Tasks 4-7
- Tasks 8-10 independent, bisa dikerjakan parallel

**Success Criteria**:
✅ Semua template editor memuat data terbaru
✅ Preview update immediately setelah save
✅ Semua CRUD operations sync dengan Supabase
✅ Error messages jelas dan informatif
✅ Loading states smooth dan accessible
✅ End-to-end user journey works tanpa hambatan

---

**Next Steps**:
1. Review plan.md dan todo.md dengan stakeholder
2. Approve atau revise scope
3. Begin implementation starting with Task 1
4. Verifikasi setiap checkpoint sebelum lanjut
5. Final testing & documentation setelah Task 10

**Notes**:
- Workflow akan menggunakan loop implement → verify → commit
- Browser testing mandatory setiap 2-3 tasks
- Screenshot hasil verifikasi disimpan untuk documentation
- Jika task >2 hours, break down lebih detail
