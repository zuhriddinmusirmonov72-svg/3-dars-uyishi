import { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiTrash2, FiEdit2, FiX } from 'react-icons/fi';
import { coursesAPI, roomsAPI } from '../../api/api';
import toast from 'react-hot-toast';
import { AppContext } from '../../context/AppContext';

const TeacherManagement = () => {
  const { t } = useContext(AppContext);
  const location = useLocation();
  const navigate = useNavigate();
  const queryTab = new URLSearchParams(location.search).get('tab');
  const [activeTab, setActiveTab] = useState(queryTab || 'Kurslar');

  useEffect(() => {
    if (queryTab && ['Kurslar', 'Xonalar', 'Xodimlar'].includes(queryTab)) {
      setActiveTab(queryTab);
    }
  }, [queryTab]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    navigate(`/management?tab=${tab}`, { replace: true });
  };

  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [coursesSubTab, setCoursesSubTab] = useState('faol'); // faol yoki arxiv
  const [roomsSubTab, setRoomsSubTab] = useState('faol'); // faol yoki arxiv
  
  const [courses, setCourses] = useState([]);
  const [archivedCourses, setArchivedCourses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [archivedRooms, setArchivedRooms] = useState([]);

  const [newCourse, setNewCourse] = useState({ 
    name: '', 
    description: '', 
    price: '', 
    duration_month: '', 
    duration_hours: '' 
  });
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [newRoom, setNewRoom] = useState({ name: '', capacity: '' });
  const [editingRoomId, setEditingRoomId] = useState(null);

  // O'chirish modali uchun state
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, id: null });

  // Backend dan kurslarni olish
  useEffect(() => {
    if (activeTab === 'Kurslar') {
      if (coursesSubTab === 'faol') {
        fetchCourses();
      } else if (coursesSubTab === 'arxiv') {
        fetchArchivedCourses();
      }
    } else if (activeTab === 'Xonalar') {
      if (roomsSubTab === 'faol') {
        fetchRooms();
      } else if (roomsSubTab === 'arxiv') {
        fetchArchivedRooms();
      }
    }
  }, [activeTab, coursesSubTab, roomsSubTab]);

  // Backend dan xonalarni olish
  useEffect(() => {
    if (activeTab === 'Xonalar') {
      fetchRooms();
    }
  }, [activeTab]);

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      const response = await coursesAPI.getAll();
      console.log('Courses response:', response.data);
      
      const coursesData = response.data?.data || response.data || [];
      const coursesList = Array.isArray(coursesData) ? coursesData : [];
      
      setCourses(coursesList);
    } catch (error) {
      console.error('Kurslarni yuklashda xato:', error);
      toast.error('Kurslarni yuklashda xato!');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchArchivedCourses = async () => {
    setIsLoading(true);
    try {
      const response = await coursesAPI.getArchive();
      console.log('Archived courses response:', response.data);
      
      const coursesData = response.data?.data || response.data || [];
      const coursesList = Array.isArray(coursesData) ? coursesData : [];
      
      setArchivedCourses(coursesList);
    } catch (error) {
      console.error('Arxiv kurslarni yuklashda xato:', error);
      toast.error('Arxiv kurslarni yuklashda xato!');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // 📡 XONALARNI YUKLASH — GET /rooms
  // ============================================
  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const response = await roomsAPI.getAll();
      console.log('Rooms response:', response.data);
      
      const roomsData = response.data?.data || response.data || [];
      const roomsList = Array.isArray(roomsData) ? roomsData : [];
      
      setRooms(roomsList);
    } catch (error) {
      console.error('Xonalarni yuklashda xato:', error);
      toast.error('Xonalarni yuklashda xato!');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchArchivedRooms = async () => {
    setIsLoading(true);
    try {
      const response = await roomsAPI.getArchive();
      console.log('Archived rooms response:', response.data);
      
      const roomsData = response.data?.data || response.data || [];
      const roomsList = Array.isArray(roomsData) ? roomsData : [];
      
      setArchivedRooms(roomsList);
    } catch (error) {
      console.error('Arxiv xonalarni yuklashda xato:', error);
      toast.error('Arxiv xonalarni yuklashda xato!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    
    if (!newCourse.name.trim()) {
      toast.error('Kurs nomini kiriting!');
      return;
    }

    if (!newCourse.price || Number(newCourse.price) <= 0) {
      toast.error('Oylik to\'lovini kiriting!');
      return;
    }

    if (!newCourse.duration_month || Number(newCourse.duration_month) <= 0) {
      toast.error('Necha oy davom etishini kiriting!');
      return;
    }

    if (!newCourse.duration_hours || Number(newCourse.duration_hours) <= 0) {
      toast.error('Necha soat dars bo\'lishini kiriting!');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        name: newCourse.name.trim(),
        description: newCourse.description?.trim() || '',
        price: Number(newCourse.price),
        duration_month: Number(newCourse.duration_month),
        duration_hours: Number(newCourse.duration_hours),
      };

      console.log('Kurs yaratish payload:', payload);

      if (editingCourseId) {
        // Tahrirlash
        await coursesAPI.update(editingCourseId, payload);
        toast.success('Kurs yangilandi!');
      } else {
        // Yangi qo'shish
        await coursesAPI.create(payload);
        toast.success("Kurs qo'shildi!");
      }

      setIsCourseModalOpen(false);
      setNewCourse({ 
        name: '', 
        description: '', 
        price: '', 
        duration_month: '', 
        duration_hours: '' 
      });
      setEditingCourseId(null);
      fetchCourses();
    } catch (error) {
      console.error('Kurs saqlashda xato:', error);
      const errorMsg = error.response?.data?.message || 'Xato yuz berdi!';
      toast.error(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCourse = (course) => {
    setEditingCourseId(course.id);
    setNewCourse({
      name: course.name || '',
      description: course.description || '',
      price: course.price || '',
      duration_month: course.duration_month || '',
      duration_hours: course.duration_hours || '',
    });
    setIsCourseModalOpen(true);
  };

  const confirmDeleteCourse = (courseId) => {
    setDeleteModal({ isOpen: true, type: 'course', id: courseId });
  };

  const executeDeleteCourse = async () => {
    setIsLoading(true);
    try {
      await coursesAPI.delete(deleteModal.id);
      toast.success("Kurs o'chirildi!");
      fetchCourses();
    } catch (error) {
      console.error('Kurs o\'chirishda xato:', error);
      toast.error("Kurs o'chirishda xato!");
    } finally {
      setIsLoading(false);
      setDeleteModal({ isOpen: false, type: null, id: null });
    }
  };

  // ============================================
  // � XONALAR CRUD OPERATIONS
  // ============================================
  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    
    if (!newRoom.name.trim()) {
      toast.error('Xona nomini kiriting!');
      return;
    }

    if (!newRoom.capacity || Number(newRoom.capacity) <= 0) {
      toast.error('Sig\'imini kiriting!');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        name: newRoom.name.trim(),
        capacity: Number(newRoom.capacity),
      };

      console.log('Xona yaratish payload:', payload);

      if (editingRoomId) {
        // Tahrirlash
        await roomsAPI.update(editingRoomId, payload);
        toast.success('Xona yangilandi!');
      } else {
        // Yangi qo'shish
        await roomsAPI.create(payload);
        toast.success("Xona qo'shildi!");
      }

      setIsRoomModalOpen(false);
      setNewRoom({ name: '', capacity: '' });
      setEditingRoomId(null);
      fetchRooms();
    } catch (error) {
      console.error('Xona saqlashda xato:', error);
      const errorMsg = error.response?.data?.message || 'Xato yuz berdi!';
      toast.error(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRoom = (room) => {
    setEditingRoomId(room.id);
    setNewRoom({
      name: room.name || '',
      capacity: room.capacity || '',
    });
    setIsRoomModalOpen(true);
  };

  const confirmDeleteRoom = (roomId) => {
    setDeleteModal({ isOpen: true, type: 'room', id: roomId });
  };

  const executeDeleteRoom = async () => {
    setIsLoading(true);
    try {
      await roomsAPI.delete(deleteModal.id);
      toast.success("Xona o'chirildi!");
      fetchRooms();
    } catch (error) {
      console.error('Xona o\'chirishda xato:', error);
      toast.error("Xona o'chirishda xato!");
    } finally {
      setIsLoading(false);
      setDeleteModal({ isOpen: false, type: null, id: null });
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h1 className="page-title" style={{ marginBottom: '16px' }}>Boshqarish</h1>
        <div className="tabs-container">
          {['Kurslar', 'Xonalar', 'Xodimlar'].map(tab => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            >
              {tab}
              {activeTab === tab && (
                <div className="tab-indicator"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="content-card" style={{ padding: '24px', minHeight: '400px' }}>
        {activeTab === 'Kurslar' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Kurslar</h2>
                
                {/* Sub-tabs: Faol / Arxiv */}
                <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                  <button
                    onClick={() => setCoursesSubTab('faol')}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '8px',
                      border: coursesSubTab === 'faol' ? '1px solid #7c3aed' : '1px solid #e5e7eb',
                      background: coursesSubTab === 'faol' ? '#f3e8ff' : '#fff',
                      color: coursesSubTab === 'faol' ? '#7c3aed' : '#6b7280',
                      fontSize: '14px',
                      fontWeight: coursesSubTab === 'faol' ? '600' : '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Faol
                  </button>
                  <button
                    onClick={() => setCoursesSubTab('arxiv')}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '8px',
                      border: coursesSubTab === 'arxiv' ? '1px solid #7c3aed' : '1px solid #e5e7eb',
                      background: coursesSubTab === 'arxiv' ? '#f3e8ff' : '#fff',
                      color: coursesSubTab === 'arxiv' ? '#7c3aed' : '#6b7280',
                      fontSize: '14px',
                      fontWeight: coursesSubTab === 'arxiv' ? '600' : '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Arxiv
                  </button>
                </div>
              </div>
              
              {coursesSubTab === 'faol' && (
                <button 
                  className="add-btn" 
                  onClick={() => {
                    setEditingCourseId(null);
                    setNewCourse({ 
                      name: '', 
                      description: '', 
                      price: '', 
                      duration_month: '', 
                      duration_hours: '' 
                    });
                    setIsCourseModalOpen(true);
                  }}
                  disabled={isLoading}
                >
                  <span>+ Kurs qo'shish</span>
                </button>
              )}
            </div>

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
                <div style={{
                  width: '36px', height: '36px',
                  border: '3px solid #e5e7eb', borderTopColor: '#7c3aed',
                  borderRadius: '50%', animation: 'spin 1s linear infinite',
                  margin: '0 auto 12px',
                }} />
                Yuklanmoqda...
              </div>
            ) : coursesSubTab === 'faol' ? (
              // FAOL KURSLAR
              courses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
                  <p style={{ fontSize: '16px', marginBottom: '8px' }}>📚 Faol kurslar topilmadi</p>
                  <p style={{ fontSize: '14px' }}>Yangi kurs qo'shish uchun yuqoridagi tugmani bosing</p>
                </div>
              ) : (
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                  {courses.map(course => (
                    <div key={course.id} className="course-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h3 style={{ fontWeight: 'bold', fontSize: '14px', color: '#1f2937' }}>
                          {course.name || 'Nomsiz kurs'}
                        </h3>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '12px', color: '#6b7280' }}>
                        <span>{course.description || 'Tavsif yo\'q'}</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => confirmDeleteCourse(course.id)}
                            disabled={isLoading}
                            style={{ color: '#9ca3af', cursor: isLoading ? 'not-allowed' : 'pointer' }}
                            title={t.delete}
                          >
                            <FiTrash2 size={14} />
                          </button>
                          <button 
                            onClick={() => handleEditCourse(course)}
                            disabled={isLoading}
                            style={{ color: '#9ca3af', cursor: isLoading ? 'not-allowed' : 'pointer' }}
                            title={t.edit}
                          >
                            <FiEdit2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {course.duration_month && (
                          <span className="course-badge">{course.duration_month} oy</span>
                        )}
                        {course.duration_hours && (
                          <span className="course-badge">{course.duration_hours} soat/dars</span>
                        )}
                        {course.price && (
                          <span className="course-badge">
                            {Number(course.price).toLocaleString('uz-UZ')} so'm
                          </span>
                        )}
                        {course.total_lessons && (
                          <span className="course-badge">{course.total_lessons} dars</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              // ARXIV KURSLAR
              archivedCourses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
                  <p style={{ fontSize: '16px', marginBottom: '8px' }}>📦 Arxivlangan kurslar topilmadi</p>
                  <p style={{ fontSize: '14px' }}>O'chirilgan yoki arxivlangan kurslar bu yerda ko'rinadi</p>
                </div>
              ) : (
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                  {archivedCourses.map(course => (
                    <div 
                      key={course.id} 
                      className="course-card"
                      style={{ opacity: 0.7, position: 'relative' }}
                    >
                      {/* Arxiv badge */}
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        padding: '4px 10px',
                        background: '#fee2e2',
                        color: '#dc2626',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        Arxivlangan
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h3 style={{ fontWeight: 'bold', fontSize: '14px', color: '#1f2937' }}>
                          {course.name || 'Nomsiz kurs'}
                        </h3>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '12px', color: '#6b7280' }}>
                        <span>{course.description || 'Tavsif yo\'q'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {course.duration_month && (
                          <span className="course-badge">{course.duration_month} oy</span>
                        )}
                        {course.duration_hours && (
                          <span className="course-badge">{course.duration_hours} soat/dars</span>
                        )}
                        {course.price && (
                          <span className="course-badge">
                            {Number(course.price).toLocaleString('uz-UZ')} so'm
                          </span>
                        )}
                        {course.total_lessons && (
                          <span className="course-badge">{course.total_lessons} dars</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}
        
        {activeTab === 'Xonalar' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Xonalar</h2>
                
                {/* Sub-tabs: Faol / Arxiv */}
                <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                  <button
                    onClick={() => setRoomsSubTab('faol')}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '8px',
                      border: roomsSubTab === 'faol' ? '1px solid #7c3aed' : '1px solid #e5e7eb',
                      background: roomsSubTab === 'faol' ? '#f3e8ff' : '#fff',
                      color: roomsSubTab === 'faol' ? '#7c3aed' : '#6b7280',
                      fontSize: '14px',
                      fontWeight: roomsSubTab === 'faol' ? '600' : '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Faol
                  </button>
                  <button
                    onClick={() => setRoomsSubTab('arxiv')}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '8px',
                      border: roomsSubTab === 'arxiv' ? '1px solid #7c3aed' : '1px solid #e5e7eb',
                      background: roomsSubTab === 'arxiv' ? '#f3e8ff' : '#fff',
                      color: roomsSubTab === 'arxiv' ? '#7c3aed' : '#6b7280',
                      fontSize: '14px',
                      fontWeight: roomsSubTab === 'arxiv' ? '600' : '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Arxiv
                  </button>
                </div>
              </div>
              
              {roomsSubTab === 'faol' && (
                <button 
                  className="add-btn" 
                  onClick={() => {
                    setEditingRoomId(null);
                    setNewRoom({ name: '', capacity: '' });
                    setIsRoomModalOpen(true);
                  }}
                  disabled={isLoading}
                >
                  <span>+ Xona qo'shish</span>
                </button>
              )}
            </div>

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
                <div style={{
                  width: '36px', height: '36px',
                  border: '3px solid #e5e7eb', borderTopColor: '#7c3aed',
                  borderRadius: '50%', animation: 'spin 1s linear infinite',
                  margin: '0 auto 12px',
                }} />
                Yuklanmoqda...
              </div>
            ) : roomsSubTab === 'faol' ? (
              // FAOL XONALAR
              rooms.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
                  <p style={{ fontSize: '16px', marginBottom: '8px' }}>🏫 Faol xonalar topilmadi</p>
                  <p style={{ fontSize: '14px' }}>Yangi xona qo'shish uchun yuqoridagi tugmani bosing</p>
                </div>
              ) : (
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                  {rooms.map(room => (
                    <div key={room.id} className="course-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h3 style={{ fontWeight: 'bold', fontSize: '14px', color: '#1f2937' }}>
                          {room.name || 'Nomsiz xona'}
                        </h3>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '12px', color: '#6b7280' }}>
                        <span>Xona</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => confirmDeleteRoom(room.id)}
                            disabled={isLoading}
                            style={{ color: '#9ca3af', cursor: isLoading ? 'not-allowed' : 'pointer' }}
                            title={t.delete}
                          >
                            <FiTrash2 size={14} />
                          </button>
                          <button 
                            onClick={() => handleEditRoom(room)}
                            disabled={isLoading}
                            style={{ color: '#9ca3af', cursor: isLoading ? 'not-allowed' : 'pointer' }}
                            title={t.edit}
                          >
                            <FiEdit2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span className="course-badge">{room.capacity || 0} ta joy</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              // ARXIV XONALAR
              archivedRooms.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
                  <p style={{ fontSize: '16px', marginBottom: '8px' }}>📦 Arxivlangan xonalar topilmadi</p>
                  <p style={{ fontSize: '14px' }}>O'chirilgan yoki arxivlangan xonalar bu yerda ko'rinadi</p>
                </div>
              ) : (
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                  {archivedRooms.map(room => (
                    <div 
                      key={room.id} 
                      className="course-card"
                      style={{ opacity: 0.7, position: 'relative' }}
                    >
                      {/* Arxiv badge */}
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        padding: '4px 10px',
                        background: '#fee2e2',
                        color: '#dc2626',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        Arxivlangan
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h3 style={{ fontWeight: 'bold', fontSize: '14px', color: '#1f2937' }}>
                          {room.name || 'Nomsiz xona'}
                        </h3>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '12px', color: '#6b7280' }}>
                        <span>Xona</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span className="course-badge">{room.capacity || 0} ta joy</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}

        {activeTab === 'Xodimlar' && (
          <div style={{ color: '#6b7280', fontSize: '14px' }}>Xodimlar ro'yxati (Tez orada...)</div>
        )}
      </div>

      {/* Course Modal */}
      <div className={`right-drawer-overlay ${isCourseModalOpen ? 'open' : ''}`} onClick={() => !isLoading && setIsCourseModalOpen(false)}>
        <div className={`right-drawer ${isCourseModalOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h2 className="drawer-title">
                {editingCourseId ? 'Kursni tahrirlash' : 'Kurs qo\'shish'}
              </h2>
              <button 
                className="drawer-close" 
                onClick={() => !isLoading && setIsCourseModalOpen(false)}
                disabled={isLoading}
              >
                <FiX />
              </button>
            </div>
            
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '24px' }}>
              {editingCourseId ? 'Kurs ma\'lumotlarini yangilang.' : 'Yangi kurs ma\'lumotlarini kiriting.'}
            </p>

            <form onSubmit={handleCourseSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              {/* Kurs nomi */}
              <div className="form-group">
                <label className="form-label">
                  Kurs nomi <span style={{ color: 'red' }}>*</span>
                </label>
                <input 
                  type="text" 
                  required 
                  placeholder="Masalan: Frontend Development"
                  value={newCourse.name} 
                  onChange={e => setNewCourse({...newCourse, name: e.target.value})}
                  className="form-input"
                  disabled={isLoading}
                />
              </div>

              {/* Kurs haqida ma'lumot */}
              <div className="form-group">
                <label className="form-label">
                  Kurs haqida ma'lumot
                </label>
                <textarea
                  placeholder="Kurs haqida qisqacha ma'lumot yozing..."
                  value={newCourse.description} 
                  onChange={e => setNewCourse({...newCourse, description: e.target.value})}
                  className="form-input"
                  rows={3}
                  style={{ resize: 'vertical' }}
                  disabled={isLoading}
                />
              </div>

              {/* Oylik to'lovi */}
              <div className="form-group">
                <label className="form-label">
                  Oylik to'lovi (so'm) <span style={{ color: 'red' }}>*</span>
                </label>
                <input 
                  type="number" 
                  required
                  min="0"
                  step="1000"
                  placeholder="Masalan: 1200000"
                  value={newCourse.price} 
                  onChange={e => setNewCourse({...newCourse, price: e.target.value})}
                  className="form-input"
                  disabled={isLoading}
                />
              </div>

              {/* Necha oy dars bo'ladi */}
              <div className="form-group">
                <label className="form-label">
                  Necha oy dars bo'ladi <span style={{ color: 'red' }}>*</span>
                </label>
                <input 
                  type="number" 
                  required
                  min="1"
                  placeholder="Masalan: 8"
                  value={newCourse.duration_month} 
                  onChange={e => setNewCourse({...newCourse, duration_month: e.target.value})}
                  className="form-input"
                  disabled={isLoading}
                />
              </div>

              {/* Necha soat dars bo'ladi */}
              <div className="form-group">
                <label className="form-label">
                  Necha soat dars bo'ladi <span style={{ color: 'red' }}>*</span>
                </label>
                <input 
                  type="number" 
                  required
                  min="1"
                  placeholder="Masalan: 4"
                  value={newCourse.duration_hours} 
                  onChange={e => setNewCourse({...newCourse, duration_hours: e.target.value})}
                  className="form-input"
                  disabled={isLoading}
                />
                <small style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                  Har bir darsning davomiyligi (soatda)
                </small>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid #f3f4f6' }}>
                <button 
                  type="button" 
                  onClick={() => setIsCourseModalOpen(false)} 
                  className="btn-secondary" 
                  style={{ width: '48%' }}
                  disabled={isLoading}
                >
                  Bekor qilish
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ width: '48%' }}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
        </div>
      </div>

      {/* Room Modal */}
      <div className={`right-drawer-overlay ${isRoomModalOpen ? 'open' : ''}`} onClick={() => !isLoading && setIsRoomModalOpen(false)}>
        <div className={`right-drawer ${isRoomModalOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h2 className="drawer-title">
                {editingRoomId ? 'Xonani tahrirlash' : 'Xona qo\'shish'}
              </h2>
              <button 
                className="drawer-close" 
                onClick={() => !isLoading && setIsRoomModalOpen(false)}
                disabled={isLoading}
              >
                <FiX />
              </button>
            </div>
            
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '24px' }}>
              {editingRoomId ? 'Xona ma\'lumotlarini yangilang.' : 'Yangi xona ma\'lumotlarini kiriting.'}
            </p>

            <form onSubmit={handleRoomSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              {/* Xona nomi */}
              <div className="form-group">
                <label className="form-label">
                  Xona nomi <span style={{ color: 'red' }}>*</span>
                </label>
                <input 
                  type="text" 
                  required 
                  placeholder="Masalan: 101-xona"
                  value={newRoom.name} 
                  onChange={e => setNewRoom({...newRoom, name: e.target.value})}
                  className="form-input"
                  disabled={isLoading}
                />
              </div>

              {/* Sig'imi */}
              <div className="form-group">
                <label className="form-label">
                  Sig'imi (o'rinlar soni) <span style={{ color: 'red' }}>*</span>
                </label>
                <input 
                  type="number"
                  required
                  min="1"
                  placeholder="Masalan: 20"
                  value={newRoom.capacity} 
                  onChange={e => setNewRoom({...newRoom, capacity: e.target.value})}
                  className="form-input"
                  disabled={isLoading}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid #f3f4f6' }}>
                <button 
                  type="button" 
                  onClick={() => setIsRoomModalOpen(false)} 
                  className="btn-secondary" 
                  style={{ width: '48%' }}
                  disabled={isLoading}
                >
                  Bekor qilish
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ width: '48%' }}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModal.isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999,
        }} onClick={() => setDeleteModal({ isOpen: false, type: null, id: null })}>
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '32px',
            width: '400px', maxWidth: '90%', textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            animation: 'fadeIn 0.2s ease-out'
          }} onClick={e => e.stopPropagation()}>
            
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: '#fee2e2', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <FiTrash2 size={32} color="#ef4444" />
            </div>

            <h2 style={{ margin: '0 0 12px', fontSize: '20px', fontWeight: '700', color: '#111827' }}>
              O'chirishni tasdiqlaysizmi?
            </h2>
            <p style={{ margin: '0 0 32px', fontSize: '15px', color: '#6b7280', lineHeight: '1.5' }}>
              Ushbu amolni ortga qaytarib bo'lmaydi. Tanlangan ma'lumot tizimdan butunlay o'chiriladi.
            </p>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button
                onClick={() => setDeleteModal({ isOpen: false, type: null, id: null })}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  border: '1px solid #e5e7eb', background: '#fff',
                  color: '#374151', fontSize: '15px', fontWeight: '600',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                Bekor qilish
              </button>
              <button
                onClick={() => deleteModal.type === 'course' ? executeDeleteCourse() : executeDeleteRoom()}
                disabled={isLoading}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  border: 'none', background: '#ef4444',
                  color: '#fff', fontSize: '15px', fontWeight: '600',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1, transition: 'all 0.2s',
                }}
                onMouseEnter={e => !isLoading && (e.currentTarget.style.background = '#dc2626')}
                onMouseLeave={e => !isLoading && (e.currentTarget.style.background = '#ef4444')}
              >
                {isLoading ? 'O\'chirilmoqda...' : 'O\'chirish'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default TeacherManagement;
