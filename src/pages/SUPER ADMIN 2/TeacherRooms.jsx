import { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { roomsAPI } from '../../api/api';

const TeacherRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', capacity: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // O'chirish modali uchun state
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, room: null });

  // Backend dan xonalarni yuklash
  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const response = await roomsAPI.getAll();
      
      // Response structurani to'g'ri parse qilish
      let roomsData = [];
      
      if (response && response.data) {
        // data ichida data bor
        if (response.data.data) {
          roomsData = Array.isArray(response.data.data) ? response.data.data : [];
        } 
        // to'g'ridan to'g'ri data massiv
        else if (Array.isArray(response.data)) {
          roomsData = response.data;
        }
      }
      
      console.log('✅ Xonalar yuklandi:', roomsData);
      setRooms(roomsData);
      
      if (roomsData.length === 0) {
        toast.success('Xonalar yo\'q. Yangi xona qo\'shing!');
      }
    } catch (error) {
      console.error('❌ Xatolik:', error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        if (error.response.status === 401) {
          toast.error('Login qiling!');
          window.location.href = '/login';
        } else {
          toast.error(error.response.data?.message || 'Xonalarni yuklab bo\'lmadi!');
        }
      } else if (error.request) {
        console.error('Request:', error.request);
        toast.error('Serverga ulanib bo\'lmadi!');
      } else {
        toast.error('Xato: ' + error.message);
      }
      
      setRooms([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newRoom.name?.trim() || !newRoom.capacity) {
      toast.error('Barcha maydonlarni to\'ldiring!');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: newRoom.name.trim(),
        capacity: Number(newRoom.capacity)
      };

      if (editingRoom) {
        await roomsAPI.update(editingRoom.id, payload);
        toast.success('Xona yangilandi!');
      } else {
        await roomsAPI.create(payload);
        toast.success('Xona qo\'shildi!');
      }

      handleCloseModal();
      fetchRooms();
    } catch (error) {
      console.error('Saqlashda xato:', error);
      toast.error(error.response?.data?.message || 'Xonani saqlab bo\'lmadi!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setNewRoom({ 
      name: room.name, 
      capacity: String(room.capacity || room.max_capacity || '')
    });
    setIsModalOpen(true);
  };

  const confirmDelete = (room) => {
    setDeleteModal({ isOpen: true, room });
  };

  const executeDelete = async () => {
    if (!deleteModal.room) return;
    try {
      await roomsAPI.delete(deleteModal.room.id);
      toast.success('Xona o\'chirildi!');
      fetchRooms();
    } catch (error) {
      console.error('O\'chirishda xato:', error);
      toast.error(error.response?.data?.message || 'Xonani o\'chirib bo\'lmadi!');
    } finally {
      setDeleteModal({ isOpen: false, room: null });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewRoom({ name: '', capacity: '' });
    setEditingRoom(null);
  };

  // Qidiruv
  const filteredRooms = rooms.filter(room => 
    room?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Xonalar ({rooms.length})</h1>
        <button onClick={() => setIsModalOpen(true)} className="add-btn">
          <span>+ Xona qo'shish</span>
        </button>
      </div>

      <div className="content-card">
        <div className="table-toolbar">
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="toolbar-btn" onClick={fetchRooms}>
              🔄 Yangilash
            </button>
          </div>
          <div className="search-container">
            <FiSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Xona qidirish..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
            <div style={{
              width: '40px', height: '40px',
              border: '4px solid #e5e7eb', borderTopColor: '#7c3aed',
              borderRadius: '50%', animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }} />
            <p>Xonalar yuklanmoqda...</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '50px', paddingLeft: '24px' }}>#</th>
                  <th>Xona Nomi</th>
                  <th>Sig'imi</th>
                  <th style={{ textAlign: 'right', paddingRight: '24px' }}>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
                      {searchTerm ? (
                        <div>
                          <p style={{ fontSize: '16px', marginBottom: '8px' }}>🔍 "{searchTerm}" topilmadi</p>
                          <button onClick={() => setSearchTerm('')} style={{ color: '#7c3aed', textDecoration: 'underline' }}>
                            Qidiruvni tozalash
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p style={{ fontSize: '16px', marginBottom: '8px' }}>📦 Xonalar yo'q</p>
                          <button onClick={() => setIsModalOpen(true)} className="add-btn" style={{ marginTop: '12px' }}>
                            + Birinchi xonani qo'shish
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredRooms.map((room, index) => (
                    <tr key={room.id}>
                      <td style={{ paddingLeft: '24px', color: '#9ca3af' }}>{index + 1}</td>
                      <td style={{ fontWeight: '600' }}>{room.name}</td>
                      <td>
                        <span style={{ 
                          padding: '4px 12px', 
                          borderRadius: '12px', 
                          background: '#f0fdf4', 
                          color: '#16a34a',
                          fontSize: '13px',
                          fontWeight: '600'
                        }}>
                          {room.capacity || room.max_capacity || 0} ta joy
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                          <button 
                            onClick={() => handleEdit(room)}
                            style={{ 
                              padding: '6px', 
                              color: '#7c3aed',
                              border: 'none',
                              background: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            <FiEdit2 size={18} />
                          </button>
                          <button 
                            onClick={() => confirmDelete(room)} 
                            style={{ 
                              padding: '6px',
                              color: '#ef4444',
                              border: 'none',
                              background: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL */}
      <div className={`right-drawer-overlay ${isModalOpen ? 'open' : ''}`} onClick={handleCloseModal}>
        <div className={`right-drawer ${isModalOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h2 className="drawer-title">{editingRoom ? 'Xonani tahrirlash' : 'Xona qo\'shish'}</h2>
              <button className="drawer-close" onClick={handleCloseModal}><FiX /></button>
            </div>
            
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '24px' }}>
              {editingRoom ? 'Xona ma\'lumotlarini o\'zgartiring' : 'Yangi xona ma\'lumotlarini kiriting'}
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div className="form-group">
                <label className="form-label">* Xona nomi</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Masalan: Autodesk, Adobe"
                  value={newRoom.name} 
                  onChange={e => setNewRoom({...newRoom, name: e.target.value})}
                  className="form-input"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">* Sig'imi (kishilar soni)</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  max="100"
                  placeholder="Masalan: 20"
                  value={newRoom.capacity} 
                  onChange={e => setNewRoom({...newRoom, capacity: e.target.value})}
                  className="form-input"
                  disabled={isSubmitting}
                />
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginTop: 'auto', 
                paddingTop: '24px', 
                borderTop: '1px solid #f3f4f6',
                gap: '12px'
              }}>
                <button 
                  type="button" 
                  onClick={handleCloseModal} 
                  className="btn-secondary" 
                  style={{ flex: 1 }}
                  disabled={isSubmitting}
                >
                  Bekor qilish
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div style={{ 
                        width: '16px', 
                        height: '16px', 
                        border: '2px solid rgba(255,255,255,0.3)', 
                        borderTopColor: '#fff', 
                        borderRadius: '50%', 
                        animation: 'spin 1s linear infinite' 
                      }} />
                      Saqlanmoqda...
                    </>
                  ) : (
                    editingRoom ? '✓ Yangilash' : '+ Qo\'shish'
                  )}
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
        }} onClick={() => setDeleteModal({ isOpen: false, room: null })}>
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
              "{deleteModal.room?.name}" xonasini o'chiryapsiz. Ushbu amolni ortga qaytarib bo'lmaydi.
            </p>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button
                onClick={() => setDeleteModal({ isOpen: false, room: null })}
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
                onClick={executeDelete}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  border: 'none', background: '#ef4444',
                  color: '#fff', fontSize: '15px', fontWeight: '600',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
                onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}
              >
                O'chirish
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

export default TeacherRooms;
