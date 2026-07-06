# Video Upload Test

## Test qilish:

1. Brauzerda **Ctrl + Shift + R** bosing (cache tozalash)
2. **F12** > **Console** va **Network** tablarini oching
3. Guruh sahifasiga o'ting → **Videolar** → **+ Qo'shish**
4. Kichik video tanlang (1-5 MB)
5. Darsni tanlang
6. **Yuklash** bosing

## Console loglarni tekshiring:

Quyidagi loglar ko'rinishi kerak:
```
📤 Video yuklash boshlandi: {grupId, lessonId, fileName, fileSize}
🔗 Upload URL: /api/v1/files/group/58/upload?lessonId=1
📊 Yuklash jarayoni: 50%
📥 Server javobi: {status: 200, statusText: 'OK'}
✅ Video muvaffaqiyatli yuklandi: {...}
```

## Agar xato chiqsa:

### Console da:
```
❌ Yuklash xatosi: {status: 400, error: {...}}
```

### Network tabda:
1. **Failed** yoki **qizil** so'rovni bosing
2. **Headers** tabida:
   - Request URL
   - Request Method: POST
   - Status Code: 4xx yoki 5xx
3. **Payload** tabida:
   - Form Data ko'rinishi kerak
   - file: (binary)
4. **Response** tabida:
   - Xato xabari

## Menga yuboring:

1. Console dagi barcha loglar (screenshot yoki copy-paste)
2. Network > Headers > Request URL va Status Code
3. Network > Payload > Form Data
4. Network > Response > xato xabari

Shunda men aniq muammoni topaman! 🔍
