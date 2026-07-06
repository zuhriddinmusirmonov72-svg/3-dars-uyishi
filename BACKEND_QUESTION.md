# Backend Developer ga savollar

## Vaziyat:
Video yuklash muvaffaqiyatli ishlayapti (POST /api/v1/files/group/{groupId}/upload?lessonId={lessonId}).

Lekin yuklangan videoni ko'rish uchun URL topilmayapti.

## Sinab ko'rilgan URLlar (barchasi 404 qaytardi):
```
❌ https://najot-edu.softwareengineer.uz/uploads/1780491483824.mp4
❌ https://najot-edu.softwareengineer.uz/uploads/videos/1780491483824.mp4
❌ https://najot-edu.softwareengineer.uz/static/videos/1780491483824.mp4
❌ https://najot-edu.softwareengineer.uz/files/1780491483824.mp4
❌ https://najot-edu.softwareengineer.uz/public/1780491483824.mp4
```

## Savollar:

### 1. Video qayerga saqlanadi?
Backend videoni qaysi papkaga saqlaydi?
- `/var/www/app/uploads/` ?
- `/var/www/app/public/videos/` ?
- `/var/www/app/static/` ?
- Boshqa joy?

### 2. Video URL qanday bo'lishi kerak?
Yuklangan video faylini qanday URL orqali ochish mumkin?

Masalan, `1780491483824.mp4` fayli uchun:
- `https://najot-edu.softwareengineer.uz/???/1780491483824.mp4`

`???` o'rniga nima bo'lishi kerak?

### 3. Nginx konfiguratsiyasi
Nginx static files uchun sozlanganmi?

```nginx
location /uploads/ {
    alias /var/www/app/uploads/;
    try_files $uri $uri/ =404;
}
```

Yoki boshqa location?

### 4. Upload javobini tekshirish
POST /api/v1/files/group/{groupId}/upload API javobida nima qaytaradi?

```json
{
  "id": 123,
  "video_url": "???",  // <-- Bu qanday format?
  "path": "???",
  "url": "???"
}
```

### 5. Video ko'rish uchun endpoint bormi?
Swagger da video yuklab olish uchun endpoint bormi?
- GET /api/v1/files/download/{id}
- GET /api/v1/files/stream/{id}
- GET /api/v1/files/view/{id}

Yoki videolar faqat static files orqali ochilishi kerakmi?

---

## Iltimos javob bering:
1. Video fayl qayerda saqlanadi (to'liq path)
2. Video URL qanday formatda bo'lishi kerak
3. Nginx static files sozlamasini ko'rsating (agar mavjud bo'lsa)

Shunda frontend kodini tuzatamiz!
