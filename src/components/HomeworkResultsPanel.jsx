import { useState, useEffect, useCallback } from "react";
import { useLocation } from 'react-router-dom';
import toast from "react-hot-toast";
import {
  homeworkAPI,
  groupsAPI,
  parseApiError,
  unwrapHomeworkResults,
  normalizeHomeworkResultStatus,
  getHomeworkId,
} from "../api/api";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Switch,
  Tabs,
  Tab,
  Chip,
  CircularProgress,
  Paper,
  Avatar,
  IconButton,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Badge,
  AppBar,
  Toolbar,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';

const getStudentName = (row) =>
  row.student?.full_name ||
  row.full_name ||
  row.student_name ||
  `${row.student?.first_name || ""} ${row.student?.last_name || ""}`.trim() ||
  row.name ||
  "—";

const getStudentId = (row) =>
  row.student_id ?? row.studentId ?? row.student?.id ?? row.id ?? null;

/** Backend turli status nomlari qaytarishi mumkin — bitta formatga keltirish */
const normalizeResultStatus = normalizeHomeworkResultStatus;

const getStudentPhoto = (row) => {
  const s = row.student || row;
  return s?.photo || s?.image || s?.profile_photo || s?.avatar || null;
};

const buildNotSentRows = (students, submittedIds) =>
  students
    .filter((s) => !submittedIds.has(String(s.id)))
    .map((s) => ({
      student_id: s.id,
      student: s,
      full_name:
        s.full_name ||
        `${s.first_name || ""} ${s.last_name || ""}`.trim() ||
        s.name,
      status: "NOT_SENT",
      submitted_at: null,
    }));

