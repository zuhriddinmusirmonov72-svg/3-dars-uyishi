import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiClock, FiVideo, FiBookOpen, FiAlertCircle, FiRefreshCw } from "react-icons/fi";
import toast from "react-hot-toast";

import { lessonsAPI, parseApiError } from "../../api/api";
import { getStatusBadgeStyle } from "../../utils/statusColors";

/**
 * @typedef {Object} Lesson
 * @property {number} id
 * @property {string} topic
 * @property {string} created_at
 * @property {string} status
 * @property {number} videoCount
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
 * Lessons Page Component
 * Displays all lessons for a student's group with modern design
 */
const TeacherLessons = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch lessons from API
   */
  const fetchLessons = async () => {
    if (!groupId) {
      setError('Guruh ID topilmadi');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching lessons for groupId:', groupId);
      // Teacher endpointini ishlatamiz - o'z guruhlari darslari uchun
      const response = await lessonsAPI.getMyGroupLessons(groupId);
      console.log('API Response:', response);
      
      // Parse data from response
      const data = response.data?.data || response.data || [];
      console.log('Parsed data:', data);
      
      if (Array.isArray(data)) {
        setLessons(data);
        console.log('✅ Lessons set successfully:', data.length, 'lessons');
      } else if (data && typeof data === 'object') {
        setLessons([data]);
        console.log('✅ Single lesson set');
      } else {
        setLessons([]);
        console.log('❌ No lessons found');
      }
    } catch (err) {
      console.error('Lessons fetch error:', err);
      const errorMessage = await parseApiError(err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, [groupId]);

  /**
   * Handle lesson card click
   * @param {Lesson} lesson 
   */
  const handleLessonClick = (lesson) => {
    navigate(`/lessons/${lesson.id}`);
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
          <button
            onClick={fetchLessons}
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
    );
  }

  // Empty State
  if (lessons.length === 0) {
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
          <h2 style={{ margin: 0, color: '#1f2937', fontSize: '20px' }}>Darslar mavjud emas</h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
            Hozircha bu guruhda darslar yaratilmagan
          </p>
        </div>
      </div>
    );
  }

  // Lessons List
  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Darslar</h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
            Jami: {lessons.length} ta dars
          </p>
        </div>
        <button
          onClick={fetchLessons}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#7c3aed',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background 0.2s',
            opacity: loading ? 0.6 : 1
          }}
          onMouseEnter={(e) => {
            if (!loading) e.target.style.backgroundColor = '#6d28d9';
          }}
          onMouseLeave={(e) => {
            if (!loading) e.target.style.backgroundColor = '#7c3aed';
          }}
        >
          <FiRefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Yangilash
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '24px'
      }}>
        {lessons.map((lesson) => {
          const statusBadgeStyle = getStatusBadgeStyle(lesson.status);
          
          return (
            <div
              key={lesson.id}
              onClick={() => handleLessonClick(lesson)}
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.15)';
                e.currentTarget.style.borderColor = '#7c3aed';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              {/* Status Badge */}
              {lesson.status && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  marginBottom: '16px',
                  ...statusBadgeStyle
                }}>
                  {lesson.status}
                </div>
              )}

              {/* Topic */}
              <h3 style={{
                margin: '0 0 16px 0',
                fontSize: '18px',
                fontWeight: 700,
                color: '#1f2937',
                lineHeight: 1.4,
                minHeight: '50px'
              }}>
                {lesson.topic || 'Nomsiz dars'}
              </h3>

              {/* Info Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '16px'
              }}>
                {/* Created At */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  color: '#6b7280'
                }}>
                  <FiClock size={16} style={{ color: '#7c3aed' }} />
                  <span style={{ fontSize: '12px' }}>{formatDate(lesson.created_at)}</span>
                </div>

                {/* Video Count */}
                {lesson.videoCount !== undefined && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: '#6b7280'
                  }}>
                    <FiVideo size={16} style={{ color: '#7c3aed' }} />
                    <span style={{ fontSize: '12px' }}>{lesson.videoCount} ta video</span>
                  </div>
                )}
              </div>

              {/* Hover Indicator */}
              <div style={{
                position: 'absolute',
                bottom: '0',
                left: '0',
                right: '0',
                height: '3px',
                background: 'linear-gradient(90deg, #7c3aed, #a855f7)',
                transform: 'scaleX(0)',
                transition: 'transform 0.3s ease',
                transformOrigin: 'left'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scaleX(1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scaleX(0)';
              }}
            />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeacherLessons;
