# Panduan Testing Aplikasi Undangan Digital - Index

Selamat datang di panduan testing komprehensif untuk aplikasi undangan digital Pikiri.

---

## 📋 Dokumen Testing

### 1. **QUICK-TEST-CHECKLIST.md** ⚡
**Untuk:** Testing cepat (30-45 menit)  
**Isi:** Checklist singkat untuk verifikasi core functionality  
**Gunakan jika:** Waktu terbatas, butuh validasi cepat

### 2. **browser-verification.md** 📊
**Untuk:** Testing komprehensif dan dokumentasi lengkap  
**Isi:** Panduan detail step-by-step dengan screenshot guide  
**Gunakan jika:** Testing formal, perlu dokumentasi lengkap

### 3. **TEST-DATA.md** 📝
**Untuk:** Copy-paste data testing  
**Isi:** Template data untuk setiap template, gambar test, expected results  
**Gunakan:** Selama semua testing untuk konsistensi

---

## 🎯 Mulai Testing

### Persiapan (5 menit)

1. **Start development server:**
   ```bash
   cd d:/pikiri/app
   npm run dev
   ```
   
2. **Catat port number:**
   - Biasanya: `http://localhost:5173` (Vite default)
   - Atau: `http://localhost:3000`
   - Lihat output terminal

3. **Buka browser:**
   - Gunakan Google Chrome (recommended)
   - Buka DevTools (tekan F12)
   - Pin Console tab agar selalu terlihat

4. **Setup DevTools:**
   - Console tab: Centang "Preserve log"
   - Network tab: Centang "Preserve log"
   - Network tab: Disable cache (centang "Disable cache")

5. **Siapkan test images:**
   - Download 5-8 foto dari Unsplash/Pexels
   - 1 landscape untuk cover (1920x1080)
   - 2 portrait untuk couple (800x800)
   - 3-5 untuk gallery (mix)
   - Simpan di folder yang mudah diakses

---

## 🚀 Pilih Jalur Testing

### Jalur A: Quick Test (30-45 menit) ⚡

**Untuk:** Verifikasi cepat bahwa aplikasi berfungsi

**Langkah:**
1. Buka `QUICK-TEST-CHECKLIST.md`
2. Ikuti 5 test cases utama
3. Isi checklist
4. Catat hasil akhir

**Output:**
- Status PASS/FAIL per test
- List blocking issues (jika ada)
- Rekomendasi: APPROVED atau NEEDS FIXES

---

### Jalur B: Comprehensive Test (2-3 jam) 📊

**Untuk:** Testing formal dengan dokumentasi lengkap

**Langkah:**
1. Baca `browser-verification.md` sepenuhnya
2. Ikuti semua 6 sections secara berurutan
3. Ambil screenshot setiap step
4. Dokumentasikan semua findings
5. Isi complete test report

**Output:**
- Complete test report dalam `browser-verification.md`
- Screenshot folder dengan semua evidence
- Detailed issue list dengan kategori
- Network & console analysis
- Final recommendation dengan reasoning

---

### Jalur C: Template Coverage Test (4-6 jam) 🎨

**Untuk:** Testing semua 9 templates

**Langkah:**
1. Mulai dengan Jalur B untuk 2 template pertama
2. Untuk 7 template sisanya:
   - Create event
   - Edit & upload
   - Verify public page
   - Screenshot
   - Document unique issues
3. Bandingkan semua template
4. Verify setiap template unik

**Output:**
- Test report per template
- Comparison matrix
- Template-specific issues
- Design verification

---

## 📸 Screenshot Locations

Simpan semua screenshot di:
```
d:/pikiri/app/.agents/tasks/app-overhaul/screenshots/
```

**Naming convention:**
```
{test-case}-{template}-{type}.png

Examples:
- homepage-desktop.png
- create-heritage-aruna-form.png
- public-heritage-aruna-desktop.png
- public-premium01-mobile.png
- edit-heritage-sandhayu-network.png
```

---

## 🔍 Core Test Scenarios

