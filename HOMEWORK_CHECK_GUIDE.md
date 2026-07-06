# Uy Vazifalarini Tekshirish - Yo'riqnoma

## API Endpoints

### 1. Barcha uy vazifalar (SUPERADMIN, ADMIN)
```
GET /api/v1/homework/all
```
Tizimdagi barcha uy vazifalarni qaytaradi.

### 2. Guruh bo'yicha uy vazifalar (CRUD API)
```
GET /api/v1/homework/{groupId}
```
**groupId** - guruh ID raqami (masalan: 59)

Bu endpoint shu guruhning barcha uy vazifalarini qaytaradi.

**Misol:** 
```
GET https://najot-edu.softwareengineer.uz/api/v1/homework/59
```
Bu 59-guruhning barcha uy vazifalarini qaytaradi.

### 3. O'quvchi uy vazifasi natijasi
```
GET /api/v1/group/{groupId}/homework/{homeworkId}/result/{studentId}
```

**Misollar:**
```
GET /api/v1/homework/all                              # Barcha homework
GET /api/v1/homework/59                               # 59-guruh homework lari
GET /api/v1/group/59/homework/1/result/1              # 1-o'quvchining 1-homework natijasi
```

## Qanday Ishlaydi?

### 1. Guruh Darsliklariga kirish
- Guruhlar sahifasidan biror guruhni tanlang
- "Guruh Darsliklari" tabiga o'ting
- Biror darsni tanlang (masalan: `2024-05-15` sanasidagi dars)

### 2. Homework yuklash jarayoni
Sahifa ochilganda quyidagi ketma-ketlikda homework yuklanadi:

1. **Birinchi usul**: `GET /homework/{groupId}` - guruh bo'yicha uy vazifalar
   - **groupId** = URL dagi guruh ID (masalan: `/groups/59/lesson?date=...` → groupId = 59)
   - So'rov: `GET /api/v1/homework/59` 
   - Agar topilsa → homework list ga qo'shiladi
   - Console: `📚 Homework API javobi (getByGroup)`

2. **Ikkinchi usul** (agar birinchi usulda topilmasa yoki bo'sh massiv qaytsa):
   - `GET /homework/all` - barcha uy vazifalar
   - Guruh ID bo'yicha JavaScript da filtrlash:
     ```javascript
     allHomework.filter(h => h.group_id === 59)
     ```
   - Console: `📚 Barcha homework API javobi (getAll)`
   - Console: `🔍 Filtrlangan homework`

**Muhim:** 
- Oxiridagi `59` bu **guruh ID**si (adashib ketmang!)
- `/homework/59` demak "59-guruhning uy vazifalari"
- `/homework/1` demak "1-guruhning uy vazifalari"

### 3. O'quvchini tanlash
- Dars sahifasida o'quvchilar jadvali ko'rsatiladi
- Biror o'quvchi qatoriga bosing (masalan: "Forever dream")
- Modal oyna avtomatik ochiladi

### 4. Homework topish logikasi
O'quvchini bosganda, quyidagi ketma-ketlikda homework qidiriladi:

1. **Lesson ID bo'yicha**: `homework.lesson_id === lesson.id`
2. **Sana bo'yicha**: `homework.date === date` (agar 1-usulda topilmasa)
3. **Birinchi homework**: Agar hech narsa topilmasa, birinchi homework olinadi

Console da quyidagilar ko'rsatiladi:
```javascript
👤 O'quvchi tanlandi: { ... }
📚 Mavjud homework list: [...]
📖 Hozirgi dars: { id: 5, topic: "..." }
🎯 Topilgan homework: { id: 1, lesson_id: 5 }
```
- ✅ **Uy vazifasi izohi** - Homework description/title
- ✅ **O'quvchi ma'lumotlari**:
  - Ism
  - Topshirish vaqti
  - Yuklangan fayllar soni
  - Status (Kutayabti/Qabul qilingan/Qaytarildi)
- ✅ **Fayllar** - Grid ko'rinishida (rasm bo'lsa preview)
- ✅ **Link** - GitHub yoki boshqa URL
- ✅ **Ball berish** - 0-100 oralig'ida slider
- ✅ **Izoh yozish** - Teacher comment

### 4. Ball berish qoidasi
- **60-100 ball** → Status: `ACCEPTED` ✅ (Qabul qilingan)
- **0-59 ball** → Status: `REJECTED` ❌ (Qaytarildi)

### 5. Console.log orqali debug
Brauzer console (F12) da quyidagi loglarni ko'rasiz:

```javascript
// O'quvchi tanlanganda
👤 O'quvchi tanlandi: { id: 1, name: "Forever dream", ... }
📚 Mavjud homework list: [...]
📖 Hozirgi dars: { id: 5, topic: "...", ... }
🎯 Topilgan homework: { id: 1, lesson_id: 5, ... }
✅ Modal ochilmoqda: { groupId: 59, homeworkId: 1, studentId: 1 }

// API so'rov yuborilganda
📡 O'quvchi uy vazifasini yuklash: { groupId: 59, homeworkId: 1, studentId: 1 }
✅ API javobi (to'liq): { data: { ... } }
📦 O'quvchi uy vazifasi ma'lumotlari: { student_id: 1, files: [...], ... }
```

## API Response Strukturasi (Kutilayotgan)

Backend quyidagi strukturada javob qaytarishi kerak:

```json
{
  "data": {
    "student_id": 1,
    "student": {
      "id": 1,
      "full_name": "Forever dream",
      "first_name": "Forever",
      "last_name": "dream"
    },
    "homework_id": 1,
    "score": 85,
    "comment": "Yaxshi bajarilgan!",
    "teacher_comment": "Zo'r natija",
    "status": "ACCEPTED",
    "submitted_at": "2024-05-15T10:30:00Z",
    "created_at": "2024-05-15T10:30:00Z",
    "files": [
      {
        "id": 1,
        "name": "homework.pdf",
        "url": "/uploads/homework.pdf",
        "path": "/uploads/homework.pdf"
      }
    ],
    "link": "https://github.com/student/homework",
    "github_link": "https://github.com/student/homework"
  }
}
```

## Xato bo'lsa?

Agar API xato qaytarsa:
- ❌ Console da xato ko'rsatiladi
- ⚠️ Toast xabari chiqadi
- 📋 Modal baribir ochiladi (bo'sh ma'lumotlar bilan)

## Kod Joylashuvi

- **API**: `src/api/api.js` → `homeworkAPI.getStudentResult()`
- **Modal**: `src/components/HomeworkCheckPanel.jsx`
- **Sahifa**: `src/pages/GroupLesson.jsx` → `handleStudentClick()`

## Test Qilish Uchun

1. `npm run dev` ishga tushiring
2. Login qiling
3. Guruhga kiring
4. Darsni tanlang
5. O'quvchini bosing
6. F12 (DevTools) ochib console loglarni kuzating
7. Network tabda API so'rovni ko'ring

---

✅ **Tayyor!** Endi siz o'quvchilarning uy vazifalarini to'liq tekshirishingiz mumkin!
