import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiClock, FiVideo, FiBookOpen, FiAlertCircle, FiRefreshCw, FiFileText } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { lessonsAPI, parseApiError } from '../api/api';

/**
 * @typedef {Object} Lesson
 * @property {number} id
 * @property {string} topic
 * @property {string} created_at
 * @property {number} [homeworkId]
 * @property {number} videoCount
 * @property {string} [description]
 * @property {string} [lesson_date]
 */

/**
 * Format date to user-friendly format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '—';
  
  const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
};

/**
 * Lesson Detail Page Component
 * Displays detailed information about a specific lesson
 */
const LessonDetail = () => {
  const { groupId, lessonId } = useParams();
  const navigate = useNavigate();
  
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch lesson details from API
   */
  const fetchLesson = async () => {
    if (!lessonId) {
      setError('Dars ID topilmadi');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await lessonsAPI.getOne(lessonId);
      const data = response.data?.data || response.data;
      
      if (data && typeof data === 'object') {
        setLesson(data);
      } else {
        setError('Dars ma\'lumotlari topilmadi');
      }
    } catch (err) {
      console.error('Lesson fetch error:', err);
      const errorMessage = await parseApiError(err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLesson();
  }, [lessonId]);

  /**
   * Handle homework navigation
   */
  const handleHomeworkClick = () => {
    const homeworkId = lesson?.homeworkId || localStorage.getItem(`homework_${lessonId}`);
    
    if (homeworkId) {
      navigate(`/homework/${homeworkId}`);
    } else {
      toast.error('Uyga vazifa mavjud emas');
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="page-container">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '16px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#7c3aed',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Yuklanmoqda...</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="page-container">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '16px',
          padding: '40px',
          textAlign: 'center'
        }}>
          <FiAlertCircle size={48} style={{ color: '#ef4444' }} />
          <h2 style={{ margin: 0, color: '#1f2937', fontSize: '20px' }}>Xatolik yuz berdi</h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', maxWidth: '400px' }}>
            {error}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#e5e7eb',
                color: '#1f2937',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600
              }}
            >
              Orqaga
            </button>
            <button
              onClick={fetchLesson}
              style={{
                padding: '12px 24px',
                backgroundColor: '#7c3aed',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FiRefreshCw size={16} />
              Qayta urinish
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Lesson Not Found
  if (!lesson) {
    return (
      <div className="page-container">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '16px',
          padding: '40px',
          textAlign: 'center'
        }}>
          <FiBookOpen size={48} style={{ color: '#9ca3af' }} />
          <h2 style={{ margin: 0, color: '#1f2937', fontSize: '20px' }}>Dars topilmadi</h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
            So\'ralgan dars ma\'lumotlari mavjud emas
          </p>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            Orqaga
          </button>
        </div>
      </div>
    );
  }

  const homeworkId = lesson?.homeworkId || localStorage.getItem(`homework_${lessonId}`);

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: 'white',
            color: '#1f2937',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            marginBottom: '16px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#f9fafb';
            e.target.style.borderColor = '#d1d5db';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'white';
            e.target.style.borderColor = '#e5e7eb';
          }}
        >
          <FiArrowLeft size={16} />
          Orqaga
        </button>

        <h1 className="page-title" style={{ margin: 0 }}>
          {lesson.topic || 'Nomsiz dars'}
        </h1>
      </div>

      {/* Lesson Details Card */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        marginBottom: '20px'
      }}>
        {/* Description */}
        {lesson.description && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <FiFileText size={18} style={{ color: '#7c3aed' }} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
                Tavsif
              </h3>
            </div>
            <p style={{ margin: 0, color: '#4b5563', lineHeight: 1.6, fontSize: '14px' }}>
              {lesson.description}
            </p>
          </div>
        )}

        {/* Created At */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <FiClock size={18} style={{ color: '#7c3aed' }} />
          <div>
            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>
              Yaratilgan vaqt
            </p>
            <p style={{ margin: 0, fontSize: '14px', color: '#1f2937', fontWeight: 500 }}>
              {formatDate(lesson.created_at)}
            </p>
          </div>
        </div>

        {/* Video Count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <FiVideo size={18} style={{ color: '#7c3aed' }} />
          <div>
            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>
              Videolar
            </p>
            <p style={{ margin: 0, fontSize: '14px', color: '#1f2937', fontWeight: 500 }}>
              {lesson.videoCount || 0} ta video
            </p>
          </div>
        </div>

        {/* Lesson Date */}
        {lesson.lesson_date && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <FiClock size={18} style={{ color: '#7c3aed' }} />
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>
                Dars sanasi
              </p>
              <p style={{ margin: 0, fontSize: '14px', color: '#1f2937', fontWeight: 500 }}>
                {lesson.lesson_date}
              </p>
            </div>
          </div>
        )}

        {/* Homework Section */}
        {homeworkId && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: '#fef3c7',
            borderRadius: '8px',
            border: '1px solid #fcd34d'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <FiBookOpen size={18} style={{ color: '#92400e' }} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#92400e' }}>
                Uyga vazifa
              </h3>
            </div>
            <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#78350f' }}>
              Bu dars uchun uyga vazifa mavjud. Vazifani topshirish uchun quyidagi tugmani bosing.
            </p>
            <button
              onClick={handleHomeworkClick}
              style={{
                padding: '10px 20px',
                backgroundColor: '#92400e',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#78350f';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#92400e';
              }}
            >
              Vazifani ko'rish
            </button>
          </div>
        )}
      </div>

      {/* Back to Lessons Link */}
      {groupId && (
        <Link
          to={`/groups/${groupId}/lessons`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            backgroundColor: 'white',
            color: '#7c3aed',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#f9fafb';
            e.target.style.borderColor = '#7c3aed';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'white';
            e.target.style.borderColor = '#e5e7eb';
          }}
        >
          <FiArrowLeft size={16} />
          Barcha darslarga qaytish
        </Link>
      )}
    </div>
  );
};

export default LessonDetail;