### Test Scenario 1: Homepage ✓
**Objective:** Verify homepage loads and functions  
**Time:** 5 minutes  
**Critical:** YES

**Steps:**
1. Navigate to base URL
2. Verify content displays
3. Check mobile responsive
4. Test CTA buttons
5. Check console for errors

**Success criteria:**
- Page loads without errors
- All sections visible
- Responsive on mobile
- CTAs link correctly
- Zero console errors

---

### Test Scenario 2: Create Event ✓
**Objective:** Verify user can create new event  
**Time:** 10 minutes per template  
**Critical:** YES

**Steps:**
1. Navigate to /events/create
2. Select template
3. Fill form with test data
4. Submit form
5. Verify network request
6. Verify redirect

**Success criteria:**
- Form validation works
- POST request successful (201 Created)
- Redirects to editor
- Event created in database
- Zero console errors

---

### Test Scenario 3: Edit & Save ✓
**Objective:** Verify edit functionality and persistence  
**Time:** 15 minutes  
**Critical:** YES

**Steps:**
1. Open event editor
2. Verify data loads
3. Change text fields
4. Upload images
5. Save changes
6. Verify network requests
7. Verify success feedback

**Success criteria:**
- Form populates with correct data
- Text changes reflected in preview
- Images upload successfully
- Update request successful (200 OK)
- Success message shows
- Zero console errors

---

### Test Scenario 4: Public Invitation ✓
**Objective:** Verify public page displays correctly  
**Time:** 10 minutes  
**Critical:** YES

**Steps:**
1. Get public URL
2. Open in new tab/window
3. Verify all data displays
4. Verify all images load
5. Test interactive features
6. Check mobile view
7. Check console

**Success criteria:**
- All text data matches saved data
- All images display correctly
- Template design preserved
- Interactive features work
- Responsive on mobile
- Zero critical console errors

---

### Test Scenario 5: Multi-Template ✓
**Objective:** Verify each template is unique and functional  
**Time:** 30 minutes per template  
**Critical:** YES

**Steps:**
1. Repeat scenarios 2-4 for different template
2. Compare side-by-side
3. Verify unique designs
4. Document template-specific features

**Success criteria:**
- Each template has unique layout
- Same data displays differently
- All templates functional
- No cross-template contamination

---

## ⚠️ Common Issues & Solutions

### Issue: "Cannot read property of undefined"
**Type:** Application Error  
**Severity:** HIGH  
**Action:** Document exact error, file, and line number

### Issue: 401 Unauthorized from Supabase
**Type:** Authentication Error  
**Severity:** HIGH  
**Action:** Check if user logged in, verify RLS policies

### Issue: 404 on image URLs
**Type:** Storage Error  
**Severity:** HIGH  
**Action:** Verify upload succeeded, check storage bucket config

### Issue: YouTube iframe warnings
**Type:** Third-Party Warning  
**Severity:** LOW  
**Action:** Safe to ignore if music player works

### Issue: Old data showing on public page
**Type:** Cache Issue  
**Severity:** MEDIUM  
**Action:** Hard refresh (Ctrl+Shift+R), check if save succeeded

---

## 📊 Success Criteria

### Minimal Acceptable Quality (APPROVED)

**Core Functionality:**
- ✅ All 5 core test scenarios pass
- ✅ Zero blocking errors
- ✅ Data persistence works
- ✅ Public pages display correctly
- ✅ At least 2 templates tested successfully

**Console:**
- ✅ Zero application errors
- ⚠️ Third-party warnings acceptable

**Network:**
- ✅ All Supabase requests successful
- ✅ All image uploads successful
- ⚠️ Slow requests (<3s) acceptable

**UI/UX:**
- ✅ Responsive on mobile
- ✅ Success/error feedback clear
- ✅ Loading states present

---

### Ideal Quality (EXCELLENT)

**Everything in Minimal, plus:**
- ✅ All 9 templates tested
- ✅ Zero console warnings
- ✅ All network requests fast (<1s)
- ✅ Accessibility features work
- ✅ Performance optimized
- ✅ Edge cases handled
- ✅ Error recovery works

