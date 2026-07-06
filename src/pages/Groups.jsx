import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaUserGraduate, FaSyncAlt } from 'react-icons/fa';
import { FiMoreVertical, FiX, FiSearch, FiRefreshCw, FiCalendar, FiClock, FiPower, FiEdit2, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { groupsAPI, teachersAPI, coursesAPI, roomsAPI, studentsAPI, studentGroupAPI } from '../api/api';
import { AppContext } from '../context/AppContext';
import { useConfirm } from '../components/ConfirmProvider';
import {
  Box, Card, CardContent, Typography, Chip, Avatar, Grid,
  Tooltip, IconButton, LinearProgress
} from '@mui/material';
import {
  School, Groups as GroupsIcon, AccessTime, MeetingRoom,
  Person, Archive, CalendarMonth
} from '@mui/icons-material';

const WEEK_DAYS = [
  { label: 'Du', fullLabel: 'Dushanba', value: 'MONDAY' },
  { label: 'Se', fullLabel: 'Seshanba', value: 'TUESDAY' },
  { label: 'Chor', fullLabel: 'Chorshanba', value: 'WEDNESDAY' },
  { label: 'Pay', fullLabel: 'Payshanba', value: 'THURSDAY' },
  { label: 'Ju', fullLabel: 'Juma', value: 'FRIDAY' },
  { label: 'Sha', fullLabel: 'Shanba', value: 'SATURDAY' },
  { label: 'Ya', fullLabel: 'Yakshanba', value: 'SUNDAY' },
];

const emptyForm = {
  name: '',
  description: '',
  course_id: '',
  teachers: [],
  room_id: '',
  start_date: '',
  week_day: [],
  start_time: '',
  max_student: '',
};

const Groups = () => {
  const { t } = useContext(AppContext);
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);

  // ✅ Talabalar
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedGroupName, setSelectedGroupName] = useState('');
  const [allStudents, setAllStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  // Yangi guruh qo'shishda oldindan tanlangan talabalar
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isStudentPickerOpen, setIsStudentPickerOpen] = useState(false);
  const [studentPickerSearch, setStudentPickerSearch] = useState('');
  const [studentsLoading, setStudentsLoading] = useState(false);

  const [searchName, setSearchName] = useState('');
  const [searchMax, setSearchMax] = useState('');
  
  // ✅ Tab state - 0: Faol {t.groupsTab}, 1: Arxiv
  const [activeTab, setActiveTab] = useState(0);

  const [form, setForm] = useState(emptyForm);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const confirm = useConfirm();

  // ============================================
  // 📡 {t.groupsTab} RO'YXATI — GET /groups/all yoki /groups/archive
  // ============================================
  const fetchGroups = async (name = '', max = '', isArchive = false) => {
    setIsLoading(true);
    try {
      console.log('📡 {t.groupsTab} so\'rovi boshlandi:', { isArchive });
      console.log('📝 Parametrlar:', { name, max });
      
      let res;
      if (isArchive) {
        // ✅ Arxiv {t.groupsTab}
        res = await groupsAPI.getArchive();
      } else {
        // ✅ Faol {t.groupsTab}
        res = await groupsAPI.getAll(name || undefined, max ? Number(max) : undefined);
      }
      
      console.log('✅ Server javobi:', res.data);
      
      const data = res.data?.data || res.data || [];
      console.log('📋 Qayta ishlangan ma\'lumotlar:', data.length, 'ta guruh');
      
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('❌ Xato yuz berdi:', err);
      toast.error(err.response?.data?.message || '{t.groupsTab}ni yuklashda xato!');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // 📡 DROPDOWN MA'LUMOTLAR
  // ============================================
  const fetchDropdowns = async () => {
    try {
      const [tRes, cRes, rRes] = await Promise.allSettled([
        teachersAPI.getAll(),
        coursesAPI.getAll(),
        roomsAPI.getAll(),
      ]);
      if (tRes.status === 'fulfilled') {
        const d = tRes.value.data?.data || tRes.value.data || [];
        setTeachers(Array.isArray(d) ? d : []);
      }
      if (cRes.status === 'fulfilled') {
        const d = cRes.value.data?.data || cRes.value.data || [];
        setCourses(Array.isArray(d) ? d : []);
      }
      if (rRes.status === 'fulfilled') {
        const d = rRes.value.data?.data || rRes.value.data || [];
        setRooms(Array.isArray(d) ? d : []);
      }
    } catch (err) {
      console.error('Dropdown xato:', err);
    }
  };

  useEffect(() => {
    fetchGroups('', '', activeTab === 1); // ✅ activeTab 1 bo'lsa arxiv
    fetchDropdowns();
  }, [activeTab]); // ✅ Tab o'zgarganda qayta yuklash

  // ============================================
  // 🔄 Tab o'zgartirish
  // ============================================
  const handleTabChange = (tabIndex) => {
    setActiveTab(tabIndex);
    setSearchName('');
    setSearchMax('');
  };

  // ============================================
  // 🔍 QIDIRUV
  // ============================================
  const handleSearch = (e) => {
    e.preventDefault();
    fetchGroups(searchName, searchMax, activeTab === 1);
  };

  // ============================================
  // ➕ GURUH QO'SHISH — POST /groups (JSON)
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.course_id || !form.room_id || !form.start_date || !form.start_time || !form.max_student) {
      toast.error(t.fillRequiredFields);
      return;
    }
    if (form.week_day.length === 0) {
      toast.error(t.selectLessonDay);
      return;
    }
    if (form.teachers.length === 0) {
      toast.error(t.selectTeacher);
      return;
    }

    const body = {
      name: form.name.trim(),
      description: form.description.trim() || form.name.trim(),
      course_id: Number(form.course_id),
      teachers: form.teachers.map(Number),
      students: [],
      room_id: Number(form.room_id),
      start_date: form.start_date,
      week_day: form.week_day,
      start_time: form.start_time,
      max_student: Number(form.max_student),
    };

    console.log('Yuborilayotgan body:', body);

    setIsSubmitting(true);
    try {
      if (editingGroupId) {
        await groupsAPI.update(editingGroupId, body);
        // Tanlangan talabalarni qo'shish
        if (selectedStudents.length > 0) {
          await Promise.allSettled(
            selectedStudents.map(s => studentGroupAPI.create({ student_id: s.id, group_id: editingGroupId }))
          );
        }
        toast.success(t.groupUpdated);
      } else {
        const res = await groupsAPI.create(body);
        const newGroupId = res.data?.data?.id || res.data?.id;
        // Tanlangan talabalarni yangi guruhga qo'shish
        if (newGroupId && selectedStudents.length > 0) {
          await Promise.allSettled(
            selectedStudents.map(s => studentGroupAPI.create({ student_id: s.id, group_id: newGroupId }))
          );
        }
        toast.success(t.groupAdded);
      }
      resetForm();
      // Biroz kechikib yangilaymiz — backend indekslanishi uchun
      setTimeout(() => fetchGroups(searchName, searchMax, activeTab === 1), 300);
      await fetchGroups(searchName, searchMax, activeTab === 1);
    } catch (err) {
      const errData = err.response?.data;
      console.log('Xato:', errData);
      if (errData?.message && Array.isArray(errData.message)) {
        errData.message.forEach((m) => toast.error(m, { duration: 6000 }));
      } else {
        toast.error(errData?.message || errData?.error || t.errorOccurred, { duration: 6000 });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    const ok = await confirm();
    if (!ok) return;
    try {
      await groupsAPI.delete(id);
      toast.success(t.groupDeleted);
      fetchGroups(searchName, searchMax, activeTab === 1);
    } catch (err) {
      const errData = err.response?.data;
      toast.error(errData?.message || t.deleteGroupError);
    }
  };

  // ============================================
  // 🔄 GURUH STATUSINI O'ZGARTIRISH (FAOL / NO FAOL)
  // ============================================
  const handleToggleStatus = async (e, group) => {
    e.stopPropagation();
    try {
      const newStatus = group.is_active === false ? true : false;
      await groupsAPI.update(group.id, { is_active: newStatus });
      toast.success(newStatus ? t.groupActivated : t.groupDeactivated);
      fetchGroups(searchName, searchMax, activeTab === 1);
    } catch (err) {
      toast.error(err.response?.data?.message || t.statusChangeError);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingGroupId(null);
    setIsModalOpen(false);
    setSelectedStudents([]);
    setIsStudentPickerOpen(false);
    setStudentPickerSearch('');
  };

  // ============================================
  // 👨‍🎓 GURUHGA TALABA QO'SHISH (mavjud guruh uchun)
  // ============================================
  const openStudentModal = async (e, group) => {
    e.stopPropagation();
    setSelectedGroupId(group.id);
    setSelectedGroupName(group.name);
    setStudentSearch('');
    setIsStudentModalOpen(true);
    try {
      const res = await studentsAPI.getAll();
      const data = res.data?.data || res.data || [];
      setAllStudents(Array.isArray(data) ? data : []);
    } catch {
      toast.error(t.studentsLoadError);
    }
  };

  // Talabalar picker uchun (yangi guruh + mavjud guruh)
  const openStudentPicker = async () => {
    setIsStudentPickerOpen(true);
    setStudentPickerSearch('');
    setStudentsLoading(true);
    try {
      const res = await studentsAPI.getAll();
      const raw = res.data?.data || res.data || [];
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.items)
          ? raw.items
          : Array.isArray(raw?.students)
            ? raw.students
            : [];
      setAllStudents(list);
    } catch {
      toast.error(t.studentsLoadError);
    } finally {
      setStudentsLoading(false);
    }
  };

  const toggleStudentSelection = (student) => {
    setSelectedStudents(prev => {
      const exists = prev.find(s => s.id === student.id);
      if (exists) return prev.filter(s => s.id !== student.id);
      return [...prev, student];
    });
  };

  const handleAddStudentToGroup = async (student) => {
    setIsAddingStudent(true);
    try {
      await studentGroupAPI.create({ student_id: student.id, group_id: selectedGroupId });
      toast.success(`${student.first_name} ${student.last_name} ${t.studentAddedToGroup}`);
    } catch (err) {
      toast.error(err.response?.data?.message || t.addToGroupError);
    } finally {
      setIsAddingStudent(false);
    }
  };

  // ============================================
  // ✏️ GURUHNI TAHRIRLASH
  // ============================================
  const handleEditGroup = (e, group) => {
    e.stopPropagation();
    
    // Ustozlarni formatlash (agar object bo'lsa id sini olamiz)
    const formattedTeachers = Array.isArray(group.teachers) 
      ? group.teachers.map(t => typeof t === 'object' ? t.id : t) 
      : [];
      
    setForm({
      name: group.name || '',
      description: group.description || '',
      course_id: group.course_id || group.course?.id || '',
      teachers: formattedTeachers,
      room_id: group.room_id || group.room?.id || '',
      start_date: group.start_date ? group.start_date.slice(0, 10) : '',
      week_day: Array.isArray(group.week_day) ? group.week_day : [],
      start_time: group.start_time || '',
      max_student: group.max_student || '',
    });
    setEditingGroupId(group.id);
    setSelectedStudents([]);
    setIsModalOpen(true);
  };

  const toggleWeekDay = (day) => {
    setForm((prev) => ({
      ...prev,
      week_day: prev.week_day.includes(day)
        ? prev.week_day.filter((d) => d !== day)
        : [...prev.week_day, day],
    }));
  };

  const toggleTeacher = (id) => {
    const numId = Number(id);
    setForm((prev) => ({
      ...prev,
      teachers: prev.teachers.includes(numId)
        ? prev.teachers.filter((t) => t !== numId)
        : [...prev.teachers, numId],
    }));
  };

  const getTeacherName = (t) =>
    t.full_name || `${t.first_name || ''} ${t.last_name || ''}`.trim() || '—';

  const totalStudents = groups.reduce((sum, g) => sum + (g.max_student || g.students?.length || 0), 0);

  // 🔍 Debug: Render paytida state ni tekshirish
  console.log('🎨 Render: groups state:', groups);
  console.log('🎨 Render: groups.length:', groups.length);

  return (
    <div className="page-container">

      {/* HEADER */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">{t.groupsTitle}</h1>
          <p className="page-subtitle" style={{ marginTop: '4px' }}>
            {t.groupsSubtitle}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => fetchGroups(searchName, searchMax, activeTab === 1)} className="toolbar-btn" title={t.refreshGroups}>
            <FiRefreshCw size={16} />
          </button>
          {activeTab === 0 && (
            <button onClick={() => { setSelectedStudents([]); setForm(emptyForm); setEditingGroupId(null); setIsModalOpen(true); }} className="add-btn">
              {t.addGroup}
            </button>
          )}
        </div>
      </div>

      {/* ===== TAB NAVIGATION ===== */}
      <div style={{
        display: 'flex',
        gap: '10px',
        borderBottom: '2px solid #e5e7eb',
        marginBottom: '24px',
        alignItems: 'center',
        paddingBottom: '12px',
      }}>
        <button
          onClick={() => handleTabChange(0)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '8px 18px',
            background: activeTab === 0 ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : '#f3f0ff',
            border: 'none',
            borderRadius: '20px',
            color: activeTab === 0 ? '#fff' : '#7c3aed',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: activeTab === 0 ? '0 4px 12px rgba(124,58,237,0.35)' : 'none',
          }}
        >
          �️ {t.groupsTab}
        </button>
        <button
          onClick={() => handleTabChange(1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '8px 18px',
            background: activeTab === 1 ? 'linear-gradient(135deg, #f59e0b, #fbbf24)' : '#fef9ee',
            border: 'none',
            borderRadius: '20px',
            color: activeTab === 1 ? '#fff' : '#d97706',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: activeTab === 1 ? '0 4px 12px rgba(245,158,11,0.35)' : 'none',
          }}
        >
          📦 {t.archive}
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="group-stat-card" style={{ position: 'relative' }}>
          <div style={{ color: '#7c3aed', marginBottom: '8px' }}><FaUsers size={20} /></div>
          <p className="stat-title" style={{ textAlign: 'left' }}>{t.groupsCount}</p>
          <h3 className="stat-value">{groups.length}</h3>
          <button style={{ position: 'absolute', top: '16px', right: '16px', color: '#9ca3af' }}><FiMoreVertical /></button>
        </div>
        <div className="group-stat-card" style={{ position: 'relative' }}>
          <div style={{ color: '#7c3aed', marginBottom: '8px' }}><FaUsers size={20} /></div>
          <p className="stat-title" style={{ textAlign: 'left' }}>{t.teachers}</p>
          <h3 className="stat-value">{teachers.length}</h3>
          <button style={{ position: 'absolute', top: '16px', right: '16px', color: '#9ca3af' }}><FiMoreVertical /></button>
        </div>
        <div className="group-stat-card" style={{ position: 'relative' }}>
          <div style={{ color: '#7c3aed', marginBottom: '8px' }}><FaUserGraduate size={20} /></div>
          <p className="stat-title" style={{ textAlign: 'left' }}>{t.maxStudents}</p>
          <h3 className="stat-value">{totalStudents}</h3>
          <button style={{ position: 'absolute', top: '16px', right: '16px', color: '#9ca3af' }}><FiMoreVertical /></button>
        </div>
      </div>

      {/* QIDIRUV */}
      {activeTab === 0 && (
        <div className="content-card" style={{ marginBottom: '16px', padding: '16px 24px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="search-container" style={{ flex: 1, minWidth: '200px' }}>
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder={t.groupsTitle}
                className="search-input"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>
            <input
              type="number"
              placeholder={t.maxStudents}
              className="form-input"
              style={{ width: '180px', margin: 0 }}
              value={searchMax}
              onChange={(e) => setSearchMax(e.target.value)}
            />
            <button type="submit" className="add-btn" style={{ whiteSpace: 'nowrap' }}>
              <FiSearch size={14} /> {t.search}
            </button>
            {(searchName || searchMax) && (
              <button type="button" className="toolbar-btn" onClick={() => { setSearchName(''); setSearchMax(''); fetchGroups('', '', false); }}>
                <FiX size={14} /> {t.cancel}
              </button>
            )}
          </form>
        </div>
      )}

      {/* JADVAL */}
      {activeTab === 0 ? (
      <div className="content-card">
        <div style={{ overflowX: 'auto' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
              <div style={{
                width: '36px', height: '36px',
                border: '3px solid #e5e7eb', borderTopColor: '#7c3aed',
                borderRadius: '50%', animation: 'spin 1s linear infinite',
                margin: '0 auto 12px',
              }} />
              {t.loading}
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '24px', width: '120px' }}>{t.status}</th>
                  <th>{t.groupName}</th>
                  <th>{t.course}</th>
                  <th>{t.startDate}</th>
                  <th>{t.time}</th>
                  <th>{t.room}</th>
                  <th>{t.teacher}</th>
                  <th>{t.maxStudents}</th>
                  <th style={{ textAlign: 'right', paddingRight: '24px' }}>
                    <FaSyncAlt
                      style={{ cursor: 'pointer' }}
                      onClick={() => fetchGroups(searchName, searchMax)}
                      title={t.refresh}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {groups.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                      <FaUsers size={32} style={{ marginBottom: '8px', opacity: 0.4 }} />
                      <div>{t.noGroups}</div>
                    </td>
                  </tr>
                ) : (
                  groups.map((group) => {
                    const isInactive = activeTab === 1 || group.is_active === false;
                    return (
                    <tr
                      key={group.id}
                      onClick={() => {
                        if (!isInactive) {
                          navigate(`/groups/${group.id}`);
                        }
                      }}
                      style={{
                        cursor: isInactive ? 'not-allowed' : 'pointer',
                        opacity: isInactive ? 0.6 : 1,
                      }}
                    >
                      <td style={{ paddingLeft: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div 
                            onClick={(e) => handleToggleStatus(e, group)}
                            style={{
                              width: '36px',
                              height: '20px',
                              backgroundColor: (activeTab === 1 || group.is_active === false) ? '#e5e7eb' : '#22c55e',
                              borderRadius: '20px',
                              position: 'relative',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s',
                              flexShrink: 0
                            }}
                          >
                            <div style={{
                              width: '16px',
                              height: '16px',
                              backgroundColor: '#fff',
                              borderRadius: '50%',
                              position: 'absolute',
                              top: '2px',
                              left: (activeTab === 1 || group.is_active === false) ? '2px' : '18px',
                              transition: 'left 0.2s',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }} />
                          </div>
                          <span style={{
                            padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600',
                            backgroundColor: (activeTab === 1 || group.is_active === false) ? '#fee2e2' : '#f0fdf4',
                            color: (activeTab === 1 || group.is_active === false) ? '#991b1b' : '#059669',
                          }}>
                            {(activeTab === 1 || group.is_active === false) ? t.inactive : t.active}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontWeight: '600' }}>{group.name || '—'}</td>
                      <td>
                        <span className="badge-course">
                          {group.course?.name || group.course_name || '—'}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px' }}>
                        {group.start_date ? group.start_date.slice(0, 10) : '—'}
                      </td>
                      <td>
                        <div style={{ fontWeight: '600' }}>{group.start_time || '—'}</div>
                        <div style={{ fontSize: '10px', color: '#6b7280' }}>
                          {Array.isArray(group.week_day)
                            ? group.week_day.map(d => WEEK_DAYS.find(w => w.value === d)?.label || d).join(', ')
                            : '—'}
                        </div>
                      </td>
                      <td>{group.room?.name || group.room_name || '—'}</td>
                      <td>
                        {Array.isArray(group.teachers) && group.teachers.length > 0
                          ? getTeacherName(group.teachers[0])
                          : group.teacher_name || '—'}
                      </td>
                      <td>{group.max_student ?? '—'}</td>
                      <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                        <button
                          style={{ 
                            color: '#3b82f6',
                            marginRight: '12px',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer'
                          }}
                          title={t.edit}
                          onClick={(e) => handleEditGroup(e, group)}
                        >
                          <FiEdit2 size={16} />
                        </button>

                        <button
                          style={{ 
                            color: '#ef4444',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer'
                          }}
                          title={t.deleteGroup}
                          onClick={(e) => handleDelete(e, group.id)}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      ) : (
        /* ===== ARXIV {t.groupsTab} — JADVAL ===== */
        <div className="content-card">
          <div style={{ overflowX: 'auto' }}>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
                <div style={{
                  width: '36px', height: '36px',
                  border: '3px solid #e5e7eb', borderTopColor: '#7c3aed',
                  borderRadius: '50%', animation: 'spin 1s linear infinite',
                  margin: '0 auto 12px',
                }} />
                {t.loading}
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: '24px', width: '120px' }}>{t.status}</th>
                    <th>{t.groupName}</th>
                    <th>{t.course}</th>
                    <th>{t.startDate}</th>
                    <th>{t.time}</th>
                    <th>{t.room}</th>
                    <th>{t.teacher}</th>
                    <th>{t.maxStudents}</th>
                    <th style={{ textAlign: 'right', paddingRight: '24px' }}>
                      <FaSyncAlt style={{ cursor: 'pointer' }} onClick={() => fetchGroups('', '', true)} title={t.refresh} />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {groups.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                        <FaUsers size={32} style={{ marginBottom: '8px', opacity: 0.4 }} />
                        <div>{t.noArchive}</div>
                      </td>
                    </tr>
                  ) : (
                    groups.map((group) => (
                      <tr key={group.id} style={{ cursor: 'not-allowed', opacity: 0.75 }}>
                        <td style={{ paddingLeft: '24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '36px', height: '20px',
                              backgroundColor: '#e5e7eb',
                              borderRadius: '20px', position: 'relative',
                              flexShrink: 0,
                            }}>
                              <div style={{
                                width: '16px', height: '16px', backgroundColor: '#fff',
                                borderRadius: '50%', position: 'absolute', top: '2px', left: '2px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                              }} />
                            </div>
                            <span style={{
                              padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600',
                              backgroundColor: '#fee2e2', color: '#991b1b',
                            }}>
                              {t.inactive}
                            </span>
                          </div>
                        </td>
                        <td style={{ fontWeight: '600', color: '#6b7280' }}>{group.name || '—'}</td>
                        <td>
                          <span className="badge-course">
                            {group.course?.name || group.course_name || '—'}
                          </span>
                        </td>
                        <td style={{ fontSize: '13px', color: '#6b7280' }}>
                          {group.start_date ? group.start_date.slice(0, 10) : '—'}
                        </td>
                        <td>
                          <div style={{ fontWeight: '600', color: '#6b7280' }}>{group.start_time || '—'}</div>
                          <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                            {Array.isArray(group.week_day)
                              ? group.week_day.map(d => WEEK_DAYS.find(w => w.value === d)?.label || d).join(', ')
                              : '—'}
                          </div>
                        </td>
                        <td style={{ color: '#6b7280' }}>{group.room?.name || group.room_name || '—'}</td>
                        <td style={{ color: '#6b7280' }}>
                          {Array.isArray(group.teachers) && group.teachers.length > 0
                            ? getTeacherName(group.teachers[0])
                            : group.teacher_name || '—'}
                        </td>
                        <td style={{ color: '#6b7280' }}>{group.max_student ?? '—'}</td>
                        <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                          <button
                            style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}
                            title={t.deleteGroup}
                            onClick={(e) => handleDelete(e, group.id)}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ===== MODAL — TALABALAR PICKER (drawer ichida tanlash) ===== */}
      {isStudentPickerOpen && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}
          onClick={() => setIsStudentPickerOpen(false)}
        >
          <div style={{
            background: '#fff', borderRadius: '16px',
            width: '100%', maxWidth: '480px',
            maxHeight: '75vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: '20px 24px 12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#111827' }}>
                  Talaba qo&apos;shish
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#9ca3af' }}>
                  Bitta yoki nechta talabani tanlang
                </p>
              </div>
              <button onClick={() => setIsStudentPickerOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '20px', marginTop: '-2px' }}>
                <FiX />
              </button>
            </div>

            {/* Search */}
            <div style={{ padding: '0 24px 12px' }}>
              <input
                type="text"
                placeholder="Talaba qidirish..."
                value={studentPickerSearch}
                onChange={(e) => setStudentPickerSearch(e.target.value)}
                style={{
                  width: '100%', padding: '9px 14px',
                  border: '1.5px solid #e5e7eb', borderRadius: '10px',
                  fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                  color: '#374151',
                }}
              />
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 8px' }}>
              {studentsLoading ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
                  <div style={{
                    width: 32, height: 32,
                    border: '3px solid #e5e7eb', borderTopColor: '#7c3aed',
                    borderRadius: '50%', animation: 'spin 1s linear infinite',
                    margin: '0 auto 10px',
                  }} />
                  <p style={{ margin: 0, fontSize: '13px' }}>Yuklanmoqda...</p>
                </div>
              ) : allStudents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
                  <FaUserGraduate size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <p>Talabalar topilmadi</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {allStudents
                    .filter(s => {
                      const name = (
                        s.full_name ||
                        `${s.first_name || ''} ${s.last_name || ''}` ||
                        s.name || ''
                      ).toLowerCase();
                      return name.includes(studentPickerSearch.toLowerCase());
                    })
                    .map(student => {
                      const isChecked = selectedStudents.some(s => s.id === student.id);
                      const fullName = student.full_name
                        || `${student.first_name || ''} ${student.last_name || ''}`.trim()
                        || student.name
                        || 'Nomaʼlum';
                      const initial = fullName.charAt(0).toUpperCase();
                      return (
                        <label
                          key={student.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '10px 14px', borderRadius: '10px',
                            cursor: 'pointer',
                            background: isChecked ? '#f5f3ff' : 'transparent',
                            transition: 'background 0.12s',
                          }}
                          onMouseEnter={(e) => { if (!isChecked) e.currentTarget.style.background = '#f9fafb'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = isChecked ? '#f5f3ff' : 'transparent'; }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleStudentSelection(student)}
                            style={{ width: 17, height: 17, accentColor: '#7c3aed', cursor: 'pointer', flexShrink: 0 }}
                          />
                          {/* Avatar */}
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: isChecked
                              ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
                              : '#ede9fe',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: isChecked ? '#fff' : '#7c3aed',
                            fontWeight: 700, fontSize: '13px', flexShrink: 0,
                            overflow: 'hidden',
                          }}>
                            {(() => {
                              const photoUrl = student.photo || student.image || student.avatar || student.profile_photo;
                              if (photoUrl) {
                                const src = photoUrl.startsWith('http')
                                  ? photoUrl
                                  : `https://najot-edu.softwareengineer.uz/files/${photoUrl.split('/').pop()}`;
                                return (
                                  <img
                                    src={src}
                                    alt={fullName}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerText = initial; }}
                                  />
                                );
                              }
                              return initial;
                            })()}
                          </div>
                          {/* Ism */}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', color: '#111827', fontWeight: isChecked ? 600 : 500 }}>
                              {fullName}
                            </div>
                            {student.phone && (
                              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: 1 }}>
                                {student.phone}
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid #f3f4f6',
              display: 'flex', gap: '10px', justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => setIsStudentPickerOpen(false)}
                style={{
                  padding: '9px 22px', borderRadius: '10px',
                  border: '1.5px solid #e5e7eb', background: '#fff',
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer', color: '#374151',
                }}
              >
                Bekor qilish
              </button>
              <button
                onClick={() => setIsStudentPickerOpen(false)}
                style={{
                  padding: '9px 28px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  border: 'none', fontSize: '14px', fontWeight: 600,
                  cursor: 'pointer', color: '#fff',
                  boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
                }}
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL — TALABALARNI QO'SHISH ===== */}
      {isStudentModalOpen && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setIsStudentModalOpen(false)}
        >
          <div
            style={{
              background: '#fff', borderRadius: '16px',
              maxWidth: '520px', width: '100%',
              maxHeight: '85vh', display: 'flex', flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid #e5e7eb',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#111827' }}>
                  Talaba qo'shish
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6b7280' }}>
                  {selectedGroupName} guruhiga
                </p>
              </div>
              <button onClick={() => setIsStudentModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '24px', display: 'flex' }}>
                <FiX />
              </button>
            </div>

            {/* Search */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ position: 'relative' }}>
                <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="text"
                  placeholder="Talaba ismi bo'yicha qidirish..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px 10px 36px',
                    border: '1.5px solid #e5e7eb', borderRadius: '10px',
                    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Students list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px' }}>
              {allStudents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                  <FaUserGraduate size={40} style={{ opacity: 0.3, marginBottom: 10 }} />
                  <p>Talabalar topilmadi</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {allStudents
                    .filter((s) => {
                      const fullName = `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
                      return fullName.includes(studentSearch.toLowerCase());
                    })
                    .map((student) => (
                      <div key={student.id} style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px 16px', border: '1.5px solid #e5e7eb',
                        borderRadius: '12px', background: '#fafafa',
                        transition: 'all 0.15s',
                      }}>
                        {/* Avatar */}
                        <div style={{
                          width: 40, height: 40, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontWeight: 700, fontSize: '14px', flexShrink: 0,
                        }}>
                          {student.first_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        {/* Info */}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>
                            {student.first_name} {student.last_name}
                          </div>
                          {student.phone && (
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>📞 {student.phone}</div>
                          )}
                        </div>
                        {/* Add button */}
                        <button
                          disabled={isAddingStudent}
                          onClick={() => handleAddStudentToGroup(student)}
                          style={{
                            padding: '7px 16px', borderRadius: '20px',
                            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                            color: '#fff', border: 'none', cursor: 'pointer',
                            fontSize: '13px', fontWeight: 600,
                            opacity: isAddingStudent ? 0.6 : 1,
                            transition: 'all 0.2s',
                          }}
                        >
                          + Qo'shish
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px', borderTop: '1px solid #e5e7eb',
              display: 'flex', justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => setIsStudentModalOpen(false)}
                style={{
                  padding: '10px 24px', borderRadius: '10px',
                  background: '#f3f4f6', border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: '14px', color: '#374151',
                }}
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DRAWER — GURUH QO'SHISH ===== */}
      <div
        className={`right-drawer-overlay ${isModalOpen ? 'open' : ''}`}
        onClick={resetForm}
      >
        <div
          className={`right-drawer ${isModalOpen ? 'open' : ''}`}
          onClick={(e) => e.stopPropagation()}
          style={{ width: '440px', maxWidth: '100%' }}
        >
          <div className="drawer-header">
            <h2 className="drawer-title">{editingGroupId ? "Guruhni {t.edit}" : "Guruh qo'shish"}</h2>
            <button className="drawer-close" onClick={resetForm}><FiX /></button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>

            {/* Guruh nomi */}
            <div className="form-group">
              <label className="form-label">Guruh nomi <span style={{ color: 'red' }}>*</span></label>
              <input type="text" required placeholder="N-107" className="form-input"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>

            {/* Tavsif */}
            <div className="form-group">
              <label className="form-label">Tavsif</label>
              <input type="text" placeholder="Guruh haqida qisqacha..." className="form-input"
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            {/* Kurs */}
            <div className="form-group">
              <label className="form-label">Kurs <span style={{ color: 'red' }}>*</span></label>
              <select required className="form-input"
                value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })}>
                <option value="">— Kurs tanlang —</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* O'qituvchilar (button + modal) */}
            <div className="form-group">
              <label className="form-label">O'qituvchilar <span style={{ color: 'red' }}>*</span></label>
              
              {/* Tanlangan o'qituvchilar soni */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '8px',
              }}>
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(true)}
                  className="form-input"
                  style={{
                    flex: 1,
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: '#f9fafb',
                    border: '1px solid #d1d5db',
                  }}
                >
                  <span style={{ color: form.teachers.length > 0 ? '#111827' : '#9ca3af' }}>
                    {form.teachers.length > 0
                      ? `${form.teachers.length} ta o'qituvchi tanlandi`
                      : "O'qituvchilarni tanlang"}
                  </span>
                  <span style={{ fontSize: '12px', color: '#7c3aed', fontWeight: '600' }}>
                    Tanlash ›
                  </span>
                </button>
              </div>
              
              {/* Tanlangan o'qituvchilar ro'yxati (badges) */}
              {form.teachers.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  marginTop: '8px',
                }}>
                  {form.teachers.map((tid) => {
                    const teacher = teachers.find(t => Number(t.id) === Number(tid));
                    if (!teacher) return null;
                    return (
                      <span
                        key={tid}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          background: '#ede9fe',
                          color: '#7c3aed',
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        {getTeacherName(teacher)}
                        <button
                          type="button"
                          onClick={() => toggleTeacher(tid)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#7c3aed',
                            fontSize: '14px',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Talabalar tanlash — O'qituvchilardan keyin */}
            <div className="form-group">
              <label className="form-label">Talabalar</label>
              <button
                type="button"
                onClick={openStudentPicker}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 16px',
                  background: '#f5f3ff',
                  color: '#7c3aed',
                  border: '1.5px dashed #a78bfa',
                  borderRadius: '10px',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  marginBottom: selectedStudents.length > 0 ? '10px' : '0',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FaUserGraduate size={15} />
                  Talabalarni tanlash
                </span>
                <span style={{
                  background: '#7c3aed', color: '#fff',
                  borderRadius: '20px', padding: '2px 10px',
                  fontSize: '12px', fontWeight: 700,
                }}>
                  {selectedStudents.length} ta
                </span>
              </button>

              {/* Tanlangan talabalar badges */}
              {selectedStudents.length > 0 && (
                <div style={{
                  border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden',
                }}>
                  {selectedStudents.map((s, i) => {
                    const fullName = s.full_name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Nomaʼlum';
                    const photo = s.photo || s.image || s.avatar;
                    const photoUrl = photo ? (photo.startsWith('http') ? photo : `https://najot-edu.softwareengineer.uz/files/${photo.split('/').pop()}`) : null;
                    return (
                      <div key={s.id} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '9px 14px',
                        background: i % 2 === 0 ? '#faf5ff' : '#fff',
                        borderBottom: i < selectedStudents.length - 1 ? '1px solid #f3f4f6' : 'none',
                      }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontWeight: 700, fontSize: '12px', flexShrink: 0,
                          overflow: 'hidden',
                        }}>
                          {photoUrl
                            ? <img src={photoUrl} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : fullName.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: '#111827' }}>{fullName}</span>
                        <button type="button" onClick={() => toggleStudentSelection(s)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex' }}>
                          <FiX size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Xona */}
            <div className="form-group">
              <label className="form-label">Xona <span style={{ color: 'red' }}>*</span></label>
              <select required className="form-input"
                value={form.room_id} onChange={(e) => setForm({ ...form, room_id: e.target.value })}>
                <option value="">— Xona tanlang —</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} (max: {r.capacity})</option>
                ))}
              </select>
            </div>

            {/* Boshlanish sanasi */}
            <div className="form-group">
              <label className="form-label"><FiCalendar size={13} style={{ marginRight: 4 }} />Boshlanish sanasi <span style={{ color: 'red' }}>*</span></label>
              <input type="date" required className="form-input"
                value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>

            {/* Dars vaqti */}
            <div className="form-group">
              <label className="form-label"><FiClock size={13} style={{ marginRight: 4 }} />Dars vaqti <span style={{ color: 'red' }}>*</span></label>
              <input type="time" required className="form-input"
                value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            </div>

            {/* Dars kunlari */}
            <div className="form-group">
              <label className="form-label">Dars kunlari <span style={{ color: 'red' }}>*</span></label>
              <div className="lesson-days-grid">
                {WEEK_DAYS.map((d) => {
                  const isSelected = form.week_day.includes(d.value);
                  return (
                    <label
                      key={d.value}
                      className={`lesson-day-item${isSelected ? ' selected' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleWeekDay(d.value)}
                        className="lesson-day-input"
                      />
                      <span className="lesson-day-checkbox" aria-hidden="true">
                        {isSelected && <FiCheck size={13} strokeWidth={3} />}
                      </span>
                      <span className="lesson-day-label">{d.fullLabel}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Max talabalar */}
            <div className="form-group">
              <label className="form-label">Max talabalar soni <span style={{ color: 'red' }}>*</span></label>
              <input type="number" required min="1" max="100" placeholder="20" className="form-input"
                value={form.max_student} onChange={(e) => setForm({ ...form, max_student: e.target.value })} />
            </div>

            <div style={{
              display: 'flex', justifyContent: 'space-between',
              marginTop: 'auto', paddingTop: '20px',
              borderTop: '1px solid #f3f4f6',
            }}>
              <button type="button" onClick={resetForm} className="btn-secondary" style={{ width: '48%' }}>
                Bekor qilish
              </button>
              <button type="submit" disabled={isSubmitting} className="btn-primary"
                style={{ width: '48%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {isSubmitting ? (
                  <>
                    <div style={{
                      width: '16px', height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white', borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }} />
                    Saqlanmoqda...
                  </>
                ) : (editingGroupId ? 'Yangilash' : 'Saqlash')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ===== MODAL — O'QITUVCHILARNI TANLASH ===== */}
      {isTeacherModalOpen && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setIsTeacherModalOpen(false)}
        >
          <div
            style={{
              background: '#fff', borderRadius: '16px',
              width: '100%', maxWidth: '480px',
              maxHeight: '75vh', display: 'flex', flexDirection: 'column',
              boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: '20px 24px 12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#111827' }}>
                  O&apos;qituvchi qo&apos;shish
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#9ca3af' }}>
                  Bitta yoki nechta o&apos;qituvchini tanlang
                </p>
              </div>
              <button onClick={() => setIsTeacherModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '20px', marginTop: '-2px' }}>
                <FiX />
              </button>
            </div>

            {/* Search */}
            <div style={{ padding: '0 24px 12px' }}>
              <input
                type="text"
                placeholder="O'qituvchi qidirish..."
                id="teacher-search-input"
                onChange={(e) => {
                  const val = e.target.value.toLowerCase();
                  document.querySelectorAll('[data-teacher-item]').forEach(el => {
                    el.style.display = el.dataset.name.toLowerCase().includes(val) ? '' : 'none';
                  });
                }}
                style={{
                  width: '100%', padding: '9px 14px',
                  border: '1.5px solid #e5e7eb', borderRadius: '10px',
                  fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                  color: '#374151',
                }}
              />
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 8px' }}>
              {teachers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
                  <FaUserGraduate size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <p>O&apos;qituvchilar topilmadi</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {teachers.map((teacher) => {
                    const isChecked = form.teachers.includes(Number(teacher.id));
                    return (
                      <label
                        key={teacher.id}
                        data-teacher-item
                        data-name={getTeacherName(teacher)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '11px 14px', borderRadius: '10px',
                          cursor: 'pointer',
                          background: isChecked ? '#f5f3ff' : 'transparent',
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={(e) => { if (!isChecked) e.currentTarget.style.background = '#f9fafb'; }}
                        onMouseLeave={(e) => { if (!isChecked) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleTeacher(teacher.id)}
                          style={{ width: 17, height: 17, accentColor: '#7c3aed', cursor: 'pointer', flexShrink: 0 }}
                        />
                        <span style={{ fontSize: '14px', color: '#111827', fontWeight: isChecked ? 600 : 400 }}>
                          {getTeacherName(teacher)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid #f3f4f6',
              display: 'flex', gap: '10px', justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => setIsTeacherModalOpen(false)}
                style={{
                  padding: '9px 22px', borderRadius: '10px',
                  border: '1.5px solid #e5e7eb', background: '#fff',
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer', color: '#374151',
                }}
              >
                Bekor qilish
              </button>
              <button
                onClick={() => setIsTeacherModalOpen(false)}
                style={{
                  padding: '9px 28px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  border: 'none', fontSize: '14px', fontWeight: 600,
                  cursor: 'pointer', color: '#fff',
                  boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
                }}
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
