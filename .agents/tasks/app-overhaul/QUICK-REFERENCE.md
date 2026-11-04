# Quick Reference Card - Browser Testing

Print atau buka dokumen ini selama testing untuk referensi cepat.

---

## 🚀 Setup Commands

```bash
# Start dev server
cd d:/pikiri/app
npm run dev

# URL
http://localhost:5173
```

---

## ⌨️ Browser Shortcuts

| Action | Shortcut |
|--------|----------|
| Open DevTools | `F12` |
| Device Toolbar (mobile view) | `Ctrl + Shift + M` |
| Hard Refresh | `Ctrl + Shift + R` |
| Take Screenshot | `Ctrl + Shift + S` (Windows Snip) |
| Open Console | `Ctrl + Shift + J` |
| Open Network | `Ctrl + Shift + E` |

---

## ✅ DevTools Checklist

Before every test:
- [ ] DevTools open (F12)
- [ ] Console tab visible
- [ ] "Preserve log" enabled in Console
- [ ] Network tab ready
- [ ] "Preserve log" enabled in Network
- [ ] "Disable cache" checked in Network

---

## 🎯 Core Test Flow

```
1. Homepage (/) → Check load & console
2. Create (/events/create) → Select template → Fill → Submit
3. Edit (auto-redirect) → Change text → Upload images → Save
4. Public (/invitation/{slug}) → Verify data → Verify images
5. Repeat for 2nd template
```

---

## 📝 Test Data Quick Copy

### Test Set 1: Heritage Aruna
```
Pria: Ahmad Fajar Nugroho (Fajar)
Wanita: Dewi Lestari Putri (Dewi)
Akad: Masjid Al-Ikhlas, Jl. Merdeka 123
Resepsi: Gedung Melati, Jl. Anggrek 45
Slug: test-fajar-dewi-aruna
```

### Test Set 2: Premium 01
```
Pria: Budi Santoso Wibowo (Budi)
Wanita: Rina Wijaya Kusuma (Rina)
Akad: KUA Jakarta Selatan
Resepsi: Hotel Grand Sahid Jaya
Slug: test-budi-rina-premium01
```

---

## 🔍 What to Check

### Console Tab
```
✅ PASS = Zero application errors
⚠️  WARN = Only third-party warnings
❌ FAIL = Any application errors
```

### Network Tab
```
✅ PASS = All requests 200-299
⚠️  WARN = Some 4xx (document)
❌ FAIL = Critical 4xx or 5xx
```

---

## 📸 Screenshot Names

```
homepage-desktop.png
homepage-mobile.png
create-{template}-form.png
create-{template}-network.png
edit-{template}-changes.png
edit-{template}-network.png
public-{template}-desktop.png
public-{template}-mobile.png
```

**Save to:** `d:/pikiri/app/.agents/tasks/app-overhaul/screenshots/`

---

## ✅ Success Criteria Per Test

### Homepage
- [ ] Loads without errors
- [ ] All sections visible
- [ ] CTA buttons work
- [ ] Mobile responsive

### Create Event
- [ ] Form loads
- [ ] Template selectable
- [ ] Form submits
- [ ] POST request 201 Created
- [ ] Redirects to editor

### Edit & Save
- [ ] Data loads correctly
- [ ] Text changes work
- [ ] Images upload
- [ ] Save successful (200 OK)
- [ ] Success message shows

### Public Page
- [ ] All text matches
- [ ] All images display
- [ ] Template design correct
- [ ] Mobile responsive
- [ ] No critical errors

---

## 🐛 Error Categories

### BLOCKING (must fix)
- Can't create event
- Can't save changes
- Data not persisting
- Public page broken
- Critical console errors

### HIGH (should fix)
- Some features broken
- Upload fails sometimes
- Inconsistent behavior
- Major UI issues

### MEDIUM (nice to fix)
- Minor features broken
- Cosmetic issues
- Edge cases
- Performance slow

### LOW (can ignore)
- Third-party warnings
- Minor cosmetic issues
- Rare edge cases

---

## 📊 Expected HTTP Status

```
POST /events           → 201 Created
PATCH /events/{id}     → 200 OK
GET /events/{id}       → 200 OK
POST /storage/object/  → 200 OK
GET /templates         → 200 OK
```

---

## 🔧 Troubleshooting

### Form won't submit
→ Check console errors
→ Verify all required fields filled
→ Check network tab for request

