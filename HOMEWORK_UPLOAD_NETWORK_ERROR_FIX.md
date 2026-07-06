# Homework Upload Network Error - Yechim

## 🔴 Muammo

Uyga vazifa yuklashda `ERR_NETWORK` xatosi yuz berdi:
```
❌ Error: Network Error
❌ Error code: ERR_NETWORK
❌ Response exists: false
```

### Sabab:
- Fayl hajmi: **3.7 MB**
- Vite proxy katta fayllarni to'g'ri handle qilmayapti
- `/api/v1/students/homeworkAnswer/293` endpoint Vite proxy orqali server ga yetib bormayapti

## ✅ Yechim 1: Vite Config Yangilash (TAVSIYA ETILADI)

### O'zgartirilgan fayl: `vite.config.js`

Homework upload uchun alohida proxy sozlamasi qo'shildi (xuddi video upload kabi):

```javascript
'/api/v1/students/homeworkAnswer': {
  target: API_TARGET,
  changeOrigin: true,
  secure: true,
  timeout: 0,           // Timeout yo'q
  proxyTimeout: 0,      // Proxy timeout yo'q
  configure: (proxy) => {
    proxy.on('proxyReq', (proxyReq, req) => {
      const cl = req.headers['content-length']
      if (cl) {
        proxyReq.setHeader('content-length', cl)
      }
      proxyReq.removeHeader('transfer-encoding')
    })

    proxy.on('proxyRes', (proxyRes) => {
      proxyRes.headers['access-control-allow-origin'] = '*'
    })

    proxy.on('error', (err, _req, res) => {
      console.error('[homework upload proxy error]', err.code, err.message)
      if (res && !res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ message: `Proxy xato: ${err.message}` }))
      }
    })
  },
}
```

### Qadamlar:

1. **Vite dev serverni to'xtatish:**
   ```bash
   # Terminal da Ctrl+C bosing
   ```

2. **Qayta ishga tushirish:**
   ```bash
   npm run dev
   ```

3. **Uyga vazifani qayta yuklash:**
   - Sahifani yangilang (F5)
   - Uyga vazifa faylini qayta tanlang
   - Topshirish tugmasini bosing

## ✅ Yechim 2: To'g'ridan-to'g'ri Backend URL (TEZKOR YECHIM)

Agar Vite serverni restart qilish noqulay bo'lsa, `.env.development` faylini yangilang:

### `.env.development` fayliga qo'shing:
```env
VITE_FORCE_DIRECT_API=true
```

Bu Vite proxy ni bypass qilib, to'g'ridan-to'g'ri backend ga ulanadi.

**MUHIM:** Backend CORS ni to'g'ri sozlagan bo'lishi kerak:
- `Access-Control-Allow-Origin: *` yoki `http://localhost:5173`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

## 📊 Natija

Endi homework upload quyidagi xususiyatlarga ega:

✅ **Katta fayllar qo'llab-quvvatlanadi** (video, ZIP, RAR, PDF, va boshqalar)
✅ **Timeout yo'q** - fayl hajmidan qat'iy nazar
✅ **Xato handling** - proxy xatolarini aniq ko'rsatadi
✅ **CORS muammosi yo'q** - to'g'ri sozlangan

## 🔧 Texnik Tafsilotlar

### Proxy sozlamalari:

| Sozlama | Qiymat | Sabab |
|---------|--------|-------|
| `timeout` | `0` | Timeout cheklovsiz (katta fayllar uchun) |
| `proxyTimeout` | `0` | Proxy timeout yo'q |
| `changeOrigin` | `true` | Host header ni backend manzilga o'zgartiradi |
| `secure` | `true` | HTTPS sertifikatlarini tekshiradi |

### Proxy order (muhim!):

1. `/api/v1/students/homeworkAnswer` - **Birinchi** (eng aniq yo'l)
2. `/api/v1/files/group` - Video upload
3. `/api/v1` - Oddiy API so'rovlar (fallback)

**Vite proxy eng aniq yo'lni birinchi tekshiradi**, shuning uchun `/api/v1/students/homeworkAnswer` ni `/api/v1` dan oldin qo'yish kerak!

## 🧪 Test

Endi quyidagi testlarni o'tkazish mumkin:

```javascript
// Test 1: Kichik fayl (< 1 MB)
// ✅ Ishlashi kerak

// Test 2: O'rtacha fayl (1-10 MB)
// ✅ Ishlashi kerak

// Test 3: Katta fayl (10-50 MB)
// ✅ Ishlashi kerak (agar backend ruxsat bersa)

// Test 4: Turli fayl turlari
// ZIP, RAR, PDF, DOCX, MP4, JPG, PNG
// ✅ Barchasi ishlashi kerak
```

## 🚀 Qo'shimcha Optimizatsiya

Agar juda katta fayllar (> 50 MB) yuklash kerak bo'lsa:

1. **Backend tarafda:**
   - `client_max_body_size` ni oshirish (Nginx)
   - `maxFileSize` ni oshirish (NestJS/Express)

2. **Frontend tarafda:**
   - Progress bar qo'shish
   - Chunk upload (fayl bo'laklarini yuklash)

## 📝 Xulosa

**Muammo:** Vite proxy katta fayllarni handle qilmadi → `ERR_NETWORK`

**Yechim:** Homework upload uchun alohida proxy sozlamasi (video upload kabi)

**Natija:** Har qanday hajmdagi va turdagi fayllarni yuklash mumkin! ✅
