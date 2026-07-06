import axios from "axios";
import { localExamAPI } from "./examStore";

// =============================================
// 🔧 BASE URL
// Dev: Vite proxy (/api/v1) — brauzer CORS xatosiz ulanadi
// Prod: to'g'ridan-to'g'ri backend yoki VITE_API_URL
// =============================================
export const BACKEND_API_URL =
  "https://najot-edu.softwareengineer.uz/api/v1";

const DEV_PROXY_BASE = "/api/v1";

function resolveApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL?.trim();
  // Dev: har doim Vite proxy — to'g'ridan-to'g'ri URL CORS bloklaydi
  if (import.meta.env.DEV) {
    // Allow forcing direct backend calls in dev for quick debugging.
    // Set VITE_FORCE_DIRECT_API=true in your .env to bypass the Vite proxy.
    if (String(import.meta.env.VITE_FORCE_DIRECT_API).toLowerCase() === 'true') {
      return envUrl || BACKEND_API_URL;
    }
    return envUrl?.startsWith("/") ? envUrl : DEV_PROXY_BASE;
  }
  return envUrl || BACKEND_API_URL;
}

export const API_BASE_URL = resolveApiBaseUrl();

const BASE_URL = API_BASE_URL;

// =============================================
// 🔧 AXIOS INSTANCE
// =============================================
export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Request interceptor — har bir so'rovga token qo'shadi
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response interceptor — 401 yoki 403 bo'lsa loginga qaytaradi
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Faqat hozirgi sahifa login bo'lmasagina qaytarish
      if (!window.location.pathname.includes('/login')) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// multipart/form-data uchun alohida instance
const apiForm = axios.create({
  baseURL: BASE_URL,
});
const clearMultipartContentType = (headers) => {
  if (!headers) return;
  if (typeof headers.delete === "function") {
    headers.delete("Content-Type");
    headers.delete("content-type");
    return;
  }
  delete headers["Content-Type"];
  delete headers["content-type"];
};

const handleUnauthorized = () => {
  localStorage.removeItem("token");
  window.location.href = "/login";
};

apiForm.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData) {
    clearMultipartContentType(config.headers);
  }
  return config;
});
apiForm.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      handleUnauthorized();
    }
    return Promise.reject(error);
  }
);

// =============================================
// 🔐 AUTH — /api/v1/auth/login
// =============================================
// Swagger: phone example = "975661099" (998 siz)
export const authAPI = {
  login: (phone, password) =>
    api.post("/auth/login", { phone, password }),
  sendOtp: (phone) =>
    api.post("/auth/send-otp", { phone }),
  verifyOtp: (phone, otp) => {
    console.log('verifyOtp chaqirildi:', { phone, otp });
    // OTP ni string sifatida yuborish (backend "number string" kutadi - raqamlardan iborat string)
    const otpString = typeof otp === 'number' ? String(otp) : otp;
    return api.post("/auth/verify-otp", { phone, otp: otpString });
  },
  changePassword: (phone, newPassword) => {
    // To'g'ridan-to'g'ri backend URL ga so'rov yuborish (proxy test uchun)
    const directApi = axios.create({
      baseURL: BACKEND_API_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });
    return directApi.post("/auth/change-password", { phone, new_password: newPassword });
  },
};

// =============================================
// 👤 USERS — /api/v1/users
// =============================================
export const usersAPI = {
  getAllAdmins: () => api.get("/users/admin/all"),          // SUPERADMIN
  createAdmin: (data) => api.post("/users/admin", data),   // SUPERADMIN, ADMIN
};

// =============================================
// 👨‍🎓 STUDENTS — /api/v1/students
// =============================================
export const studentsAPI = {
  getAll: (page, limit) =>
    api.get("/students", { params: { page, limit } }),           // SUPERADMIN, ADMIN
  getArchive: () => api.get("/students/archive"),               // SUPERADMIN, ADMIN
  getOne: (id) => api.get(`/students/one/${id}`),              // SUPERADMIN, ADMIN
  getMyGroups: () => api.get("/students/my/groups"),           // STUDENT
  create: (formData) => apiForm.post("/students", formData),   // multipart/form-data
  update: (id, formData) =>
    apiForm.patch(`/students/${id}`, formData),                 // multipart/form-data
  delete: (id) => api.delete(`/students/${id}`),
  submitHomework: (homeworkId, formData) =>
    apiForm.post(`/students/homeworkAnswer/${homeworkId}`, formData),
};

// =============================================
// 👥 TEACHERS — /api/v1/teachers
// =============================================
export const teachersAPI = {
  getAll: () => api.get("/teachers"),                           // SUPERADMIN, ADMIN
  getArchive: () => api.get("/teachers/archive"),              // SUPERADMIN, ADMIN
  getOne: (id) => api.get(`/teachers/one/${id}`),             // SUPERADMIN, ADMIN
  getMyProfile: () => api.get("/teachers/my/profile"),         // TEACHER profile
  getMyGroups: () => api.get("/teachers/my/groups"),           // TEACHER — o'z guruhlari (students bilan)
  create: (formData) => apiForm.post("/teachers", formData),  // multipart/form-data
  update: (id, formData) =>
    apiForm.patch(`/teachers/${id}`, formData),                // multipart/form-data
  delete: (id) => api.delete(`/teachers/${id}`),
};

// =============================================
// 📖 COURSES — /api/v1/courses
// =============================================
export const coursesAPI = {
  getAll: () => api.get("/courses"),                            // SUPERADMIN, ADMIN
  getArchive: () => api.get("/courses/archive"),               // SUPERADMIN, ADMIN
  getOne: (id) => api.get(`/courses/one/${id}`),              // SUPERADMIN, ADMIN
  create: (data) => api.post("/courses", data),               // JSON
  update: (id, data) => api.patch(`/courses/${id}`, data),    // JSON
  delete: (id) => api.delete(`/courses/${id}`),
};

