import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { FiChevronLeft, FiBarChart2, FiX, FiMoreVertical, FiTrash2, FiUsers } from 'react-icons/fi';
import { FaUser, FaClock, FaCheck, FaPlay, FaTimes, FaLink } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useConfirm } from '../components/ConfirmProvider';
import { api, teachersAPI, groupsAPI, homeworkAPI, lessonsAPI, filesAPI, examAPI, attendanceAPI, parseApiError, fetchHomeworkByGroup, unwrapHomeworkResults, normalizeHomeworkResultStatus, parseFilesList, loadVideoForPlayback } from '../api/api';
import { scheduleDayToIso, MONTH_SHORT, flattenScheduleDays } from '../utils/schedule';
import { buildCompletedDatesSet, canTakeAttendance } from '../utils/attendanceSchedule';
import HomeworkResultsPanel from '../components/HomeworkResultsPanel';
import { getHomeworkId } from '../api/api';
import HomeworkCheckPanel from '../components/HomeworkCheckPanel';
import ExamResultsPanel from '../components/ExamResultsPanel';

const TAB_MAP = { malumotlar: 0, darsliklar: 1, davomat: 2 };
const TAB_BY_INDEX = ['malumotlar', 'darsliklar', 'davomat'];

const SUB_TABS = [
  { id: 'uyga-vazifa', label: 'Uyga vazifa' },
  { id: 'videolar', label: 'Videolar' },
  { id: 'imtihonlar', label: 'Imtihonlar' },
  { id: 'jurnal', label: 'Jurnal' },
];

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${MONTHS_EN[d.getMonth()]}, ${d.getFullYear()} ${hours}:${minutes}`;
};

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return `${d.getDate()} ${MONTHS_EN[d.getMonth()]}, ${d.getFullYear()}`;
};

const unwrapList = (raw) => {
  const data = raw?.data?.data ?? raw?.data ?? raw ?? [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.homeworks)) return data.homeworks;
  if (Array.isArray(data?.lessons)) return data.lessons;
  if (Array.isArray(data?.files)) return data.files;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.exams)) return data.exams;
  return [];
};

const getHomeworkTopic = (item) =>
  item.topic ||
  item.title ||
  item.mavzu ||
  item.lesson?.topic ||
  item.name ||
  '—';

const getHomeworkRealId = (item) => {
  if (!item) return null;
  // If the item itself is an array-like (some backends return array-like objects)
  if (Array.isArray(item) && item.length > 0) {
    const first = item[0];
    if (first && (first.id || first.homework_id)) return first.id ?? first.homework_id;
  }
  if (item && typeof item === 'object' && Object.prototype.hasOwnProperty.call(item, '0')) {
    const cand = item[0];
    if (cand && (cand.id || cand.homework_id)) return cand.id ?? cand.homework_id;
  }
  // If `homework` is an array
  if (Array.isArray(item.homework) && item.homework.length > 0) {
    const first = item.homework[0];
    if (first && (first.id || first.homework_id)) return first.id ?? first.homework_id;
  }
  // If `homework` is an object with numeric keys (some backends return {0: {...}})
  if (item.homework && typeof item.homework === 'object') {
    const numericKey = Object.keys(item.homework).find((k) => /^\d+$/.test(k));
    const candidate = numericKey ? item.homework[numericKey] : item.homework;
    if (candidate && (candidate.id || candidate.homework_id)) return candidate.id ?? candidate.homework_id;
  }
  // Common fallback fields
  if (item.id) return item.id;
  if (item.homework_id) return item.homework_id;
  if (item.homeworkId) return item.homeworkId;
  return null;
};

const getHomeworkStats = (item) => ({
  students: item.students_count ?? item.student_count ?? item.total_students ?? item.students ?? 0,
  submitted: item.submitted_count ?? item.submitted ?? 0,
  pending: item.pending_count ?? item.late_count ?? item.unchecked ?? item.waiting ?? 0,
  accepted: item.accepted_count ?? item.completed_count ?? item.checked_count ?? item.done_count ?? item.approved ?? 0,
  rejected: item.rejected_count ?? 0,
  notSent: item.not_sent_count ?? 0,
  givenAt: item.given_at || item.start_date || item.created_at || item.lesson?.start_time,
  deadline: item.deadline || item.end_date || item.expires_at || item.due_date,
  lessonDate: item.lesson_date || item.date || item.lesson?.date || item.lesson?.lesson_date,
  createdAt: item.created_at || item.given_at,
});

// Check if homework is past 20-hour deadline from creation
const isHomeworkExpired = (item) => {
  const stats = getHomeworkStats(item);
  if (!stats.createdAt) return false;

  const createdAt = new Date(stats.createdAt);
  const now = new Date();
  const hoursDiff = (now - createdAt) / (1000 * 60 * 60);

  return hoursDiff > 20;
};

const formatDateTimeStacked = (value) => {
  if (!value) return { date: '—', time: '' };
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { date: String(value), time: '' };
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return {
    date: `${d.getDate()} ${MONTHS_EN[d.getMonth()]}, ${d.getFullYear()}`,
    time: `${hours}:${minutes}`,
  };
};

const getExamTopic = (item) =>
  item.topic ||
  item.title ||
  item.mavzu ||
  item.lesson?.topic ||
  item.name ||
  '—';

const getExamStatus = (item) => {
  const status = String(item.status || item.state || '').toUpperCase();
  const endDate = item.end_date || item.end_time || item.deadline || item.finished_at;

  if (['FINISHED', 'TUGAGAN', 'COMPLETED', 'CLOSED', 'ENDED'].includes(status)) {
    return { label: 'Tugagan', type: 'finished' };
  }
  if (['ACTIVE', 'FAOL', 'OPEN', 'PUBLISHED'].includes(status)) {
    return { label: 'Faol', type: 'active' };
  }

  if (endDate) {
    const end = new Date(endDate);
    if (!Number.isNaN(end.getTime()) && end < new Date()) {
      return { label: 'Tugagan', type: 'finished' };
    }
  }

  return { label: 'Faol', type: 'active' };
};

const getExamStats = (item) => ({
  students: item.students_count ?? item.student_count ?? item.total_students ?? item.students ?? 0,
  rejected: item.rejected_count ?? item.failed_count ?? item.rejected ?? 0,
  lessonTime: item.lesson_date || item.lesson?.date || item.lesson?.start_time || item.lesson_time || item.start_time,
  givenAt: item.given_at || item.start_date || item.created_at || item.lesson?.start_time,
  publishedAt: item.published_at || item.announced_at || item.publish_date || item.publishedAt,
});

const emptyExamForm = {
  title: '',
  lesson_id: '',
  new_lesson_topic: '',
  create_new_lesson: false,
};

const emptyHomeworkForm = {
  title: '',
  lesson_id: '',
  new_lesson_topic: '',
  create_new_lesson: false,
  file: null,
};

const emptyVideoForm = {
  lesson_id: '',
  file: null,
  new_lesson_topic: '',
  create_new_lesson: false,
};

const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return '—';
  const mb = Number(bytes) / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(2)} MB`;
  const kb = Number(bytes) / 1024;
  return `${kb.toFixed(0)} KB`;
};

const getVideoName = (file) =>
  file.name ||
  file.filename ||
  file.fileName ||
  file.original_name ||
  file.originalName ||
  file.title ||
  '—';

const getLessonName = (file) =>
  file.lesson?.topic || file.lesson_name || file.lesson_topic || file.topic || '—';

const getVideoStatus = (file) => {
  const status = file.status || file.state;
  if (!status || status === 'ready' || status === 'READY' || status === 'Tayyor') return 'Tayyor';
  return status;
};



const getTeacherName = (t) =>
  t?.full_name ||
  `${t?.first_name || ''} ${t?.last_name || ''}`.trim() ||
  t?.name ||
  '—';

const getTeacherPhoto = (t) =>
  t?.photo || t?.image || t?.avatar || t?.profile_photo || null;

const parseSchedules = (raw) => {
  const data = raw?.data?.data ?? raw?.data ?? raw ?? [];
  const arr = Array.isArray(data) ? data : [data];
  if (!arr.length || !arr[0]) return [];

  const monthObj = arr[0];
  return Object.entries(monthObj)
    .filter(([key]) => !Number.isNaN(Number(key)))
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([monthNum, monthData]) => ({
      title: `${monthNum}-o'quv oyi`,
      isActive: monthData?.isActive,
      days: monthData?.days || [],
    }));
};

