/**
 * Imtihonlar — frontend local API (localStorage).
 * Backend /exams endpointlari hali yo'q; shu qatlam UI uchun to'liq CRUD beradi.
 */

const EXAMS_KEY = "najot_exams";
const RESULTS_KEY = "najot_exam_results";

const delay = (ms = 80) => new Promise((r) => setTimeout(r, ms));

const ok = (data) => ({ data: { data, success: true } });

const nextId = (items) => {
  const max = items.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0);
  return max + 1;
};

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : fallback;
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const loadExams = () => readJson(EXAMS_KEY, []);
const saveExams = (exams) => writeJson(EXAMS_KEY, exams);

const loadResults = () => readJson(RESULTS_KEY, []);
const saveResults = (results) => writeJson(RESULTS_KEY, results);

const normalizeGroupId = (id) => Number(id);

const filterByGroup = (exams, groupId) =>
  exams.filter((e) => normalizeGroupId(e.group_id ?? e.groupId) === normalizeGroupId(groupId));

const isExamFinished = (exam) => {
  const status = String(exam.status || "").toUpperCase();
  if (["FINISHED", "TUGAGAN", "COMPLETED", "CLOSED", "ENDED"].includes(status)) return true;
  const end = exam.end_date || exam.end_time || exam.deadline;
  if (!end) return false;
  const d = new Date(end);
  return !Number.isNaN(d.getTime()) && d < new Date();
};

/** Axios javobiga o'xshash Promise */
const respond = async (data) => {
  await delay();
  return ok(data);
};