// =============================================
// 📚 GROUPS — /api/v1/groups
// =============================================
export const groupsAPI = {
  getAll: (groupName, max_student) =>
    api.get("/groups/all", { params: { groupName, max_student } }), // SUPERADMIN, ADMIN
  getArchive: () => api.get("/groups/archive"),               // SUPERADMIN, ADMIN
  getOne: (id) => api.get(`/groups/one/${id}`),              // SUPERADMIN, ADMIN
  getById: (groupId) => api.get(`/groups/${groupId}`),       // SUPERADMIN, ADMIN, TEACHER
  getStudents: (groupId) =>
    api.get(`/groups/one/students/${groupId}`),               // SUPERADMIN, ADMIN
  getSchedules: (groupId) =>
    api.get(`/groups/${groupId}/schedules`),
  getLessonByDate: (groupId, date) =>
    api.get(`/groups/${groupId}/lesson`, { params: { date } }),
  createLesson: (groupId, data) => {
    const gid = Number(groupId);
    const payload = {
      group_id: gid,
      topic: String(data?.topic ?? "").trim(),
    };
    const desc = data?.description != null ? String(data.description).trim() : "";
    if (desc) payload.description = desc;
    const lessonDate = data?.date ?? data?.lesson_date;
    if (lessonDate) {
      // Faqat YYYY-MM-DD formatida yuborish
      const d = String(lessonDate).slice(0, 10);
      payload.lesson_date = d;
    }
    // attendances array bo'lsa qo'shish
    if (Array.isArray(data?.attendances)) {
      payload.attendances = data.attendances;
    }
    return api.post(`/groups/${gid}/lesson`, payload);
  },
  create: (data) => api.post("/groups", data),               // JSON
  update: (id, data) => api.patch(`/groups/${id}`, data),    // JSON
  delete: (id) => api.delete(`/groups/${id}`),
};

// =============================================
// 🔗 STUDENT-GROUP — /api/v1/student-group
// =============================================
export const studentGroupAPI = {
  getAll: () => api.get("/student-group/all"),
  create: (data) => api.post("/student-group", data), // { student_id, group_id }
};

// =============================================
// 🏫 ROOMS — /api/v1/rooms
// =============================================
export const roomsAPI = {
  getAll: () => api.get("/rooms"),                             // SUPERADMIN, ADMIN
  getArchive: () => api.get("/rooms/arxive"),                 // SUPERADMIN, ADMIN
  getOne: (id) => api.get(`/rooms/one/${id}`),               // SUPERADMIN, ADMIN
  create: (data) => api.post("/rooms", data),                // { name, capacity }
  update: (id, data) => api.patch(`/rooms/${id}`, data),     // { name?, capacity? }
  delete: (id) => api.delete(`/rooms/${id}`),
};

// =============================================
// 📝 LESSONS — /api/v1/lessons
// Darslar yaratish, ko'rish va boshqarish
// =============================================
export const lessonsAPI = {
  /**
   * GET /lessons — Barcha darslar
   * ADMIN
   */
  getAll: () => api.get("/lessons"),
  
  /**
   * GET /groups/{groupId}/lessons — Guruh darslari
   * ALL ROLES
   */
  getGroupLessons: (groupId) =>
    api.get(`/groups/${Number(groupId)}/lessons`),
  
  /**
   * GET /groups/{groupId}/lessons/all — Guruhning barcha darslari
   * ALL ROLES
   */
  getGroupLessonsAll: (groupId) =>
    api.get(`/groups/${Number(groupId)}/lessons/all`),
  
  /**
   * GET /lessons/my/group/{groupId} — Guruh darslari
   * ALL ROLES
   */
  getMyGroupLessons: (groupId) =>
    api.get(`/lessons/my/group/${Number(groupId)}`),
  
  /**
   * GET /groups/{groupId}/lessons/{lessonId}/homeworks — Dars uyga vazifalari
   * STUDENT
   */
  getLessonHomeworks: (groupId, lessonId) =>
    api.get(`/groups/${Number(groupId)}/lessons/${Number(lessonId)}/homeworks`),
  
  /**
   * GET /groups/{groupId}/lessons/{lessonId}/videos — Dars videolari
   * STUDENT
   */
  getLessonVideos: (groupId, lessonId) =>
    api.get(`/groups/${Number(groupId)}/lessons/${Number(lessonId)}/videos`),
  
  /**
   * GET /lessons/{id} — Bitta darsni olish
   */
  getOne: (id) => api.get(`/lessons/${Number(id)}`),
  
  /**
   * POST /lessons — Yangi dars yaratish
   * Body: { 
   *   group_id: number, 
   *   topic: string, 
   *   description?: string,
   *   lesson_date?: string (YYYY-MM-DD)
   * }
   */
  create: (data) => {
    const payload = {
      group_id: Number(data.group_id),
      topic: String(data.topic || '').trim(),
    };
    
    if (data.description) {
      payload.description = String(data.description).trim();
    }
    
    // ✅ Sana formatini tekshirish va qo'shish
    const lessonDate = data.lesson_date || data.date;
    if (lessonDate) {
      // YYYY-MM-DD formatiga aylantirish
      const dateStr = String(lessonDate).slice(0, 10);
      payload.lesson_date = dateStr;
    }
    
    return api.post("/lessons", payload);
  },
  
  /**
   * PATCH /lessons/{id} — Darsni yangilash
   */
  update: (id, data) => {
    const payload = {};
    
    if (data.topic) {
      payload.topic = String(data.topic).trim();
    }
    
    if (data.description !== undefined) {
      payload.description = String(data.description || '').trim();
    }
    
    if (data.lesson_date || data.date) {
      const dateStr = String(data.lesson_date || data.date).slice(0, 10);
      payload.lesson_date = dateStr;
    }
    
    return api.patch(`/lessons/${Number(id)}`, payload);
  },
  
  /**
   * DELETE /lessons/{id} — Darsni o'chirish
   */
  delete: (id) => api.delete(`/lessons/${Number(id)}`),
};