const countResultsByStatus = (all, students) => {
  const ids = new Set(
    all.map((r) => String(getStudentId(r))).filter(Boolean)
  );
  const c = {
    PENDING: 0,
    REJECTED: 0,
    ACCEPTED: 0,
    NOT_SENT: buildNotSentRows(students, ids).length,
  };
  all.forEach((r) => {
    const st = normalizeResultStatus(r);
    if (st === 'PENDING' || st === 'REJECTED' || st === 'ACCEPTED') {
      c[st] += 1;
    } else {
      // treat any unknown/other as PENDING by default
      c.PENDING += 1;
    }
  });
  return c;
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()} ${hh}:${mm}`;
};

const TABS = [
  { key: "PENDING",   label: "Kutayotganlar",    badgeColor: "#f97316", badgeBg: "#fff7ed" },
  { key: "REJECTED",  label: "Qaytarilganlar",   badgeColor: "#ef4444", badgeBg: "#fef2f2" },
  { key: "ACCEPTED",  label: "Qabul qilinganlar",badgeColor: "#22c55e", badgeBg: "#f0fdf4" },
  { key: "NOT_SENT",  label: "Bajarilmagan",     badgeColor: "#0f766e", badgeBg: "#f0fdfa" },
];

const filterResultsForTab = (all, tabKey, students) => {
  if (tabKey === "NOT_SENT") {
    const ids = new Set(
      all.map((r) => String(getStudentId(r))).filter(Boolean)
    );
    return buildNotSentRows(students, ids);
  }
  return all.filter((r) => normalizeResultStatus(r) === tabKey);
};

const HomeworkResultsPanel = ({ groupId, homework, students = [], onClose, onStudentClick, fetchAcrossGroups = false }) => {
  const homeworkId = getHomeworkId(homework);

  const acrossGroupsMode = fetchAcrossGroups || String(groupId || '').toLowerCase() === 'all';

  const topic =
    homework?.title ||
    homework?.topic ||
    homework?.lesson?.topic ||
    "Uy vazifa";

  const deadline =
    homework?.deadline ||
    homework?.end_date ||
    homework?.expires_at ||
    homework?.due_date ||
    null;

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialResultsTab = params.get('resultsTab') || params.get('tab') || 'PENDING';
  const normalizeInitial = (v) => {
    if (!v) return 'PENDING';
    const s = String(v).toUpperCase();
    if (['PENDING','ACCEPTED','REJECTED','NOT_SENT'].includes(s)) return s;
    // numeric fallback: 0->PENDING,1->REJECTED? Keep default PENDING
    return 'PENDING';
  };
  const [activeTab, setActiveTab] = useState(normalizeInitial(initialResultsTab));
  const [allResults, setAllResults] = useState([]);
  const [tabResults, setTabResults] = useState([]);
  const [counts, setCounts] = useState({ PENDING: 0, REJECTED: 0, ACCEPTED: 0, NOT_SENT: 0 });
  const [loading, setLoading] = useState(true);
  // always require group-specific requests
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugPrimary, setDebugPrimary] = useState(null);
  const [debugFallback, setDebugFallback] = useState(null);
  const [debugTab, setDebugTab] = useState(null);

  // derive live counts from latest data to avoid stale state showing 0
  // Prefer backend-provided `counts` when they are non-empty (even in group mode),
  // otherwise fall back to local computation from `allResults` and `students`.
  const computedLocalCounts = countResultsByStatus(allResults || [], students || []);
  const countsSum = (counts?.PENDING ?? 0) + (counts?.ACCEPTED ?? 0) + (counts?.REJECTED ?? 0) + (counts?.NOT_SENT ?? 0);
  const liveCounts = countsSum > 0 ? counts : computedLocalCounts;

  /** Barcha natijalar — badge sonlari va ro'yxat bir xil manbadan */
  const loadResults = useCallback(async () => {
    if (!homeworkId) {
      setAllResults([]);
      setTabResults([]);
      setCounts({ PENDING: 0, REJECTED: 0, ACCEPTED: 0, NOT_SENT: 0 });
      return;
    }
    if (!groupId && !acrossGroupsMode) {
      setAllResults([]);
      setTabResults([]);
      setCounts({ PENDING: 0, REJECTED: 0, ACCEPTED: 0, NOT_SENT: 0 });
      return;
    }
    setLoading(true);
    // If the 'all' (no-status) endpoint returns a plain student array,
    // we'll store it here and use it when building NOT_SENT rows.
    let studentListFromAll = null;
    try {
      // If requested, fetch results across all groups (admin/global mode)
      if (acrossGroupsMode) {
        try {
          const allRes = await homeworkAPI.getResultsAcrossGroups(homeworkId);
          const rows = unwrapHomeworkResults(allRes);
          const p = (rows || []).filter((r) => normalizeResultStatus(r) === 'PENDING');
          const a = (rows || []).filter((r) => normalizeResultStatus(r) === 'ACCEPTED');
          const rj = (rows || []).filter((r) => normalizeResultStatus(r) === 'REJECTED');

          const tabMap = { PENDING: p, ACCEPTED: a, REJECTED: rj, NOT_SENT: [] };
          setCounts({ PENDING: p.length, ACCEPTED: a.length, REJECTED: rj.length, NOT_SENT: 0 });
          setAllResults([...(p || []), ...(a || []), ...(rj || [])]);
          setTabResults(tabMap[activeTab] || []);
          setDebugPrimary({ acrossRowsCount: rows?.length ?? 0 });
        } catch (err) {
          console.error('getResultsAcrossGroups failed:', err?.message || err);
          toast.error('Guruhlar bo\'yicha natijalarni olish muvaffaqiyatsiz.');
        } finally {
          setLoading(false);
        }
        return;
      }
      // Har uchta statusni parallel chaqiramiz (group-specific canonical endpoint)
      const gid = groupId;
      const [pendingRes, acceptedRes, rejectedRes] = await Promise.allSettled([
        homeworkAPI.getResults(gid, homeworkId, 'PENDING'),
        homeworkAPI.getResults(gid, homeworkId, 'ACCEPTED'),
        homeworkAPI.getResults(gid, homeworkId, 'REJECTED'),
      ]);

      // responses received for status-specific requests

      const rawPending  = pendingRes.status  === 'fulfilled' ? unwrapHomeworkResults(pendingRes.value)  : [];
      const rawAccepted = acceptedRes.status === 'fulfilled' ? unwrapHomeworkResults(acceptedRes.value) : [];
      const rawRejected = rejectedRes.status === 'fulfilled' ? unwrapHomeworkResults(rejectedRes.value) : [];

      // Normalize raw student-like rows into unified submission objects so
      // downstream filtering (which inspects `status` or `student`) works.
      const looksLikeSubmission = (s) => {
        if (!s || typeof s !== 'object') return false;
        // common submission markers
        if (s.submitted_at || s.created_at || s.homework_answer_id || s.answer_id || s.submission_id) return true;
        if (s.score != null || s.grade != null) return true;
        // sometimes backend wraps submission under .student with other fields
        if (s.student && (s.student.submitted_at || s.student.created_at)) return true;
        return false;
      };

      const normalizeRawRows = (arr, statusKey) =>
        (arr || [])
          .map((s) => {
            if (!looksLikeSubmission(s)) return null; // treat plain student objects as NOT_SENT candidates

            // If the backend already returned a submission-like object, prefer its shape
            if (s && (s.student || s.student_id || s.id && s.submitted_at)) {
              return {
                ...s,
                status: statusKey,
              };
            }
            // Otherwise treat `s` as a submission containing student info
            return {
              student: s && typeof s === 'object' ? s : null,
              student_id: s?.id ?? s?.student_id ?? null,
              full_name: s?.full_name || s?.name || (s && `${s?.first_name||''} ${s?.last_name||''}`.trim()) || "—",
              submitted_at: s?.created_at || s?.submitted_at || null,
              status: statusKey,
            };
          })
          .filter(Boolean);

      const pendingRows = normalizeRawRows(rawPending, 'PENDING');
      const acceptedRows = normalizeRawRows(rawAccepted, 'ACCEPTED');
      const rejectedRows = normalizeRawRows(rawRejected, 'REJECTED');

      // ✅ Agar barcha status so'rovlar 0 qaytarsa, statusiz (all) so'rov ham yubor
      let allRows = [...pendingRows, ...acceptedRows, ...rejectedRows];
      if (allRows.length === 0) {
        try {
          const allRes = await homeworkAPI.getResults(gid, homeworkId);
          // all-results (no status filter) response received
          setDebugPrimary(allRes?.data ?? allRes);

          // Some backends return only aggregate counts when called without a status,
          // e.g. { homeworkPending: 2, homeworkAccept: 1, homeworkReject: 0, existStudentsInGroup: 10 }
          const rawBody = allRes?.data?.data ?? allRes?.data ?? allRes;
          const rows = unwrapHomeworkResults(allRes);

          // Detect whether `rows` are per-student submission objects or aggregate homework entries.
          // Aggregate responses may be an array of homework objects (each with `.homework`, `homeworkPending`, ...).
            const looksLikeAggregateArray = Array.isArray(rawBody) && rawBody.length > 0 && rawBody[0] && rawBody[0].homework;

          if (rows.length > 0 && !looksLikeAggregateArray) {
            // rows may be either per-student submission objects OR plain student objects
            const isPlainStudent = (s) => s && typeof s === 'object' && s.id && !looksLikeSubmission(s) && !(s.student && looksLikeSubmission(s.student));

            if (rows.every(isPlainStudent)) {
              // Treat the returned array as the student list for this group, not as submissions.
              // We'll use it below when building NOT_SENT rows.
              // Keep allRows empty (no submissions).
              // assign studentList for later use
              // eslint-disable-next-line no-unused-vars
              studentListFromAll = rows;
            } else {
              // rows appear to be per-student submissions
              allRows = rows;
              // Status bo'yicha ajratamiz
              const p = allRows.filter((r) => normalizeResultStatus(r) === "PENDING");
              const a = allRows.filter((r) => normalizeResultStatus(r) === "ACCEPTED");
              const rj = allRows.filter((r) => normalizeResultStatus(r) === "REJECTED");
              pendingRows.push(...p);
              acceptedRows.push(...a);
              rejectedRows.push(...rj);
            }
          } else if (rawBody) {
            // rawBody can be either an object with aggregate fields OR an array of homework entries.
            // If it's an array, try to find the entry that contains our `homeworkId`.
            let aggregateEntry = rawBody;
            if (Array.isArray(rawBody)) {
              const hwIdNum = Number(homeworkId);
              const sumCounts = (it) => (
                Number(it?.homeworkPending ?? it?.homework_pending ?? it?.pending ?? 0) +
                Number(it?.homeworkAccept ?? it?.homework_accept ?? it?.accepted ?? 0) +
                Number(it?.homeworkReject ?? it?.homework_reject ?? it?.rejected ?? 0)
              );

              // 1) Prefer entry that contains the homework id in its `homework` array
              aggregateEntry = rawBody.find((it) => Array.isArray(it?.homework) && it.homework.some((h) => Number(h?.id) === hwIdNum));

              // 2) Fallback: match where homework[0].id === homeworkId (explicit case requested)
              if (!aggregateEntry) {
                aggregateEntry = rawBody.find((it) => Array.isArray(it?.homework) && Number(it.homework[0]?.id) === hwIdNum);
              }

              // 3) Fallback: match by top-level id fields
              if (!aggregateEntry) {
                aggregateEntry = rawBody.find((it) => Number(it?.id) === hwIdNum || Number(it?.homework_id) === hwIdNum || Number(it?.homeworkId) === hwIdNum);
              }

              // 4) Fallback: prefer any entry with non-zero counts
              if (!aggregateEntry) {
                aggregateEntry = rawBody.find((m) => sumCounts(m) > 0);
              }

              // 5) Final fallback: first entry
              if (!aggregateEntry) aggregateEntry = rawBody[0];
            }

            // DEBUG: which aggregate entry was selected (temporary)
            try {
              const dbgHwId = Number(homeworkId);
              const aggHwId = Array.isArray(aggregateEntry?.homework) ? Number(aggregateEntry.homework[0]?.id) : Number(aggregateEntry?.id);
              const dbgPending = Number(aggregateEntry?.homeworkPending ?? aggregateEntry?.homework_pending ?? aggregateEntry?.pending ?? 0);
              const dbgAccept = Number(aggregateEntry?.homeworkAccept ?? aggregateEntry?.homework_accept ?? aggregateEntry?.accepted ?? 0);
              const dbgReject = Number(aggregateEntry?.homeworkReject ?? aggregateEntry?.homework_reject ?? aggregateEntry?.rejected ?? 0);
              console.info('[HW-AGG] selected aggregateEntry:', { homeworkId: dbgHwId, aggregateHwId: aggHwId, pending: dbgPending, accept: dbgAccept, reject: dbgReject });
            } catch (e) {
              /* ignore */
            }

            // Accept several naming variants and casings returned by backend
            const pendingCount = Number(
              aggregateEntry?.homeworkPending ??
              aggregateEntry?.homework_pending ??
              aggregateEntry?.homeworkPendingCount ??
              aggregateEntry?.pending_count ??
              aggregateEntry?.homeworkPending ??
              aggregateEntry?.homeworkPending ??
              aggregateEntry?.homeworkPending ??
              aggregateEntry?.homeworkPending ??
              aggregateEntry?.homeworkPending ??
              aggregateEntry?.homeworkPending ??
              aggregateEntry?.homeworkPending ??
              aggregateEntry?.homeworkPending ??
              aggregateEntry?.homeworkPending ??
              aggregateEntry?.homeworkPending ??
              aggregateEntry?.homeworkPending ??
              aggregateEntry?.homeworkPending ??
              aggregateEntry?.homeworkPending ??
              aggregateEntry?.homeworkPending ??
              aggregateEntry?.homeworkPending ??
              aggregateEntry?.homeworkPending ??
              aggregateEntry?.homeworkPending ??
              aggregateEntry?.homeworkAccept ??
              aggregateEntry?.pending ??
              0
            );

            const acceptedCount = Number(
              aggregateEntry?.homeworkAccept ??
              aggregateEntry?.homework_accept ??
              aggregateEntry?.accepted_count ??
              aggregateEntry?.accepted ??
              0
            );

            const rejectedCount = Number(
              aggregateEntry?.homeworkReject ??
              aggregateEntry?.homework_reject ??
              aggregateEntry?.rejected_count ??
              aggregateEntry?.rejected ??
              0
            );

            const totalStudents = Number(
              aggregateEntry?.existStudentsInGroup ??
              aggregateEntry?.existStudentsIngroup ??
              aggregateEntry?.existStudentsIngroup ??
              aggregateEntry?.students_count ??
              aggregateEntry?.total_students ??
              aggregateEntry?.existStudentsInGroup ??
              students?.length ?? 0
            );

            const submittedSum = pendingCount + acceptedCount + rejectedCount;
            const notSentCount = Math.max(0, totalStudents - submittedSum);

            // If we actually found meaningful counts, use them
            if (pendingCount || acceptedCount || rejectedCount || notSentCount) {
              setCounts({ PENDING: pendingCount, ACCEPTED: acceptedCount, REJECTED: rejectedCount, NOT_SENT: notSentCount });
              // Try to obtain the list of students for this group so we can display them.
              let studentList = Array.isArray(students) && students.length > 0 ? students : [];
              if ((!studentList || studentList.length === 0) && Array.isArray(studentListFromAll)) {
                studentList = studentListFromAll;
              }
              if ((!studentList || studentList.length === 0) && groupId) {
                try {
                  const gs = await groupsAPI.getStudents(groupId);
                  const body = gs?.data?.data ?? gs?.data ?? gs;
                  if (Array.isArray(body)) studentList = body;
                  else if (Array.isArray(body?.students)) studentList = body.students;
                } catch (e) {
                  // ignore fetching students failure — we'll still show empty list
                }
              }

              // Before marking everyone as NOT_SENT, try to fetch per-status submission lists
              // with a larger limit in case earlier calls were truncated.
              let retriedPending = [];
              let retriedAccepted = [];
              let retriedRejected = [];
              // Also attempt to extract submitted student rows from the aggregateEntry
              // Example shapes handled:
              // { homework: [ { id, students: { id, full_name } }, ... ], homeworkPending: 1, ... }
              // { success: true, data: { id, title, students: { id, full_name } } }
              const extractRowsFromAggregate = (agg) => {
                const rows = [];
                if (!agg) return rows;

                // Case: agg.homework is an array of submitted homework objects
                if (Array.isArray(agg.homework) && agg.homework.length > 0) {
                  agg.homework.forEach((h) => {
                    // student(s) may be under h.students or h.student or h.data?.students
                    const candidates = [];
                    if (Array.isArray(h.students)) candidates.push(...h.students);
                    else if (h.students && typeof h.students === 'object') candidates.push(h.students);
                    else if (Array.isArray(h.student)) candidates.push(...h.student);
                    else if (h.student && typeof h.student === 'object') candidates.push(h.student);
                    else if (h.data && h.data.students) {
                      if (Array.isArray(h.data.students)) candidates.push(...h.data.students);
                      else candidates.push(h.data.students);
                    }

                    candidates.forEach((s) => {
                      // only treat candidate as a submission when it has submission markers
                      if (!looksLikeSubmission(s) && !h.submitted_at && !h.created_at) return;
                      rows.push({ id: h.id || null, student: s, full_name: s?.full_name || s?.name || `${s?.first_name||''} ${s?.last_name||''}`.trim(), submitted_at: h.submitted_at || h.created_at || null, status: 'PENDING' });
                    });
                  });
                }

                // Case: agg.students is a single student object or array
                if (Array.isArray(agg.students) && agg.students.length > 0) {
                  agg.students.forEach((s) => {
                    if (!looksLikeSubmission(s)) return;
                    rows.push({ id: agg.id || null, student: s, full_name: s?.full_name || s?.name, submitted_at: s?.created_at || null, status: 'PENDING' });
                  });
                } else if (agg.students && typeof agg.students === 'object') {
                  const s = agg.students;
                  if (looksLikeSubmission(s)) rows.push({ id: agg.data?.id || agg.id || null, student: s, full_name: s?.full_name || s?.name, submitted_at: s?.created_at || null, status: 'PENDING' });
                }

                // Case: agg.data contains a single submission object with .students
                if (agg.data) {
                  const d = agg.data;
                  if (Array.isArray(d.students)) {
                    d.students.forEach((s) => {
                      if (!looksLikeSubmission(s)) return;
                      rows.push({ id: d.id || agg.id || null, student: s, full_name: s?.full_name || s?.name, submitted_at: s?.created_at || null, status: 'PENDING' });
                    });
                  } else if (d.students && typeof d.students === 'object') {
                    const s = d.students;
                    if (looksLikeSubmission(s)) rows.push({ id: d.id || agg.id || null, student: s, full_name: s?.full_name || s?.name, submitted_at: s?.created_at || null, status: 'PENDING' });
                  } else if (d.student && typeof d.student === 'object') {
                    const s = d.student;
                    if (looksLikeSubmission(s)) rows.push({ id: d.id || agg.id || null, student: s, full_name: s?.full_name || s?.name, submitted_at: s?.created_at || null, status: 'PENDING' });
                  }
                }

                // Only return rows that contain an identifiable student id -
                // we must not create fake per-student submissions without student identity.
                return rows.filter((r) => {
                  const sid = getStudentId(r);
                  return Boolean(sid);
                });
              };
              try {
                const [pR, aR, rR] = await Promise.allSettled([
                  homeworkAPI.getResults(groupId, homeworkId, 'PENDING', { limit: 500 }),
                  homeworkAPI.getResults(groupId, homeworkId, 'ACCEPTED', { limit: 500 }),
                  homeworkAPI.getResults(groupId, homeworkId, 'REJECTED', { limit: 500 }),
                ]);
                if (pR.status === 'fulfilled') retriedPending = unwrapHomeworkResults(pR.value);
                if (aR.status === 'fulfilled') retriedAccepted = unwrapHomeworkResults(aR.value);
                if (rR.status === 'fulfilled') retriedRejected = unwrapHomeworkResults(rR.value);
                // Normalize any raw rows from retries into unified submission objects
                const normalizeIfNeeded = (arr, statusKey) => (arr || []).filter(looksLikeSubmission).map((s) => ({ ...(s || {}), status: statusKey, student: s?.student || (s?.id ? s : s?.student) }));
                retriedPending = normalizeIfNeeded(retriedPending, 'PENDING');
                retriedAccepted = normalizeIfNeeded(retriedAccepted, 'ACCEPTED');
                retriedRejected = normalizeIfNeeded(retriedRejected, 'REJECTED');
              } catch (e) {
                // ignore retry failures
              }

              // If retried per-status lists are empty but aggregateEntry contains student info or counts,
              // try fetching the 'all results' endpoint (no status) to obtain per-student rows.
              if (
                (retriedPending.length === 0 && pendingCount > 0) ||
                (retriedAccepted.length === 0 && acceptedCount > 0) ||
                (retriedRejected.length === 0 && rejectedCount > 0)
              ) {
                try {
                  const allRes2 = await homeworkAPI.getResults(groupId, homeworkId);
                  const rows2 = unwrapHomeworkResults(allRes2);
                  if (rows2 && rows2.length > 0) {
                    // distribute rows by normalized status
                    const p = rows2.filter((r) => normalizeResultStatus(r) === 'PENDING');
                    const a = rows2.filter((r) => normalizeResultStatus(r) === 'ACCEPTED');
                    const rj = rows2.filter((r) => normalizeResultStatus(r) === 'REJECTED');
                    if (p.length || a.length || rj.length) {
                      retriedPending = retriedPending.concat(p);
                      retriedAccepted = retriedAccepted.concat(a);
                      retriedRejected = retriedRejected.concat(rj);
                    }
                  }
                } catch (e) {
                  // ignore
                }

                // If still empty, fallback to extracting rows from aggregateEntry
                if ((retriedPending.length === 0 && pendingCount > 0) && aggregateEntry) {
                  const fromAgg = extractRowsFromAggregate(aggregateEntry);
                  if (fromAgg && fromAgg.length > 0) {
                    // Best-effort: try to map by matching student ids to counts if possible,
                    // otherwise treat as pending submissions.
                    retriedPending = retriedPending.concat(fromAgg);
                  }
                }
              }

              const submittedIds = new Set([
                ...retriedPending.map((r) => String(getStudentId(r))).filter(Boolean),
                ...retriedAccepted.map((r) => String(getStudentId(r))).filter(Boolean),
                ...retriedRejected.map((r) => String(getStudentId(r))).filter(Boolean),
              ]);

              // Build NOT_SENT rows from available student list excluding any submitted ids
              const notSentRows = buildNotSentRows(studentList || [], submittedIds);

              // Use retried per-status rows for tabs
              const tabMap = {
                PENDING: retriedPending,
                ACCEPTED: retriedAccepted,
                REJECTED: retriedRejected,
                NOT_SENT: notSentRows,
              };

              setCounts({ PENDING: retriedPending.length || pendingCount, ACCEPTED: retriedAccepted.length || acceptedCount, REJECTED: retriedRejected.length || rejectedCount, NOT_SENT: notSentRows.length || notSentCount });
              setAllResults([...(retriedPending || []), ...(retriedAccepted || []), ...(retriedRejected || []), ...notSentRows]);
              setTabResults(tabMap[activeTab] || []);

              setDebugFallback({ aggregateEntry });
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          console.warn('All results fallback failed:', e?.message);
        }
      }

      setDebugPrimary({ pendingRows, acceptedRows, rejectedRows });

      // ✅ Barcha natijalar birlashtirilib NOT_SENT hisoblanadi
      const submittedIds = new Set(allRows.map(r => String(getStudentId(r))).filter(Boolean));
      const notSentRows = buildNotSentRows(students || [], submittedIds);

      const newCounts = {
        PENDING:  pendingRows.length,
        ACCEPTED: acceptedRows.length,
        REJECTED: rejectedRows.length,
        NOT_SENT: notSentRows.length,
      };
      console.log('🔢 Computed counts:', newCounts);
      setCounts(newCounts);
      setAllResults(allRows);

      // ✅ Aktiv tab uchun natijani ko'rsat
      const tabMap = {
        PENDING:  pendingRows,
        ACCEPTED: acceptedRows,
        REJECTED: rejectedRows,
        NOT_SENT: notSentRows,
      };
      setTabResults(tabMap[activeTab] || []);
      setDebugTab({ activeTab, tabCount: (tabMap[activeTab] || []).length });

    } catch (err) {
      console.error("❌ getResults xato:", err.response?.data || err.message);
      if (err.response?.status === 403) {
        toast.error("Sizda bu ma'lumotlarni ko'rish uchun ruxsat yo'q!");
      } else if (err.response?.status === 404) {
        toast.error("Uy vazifa natijalari topilmadi!");
      } else {
        const msg = await parseApiError(err);
        toast.error(msg);
      }
      setAllResults([]);
      setTabResults([]);
      setCounts({ PENDING: 0, REJECTED: 0, ACCEPTED: 0, NOT_SENT: 0 });
    } finally {
      setLoading(false);
    }
  }, [groupId, homeworkId, students, activeTab]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  useEffect(() => {
    console.log("DEBUG: allResults[0]:", allResults[0]);
    console.log("DEBUG: students[0]:", students[0]);
    setTabResults(filterResultsForTab(allResults, activeTab, students));
  }, [allResults, activeTab, students]);

  // If there's no homeworkId, don't attempt to fetch — show empty panel instead
  useEffect(() => {
    if (!homeworkId) setLoading(false);
  }, [homeworkId]);

  return (
    <Box sx={{ p: 3, width: '100%' }}>
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>

        {/* ── HEADER ── */}
        <Paper 
          elevation={2}
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
          }}
        >
          <Toolbar sx={{ px: 3 }}>
            <Tooltip title="Orqaga qaytish">
              <IconButton 
                onClick={onClose}
                sx={{ 
                  color: '#fff',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                  },
                  mr: 2
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
            <Box sx={{ flexGrow: 1 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '20px'
                }}
              >
                Uyga vazifa
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip
                label={`Topshirgan: ${allResults.length ?? 0}/${students?.length ?? ''}`}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#fff', fontWeight: 600 }}
              />
              <Chip
                label={`Qabul: ${liveCounts.ACCEPTED ?? 0}`}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#fff', fontWeight: 600 }}
              />
              <Chip
                label={`Kutayotgan: ${liveCounts.PENDING ?? 0}`}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#fff', fontWeight: 600 }}
              />
            </Box>
            
          </Toolbar>
        </Paper>

        {debugOpen && (
          <Paper sx={{ mt: 2, p: 2, bgcolor: '#f8fafc', border: '1px dashed #cbd5e1' }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>DEBUG: raw backend responses</Typography>
            <Box sx={{ maxHeight: 300, overflow: 'auto', fontSize: 12, fontFamily: 'monospace' }}>
              <Typography variant="caption" sx={{ fontWeight: 700 }}>Primary (group or global) response:</Typography>
              <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(debugPrimary, null, 2)}</pre>
              <Typography variant="caption" sx={{ fontWeight: 700 }}>Fallback global response (if used):</Typography>
              <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(debugFallback, null, 2)}</pre>
              <Typography variant="caption" sx={{ fontWeight: 700 }}>Tab response / filtered sample:</Typography>
              <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(debugTab, null, 2)}</pre>
            </Box>
          </Paper>
        )}

        {/* ── INFO CARD ── */}
        <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 1 }}>
          <CardContent sx={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ScheduleIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Mavzu
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b' }}>
                {topic !== "Uy vazifa" ? topic : "—"}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AccessTimeIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Tugash vaqti
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b' }}>
                {deadline ? formatDateTime(deadline) : "—"}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* ── TABS ── */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 0 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                minHeight: 48,
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '14px',
                color: '#64748b',
              },
              '& .MuiTab-root.Mui-selected': {
                color: '#10b981',
                fontWeight: 700,
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#10b981',
                height: 3,
              },
            }}
          >
            {TABS.map((tab) => (
              <Tab
                key={tab.key}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {tab.label}
                    <Chip
                      label={liveCounts[tab.key] ?? 0}
                      size="small"
                      sx={{
                        bgcolor: tab.badgeBg,
                        color: tab.badgeColor,
                        fontWeight: 700,
                        fontSize: '12px',
                        height: 22,
                        minWidth: 22,
                        borderRadius: '50px',
                        border: `1px solid ${tab.badgeColor}22`,
                      }}
                    />
                  </Box>
                }
                value={tab.key}
              />
            ))}
          </Tabs>
        </Box>

        {/* ── TABLE ── */}
        <Paper 
          elevation={0}
          sx={{ 
            borderRadius: '0 0 12px 12px', 
            border: 1, 
            borderColor: '#e2e8f0',
            borderTop: 'none',
            overflow: 'hidden',
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 12 }}>
              <CircularProgress size={48} thickness={4} sx={{ color: '#10b981', mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Yuklanmoqda...
              </Typography>
            </Box>
          ) : tabResults.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 12 }}>
              <Avatar sx={{ width: 56, height: 56, bgcolor: '#f1f5f9', mb: 2 }}>
                <PersonIcon sx={{ fontSize: 32, color: '#94a3b8' }} />
              </Avatar>
              <Typography variant="body2" color="text.secondary">
                Ma'lumot mavjud emas
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#fafafa' }}>
                    <TableCell sx={{ fontWeight: 600, color: '#94a3b8', fontSize: '13px', py: 2 }}>
                      O'quvchi ismi
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#94a3b8', fontSize: '13px', py: 2 }} align="right">
                      Uyga vazifa jo'natilgan vaqt
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tabResults.map((row, idx) => {
                    const name = getStudentName(row);
                    const sentAt = row.submitted_at || row.created_at || row.submittedAt || null;
                    const studentId = getStudentId(row);
                    const rowStatus = normalizeResultStatus(row);
                    const isClickable = rowStatus === 'PENDING';
                    const isNotSent = rowStatus === 'NOT_SENT';

                    return (
                      <TableRow
                        key={`${studentId ?? idx}-${idx}`}
                        onClick={() => {
                          if (!isClickable) return;
                          if (onStudentClick) {
                            // homework_answer_id ni barcha mumkin bo'lgan maydonlardan olish
                            // MUHIM: row.id talabaning homework_answer_id bo'lishi kerak (student_id emas!)
                            const hwAnswerId = 
                              row?.homework_answer_id ||
                              row?.answer_id ||
                              row?.homeworkAnswerId ||
                              row?.submission_id ||
                              // row.id ni faqat u studentId dan farq qilsa ishlatamiz
                              (row?.id && row.id !== studentId ? row.id : null) ||
                              null;
                            
                            console.log('🔵 onStudentClick - homework_answer_id qidirilmoqda:', {
                              row,
                              studentId,
                              rowId: row?.id,
                              hwAnswerId,
                              rowKeys: Object.keys(row || {})
                            });
                            
                            onStudentClick({
                              id: studentId,
                              student_id: studentId,
                              homework_answer_id: hwAnswerId,
                              full_name: name,
                              name,
                              ...row,
                            });
                          }
                        }}
                        sx={{
                          cursor: isClickable ? 'pointer' : 'default',
                          '&:hover': {
                            bgcolor: isClickable ? '#f8fafc' : 'transparent',
                          },
                          '&:last-child td': {
                            borderBottom: 'none',
                          },
                        }}
                      >
                        <TableCell sx={{ py: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar 
                              src={(() => {
                                const matchedStudent = students?.find(s => String(s.id) === String(studentId)) || {};
                                let rawPhoto = getStudentPhoto(row) || getStudentPhoto(matchedStudent);
                                if (!rawPhoto) return undefined;
                                if (rawPhoto.startsWith('http')) return rawPhoto;
                                // Agar oldida / bo'lsa uni olib tashlaymiz
                                if (rawPhoto.startsWith('/')) rawPhoto = rawPhoto.substring(1);
                                // Agar ichida files/ bo'lsa uni ham e'tiborga olamiz
                                if (rawPhoto.startsWith('files/')) rawPhoto = rawPhoto.substring(6);
                                return `https://najot-edu.softwareengineer.uz/files/${rawPhoto}`;
                              })()}
                              sx={{ width: 36, height: 36, bgcolor: '#10b981', fontSize: 14 }}
                            >
                              {name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#1e293b' }}>
                              {name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 2 }} align="right">
                          {isNotSent ? (
                            <Chip
                              label="Yuborilmagan"
                              size="small"
                              sx={{
                                bgcolor: '#f0fdfa',
                                color: '#0f766e',
                                fontWeight: 600,
                                fontSize: '12px',
                                border: '1px solid #99f6e420',
                              }}
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              {formatDateTime(sentAt)}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

      </Box>
    </Box>
  );
};

export default HomeworkResultsPanel;
