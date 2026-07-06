import React from 'react';

const TeachersModal = ({ isOpen, onClose, group }) => {
  if (!isOpen) return null;

  const teachers = group?.teachers || group?.teacher_list || [];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '700',
              color: '#1f2937',
            }}
          >
            GURUH
          </h2>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              backgroundColor: 'transparent',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '4px',
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {teachers.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '32px' }}>
              O'qituvchilar topilmadi
            </div>
          ) : (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: '#f9fafb',
                    borderBottom: '1px solid #e5e7eb',
                  }}
                >
                  <th
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                    }}
                  >
                    O'qituvchi
                  </th>
                  <th
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                    }}
                  >
                    Roli
                  </th>
                  <th
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                    }}
                  >
                    Dars kunlari
                  </th>
                  <th
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                    }}
                  >
                    Dars vaqti
                  </th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher, index) => (
                  <tr
                    key={teacher.id || index}
                    style={{ borderBottom: '1px solid #e5e7eb' }}
                  >
                    <td style={{ padding: '12px', fontSize: '14px', color: '#374151' }}>
                      {teacher.name ||
                        teacher.teacher_name ||
                        teacher.fullName ||
                        teacher.full_name ||
                        '-'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#374151' }}>
                      {teacher.role || teacher.position || teacher.type || '-'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#374151' }}>
                      {teacher.lesson_days ||
                        teacher.days ||
                        teacher.schedule_days ||
                        '-'}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#374151' }}>
                      {teacher.lesson_time ||
                        teacher.time ||
                        teacher.schedule_time ||
                        '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeachersModal;