// =============================================
// ✅ ATTENDANCE — /api/v1/attendance
// Davomat (kim darsga keldi ✅, kim kelmadi ❌)
// =============================================
export const attendanceAPI = {
  /**
   * GET /attendance/all — Barcha davomat ma'lumotlari
   * SUPERADMIN, ADMIN, TEACHER
   */
  getAll: () => api.get("/attendance/all"),
  
  /**
   * GET /attendance/{groupId} — Guruh bo'yicha davomat
   */
  getByGroup: (groupId) => api.get(`/attendance/${Number(groupId)}`),
  
  /**
   * GET /attendance/lesson/{lessonId} — Dars bo'yicha davomat
   */
  getByLesson: (lessonId) => api.get(`/attendance/lesson/${Number(lessonId)}`),
  
  /**
   * POST /attendance — Yangi davomat qo'shish yoki yangilash
   * Body: { group_id, student_id, isPresent, lesson_id?, date? }
   */
  create: (data) => api.post("/attendance", data),
  
  /**
   * PATCH /attendance/{id} — Davomatni yangilash
   */
  update: (id, data) => api.patch(`/attendance/${Number(id)}`, data),
  
  /**
   * DELETE /attendance/{id} — Davomatni o'chirish
   */
  delete: (id) => api.delete(`/attendance/${Number(id)}`),
};

// =============================================
// 📋 HOMEWORK — /api/v1/homework
// GET  /homework/all       — BARCHA guruhlarning uy vazifalari (SUPERADMIN, ADMIN)
// GET  /homework/{groupId} — FAQAT shu guruhning uy vazifalari (mas: /homework/68 → 68-guruh)
// POST /homework — yangi uy vazifa (multipart: lesson_id, group_id, title, file)
// GET  /homework/own/{lessonId} — talaba: dars bo'yicha uy vazifa
// GET  /group/{groupId}/homework/{homeworkId}/results?status=
// GET  /group/{groupId}/homework/{homeworkId}/result/{studentId}
// =============================================
export const HOMEWORK_RESULT_STATUSES = [
  "ACCEPTED",
  "REJECTED",
  "PENDING",
  "CHECKED",
];

export const unwrapHomeworkList = (res) => {
  const body = res?.data?.data ?? res?.data ?? res;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.homeworks)) return body.homeworks;
  if (Array.isArray(body?.items)) return body.items;
  if (body && typeof body === "object" && body.id) return [body];
  return [];
};

/** GET /homework/{groupId} — to'g'ridan-to'g'ri yoki darslar ichidagi vazifalar */
export const flattenHomeworksFromLessons = (lessons) => {
  if (!Array.isArray(lessons)) return [];
  return lessons.flatMap((lesson) => {
    if (Array.isArray(lesson.homeworks) && lesson.homeworks.length > 0) {
      return lesson.homeworks.map((hw) => ({
        ...hw,
        lesson: hw.lesson ?? lesson,
      }));
    }
    if (lesson.homework) {
      return [{ ...lesson.homework, lesson }];
    }
    return [];
  });
};

export const unwrapHomeworkByGroup = (res) => {
  const body = res?.data?.data ?? res?.data ?? res;

  if (Array.isArray(body?.homeworks) && body.homeworks.length > 0) {
    return body.homeworks;
  }

  const fromLessons = flattenHomeworksFromLessons(body?.lessons);
  if (fromLessons.length > 0) return fromLessons;

  const direct = unwrapHomeworkList(res);
  const nested = flattenHomeworksFromLessons(direct);
  if (nested.length > 0) return nested;

  return direct.filter(
    (item) => item && item.id && (item.title || item.topic || item.description)
  );
};

/** POST/PATCH /homework — lesson_id, group_id, title, file */
export const buildHomeworkFormData = ({
  lesson_id,
  group_id,
  title,
  file,
}) => {
  const formData = new FormData();
  formData.append("lesson_id", String(lesson_id));
  formData.append("group_id", String(group_id));
  formData.append("title", String(title).trim());
  if (file) {
    formData.append("file", file, file.name || "homework");
  }
  return formData;
};

export const unwrapHomeworkResults = (res) => {
  const body = res?.data?.data ?? res?.data ?? res;

  // Common array shapes
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.results)) return body.results;
  if (Array.isArray(body?.data?.results)) return body.data.results;
  if (Array.isArray(body?.items)) return body.items;
  if (Array.isArray(body?.students)) return body.students;
  if (Array.isArray(body?.data?.students)) return body.data.students;

  // Single-result objects -> wrap into array when it looks like a submission/result
  if (body && typeof body === "object") {
    if (body.id || body.student_id || body.student?.id || body.homework_answer_id) {
      return [body];
    }
    // Some backends return { data: { result: {...} } }
    if (body.data && typeof body.data === 'object') {
      const nested = body.data.result || body.data.results || body.data.items || body.data.students;
      if (Array.isArray(nested)) return nested;
      if (nested && typeof nested === 'object' && (nested.id || nested.student_id)) return [nested];
    }
  }

  return [];
};

