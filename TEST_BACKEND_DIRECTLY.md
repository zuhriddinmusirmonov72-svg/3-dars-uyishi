# Backend To'g'ridan-To'g'ri Test Qilish

## Muammo:
Frontend dan `ERR_NETWORK` xatosi chiqmoqda. Backend server ishlayotganini va endpoint to'g'ri ekanini tekshirish kerak.

---

## Test 1: Swagger orqali test

1. **Swagger URL ni oching:**
   ```
   https://najot-edu.softwareengineer.uz/api/docs
   ```
   yoki
   ```
   https://najot-edu.softwareengineer.uz/swagger
   ```

2. **Login qiling:**
   - `/auth/login` endpoint
   - Phone va password kiriting
   - Token oling

3. **Homework submit endpoint ni toping:**
   - `POST /students/homeworkAnswer/{homeworkId}`
   - **Authorize** tugmasini bosing va token kiriting
   - homeworkId = `293` (yoki sizning homework ID)
   - File va comment kiriting
   - **Execute** ni bosing

4. **Natija:**
   - ✅ 200/201 = Backend ishlayapti
   - ❌ 400/500 = Backend muammosi
   - ❌ No response = Backend server to'xtagan

---

## Test 2: Postman orqali test

1. **Postman ochish**

2. **POST request yaratish:**
   ```
   POST https://najot-edu.softwareengineer.uz/api/v1/students/homeworkAnswer/293
   ```

3. **Headers:**
   ```
   Authorization: Bearer YOUR_TOKEN_HERE
   ```

4. **Body (form-data):**
   ```
   file: [fayl tanlang]
   comment: Test homework upload
   ```

5. **Send tugmasini bosing**

6. **Response:**
   - ✅ 200/201 = Ishlayapti
   - ❌ 400/401/500 = Xatolik

---

## Test 3: cURL orqali test (Terminal)

```bash
curl -X POST "https://najot-edu.softwareengineer.uz/api/v1/students/homeworkAnswer/293" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@C:\path\to\file.png" \
  -F "comment=Test upload"
```

**Windows PowerShell:**
```powershell
$token = "YOUR_TOKEN"
$uri = "https://najot-edu.softwareengineer.uz/api/v1/students/homeworkAnswer/293"

$form = @{
    file = Get-Item -Path "C:\path\to\rasm.png"
    comment = "Test upload"
}

Invoke-RestMethod -Uri $uri -Method Post -Headers @{Authorization="Bearer $token"} -Form $form
```

---

## Test 4: Browser Console orqali to'g'ridan-to'g'ri fetch

Browser Console da (F12 > Console):

```javascript
// Token olish
const token = localStorage.getItem('token');
console.log('Token:', token ? 'Mavjud' : 'YO\'Q!');

// Test fayl yaratish
const testBlob = new Blob(['test content'], { type: 'text/plain' });
const testFile = new File([testBlob], 'test.txt', { type: 'text/plain' });

// FormData yaratish
const formData = new FormData();
formData.append('file', testFile);
formData.append('comment', 'Browser console test');

// To'g'ridan-to'g'ri backend ga yuborish (CORS tekshirish)
fetch('https://najot-edu.softwareengineer.uz/api/v1/students/homeworkAnswer/293', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
.then(response => {
  console.log('✅ Status:', response.status);
  return response.json();
})
.then(data => {
  console.log('✅ Response:', data);
})
.catch(error => {
  console.error('❌ Error:', error.message);
  if (error.message.includes('CORS')) {
    console.error('🔴 CORS muammosi - backend CORS sozlamalarini tekshiring');
  }
});
```

---

## Natijalarni tahlil qilish:

### Agar Swagger/Postman/cURL ishlasa, lekin frontend ishlamasa:
- ✅ Backend ishlayapti
- ❌ Frontend Vite proxy muammosi
- **Yechim:** `VITE_FORCE_DIRECT_API=true` yoqing

### Agar hech narsa ishlamasa:
- ❌ Backend endpoint mavjud emas
- ❌ Token expired yoki noto'g'ri
- ❌ Backend server to'xtagan

### Agar Browser console fetch da CORS xatosi chiqsa:
- ❌ Backend CORS sozlamalari noto'g'ri
- **Backend admin ga xabar bering:**
  ```
  Access-Control-Allow-Origin: http://localhost:5173
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
  Access-Control-Allow-Headers: Content-Type, Authorization
  ```

---

## MUHIM:

Agar **hech qanday test ishlamasa**, bu backend muammosi. Backend dasturchiga murojaat qiling:

1. Endpoint ishlayaptimi: `POST /students/homeworkAnswer/{homeworkId}`
2. Token to'g'rimi: `Bearer eyJ...`
3. multipart/form-data qabul qiladimi
4. Fayl hajmi limiti qanchaga: 3.7 MB kattami?

---

## Tezkor Yechim (vaqtinchalik):

Agar backend CORS sozlagan bo'lsa:

1. `.env.development` da:
   ```
   VITE_FORCE_DIRECT_API=true
   ```

2. Vite restart:
   ```bash
   Ctrl+C
   npm run dev
   ```

3. Sahifa yangilang: **Ctrl+F5**

4. Qayta sinang

Bu Vite proxy ni bypass qiladi va to'g'ridan-to'g'ri backend ga ulanadi.