export const examStore = {
  getAll: async () => {
    const exams = loadExams().sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );
    return respond(exams);
  },

  getByGroup: async (groupId) => {
    const exams = filterByGroup(loadExams(), groupId).sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );
    return respond(exams);
  },

  getById: async (id) => {
    const exam = loadExams().find((e) => Number(e.id) === Number(id));
    if (!exam) {
      const err = new Error("Imtihon topilmadi");
      err.response = { data: { message: "Imtihon topilmadi" }, status: 404 };
      throw err;
    }
    return respond(exam);
  },

  create: async (payload) => {
    const exams = loadExams();
    const now = new Date().toISOString();
    const groupId = normalizeGroupId(payload.group_id ?? payload.groupId);
    const lessonId = Number(payload.lesson_id ?? payload.lessonId);

    const exam = {
      id: nextId(exams),
      group_id: groupId,
      lesson_id: lessonId,
      title: String(payload.title || payload.topic || "").trim(),
      topic: String(payload.title || payload.topic || "").trim(),
      description: payload.description?.trim() || "",
      status: payload.status || "ACTIVE",
      created_at: now,
      given_at: payload.given_at || now,
      published_at: payload.published_at ?? now,
      lesson_date: payload.lesson_date || payload.lesson_time || null,
      end_date: payload.end_date || payload.deadline || null,
      updated_at: now,
    };

    exams.push(exam);
    saveExams(exams);
    return respond(exam);
  },

  update: async (id, payload) => {
    const exams = loadExams();
    const idx = exams.findIndex((e) => Number(e.id) === Number(id));
    if (idx === -1) {
      const err = new Error("Imtihon topilmadi");
      err.response = { data: { message: "Imtihon topilmadi" }, status: 404 };
      throw err;
    }

    const prev = exams[idx];
    const title = payload.title ?? payload.topic;
    const updated = {
      ...prev,
      ...payload,
      id: prev.id,
      group_id: payload.group_id != null ? normalizeGroupId(payload.group_id) : prev.group_id,
      lesson_id: payload.lesson_id != null ? Number(payload.lesson_id) : prev.lesson_id,
      title: title != null ? String(title).trim() : prev.title,
      topic: title != null ? String(title).trim() : prev.topic,
      updated_at: new Date().toISOString(),
    };

    if (payload.end_date || payload.deadline) {
      updated.end_date = payload.end_date || payload.deadline;
      if (isExamFinished(updated)) updated.status = "FINISHED";
    }

    exams[idx] = updated;
    saveExams(exams);
    return respond(updated);
  },

  delete: async (id) => {
    const exams = loadExams().filter((e) => Number(e.id) !== Number(id));
    saveExams(exams);
    const results = loadResults().filter((r) => Number(r.exam_id) !== Number(id));
    saveResults(results);
    return respond({ id: Number(id), deleted: true });
  },

  getResults: async (groupId, examId, status) => {
    let results = loadResults().filter(
      (r) =>
        Number(r.exam_id) === Number(examId) &&
        normalizeGroupId(r.group_id) === normalizeGroupId(groupId)
    );
    if (status) {
      results = results.filter((r) => String(r.status).toUpperCase() === String(status).toUpperCase());
    }
    return respond(results);
  },

  getStudentResult: async (groupId, examId, studentId) => {
    const row = loadResults().find(
      (r) =>
        Number(r.exam_id) === Number(examId) &&
        normalizeGroupId(r.group_id) === normalizeGroupId(groupId) &&
        Number(r.student_id) === Number(studentId)
    );
    if (!row) {
      const err = new Error("Natija topilmadi");
      err.response = { data: { message: "Natija topilmadi" }, status: 404 };
      throw err;
    }
    return respond(row);
  },

  /** Talaba imtihonni topshirganda yoki o'qituvchi tekshirganda */
  check: async (groupId, examId, data) => {
    const results = loadResults();
    const studentId = Number(data.student_id ?? data.studentId);
    const status = String(data.status || "CHECKED").toUpperCase();
    const now = new Date().toISOString();

    let idx = results.findIndex(
      (r) =>
        Number(r.exam_id) === Number(examId) &&
        normalizeGroupId(r.group_id) === normalizeGroupId(groupId) &&
        Number(r.student_id) === studentId
    );

    const row = {
      id: idx >= 0 ? results[idx].id : nextId(results),
      exam_id: Number(examId),
      group_id: normalizeGroupId(groupId),
      student_id: studentId,
      status,
      submitted_at: data.submitted_at || (idx >= 0 ? results[idx].submitted_at : now),
      checked_at: now,
      score: data.score ?? null,
      comment: data.comment ?? "",
      student: data.student || (idx >= 0 ? results[idx].student : null),
    };

    if (idx >= 0) results[idx] = { ...results[idx], ...row };
    else results.push(row);

    saveResults(results);
    return respond(row);
  },

  /** Demo / test uchun natija qo'shish (ixtiyoriy) */
  addResult: async (groupId, examId, { student_id, status = "PENDING", student = null }) => {
    return examStore.check(groupId, examId, {
      student_id,
      status,
      student,
      submitted_at: status !== "NOT_SENT" ? new Date().toISOString() : null,
    });
  },

  clearGroup: async (groupId) => {
    const gid = normalizeGroupId(groupId);
    const exams = loadExams().filter((e) => normalizeGroupId(e.group_id) !== gid);
    const examIds = new Set(
      loadExams()
        .filter((e) => normalizeGroupId(e.group_id) === gid)
        .map((e) => Number(e.id))
    );
    const results = loadResults().filter((r) => !examIds.has(Number(r.exam_id)));
    saveExams(exams);
    saveResults(results);
    return respond({ cleared: true });
  },
};

/** api.js dagi examAPI bilan bir xil interfeys */
export const localExamAPI = {
  getAll: () => examStore.getAll(),
  getByGroup: (groupId) => examStore.getByGroup(groupId),
  getResults: (groupId, examId, status) => examStore.getResults(groupId, examId, status),
  getStudentResult: (groupId, examId, studentId) =>
    examStore.getStudentResult(groupId, examId, studentId),
  create: (payload) => examStore.create(payload),
  update: (id, payload) => examStore.update(id, payload),
  delete: (id) => examStore.delete(id),
  check: (groupId, examId, data) => examStore.check(groupId, examId, data),
};

export default examStore;
