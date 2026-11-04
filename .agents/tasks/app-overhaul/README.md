# App Overhaul - Task Documentation

Folder ini berisi dokumentasi lengkap untuk implementasi dan testing aplikasi undangan digital.

---

## 📁 Struktur Folder

```
.agents/tasks/app-overhaul/
│
├── README.md                          # Dokumen ini
├── TESTING-GUIDE-INDEX.md            # 🎯 START HERE - Index panduan testing
├── browser-verification.md            # Panduan testing komprehensif
├── QUICK-TEST-CHECKLIST.md           # Checklist testing cepat
├── TEST-DATA.md                       # Template data untuk testing
│
└── screenshots/                       # Folder untuk menyimpan screenshot testing
    ├── homepage-desktop.png
    ├── homepage-mobile.png
    ├── create-*.png
    ├── edit-*.png
    └── public-*.png
```

---

## 🚀 Quick Start

### Untuk Melakukan Testing:

1. **Mulai dari sini:**
   ```
   Baca: TESTING-GUIDE-INDEX.md
   ```
   Dokumen ini akan memandu Anda memilih jalur testing yang sesuai.

2. **Pilih jalur testing:**
   - **Quick Test (45 menit):** Gunakan `QUICK-TEST-CHECKLIST.md`
   - **Comprehensive Test (2-3 jam):** Gunakan `browser-verification.md`
   - **Full Coverage (4-6 jam):** Test semua 9 templates

3. **Gunakan test data:**
   ```
   Copy-paste dari: TEST-DATA.md
   ```

4. **Simpan screenshot:**
   ```
   Lokasi: screenshots/
   ```

---

## 📚 Dokumen Testing

### TESTING-GUIDE-INDEX.md
**Fungsi:** Entry point untuk semua testing  
**Berisi:**
- Overview semua dokumen
- Panduan memilih jalur testing
- Setup instructions
- Time estimates
- Success criteria

**Baca ini dulu sebelum testing!**

---

### browser-verification.md
**Fungsi:** Panduan testing lengkap dengan dokumentasi formal  
**Berisi:**
- 6 test sections detail
- Screenshot guidelines
- Console & network analysis
- Issue categorization
- Complete test report template
- Expected results reference

**Gunakan untuk:** Testing formal, dokumentasi lengkap

---

### QUICK-TEST-CHECKLIST.md
**Fungsi:** Checklist testing cepat untuk validasi core functionality  
**Berisi:**
- 5 core test cases
- Quick checklist format
- Minimal verification
- Fast pass/fail assessment

**Gunakan untuk:** Testing cepat, validasi setelah fix

---

### TEST-DATA.md
**Fungsi:** Repository data untuk testing  
**Berisi:**
- 4 sets test data (untuk 4 templates berbeda)
- Couple names & details
- Schedule data
- Quotes & stories
- Test image specifications
- Expected results reference
- Troubleshooting guide

**Gunakan untuk:** Copy-paste data saat testing semua templates

---

## 🎯 Testing Workflow

```
┌─────────────────────────────────────────┐
│  1. Read TESTING-GUIDE-INDEX.md         │
│     - Understand overview               │
│     - Choose testing path               │
│     - Setup environment                 │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  2. Prepare                             │
│     - Start dev server (npm run dev)    │
│     - Open browser & DevTools           │
│     - Download test images              │
│     - Open TEST-DATA.md for reference   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  3. Execute Tests                       │
│                                         │
│     Quick Path:                         │
│     └─> QUICK-TEST-CHECKLIST.md        │
│                                         │
│     Comprehensive Path:                 │
│     └─> browser-verification.md        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  4. Document Results                    │
│     - Fill test report                  │
│     - Save screenshots                  │
│     - List issues found                 │
│     - Provide recommendation            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  5. Report                              │
│     - APPROVED: Ready for production    │
│     - NEEDS FIXES: List critical issues │
└─────────────────────────────────────────┘
```

---

## ⏱️ Time Investment

| Testing Path | Time Required | When to Use |
|--------------|---------------|-------------|
| Quick Test | 45 min | Post-fix validation, quick check |
| Comprehensive | 2-3 hours | Formal testing, release candidate |
| Full Coverage | 4-6 hours | Major release, all templates |

---

## ✅ Success Criteria

### Testing is COMPLETE when:
- [ ] Chosen testing path finished
- [ ] All required test cases executed
- [ ] Screenshots captured and saved
- [ ] Issues documented and categorized
- [ ] Final recommendation provided (APPROVED or NEEDS FIXES)
- [ ] Test report filled completely

### Testing is SUCCESSFUL (APPROVED) when:
- [ ] Zero blocking errors
- [ ] Core functionality works (create, edit, save, display)
- [ ] Data persists correctly
- [ ] Public pages display correctly
- [ ] At least 2 templates tested successfully
- [ ] Console has no application errors
- [ ] Network requests successful

---

## 🐛 Found Issues?

