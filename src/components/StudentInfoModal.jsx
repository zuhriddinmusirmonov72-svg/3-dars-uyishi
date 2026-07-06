import React from 'react';
import { FiX } from 'react-icons/fi';

const StudentInfoModal = ({ student, onClose }) => {
  if (!student) return null;

  const fullName = student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || '—';
  const phone = student.phone || '—';
  const email = student.email || '—';
  const address = student.address || '—';
  const photo = student.photo || student.image || null;
  const photoUrl = photo && photo.startsWith('http') ? photo : photo ? `https://najot-edu.softwareengineer.uz/files/${String(photo).split('/').pop()}` : null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10002,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '520px', maxWidth: '100%', background: '#fff', borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)', padding: 20, position: 'relative'
        }}
      >
        <button
          onClick={onClose}
          style={{ position: 'absolute', right: 12, top: 12, border: 'none', background: 'transparent', cursor: 'pointer' }}
          aria-label="close"
        >
          <FiX size={18} />
        </button>

        <h2 style={{ margin: '6px 0 18px', fontSize: 18, fontWeight: 700 }}>Talaba ma'lumotlari</h2>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#374151', fontSize: 20 }}>
            {photoUrl ? <img src={photoUrl} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{fullName}</div>
            <div style={{ marginTop: 6 }}>
              <span style={{ fontSize: 12, color: '#6b7280' }}>Holat</span>
              <div style={{ display: 'inline-block', marginLeft: 8, padding: '4px 8px', background: '#dcfce7', color: '#16a34a', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>Aktiv</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
          <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Telefon raqam</div>
            <div style={{ marginTop: 6, fontWeight: 600 }}>{phone}</div>
          </div>

          <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Email manzil</div>
            <div style={{ marginTop: 6, fontWeight: 600 }}>{email}</div>
          </div>

          <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Yashash manzili</div>
            <div style={{ marginTop: 6, fontWeight: 600 }}>{address}</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
          <button onClick={onClose} style={{ padding: '8px 14px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Yopish</button>
        </div>
      </div>
    </div>
  );
};

export default StudentInfoModal;