/** Backend turli status nomlari qaytarishi mumkin — bitta formatga keltirish */
export const normalizeHomeworkResultStatus = (row) => {
  const raw = String(row?.status || row?.state || "").toUpperCase().trim();
  if (!raw) {
    const score = row?.score ?? row?.grade;
    if (score != null && Number(score) >= 60) return "ACCEPTED";
    if (score != null && Number(score) < 60) return "REJECTED";
    return "PENDING";
  }
  if (["ACCEPTED", "APPROVED", "PASSED", "COMPLETED", "CHECKED", "GRADED"].includes(raw)) {
    return "ACCEPTED";
  }
  if (["REJECTED", "RETURNED", "FAILED", "DECLINED", "QAYTARILGAN"].includes(raw)) {
    return "REJECTED";
  }
  if (["PENDING", "WAITING", "SUBMITTED", "NEW", "KUTAYOTGAN"].includes(raw)) {
    return "PENDING";
  }
  return raw;
};

/** Uy vazifadan guruh ID sini olish */
export const getHomeworkGroupId = (hw) =>
  hw?.group_id ??
  hw?.groupId ??
  hw?.group?.id ??
  hw?.lesson?.group_id ??
  hw?.lesson?.groupId ??
  hw?.lesson?.group?.id ??
  null;

/** Uy vazifa obyektidan aniq `homeworkId` ni olinadigan yagona helper */
export const getHomeworkId = (hw) =>
  hw?.id ??
  hw?.homework_id ??
  hw?.homeworkId ??
  hw?.hw_id ??
  hw?.hwId ??
  hw?.homework?.id ??
  (hw && hw.id === undefined && hw?.data?.id ? hw.data.id : null) ??
  null;

/** Topshiriq/answer obyektidan `homework_answer_id` yoki uning alternativ maydonlarini olish */
export const getHomeworkAnswerId = (row) =>
  row?.id ??
  row?.homework_answer_id ??
  row?.answerId ??
  row?.answer_id ??
  row?.homeworkAnswerId ??
  row?.submission_id ??
  null;

/** GET /homework/all — barcha guruhlarning vazifalarini qaytaradi */
export const fetchAllHomeworks = async () => {
  const res = await api.get("/homework/all");
  const body = res?.data?.data ?? res?.data ?? res;

  const fromBodyLessons = flattenHomeworksFromLessons(body?.lessons);
  if (fromBodyLessons.length > 0) return fromBodyLessons;

  const direct = unwrapHomeworkList(res);
  const fromDirectLessons = flattenHomeworksFromLessons(direct);
  if (fromDirectLessons.length > 0) return fromDirectLessons;

  return direct;
};

/** Barcha vazifalar ichidan bitta guruhga tegishlilarini filtrlash */
export const filterHomeworkByGroup = (list, groupId) => {
  if (!groupId) return list;
  return list.filter(
    (hw) => String(getHomeworkGroupId(hw)) === String(groupId)
  );
};

/**
 * Guruh vazifalarini olish:
 * 1) GET /homework/all — barcha guruhlar, keyin groupId bo'yicha filtrlash
 * 2) fallback: GET /homework/{groupId}
 */
