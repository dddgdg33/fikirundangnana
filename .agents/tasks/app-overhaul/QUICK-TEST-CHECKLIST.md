# Quick Test Checklist

Gunakan checklist ini untuk testing cepat. Untuk panduan detail, lihat `browser-verification.md`.

## Pre-Test
- [ ] `npm run dev` berjalan
- [ ] Browser terbuka di `http://localhost:5173` atau port yang ditampilkan
- [ ] DevTools terbuka (F12)
- [ ] Console tab terlihat
- [ ] Network tab siap (centang "Preserve log")

## Core Flow Tests (Prioritas Tinggi)

### ✓ Test 1: Homepage (2 menit)
- [ ] Buka `/`
- [ ] Lihat hero/intro section
- [ ] Lihat template previews
- [ ] Klik CTA button
- [ ] Screenshot: `homepage-desktop.png`
- [ ] Console: 0 errors ❌ atau jumlah: ___

### ✓ Test 2: Create Heritage Aruna (5 menit)
- [ ] Buka `/events/create`
- [ ] Pilih "Heritage Aruna"
- [ ] Isi form test data (nama: Fajar & Dewi)
- [ ] Submit form
- [ ] Network: POST ke Supabase berhasil ✅
- [ ] Redirect ke editor ✅
- [ ] Console: 0 errors ❌

### ✓ Test 3: Edit & Save (5 menit)
- [ ] Form ter-populate dengan data benar ✅
- [ ] Ubah quote text
- [ ] Upload cover photo
- [ ] Upload 2 couple photos
- [ ] Klik Save
- [ ] Network: Image uploads berhasil ✅
- [ ] Network: Update request berhasil ✅
- [ ] Success message tampil ✅
- [ ] Console: 0 errors ❌

### ✓ Test 4: Public Page (3 menit)
- [ ] Buka URL undangan publik
- [ ] Nama mempelai tampil benar ✅
- [ ] Quote baru tampil ✅
- [ ] Foto cover tampil ✅
- [ ] Foto couple tampil ✅
- [ ] Jadwal akad tampil ✅
- [ ] Jadwal resepsi tampil ✅
- [ ] Screenshot: `public-heritage-aruna.png`
- [ ] Console: 0 critical errors ❌

### ✓ Test 5: Second Template (10 menit)
- [ ] Ulangi Test 2-4 dengan "Premium 01"
- [ ] Data tampil benar ✅
- [ ] Layout BERBEDA dari Heritage Aruna ✅
- [ ] Screenshot: `public-premium01.png`

## Quick Console Check

```
✅ PASS = Zero application errors
⚠️  WARN = Only third-party warnings (YouTube, Maps, etc.)
❌ FAIL = Application errors present
```

Console status: ___

## Quick Network Check

```
Total Supabase requests: ___
Failed requests: ___
Slow requests (>3s): ___
```

Network status: ✅ / ⚠️ / ❌

## Final Status

**Total tests:** 5  
**Passed:** ___  
**Failed:** ___

**Blocking issues:**
1. ___
2. ___

**Recommendation:**  
[ ] ✅ APPROVED - Siap digunakan  
[ ] ❌ NEEDS FIXES - Critical issues: ___

**Testing by:** ___  
**Date:** ___  
**Time:** ___ menit

---

## Jika Menemukan Error

### Application Error (harus diperbaiki):
```
Error: ___
File: ___
Line: ___
When: ___
Impact: ___
```

### Network Error (harus diperbaiki):
```
URL: ___
Status: ___
When: ___
Expected: ___
Actual: ___
```

### Third-Party Warning (bisa diabaikan):
```
Source: YouTube / Google Maps / etc.
Warning: ___
```

---

## Template Tambahan (Opsional)

Jika waktu cukup, test template lain dengan flow yang sama:

**Heritage:**
- [ ] Heritage Sandhayu
- [ ] Heritage Utary

**Premium:**
- [ ] Premium 02
- [ ] Premium Danila
- [ ] Premium Flara
- [ ] Premium Ivanna
- [ ] Premium Kila

**Untuk setiap template:**
- [ ] Create successful
- [ ] Edit & save successful
- [ ] Public page correct
- [ ] Unique design preserved
- [ ] No blocking errors