### Document in test report:
1. **Error message** (exact text)
2. **Location** (which page/component)
3. **Steps to reproduce**
4. **Expected vs actual behavior**
5. **Screenshot** (if visual)
6. **Console errors** (if any)
7. **Network failures** (if any)

### Categorize:
- **BLOCKING:** Prevents core functionality
- **HIGH:** Major feature broken
- **MEDIUM:** Minor feature issue
- **LOW:** Cosmetic or edge case
- **INFO:** Third-party warning (usually safe)

---

## 📸 Screenshot Guide

### Required Screenshots:

**Homepage:**
- `homepage-desktop.png`
- `homepage-mobile.png`
- `homepage-console.png` (if errors)

**Per Template Tested:**
- `create-{template}-form.png`
- `create-{template}-network.png`
- `edit-{template}-changes.png`
- `edit-{template}-network.png`
- `public-{template}-desktop.png`
- `public-{template}-mobile.png`
- `public-{template}-console.png` (if errors)

### Screenshot Tips:
- Use full window capture (not just viewport)
- Include browser chrome for context
- Highlight important elements if needed
- Name files descriptively
- Organize by template

---

## 🎨 Templates to Test

**Priority Order:**

1. **Heritage Aruna** ⭐ (MUST TEST - reference template)
2. **Premium 01** (MUST TEST - different category)
3. Heritage Sandhayu (recommended)
4. Premium Danila (recommended)
5. Heritage Utary
6. Premium 02
7. Premium Flara
8. Premium Ivanna
9. Premium Kila

**Minimum:** Test #1 and #2  
**Recommended:** Test #1-4  
**Ideal:** Test all 9

---

## 🔧 Technical Details

### Development Server
```bash
# Start server
npm run dev

# Default URLs
http://localhost:5173  (Vite default)
http://localhost:3000  (alternative)

# Check terminal output for actual port
```

### Browser Requirements
- **Recommended:** Google Chrome (latest)
- **Required:** DevTools support
- **Features needed:** Console, Network, Device Toolbar

### Test Images Specs
- **Cover photos:** 1920x1080, landscape, <5MB
- **Couple photos:** 800x800, portrait/square, <3MB
- **Gallery photos:** 1200x800, mixed, <3MB each
- **Formats:** JPG or PNG
- **Sources:** Unsplash, Pexels, Pixabay

---

## 📊 Deliverables

After testing, you should have:

1. **Completed test report**
   - In `browser-verification.md` (comprehensive)
   - Or `QUICK-TEST-CHECKLIST.md` (quick)

2. **Screenshot evidence**
   - All in `screenshots/` folder
   - Named according to convention

3. **Issue list**
   - Categorized by severity
   - With reproduction steps

4. **Final recommendation**
   - APPROVED or NEEDS FIXES
   - With clear reasoning

5. **Next steps**
   - If APPROVED: deployment plan
   - If NEEDS FIXES: prioritized fix list

---

## 🆘 Need Help?

### Common Questions:

**Q: Which testing path should I choose?**
A: For first-time testing or release candidate, use Comprehensive. For quick validation, use Quick Test.

**Q: How many templates must I test?**
A: Minimum 2 (Heritage Aruna + Premium 01). Recommended 4. Ideal all 9.

**Q: What if I find a blocking error?**
A: Document it immediately, note reproduction steps, and continue testing other features.

**Q: Can I skip screenshots?**
A: For Quick Test, screenshots are recommended but optional. For Comprehensive, screenshots are required for evidence.

**Q: What's a "blocking" error?**
A: An error that prevents core functionality: can't create event, can't save, can't view public page, data lost.

**Q: Are YouTube/Maps warnings okay?**
A: Yes, third-party warnings from external services are generally safe to ignore if functionality works.

---

## 📅 Maintenance

### Update this documentation when:
- Test procedures change
- New templates added
- New features added
- Issues found in testing process
- User feedback received

### Version History:
- **v1.0** (January 2026) - Initial comprehensive testing guide
  - 4 testing documents created
  - 9 templates covered
  - Manual testing approach (DevTools MCP not available)

---

## 🎯 Goals of This Task

1. **Verification:** Confirm all implementation work is functional
2. **Documentation:** Provide evidence of testing
3. **Quality Assurance:** Catch bugs before production
4. **User Confidence:** Ensure users won't face critical errors
5. **Release Readiness:** Determine if app is production-ready

---

## 📝 Notes

- Testing dilakukan **manual** karena Chrome DevTools MCP tidak tersedia
- Dokumentasi dirancang untuk **non-technical user** friendly
- Fokus pada **core functionality** bukan perfection
- **Browser-based verification** adalah final check sebelum release
- Third-party warnings (YouTube, Maps, etc.) **acceptable** jika tidak blocking
- Minimum 2 templates harus tested untuk **approval**

---

**Siap untuk testing? Mulai dengan TESTING-GUIDE-INDEX.md! 🚀**