const GroupDetails = () => {
  const { id, homeworkId } = useParams();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/super-admin-2') ? '/super-admin-2/groups' : '/groups';
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const initialTab = TAB_BY_INDEX[Number(tabParam)] || 'malumotlar';

  const [group, setGroup] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [subTab, setSubTab] = useState('uyga-vazifa');
  const [homeworkList, setHomeworkList] = useState([]);
  const [mediaList, setMediaList] = useState([]);
  const [examList, setExamList] = useState([]);
  const [groupLessons, setGroupLessons] = useState([]);
  const [darsliklarLoading, setDarsliklarLoading] = useState(false);

  const [isHomeworkDrawerOpen, setIsHomeworkDrawerOpen] = useState(false);
  const [editingHomeworkId, setEditingHomeworkId] = useState(null);
  const [homeworkForm, setHomeworkForm] = useState(emptyHomeworkForm);
  const [isHomeworkSubmitting, setIsHomeworkSubmitting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  const [isVideoDrawerOpen, setIsVideoDrawerOpen] = useState(false);
  const [videoForm, setVideoForm] = useState(emptyVideoForm);
  const [isVideoSubmitting, setIsVideoSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({}); // { idx: 0-100 }
  const [openVideoMenuId, setOpenVideoMenuId] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [videoPlayerLoading, setVideoPlayerLoading] = useState(false);

  const [isExamDrawerOpen, setIsExamDrawerOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState(null);
  const [examForm, setExamForm] = useState(emptyExamForm);
  const [isExamSubmitting, setIsExamSubmitting] = useState(false);
  const [openExamMenuId, setOpenExamMenuId] = useState(null);
  const [selectedExamForResults, setSelectedExamForResults] = useState(null);

  const confirm = useConfirm();

  const [mentorOpen, setMentorOpen] = useState(true);
  const [paramsOpen, setParamsOpen] = useState(true);
  const [showAllMonths, setShowAllMonths] = useState(false);

  // Vazifalarni tekshirish uchun statelar
  const [selectedHomeworkForResults, setSelectedHomeworkForResults] = useState(null);
  const [selectedStudentForCheck, setSelectedStudentForCheck] = useState(null);
  const [homeworkResultsRefreshKey, setHomeworkResultsRefreshKey] = useState(0);
  const [homeworkStatusFilter, setHomeworkStatusFilter] = useState('BARCHASI');

  useEffect(() => {
    const tabFromUrl = TAB_BY_INDEX[Number(searchParams.get('tab'))];
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const openHomeworkUrl = (realId) => {
    try {
      navigate(`${basePath}/${id}/homework/${realId}/results?resultsTab=ACCEPTED`, { replace: false });
    } catch (e) {
      setSearchParams({ tab: String(TAB_MAP['darsliklar']) });
    }
  };

  const closeHomeworkUrl = () => {
    setSelectedStudentForCheck(null);
    setSelectedHomeworkForResults(null);
    try {
      navigate(`${basePath}/${id}?tab=1`, { replace: true });
    } catch (e) {
      setSearchParams({ tab: String(TAB_MAP['darsliklar']) });
    }
  };

  // Open homework modal if URL contains homeworkId param
  useEffect(() => {
    // Normalize invalid route params like 'null' or 'undefined' to avoid broken URLs
    if (!homeworkId || String(homeworkId).toLowerCase() === 'null' || String(homeworkId).toLowerCase() === 'undefined') {
      try {
        navigate(`${basePath}/${id}?tab=1`, { replace: true });
      } catch (e) {
        setSearchParams({ tab: String(TAB_MAP['darsliklar']) });
      }
      return;
    }
    // ensure homework list loaded
    console.log('[GroupDetails] route homeworkId=', homeworkId, 'homeworkList.length=', homeworkList?.length);
    if (homeworkList && homeworkList.length > 0) {
      console.log('[GroupDetails] homeworkList preview:', homeworkList.map(h => ({ id: h.id, nestedId: getHomeworkRealId(h) })));
      const hw = homeworkList.find(h => String(h.id) === String(homeworkId) || String(getHomeworkRealId(h) || '') === String(homeworkId));
      console.log('[GroupDetails] matched via find ->', hw ? ({ id: hw.id, nestedId: getHomeworkRealId(hw) }) : null);
      if (hw) {
        const realId = getHomeworkRealId(hw);
        setSelectedHomeworkForResults({ ...hw, id: realId });
        // make sure tab is homework
        setSearchParams({ tab: String(TAB_MAP['darsliklar']) });
      } else {
        console.warn('[GroupDetails] No homework matched for homeworkId=', homeworkId);
      }
    }
  }, [homeworkId, homeworkList]);

  // Compute currentHomework when route contains homeworkId
  const currentHomework = (() => {
    if (!homeworkId || !homeworkList || homeworkList.length === 0) return null;
    console.log('[GroupDetails] computing currentHomework for', homeworkId);
    const found = homeworkList.find((item) => {
      const nestedId = getHomeworkRealId(item);
      // log minimal info per item
      console.log('[GroupDetails] check item:', { id: item.id, nestedId });
      return String(nestedId || item.id) === String(homeworkId) || String(item.id) === String(homeworkId);
    });
    console.log('[GroupDetails] currentHomework found:', found ? ({ id: found.id, nestedId: getHomeworkRealId(found) }) : null);
    return found || null;
  })();

  // Display list: if homeworkId present, only show the matched homework (or empty)
  const displayHomeworkList = homeworkId ? (currentHomework ? [currentHomework] : []) : homeworkList;

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: String(TAB_MAP[tabId]) });
  };

  const fetchGroupLessons = async () => {
    try {
      const res = await lessonsAPI.getMyGroupLessons(id);
      setGroupLessons(unwrapList(res));
    } catch (err) {
      console.error('Darslar xato:', err.response?.data || err.message);
      setGroupLessons([]);
    }
  };

  const fetchHomeworkList = async () => {
    setDarsliklarLoading(true);
    try {
      // GET /homework/all → barcha guruhlar, keyin shu guruhga filtrlash
      let list = await fetchHomeworkByGroup(id);

      // Hali bo'sh bo'lsa — darslar ichidan uy vazifalarni olish
      if (list.length === 0) {
        const lessonsRes = await lessonsAPI.getMyGroupLessons(id);
        const lessons = unwrapList(lessonsRes);
        list = lessons.flatMap((lesson) => {
          if (Array.isArray(lesson.homeworks) && lesson.homeworks.length > 0) {
            return lesson.homeworks.map((hw) => ({ ...hw, lesson }));
          }
          if (lesson.homework) {
            return [{ ...lesson.homework, lesson }];
          }
          return [];
        });
      }

      // Ensure we have the group's student list to compute NOT_SENT and student counts
      let groupStudents = Array.isArray(students) ? students : [];
      try {
        if (!groupStudents || groupStudents.length === 0) {
          const gs = await groupsAPI.getStudents(id);
          const body = gs?.data?.data ?? gs?.data ?? gs;
          const sList = Array.isArray(body) ? body : (Array.isArray(body?.students) ? body.students : []);
          if (Array.isArray(sList) && sList.length > 0) {
            groupStudents = sList;
            setStudents(sList);
          }
        }
      } catch (e) {
        // ignore — we'll still try to compute counts from item fields
      }

      // For any homework item missing numeric stats, fetch status-specific lengths.
      // Avoid unnecessary calls: only request statuses when item lacks the data.
      await Promise.all(list.map(async (item) => {
        try {
          const realId = getHomeworkRealId(item) || item.id;
          if (!realId) return;
          const stats = getHomeworkStats(item);

          // Fill students count from group students if missing
          if (!stats.students || Number(stats.students) === 0) {
            if (groupStudents && groupStudents.length > 0) {
              item.students_count = groupStudents.length;
            }
          }

          // If accepted count missing, try to fetch accepted rows and set count
          if (!stats.accepted || Number(stats.accepted) === 0) {
            try {
              const aRes = await homeworkAPI.getResults(id, realId, 'ACCEPTED');
              const aRows = unwrapHomeworkResults(aRes);
              if (Array.isArray(aRows)) item.accepted_count = aRows.length;
            } catch (e) {
              // ignore per-homework fetch failure
            }
          }

          // If pending count missing, try to fetch pending rows and set count
          if (!stats.pending || Number(stats.pending) === 0) {
            try {
              const pRes = await homeworkAPI.getResults(id, realId, 'PENDING');
              const pRows = unwrapHomeworkResults(pRes);
              if (Array.isArray(pRows)) item.pending_count = pRows.length;
            } catch (e) {
              // ignore
            }
          }

          // Submitted count: try 'all' endpoint if missing
          if (!stats.submitted || Number(stats.submitted) === 0) {
            try {
              const allRes = await homeworkAPI.getResults(id, realId);
              const rows = unwrapHomeworkResults(allRes);
              if (Array.isArray(rows) && rows.length > 0) item.submitted_count = rows.length;
            } catch (e) {
              // ignore
            }
          }
        } catch (e) {
          // ignore this item
        }
      }));

      // 4️⃣ Use counts provided by backend (do not compute locally)
      // Backend is expected to return fields like: students_count, submitted_count, accepted_count, pending_count, rejected_count, not_sent_count
      const listWithResults = list.map((hw) => {
        const totalStudents = hw.students_count ?? hw.student_count ?? hw.total_students ?? hw.students ?? 0;
        let submitted = hw.submitted_count ?? hw.submitted ?? hw.submissions_count ?? 0;
        const accepted = hw.accepted_count ?? hw.completed_count ?? hw.checked_count ?? hw.approved ?? 0;
        const pending = hw.pending_count ?? hw.late_count ?? hw.unchecked ?? hw.waiting ?? 0;
        const rejected = hw.rejected_count ?? 0;

        // Only consider 'submitted' if there are actual per-status submissions.
        const perStatusSum = Number(accepted) + Number(pending) + Number(rejected);
        if (perStatusSum > 0) {
          submitted = perStatusSum;
        }

        const notSent = hw.not_sent_count ?? Math.max(0, totalStudents - submitted);

        return {
          ...hw,
          students_count: totalStudents,
          submitted_count: submitted,
          accepted_count: accepted,
          pending_count: pending,
          rejected_count: rejected,
          not_sent_count: notSent,
        };
      });

      setHomeworkList(listWithResults);
    } catch (err) {
      console.error('Darsliklar xato:', err.response?.data || err.message);
      toast.error("Darsliklarni yuklashda xato!");
      setHomeworkList([]);
    } finally {
      setDarsliklarLoading(false);
    }
  };

  const resetHomeworkForm = () => {
    setHomeworkForm(emptyHomeworkForm);
    setEditingHomeworkId(null);
    setIsHomeworkDrawerOpen(false);
  };

  const openAddHomework = async () => {
    setEditingHomeworkId(null);
    setHomeworkForm(emptyHomeworkForm);
    setIsHomeworkDrawerOpen(true);
    await fetchGroupLessons();
  };

  const openEditHomework = async (item) => {
    setOpenMenuId(null);
    setEditingHomeworkId(item.id);
    setHomeworkForm({
      title: getHomeworkTopic(item),
      lesson_id: String(item.lesson_id || item.lesson?.id || ''),
      new_lesson_topic: '',
      create_new_lesson: false,
      file: null,
    });
    setIsHomeworkDrawerOpen(true);
    await fetchGroupLessons();
  };

  const handleHomeworkSubmit = async (e) => {
    e.preventDefault();

    // Yangi formada title = description yoki dars nomi
    const titleValue = (homeworkForm.title || '').trim()
      || (homeworkForm.description || '').trim()
      || (homeworkForm.create_new_lesson
        ? homeworkForm.new_lesson_topic.trim()
        : groupLessons.find(l => String(l.id) === String(homeworkForm.lesson_id))?.topic || '');

    if (!titleValue) {
      toast.error('Izoh yoki mavzu kiriting!');
      return;
    }

    let lessonId = homeworkForm.lesson_id;

    if (homeworkForm.create_new_lesson) {
      if (!homeworkForm.new_lesson_topic.trim()) {
        toast.error('Yangi dars mavzusini kiriting!');
        return;
      }
    } else if (!lessonId) {
      toast.error('Mavzulardan birini tanlang!');
      return;
    }

    setIsHomeworkSubmitting(true);
    try {
      if (homeworkForm.create_new_lesson) {
        const lessonRes = await groupsAPI.createLesson(id, {
          group_id: Number(id),
          topic: homeworkForm.new_lesson_topic.trim(),
          description: titleValue,
        });
        const createdLesson = lessonRes.data?.data || lessonRes.data;
        lessonId = createdLesson?.id;
        if (!lessonId) throw new Error('Dars yaratilmadi');
      }

      const formData = new FormData();
      formData.append('group_id', String(id));
      formData.append('lesson_id', String(lessonId));
      formData.append('title', titleValue);
      if (homeworkForm.description?.trim()) formData.append('description', homeworkForm.description.trim());
      if (homeworkForm.file) formData.append('file', homeworkForm.file);

      if (editingHomeworkId) {
        await homeworkAPI.update(editingHomeworkId, formData);
        toast.success('Uyga vazifa yangilandi!');
      } else {
        await homeworkAPI.create(formData);
        toast.success("Uyga vazifa qo'shildi!");
      }

      resetHomeworkForm();
      fetchHomeworkList();
      fetchGroupLessons();
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.message && Array.isArray(errData.message)) {
        errData.message.forEach((m) => toast.error(m, { duration: 6000 }));
      } else {
        toast.error(errData?.message || errData?.error || 'Xato yuz berdi!', { duration: 6000 });
      }
    } finally {
      setIsHomeworkSubmitting(false);
    }
  };

  const handleDeleteHomework = async (item) => {
    setOpenMenuId(null);
    const ok = await confirm({ title: `"${getHomeworkTopic(item)}" vazifasini o'chirishni tasdiqlaysizmi?` });
    if (!ok) return;

    try {
      await homeworkAPI.delete(item.id);
      toast.success("Uyga vazifa o'chirildi!");
      fetchHomeworkList();
    } catch (err) {
      const errData = err.response?.data;
      toast.error(errData?.message || "O'chirishda xato!");
    }
  };

  const fetchVideoList = async () => {
    if (!id) return;
    setDarsliklarLoading(true);
    try {
      // GET /api/v1/files/{groupId} — URL dagi joriy guruh ID
      const res = await filesAPI.getFiles(id);
      console.log(`🎬 GET /files/${id} javob:`, res?.data);
      const parsed = parseFilesList(res, id);
      setMediaList(parsed);
      if (parsed.length === 0) {
        console.warn(`⚠️ ${id}-guruhda video yo'q. Raw:`, res?.data);
      }
    } catch (err) {
      console.error('Videolar xato:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Videolarni yuklashda xato!');
      setMediaList([]);
    } finally {
      setDarsliklarLoading(false);
    }
  };

  const closeVideoPlayer = () => {
    if (playingVideo?.revoke && playingVideo?.blobUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(playingVideo.blobUrl);
    }
    setPlayingVideo(null);
    setVideoPlayerLoading(false);
  };

  const openVideoPlayer = async (file) => {
    if (!id) {
      toast.error('Guruh topilmadi');
      return;
    }
    setOpenVideoMenuId(null);
    setVideoPlayerLoading(true);
    setPlayingVideo(null);

    try {
      console.log(`🎬 Video ochish — guruh ID: ${id}`, file);
      const playback = await loadVideoForPlayback(file, id);
      setPlayingVideo(playback);
    } catch (err) {
      console.error('❌ Video yuklash xato:', err);
      toast.error(err.message || 'Videoni ochib bo\'lmadi!');
    } finally {
      setVideoPlayerLoading(false);
    }
  };

  const resetVideoForm = () => {
    setVideoForm(emptyVideoForm);
    setUploadProgress({});
    setIsVideoDrawerOpen(false);
  };

  const openAddVideo = async () => {
    setVideoForm(emptyVideoForm);
    setIsVideoDrawerOpen(true);
    await fetchGroupLessons();
  };

  const handleVideoUpload = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const files = videoForm.files || [];
    if (files.length === 0) {
      toast.error('Video fayllarni tanlang!');
      return;
    }

    const missing = files.find(item => !item.lesson_id);
    if (missing) {
      toast.error(`"${missing.file.name}" uchun darsni tanlang!`);
      return;
    }

    setIsVideoSubmitting(true);
    setUploadProgress({});
    let successCount = 0;

    // Fayl hajmini tekshirish (backend odatda 100MB limit qo'yadi)
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
    for (const item of files) {
      if (item.file.size > MAX_FILE_SIZE) {
        toast.error(`"${item.file.name}" juda katta (${(item.file.size / 1024 / 1024).toFixed(0)} MB). Max: 100 MB`, { duration: 6000 });
        setIsVideoSubmitting(false);
        return;
      }
    }

    try {
      for (let i = 0; i < files.length; i++) {
        const item = files[i];
        const groupId = Number(id);
        const lessonIdNum = Number(item.lesson_id);

        // Progress ni 0 dan boshlash
        setUploadProgress(prev => ({ ...prev, [i]: 0 }));

        try {
          await filesAPI.upload(groupId, lessonIdNum, item.file, (pct) => {
            setUploadProgress(prev => ({ ...prev, [i]: pct }));
          });
          setUploadProgress(prev => ({ ...prev, [i]: 100 }));
          successCount++;
        } catch (err) {
          console.error('Video yuklash xatosi:', {
            status: err.response?.status,
            data: err.response?.data,
            message: err.message,
          });
          setUploadProgress(prev => ({ ...prev, [i]: -1 })); // -1 = xato
          const msg = await parseApiError(err);
          toast.error(`${item.file.name}: ${msg}`, { duration: 6000 });
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} ta video muvaffaqiyatli yuklandi!`);
        setTimeout(() => {
          resetVideoForm();
        }, 800);
        await fetchVideoList();
        await fetchGroupLessons();
      }
    } finally {
      setIsVideoSubmitting(false);
    }
  };

  const fetchExamList = async () => {
    setDarsliklarLoading(true);
    try {
      const res = await examAPI.getByGroup(id);
      let list = unwrapList(res);

      const listWithStats = await Promise.all(list.map(async (exam) => {
        if (!exam.id) return exam;
        try {
          const resultsRes = await examAPI.getResults(id, exam.id);
          const body = resultsRes?.data?.data ?? resultsRes?.data ?? [];
          let results = [];
          if (Array.isArray(body)) results = body;
          else if (Array.isArray(body?.results)) results = body.results;
          else if (Array.isArray(body?.items)) results = body.items;
          else if (Array.isArray(body?.students)) results = body.students;

          const rejected = results.filter((r) => r.status === 'REJECTED').length;
          const totalStudents = (students && students.length > 0)
            ? students.length
            : (results && results.length > 0)
              ? results.length
              : (Array.isArray(group?.students) && group.students.length > 0)
                ? group.students.length
                : exam?.students_count ?? exam?.student_count ?? 0;

          return {
            ...exam,
            students_count: totalStudents,
            rejected_count: rejected,
          };
        } catch {
          return {
            ...exam,
            students_count: students.length || 0,
            rejected_count: 0,
          };
        }
      }));

      listWithStats.sort((a, b) => {
        const da = new Date(a.created_at || a.given_at || 0).getTime();
        const db = new Date(b.created_at || b.given_at || 0).getTime();
        return db - da;
      });

      setExamList(listWithStats);
    } catch (err) {
      console.error('Imtihonlar xato:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Imtihonlarni yuklashda xato!');
      setExamList([]);
    } finally {
      setDarsliklarLoading(false);
    }
  };

  const resetExamForm = () => {
    setExamForm(emptyExamForm);
    setEditingExamId(null);
    setIsExamDrawerOpen(false);
  };

  const openAddExam = async () => {
    setEditingExamId(null);
    setExamForm(emptyExamForm);
    setIsExamDrawerOpen(true);
    await fetchGroupLessons();
  };

  const openEditExam = async (item) => {
    setOpenExamMenuId(null);
    setEditingExamId(item.id);
    setExamForm({
      title: getExamTopic(item),
      lesson_id: String(item.lesson_id || item.lesson?.id || ''),
      new_lesson_topic: '',
      create_new_lesson: false,
    });
    setIsExamDrawerOpen(true);
    await fetchGroupLessons();
  };

  const handleExamSubmit = async (e) => {
    e.preventDefault();

    const titleValue = (examForm.title || '').trim();
    if (!titleValue) {
      toast.error('Mavzu kiriting!');
      return;
    }

    let lessonId = examForm.lesson_id;

    if (examForm.create_new_lesson) {
      if (!examForm.new_lesson_topic.trim()) {
        toast.error('Yangi dars mavzusini kiriting!');
        return;
      }
    } else if (!lessonId) {
      toast.error('Mavzulardan birini tanlang!');
      return;
    }

    setIsExamSubmitting(true);
    try {
      if (examForm.create_new_lesson) {
        const lessonRes = await groupsAPI.createLesson(id, {
          group_id: Number(id),
          topic: examForm.new_lesson_topic.trim(),
          description: titleValue,
        });
        const createdLesson = lessonRes.data?.data || lessonRes.data;
        lessonId = createdLesson?.id;
        if (!lessonId) throw new Error('Dars yaratilmadi');
      }

      const payload = {
        group_id: Number(id),
        lesson_id: Number(lessonId),
        title: titleValue,
        lesson_date:
          groupLessons.find((l) => String(l.id) === String(lessonId))?.date ||
          groupLessons.find((l) => String(l.id) === String(lessonId))?.lesson_date ||
          groupLessons.find((l) => String(l.id) === String(lessonId))?.start_time ||
          null,
      };

      if (editingExamId) {
        await examAPI.update(editingExamId, payload);
        toast.success('Imtihon yangilandi!');
      } else {
        await examAPI.create(payload);
        toast.success("Imtihon qo'shildi!");
      }

      resetExamForm();
      fetchExamList();
      fetchGroupLessons();
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.message && Array.isArray(errData.message)) {
        errData.message.forEach((m) => toast.error(m, { duration: 6000 }));
      } else {
        toast.error(errData?.message || errData?.error || 'Xato yuz berdi!', { duration: 6000 });
      }
    } finally {
      setIsExamSubmitting(false);
    }
  };

  const handleDeleteExam = async (item) => {
    setOpenExamMenuId(null);
    const ok = await confirm({ title: `"${getExamTopic(item)}" imtihonini o'chirishni tasdiqlaysizmi?` });
    if (!ok) return;

    try {
      await examAPI.delete(item.id);
      toast.success("Imtihon o'chirildi!");
      fetchExamList();
    } catch (err) {
      toast.error(err.response?.data?.message || "O'chirishda xato!");
    }
  };

  const parseAttendanceList = (res) => {
    const data = res?.data?.data ?? res?.data ?? res ?? [];
    return Array.isArray(data) ? data : [];
  };

  const fetchAttendance = async (groupId) => {
    try {
      if (!groupId || Number.isNaN(Number(groupId))) {
        console.warn('fetchAttendance skipped: invalid groupId', groupId);
        setAttendanceList([]);
        return;
      }

      let list = [];
      try {
        const res = await attendanceAPI.getByGroup(groupId);
        list = parseAttendanceList(res);
      } catch (err) {
        // If /attendance/{groupId} returns 404, fallback to getting all and filtering
        if (err?.response?.status === 404) {
          const res = await attendanceAPI.getAll();
          const all = parseAttendanceList(res);
          list = all.filter(
            (a) => String(a.group_id ?? a.groupId) === String(groupId)
          );
        } else {
          // Other errors — rethrow to outer catch
          throw err;
        }
      }

      setAttendanceList(list);
    } catch (err) {
      console.error('Davomat yuklash xato:', err.response?.data || err.message);
      setAttendanceList([]);
    }
  };

  useEffect(() => {
    const fetchGroupDetails = async () => {
      setIsLoading(true);
      try {
        // getOne faqat ADMIN uchun, getById Teacher uchun ham ochiq
        const isTeacherPath = location.pathname.startsWith('/super-admin-2');

        const [groupRes, myGroupsRes, scheduleRes, studentsRes] = await Promise.allSettled([
          isTeacherPath ? groupsAPI.getById(id) : groupsAPI.getOne(id),
          isTeacherPath ? teachersAPI.getMyGroups() : Promise.resolve(null),
          groupsAPI.getSchedules(id),
          isTeacherPath
            ? Promise.resolve(null)
            : groupsAPI.getStudents(id),
        ]);

        if (groupRes.status !== 'fulfilled') throw groupRes.reason;

        const groupData = groupRes.value.data?.data || groupRes.value.data;
        setGroup(groupData);

        if (scheduleRes.status === 'fulfilled') {
          setSchedules(parseSchedules(scheduleRes.value.data));
        }

        let studentList = [];
        if (isTeacherPath && myGroupsRes.status === 'fulfilled') {
          const allGroups = myGroupsRes.value?.data?.data || myGroupsRes.value?.data || [];
          const myGroup = (Array.isArray(allGroups) ? allGroups : []).find(
            (g) => String(g.id) === String(id)
          );
          const embedded = myGroup?.students || myGroup?.student || [];
          console.log("DEBUG Teacher embedded[0]:", embedded[0]);
          // Agar embedded ichida { student: {...} } shaklida bo'lsa uni ochib olamiz
          // Lekin rasm yoki boshqa muhim fieldlar wrapperning o'zida ham bo'lishi mumkin
          studentList = (Array.isArray(embedded) ? embedded : []).map(s => {
            if (s.student) {
              return {
                ...s.student,
                photo: s.student.photo || s.photo || s.image || s.profile_photo,
                image: s.student.image || s.image || s.photo
              };
            }
            return s;
          });
        } else if (!isTeacherPath && studentsRes.status === 'fulfilled') {
          const raw = studentsRes.value?.data?.data || studentsRes.value?.data || [];
          studentList = Array.isArray(raw) ? raw : [];
        }

        // Fallback: Agar studentList bo'sh bo'lsa, getById javobidagi students ga qaraymiz
        if (studentList.length === 0) {
          const embedded = groupData?.students || groupData?.student || [];
          if (Array.isArray(embedded) && embedded.length > 0) {
            studentList = embedded.map(s => s.student || s);
          }
        }

        setStudents(studentList);

        await fetchAttendance(id);
      } catch (err) {
        console.error('Guruh ma\'lumotlari xato:', err.response?.data || err.message);
        toast.error("Guruh ma'lumotlarini yuklashda xato!");
        setGroup(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchGroupDetails();
  }, [id]);

  // Dars sahifasidan qaytganda davomatni yangilash
  useEffect(() => {
    if (id && !location.pathname.includes('/lesson')) {
      fetchAttendance(id);
    }
  }, [id, location.pathname]);

  const completedDatesSet = useMemo(() => {
    if (!id || !schedules.length) return new Set();
    const flatDays = flattenScheduleDays(schedules);
    return buildCompletedDatesSet(id, flatDays, attendanceList, students.length);
  }, [id, schedules, attendanceList, students.length]);

  useEffect(() => {
    if (activeTab !== 'darsliklar' || !id) return;

    if (subTab === 'uyga-vazifa') {
      fetchHomeworkList();
      fetchGroupLessons();

      // Har 30 soniyada avtomatik yangilanish — kimdir topshirsa darhol ko'rinadi
      const interval = setInterval(() => {
        fetchHomeworkList();
      }, 30000);
      return () => clearInterval(interval);

    } else if (subTab === 'videolar') {
      fetchVideoList();
      fetchGroupLessons();
    } else if (subTab === 'imtihonlar') {
      fetchExamList();
      fetchGroupLessons();
    } else {
      setHomeworkList([]);
      setMediaList([]);
      setExamList([]);
    }
  }, [activeTab, subTab, id]);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '100px', color: '#6b7280' }}>
        <div style={{
          width: '36px', height: '36px',
          border: '3px solid #e5e7eb', borderTopColor: '#7c3aed',
          borderRadius: '50%', animation: 'spin 1s linear infinite',
          margin: '0 auto 12px',
        }} />
        Yuklanmoqda...
      </div>
    );
  }

  if (!group) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '100px' }}>
        <h2>Guruh topilmadi</h2>
        <button onClick={() => navigate(basePath)}>
          Orqaga
        </button>
      </div>
    );
  }

  const teachers = Array.isArray(group.teachers) ? group.teachers : [];

  const studentCount = students.length > 0
    ? students.length
    : Array.isArray(group.students)
      ? group.students.length
      : group.student_count ?? group.students_count ?? group.current_students ?? 0;

  const courseDuration =
    group.course?.duration ??
    group.course?.duration_month ??
    group.course_duration ??
    group.duration ??
    '—';

  const durationNumber = (() => {
    if (typeof courseDuration === 'number') return `${courseDuration}.0`;
    const match = String(courseDuration).match(/[\d.]+/);
    return match ? (match[0].includes('.') ? match[0] : `${match[0]}.0`) : '—';
  })();

  const lessonsPerMonth =
    group.lessons_per_month ??
    group.lesson_per_month ??
    group.monthly_lesson_count ??
    group.course?.lessons_per_month ??
    (schedules[0]?.days?.length ?? '—');

  const scheduleTotal = schedules.reduce(
    (sum, m) => sum + (m.days?.length || 0),
    0
  );

  const totalLessons =
    group.total_lessons ??
    group.total_lesson_count ??
    group.course?.total_lessons ??
    (scheduleTotal > 0 ? scheduleTotal : '—');

  const averageAge =
    group.average_age ??
    group.avg_age ??
    group.middle_age ??
    group.averageAge ??
    '—';

  const params = [
    { label: 'Kurs', value: group.course?.name || group.course_name || '—' },
    { label: "O'rta yosh", value: averageAge },
    { label: "O'quvchilar sig'imi", value: group.max_student ?? '—' },
    { label: "Mavjud o'quvchilar", value: studentCount },
    { label: "O'quv oyidagi darslar soni", value: lessonsPerMonth },
    { label: 'Kurs davomiyligi (oy)', value: durationNumber },
    { label: 'Jami darslar soni', value: totalLessons },
  ];

  const firstMonth = schedules[0];
  const restMonths = schedules.slice(1);

  const renderMonthDays = (month) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
      {month.days.map((d, idx) => {
        const isoDate = scheduleDayToIso(d, new Date().getFullYear(), month.monthNum);
        const done = isoDate && completedDatesSet.has(isoDate);
        const { canTake, reason } = isoDate ? canTakeAttendance(isoDate, completedDatesSet) : { canTake: false };
        const isClickable = Boolean(isoDate) && (canTake || done);

        return (
          <div
            key={idx}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onClick={() => { if (isClickable) navigate(`${basePath}/${id}/lesson?date=${isoDate}`); }}
            onKeyDown={(e) => { if (isClickable && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); navigate(`${basePath}/${id}/lesson?date=${isoDate}`); } }}
            title={
              done
                ? `${isoDate} — tugallangan dars (ko'rish)`
                : isClickable
                  ? `${isoDate} — davomat kiritish`
                  : (isoDate ? `${isoDate} — hali sana kelmagan` : '')
            }
            style={{
              width: '60px',
              height: '70px',
              border: `2px solid ${done ? '#86efac' : '#e5e7eb'}`,
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '2px',
              background: done ? '#f0fdf4' : '#fff',
              cursor: isClickable ? 'pointer' : 'default',
              transition: 'all 0.18s ease',
              boxShadow: done ? '0 1px 4px rgba(34,197,94,0.15)' : 'none',
              opacity: isClickable ? 1 : 0.5,
            }}
            onMouseEnter={(e) => {
              if (isClickable && !done) {
                e.currentTarget.style.borderColor = '#7c3aed';
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(124,58,237,0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = done ? '#86efac' : '#e5e7eb';
              e.currentTarget.style.boxShadow = done ? '0 1px 4px rgba(34,197,94,0.15)' : 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span style={{ fontSize: '12px', color: done ? '#16a34a' : '#6b7280' }}>
              {MONTH_SHORT[d.month] || d.month?.slice(0, 3) || ''}
            </span>
            <strong style={{ color: done ? '#16a34a' : '#111827', fontWeight: 700 }}>
              {d.day}
            </strong>
            {done && (
              <span style={{ fontSize: '11px', color: '#16a34a', lineHeight: 1 }}>✓</span>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      {/* UYGA VAZIFA TO'LIQ SAHIFA FORMASI */}
      {isHomeworkDrawerOpen && (
        <div style={{
          padding: '0',
          background: '#fff',
          borderRadius: '16px',
          minHeight: '80vh',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          overflow: 'hidden',
        }}>
          {/* HEADER */}
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            padding: '24px 32px',
            borderBottom: '1px solid #e5e7eb',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={resetHomeworkForm}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                }}
              >
                <FiChevronLeft size={20} color="#fff" />
              </button>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#fff' }}>
                {editingHomeworkId ? 'Uyga vazifani tahrirlash' : 'Yangi uyga vazifa yaratish'}
              </h2>
            </div>
          </div>

          {/* FORM CONTENT */}
          <div style={{ padding: '32px 40px' }}>
            <form onSubmit={handleHomeworkSubmit} style={{ maxWidth: '660px' }}>
              {/* MAVZU */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', color: '#1f2937', marginBottom: '8px' }}>
                  * Mavzu
                </label>
                {homeworkForm.create_new_lesson ? (
                  <input
                    type="text"
                    required
                    placeholder="Yangi dars mavzusini kiriting"
                    value={homeworkForm.new_lesson_topic}
                    onChange={(e) => setHomeworkForm({ ...homeworkForm, new_lesson_topic: e.target.value })}
                    style={{
                      width: '100%',
                      borderRadius: '10px',
                      border: '2px solid #e5e7eb',
                      padding: '12px 16px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s ease',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                  />
                ) : (
                  <div style={{ position: 'relative' }}>
                    <select
                      value={homeworkForm.lesson_id}
                      onChange={(e) => setHomeworkForm({ ...homeworkForm, lesson_id: e.target.value })}
                      style={{
                        width: '100%',
                        borderRadius: '10px',
                        border: '2px solid #e5e7eb',
                        padding: '12px 40px 12px 16px',
                        fontSize: '14px',
                        appearance: 'none',
                        background: '#fff',
                        cursor: 'pointer',
                        outline: 'none',
                        boxSizing: 'border-box',
                        color: homeworkForm.lesson_id ? '#1f2937' : '#9ca3af',
                        transition: 'border-color 0.2s ease',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#3b82f6';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                      }}
                    >
                      <option value="">Mavzulardan birini tanlang</option>
                      {groupLessons.map((lesson) => (
                        <option key={lesson.id} value={lesson.id}>
                          {lesson.topic || lesson.title || `Dars #${lesson.id}`}
                        </option>
                      ))}
                    </select>
                    <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280', fontSize: '14px' }}>▼</span>
                  </div>
                )}
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', cursor: 'pointer', fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={homeworkForm.create_new_lesson}
                    onChange={(e) => setHomeworkForm({ ...homeworkForm, create_new_lesson: e.target.checked, lesson_id: '' })}
                    style={{ width: '18px', height: '18px', accentColor: '#3b82f6' }}
                  />
                  Yangi dars yaratish
                </label>
              </div>

              {/* IZOH */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', color: '#1f2937', marginBottom: '8px' }}>
                  * Izoh
                </label>
                <div style={{ border: '2px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden', transition: 'border-color 0.2s ease' }}>
                  {/* Toolbar */}
                  <div style={{
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                    borderBottom: '2px solid #e5e7eb',
                    flexWrap: 'wrap'
                  }}>
                    {['H1', 'H2'].map((h) => (
                      <button key={h} type="button" style={{
                        padding: '4px 10px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        background: '#fff',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        color: '#374151',
                        transition: 'all 0.2s ease',
                      }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f3f4f6';
                          e.currentTarget.style.borderColor = '#9ca3af';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#fff';
                          e.currentTarget.style.borderColor = '#d1d5db';
                        }}
                      >{h}</button>
                    ))}
                    <span style={{ width: '1px', height: '20px', background: '#d1d5db', margin: '0 4px' }} />
                    <select style={{
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '12px',
                      padding: '4px 8px',
                      background: '#fff',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s ease',
                    }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#3b82f6';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#d1d5db';
                      }}
                    >
                      <option>Sans Serif</option><option>Serif</option><option>Monospace</option>
                    </select>
                    <select style={{
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '12px',
                      padding: '4px 8px',
                      background: '#fff',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s ease',
                    }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#3b82f6';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#d1d5db';
                      }}
                    >
                      <option>Normal</option><option>Small</option><option>Large</option>
                    </select>
                    <span style={{ width: '1px', height: '20px', background: '#d1d5db', margin: '0 4px' }} />
                    {[{ t: 'B', s: { fontWeight: 700 } }, { t: 'I', s: { fontStyle: 'italic' } }, { t: 'U', s: { textDecoration: 'underline' } }, { t: 'S', s: { textDecoration: 'line-through' } }].map(({ t, s }) => (
                      <button key={t} type="button" style={{
                        padding: '4px 10px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        background: '#fff',
                        fontSize: '13px',
                        cursor: 'pointer',
                        color: '#374151',
                        transition: 'all 0.2s ease',
                        ...s
                      }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f3f4f6';
                          e.currentTarget.style.borderColor = '#9ca3af';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#fff';
                          e.currentTarget.style.borderColor = '#d1d5db';
                        }}
                      >{t}</button>
                    ))}
                    {['❝', '<>', '≡', '⊟', '⊞', '⊠', '🔗'].map((icon, i) => (
                      <button key={i} type="button" style={{
                        padding: '4px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        background: '#fff',
                        fontSize: '13px',
                        cursor: 'pointer',
                        color: '#374151',
                        transition: 'all 0.2s ease',
                      }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f3f4f6';
                          e.currentTarget.style.borderColor = '#9ca3af';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#fff';
                          e.currentTarget.style.borderColor = '#d1d5db';
                        }}
                      >{icon}</button>
                    ))}
                  </div>
                  <textarea
                    placeholder="Vazifa haqida batafsil ma'lumot kiriting ..."
                    value={homeworkForm.description || ''}
                    onChange={(e) => setHomeworkForm({ ...homeworkForm, description: e.target.value })}
                    rows={6}
                    style={{
                      width: '100%',
                      border: 'none',
                      padding: '14px 16px',
                      fontSize: '14px',
                      resize: 'vertical',
                      outline: 'none',
                      fontFamily: 'inherit',
                      color: '#374151',
                      boxSizing: 'border-box',
                      display: 'block',
                      background: '#fff',
                    }}
                  />
                </div>
              </div>

              {/* FAYL YUKLASH */}
              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', color: '#1f2937', marginBottom: '8px' }}>
                  Fayl
                </label>
                <div
                  onClick={() => document.getElementById('hw-file-input-main').click()}
                  onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setHomeworkForm({ ...homeworkForm, file: f }); }}
                  onDragOver={(e) => e.preventDefault()}
                  style={{
                    border: '2px dashed #d1d5db',
                    borderRadius: '12px',
                    padding: '40px 24px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.background = '#eff6ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.background = 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)';
                  }}
                >
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    boxShadow: '0 2px 8px rgba(16,185,129,0.2)',
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 16 12 12 8 16" />
                      <line x1="12" y1="12" x2="12" y2="21" />
                      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                    </svg>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>Faylni tanlash yoki shu yerga tashlang</p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9ca3af' }}>PDF, ZIP, DOC, DOCX, PPT, PPTX, TXT, Rasm</p>
                  <input id="hw-file-input-main" type="file" accept=".pdf,.zip,.rar,.doc,.docx,.ppt,.pptx,.txt,image/*" style={{ display: 'none' }} onChange={(e) => setHomeworkForm({ ...homeworkForm, file: e.target.files?.[0] || null })} />
                </div>
                {homeworkForm.file && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px 16px',
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                    border: '2px solid #86efac',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 8px rgba(16,185,129,0.1)',
                  }}>
                    <span style={{ fontSize: '14px', color: '#166534', fontWeight: 500 }}>{homeworkForm.file.name}</span>
                    <button type="button" onClick={() => setHomeworkForm({ ...homeworkForm, file: null })} style={{
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      color: '#dc2626',
                      padding: '6px 10px',
                      transition: 'all 0.2s ease',
                    }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                      }}
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* TUGMALAR */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '24px', borderTop: '2px solid #f3f4f6' }}>
                <button type="button" onClick={resetHomeworkForm} style={{
                  padding: '12px 32px',
                  borderRadius: '10px',
                  border: '2px solid #d1d5db',
                  background: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: '#374151',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#9ca3af';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                  }}
                >
                  Bekor qilish
                </button>
                <button type="submit" disabled={isHomeworkSubmitting} style={{
                  padding: '12px 32px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: isHomeworkSubmitting ? 'not-allowed' : 'pointer',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  opacity: isHomeworkSubmitting ? 0.7 : 1,
                  boxShadow: '0 2px 8px rgba(16,185,129,0.25)',
                  transition: 'all 0.2s ease',
                }}
                  onMouseEnter={(e) => {
                    if (!isHomeworkSubmitting) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.35)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isHomeworkSubmitting) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(16,185,129,0.25)';
                    }
                  }}
                >
                  {isHomeworkSubmitting ? (<><div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />Saqlanmoqda...</>) : "E'lon qilish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isExamDrawerOpen && (
        <div style={{ padding: '32px 40px', background: '#fff', borderRadius: '12px', minHeight: '80vh' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
            <button
              type="button"
              onClick={resetExamForm}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
            >
              <FiChevronLeft size={22} color="#374151" />
            </button>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#111827' }}>
              {editingExamId ? 'Imtihonni tahrirlash' : 'Yangi imtihon yaratish'}
            </h2>
          </div>

          <form onSubmit={handleExamSubmit} style={{ maxWidth: '660px' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: '#111827', marginBottom: '6px' }}>
                * Mavzu
              </label>
              <input
                type="text"
                required
                placeholder="Imtihon mavzusini kiriting"
                value={examForm.title}
                onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                style={{ width: '100%', borderRadius: '8px', border: '1px solid #d1d5db', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: '#111827', marginBottom: '6px' }}>
                * Dars
              </label>
              {examForm.create_new_lesson ? (
                <input
                  type="text"
                  required
                  placeholder="Yangi dars mavzusini kiriting"
                  value={examForm.new_lesson_topic}
                  onChange={(e) => setExamForm({ ...examForm, new_lesson_topic: e.target.value })}
                  style={{ width: '100%', borderRadius: '8px', border: '1px solid #d1d5db', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              ) : (
                <div style={{ position: 'relative' }}>
                  <select
                    value={examForm.lesson_id}
                    onChange={(e) => setExamForm({ ...examForm, lesson_id: e.target.value })}
                    style={{ width: '100%', borderRadius: '8px', border: '1px solid #d1d5db', padding: '10px 36px 10px 14px', fontSize: '14px', appearance: 'none', background: '#fff', cursor: 'pointer', outline: 'none', boxSizing: 'border-box', color: examForm.lesson_id ? '#111827' : '#9ca3af' }}
                  >
                    <option value="">Mavzulardan birini tanlang</option>
                    {groupLessons.map((lesson) => (
                      <option key={lesson.id} value={lesson.id}>
                        {lesson.topic || lesson.title || `Dars #${lesson.id}`}
                      </option>
                    ))}
                  </select>
                  <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280', fontSize: '12px' }}>▼</span>
                </div>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', cursor: 'pointer', fontSize: '13px', color: '#6b7280' }}>
                <input
                  type="checkbox"
                  checked={examForm.create_new_lesson}
                  onChange={(e) => setExamForm({ ...examForm, create_new_lesson: e.target.checked, lesson_id: '' })}
                />
                Yangi dars yaratish
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" onClick={resetExamForm} style={{ padding: '10px 28px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
                Bekor qilish
              </button>
              <button type="submit" disabled={isExamSubmitting} style={{ padding: '10px 28px', borderRadius: '8px', border: 'none', background: '#10b981', fontSize: '14px', fontWeight: 600, cursor: isExamSubmitting ? 'not-allowed' : 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', opacity: isExamSubmitting ? 0.7 : 1 }}>
                {isExamSubmitting ? (<><div style={{ width: '15px', height: '15px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />Saqlanmoqda...</>) : "E'lon qilish"}
              </button>
            </div>
          </form>
        </div>
      )}

      {!isHomeworkDrawerOpen && !isExamDrawerOpen && (
        <div style={{ padding: '24px', background: '#fff', borderRadius: '12px' }}>
          {/* HEADER */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '30px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => navigate(basePath)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <FiChevronLeft size={24} />
              </button>

              <h1 style={{ margin: 0, fontSize: '28px' }}>
                {group.name || '—'}
              </h1>

              <span style={{
                background: group.is_active !== false ? '#dcfce7' : '#fee2e2',
                color: group.is_active !== false ? '#16a34a' : '#dc2626',
                padding: '4px 12px',
                borderRadius: '6px',
                fontWeight: '600',
              }}>
                {group.is_active !== false ? 'Aktiv' : 'Faol emas'}
              </span>
            </div>

            <button style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 18px', borderRadius: '8px',
              border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer',
            }}>
              <FiBarChart2 />
              Statistika
            </button>
          </div>

          {/* TABS */}
          <div style={{
            display: 'flex', gap: '30px',
            borderBottom: '1px solid #e5e7eb', marginBottom: '24px',
          }}>
            {[
              { id: 'malumotlar', label: "Ma'lumotlar" },
              { id: 'darsliklar', label: 'Guruh darsliklari' },
              { id: 'davomat', label: 'Akademik davomati' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                style={{
                  padding: '14px 0', border: 'none', background: 'none',
                  cursor: 'pointer', fontWeight: '600',
                  borderBottom: activeTab === tab.id ? '2px solid #7c3aed' : '2px solid transparent',
                  color: activeTab === tab.id ? '#7c3aed' : '#6b7280',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'malumotlar' && (
            <>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '24px', marginBottom: '24px',
              }}>
                {/* MENTORLAR */}
                <div>
                  <div style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff',
                    padding: '16px 20px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderRadius: '12px 12px 0 0',
                  }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Guruh mentorlari</h3>
                    <FiX size={20} style={{ cursor: 'pointer', opacity: 0.9, transition: 'opacity 0.2s' }}
                      onClick={() => setMentorOpen(!mentorOpen)}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '0.9'}
                    />
                  </div>

                  <div style={{
                    border: '1px solid #e5e7eb', borderRadius: '0 0 12px 12px',
                    borderTop: 'none',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)', background: '#fff',
                    padding: '20px',
                    maxHeight: mentorOpen ? '1000px' : '0px',
                    opacity: mentorOpen ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'max-height 0.4s ease, opacity 0.3s ease, padding 0.3s ease',
                  }}>
                    {teachers.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>
                        Mentorlar topilmadi
                      </div>
                    ) : (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: '16px',
                      }}>
                        {teachers.map((teacher, idx) => {
                          const photo = getTeacherPhoto(teacher);
                          return (
                            <div
                              key={teacher.id || idx}
                              style={{
                                padding: '16px', display: 'flex', flexDirection: 'column',
                                alignItems: 'center',
                                background: '#f9fafb',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                              }}
                            >
                              {photo ? (
                                <img
                                  src={photo}
                                  alt={getTeacherName(teacher)}
                                  style={{
                                    width: '60px', height: '60px',
                                    borderRadius: '50%', marginBottom: '8px', objectFit: 'cover',
                                    border: '2px solid #ede9fe',
                                  }}
                                />
                              ) : (
                                <div style={{
                                  width: '60px', height: '60px', borderRadius: '50%',
                                  marginBottom: '8px', background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '18px', fontWeight: '700', color: '#7c3aed',
                                  border: '2px solid #ede9fe',
                                }}>
                                  {getTeacherName(teacher).substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <span style={{
                                fontSize: '10px', color: '#10b981', fontWeight: 600,
                                textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px'
                              }}>Teacher</span>
                              <h3 style={{ margin: 0, fontSize: '14px', color: '#1f2937', textAlign: 'center' }}>
                                {getTeacherName(teacher)}
                              </h3>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* PARAMETRLAR */}
                <div>
                  <div style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff',
                    padding: '16px 20px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderRadius: '12px 12px 0 0',
                  }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Parametrlar</h3>
                    <FiX size={20} style={{ cursor: 'pointer', opacity: 0.9, transition: 'opacity 0.2s' }}
                      onClick={() => setParamsOpen(!paramsOpen)}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '0.9'}
                    />
                  </div>

                  <div style={{
                    border: '1px solid #e5e7eb', borderRadius: '0 0 12px 12px',
                    borderTop: 'none',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)', background: '#fff',
                    padding: '20px',
                    maxHeight: paramsOpen ? '1000px' : '0px',
                    opacity: paramsOpen ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'max-height 0.4s ease, opacity 0.3s ease, padding 0.3s ease',
                  }}>
                    {params.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex', justifyContent: 'space-between',
                          padding: '14px 0',
                          borderBottom: idx < params.length - 1 ? '1px solid #f3f4f6' : 'none',
                        }}
                      >
                        <span style={{ color: '#6b7280', fontSize: '14px' }}>{item.label}</span>
                        <strong style={{ color: '#1f2937', fontSize: '14px' }}>{item.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* DARS JADVALI */}
              <div style={{
                border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)', background: '#fff',
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff',
                  padding: '20px 24px',
                }}>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Dars jadvali</h2>
                </div>

                <div style={{ padding: '24px' }}>
                  {schedules.length === 0 ? (
                    <div style={{
                      padding: '40px', textAlign: 'center', color: '#9ca3af',
                      background: '#f9fafb', borderRadius: '8px', border: '1px dashed #e5e7eb',
                    }}>
                      Dars jadvali mavjud emas
                    </div>
                  ) : (
                    <>
                      {firstMonth && (
                        <div style={{ marginBottom: '32px' }}>
                          <h3 style={{
                            fontSize: '16px', fontWeight: 600, color: '#1f2937',
                            marginBottom: '16px', paddingBottom: '8px',
                            borderBottom: '2px solid #e5e7eb',
                          }}>{firstMonth.title}</h3>
                          {renderMonthDays(firstMonth)}
                        </div>
                      )}

                      {restMonths.length > 0 && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
                            <button
                              onClick={() => setShowAllMonths(!showAllMonths)}
                              style={{
                                padding: '12px 32px', border: '1px solid #e5e7eb',
                                background: 'white', borderRadius: '8px', cursor: 'pointer',
                                fontSize: '14px', fontWeight: 500, color: '#374151',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#3b82f6';
                                e.currentTarget.style.color = '#3b82f6';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(59,130,246,0.15)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#e5e7eb';
                                e.currentTarget.style.color = '#374151';
                                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                              }}
                            >
                              {showAllMonths ? 'Yopish' : "Barchasini ko'rish"}
                            </button>
                          </div>

                          {showAllMonths && restMonths.map((month, index) => (
                            <div key={index} style={{ marginBottom: '32px' }}>
                              <h3 style={{
                                fontSize: '16px', fontWeight: 600, color: '#1f2937',
                                marginBottom: '16px', paddingBottom: '8px',
                                borderBottom: '2px solid #e5e7eb',
                              }}>{month.title}</h3>
                              {renderMonthDays(month)}
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'darsliklar' && (
            <div style={{ padding: '24px' }}>
              {selectedHomeworkForResults && selectedStudentForCheck ? (
                <HomeworkCheckPanel
                  groupId={id}
                  homework={selectedHomeworkForResults}
                  student={selectedStudentForCheck}
                  onClose={() => { setSelectedStudentForCheck(null); closeHomeworkUrl(); }}
                  onUpdate={() => {
                    setSelectedStudentForCheck(null);
                    setHomeworkResultsRefreshKey((k) => k + 1);
                    fetchHomeworkList();
                    closeHomeworkUrl();
                  }}
                />
              ) : selectedHomeworkForResults && !selectedStudentForCheck ? (
                <HomeworkResultsPanel
                  key={`${getHomeworkId(selectedHomeworkForResults) || 'hw'}-${homeworkResultsRefreshKey}`}
                  groupId={id}
                  homework={selectedHomeworkForResults}
                  students={students}
                  onClose={() => { setSelectedHomeworkForResults(null); closeHomeworkUrl(); }}
                  onStudentClick={(studentRow) => setSelectedStudentForCheck(studentRow)}
                />
              ) : selectedExamForResults ? (
                <ExamResultsPanel
                  key={selectedExamForResults.id}
                  groupId={id}
                  exam={selectedExamForResults}
                  students={students}
                  onClose={() => setSelectedExamForResults(null)}
                />
              ) : (
                <>
                  {/* SUB TABS */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    marginBottom: '24px',
                    flexWrap: 'wrap',
                    gap: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {SUB_TABS.map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => {
                            setSelectedExamForResults(null);
                            setSubTab(st.id);
                          }}
                          style={{
                            padding: '10px 24px',
                            borderRadius: '8px',
                            border: 'none',
                            fontWeight: '600',
                            fontSize: '14px',
                            cursor: 'pointer',
                            background: subTab === st.id
                              ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                              : '#fff',
                            color: subTab === st.id ? '#fff' : '#374151',
                            boxShadow: subTab === st.id
                              ? '0 2px 8px rgba(59,130,246,0.25)'
                              : '0 1px 2px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (subTab !== st.id) {
                              e.currentTarget.style.background = '#f9fafb';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (subTab !== st.id) {
                              e.currentTarget.style.background = '#fff';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }
                          }}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>

                    {(subTab === 'uyga-vazifa' || subTab === 'videolar' || subTab === 'imtihonlar') && (
                      <button
                        type="button"
                        style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#fff',
                          padding: '10px 24px',
                          borderRadius: '8px',
                          fontWeight: '600',
                          fontSize: '14px',
                          border: 'none',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          boxShadow: '0 2px 8px rgba(16,185,129,0.25)',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.35)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(16,185,129,0.25)';
                        }}
                        onClick={
                          subTab === 'uyga-vazifa'
                            ? openAddHomework
                            : subTab === 'videolar'
                              ? openAddVideo
                              : openAddExam
                        }
                      >
                        {subTab === 'imtihonlar' ? 'Yangi imtihon' : "+ Qo'shish"}
                      </button>
                    )}
                  </div>

                  {darsliklarLoading ? (
                    <div style={{ textAlign: 'center', padding: '80px', color: '#6b7280', background: '#f9fafb', borderRadius: '12px', border: '1px dashed #e5e7eb' }}>
                      <div style={{
                        width: '40px', height: '40px',
                        border: '3px solid #e5e7eb', borderTopColor: '#3b82f6',
                        borderRadius: '50%', animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px',
                      }} />
                      <div style={{ fontSize: '16px', fontWeight: 500 }}>Yuklanmoqda...</div>
                    </div>
                  ) : subTab === 'uyga-vazifa' ? (
                    <>
                      <div style={{
                        overflowX: 'auto',
                        background: '#fff',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      }}>
                        <table className="data-table" style={{ margin: 0 }}>
                          <thead>
                            <tr style={{ background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)' }}>
                              <th style={{ width: '50px', padding: '16px' }}>#</th>
                              <th style={{ padding: '16px' }}>Mavzu</th>
                              <th style={{ width: '100px', textAlign: 'center', padding: '16px', fontSize: '13px', color: '#9ca3af' }}>O'quvchilar</th>
                              <th style={{ width: '150px', textAlign: 'center', padding: '16px', fontSize: '13px', color: '#9ca3af' }}>Qabul qilinganlar</th>
                              <th style={{ padding: '16px' }}>Uyga vazifa tugash vaqti</th>
                              <th style={{ padding: '16px' }}>Dars sanasi</th>
                              <th style={{ width: '50px', padding: '16px' }} />
                            </tr>
                          </thead>
                          <tbody>
                            {displayHomeworkList.length === 0 ? (
                              <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '60px', color: '#9ca3af', background: '#f9fafb' }}>
                                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📝</div>
                                  <div style={{ fontSize: '16px', fontWeight: 500 }}>
                                    {homeworkId ? 'Bu homework topilmadi' : 'Uyga vazifalar yo\'q'}
                                  </div>
                                  {!homeworkId && <div style={{ fontSize: '14px', marginTop: '4px' }}>Birinchi vazifani qo'shing</div>}
                                </td>
                              </tr>
                            ) : (
                              displayHomeworkList.map((item, idx) => {
                                const stats = getHomeworkStats(item);
                                const nestedHomeworkId = getHomeworkRealId(item);
                                const videoCount = item?.video_count || item?.videos?.length || 0;
                                // highlight topic only when there is at least one accepted submission
                                const hasPending = Number(stats.pending) > 0;
                                const hasAccepted = Number(stats.accepted) > 0;
                                const hasSubmitted = Number(stats.submitted) > 0;

                                // Determine homework status text and color
                                let homeworkStatusText = 'Bajarilmagan';
                                let homeworkStatusColor = '#6b7280';
                                if (hasAccepted) {
                                  homeworkStatusText = 'Qabul qilingan';
                                  homeworkStatusColor = '#10b981';
                                } else if (hasPending) {
                                  homeworkStatusText = 'Kutayotgan';
                                  homeworkStatusColor = '#f97316';
                                } else if (hasSubmitted) {
                                  homeworkStatusText = 'Qaytarilgan';
                                  homeworkStatusColor = '#ef4444';
                                }

                                return (
                                  <tr key={item.id || idx}>
                                    <td>{idx + 1}</td>
                                    <td
                                      style={{ fontWeight: '600', cursor: hasSubmitted ? 'pointer' : 'default' }}
                                      onClick={() => {
                                        if (!hasSubmitted) return;
                                        const realId = getHomeworkRealId(item);
                                        if (!realId) {
                                          console.warn('Cannot open homework results: missing homework id for item', item);
                                          return;
                                        }
                                        setSelectedHomeworkForResults({ ...item, id: realId });
                                        navigate(`${basePath}/${id}/homework/${realId}/results?resultsTab=ACCEPTED`, { replace: false });
                                      }}
                                    >
                                      {hasPending ? (
                                        <span style={{
                                          display: 'inline-block',
                                          background: 'linear-gradient(90deg, #f97316, #ef4444)',
                                          color: '#fff',
                                          padding: '3px 14px',
                                          borderRadius: '20px',
                                          fontWeight: 700,
                                          fontSize: '13px',
                                        }}>
                                          {getHomeworkTopic(item)}
                                        </span>
                                      ) : (
                                        <span style={{ color: '#2563eb' }}>{getHomeworkTopic(item)}</span>
                                      )}
                                    </td>
                                    <td style={{ textAlign: 'center', color: '#6b7280' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                        <FiUsers size={16} />
                                        <span>{students && students.length > 0 ? `${students.length} ta` : '-'}</span>
                                      </div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                      <span style={{
                                        display: 'inline-block',
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        background: hasAccepted ? '#ecfdf5' : '#f3f4f6',
                                        color: hasAccepted ? '#10b981' : '#6b7280',
                                        fontWeight: 600,
                                        fontSize: '13px',
                                      }}>
                                        {stats.accepted > 0 ? `${stats.accepted} ta` : '-'}
                                      </span>
                                    </td>
                                    <td style={{ fontSize: '13px', color: '#374151' }}>{formatDateTime(stats.deadline)}</td>
                                    <td style={{ fontSize: '13px', color: '#374151' }}>{formatDate(stats.lessonDate)}</td>
                                    <td style={{ textAlign: 'center', position: 'relative' }}>
                                      {(item.title || item.lesson_id) && item.id ? (
                                        <>
                                          <button
                                            type="button"
                                            style={{ color: '#6b7280', border: 'none', background: 'transparent', padding: '4px', cursor: hasSubmitted ? 'pointer' : 'default' }}
                                            title={nestedHomeworkId ? `Homework id: ${nestedHomeworkId}` : `Open API: /homework/${id}`}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (!hasSubmitted) return;
                                              const realId = getHomeworkRealId(item);
                                              if (!realId) {
                                                console.warn('Cannot open homework results (link): missing homework id for item', item);
                                                return;
                                              }
                                              setSelectedHomeworkForResults({ ...item, id: realId });
                                              navigate(`${basePath}/${id}/homework/${realId}/results?resultsTab=ACCEPTED`, { replace: false });
                                            }}
                                          >
                                            <FaLink size={16} />
                                          </button>
                                          <button
                                            type="button"
                                            style={{ color: '#9ca3af', padding: '4px' }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setOpenMenuId(openMenuId === item.id ? null : item.id);
                                            }}
                                          >
                                            <FiMoreVertical size={18} />
                                          </button>
                                          {openMenuId === item.id && (
                                            <div style={{
                                              position: 'absolute',
                                              right: '24px',
                                              top: '100%',
                                              background: '#fff',
                                              border: '1px solid #e5e7eb',
                                              borderRadius: '8px',
                                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                              zIndex: 10,
                                              minWidth: '140px',
                                              overflow: 'hidden',
                                            }}>
                                              <button
                                                type="button"
                                                style={{
                                                  display: 'block', width: '100%', padding: '10px 16px',
                                                  textAlign: 'left', background: 'none', border: 'none',
                                                  cursor: 'pointer', fontSize: '14px',
                                                }}
                                                onClick={() => openEditHomework(item)}
                                              >
                                                Tahrirlash
                                              </button>
                                              <button
                                                type="button"
                                                style={{
                                                  display: 'block', width: '100%', padding: '10px 16px',
                                                  textAlign: 'left', background: 'none', border: 'none',
                                                  cursor: 'pointer', fontSize: '14px', color: '#ef4444',
                                                }}
                                                onClick={() => handleDeleteHomework(item)}
                                              >
                                                O'chirish
                                              </button>
                                            </div>
                                          )}
                                        </>
                                      ) : '—'}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : subTab === 'videolar' ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th style={{ width: '50px' }}>#</th>
                            <th>Video nomi</th>
                            <th>Dars nomi</th>
                            <th>Status</th>
                            <th>Dars sanasi</th>
                            <th>Hajmi</th>
                            <th>Qo'shilgan vaqti</th>
                            <th style={{ width: '50px' }} />
                          </tr>
                        </thead>
                        <tbody>
                          {mediaList.length === 0 ? (
                            <tr>
                              <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                                Videolar yo'q
                              </td>
                            </tr>
                          ) : (
                            mediaList.map((file, idx) => {
                              const rowKey = file.id ?? idx;
                              return (
                                <tr key={rowKey}>
                                  <td>{idx + 1}</td>
                                  <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                      <button
                                        type="button"
                                        onClick={() => openVideoPlayer(file)}
                                        style={{
                                          display: 'flex', alignItems: 'center', gap: '10px',
                                          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                        }}
                                      >
                                        <span style={{
                                          width: '28px', height: '28px', borderRadius: '50%',
                                          background: '#ede9fe', display: 'flex',
                                          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                        }}>
                                          <FaPlay size={10} color="#7c3aed" style={{ marginLeft: '2px' }} />
                                        </span>
                                        <span style={{ color: '#2563eb', fontWeight: '600' }}>
                                          {getVideoName(file)}
                                        </span>
                                      </button>
                                    </div>
                                  </td>
                                  <td>{getLessonName(file)}</td>
                                  <td>
                                    <span style={{
                                      padding: '3px 10px', borderRadius: '12px', fontSize: '11px',
                                      fontWeight: '600', backgroundColor: '#d1fae5', color: '#065f46',
                                    }}>
                                      {getVideoStatus(file)}
                                    </span>
                                  </td>
                                  <td style={{ fontSize: '13px', color: '#374151' }}>
                                    {formatDate(file.lesson_date || file.lesson?.date || file.lesson?.created_at)}
                                  </td>
                                  <td style={{ fontSize: '13px', color: '#374151' }}>
                                    {formatFileSize(file.size || file.file_size)}
                                  </td>
                                  <td style={{ fontSize: '13px', color: '#374151' }}>
                                    {formatDate(file.created_at || file.uploaded_at || file.createdAt)}
                                  </td>
                                  <td style={{ textAlign: 'center', position: 'relative' }}>
                                    <button
                                      type="button"
                                      style={{ color: '#9ca3af', padding: '4px' }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenVideoMenuId(openVideoMenuId === rowKey ? null : rowKey);
                                      }}
                                    >
                                      <FiMoreVertical size={18} />
                                    </button>
                                    {openVideoMenuId === rowKey && (
                                      <div style={{
                                        position: 'absolute', right: '24px', top: '100%',
                                        background: '#fff', border: '1px solid #e5e7eb',
                                        borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        zIndex: 10, minWidth: '140px', overflow: 'hidden',
                                      }}>
                                        <button
                                          type="button"
                                          style={{
                                            display: 'block', width: '100%', padding: '10px 16px',
                                            textAlign: 'left', background: 'none', border: 'none',
                                            cursor: 'pointer', fontSize: '14px',
                                          }}
                                          onClick={() => openVideoPlayer(file)}
                                        >
                                          Ko'rish
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : subTab === 'imtihonlar' ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th style={{ width: '50px' }}>#</th>
                            <th>Mavzu</th>
                            <th style={{ width: '60px', textAlign: 'center' }}>
                              <FaUser size={14} color="#9ca3af" />
                            </th>
                            <th style={{ width: '60px', textAlign: 'center' }}>
                              <FaTimes size={14} color="#ef4444" />
                            </th>
                            <th>Status</th>
                            <th>Dars vaqti</th>
                            <th>Berilgan vaqt</th>
                            <th>E&apos;lon qilingan vaqti</th>
                            <th style={{ width: '50px' }} />
                          </tr>
                        </thead>
                        <tbody>
                          {examList.length === 0 ? (
                            <tr>
                              <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                                Imtihonlar yo&apos;q
                              </td>
                            </tr>
                          ) : (
                            examList.map((item, idx) => {
                              const stats = getExamStats(item);
                              const status = getExamStatus(item);
                              const lessonTime = formatDateTimeStacked(stats.lessonTime);
                              const givenTime = formatDateTimeStacked(stats.givenAt);
                              const publishedTime = formatDateTimeStacked(stats.publishedAt);
                              const rowNumber = examList.length - idx;

                              return (
                                <tr key={item.id || idx}>
                                  <td>{rowNumber}</td>
                                  <td
                                    style={{ fontWeight: '600', cursor: 'pointer' }}
                                    onClick={() => setSelectedExamForResults(item)}
                                  >
                                    <span style={{ color: '#2563eb' }}>{getExamTopic(item)}</span>
                                  </td>
                                  <td style={{ textAlign: 'center', color: '#6b7280' }}>{stats.students}</td>
                                  <td style={{ textAlign: 'center' }}>
                                    <span style={{ color: '#ef4444', fontWeight: 600 }}>{stats.rejected}</span>
                                  </td>
                                  <td>
                                    {status.type === 'active' ? (
                                      <span style={{
                                        display: 'inline-block',
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        background: '#ecfdf5',
                                        color: '#059669',
                                        border: '1px solid #6ee7b7',
                                      }}>
                                        Faol
                                      </span>
                                    ) : (
                                      <span style={{
                                        display: 'inline-block',
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        background: '#f3f4f6',
                                        color: '#6b7280',
                                      }}>
                                        Tugagan
                                      </span>
                                    )}
                                  </td>
                                  <td style={{ fontSize: '13px', color: '#374151' }}>
                                    <div>{lessonTime.date}</div>
                                    {lessonTime.time && <div style={{ color: '#6b7280' }}>{lessonTime.time}</div>}
                                  </td>
                                  <td style={{ fontSize: '13px', color: '#374151' }}>
                                    <div>{givenTime.date}</div>
                                    {givenTime.time && <div style={{ color: '#6b7280' }}>{givenTime.time}</div>}
                                  </td>
                                  <td style={{ fontSize: '13px', color: '#374151' }}>
                                    {stats.publishedAt ? (
                                      <>
                                        <div>{publishedTime.date}</div>
                                        {publishedTime.time && <div style={{ color: '#6b7280' }}>{publishedTime.time}</div>}
                                      </>
                                    ) : '—'}
                                  </td>
                                  <td style={{ textAlign: 'center', position: 'relative' }}>
                                    {item.id ? (
                                      <>
                                        <button
                                          type="button"
                                          style={{ color: '#9ca3af', padding: '4px' }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenExamMenuId(openExamMenuId === item.id ? null : item.id);
                                          }}
                                        >
                                          <FiMoreVertical size={18} />
                                        </button>
                                        {openExamMenuId === item.id && (
                                          <div style={{
                                            position: 'absolute',
                                            right: '24px',
                                            top: '100%',
                                            background: '#fff',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                            zIndex: 10,
                                            minWidth: '140px',
                                            overflow: 'hidden',
                                          }}>
                                            <button
                                              type="button"
                                              style={{
                                                display: 'block', width: '100%', padding: '10px 16px',
                                                textAlign: 'left', background: 'none', border: 'none',
                                                cursor: 'pointer', fontSize: '14px',
                                              }}
                                              onClick={() => openEditExam(item)}
                                            >
                                              Tahrirlash
                                            </button>
                                            <button
                                              type="button"
                                              style={{
                                                display: 'block', width: '100%', padding: '10px 16px',
                                                textAlign: 'left', background: 'none', border: 'none',
                                                cursor: 'pointer', fontSize: '14px', color: '#ef4444',
                                              }}
                                              onClick={() => handleDeleteExam(item)}
                                            >
                                              O&apos;chirish
                                            </button>
                                          </div>
                                        )}
                                      </>
                                    ) : '—'}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
                      Jurnal mavjud emas
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'davomat' && (
            <div>
              {schedules.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
                  <p style={{ fontWeight: 600, fontSize: '16px' }}>Dars jadvali mavjud emas</p>
                  <p style={{ fontSize: '13px' }}>Guruhga dars jadvali qo'shilgandan so'ng davomat ko'rinadi</p>
                </div>
              ) : (
                <div>
                  {schedules.map((month, mIdx) => (
                    <div key={mIdx} style={{ marginBottom: '32px' }}>
                      <h3 style={{
                        fontSize: '15px', fontWeight: 700, color: '#374151',
                        marginBottom: '16px', paddingBottom: '8px',
                        borderBottom: '1px solid #e5e7eb',
                      }}>
                        {month.title}
                        {month.isActive && (
                          <span style={{
                            marginLeft: '10px', padding: '2px 10px',
                            background: '#dcfce7', color: '#16a34a',
                            borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                          }}>Faol</span>
                        )}
                      </h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {month.days.map((d, dIdx) => {
                          const isoDate = scheduleDayToIso(d, new Date().getFullYear(), month.monthNum);
                          const done = isoDate && completedDatesSet.has(isoDate);
                          const { canTake, reason } = isoDate ? canTakeAttendance(isoDate, completedDatesSet) : { canTake: false, reason: null };
                          const isClickable = Boolean(isoDate) && (canTake || done);
                          const title = done
                            ? `${isoDate} — tugallangan dars (ko'rish)`
                            : canTake
                              ? `${isoDate} — davomat kiritish`
                              : isoDate
                                ? `${isoDate} — hali sana kelmagan`
                                : '';

                          return (
                            <button
                              key={dIdx}
                              type="button"
                              onClick={() => { if (isClickable) navigate(`${basePath}/${id}/lesson?date=${isoDate}`); }}
                              title={title}
                              style={{
                                width: '64px', height: '72px',
                                border: `2px solid ${done ? '#86efac' : '#e5e7eb'}`,
                                borderRadius: '12px',
                                display: 'flex', flexDirection: 'column',
                                justifyContent: 'center', alignItems: 'center', gap: '2px',
                                background: done ? '#f0fdf4' : '#fff',
                                cursor: isClickable ? 'pointer' : 'default',
                                transition: 'all 0.15s ease',
                                padding: 0,
                                boxShadow: done ? '0 1px 4px rgba(34,197,94,0.15)' : 'none',
                                opacity: isClickable ? 1 : 0.5,
                              }}
                              onMouseEnter={(e) => {
                                if (isClickable && !done) {
                                  e.currentTarget.style.borderColor = '#7c3aed';
                                  e.currentTarget.style.transform = 'translateY(-2px)';
                                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(124,58,237,0.2)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = done ? '#86efac' : '#e5e7eb';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = done ? '0 1px 4px rgba(34,197,94,0.15)' : 'none';
                              }}
                            >
                              <span style={{ fontSize: '11px', color: done ? '#16a34a' : '#9ca3af' }}>
                                {MONTH_SHORT[d.month] || d.month?.slice(0, 3) || ''}
                              </span>
                              <strong style={{
                                fontSize: '18px', fontWeight: 700,
                                color: done ? '#16a34a' : '#111827',
                              }}>
                                {d.day}
                              </strong>
                              {done && (
                                <span style={{ fontSize: '13px', color: '#16a34a' }}>✓</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
                    💡 Dars kunini bosib davomat kiritishingiz mumkin
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIDEO PLAYER MODAL */}
      {(playingVideo || videoPlayerLoading) && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}
          onClick={closeVideoPlayer}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '12px', width: '100%',
              maxWidth: '900px', overflow: 'hidden',
            }}
          >
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 20px', borderBottom: '1px solid #e5e7eb',
            }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>
                {playingVideo?.name || 'Video yuklanmoqda...'}
              </h3>
              <button type="button" onClick={closeVideoPlayer} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <FiX size={22} />
              </button>
            </div>
            <div style={{ background: '#000', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {videoPlayerLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <span style={{ color: '#fff', fontSize: '14px' }}>Video yuklanmoqda...</span>
                </div>
              ) : playingVideo?.blobUrl ? (
                <video
                  key={playingVideo.blobUrl}
                  src={playingVideo.blobUrl}
                  controls
                  autoPlay
                  playsInline
                  style={{ width: '100%', maxHeight: '70vh' }}
                  onError={(e) => {
                    const v = e.currentTarget;
                    const codeMap = {
                      1: 'MEDIA_ERR_ABORTED',
                      2: 'MEDIA_ERR_NETWORK',
                      3: 'MEDIA_ERR_DECODE',
                      4: 'MEDIA_ERR_SRC_NOT_SUPPORTED',
                    };
                    const code = v.error?.code;
                    console.error('[Video player] O\'ynashda xato:', {
                      code,
                      codeName: codeMap[code] || 'UNKNOWN',
                      message: v.error?.message,
                      sourceUrl: playingVideo.sourceUrl,
                      blobSize: playingVideo.blobSize,
                      contentType: playingVideo.contentType,
                      networkState: v.networkState,
                      readyState: v.readyState,
                    });
                    toast.error(
                      `Video o'ynashda xato (${codeMap[code] || 'DECODE'}). ` +
                      `Manba: ${playingVideo.sourceUrl || 'noma\'lum'}. Network tabni tekshiring.`,
                      { duration: 6000 }
                    );
                  }}
                />
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* VIDEO QO'SHISH DRAWER */}
      {/* VIDEO QO'SHISH MODAL */}
      {isVideoDrawerOpen && (
        <div
          onClick={resetVideoForm}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '620px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)', overflow: 'hidden' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #f3f4f6' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Qo&apos;shish</h3>
              <button type="button" onClick={resetVideoForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <FiX size={20} />
              </button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              {/* Drag & Drop zona */}
              <div
                onClick={() => document.getElementById('video-multi-input').click()}
                onDrop={(e) => {
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files);
                  const videoFiles = files.filter(f => f.type.startsWith('video/') || /\.(mp4|webm|mpeg|avi|mkv|m4v|ogm|mov)$/i.test(f.name));
                  if (videoFiles.length > 0) {
                    setVideoForm(prev => ({
                      ...prev,
                      files: [...(prev.files || []), ...videoFiles.map(f => ({ file: f, lesson_id: '', name: f.name }))],
                    }));
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
                style={{ border: '1.5px dashed #d1d5db', borderRadius: '10px', padding: '32px 20px', textAlign: 'center', cursor: 'pointer', background: '#fafafa', marginBottom: '16px' }}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="3" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </div>
                <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#111827', fontSize: '14px' }}>
                  Videofaylni yuklash uchun ushbu hudud ustiga bosing yoki faylni shu yerga olib keling
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
                  Videofayl: .mp4, .webm, .mpeg, .avi, .mkv, .m4v, .ogm, .mov formatlaridan birida bo&apos;lishi kerak
                </p>
                <input
                  id="video-multi-input"
                  type="file"
                  accept="video/*,.mp4,.mov,.avi,.mkv,.webm,.mpeg,.m4v,.ogm"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    setVideoForm(prev => ({
                      ...prev,
                      files: [...(prev.files || []), ...files.map(f => ({ file: f, lesson_id: '', name: f.name }))],
                    }));
                    e.target.value = '';
                  }}
                />
              </div>

              {/* Jadval — tanlangan fayllar */}
              {(videoForm.files || []).length > 0 && (
                <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <th style={{ padding: '8px 10px', textAlign: 'left', color: '#374151', fontWeight: 600 }}>File name</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', color: '#374151', fontWeight: 600 }}>* Dars</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left', color: '#374151', fontWeight: 600 }}>* Video nomi</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center', color: '#374151', fontWeight: 600 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(videoForm.files || []).map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '8px 10px', color: '#6b7280', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.file.name}
                            {/* Progress bar */}
                            {uploadProgress[idx] !== undefined && (
                              <div style={{ marginTop: '4px' }}>
                                {uploadProgress[idx] === -1 ? (
                                  <span style={{ color: '#ef4444', fontSize: '11px' }}>✗ Xato</span>
                                ) : (
                                  <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
                                    <div style={{
                                      height: '100%',
                                      width: `${uploadProgress[idx]}%`,
                                      background: uploadProgress[idx] === 100 ? '#10b981' : '#3b82f6',
                                      transition: 'width 0.2s ease',
                                      borderRadius: '2px',
                                    }} />
                                  </div>
                                )}
                                {uploadProgress[idx] >= 0 && uploadProgress[idx] < 100 && (
                                  <span style={{ fontSize: '10px', color: '#6b7280' }}>{uploadProgress[idx]}%</span>
                                )}
                                {uploadProgress[idx] === 100 && (
                                  <span style={{ fontSize: '11px', color: '#10b981' }}>✓ Yuklandi</span>
                                )}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <select
                              value={item.lesson_id}
                              onChange={(e) => {
                                const updated = [...(videoForm.files || [])];
                                updated[idx] = { ...updated[idx], lesson_id: e.target.value };
                                setVideoForm(prev => ({ ...prev, files: updated }));
                              }}
                              style={{ border: '1px solid #d1d5db', borderRadius: '6px', padding: '5px 8px', fontSize: '12px', background: '#fff', cursor: 'pointer', minWidth: '120px' }}
                            >
                              <option value="">Darsni tanlang</option>
                              {groupLessons.map((lesson) => (
                                <option key={lesson.id} value={lesson.id}>
                                  {lesson.topic || lesson.title || `Dars #${lesson.id}`}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => {
                                const updated = [...(videoForm.files || [])];
                                updated[idx] = { ...updated[idx], name: e.target.value };
                                setVideoForm(prev => ({ ...prev, files: updated }));
                              }}
                              style={{ border: '1px solid #d1d5db', borderRadius: '6px', padding: '5px 8px', fontSize: '12px', width: '100%', boxSizing: 'border-box' }}
                            />
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (videoForm.files || []).filter((_, i) => i !== idx);
                                setVideoForm(prev => ({ ...prev, files: updated }));
                              }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tugmalar */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={resetVideoForm} style={{ padding: '9px 24px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
                  Bekor qilish
                </button>
                <button
                  type="button"
                  disabled={isVideoSubmitting || !(videoForm.files || []).length}
                  onClick={handleVideoUpload}
                  style={{ padding: '9px 24px', borderRadius: '8px', border: 'none', background: isVideoSubmitting || !(videoForm.files || []).length ? '#d1d5db' : '#10b981', fontSize: '14px', fontWeight: 600, cursor: isVideoSubmitting || !(videoForm.files || []).length ? 'not-allowed' : 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {isVideoSubmitting ? (
                    <><div style={{ width: '15px', height: '15px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />Yuklanmoqda...</>
                  ) : 'Fayllarni yuklash'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GroupDetails;
