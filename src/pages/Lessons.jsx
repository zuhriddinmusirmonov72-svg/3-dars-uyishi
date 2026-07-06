import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { lessonsAPI, parseApiError } from '../api/api';

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '-';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getStatusColor = (status) => {
  const s = String(status || 'Berilmagan').toUpperCase();
  if (s.includes('QABUL')) return '#22c55e'; // Green
  if (s.includes('QAYTARILGAN')) return '#f59e0b'; // Orange
  if (s.includes('KUTILMOQDA') || s.includes('PENDING')) return '#3b82f6'; // Blue
  if (s.includes('BAJARILMAGAN') || s.includes('BAJARMAGANLAR')) return '#ef4444'; // Red
  return '#6b7280'; // Gray (Berilmagan)
};

const formatStatus = (status) => {
  if (!status) return 'Berilmagan';
  // Capitalize first letter, lower rest just in case, or leave as is
  return status;
};

const Lessons = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLessons = async () => {
    if (!groupId) {
      setError('Guruh ID topilmadi');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await lessonsAPI.getGroupLessonsAll(groupId);
      const data = response.data?.data || response.data || [];
      
      if (Array.isArray(data)) {
        setLessons(data);
      } else if (data && typeof data === 'object') {
        setLessons([data]);
      } else {
        setLessons([]);
      }
    } catch (err) {
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

  if (loading) {
    return (
      <div className="page-container" style={{ background: '#f3f4f6', minHeight: '100vh', padding: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', border: '4px solid #e5e7eb', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Yuklanmoqda...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container" style={{ background: '#f3f4f6', minHeight: '100vh', padding: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px', padding: '40px', textAlign: 'center' }}>
          <FiAlertCircle size={48} style={{ color: '#ef4444' }} />
          <h2 style={{ margin: 0, color: '#1f2937', fontSize: '20px' }}>Xatolik yuz berdi</h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', maxWidth: '400px' }}>{error}</p>
          <button onClick={fetchLessons} style={{ padding: '12px 24px', backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiRefreshCw size={16} /> Qayta urinish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ padding: '32px', background: '#f3f4f6', minHeight: '100vh' }}>
      
      <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        
        {/* Card Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '20px 24px',
          borderBottom: '1px solid #f3f4f6'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
            Guruh - Darslar
          </h2>
          <button 
            onClick={() => navigate('/groups')}
            style={{ 
              padding: '8px 16px', 
              background: '#fff', 
              border: '1px solid #e5e7eb', 
              borderRadius: '6px', 
              color: '#4b5563',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
            onMouseLeave={(e) => e.target.style.background = '#fff'}
          >
            Yopish
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', padding: '0 24px 24px 24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '16px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                <th style={{ padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#6b7280', width: '50px' }}>#</th>
                <th style={{ padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>MAVZU</th>
                <th style={{ padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>UY VAZIFA STATUSI</th>
                <th style={{ padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>SANA</th>
                <th style={{ padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>VIDEOLAR</th>
              </tr>
            </thead>
            <tbody>
              {lessons.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                    Darslar topilmadi
                  </td>
                </tr>
              ) : (
                lessons.map((lesson, index) => {
                  const statusColor = getStatusColor(lesson.status);
                  
                  return (
                    <tr 
                      key={lesson.id} 
                      style={{ 
                        borderBottom: '1px solid #f3f4f6'
                      }}
                    >
                      <td style={{ padding: '16px 8px', fontSize: '14px', color: '#3b82f6' }}>
                        {index + 1}
                      </td>
                      <td style={{ padding: '16px 8px', fontSize: '14px', color: '#374151' }}>
                        {lesson.topic || 'Nomsiz dars'}
                      </td>
                      <td style={{ padding: '16px 8px', fontSize: '14px', fontWeight: '500', color: statusColor }}>
                        {formatStatus(lesson.status)}
                      </td>
                      <td style={{ padding: '16px 8px', fontSize: '14px', color: '#4b5563' }}>
                        {formatDate(lesson.created_at)}
                      </td>
                      <td style={{ padding: '16px 8px', fontSize: '14px', color: '#4b5563' }}>
                        {lesson.videoCount > 0 ? lesson.videoCount : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default Lessons;
