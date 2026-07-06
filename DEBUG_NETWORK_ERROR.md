# Debug Network Error - Diagnostika

## Iltimos quyidagi qadamlarni bajaring:

### 1. Browser DevTools Network Tab

1. **F12** ni bosing (Developer Tools)
2. **Network** tabga o'ting
3. **Preserve log** ni yoqing (checkboxni belgilang)
4. **All** filterni tanlang
5. Uyga vazifani qayta yuklashga harakat qiling
6. Network tabda **homeworkAnswer** so'rovini toping
7. Uning ustiga bosing va quyidagilarni ko'ring:
   - **Status:** qanday status (404, 500, failed, canceled)?
   - **Type:** fetch, xhr, document?
   - **Size:** fayl hajmi ko'rsatiladimi?
   - **Time:** qancha vaqt kutdi?

**Screenshotni yoki ma'lumotlarni yuboring!**

---

### 2. Vite Terminal Loglarini Tekshiring

Terminal da (npm run dev ishlab turgan joyda) quyidagi xatolar bormi?

```
[homework upload proxy error] ...
[vite] http proxy error: ...
ECONNREFUSED ...
ETIMEDOUT ...
```

**Terminal loglarini copy-paste qiling!**

---

### 3. Vite Serverni To'liq Restart Qiling

```bash
# Terminal da:
Ctrl+C  (serverni to'xtatish)

# Portni tozalash (agar zarur bo'lsa):
# Windows da:
netstat -ano | findstr :5173
taskkill /PID <PID_RAQAMI> /F

# Qayta ishga tushirish:
npm run dev
```

---

### 4. Browser Cache ni Tozalash

1. **Ctrl+Shift+Delete** (Clear browsing data)
2. **Cached images and files** ni tanlang
3. **Time range: Last hour**
4. **Clear data**
5. **Sahifani qayta yuklang**: Ctrl+F5 (hard reload)

---

### 5. Kichik Fayl Bilan Test Qiling

Katta fayl (3.7 MB) o'rniga **kichik fayl** bilan sinab ko'ring:

1. Oddiy text fayl yarating: `test.txt` (1-2 KB)
2. Yoki kichik rasm (< 100 KB)
3. Yuklashga harakat qiling

**Kichik fayl ishlasami?**

---

### 6. Backend To'g'ridan To'g'ri Ulanish (Test)

`.env.development` faylini oching va qo'shing:

```env
VITE_FORCE_DIRECT_API=true
```

Keyin:
1. Vite serverni restart qiling
2. Sahifani F5 bilan yangilang
3. Uyga vazifani qayta yuklang

**Bu ishlasami?**

---

## Kutilayotgan natija:

Agar **kichik fayl ishlasa** - Vite proxy katta fayllarni hali to'g'ri handle qilmayapti.

Agar **hech narsa ishlamasa** - Backend muammosi yoki token expired.

Agar **VITE_FORCE_DIRECT_API=true bilan ishlasa** - Vite proxy muammosi.

---

## Yordamchi Debug Kod

Ushbu kodni console da ishga tushiring (Browser DevTools > Console):

```javascript
// Token tekshirish:
console.log('Token:', localStorage.getItem('token')?.substring(0, 20) + '...');

// Manual test (kichik fayl):
const testUpload = async () => {
  const formData = new FormData();
  const blob = new Blob(['test'], { type: 'text/plain' });
  const file = new File([blob], 'test.txt', { type: 'text/plain' });
  formData.append('file', file);
  
  try {
    const response = await fetch('/api/v1/students/homeworkAnswer/293', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
    console.log('Status:', response.status);
    console.log('Response:', await response.json());
  } catch (err) {
    console.error('Error:', err);
  }
};

// Ishga tushirish:
testUpload();
```

**Console output ni yuboring!**
