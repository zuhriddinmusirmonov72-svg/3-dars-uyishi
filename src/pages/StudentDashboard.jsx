import { useState, useEffect } from 'react';
import { studentsAPI, lessonsAPI, filesAPI, homeworkAPI, loadVideoForPlayback } from '../api/api';
import { FiHome, FiCreditCard, FiUsers, FiBarChart2, FiAward, FiShoppingBag, FiBookOpen, FiSettings, FiBell, FiX, FiPlay, FiUpload, FiFileText, FiClock, FiCheckCircle, FiAlertCircle, FiUsers as FiUsersIcon, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import NajotLogo from '../assets/Najot.png';
import TeachersModal from '../components/TeachersModal';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  CircularProgress,
  Alert,
  Grid,
  LinearProgress
} from '@mui/material';
import { Close as CloseIcon, UploadFile as UploadFileIcon, Description as DescriptionIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('active');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isTeachersModalOpen, setIsTeachersModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedGroupForLessons, setSelectedGroupForLessons] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [videoError, setVideoError] = useState(null);
  const [homeworkData, setHomeworkData] = useState(null);
  const [loadingHomework, setLoadingHomework] = useState(false);
  const [studentSubmissions, setStudentSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [githubLink, setGithubLink] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isLessonDetailOpen, setIsLessonDetailOpen] = useState(false);
  const [lessonsStatusFilter, setLessonsStatusFilter] = useState('Barchasi');
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  useEffect(() => {
    fetchMyGroups();
  }, []);

  const fetchMyGroups = async () => {
    try {
      const res = await studentsAPI.getMyGroups();
      const data = res?.data?.data || res?.data || [];
      console.log('API response:', res);
      console.log('Groups data:', data);
      setGroups(data);
    } catch (err) {
      console.error('Guruhlarni yuklashda xato:', err);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleOpenTeachersModal = (group) => {
    setSelectedGroup(group);
    setIsTeachersModalOpen(true);
  };

  const handleCloseTeachersModal = () => {
    setIsTeachersModalOpen(false);
    setSelectedGroup(null);
  };

  const fetchGroupLessons = async (groupId) => {
    try {
      setLoadingLessons(true);
      // getGroupLessonsAll → /groups/{groupId}/lessons/all — status va videoCount qaytaradi
      const res = await lessonsAPI.getGroupLessonsAll(groupId);
      const data = res?.data?.data || res?.data || [];
      setLessons(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Darslarni yuklashda xato:', err);
      setLessons([]);
    } finally {
      setLoadingLessons(false);
    }
  };

  const handleGroupClick = (group) => {
    setSelectedGroupForLessons(group);
    const groupId = group.id || group.group_id || group.groupId;
    if (groupId) {
      fetchGroupLessons(groupId);
    }
  };

  const handleCloseLessons = () => {
    setSelectedGroupForLessons(null);
    setLessons([]);
  };

  const fetchLessonVideos = async (groupId, lessonId) => {
    try {
      setLoadingVideos(true);
      const res = await lessonsAPI.getLessonVideos(groupId, lessonId);
      const data = res?.data?.data || res?.data || [];
      const list = Array.isArray(data) ? data : [];
      
      const formattedVideos = await Promise.all(list.map(async (v) => {
        try {
           const playback = await loadVideoForPlayback(v, groupId);
           return { ...v, formattedUrl: playback.blobUrl, revoke: playback.revoke };
        } catch(err) {
           console.error("Video yuklashda xato:", err);
           // Fallback if loadVideoForPlayback fails
           let fallbackUrl = v.video_url || v.url || v.path || v.filename || v.file_url || v.link || '';
           if (fallbackUrl && !fallbackUrl.startsWith('http')) {
             fallbackUrl = `https://najot-edu.softwareengineer.uz/api/v1/files/files/${fallbackUrl}`;
           } else if (v.id) {
             fallbackUrl = `https://najot-edu.softwareengineer.uz/api/v1/files/${groupId}/${v.id}`;
           }
           return { ...v, formattedUrl: fallbackUrl };
        }
      }));
      
      setVideos(formattedVideos);
    } catch (err) {
      console.error('Videolarni yuklashda xato:', err);
      setVideos([]);
    } finally {
      setLoadingVideos(false);
    }
  };

  const fetchHomeworkData = async (groupId, lessonId) => {
    try {
      setLoadingHomework(true);
      const res = await lessonsAPI.getLessonHomeworks(groupId, lessonId);
      const data = res?.data?.data || res?.data || null;
      // API array qaytarsa birinchisini ol
      if (Array.isArray(data)) {
        setHomeworkData(data.length > 0 ? data[0] : null);
      } else {
        setHomeworkData(data || null);
      }
    } catch (err) {
      console.error('Uyga vazifa yuklashda xato:', err);
      setHomeworkData(null);
    } finally {
      setLoadingHomework(false);
    }
  };

  const fetchStudentSubmissions = async (groupId, lessonId) => {
    // Bu endpoint hozircha mavjud emas, bo'sh qoldiramiz
    setStudentSubmissions([]);
  };

  const handleOpenHomeworkModal = (lesson) => {
    setSelectedLesson(lesson);
    const groupId = selectedGroupForLessons?.id || selectedGroupForLessons?.group_id || selectedGroupForLessons?.groupId;
    const lessonId = lesson?.id;
    if (groupId && lessonId) {
      fetchLessonVideos(groupId, lessonId);
      fetchHomeworkData(groupId, lessonId);
    }
    setIsHomeworkModalOpen(true);
    setIsLessonDetailOpen(false);
  };

  const handleCloseHomeworkModal = () => {
    setIsHomeworkModalOpen(false);
    setSelectedLesson(null);
    setVideos([]);
    setVideoError(null);
    setHomeworkData(null);
    setStudentSubmissions([]);
    setSelectedFile(null);
    setGithubLink('');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmitHomework = async () => {
    console.log('🔵 handleSubmitHomework called, homeworkData:', homeworkData);
    
    // Extract homeworkId from nested structure
    const homeworkId = homeworkData?.homework?.id || homeworkData?.id || homeworkData?.homeworkId;
    
    console.log('🔑 Extracted homeworkId:', homeworkId);
    
    if (!homeworkId) {
      console.error('❌ homeworkId topilmadi:', homeworkData);
      toast.error('Uyga vazifa topilmadi (Homework ID mavjud emas)');
      return;
    }
    if (!selectedFile && !githubLink.trim()) {
      toast.error('Iltimos, kamida bitta (fayl yoki matn) kiriting!');
      return;
    }
    
    console.log('📦 Selected file:', {
      name: selectedFile?.name,
      size: selectedFile?.size,
      type: selectedFile?.type,
      lastModified: selectedFile?.lastModified
    });
    console.log('🔗 GitHub link/comment:', githubLink);
    
    try {
      setUploading(true);
      const formData = new FormData();
      
      // Backend majburiy fieldlari:
      // 1. title (string, majburiy)
      const title = homeworkData?.homework?.title || 
                   homeworkData?.title || 
                   homeworkData?.homework?.topic || 
                   homeworkData?.topic || 
                   'Uy vazifa topshiruvi';
      formData.append('title', title);
      
      // 2. file (File, ixtiyoriy)
      if (selectedFile) {
        console.log('✅ File obyekti:', selectedFile);
        console.log('✅ File instanceof File:', selectedFile instanceof File);
        formData.append('file', selectedFile);
      }
      
      // 3. comment (string, ixtiyoriy)
      if (githubLink.trim()) {
        formData.append('comment', githubLink.trim());
      }

      console.log('📤 Yuborilayotgan homework FormData:');
      for (let [key, val] of formData.entries()) {
        console.log(`  ${key}:`, val instanceof File ? `${val.name} (${val.size} bytes, ${val.type})` : val);
      }
      
      console.log('🌐 API endpoint:', `/students/homeworkAnswer/${homeworkId}`);

      // POST /students/homeworkAnswer/{homeworkId}
      const response = await studentsAPI.submitHomework(homeworkId, formData);
      
      console.log('✅ Success response:', response?.data);

      toast.success('Uyga vazifa muvaffaqiyatli yuborildi! ✅');
      const groupId = selectedGroupForLessons?.id || selectedGroupForLessons?.group_id;
      await fetchGroupLessons(groupId);
      // Refresh homework data
      await fetchHomeworkData(groupId, selectedLesson.id);

      // Clear form
      setSelectedFile(null);
      setGithubLink('');
      
      // Close modal after successful submission
      handleCloseHomeworkModal();
    } catch (err) {
      console.error('=== XATO TAFSILOTI ===');
      console.error('❌ Error object:', err);
      console.error('❌ Error message:', err.message);
      console.error('❌ Error code:', err.code);
      console.error('❌ Error name:', err.name);
      console.error('❌ Response exists:', !!err.response);
      console.error('❌ Response status:', err.response?.status);
      console.error('❌ Response data:', err.response?.data);
      console.error('❌ Response headers:', err.response?.headers);
      console.error('❌ Request URL:', err.config?.url);
      console.error('❌ Request method:', err.config?.method);
      console.error('❌ Request baseURL:', err.config?.baseURL);
      
      const errData = err.response?.data;
      
      // Tarmoq xatosi (server javob bermadi)
      if (!err.response) {
        console.error('🔴 Tarmoq xatosi - server javob bermadi');
        toast.error('Server bilan aloqa yo\'qoldi. Internet ulanishini tekshiring yoki keyinroq qayta urinib ko\'ring.', { duration: 8000 });
        return;
      }
      
      // Backend xatosi (server javob qaytardi)
      if (errData?.message && Array.isArray(errData.message)) {
        errData.message.forEach((m) => toast.error(m, { duration: 6000 }));
      } else if (errData?.message) {
        toast.error(errData.message, { duration: 6000 });
      } else if (err.response?.status === 413) {
        toast.error('Fayl hajmi juda katta! Iltimos, kichikroq fayl yuklang.', { duration: 6000 });
      } else if (err.response?.status === 415) {
        toast.error('Fayl turi qo\'llab-quvvatlanmaydi.', { duration: 6000 });
      } else if (err.response?.status === 500) {
        toast.error('Server xatosi yuz berdi. Iltimos, keyinroq qayta urinib ko\'ring.', { duration: 6000 });
      } else {
        toast.error(errData?.error || err.message || 'Xato yuz berdi!', { duration: 6000 });
      }
    } finally {
      setUploading(false);
    }
  };

  const getHomeworkStatus = (lesson) => {
    const raw = String(lesson?.status || 'Berilmagan').toLowerCase();

    if (raw.includes('qabul') || raw.includes('accepted') || raw.includes('approved')) {
      return { text: 'Qabul qilingan', color: '#22c55e', bg: '#22c55e' };
    }
    if (raw.includes('qaytarilgan') || raw.includes('rejected') || raw.includes('returned')) {
      return { text: 'Qaytarilgan', color: '#f59e0b', bg: '#f59e0b' };
    }
    if (raw.includes('bajarilmagan') || raw.includes('bajarmaganlar')) {
      return { text: lesson.status || 'Bajarilmagan', color: '#ef4444', bg: '#ef4444' };
    }
    if (raw.includes('kutilmoqda') || raw.includes('pending') || raw.includes('waiting') || raw.includes('submitted')) {
      return { text: 'Kutilmoqda', color: '#3b82f6', bg: '#3b82f6' };
    }
    // Berilmagan
    return { text: lesson.status || 'Berilmagan', color: '#6b7280', bg: '#6b7280' };
  };

  const navItems = [
    { name: "Bosh sahifa", icon: <FiHome size={18} />, active: false },
    { name: "To'lovlarim", icon: <FiCreditCard size={18} />, active: false },
    { name: "Guruhlarim", icon: <FiUsers size={18} />, active: true },
    { name: "Ko'rsatgichlarim", icon: <FiBarChart2 size={18} />, active: false },
    { name: "Reyting", icon: <FiAward size={18} />, active: false },
    { name: "Do'kon", icon: <FiShoppingBag size={18} />, active: false },
    { name: "Qo'shimcha darslar", icon: <FiBookOpen size={18} />, active: false },
    { name: "Sozlamalar", icon: <FiSettings size={18} />, active: false },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <div style={{
        width: '260px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        left: 0,
        top: 0,
      }}>
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', letterSpacing: '1px' }}>NAJOT</span>
          <img
            src={NajotLogo}
            alt="NajotEdu"
            style={{ width: '40px', height: '40px', objectFit: 'contain' }}
          />
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', letterSpacing: '1px' }}>TA'LIM</span>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {navItems.map((item) => (
            <button
              key={item.name}
              style={{
                width: '100%',
                padding: '12px 16px',
                marginBottom: '4px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: item.active ? '#7c3aed' : 'transparent',
                color: item.active ? '#ffffff' : '#4b5563',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: item.active ? '600' : '500',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!item.active) {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }
              }}
              onMouseLeave={(e) => {
                if (!item.active) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {item.icon}
              {item.name}
            </button>
          ))}
        </nav>

        <div style={{
          padding: '16px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#7c3aed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: '600',
            fontSize: '16px',
          }}>
            S
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
              Student
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
              Talaba
            </p>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, marginLeft: '260px' }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          padding: '16px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
            Guruhlarim
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '1px solid #e5e7eb',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
            }}>
              <FiBell size={20} color="#6b7280" />
              <span style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
              }}></span>
            </button>
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#7c3aed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                S
              </div>
              {showProfileMenu && (
                <div style={{
                  position: 'absolute',
                  top: '50px',
                  right: '0',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  zIndex: 1000,
                  minWidth: '150px',
                }}>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#ef4444',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      textAlign: 'left',
                      borderRadius: '8px',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fef2f2';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    Chiqish
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ padding: '32px' }}>
          {!selectedGroupForLessons ? (
            <>
              {/* TABS */}
              <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '24px',
              }}>
                <button
                  onClick={() => setActiveTab('active')}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: activeTab === 'active' ? '#7c3aed' : '#ffffff',
                    color: activeTab === 'active' ? '#ffffff' : '#4b5563',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Faol
                </button>
                <button
                  onClick={() => setActiveTab('finished')}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: activeTab === 'finished' ? '#7c3aed' : '#ffffff',
                    color: activeTab === 'finished' ? '#ffffff' : '#4b5563',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Tugagan
                </button>
              </div>

              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                overflow: 'hidden',
              }}>
                {loading ? (
                  <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
                    Yuklanmoqda...
                  </div>
                ) : groups.length === 0 ? (
                  <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
                    Guruhlar topilmadi
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                          #
                        </th>
                        <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                          Guruh nomi
                        </th>
                        <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                          Yo'nalishi
                        </th>
                        <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                          O'qituvchi
                        </th>
                        <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                          Boshlash vaqti
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups.map((group, index) => (
                        <tr
                          key={group.id || index}
                          style={{
                            borderBottom: '1px solid #e5e7eb',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                          }}
                          onClick={() => handleGroupClick(group)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f9fafb';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>
                            {index + 1}
                          </td>
                          <td style={{ padding: '16px', fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                            {group.name || group.group_name || group.groupName || group.title || group.groupTitle || 'Nomsiz guruh'}
                          </td>
                          <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>
                            {group.course || group.direction || group.course_name || group.courseName || group.subject || '-'}
                          </td>
                          <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenTeachersModal(group);
                              }}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: '1px solid #7c3aed',
                                backgroundColor: '#ffffff',
                                color: '#7c3aed',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#7c3aed';
                                e.currentTarget.style.color = '#ffffff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#ffffff';
                                e.currentTarget.style.color = '#7c3aed';
                              }}
                            >
                              1
                            </button>
                          </td>
                          <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>
                            {formatDate(group.start_date || group.created_at || group.startDate || group.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : null}

          {selectedGroupForLessons && !selectedLesson && (
            <div>

              {/* Uy vazifa statusi filter */}
              <div style={{ marginBottom: '20px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#4b5563', fontWeight: '500' }}>
                  Uy vazifa statusi
                </p>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <select
                    value={lessonsStatusFilter}
                    onChange={(e) => setLessonsStatusFilter(e.target.value)}
                    style={{
                      padding: '10px 40px 10px 16px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      background: 'white',
                      color: '#374151',
                      fontSize: '14px',
                      fontWeight: '500',
                      outline: 'none',
                      minWidth: '180px',
                      cursor: 'pointer',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                    }}
                  >
                    <option value="Barchasi">Barchasi</option>
                    <option value="Qabul qilingan">Qabul qilingan</option>
                    <option value="Qaytarilgan">Qaytarilgan</option>
                    <option value="Bajarilmagan">Bajarilmagan</option>
                    <option value="Berilmagan">Berilmagan</option>
                    <option value="Kutilmoqda">Kutilmoqda</option>
                  </select>
                  <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280', fontSize: '12px' }}>▼</span>
                </div>
              </div>

              {/* Lessons Table */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden',
                }}
              >
                {loadingLessons ? (
                  <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
                    <div style={{ width: '36px', height: '36px', border: '3px solid #e5e7eb', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                    Yuklanmoqda...
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                        <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#111827' }}>Mavzular</th>
                        <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#111827' }}>Video</th>
                        <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#111827' }}>Uyga vazifa Holati</th>
                        <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#111827' }}>Uyga vazifa tugash vaqti</th>
                        <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#111827' }}>Dars sanasi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const filtered = lessons.filter(l => {
                          if (lessonsStatusFilter === 'Barchasi') return true;
                          const hs = getHomeworkStatus(l);
                          return hs.text === lessonsStatusFilter;
                        });
                        if (filtered.length === 0) return (
                          <tr><td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>Darslar topilmadi</td></tr>
                        );
                        return filtered.map((lesson, index) => {
                          const hs = getHomeworkStatus(lesson);
                          const videoCount = lesson?.videoCount || lesson?.video_count || 0;
                          // Deadline format: "2026 M06 11 20:00" or "-"
                          const fmtDeadline = (val) => {
                            if (!val) return '-';
                            const d = new Date(val);
                            if (isNaN(d.getTime())) return '-';
                            return `${d.getFullYear()} M${String(d.getMonth()+1).padStart(2,'0')} ${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                          };
                          // Lesson date format: "2026 M06 11"
                          const fmtDate = (val) => {
                            if (!val) return '-';
                            const d = new Date(val);
                            if (isNaN(d.getTime())) return '-';
                            return `${d.getFullYear()} M${String(d.getMonth()+1).padStart(2,'0')} ${String(d.getDate()).padStart(2,'0')}`;
                          };
                          return (
                            <tr
                              key={lesson.id || index}
                              style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', transition: 'background-color 0.2s' }}
                              onClick={() => handleOpenHomeworkModal(lesson)}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <td style={{ padding: '18px 24px', fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                                {lesson.topic || lesson.title || lesson.name || '-'}
                              </td>
                              <td style={{ padding: '18px 24px' }}>
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                  width: '30px', height: '30px', borderRadius: '50%',
                                  border: '2px solid #3b82f6', color: '#3b82f6',
                                  fontSize: '13px', fontWeight: '600'
                                }}>
                                  {videoCount}
                                </span>
                              </td>
                              <td style={{ padding: '18px 24px' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '5px 14px',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  color: '#fff',
                                  backgroundColor: hs.bg,
                                }}>
                                  {hs.text}
                                </span>
                              </td>
                              <td style={{ padding: '18px 24px', fontSize: '14px', color: '#374151' }}>
                                {fmtDeadline(lesson.deadline || lesson.end_date || lesson.homework?.deadline)}
                              </td>
                              <td style={{ padding: '18px 24px', fontSize: '14px', color: '#374151' }}>
                                {fmtDate(lesson.created_at || lesson.lesson_date)}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {selectedLesson && (
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

              {/* ===== LEFT PANEL ===== */}
              <div style={{ flex: 1, minWidth: 0 }}>

                {/* Video player */}
                {loadingVideos ? (
                  <div style={{ background: '#ffffff', borderRadius: '12px', height: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb' }}>
                    <div style={{ width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTopColor: '#d1a877', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : videos.length > 0 ? (
                  <div>
                    <div style={{ background: '#000', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                      <video
                        key={videos[activeVideoIndex]?.formattedUrl || videos[0]?.formattedUrl}
                        controls
                        style={{ width: '100%', display: 'block', maxHeight: '420px' }}
                        src={videos[activeVideoIndex]?.formattedUrl || videos[0]?.formattedUrl}
                      >
                        Brauzeringiz video formatini qo'llab-quvvatlamaydi.
                      </video>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: '#ffffff', borderRadius: '12px', padding: '80px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', border: '1px solid #e5e7eb' }}>
                    <img src={NajotLogo} alt="Najot" style={{ width: '180px', height: 'auto', opacity: 0.9 }} />
                    <h3 style={{ color: '#374151', fontSize: '22px', fontWeight: '700', margin: 0 }}>Video mavjud emas</h3>
                  </div>
                )}

                {/* Lesson Title Box */}
                <div style={{ marginTop: '16px', background: '#ffffff', borderRadius: '12px', padding: '20px 24px', border: '1px solid #e5e7eb' }}>
                  <p style={{ margin: 0, fontSize: '15px', color: '#4b5563', fontWeight: '500' }}>
                    {selectedLesson?.topic || selectedLesson?.title || '1-oy 2-dars. Hardware & Software. HTML basics'}
                  </p>
                </div>

                {/* Vazifalar section */}
                <div style={{ marginTop: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                  {/* Tab header */}
                  <div style={{ borderBottom: '1px solid #e5e7eb', padding: '0 24px', display: 'flex' }}>
                    <button style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '16px 0', fontSize: '15px', fontWeight: '500',
                      color: '#d1a877', borderBottom: '3px solid #d1a877',
                      marginBottom: '-1px'
                    }}>
                      Vazifalar
                    </button>
                  </div>

                  <div style={{ padding: '0' }}>
                    {loadingHomework ? (
                      <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
                        <div style={{ width: '32px', height: '32px', border: '3px solid #e5e7eb', borderTopColor: '#d1a877', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
                        Yuklanmoqda...
                      </div>
                    ) : homeworkData ? (
                      <div style={{ padding: '24px' }}>
                        
                        {/* Main Homework Info Block */}
                        <div style={{ background: '#f8f4ef', padding: '24px 32px 32px 32px', borderRadius: '12px' }}>
                          {/* Top row */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ flex: 1 }}>
                              <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '400', color: '#1f2937' }}>
                                {homeworkData?.homework?.title || homeworkData?.title || homeworkData?.homework?.topic || homeworkData?.topic || 'Uyga vazifa'}
                              </h4>
                            </div>
                            
                            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                              {(homeworkData?.homework?.deadline || homeworkData?.deadline) && (
                                <div style={{ 
                                  background: '#f03a17', color: '#fff', padding: '8px 16px', borderRadius: '4px',
                                  display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500'
                                }}>
                                  <FiAlertCircle size={16} />
                                  <span>Uyga vazifa muddati: {
                                    (() => {
                                      const d = new Date(homeworkData?.homework?.deadline || homeworkData?.deadline);
                                      const m = ['Yan','Fev','Mar','Apr','May','Iyun','Iyul','Avg','Sen','Okt','Noy','Dek'];
                                      return `${d.getDate()} ${m[d.getMonth()]?.substring(0,3)}, ${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                                    })()
                                  }</span>
                                </div>
                              )}
                            </div>

                            <div style={{ flex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '40px' }}>
                              <span style={{ fontSize: '13px', color: '#4b5563' }}>Fayllar soni: {(homeworkData?.homework?.file || homeworkData?.file || (studentSubmissions.length > 0 && studentSubmissions[0].file)) ? 1 : 0}</span>
                            </div>
                          </div>

                          {/* Middle row: description */}
                          <div style={{ marginBottom: '8px', marginTop: '-15px' }}>
                            <p style={{ margin: 0, fontSize: '14px', color: '#4b5563' }}>
                              {homeworkData?.homework?.description || homeworkData?.description || homeworkData?.homework?.title || homeworkData?.title || 'Uy vazifa'}
                            </p>
                          </div>
                        </div>

                        {/* Submitted State Blocks */}
                        {(() => {
                          const statusRaw = String(selectedLesson?.status || 'Berilmagan').toLowerCase();
                          const isSubmittedStatus = statusRaw !== 'berilmagan' && statusRaw !== 'bajarilmagan';
                          const isSubmitted = studentSubmissions.length > 0 || isSubmittedStatus;
                          const isRejected = statusRaw.includes('qaytarilgan') || statusRaw.includes('rejected') || statusRaw.includes('bekor');
                          
                          if (!isSubmitted) return null;

                          const finalData = studentSubmissions[0] || homeworkData?.homework_answer || homeworkData?.answer || selectedLesson?.homework_answer || selectedLesson?.student_submission || homeworkData || selectedLesson || {};
                          
                          const githubLink = finalData.github_link || finalData.githubLink || 'Havola kiritilmagan';
                          const netlifyLink = finalData.netlify_link || finalData.vercel_link || finalData.live_link || '';
                          const fileCount = finalData.file || finalData.answer_file || finalData.student_file ? 1 : 0;
                          
                          const teacherComment = finalData.teacher_comment || selectedLesson?.teacher_comment || homeworkData?.teacher_comment || (isRejected ? 'Vazifada xatoliklar mavjud' : 'Izoh qoldirilmagan');
                          const checkerName = finalData.checker_name || finalData.teacher_name || selectedLesson?.teacher_name || homeworkData?.teacher_name || 'O\'qituvchi';
                          const penaltyText = finalData.penalty_text || selectedLesson?.penalty_text || homeworkData?.penalty_text || "Topshiriq mezonlarga javob bermadi yoki kechikib topshirildi.";

                          return (
                            <>
                              {/* Mening jo'natmalarim */}
                              <div style={{ background: '#f8f4ef', padding: '24px 32px', borderRadius: '12px', marginTop: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                  <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '400', color: '#1f2937' }}>Mening jo'natmalarim</h4>
                                  <span style={{ fontSize: '14px', color: '#4b5563' }}>Fayllar soni: {fileCount}</span>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                                  {githubLink !== 'Havola kiritilmagan' && (
                                    <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>
                                      GitHub -&gt; <a href={githubLink} target="_blank" rel="noopener noreferrer" style={{ color: '#4b5563', textDecoration: 'none' }}>{githubLink}</a>
                                    </p>
                                  )}
                                  {netlifyLink && (
                                    <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>
                                      Sayt -&gt; <a href={netlifyLink} target="_blank" rel="noopener noreferrer" style={{ color: '#4b5563', textDecoration: 'none' }}>{netlifyLink}</a>
                                    </p>
                                  )}
                                </div>
                                
                                <div style={{ textAlign: 'right' }}>
                                  <span style={{ fontSize: '14px', color: '#374151' }}>
                                    {(() => {
                                      const dt = finalData.created_at || finalData.submitted_at || selectedLesson?.created_at || new Date();
                                      const d = new Date(dt);
                                      if (isNaN(d.getTime())) return '';
                                      const m = ['Yan','Fev','Mar','Apr','May','Iyun','Iyul','Avg','Sen','Okt','Noy','Dek'];
                                      return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} ${d.getDate()} ${m[d.getMonth()]?.substring(0,3)}, ${d.getFullYear()}`;
                                    })()}
                                  </span>
                                </div>
                              </div>

                              {/* O'qituvchi izohi */}
                              <div style={{ background: '#f8f4ef', padding: '24px 32px', borderRadius: '12px', marginTop: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '400', color: '#374151' }}>O'qituvchi izohi</h4>
                                  <span style={{ fontSize: '15px', color: isRejected ? '#ef4444' : '#16a34a', fontWeight: '500' }}>
                                    {isRejected ? 'Vazifa bekor qilindi' : 'Vazifa qabul qilindi'}
                                  </span>
                                </div>
                                
                                {isRejected && (
                                  <div style={{ background: '#fef9c3', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ color: '#eab308', fontSize: '16px' }}>⚠️</span>
                                    <span style={{ color: '#854d0e', fontSize: '14px' }}>{penaltyText}</span>
                                  </div>
                                )}

                                <div style={{ marginBottom: '32px' }}>
                                  <p style={{ margin: 0, fontSize: '15px', color: '#4b5563' }}>
                                    {teacherComment}
                                  </p>
                                </div>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                  <span style={{ fontSize: '14px', color: '#4b5563' }}>
                                    Tekshiruvchi: {checkerName}
                                  </span>
                                  <span style={{ fontSize: '14px', color: '#374151' }}>
                                    {(() => {
                                      const dt = finalData.checked_at || finalData.updated_at || selectedLesson?.updated_at || new Date(Date.now() - 3600000);
                                      const d = new Date(dt);
                                      if (isNaN(d.getTime())) return '';
                                      const m = ['Yan','Fev','Mar','Apr','May','Iyun','Iyul','Avg','Sen','Okt','Noy','Dek'];
                                      return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} ${d.getDate()} ${m[d.getMonth()]?.substring(0,3)}, ${d.getFullYear()}`;
                                    })()}
                                  </span>
                                </div>
                              </div>

                              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                                <span style={{ fontSize: '15px', color: '#374151' }}>Qayta topshirish imkoniyati berilmagan</span>
                              </div>
                            </>
                          );
                        })()}

                        {(() => {
                          const statusRaw = String(selectedLesson?.status || 'Berilmagan').toLowerCase();
                          const isSubmittedStatus = statusRaw !== 'berilmagan' && statusRaw !== 'bajarilmagan';
                          const isSubmitted = studentSubmissions.length > 0 || isSubmittedStatus;
                          
                          if (isSubmitted) return null;

                          return (
                            <>
                              {/* Upload form ONLY if not submitted */}
                            <div style={{ marginTop: '24px', borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
                                <h5 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>Vazifani yuklash</h5>
                                
                                {/* Comment/Link input - textarea for multiline */}
                                <div style={{ marginBottom: '16px' }}>
                                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                                    Izoh, GitHub link yoki matn <span style={{ color: '#9ca3af', fontWeight: '400' }}>(ixtiyoriy)</span>
                                  </label>
                                  <textarea
                                    placeholder="GitHub link, Netlify link yoki uyga vazifa haqida izoh yozing..."
                                    value={githubLink}
                                    onChange={(e) => setGithubLink(e.target.value)}
                                    rows={3}
                                    style={{
                                      width: '100%', boxSizing: 'border-box',
                                      padding: '12px 16px', borderRadius: '8px',
                                      border: '1px solid #d1d5db', fontSize: '14px',
                                      outline: 'none', color: '#1f2937', background: '#f9fafb',
                                      resize: 'vertical', fontFamily: 'inherit'
                                    }}
                                  />
                                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                                    Kamida bitta (fayl yoki matn) yuborilishi shart
                                  </p>
                                </div>
                                
                                {/* File upload */}
                                <div style={{ marginBottom: '20px' }}>
                                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                                    Fayl yuklash <span style={{ color: '#9ca3af', fontWeight: '400' }}>(ixtiyoriy)</span>
                                  </label>
                                  <label style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '12px 16px', borderRadius: '8px',
                                    border: '1.5px dashed #d1d5db', cursor: 'pointer',
                                    color: '#6b7280', fontSize: '14px',
                                    background: selectedFile ? '#f0fdf4' : '#f9fafb'
                                  }}>
                                    <span style={{ fontSize: '20px' }}>📎</span>
                                    {selectedFile ? selectedFile.name : 'Fayl tanlash...'}
                                    <input type="file" style={{ display: 'none' }} onChange={handleFileSelect} />
                                  </label>
                                </div>
                                {/* Submit button */}
                                <button
                                  onClick={handleSubmitHomework}
                                  disabled={uploading || (!selectedFile && !githubLink.trim())}
                                  style={{
                                    width: '100%', padding: '14px',
                                    background: uploading || (!selectedFile && !githubLink.trim())
                                      ? '#e5e7eb' : '#d1a877',
                                    color: uploading || (!selectedFile && !githubLink.trim()) ? '#9ca3af' : '#fff',
                                    border: 'none', borderRadius: '8px',
                                    fontSize: '15px', fontWeight: '600', cursor:
                                    uploading || (!selectedFile && !githubLink.trim()) ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  {uploading ? 'Yuklanmoqda...' : 'Topshirish'}
                                </button>
                            </div>
                          </>
                        );
                        })()}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', fontSize: '15px' }}>
                        Uyga vazifa berilmagan
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ===== RIGHT PANEL — Accordion Lessons ===== */}
              <div style={{ width: '320px', flexShrink: 0 }}>
                <style>
                  {`
                    .lessons-scrollbar::-webkit-scrollbar {
                      width: 6px;
                    }
                    .lessons-scrollbar::-webkit-scrollbar-track {
                      background: #f1f1f1; 
                      border-radius: 4px;
                    }
                    .lessons-scrollbar::-webkit-scrollbar-thumb {
                      background: #d1a877; 
                      border-radius: 4px;
                    }
                    .lessons-scrollbar::-webkit-scrollbar-thumb:hover {
                      background: #b58556; 
                    }
                  `}
                </style>
                <div 
                  className="lessons-scrollbar"
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '12px',
                    maxHeight: 'calc(100vh - 180px)',
                    overflowY: 'auto',
                    paddingRight: '8px'
                  }}
                >
                  {lessons.map((lesson, index) => {
                    const isActive = selectedLesson?.id === lesson?.id;
                    const groupId = selectedGroupForLessons?.id || selectedGroupForLessons?.group_id;
                    
                    const fmtD = (v) => {
                      if (!v) return '';
                      const d = new Date(v);
                      if (isNaN(d.getTime())) return '';
                      const months = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
                      return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]}, ${d.getFullYear()}`;
                    };

                    return (
                      <div 
                        key={lesson.id || index} 
                        style={{ 
                          background: isActive ? '#e8c7a1' : '#f6f3ed', 
                          borderRadius: '12px', 
                          overflow: 'hidden',
                          transition: 'all 0.2s',
                          position: 'relative'
                        }}
                      >
                        {/* Lesson header */}
                        <div
                          onClick={() => {
                            if (lesson.id !== selectedLesson?.id) {
                              setSelectedLesson(lesson);
                              setActiveVideoIndex(0);
                              setVideos([]);
                              setHomeworkData(null);
                              if (groupId && lesson.id) {
                                fetchLessonVideos(groupId, lesson.id);
                                fetchHomeworkData(groupId, lesson.id);
                              }
                            }
                          }}
                          style={{
                            padding: '16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '700', color: '#111827', lineHeight: 1.3 }}>
                              {lesson.topic || lesson.title || '-'}
                            </p>
                            <p style={{ margin: 0, fontSize: '13px', color: '#4b5563' }}>
                              Dars sanasi: {fmtD(lesson.created_at || lesson.lesson_date)}
                            </p>
                          </div>
                          
                          <span style={{ color: '#4b5563', fontSize: '20px', marginLeft: '8px', display: 'flex', alignItems: 'center' }}>
                            {isActive ? (videos.length > 0 ? <FiChevronUp /> : null) : <FiChevronDown />}
                          </span>
                        </div>
                        
                        {/* Expanded: show videos */}
                        {isActive && videos.length > 0 && (
                          <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {videos.map((v, vi) => (
                              <div 
                                key={vi} 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveVideoIndex(vi);
                                }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '12px',
                                  padding: '12px 16px',
                                  fontSize: '15px', color: activeVideoIndex === vi ? '#111827' : '#374151',
                                  background: activeVideoIndex === vi ? '#d1a877' : '#dfb78e',
                                  borderRadius: '8px',
                                  fontWeight: '500',
                                  cursor: 'pointer',
                                  transition: 'background 0.2s'
                              }}>
                                <span style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '22px',
                                  height: '22px',
                                  borderRadius: '50%',
                                  border: '2px solid #fff',
                                  color: '#fff',
                                  background: 'transparent'
                                }}>
                                  <FiPlay size={10} style={{ fill: '#fff', marginLeft: '2px' }} />
                                </span>
                                <span>{vi + 1}-video: {v.name || v.filename || v.original_name || `${lesson.topic || 'Video'}.mov`}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
      <TeachersModal
        isOpen={isTeachersModalOpen}
        onClose={handleCloseTeachersModal}
        group={selectedGroup}
      />
    </div>
  );
}
