export const MONTH_SHORT = {
  January: "Yan",
  February: "Fev",
  March: "Mar",
  April: "Apr",
  May: "May",
  June: "Iyun",
  July: "Iyul",
  August: "Avg",
  September: "Sen",
  October: "Okt",
  November: "Noy",
  December: "Dek",
  Iyun: "Iyun",
  Iyul: "Iyul",
};

const MONTH_TO_NUM = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12,
  Iyun: 6,
  Iyul: 7,
  Yan: 1,
  Fev: 2,
  Mar: 3,
  Apr: 4,
  Sen: 9,
  Okt: 10,
  Noy: 11,
  Dek: 12,
};

export const parseSchedules = (raw) => {
  const data = raw?.data?.data ?? raw?.data ?? raw ?? [];
  const arr = Array.isArray(data) ? data : [data];
  if (!arr.length || !arr[0]) return [];

  const monthObj = arr[0];
  return Object.entries(monthObj)
    .filter(([key]) => !Number.isNaN(Number(key)))
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([monthNum, monthData]) => ({
      title: `${monthNum}-o'quv oyi`,
      monthNum: Number(monthNum),
      isActive: monthData?.isActive,
      days: monthData?.days || [],
    }));
};

/** Jadval kuni → YYYY-MM-DD */
export const scheduleDayToIso = (day, year = new Date().getFullYear(), fallbackMonthNum = null) => {
  if (!day) return null;

  const direct =
    day.date || day.lesson_date || day.lessonDate || day.full_date;
  if (direct) {
    const s = String(direct).slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  }

  const resolveMonthNum = (value) => {
    if (value == null || value === '') return null;
    if (typeof value === 'number' && value >= 1 && value <= 12) return value;
    const str = String(value).trim();
    if (MONTH_TO_NUM[str] != null) return MONTH_TO_NUM[str];
    const titled = str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    if (MONTH_TO_NUM[titled] != null) return MONTH_TO_NUM[titled];
    const num = Number(str);
    return num >= 1 && num <= 12 ? num : null;
  };

  const monthNum =
    resolveMonthNum(day.month_num) ??
    resolveMonthNum(day.monthNum) ??
    resolveMonthNum(day.month) ??
    resolveMonthNum(day.month_name) ??
    resolveMonthNum(fallbackMonthNum);

  const dayNum = day.day ?? day.date_day ?? day.dayNum ?? day.day_num ?? day.day_number;

  if (monthNum && dayNum != null) {
    return `${year}-${String(monthNum).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
  }

  return null;
};

export const flattenScheduleDays = (schedules, year = new Date().getFullYear()) => {
  const items = [];
  for (const month of schedules) {
    for (const d of month.days || []) {
      const iso = scheduleDayToIso(d, year, month.monthNum);
      if (!iso) continue;
      items.push({
        iso,
        isCompleted: Boolean(d.isCompleted),
        monthKey: d.month || d.month_name,
        monthLabel: MONTH_SHORT[d.month] || String(d.month || "").slice(0, 3),
        dayNum: d.day,
      });
    }
  }
  return items.sort((a, b) => a.iso.localeCompare(b.iso));
};

export const formatLessonDateLabel = (iso) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  const months = [
    "", "Yan", "Fev", "Mar", "Apr", "May", "Iyun",
    "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek",
  ];
  return `${y} ${months[m] || m} ${d}`;
};