export const fetchHomeworkByGroup = async (groupId) => {
  // Try direct group-specific endpoint first
  try {
    const res = await api.get(`/homework/${Number(groupId)}`);
    const parsed = unwrapHomeworkByGroup(res);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch (err) {
    // ignore and fallback to fetching all
    console.warn('fetchHomeworkByGroup: direct endpoint failed, falling back to all', err?.response?.status || err.message);
  }

  // Fallback: fetch all homeworks and filter by group
  try {
    const all = await fetchAllHomeworks();
    return filterHomeworkByGroup(all, groupId);
  } catch (err) {
    console.error('fetchHomeworkByGroup fallback failed:', err?.response?.data || err.message);
    return [];
  }
};

export const homeworkAPI = {
  /** BARCHA guruhlarning uy vazifalari — GET /homework/all */
  getAll: () => api.get("/homework/all"),
  /** FAQAT bitta guruh — GET /homework/{groupId} (masalan /homework/68) */
  getByGroup: (groupId) => api.get(`/homework/${Number(groupId)}`),
  /** Talaba — dars uchun berilgan uy vazifa */
  getOwn: (lessonId) => api.get(`/homework/own/${Number(lessonId)}`),
  /** Guruh + vazifa bo'yicha topshirilganlar ro'yxati
   * Enforce canonical endpoint: caller MUST provide a valid `groupId`.
   * This avoids ambiguous admin/global fallbacks and prevents /group/NaN/... URL errors.
   */
  // extraParams: optional object appended to query params (e.g., { limit: 500 })
  getResults: (groupId, homeworkId, status, extraParams = {}) => {
    // Enforce canonical endpoint: group/{groupId}/homework/{homeworkId}/results
    if (!groupId) {
      return Promise.reject(
        Object.assign(new Error('homeworkAPI.getResults: groupId is required. Use /group/{groupId}/homework/{homeworkId}/results'), {
          code: 'MISSING_GROUP_ID',
        })
      );
    }
    if (!homeworkId) {
      return Promise.reject(
        Object.assign(new Error('homeworkAPI.getResults: homeworkId is required. Use /group/{groupId}/homework/{homeworkId}/results'), {
          code: 'MISSING_HOMEWORK_ID',
        })
      );
    }
    const params = { ...(status ? { status } : {}) };
    if (extraParams && typeof extraParams === 'object') {
      Object.assign(params, extraParams);
    }
    return api.get(`/group/${Number(groupId)}/homework/${Number(homeworkId)}/results`, {
      params,
    });
  },
  /** Fetch results for a given homework across all groups (admin use).
   * This fetches the list of groups and requests the canonical results
   * endpoint for each group, then combines the rows.
   */
  getResultsAcrossGroups: async (homeworkId, extraParams = {}) => {
    if (!homeworkId) {
      return Promise.reject(Object.assign(new Error('homeworkAPI.getResultsAcrossGroups: homeworkId is required'), { code: 'MISSING_HOMEWORK_ID' }));
    }
    try {
      const gRes = await groupsAPI.getAll();
      const groupsBody = gRes?.data?.data ?? gRes?.data ?? gRes;
      const groups = Array.isArray(groupsBody) ? groupsBody : (groupsBody?.groups || []);
      const groupIds = groups.map((g) => Number(g?.id)).filter(Boolean);

      const promises = groupIds.map((gid) =>
        api
          .get(`/group/${Number(gid)}/homework/${Number(homeworkId)}/results`, { params: extraParams })
          .catch((err) => err)
      );

      const settled = await Promise.allSettled(promises);
      const combined = [];
      for (const s of settled) {
        if (s.status === 'fulfilled') {
          const rows = unwrapHomeworkResults(s.value);
          if (rows && rows.length) combined.push(...rows);
        }
      }
      return { data: combined };
    } catch (err) {
      return Promise.reject(err);
    }
  },
  /** Bitta talabaning topshirig'i */
  getStudentResult: (groupId, homeworkId, studentId) =>
    api.get(
      `/group/${Number(groupId)}/homework/${Number(homeworkId)}/result/${Number(studentId)}`
    ),
  /** Barcha guruhlarning barcha homework natijalari - ADMIN/SUPERADMIN */
  getAllResults: (params = {}) => {
    return Promise.reject(
      Object.assign(new Error('homeworkAPI.getAllResults is removed. Use /group/{groupId}/homework/{homeworkId}/results instead.'), {
        code: 'DEPRECATED_ENDPOINT',
      })
    );
  },
  /** POST /homework — multipart: lesson_id, group_id, title, file */
  create: (payload) =>
    apiForm.post(
      "/homework",
      payload instanceof FormData
        ? payload
        : buildHomeworkFormData(payload)
    ),
  update: (id, payload) =>
    apiForm.patch(
      `/homework/${id}`,
      payload instanceof FormData
        ? payload
        : buildHomeworkFormData(payload)
    ),
  delete: (id) => api.delete(`/homework/${id}`),
  check: (groupId, homeworkId, data) => {
    if (!groupId || !homeworkId) {
      return Promise.reject(new Error('groupId va homeworkId majburiy'));
    }

    if (!data) {
      return Promise.reject(new Error('Data majburiy'));
    }

    const isFormData = data instanceof FormData;
    const grade = isFormData ? data.get('grade') : data.grade;
    const title = isFormData ? data.get('title') : data.title;
    const studentId = isFormData ? data.get('student_id') : data.student_id;

    if (grade === undefined || grade === null) {
      return Promise.reject(new Error('grade majburiy'));
    }
    
    if (!studentId) {
      console.warn('⚠️ student_id yo\'q, backend xatolik qaytarishi mumkin');
    }

    if (Number(grade) < 0 || Number(grade) > 100) {
      return Promise.reject(new Error("grade 0 dan 100 gacha bo'lishi kerak"));
    }

    const url = `/group/${Number(groupId)}/homework/${Number(homeworkId)}/check`;
    
    console.log('🔵 homeworkAPI.check yuborilmoqda:', {
      url,
      method: 'POST',
      isFormData,
      grade,
      studentId,
      title
    });
    
    return isFormData
      ? apiForm.post(url, data)
      : api.post(url, data);
  }
};

// =============================================
// 🎓 EXAMS — localStorage (backend hali yo'q)
// =============================================

export const EXAM_RESULT_STATUSES = [
  "ACCEPTED",
  "REJECTED",
  "PENDING",
  "CHECKED",
];

/** Guruh imtihonlari — frontend local API */
export const examAPI = localExamAPI;

// =============================================
// 📁 FILES — Swagger "Files" (faqat 2 ta endpoint)
// GET  /files/{groupId}              — guruh videolari ro'yxati
// POST /files/group/{grupId}/upload?lessonId=  — multipart field: file
// =============================================

const FILES_UPLOAD_TIMEOUT = 600000;

/** Fayl obyektidan video URL/path ajlatish */
export const getFileMediaPath = (file) => {
  if (!file || typeof file !== "object") return null;
  return (
    file.url ||
    file.path ||
    file.filePath ||
    file.file_path ||
    file.fileUrl ||
    file.file_url ||
    file.videoUrl ||
    file.video_url ||
    file.link ||
    file.src ||
    null
  );
};

const FILES_HOST = BACKEND_API_URL.replace(/\/api\/v1\/?$/, "");

/** Fayl nomini path dan ajratish */
const extractBareFileName = (name) => {
  if (!name) return "";
  const s = String(name).replace(/\\/g, "/");
  return s.split("/").pop() || s;
};

/** MP4 / WebM blob ekanini tekshirish */
const isValidVideoBlob = async (blob) => {
  if (!blob || blob.size < 12) return false;
  if ((blob.type || "").toLowerCase().startsWith("video/")) return true;

  const head = await blob.slice(0, 12).arrayBuffer();
  const b = new Uint8Array(head);
  // MP4: ....ftyp
  if (b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70) return true;
  // WebM
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return true;
  // Katta binary fayl (octet-stream)
  if (blob.size > 50000) return true;

  return false;
};

/** fetch natijasini log qilish */
const logVideoAttempt = (label, url, info) => {
  // debug logs removed
};

/** Bitta URL dan video blob olish (token bilan yoki tokensiz) */
const tryFetchVideoBlob = async (url, useAuth = true) => {
  const headers = {};
  if (useAuth) {
    const token = localStorage.getItem("token");
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(url, { headers });
  } catch (err) {
    logVideoAttempt("Tarmoq xato", url, { error: err.message, useAuth });
    return { ok: false, reason: "network", message: err.message, url };
  }

  const contentType = (res.headers.get("content-type") || "").toLowerCase();

  logVideoAttempt("HTTP javob", url, {
    status: res.status,
    statusText: res.statusText,
    contentType,
    useAuth,
  });

  if (!res.ok) {
    let body = "";
    try {
      body = (await res.text()).slice(0, 300);
    } catch {
      /* ignore */
    }
    // debug logs removed
    return {
      ok: false,
      reason: "http",
      status: res.status,
      statusText: res.statusText,
      body,
      url,
    };
  }

  if (
    contentType.includes("application/json") ||
    contentType.includes("text/html") ||
    (contentType.includes("text/") && !contentType.includes("text/vtt"))
  ) {
    let body = "";
    try {
      body = (await res.text()).slice(0, 300);
    } catch {
      /* ignore */
    }
    // debug logs removed
    return { ok: false, reason: "wrong_type", contentType, body, url };
  }

  const rawBlob = await res.blob();

  if (!(await isValidVideoBlob(rawBlob))) {
    let preview = "";
    try {
      preview = (await rawBlob.slice(0, 120).text()).slice(0, 120);
    } catch {
      /* ignore */
    }
    // debug logs removed
    return {
      ok: false,
      reason: "invalid_blob",
      size: rawBlob.size,
      type: rawBlob.type,
      preview,
      url,
    };
  }

  const mime =
    rawBlob.type && rawBlob.type.startsWith("video/")
      ? rawBlob.type
      : "video/mp4";
  const blob =
    rawBlob.type && rawBlob.type.startsWith("video/")
      ? rawBlob
      : new Blob([rawBlob], { type: mime });

  return { ok: true, blob, url, contentType: mime, size: blob.size };
};

/** Metadata dan video URL variantlari (groupId — URL dagi guruh ID) */
export const buildVideoUrlCandidates = (file, groupId) => {
  console.log("[buildVideoUrlCandidates] Fayl obyekti:", file);
  
  const gid = groupId != null && groupId !== "" ? Number(groupId) : null;
  const fileName =
    file?.name ||
    file?.filename ||
    file?.original_name ||
    file?.originalName ||
    file?.title ||
    "";
  const bareName = extractBareFileName(fileName);
  const fileId = file?.id ?? file?.file_id ?? file?.fileId;
  const out = [];
  const push = (url) => {
    if (url && !out.includes(url)) out.push(url);
  };

  const raw = getFileMediaPath(file);
  console.log("[buildVideoUrlCandidates] getFileMediaPath natijasi:", raw);
  console.log("[buildVideoUrlCandidates] fileName:", fileName);
  console.log("[buildVideoUrlCandidates] bareName:", bareName);
  console.log("[buildVideoUrlCandidates] FILES_HOST:", FILES_HOST);
  
  if (raw) {
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      push(raw);
    } else if (raw.startsWith("/api/v1/")) {
      push(`${FILES_HOST}${raw}`);
    } else if (raw.startsWith("/")) {
      push(`${FILES_HOST}${raw}`);
    } else if (raw.startsWith("files/")) {
      push(`${FILES_HOST}/${raw}`);
    } else {
      push(`${FILES_HOST}/files/files/${raw}`);
    }
  }

  // Backend: /files/files/{filename}.mp4
  if (bareName) {
    push(`${FILES_HOST}/files/files/${bareName}`);
  }

  if (gid) {
    if (fileId) {
      push(`${BACKEND_API_URL}/files/${gid}/${fileId}`);
      push(`${BACKEND_API_URL}/files/group/${gid}/${fileId}`);
    }
    if (bareName) {
      const enc = encodeURIComponent(bareName);
      push(`${BACKEND_API_URL}/files/group/${gid}/${enc}`);
    }
  }

  if (bareName) {
    const enc = encodeURIComponent(bareName);
    push(`${BACKEND_API_URL}/files/stream/${enc}`);
    push(`${BACKEND_API_URL}/files/download/${enc}`);
  }

  console.log("[buildVideoUrlCandidates] Generatsiya qilingan URL lar:", out);
  return out;
};

