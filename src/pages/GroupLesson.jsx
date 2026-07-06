import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { FiChevronLeft } from "react-icons/fi";
import { FaUser } from "react-icons/fa";
import toast from "react-hot-toast";
import HomeworkCheckPanel from "../components/HomeworkCheckPanel";
import {
  api,
  groupsAPI,
  teachersAPI,
  lessonsAPI,
  attendanceAPI,
  homeworkAPI,
  parseApiError,
  fetchHomeworkByGroup,
} from "../api/api";
import {
  formatLessonDateLabel,
  flattenScheduleDays,
  parseSchedules,
} from "../utils/schedule";
import {
  buildCompletedDatesSet,
  markDateCompleted,
  isDateCompleted,
  LESSON_ALREADY_DONE_MESSAGE,
} from "../utils/attendanceSchedule";

const unwrapList = (raw) => {
  const data = raw?.data?.data ?? raw?.data ?? raw ?? [];
  return Array.isArray(data) ? data : [];
};

const getStudentName = (s) =>
  s?.full_name ||
  `${s?.first_name || ""} ${s?.last_name || ""}`.trim() ||
  s?.name ||
  "—";

const getTeacherName = (t) =>
  t?.full_name ||
  `${t?.first_name || ""} ${t?.last_name || ""}`.trim() ||
  t?.name ||
  "—";

const parseLessonResponse = (res) => {
  const body = res?.data?.data ?? res?.data;
  if (!body || typeof body !== "object") return null;
  if (Array.isArray(body)) {
    return body.find((l) => l?.id != null) || body[0] || null;
  }
  if (body.lesson && typeof body.lesson === "object") return body.lesson;
  if (body.id != null || body.topic) return body;
  return null;
};

const lessonMatchesDate = (lesson, dateStr) => {
  const d = String(
    lesson?.date || lesson?.lesson_date || lesson?.lessonDate || ""
  ).slice(0, 10);
  return d === dateStr;
};

const attendanceMatchesDay = (record, groupId, date, lessonId) => {
  // ✅ Guruh ID tekshirish
  const recordGroupId = String(record.group_id ?? record.groupId ?? '');
  if (recordGroupId && recordGroupId !== String(groupId)) {
    return false;
  }
  
  // ✅ Birinchi sana bo'yicha tekshirish (eng ishonchli)
  const recordDate = String(
    record.date || record.lesson_date || record.lessonDate || record.attendance_date || ''
  ).slice(0, 10);
  
  if (recordDate && date) {
    const matches = recordDate === date;
    if (matches) {
      console.log('✅ Sana bo\'yicha mos:', { recordDate, date, student_id: record.student_id });
    }
    return matches;
  }
  
  // ✅ Agar sana yo'q bo'lsa, lesson_id bo'yicha tekshirish
  if (lessonId) {
    const recordLessonId = String(record.lesson_id ?? record.lessonId ?? '');
    const matches = recordLessonId === String(lessonId);
    if (matches) {
      console.log('✅ Lesson ID bo\'yicha mos:', { recordLessonId, lessonId, student_id: record.student_id });
    }
    return matches;
  }
  
  return false;
};

