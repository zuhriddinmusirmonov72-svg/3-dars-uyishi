/** Bir qatorda ko'rsatiladigan kunlar soni */
export const ATTENDANCE_ROW_SIZE = 10;

export const LESSON_ALREADY_DONE_MESSAGE = "Dars o'tib bo'lingan";

const storageKey = (groupId) => `najot_attendance_done_${groupId}`;

export const getStoredCompletedDates = (groupId) => {
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const markDateCompleted = (groupId, iso) => {
  if (!groupId || !iso) return;
  const set = new Set(getStoredCompletedDates(groupId));
  set.add(iso);
  localStorage.setItem(storageKey(groupId), JSON.stringify([...set]));
};

export const isDateCompleted = (iso, completedSet) => completedSet.has(iso);

/** Jadval + API + localStorage bo'yicha tugallangan kunlar */
export const buildCompletedDatesSet = (
  groupId,
  scheduleDays,
  attendanceList,
  studentCount = 0
) => {
  const set = new Set(getStoredCompletedDates(groupId));

  for (const d of scheduleDays) {
    if (d.isCompleted) set.add(d.iso);
  }

  const byDate = {};
  for (const a of attendanceList) {
    if (String(a.group_id ?? a.groupId) !== String(groupId)) continue;
    const iso = String(a.date || a.lesson_date || a.lessonDate || "").slice(0, 10);
    if (!iso) continue;
    if (!byDate[iso]) byDate[iso] = new Set();
    const sid = a.student_id ?? a.studentId;
    if (sid != null) byDate[iso].add(sid);
  }

  for (const [iso, ids] of Object.entries(byDate)) {
    if (studentCount > 0 && ids.size >= studentCount) set.add(iso);
    else if (ids.size > 0) set.add(iso);
  }

  return set;
};

export const chunkScheduleDays = (sortedDays, rowSize = ATTENDANCE_ROW_SIZE) => {
  const chunks = [];
  for (let i = 0; i < sortedDays.length; i += rowSize) {
    chunks.push(sortedDays.slice(i, i + rowSize));
  }
  return chunks;
};

/**
 * Faqat joriy qator (barcha kunlari tugamaguncha keyingisi chiqmaydi)
 */
export const getActiveAttendanceRow = (sortedDays, completedSet) => {
  if (!sortedDays.length) {
    return { row: [], rowIndex: 0, totalRows: 0, allRowsComplete: true };
  }

  const chunks = chunkScheduleDays(sortedDays);
  for (let i = 0; i < chunks.length; i += 1) {
    const chunk = chunks[i];
    const allDone = chunk.every((d) => completedSet.has(d.iso));
    if (!allDone) {
      return {
        row: chunk,
        rowIndex: i,
        totalRows: chunks.length,
        allRowsComplete: false,
      };
    }
  }

  const last = chunks[chunks.length - 1];
  return {
    row: last,
    rowIndex: chunks.length - 1,
    totalRows: chunks.length,
    allRowsComplete: chunks.every((c) => c.every((d) => completedSet.has(d.iso))),
  };
};

/**
 * Berilgan sana uchun davomat qilish mumkinligini tekshiradi
 * - Bugun: agar tugallanmagan bo'lsa, qilish mumkin
 * - Ertaga va undan keyingi kunlar: faqat o'sha sana kelganda kira oladi
 * - O'tgan kunlar: agar tugallangan bo'lsa, faqat ko'rish mumkin
 */
export const canTakeAttendance = (isoDate, completedSet) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(isoDate);
  targetDate.setHours(0, 0, 0, 0);
  
  const isCompleted = completedSet.has(isoDate);
  const isToday = targetDate.getTime() === today.getTime();
  const isFuture = targetDate.getTime() > today.getTime();
  const isPast = targetDate.getTime() < today.getTime();
  
  // Bugun uchun
  if (isToday) {
    if (isCompleted) {
      return { canTake: false, reason: "already_done_today" };
    }
    return { canTake: true, reason: "today_available" };
  }
  
  // Kelajakdagi kunlar - faqat o'sha sana kelganda kira oladi
  if (isFuture) {
    return { canTake: false, reason: "not_yet" };
  }
  
  // O'tgan kunlar uchun faqat ko'rish mumkin
  if (isPast) {
    if (isCompleted) {
      return { canTake: false, reason: "view_only" };
    }
    // O'tgan tugallanmagan kunlar uchun ham qilish mumkin emas
    return { canTake: false, reason: "past_not_available" };
  }
  
  return { canTake: false, reason: "unknown" };
};