/** GET /files/{groupId} javobini massivga aylantirish */
export const parseFilesList = (response, groupId) => {
  const body = response?.data;
  let list = [];

  if (Array.isArray(body)) list = body;
  else if (Array.isArray(body?.data)) list = body.data;
  else if (Array.isArray(body?.files)) list = body.files;
  else if (body?.data && typeof body.data === "object") {
    if (Array.isArray(body.data.files)) list = body.data.files;
    else {
      list = Object.values(body.data)
        .flat()
        .filter((x) => x && typeof x === "object");
    }
  } else if (body && typeof body === "object" && !Array.isArray(body)) {
    list = [body];
  }

  const flattened = [];
  for (const item of list) {
    if (Array.isArray(item.files)) {
      item.files.forEach((f) =>
        flattened.push({
          ...f,
          lesson_id: f.lesson_id || f.lessonId || item.lesson_id || item.id,
          lesson: f.lesson || item,
        })
      );
    } else if (item.file && typeof item.file === "object") {
      flattened.push({
        ...item.file,
        lesson_id: item.lesson_id || item.id,
        lesson: item,
      });
    } else {
      flattened.push(item);
    }
  }

  const seen = new Set();
  return flattened
    .map((f) => ({
      ...f,
      id: f.id ?? f.file_id ?? f.fileId,
      group_id: f.group_id || f.groupId || groupId,
      lesson_id: f.lesson_id || f.lessonId || f.lesson?.id,
    }))
    .filter(
      (f) => !groupId || !f.group_id || String(f.group_id) === String(groupId)
    )
    .filter((f) => {
      const key =
        f.id != null
          ? String(f.id)
          : `${f.lesson_id}-${f.name}-${f.created_at}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const resolveMediaRequest = (path) => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return { type: "absolute", url: path };
  }
  if (path.startsWith("/api/v1")) {
    return { type: "api", path: path.replace(/^\/api\/v1/, "") };
  }
  if (path.startsWith("/")) {
    return { type: "relative", url: path };
  }
  return { type: "relative", url: `/${path}` };
};

const fetchBlobWithAuth = async (url) => {
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(url, { headers });
  if (res.status === 401) {
    handleUnauthorized();
    throw Object.assign(new Error("Avtorizatsiya muddati tugagan"), {
      response: { status: 401 },
    });
  }
  if (!res.ok) {
    const text = await res.text();
    let parsed = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      // matn sifatida qoldiramiz
    }
    const err = new Error(
      (typeof parsed === "object" && parsed?.message) || `Xato (${res.status})`
    );
    err.response = { status: res.status, data: parsed };
    throw err;
  }
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const json = await res.json();
    throw new Error(json.message || "Video topilmadi");
  }
  return res.blob();
};

export const parseApiError = async (error) => {
  if (!error?.response) {
    if (error?.code === "ERR_NETWORK" || error?.message === "Network Error") {
      if (import.meta.env.DEV) {
        return (
          "Serverga ulanib bo'lmadi. Dev serverni to'xtatib, qayta `npm run dev` " +
          "ishga tushiring. Brauzerda localhost manzili ochilganiga ishonch hosil qiling."
        );
      }
      return "Serverga ulanib bo'lmadi. Internet aloqasini va login holatini tekshiring.";
    }
    if (error?.code === 'ECONNABORTED') {
      return 'So\'rov vaqti tugadi. Video juda katta bo\'lishi mumkin.';
    }
    // XHR reject qilgandagi xabar (masalan "Yuklash xatosi (404)")
    return error?.message || 'Tarmoq xatosi';
  }

  const data = error.response?.data;
  if (data instanceof Blob) {
    try {
      const json = JSON.parse(await data.text());
      if (Array.isArray(json.message)) return json.message.join(", ");
      return json.message || json.error || "Xato yuz berdi";
    } catch {
      return "Xato yuz berdi";
    }
  }
  if (!data) return error?.message || "Xato yuz berdi";
  if (Array.isArray(data.message) && data.message.length > 0) return data.message.join(", ");
  if (typeof data.message === "string" && data.message) return data.message;
  if (typeof data.error === "string" && data.error) return data.error;
  // Hech qanday xabar yo'q — HTTP statusni ko'rsatish
  return error?.message || `Xato (${error.response?.status || 'noma\'lum'})`;
};

export const filesAPI = {
  /**
   * GET /files/{groupId}
   * Swagger: FilesController_getFiles — ADMIN, TEACHER, SUPERADMIN
   */
  getByGroup: (groupId) => api.get(`/files/${Number(groupId)}`),

  getFiles: (groupId) => api.get(`/files/${Number(groupId)}`),

  /**
   * GET /groups/{groupId}/lessons/{lessonId}/videos
   * Get videos for a specific lesson in a group
   */
  getLessonVideos: (groupId, lessonId) => api.get(`/groups/${Number(groupId)}/lessons/${Number(lessonId)}/videos`),

  /**
   * POST /files/group/{grupId}/upload?lessonId=
   * Swagger: multipart/form-data, field: file (binary, video/mp4)
   * curl: -F 'file=@sample.mp4;type=video/mp4'
   */
  upload: (grupId, lessonId, file, onProgress) => {
    const gid = Number(grupId);
    const lid = Number(lessonId);

    if (!Number.isFinite(gid) || gid < 1) {
      return Promise.reject(
        Object.assign(new Error("Guruh ID noto'g'ri"), { code: "INVALID_GROUP" })
      );
    }
    if (!Number.isFinite(lid) || lid < 1) {
      return Promise.reject(
        Object.assign(new Error("Darsni tanlang"), { code: "INVALID_LESSON" })
      );
    }
    if (!file) {
      return Promise.reject(
        Object.assign(new Error("Video fayl tanlanmagan"), { code: "NO_FILE" })
      );
    }

    return new Promise((resolve, reject) => {
      const formData = new FormData();
      // MIME type aniq ko'rsatish: swagger curl da ;type=video/mp4
      const mimeType = file.type || "video/mp4";
      const blob = file instanceof Blob ? file : new Blob([file], { type: mimeType });
      formData.append("file", blob, file.name || "video.mp4");

      const xhr = new XMLHttpRequest();
      // Proxy orqali yuborish — CORS muammo bo'lmasligi uchun
      const uploadUrl = `/api/v1/files/group/${gid}/upload?lessonId=${lid}`;
      xhr.open("POST", uploadUrl);

      const token = localStorage.getItem("token");
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      // withCredentials: CORS cookie kerak bo'lsa
      xhr.withCredentials = false;

      // Content-Type header QOSHILMAYDI — browser o'zi boundary bilan qo'shadi
      xhr.timeout = FILES_UPLOAD_TIMEOUT;

      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        };
      }

      xhr.onload = () => {
        if (xhr.status === 401) {
          handleUnauthorized();
          return reject(Object.assign(new Error("Avtorizatsiya muddati tugagan"), {
            response: { status: 401 },
          }));
        }
        if (xhr.status >= 200 && xhr.status < 300) {
          let data = {};
          try { data = JSON.parse(xhr.responseText); } catch { /* ignore */ }
          resolve({ data });
        } else {
          let errData = {};
          try { errData = JSON.parse(xhr.responseText); } catch { /* ignore */ }
          let msg;
          if (Array.isArray(errData?.message) && errData.message.length > 0) {
            msg = errData.message.join(", ");
          } else if (typeof errData?.message === "string" && errData.message) {
            msg = errData.message;
          } else if (typeof errData?.error === "string" && errData.error) {
            msg = errData.error;
          } else if (xhr.statusText) {
            msg = `${xhr.status}: ${xhr.statusText}`;
          } else {
            msg = `Yuklash xatosi (${xhr.status})`;
          }
          const err = new Error(msg);
          err.response = { status: xhr.status, data: errData };
          reject(err);
        }
      };

      xhr.onerror = () => {
        const err = new Error("Tarmoq xatosi. Internet aloqasini yoki CORS sozlamalarini tekshiring.");
        err.code = "ERR_NETWORK";
        reject(err);
      };
      xhr.ontimeout = () => reject(new Error("Vaqt tugadi. Video juda katta bo'lishi mumkin."));

      xhr.send(formData);
    });
  },

  /** Ro'yxatdagi fayl obyektidan video blob (Swagger da alohida GET yo'q) */
  fetchVideoBlob: async (file) => {
    const mediaPath = getFileMediaPath(file);
    const req = resolveMediaRequest(mediaPath);

    if (req?.type === "api") {
      const res = await api.get(req.path, { responseType: "blob" });
      const ct = res.headers["content-type"] || "";
      if (ct.includes("application/json")) {
        const text = await res.data.text();
        const json = JSON.parse(text);
        throw new Error(json.message || "Video topilmadi");
      }
      return res.data;
    }

    if (req?.type === "absolute") {
      return fetchBlobWithAuth(req.url);
    }

    if (req?.type === "relative") {
      return fetchBlobWithAuth(req.url);
    }

    throw new Error(
      "Video manzili topilmadi. Avval videoni yuklang yoki ro'yxatni yangilang."
    );
  },
};

/** Video faylni blob sifatida yuklab, HTML player uchun URL qaytaradi */
export const loadVideoForPlayback = async (file, groupId) => {
  const fileName =
    file?.name ||
    file?.filename ||
    file?.original_name ||
    file?.originalName ||
    file?.title ||
    "Video";

  const candidates = buildVideoUrlCandidates(file, groupId);
  console.log("[Video] Sinab ko'riladigan URL lar:", candidates);

  const failures = [];

  // 1) Har bir URL ni HEAD bilan tekshirib, ishlaydiganini topamiz
  for (const url of candidates) {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const head = await fetch(url, { method: "HEAD", headers });
      const ct = (head.headers.get("content-type") || "").toLowerCase();
      
      console.log("[Video] HEAD tekshiruv:", {
        url,
        status: head.status,
        statusText: head.statusText,
        contentType: ct,
      });

      if (head.ok && ct.includes("video/")) {
        console.log("[Video] ✅ To'g'ri URL topildi:", url);
        return {
          name: fileName,
          blobUrl: url,
          revoke: false,
          sourceUrl: url,
          mode: "direct",
        };
      }
      
      failures.push({
        reason: "head",
        status: head.status,
        statusText: head.statusText,
        contentType: ct,
        url,
      });
    } catch (err) {
      console.log("[Video] HEAD xato:", { url, error: err.message });
      failures.push({ reason: "head_network", message: err.message, url });
    }
  }

  // 2) Token bilan blob yuklash (faqat agar kerak bo'lsa)
  for (const url of candidates) {
    for (const useAuth of [true, false]) {
      const result = await tryFetchVideoBlob(url, useAuth);
      if (result.ok) {
        console.log("[Video] ✅ Muvaffaqiyatli yuklandi:", {
          sourceUrl: result.url,
          size: result.size,
          contentType: result.contentType,
          useAuth,
        });
        return {
          name: fileName,
          blobUrl: URL.createObjectURL(result.blob),
          revoke: true,
          sourceUrl: result.url,
          blobSize: result.size,
          contentType: result.contentType,
        };
      }
      failures.push({ ...result, useAuth });
    }
  }

  try {
    const blob = await filesAPI.fetchVideoBlob(file);
    if (await isValidVideoBlob(blob)) {
      const mime = blob.type?.startsWith("video/") ? blob.type : "video/mp4";
      const typed = blob.type?.startsWith("video/") ? blob : new Blob([blob], { type: mime });
      console.log("[Video] ✅ fetchVideoBlob orqali yuklandi, hajm:", typed.size);
      return {
        name: fileName,
        blobUrl: URL.createObjectURL(typed),
        revoke: true,
        sourceUrl: getFileMediaPath(file) || "metadata",
        blobSize: typed.size,
        contentType: mime,
      };
    }
  } catch (fallbackErr) {
    console.error("[Video] fetchVideoBlob xato:", fallbackErr.message);
    failures.push({ reason: "fetchVideoBlob", message: fallbackErr.message });
  }

  console.error("[Video] ❌ Barcha urinishlar muvaffaqiyatsiz:", failures);
  const last = failures[failures.length - 1];
  const statusPart = last?.status ? `HTTP ${last.status}` : last?.reason || "noma'lum";
  throw new Error(
    `Video yuklab bo'lmadi (${statusPart}). Network tabda so'rovni tekshiring.`
  );
};

export default api;