const GroupLesson = () => {
  const { id: groupId } = useParams();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/super-admin-2') ? '/super-admin-2/groups' : '/groups';
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const date = searchParams.get('date');

  const isFutureDate = (() => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    return target.getTime() > today.getTime();
  })();

  console.log('=== GroupLesson Component ===');
  console.log('groupId:', groupId);
  console.log('date:', date);
  console.log('searchParams:', Object.fromEntries(searchParams));

  const [group, setGroup] = useState(null);
  const [students, setStudents] = useState([]);
  const [lesson, setLesson] = useState(null);
  const [presence, setPresence] = useState({});
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [topicSource, setTopicSource] = useState("other");
  const [roleTab, setRoleTab] = useState("teacher");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAttendanceExists, setSavedAttendanceExists] = useState(false);
  const [loadingError, setLoadingError] = useState(null);
  
  // ✅ So'rovlarni bir marta yuborish uchun ref
  const loadingRef = useRef(false);
  const loadedRef = useRef(false);
  
  // ✅ Homework check modal uchun state
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [currentHomework, setCurrentHomework] = useState(null);
  const [homeworkList, setHomeworkList] = useState([]);
  
  // READ-ONLY rejim - Davomat qilingan bo'lsa o'zgartirilmasligi kerak
  // ✅ Backend davomat mavjud bo'lsa yoki lessonCompleted bo'lsa read-only
  const isReadOnly = savedAttendanceExists || lesson?.isCompleted || lesson?.status === 'completed';

  const teachers = useMemo(() => {
    if (!group) return [];
    if (Array.isArray(group.teachers)) return group.teachers;
    if (group.teacher) return [group.teacher];
    if (group.mentor) return [group.mentor];
    return [];
  }, [group]);

  const displayTeacher =
    roleTab === "assistant"
      ? teachers[1] || teachers[0]
      : teachers[0] || teachers[1];

  const lessonStatus = lesson?.status || lesson?.state || "Dars o'tilmagan";

  const loadPage = async () => {
    // ✅ Agar allaqachon yuklanayotgan bo'lsa, to'xtatish
    if (loadingRef.current) {
      console.log('⚠️ Sahifa allaqachon yuklanmoqda, takroriy so\'rov bekor qilindi');
      return;
    }
    
    if (!groupId || !date) {
      setLoading(false);
      return;
    }
    
    // ✅ Yuklash boshlanganini belgilash
    loadingRef.current = true;
    setLoading(true);
    setLoadingError(null);
    
    console.log('🔄 loadPage boshlandi:', { groupId, date });

    try {
      const userObj = JSON.parse(localStorage.getItem('user') || '{}');
      const isTeacher = userObj.role === 'TEACHER' || location.pathname.startsWith('/super-admin-2');

      // ✅ Parallel so'rovlar - tezroq yuklash uchun
      // Teacher uchun: my/groups API dan ham guruh ham studentlar keladi
      const [groupRes, myGroupsRes, studentsRes, lessonRes, attendanceRes, homeworkRes] =
        await Promise.allSettled([
          groupsAPI.getById(groupId),
          isTeacher ? teachersAPI.getMyGroups() : Promise.resolve(null),
          isTeacher ? Promise.resolve(null) : groupsAPI.getStudents(groupId).catch(() => ({ data: [] })),
          groupsAPI.getLessonByDate(groupId, date),
          attendanceAPI.getByGroup(groupId).catch(() => attendanceAPI.getAll()),
          fetchHomeworkByGroup(groupId),
        ]);

      console.log('✅ Barcha so\'rovlar bajarildi');

      if (groupRes.status === "fulfilled") {
        const gData = groupRes.value.data?.data || groupRes.value.data;
        setGroup(gData);
      } else {
        console.warn('⚠️ Guruh ma\'lumoti yuklanmadi, lekin davom etamiz');
        setGroup({ id: groupId });
      }

      // ============================================================
      // O'QUVCHILARNI YUKLASH — Ko'p manbali fallback strategiyasi
      // 1) Teacher => /teachers/my/groups dan o'sha guruhni topamiz
      // 2) Admin   => /groups/one/students/{groupId}
      // 3) Fallback: getById javobidagi embedded students
      // 4) Fallback: to'g'ridan-to'g'ri /groups/one/students/{groupId}
      // ============================================================
      let studentList = [];

      // --- 1. Teacher: /teachers/my/groups ---
      if (isTeacher && myGroupsRes.status === "fulfilled") {
        const allGroups = myGroupsRes.value?.data?.data || myGroupsRes.value?.data || [];
        const myGroup = (Array.isArray(allGroups) ? allGroups : []).find(
          (g) => String(g.id) === String(groupId)
        );
        const embedded = myGroup?.students || myGroup?.student || [];
        if (Array.isArray(embedded) && embedded.length > 0) {
          studentList = embedded.map(s => {
            if (s.student) {
              return {
                ...s.student,
                photo: s.student.photo || s.photo || s.image || s.profile_photo,
                image: s.student.image || s.image || s.photo
              };
            }
            return s;
          });
          console.log('✅ [1] Teacher myGroups dan studentlar:', studentList.length);
        } else {
          console.warn('⚠️ [1] Teacher myGroups da bu guruh topilmadi yoki students bo\'sh');
        }
      }

      // --- 2. Admin: studentsRes ---
      if (studentList.length === 0 && !isTeacher && studentsRes && studentsRes.status === "fulfilled") {
        studentList = unwrapList(studentsRes.value);
        console.log('✅ [2] Admin getStudents dan studentlar:', studentList.length);
      }

      // --- 3. Fallback: getById javobidagi embedded students ---
      if (studentList.length === 0 && groupRes.status === "fulfilled") {
        const gData = groupRes.value.data?.data || groupRes.value.data;
        const embedded = gData?.students || gData?.student || [];
        if (Array.isArray(embedded) && embedded.length > 0) {
          studentList = embedded.map(s => {
            if (s.student) {
              return {
                ...s.student,
                photo: s.student.photo || s.photo || s.image || s.profile_photo,
                image: s.student.image || s.image || s.photo
              };
            }
            return s;
          });
          console.log('✅ [3] Fallback getById embedded students:', studentList.length);
        }
      }

      // --- 4. Oxirgi fallback: to'g'ridan-to'g'ri getStudents ---
      if (studentList.length === 0) {
        console.warn('⚠️ [4] Hali ham studentlar yo\'q — to\'g\'ridan-to\'g\'ri getStudents so\'ralmoqda...');
        try {
          const directStudentsRes = await groupsAPI.getStudents(groupId);
          const directList = unwrapList(directStudentsRes);
          if (directList.length > 0) {
            studentList = directList.map(s => s.student || s);
            console.log('✅ [4] To\'g\'ridan-to\'g\'ri getStudents:', studentList.length);
          }
        } catch (err) {
          console.error('❌ [4] getStudents ham muvaffaqiyatsiz:', err?.response?.status, err?.message);
        }
      }

      // --- 5. Super Fallback: my/groups ichidan boshqa yo'l ---
      if (studentList.length === 0 && myGroupsRes.status === "fulfilled") {
        const allGroups = myGroupsRes.value?.data?.data || myGroupsRes.value?.data || [];
        const allGroupsArr = Array.isArray(allGroups) ? allGroups : [];
        // Guruhni ID bilan topishga urinish (string va number sifatida)
        const myGroup = allGroupsArr.find(
          (g) => String(g.id) === String(groupId) || Number(g.id) === Number(groupId)
        );
        console.log('🔍 [5] myGroups guruh qidirish: groupId=', groupId, 'topildi=', !!myGroup, 'jami guruhlar=', allGroupsArr.length);
        if (myGroup) {
          const embedded = myGroup?.students || myGroup?.student || myGroup?.members || [];
          if (Array.isArray(embedded)) {
            studentList = embedded.map(s => s.student || s).filter(s => s?.id);
            console.log('✅ [5] myGroups fallback students:', studentList.length);
          }
        }
      }

      console.log('📊 Yakuniy studentList uzunligi:', studentList.length);
      setStudents(studentList);
      
      // ✅ Homework list yuklash (GET /homework/all → guruh bo'yicha filtrlash)
      if (homeworkRes.status === "fulfilled") {
        const hwList = Array.isArray(homeworkRes.value) ? homeworkRes.value : [];
        console.log('📚 Homework list (all → filtered):', hwList);
        setHomeworkList(hwList);
      } else {
        console.warn('⚠️ Homework yuklashda xato:', homeworkRes.reason);
      }

      let lessonData = null;
      if (lessonRes.status === "fulfilled") {
        lessonData = parseLessonResponse(lessonRes.value);
      }

      // ✅ Agar bitta lesson topilmasa, barcha darslar ichidan qidirish
      if (!lessonData?.id) {
        try {
          const lessonsRes = await lessonsAPI.getMyGroupLessons(groupId);
          const fromList = unwrapList(lessonsRes).find((l) =>
            lessonMatchesDate(l, date)
          );
          if (fromList) lessonData = fromList;
        } catch {
          // ignore
        }
      }

      // ✅ Lesson topilgan bo'lsa, ma'lumotlarini o'rnatish
      if (lessonData?.id || lessonData?.topic) {
        // Agar lesson obyektida sana bo'lmasa, URL dan olingan sanani qo'shamiz
        const lessonWithDate = {
          ...lessonData,
          date: lessonData.date || lessonData.lesson_date || lessonData.lessonDate || date,
          lesson_date: lessonData.lesson_date || lessonData.date || lessonData.lessonDate || date,
        };
        
        setLesson(lessonWithDate);
        setTopic(lessonData.topic || "");
        setDescription(lessonData.description || "");
        console.log('✅ Lesson topildi:', {
          id: lessonData.id,
          topic: lessonData.topic,
          date: lessonWithDate.date,
          description: lessonData.description
        });
      } else {
        // Agar dars topilmasa, lekin sana bo'lsa, bo'sh holatda qoldiramiz
        setLesson(null);
        setTopic("");
        setDescription("");
        console.log('⚠️ Lesson topilmadi, yangi dars yaratiladi');
      }

      const lessonId = lessonData?.id;
      // ✅ Attendance API dan kelgan ma'lumotlarni parse qilish
      let allAttendance = [];
      if (attendanceRes.status === "fulfilled") {
        const attData = attendanceRes.value?.data?.data || attendanceRes.value?.data || [];
        allAttendance = Array.isArray(attData) ? attData : [];
        allAttendance = allAttendance.filter(
          (a) => String(a.group_id ?? a.groupId ?? groupId) === String(groupId)
        );
        console.log('📊 Guruh davomat ma\'lumotlari:', allAttendance.length, allAttendance);
      }

      const initial = {};
      studentList.forEach((s) => {
        initial[s.id] = false;
      });

      // ✅ Shu sana va guruh uchun davomat ma'lumotlarini filtrlash
      const relevantAttendance = allAttendance.filter((a) => {
        const matches = attendanceMatchesDay(a, groupId, date, lessonId);
        if (matches) {
          console.log('✅ Mos davomat topildi:', a);
        }
        return matches;
      });
      
      console.log(`📅 ${date} sanasi uchun davomat (${relevantAttendance.length}):`, relevantAttendance);

      // ✅ Backend dan kelgan davomat mavjudligini tekshirish
      const hasBackendAttendance = relevantAttendance.length > 0;
      setSavedAttendanceExists(hasBackendAttendance);

      relevantAttendance.forEach((a) => {
        const sid = a.student_id ?? a.studentId;
        if (sid != null) {
          const isPresent = Boolean(a.isPresent ?? a.is_present ?? a.is_Present);
          initial[sid] = isPresent;
          console.log(`  👤 Student ${sid}: ${isPresent ? '✓ keldi' : '✗ kelmadi'}`);
        }
      });

      setPresence(initial);

      // ✅ Agar davomat qilingan bo'lsa (attendance mavjud), darsni tugallangan deb belgilaymiz
      if (lessonData && hasBackendAttendance) {
        const completedLesson = { 
          ...lessonData, 
          date: lessonData.date || lessonData.lesson_date || lessonData.lessonDate || date,
          lesson_date: lessonData.lesson_date || lessonData.date || lessonData.lessonDate || date,
          isCompleted: true, 
          status: 'completed' 
        };
        setLesson(completedLesson);
        console.log('✅ Dars tugallangan deb belgilandi (backend davomat mavjud)');
      }
      
      // Tugallangan dars uchun faqat ma'lumot ko'rsatish
      if (hasBackendAttendance) {
        console.log('📖 Bu dars tugallangan - faqat ko\'rish rejimi (backend davomat mavjud)');
      }
      
    } catch (err) {
      console.error("❌ Sahifa yuklashda xato:", err);
      const errorMsg = err?.response?.data?.message || err?.message || "Ma'lumotlarni yuklashda xato!";
      toast.error(errorMsg);
      setLoadingError(errorMsg);
    } finally {
      // ✅ Har qanday holatda ham loading ni to'xtatish
      loadingRef.current = false;
      loadedRef.current = true;
      setLoading(false);
      console.log('✅ loadPage tugadi');
    }
  };

  useEffect(() => {
    // ✅ Faqat bir marta yuklash - groupId yoki date o'zgarganda
    console.log('🔵 useEffect triggered:', { groupId, date, loading: loadingRef.current });
    
    if (!loadingRef.current && groupId && date) {
      loadPage();
    }
  }, [groupId, date]); // ✅ Faqat groupId yoki date o'zgarganda

  const togglePresence = (studentId) => {
    if (isReadOnly || isFutureDate) return; // Tugallangan yoki kelajakdagi darsda o'zgartirib bo'lmaydi
    setPresence((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const handleSave = async () => {
    if (isReadOnly) {
      toast.error('Bu dars tugallangan - o\'zgartirib bo\'lmaydi!');
      return;
    }
    
    if (!topic.trim()) {
      toast.error("Mavzuni kiriting!");
      return;
    }

    setSaving(true);
    try {
      let lessonId = lesson?.id;

      // ✅ Attendance array — barcha talabalar uchun
      const attendances = students.map((s) => ({
        student_id: Number(s.id),
        isPresent: Boolean(presence[s.id]),
      }));

      // ✅ 1. Dars yaratish yoki mavjud darsni topish
      if (!lessonId) {
        // ✅ POST /api/v1/lessons - dars yaratish
        const payload = {
          group_id: Number(groupId),
          topic: topic.trim(),
          lesson_date: date, // ✅ YYYY-MM-DD format
        };
        
        if (description.trim()) {
          payload.description = description.trim();
        }

        console.log('📤 POST /api/v1/lessons - Dars yaratish payload:', JSON.stringify(payload, null, 2));

        try {
          const createRes = await lessonsAPI.create(payload);
          const created = createRes.data?.data || createRes.data;
          
          console.log('✅ POST /api/v1/lessons - Javob:', created);
          
          // ✅ Agar faqat success message qaytgan bo'lsa, darsni qayta yuklash
          if (created?.success && !created?.id) {
            console.log('⚠️ Backend faqat success qaytardi, darsni qidiramiz...');
            try {
              // Darsni sana bo'yicha topish
              const byDate = await groupsAPI.getLessonByDate(groupId, date);
              const foundLesson = parseLessonResponse(byDate);
              
              if (foundLesson?.id) {
                lessonId = foundLesson.id;
                setLesson({
                  ...foundLesson,
                  date: foundLesson.date || foundLesson.lesson_date || date,
                  lesson_date: foundLesson.lesson_date || foundLesson.date || date,
                });
                console.log('✅ Yaratilgan dars topildi:', foundLesson);
              }
            } catch (findErr) {
              console.error('❌ Yaratilgan darsni topishda xato:', findErr);
            }
          } else if (created?.id) {
            // Backend to'liq ma'lumot qaytargan
            lessonId = created.id;
            setLesson({
              ...created,
              date: created.date || created.lesson_date || date,
              lesson_date: created.lesson_date || created.date || date,
            });
            console.log('✅ Dars muvaffaqiyatli yaratildi:', {
              id: created.id,
              topic: created.topic,
              lesson_date: created.lesson_date || created.date,
            });
          }
        } catch (createErr) {
          console.error('❌ POST /api/v1/lessons - Xato:', {
            status: createErr.response?.status,
            statusText: createErr.response?.statusText,
            data: createErr.response?.data,
            message: createErr.message
          });
          
          // ✅ Agar dars allaqachon mavjud bo'lsa (400/409), uni topishga harakat qilish
          if (createErr.response?.status === 400 || createErr.response?.status === 409) {
            console.log('⚠️ Dars allaqachon mavjud, topishga harakat qilamiz...');
            try {
              const byDate = await groupsAPI.getLessonByDate(groupId, date);
              const existing = parseLessonResponse(byDate);
              if (existing?.id) {
                lessonId = existing.id;
                setLesson(existing);
                console.log('✅ Mavjud dars topildi:', existing);
              }
            } catch (findErr) {
              console.error('❌ Darsni topishda xato:', findErr);
            }
          }
          
          // Agar hali ham lesson_id topilmasa, xatoni tashlash
          if (!lessonId) {
            throw createErr;
          }
        }
      }

      // ✅ 2. Davomat qilish - har bir o'quvchi uchun alohida so'rov
      if (!lessonId) {
        // ⚠️ Lesson yaratilmagan, lekin davomat qilishga harakat qilamiz
        console.warn('⚠️ lesson_id topilmadi, lekin davomat qilishga harakat qilamiz');
      }

      console.log('📤 POST /api/v1/attendance - Davomat qilish boshlandi');
      console.log('   Lesson ID:', lessonId || 'yo\'q');
      console.log('   Group ID:', groupId);
      console.log('   Date:', date);
      console.log('   Talabalar soni:', students.length);
      
      const attendancePromises = students.map((s, index) => {
        const attData = {
          group_id: Number(groupId),
          student_id: Number(s.id),
          isPresent: Boolean(presence[s.id]),
          date: date, // YYYY-MM-DD
        };

        if (lessonId) {
          attData.lesson_id = Number(lessonId);
        }

        console.log(`   ${index + 1}. POST /api/v1/attendance:`, JSON.stringify(attData));

        return attendanceAPI.create(attData)
          .then(res => {
            console.log(`   ✅ Talaba ${s.id} (${getStudentName(s)}) - davomat saqlandi`);
            return { success: true, student: s, data: res.data };
          })
          .catch(async err => {
            const status = err.response?.status;
            const msg = err.response?.data?.message || err.message;
            console.error(`   ❌ Talaba ${s.id} xato (${status}):`, msg);

            // 400 — "lesson vaqti" yoki boshqa sabab — date bilan qayta urinish
            if (status === 400) {
              try {
                const retryData = { ...attData, lesson_date: date };
                const retryRes = await attendanceAPI.create(retryData);
                console.log(`   🔄 Retry muvaffaqiyatli: talaba ${s.id}`);
                return { success: true, student: s, data: retryRes.data };
              } catch (retryErr) {
                console.error(`   ❌ Retry ham xato: talaba ${s.id}`, retryErr.response?.data);
              }
            }
            return { success: false, student: s, error: err };
          });
      });

      const results = await Promise.all(attendancePromises);
      const failed = results.filter(r => !r.success);
      const succeeded = results.filter(r => r.success);
      
      console.log('📊 Davomat natijalari:', {
        jami: results.length,
        muvaffaqiyatli: succeeded.length,
        xato: failed.length
      });
      
      if (succeeded.length === 0) {
        // ❌ Hech bir davomat saqlanmadi — xato xabarini ko'rsatamiz lekin to'xtatmaymiz
        console.error('❌ Hech bir davomat saqlanmadi');
        console.error('❌ Xatolar:', failed.map(f => ({
          student: getStudentName(f.student),
          status: f.error?.response?.status,
          message: f.error?.response?.data?.message || f.error?.message,
          data: f.error?.response?.data
        })));

        const firstError = failed[0]?.error;
        const errorMsg = firstError?.response?.data?.message ||
                        firstError?.message ||
                        'Davomat qilishda xato!';
        const errorText = Array.isArray(errorMsg) ? errorMsg.join(', ') : String(errorMsg);
        toast.error(errorText, { duration: 5000 });
        return;
      } else if (failed.length > 0) {
        // ⚠️ Ba'zi davomatlar saqlanmadi — ogohlantirish, lekin davom etamiz
        console.warn('⚠️ Ba\'zi davomatlar saqlanmadi:', failed);
        toast.success(`${succeeded.length}/${results.length} ta davomat saqlandi`);
      } else {
        // ✅ Barcha davomatlar saqlandi
        console.log('✅ Barcha davomatlar muvaffaqiyatli saqlandi');
        toast.success("Davomat saqlandi!");
      }
      
      // ✅ 3. Muvaffaqiyatli saqlandi (hatto ba'zi davomatlar xato bo'lsa ham)
      if (succeeded.length > 0) {
        markDateCompleted(groupId, date);
        
        // ✅ Backend davomat mavjudligini belgilash
        setSavedAttendanceExists(true);
        
        // ✅ Darsni tugallangan holatga o'tkazish
        if (lesson) {
          setLesson({
            ...lesson,
            isCompleted: true,
            status: 'completed'
          });
        }
        
        console.log('✅ Jarayon tugadi - GroupDetails sahifasiga qaytamiz');
        
        // ✅ GroupDetails sahifasiga qaytish - schedule va darslar ro'yxatini yangilash uchun
        // Sahifani qayta yuklamasdan to'g'ridan-to'g'ri navigate qilamiz
        setTimeout(() => {
          console.log('🔄 GroupDetails sahifasiga qaytish...');
          navigate(`${basePath}/${groupId}?tab=0`, { replace: true });
        }, 1000);
      }
    } catch (err) {
      console.error('❌ handleSave - Umumiy xato:', {
        message: err.message,
        response: err.response?.data,
        stack: err.stack
      });
      const msg = await parseApiError(err);
      toast.error(msg, { duration: 6000 });
    } finally {
      setSaving(false);
      console.log('🔚 handleSave tugadi');
    }
  };

  // ✅ O'quvchini tanlash va modal ochish
  const handleStudentClick = (student) => {
    if (isFutureDate) {
      toast.error('Bu sana kelmagan — davomat kiritib bo\'lmaydi');
      return;
    }
    console.log('👤 O\'quvchi tanlandi:', student);
    console.log('📚 Mavjud homework list:', homeworkList);
    console.log('📖 Hozirgi dars:', lesson);
    
    // Lesson ID ga mos homework topish
    let hw = homeworkList.find(h => 
      String(h.lesson_id || h.lessonId || h.lesson?.id) === String(lesson?.id)
    );
    
    // ✅ Agar lesson_id bo'yicha topilmasa, date bo'yicha qidirish
    if (!hw && date) {
      console.log('🔍 Lesson ID bo\'yicha topilmadi, date bo\'yicha qidiramiz:', date);
      hw = homeworkList.find(h => {
        const hwDate = String(h.date || h.lesson_date || h.lesson?.date || '').slice(0, 10);
        return hwDate === date;
      });
    }
    
    // ✅ Agar hali ham topilmasa, birinchi homework ni olish
    if (!hw && homeworkList.length > 0) {
      console.log('⚠️ Aniq homework topilmadi, birinchisini olamiz');
      hw = homeworkList[0];
    }
    
    console.log('🎯 Topilgan homework:', hw);
    
    if (!hw) {
      toast.error('Bu dars uchun uy vazifa topilmadi!');
      console.warn('⚠️ Homework topilmadi. Lesson ID:', lesson?.id, 'Date:', date);
      console.log('📋 Mavjud homework IDs:', homeworkList.map(h => ({
        id: h.id,
        lesson_id: h.lesson_id || h.lessonId,
        date: h.date || h.lesson_date
      })));
      return;
    }
    
    console.log('✅ Modal ochilmoqda:', {
      groupId,
      homeworkId: hw.id,
      studentId: student.id,
      studentName: getStudentName(student),
    });

    if (!hw || !hw.id) {
      console.warn('Cannot navigate to homework results: hw.id missing', hw);
      toast.error('Homework id mavjud emas');
    } else {
      // Navigate to GroupDetails homework path so URL shows homework id
      try {
        navigate(`${basePath}/${groupId}/homework/${hw.id}/results?tab=1&student=${student.id}`, { replace: false });
      } catch (e) {
        // fallback to query params
        try {
          const next = new URLSearchParams(searchParams.toString());
          next.set('homework', String(hw.id));
          next.set('student', String(student.id));
          setSearchParams(next, { replace: false });
        } catch (err) {
          // ignore
        }
      }
    }

    setSelectedStudent(student);
    setCurrentHomework(hw);
    setShowStudentModal(true);
  };

  // Agar URLda homework param bo'lsa, modalni avtomatik ochish
  useEffect(() => {
    const hwId = searchParams.get('homework');
    const studentId = searchParams.get('student');

    if (!hwId) {
      // agar param yo'q bo'lsa, modalni yopamiz
      if (showStudentModal) {
        setShowStudentModal(false);
        setSelectedStudent(null);
        setCurrentHomework(null);
      }
      return;
    }

    // Agar homeworklar yuklangan bo'lsa, topib ochamiz
    if (homeworkList && homeworkList.length > 0) {
      const hw = homeworkList.find(h => String(h.id) === String(hwId));
      if (hw) {
        setCurrentHomework(hw);
        if (studentId) {
          const st = students.find(s => String(s.id) === String(studentId));
          if (st) setSelectedStudent(st);
        }
        setShowStudentModal(true);
      }
    }
  }, [searchParams, homeworkList, students]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '400px',
        padding: "80px", 
        color: "#6b7280" 
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #f3f4f6',
          borderTop: '4px solid #10b981',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }} />
        <p style={{ margin: 0, fontSize: '14px' }}>Yuklanmoqda...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // ✅ Faqat guruh topilmagan bo'lsagina xato ko'rsatamiz
  // (talabalar bo'sh bo'lsa ham sahifa ochiladi)
  if (!group) {
    return (
      <div style={{ 
        textAlign: "center", 
        padding: "80px", 
        color: "#6b7280" 
      }}>
        <p>Guruh ma'lumotlari topilmadi</p>
        <button
          type="button"
          onClick={() => navigate(`${basePath}/${groupId}`)}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Guruhga qaytish
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '24px' }}>
      {/* Homework Check Modal */}
      {showStudentModal && selectedStudent && currentHomework && (
        <HomeworkCheckPanel
          groupId={groupId}
          homework={currentHomework}
          student={selectedStudent}
          onClose={() => { setShowStudentModal(false); setSelectedStudent(null); setCurrentHomework(null); }}
          onUpdate={() => { setShowStudentModal(false); setSelectedStudent(null); setCurrentHomework(null); }}
        />
      )}

      {/* ===== HEADER ===== */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => navigate(`${basePath}/${groupId}?tab=2`)}
          style={{
            width: 32, height: 32, borderRadius: '8px',
            background: '#fff', border: '1px solid #e5e7eb',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <FiChevronLeft size={18} color="#374151" />
        </button>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#111827' }}>
          Dars tafsilotlari
        </h1>
        {isReadOnly && (
          <span style={{
            marginLeft: 'auto', padding: '4px 12px',
            background: '#dcfce7', color: '#16a34a',
            borderRadius: '20px', fontSize: '12px', fontWeight: 600,
          }}>
            ✓ Tugallangan
          </span>
        )}
      </div>

      {/* ===== KALENDAR ===== */}
      <div style={{
        background: '#fff', borderRadius: '12px',
        border: '1px solid #e5e7eb', padding: '16px 20px',
        marginBottom: '20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '2px 6px' }}>‹</button>
          <span style={{ fontWeight: 600, fontSize: '14px', color: '#374151' }}>
            {group?.schedule_month || '1-o\'quv oyi'}
          </span>
          <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '2px 6px' }}>›</button>
        </div>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {/* Aktiv sana */}
          {date && (() => {
            const d = new Date(date);
            const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            return (
              <div style={{
                minWidth: '52px', padding: '8px 6px', borderRadius: '10px',
                background: '#10b981', color: '#fff', textAlign: 'center',
                boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
              }}>
                <div style={{ fontSize: '11px', fontWeight: 500 }}>{months[d.getMonth()]}</div>
                <div style={{ fontSize: '20px', fontWeight: 700, lineHeight: 1.1 }}>{d.getDate()}</div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ===== ROL TABLARI ===== */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '20px', borderBottom: '1px solid #e5e7eb' }}>
        {[{ id: 'assistant', label: 'Assistant' }, { id: 'teacher', label: 'Teacher' }].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setRoleTab(tab.id)}
            style={{
              padding: '10px 0', border: 'none', background: 'none',
              cursor: 'pointer', fontWeight: 600, fontSize: '14px',
              color: roleTab === tab.id ? '#10b981' : '#6b7280',
              borderBottom: `2px solid ${roleTab === tab.id ? '#10b981' : 'transparent'}`,
              marginBottom: '-1px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== MA'LUMOT KARTASI ===== */}
      <div style={{
        background: '#fff', borderRadius: '12px',
        border: '1px solid #e5e7eb', padding: '20px',
        marginBottom: '16px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: '#111827' }}>Ma&apos;lumot</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Teacher avatar */}
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: '#e5e7eb', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '16px', fontWeight: 700,
            color: '#6b7280', flexShrink: 0, overflow: 'hidden',
          }}>
            {displayTeacher
              ? (displayTeacher.photo
                  ? <img src={displayTeacher.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : getTeacherName(displayTeacher).charAt(0).toUpperCase())
              : '—'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>
              {displayTeacher ? getTeacherName(displayTeacher) : '—'}
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: 2 }}>
              {roleTab === 'teacher' ? 'Teacher' : 'Assistant'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#9ca3af' }}>Dars kuni</div>
            <div style={{ fontWeight: 600, fontSize: '13px', color: '#374151' }}>
              {date ? new Date(date).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
            </div>
          </div>
          <div style={{ textAlign: 'right', marginLeft: '16px' }}>
            <div style={{ fontSize: '11px', color: '#9ca3af' }}>Holat</div>
            <div style={{ fontWeight: 600, fontSize: '13px', color: isReadOnly ? '#10b981' : '#374151' }}>
              {isReadOnly ? 'Dars tugagan' : "Dars o'tilmagan"}
            </div>
          </div>
        </div>
      </div>

      {/* ===== YO'QLAMA VA MAVZU ===== */}
      <div style={{
        background: '#fff', borderRadius: '12px',
        border: '1px solid #e5e7eb', padding: '20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: '#111827' }}>
          Yo&apos;qlama va mavzu kiritish
        </h3>

        {/* Radio tugmalar */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
          {[{ val: 'plan', label: "O'quv reja bo'yicha" }, { val: 'other', label: 'Boshqa' }].map(opt => (
            <label key={opt.val} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              cursor: isReadOnly ? 'not-allowed' : 'pointer',
              fontSize: '14px', color: topicSource === opt.val ? '#10b981' : '#6b7280',
              fontWeight: topicSource === opt.val ? 600 : 400,
            }}>
              <input
                type="radio" name="topicSource"
                checked={topicSource === opt.val}
                onChange={() => setTopicSource(opt.val)}
                disabled={isReadOnly}
                style={{ accentColor: '#10b981' }}
              />
              {opt.label}
            </label>
          ))}
        </div>

        {/* Mavzu */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
            <span style={{ color: '#ef4444' }}>* </span>Mavzu
          </label>
                  <input
                type="text"
                placeholder="Mavzuni kiriting..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={topicSource === 'plan' || isReadOnly || isFutureDate}
            style={{
              width: '100%', padding: '10px 14px',
              border: '1px solid #e5e7eb', borderRadius: '8px',
              fontSize: '14px', outline: 'none', boxSizing: 'border-box',
              background: isReadOnly ? '#f9fafb' : '#fff',
              color: '#111827',
            }}
          />
        </div>

        {/* Tavsif */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
            Tavsif (ixtiyoriy)
          </label>
            <textarea
            rows={3}
            placeholder="Dars haqida qo'shimcha ma'lumot..."
            value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isReadOnly || isFutureDate}
            style={{
              width: '100%', padding: '10px 14px',
              border: '1px solid #e5e7eb', borderRadius: '8px',
              fontSize: '14px', outline: 'none', boxSizing: 'border-box',
              resize: 'vertical', background: isReadOnly ? '#f9fafb' : '#fff',
              color: '#111827', fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Talabalar jadvali */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '12px', color: '#9ca3af', fontWeight: 600, width: 40 }}>#</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '12px', color: '#9ca3af', fontWeight: 600 }}>O&apos;quvchi ismi</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '12px', color: '#9ca3af', fontWeight: 600, width: 80 }}>Keldi</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', fontSize: '14px' }}>
                  O&apos;quvchilar topilmadi
                </td>
              </tr>
            ) : (
              students.map((student, idx) => {
                const name = getStudentName(student);
                const initial = name.charAt(0).toUpperCase();
                const photo = student.photo || student.image || student.avatar;
                const photoUrl = photo
                  ? (photo.startsWith('http') ? photo : `https://najot-edu.softwareengineer.uz/files/${photo.split('/').pop()}`)
                  : null;
                return (
                  <tr key={`student-${student.id}-${idx}`}
                    style={{ borderBottom: '1px solid #f9fafb' }}>
                    <td style={{ padding: '12px 12px', fontSize: '14px', color: '#6b7280' }}>{idx + 1}</td>
                    <td style={{ padding: '12px 12px', cursor: 'pointer' }} onClick={() => handleStudentClick(student)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: '#e5e7eb', overflow: 'hidden',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '13px', fontWeight: 700, color: '#6b7280', flexShrink: 0,
                        }}>
                          {photoUrl
                            ? <img src={photoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => { e.target.style.display = 'none'; }} />
                            : initial}
                        </div>
                        <span style={{ fontSize: '14px', color: '#111827', fontWeight: 500 }}>{name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 12px', textAlign: 'right' }}>
                      <button
                        type="button"
                        className={`status-switch ${presence[student.id] ? 'active' : 'inactive'}`}
                        onClick={(e) => { e.stopPropagation(); togglePresence(student.id); }}
                        disabled={isReadOnly || isFutureDate}
                        aria-label="Keldi"
                        style={{ opacity: (isReadOnly || isFutureDate) ? 0.5 : 1, cursor: (isReadOnly || isFutureDate) ? 'not-allowed' : 'pointer' }}
                      >
                        <span className="switch-knob" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Saqlash tugmasi */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          {isReadOnly ? (
            <div style={{
              padding: '10px 24px', background: '#f3f4f6',
              color: '#9ca3af', borderRadius: '8px',
              fontSize: '14px', fontWeight: 600,
            }}>
              ✓ Bu dars tugallangan
            </div>
          ) : (
            <button
              type="button"
              disabled={saving || students.length === 0 || isFutureDate}
              onClick={handleSave}
              style={{
                padding: '10px 32px', borderRadius: '8px', border: 'none',
                background: saving || students.length === 0 || isFutureDate ? '#d1d5db' : '#6b7280',
                color: '#fff', fontSize: '14px', fontWeight: 600,
                cursor: saving || students.length === 0 || isFutureDate ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { if (!saving && students.length > 0 && !isFutureDate) e.currentTarget.style.background = '#374151'; }}
              onMouseLeave={(e) => { if (!saving && students.length > 0 && !isFutureDate) e.currentTarget.style.background = '#6b7280'; }}
            >
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupLesson;