---

## 📝 Reporting Results

### After Quick Test:
1. Fill summary in `QUICK-TEST-CHECKLIST.md`
2. Note final status: APPROVED or NEEDS FIXES
3. List any blocking issues

### After Comprehensive Test:
1. Complete all sections in `browser-verification.md`
2. Organize screenshots in `/screenshots/` folder
3. Write detailed issue descriptions
4. Provide final recommendation with reasoning
5. Estimate fix time if needed

### After Template Coverage Test:
1. Create comparison matrix
2. Document template-specific features
3. Highlight any template that failed
4. Recommend which templates ready for production

---

## 🎬 Next Steps After Testing

### If APPROVED ✅
1. Document minor issues as "future enhancements"
2. Prepare deployment checklist
3. Update user documentation
4. Consider production testing plan

### If NEEDS FIXES ❌
1. Create GitHub Issues for each critical bug
2. Prioritize by severity and impact
3. Estimate fix time
4. Plan re-test after fixes
5. Consider releasing only tested templates

---

## 🔗 Template List

Total templates: **9**

**Heritage Category (3):**
1. Heritage Aruna ⭐ (reference template)
2. Heritage Sandhayu
3. Heritage Utary

**Premium Category (6):**
4. Premium 01
5. Premium 02
6. Premium Danila
7. Premium Flara
8. Premium Ivanna
9. Premium Kila

**Recommended testing order:**
1. Heritage Aruna (reference)
2. Premium 01 (different category)
3. [Others as time permits]

---

## ⏱️ Time Estimates

| Activity | Time | Priority |
|----------|------|----------|
| Setup | 5 min | Required |
| Homepage test | 5 min | Required |
| Create event (1 template) | 10 min | Required |
| Edit & save | 15 min | Required |
| Public page check | 10 min | Required |
| Second template | 30 min | Required |
| Documentation | 15 min | Required |
| **Minimal Total** | **90 min** | - |
| Additional templates (7) | 3-4 hours | Optional |
| Performance testing | 30 min | Optional |
| Accessibility testing | 30 min | Optional |
| **Complete Total** | **6 hours** | - |

---

## 📞 Support & Questions

### If you find issues during testing:

**For blocking bugs:**
1. Document the exact error message
2. Note when it happens
3. Include screenshot
4. Note which template/page
5. Create GitHub Issue immediately

**For questions about expected behavior:**
1. Check `TEST-DATA.md` for expected results
2. Compare with reference template (Heritage Aruna)
3. Check if it's a known third-party issue

**For technical setup issues:**
1. Verify `npm run dev` is running
2. Check correct port in browser
3. Clear browser cache if needed
4. Try incognito/private mode

---

## 🎯 Testing Philosophy

**Goals:**
1. **Functional:** Core features work without errors
2. **Reliable:** Data persists correctly
3. **Usable:** UI provides clear feedback
4. **Consistent:** All templates behave similarly
5. **Professional:** No errors visible to users

**Non-Goals:**
- Perfect performance (optimization comes later)
- Zero third-party warnings (beyond our control)
- 100% feature coverage (focus on core flows)
- Cross-browser testing (Chrome first)

---

## ✅ Final Checklist Before Reporting

- [ ] Completed chosen testing path
- [ ] Filled out test report
- [ ] Saved all screenshots
- [ ] Categorized all issues (blocking vs non-blocking)
- [ ] Provided clear recommendation
- [ ] Estimated fix time if needed
- [ ] Documented test environment details

---

## 📄 Document Versions

- **browser-verification.md**: v1.0 - Comprehensive test guide
- **QUICK-TEST-CHECKLIST.md**: v1.0 - Quick testing checklist
- **TEST-DATA.md**: v1.0 - Test data templates
- **TESTING-GUIDE-INDEX.md**: v1.0 - This index

Last updated: January 2026

---

**Selamat testing! 🎉**

Jika menemukan kesulitan atau pertanyaan, dokumentasikan dalam test report dan lanjutkan dengan test berikutnya.