### Images won't upload
→ Check file size (<5MB)
→ Check file type (JPG/PNG)
→ Check network tab for errors
→ Verify logged in

### Public page shows old data
→ Hard refresh (Ctrl+Shift+R)
→ Check if save succeeded
→ Clear browser cache

### Template looks wrong
→ Verify correct template selected
→ Check console for CSS errors
→ Check network for missing assets

### Console has errors
→ Read error message
→ Note file and line number
→ Screenshot the error
→ Categorize severity

---

## ⏱️ Time Budget

```
Setup:           5 min
Homepage:        5 min
Create Event 1: 10 min
Edit & Save:    15 min
Public Page:    10 min
Create Event 2: 10 min
Edit & Save 2:  15 min
Public Page 2:  10 min
Documentation:  15 min
─────────────────────
Total:         ~90 min
```

---

## 🎯 Minimum Pass Criteria

To mark testing as **APPROVED**:
- [ ] 2 templates tested completely
- [ ] All core flows work (create, edit, save, view)
- [ ] Data persists correctly
- [ ] Public pages display correctly
- [ ] Zero blocking errors
- [ ] Zero application console errors
- [ ] All Supabase requests successful

---

## 📋 Quick Checklist

```
SETUP
[ ] Dev server running
[ ] Browser open with DevTools
[ ] Test images ready
[ ] Test data ready

TEST 1: HOMEPAGE
[ ] Navigate to /
[ ] Screenshot desktop
[ ] Screenshot mobile
[ ] Check console
[ ] Status: PASS / FAIL

TEST 2: TEMPLATE 1 (Heritage Aruna)
[ ] Create event
[ ] Network POST successful
[ ] Edit & save
[ ] Network uploads successful
[ ] View public page
[ ] Data correct
[ ] Images correct
[ ] Status: PASS / FAIL

TEST 3: TEMPLATE 2 (Premium 01)
[ ] Create event
[ ] Edit & save
[ ] View public page
[ ] Verify different design
[ ] Status: PASS / FAIL

FINAL
[ ] All screenshots saved
[ ] Issues documented
[ ] Recommendation: APPROVED / NEEDS FIXES
```

---

## 🎨 Template List

```
Must Test (minimum):
✓ Heritage Aruna
✓ Premium 01

Recommended:
• Heritage Sandhayu
• Premium Danila

Optional (if time permits):
• Heritage Utary
• Premium 02
• Premium Flara
• Premium Ivanna
• Premium Kila
```

---

## 🆘 When to Stop & Report

**Stop testing and report immediately if:**
- Critical security issue found
- Data loss detected
- Supabase authentication broken
- All templates failing
- Server crashes
- Cannot proceed with testing

**Otherwise:** Complete at least 2 templates before reporting.

---

## ✍️ Report Template

```
BROWSER VERIFICATION RESULTS

Tested: [Date] by [Name]
Browser: Chrome [version]
Templates tested: [number]

RESULTS:
[ ] APPROVED - Ready for production
[ ] NEEDS FIXES - Critical issues found

Tested templates:
1. Heritage Aruna - PASS / FAIL
2. Premium 01 - PASS / FAIL

Critical issues:
1. ___
2. ___

Non-critical issues:
1. ___
2. ___

Recommendation:
___

Screenshots: [count] saved in /screenshots/
```

---

## 📞 Quick Links

**Documentation:**
- Full guide: `browser-verification.md`
- Test data: `TEST-DATA.md`
- Index: `TESTING-GUIDE-INDEX.md`

**Screenshot folder:**
```
d:/pikiri/app/.agents/tasks/app-overhaul/screenshots/
```

**Free test images:**
- Unsplash: https://unsplash.com/
- Pexels: https://pexels.com/

---

## 💡 Tips

- Test in order (don't skip steps)
- Take screenshots as you go
- Document issues immediately
- Don't fix bugs during testing (just document)
- Use Ctrl+F to find data in console
- Copy network requests for debugging
- Test mobile view for every page
- Hard refresh if data looks wrong
- Keep test data file open for reference

---

## ⚡ Speed Tips

- Copy-paste test data from TEST-DATA.md
- Use browser auto-fill for repeated fields
- Keep screenshots folder open
- Use consistent naming for screenshots
- Document as you go, not at the end
- Focus on core flows first
- Skip optional features if time-limited
- Test mobile view once per template (not every page)

---

**Happy Testing! 🎉**

Remember: The goal is to verify functionality works, not to find every possible edge case.

