# Uyga Vazifa Yuklash - Barcha Xususiyatlar

## ✅ Nima Yuborilishi Mumkin?

### 1. **Faqat Matn/Izoh** ✅
```
✅ Fayl: yo'q
✅ Matn: Ha (textarea da)
```

**Misol:**
```
Men bu vazifani Discord serverda bajardim.
Admin ruxsat berdi.
Link: discord.gg/...
```

---

### 2. **Faqat Fayl** ✅
```
✅ Fayl: Ha (har qanday tur)
✅ Matn: yo'q
```

**Qo'llab-quvvatlanadigan fayl turlari:**
- 📦 **Archive:** ZIP, RAR, 7Z, TAR, GZ
- 📄 **Hujjat:** PDF, DOCX, DOC, XLSX, XLS, PPTX, PPT, TXT
- 🖼️ **Rasm:** JPG, JPEG, PNG, GIF, BMP, SVG, WEBP
- 🎥 **Video:** MP4, AVI, MOV, MKV, WEBM
- 🎵 **Audio:** MP3, WAV, OGG
- 💻 **Kod:** JS, TS, PY, JAVA, CPP, HTML, CSS, JSON, XML

---

### 3. **Fayl + Matn** ✅
```
✅ Fayl: Ha
✅ Matn: Ha
```

**Misol:**
```
Fayl: loyiham.zip
Matn: GitHub: https://github.com/username/repo
      Live demo: https://netlify.app/...
      Qo'shimcha izoh: Dark mode qo'shildi
```

---

## 🎨 Yangi UI

### Textarea (ko'p qatorli matn)

Eski input o'rniga **textarea** qo'shildi:

```jsx
<textarea
  placeholder="GitHub link, Netlify link yoki uyga vazifa haqida izoh yozing..."
  rows={3}
/>
```

**Afzalliklari:**
- ✅ Ko'p qatorli matn
- ✅ Uzun linklar uchun qulay
- ✅ Vertikal resize (foydalanuvchi balandlikni o'zgartirishi mumkin)

### Label yangilandi

**Eski:**
```
GitHub link
```

**Yangi:**
```
Izoh, GitHub link yoki matn (ixtiyoriy)
```

**"(ixtiyoriy)"** - foydalanuvchi tushunadi kamida bitta kiriting degan gap.

### Yordam matni qo'shildi

```
Kamida bitta (fayl yoki matn) yuborilishi shart
```

Bu xabar textarea ostida ko'rsatiladi.

---

## 📝 Foydalanish Misollari

### Misol 1: Faqat GitHub Link
```
Textarea:
https://github.com/username/homework-8

Fayl: tanlangan emas
```
✅ Yuboriladi → Backend `comment` sifatida qabul qiladi

---

### Misol 2: Faqat Izoh
```
Textarea:
Bu vazifani Discord da bajardim.
Admin ruxsat bergan edi.

Fayl: tanlangan emas
```
✅ Yuboriladi → Backend oddiy matn sifatida qabul qiladi

---

### Misol 3: Faqat Fayl
```
Textarea: bo'sh

Fayl: homework.zip (3.5 MB)
```
✅ Yuboriladi → Faqat fayl

---

### Misol 4: Hammasi Birga
```
Textarea:
GitHub: https://github.com/user/repo
Netlify: https://app.netlify.com
Izoh: Dark mode va responsive qo'shildi

Fayl: screenshots.zip (2.1 MB)
```
✅ Yuboriladi → Fayl + batafsil izoh

---

## 🔧 Backend Field Mapping

Frontend yuboradi:
```javascript
FormData {
  file: [File object] (agar tanlangan bo'lsa),
  comment: "..." (agar kiritilgan bo'lsa)
}
```

Backend qabul qiladi:
```
POST /students/homeworkAnswer/{homeworkId}
Content-Type: multipart/form-data

file: binary (optional)
comment: string (optional)
```

**Muhim:** Kamida bittasi bo'lishi shart (file yoki comment)!

---

## ✅ Validation

### Frontend validation:

```javascript
if (!selectedFile && !githubLink.trim()) {
  toast.error('Iltimos, kamida bitta (fayl yoki matn) kiriting!');
  return;
}
```

### Backend validation:

Backend ham xuddi shunday tekshiradi:
- ❌ File yo'q VA comment yo'q → 400 Bad Request
- ✅ File bor → OK
- ✅ Comment bor → OK
- ✅ Ikkalasi bor → OK

---

## 🎯 UX Yaxshiliklari

### 1. Aniq label
```
❌ Eski: "GitHub link"
✅ Yangi: "Izoh, GitHub link yoki matn (ixtiyoriy)"
```

### 2. Ko'p qatorli input
```
❌ Eski: <input type="text">
✅ Yangi: <textarea rows={3}>
```

### 3. Placeholder matn
```
GitHub link, Netlify link yoki uyga vazifa haqida izoh yozing...
```

### 4. Yordam matni
```
Kamida bitta (fayl yoki matn) yuborilishi shart
```

### 5. Fayl turi cheklovsiz
```
<input type="file" />  // accept atributi yo'q
```
Har qanday fayl qabul qilinadi!

### 6. Validation xabari
```
❌ Eski: "Iltimos, fayl yoki GitHub linkini kiriting"
✅ Yangi: "Iltimos, kamida bitta (fayl yoki matn) kiriting!"
```

---

## 📊 Test Ssenariylari

| # | Fayl | Matn | Natija |
|---|------|------|--------|
| 1 | ✅ | ✅ | ✅ Yuboriladi |
| 2 | ✅ | ❌ | ✅ Yuboriladi |
| 3 | ❌ | ✅ | ✅ Yuboriladi |
| 4 | ❌ | ❌ | ❌ Validation xatosi |
| 5 | ❌ | `"   "` (faqat bo'sh joy) | ❌ Validation xatosi (`.trim()` ishlatiladi) |

---

## 💡 Foydalanuvchi Misollari

### Talaba 1: GitHub link yubordi
```
Matn: https://github.com/student1/homework-react
Fayl: yo'q
```

### Talaba 2: Fayl + Live demo
```
Matn: Live demo: https://myapp.netlify.app
Fayl: project-source.zip
```

### Talaba 3: Faqat izoh
```
Matn: Vazifa Discord serverda bajarildi, admin ruxsat bergan.
      Screenshot: [discord link]
Fayl: yo'q
```

### Talaba 4: Faqat fayl
```
Matn: bo'sh
Fayl: homework-presentation.pdf
```

---

## 🚀 Xulosa

Endi foydalanuvchi **istalgan formatda** uyga vazifa yuborishi mumkin:

✅ Oddiy matn (izoh, tushuntirish)  
✅ GitHub/Netlify/Vercel linklar  
✅ Har qanday fayl (ZIP, PDF, DOCX, MP4, ...)  
✅ Fayl + matn birgalikda  
✅ Ko'p qatorli matn (textarea)  
✅ Aniq UI (label, placeholder, yordam matni)  
✅ To'g'ri validation  

Hech narsa majburiy emas, lekin **kamida bitta** bo'lishi shart! 🎉
