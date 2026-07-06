import { useState, useEffect } from 'react';
import { teachersAPI, API_BASE_URL } from "../../api/api";
import { FiMail, FiPhone, FiMapPin, FiCalendar } from 'react-icons/fi';
import { MdGroup } from 'react-icons/md';

const FILES_HOST = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

const TeacherProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await teachersAPI.getMyProfile();
        // Assuming response structure is standard
        const data = res.data?.data || res.data;
        setProfile(data);
      } catch (err) {
        console.error("Profile xatosi:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Yuklanmoqda...</div>;
  }

  if (!profile) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Profil ma'lumotlari topilmadi</div>;
  }

  // Extract fields
  const {
    first_name,
    last_name,
    phone,
    email,
    location,
    photo,
    created_at,
    groups
  } = profile;

  const fullName = `${first_name || ''} ${last_name || ''}`.trim() || 'Foydalanuvchi';
  const role = "O'qituvchi";
  
  // Format date
  const dateObj = new Date(created_at || Date.now());
  const regDate = `${String(dateObj.getDate()).padStart(2, '0')}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${dateObj.getFullYear()}`;

  // Photo URL
  let photoUrl = '';
  if (photo) {
    if (photo.startsWith('http')) {
      photoUrl = photo;
    } else {
      photoUrl = `${FILES_HOST}/files/${photo}`;
    }
  }

  return (
    <div className="page-container" style={{ padding: '24px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '24px' }}>Profil</h1>
      
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* Left Card - Avatar */}
        <div style={{ 
          width: '300px', 
          backgroundColor: '#fff', 
          borderRadius: '16px', 
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          {/* Green Header */}
          <div style={{ width: '100%', height: '120px', backgroundColor: '#10b981' }}></div>
          
          {/* Avatar Image */}
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            backgroundColor: '#e5e7eb',
            marginTop: '-60px',
            border: '4px solid #fff',
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '32px',
            fontWeight: 600,
            color: '#6b7280'
          }}>
            {photoUrl ? (
              <img src={photoUrl} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              first_name?.charAt(0) || 'U'
            )}
          </div>
          
          {/* Name & Role */}
          <div style={{ textAlign: 'center', padding: '20px', width: '100%' }}>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#111827' }}>{fullName}</h2>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>{role}</p>
          </div>
        </div>

        {/* Right Card - Details */}
        <div style={{ 
          flex: 1, 
          minWidth: '400px',
          backgroundColor: '#fff', 
          borderRadius: '16px', 
          padding: '24px 32px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
        }}>
          
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: '0 0 24px' }}>Shaxsiy ma'lumotlar</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            
            {/* Email */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ color: '#10b981', fontSize: '20px', marginTop: '2px' }}><FiMail /></div>
              <div>
                <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>Email</p>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#374151', wordBreak: 'break-all' }}>{email || '—'}</p>
              </div>
            </div>
            
            {/* Phone */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ color: '#10b981', fontSize: '20px', marginTop: '2px' }}><FiPhone /></div>
              <div>
                <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>Telefon raqam</p>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#374151' }}>{phone || '—'}</p>
              </div>
            </div>
            
            {/* Location */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ color: '#10b981', fontSize: '20px', marginTop: '2px' }}><FiMapPin /></div>
              <div>
                <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>Manzil</p>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#374151' }}>{location || 'Tashkent'}</p>
              </div>
            </div>
            
            {/* Reg Date */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ color: '#10b981', fontSize: '20px', marginTop: '2px' }}><FiCalendar /></div>
              <div>
                <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>Ro'yxatdan o'tgan sana</p>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#374151' }}>{regDate}</p>
              </div>
            </div>

          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '0 0 24px' }} />

          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Guruhlar</h3>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {groups && groups.length > 0 ? (
              groups.map((g, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  padding: '6px 12px', 
                  backgroundColor: '#ecfdf5', 
                  borderRadius: '6px',
                  color: '#059669',
                  fontWeight: 600,
                  fontSize: '14px'
                }}>
                  <MdGroup size={16} />
                  <span>{g.name || `Guruh ${g.id || ''}`}</span>
                </div>
              ))
            ) : (
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Guruhlar mavjud emas</p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default TeacherProfile;
