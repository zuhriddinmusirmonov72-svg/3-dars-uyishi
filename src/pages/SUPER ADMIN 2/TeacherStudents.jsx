import { useState, useEffect, useContext } from 'react';
import { FiSearch, FiFilter, FiTrash2, FiEye, FiX, FiRefreshCw, FiUser, FiEdit2 } from 'react-icons/fi';
import { FaUserGraduate } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { studentsAPI, groupsAPI } from "../../api/api";
import { AppContext } from '../../context/AppContext';
import { useConfirm } from '../../components/ConfirmProvider';
import StudentInfoModal from '../../components/StudentInfoModal';

const TeacherStudents = () => {
  const { t } = useContext(AppContext);
  const [students, setStudents] = useState([]);
  const [archivedStudents, setArchivedStudents] = useState([]); // ✅ Arxiv talabalar
  const [activeTab, setActiveTab] = useState('active'); // ✅ 'active' yoki 'archive'
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGroupsModalOpen, setIsGroupsModalOpen] = useState(false); // ✅ Guruhlar modali
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    birth_date: '',
    password: '',
    group_id: '',
    photo: null, // ✅ Rasm fayli
  });

  // =============================================
  // 📡 TALABALAR RO'YXATINI OLISH
  // GET /api/v1/students
  // =============================================
  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const res = await studentsAPI.getAll(1, 100);
      console.log('Students response:', res.data);
      const data = res.data?.data || res.data || [];
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch xato:', err.response?.data || err.message);
      toast.error(t.studentsLoadError);
    } finally {
      setIsLoading(false);
    }
  };

  // =============================================
  // 📡 ARXIVLANGAN TALABALAR RO'YXATINI OLISH
  // GET /api/v1/students/archive
  // =============================================
  const fetchArchivedStudents = async () => {
    setIsLoading(true);
    try {
      const res = await studentsAPI.getArchive();
      console.log('Archived students response:', res.data);
      const data = res.data?.data || res.data || [];
      setArchivedStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Arxiv fetch xato:', err.response?.data || err.message);
      toast.error('Arxiv talabalarni yuklashda xato!');
    } finally {
      setIsLoading(false);
    }
  };

  // =============================================
  // 📡 GURUHLAR RO'YXATINI OLISH
  // GET /api/v1/groups/all
  // =============================================
  const fetchGroups = async () => {
    try {
      const res = await groupsAPI.getAll();
      console.log('Groups response:', res.data);
      const data = res.data?.data || res.data || [];
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Groups fetch xato:', err.response?.data || err.message);
    }
  };

  const confirm = useConfirm();

  useEffect(() => {
    if (activeTab === 'active') {
      fetchStudents();
    } else {
      fetchArchivedStudents();
    }
    fetchGroups();
  }, [activeTab]);

  // =============================================
  // ➕ YANGI TALABA QO'SHISH
  // POST /api/v1/students  (multipart/form-data)
  // =============================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.full_name || !form.phone || (!editingId && !form.password)) {
      toast.error(editingId ? 'Ism va telefon majburiy!' : 'Ism, telefon va parol majburiy!');
      return;
    }

    // ✅ Telefon: faqat oxirgi 9 raqam (998 siz)
    const rawPhone = form.phone.trim().replace(/\D/g, '');
    const phone = rawPhone.length > 9 ? rawPhone.slice(-9) : rawPhone;

    if (phone.length !== 9) {
      toast.error("Telefon raqam 9 ta raqamdan iborat bo'lishi kerak! Misol: 901234567");
      return;
    }

    // ✅ FormData (multipart/form-data) formatida yuborish
    const formData = new FormData();
    formData.append('full_name', form.full_name.trim());
    formData.append('phone', phone);
    if (form.password) formData.append('password', form.password.trim());
    
    // Ixtiyoriy maydonlar — faqat to'ldirilgan bo'lsagina yuboriladi
    if (form.email.trim()) formData.append('email', form.email.trim());
    if (form.address.trim()) formData.append('address', form.address.trim());
    if (form.birth_date) formData.append('birth_date', new Date(form.birth_date).toISOString());
    if (form.group_id) formData.append('group_id', form.group_id);
    if (form.photo) formData.append('photo', form.photo); // ✅ Rasm yuklash

    console.log('Yuborilayotgan FormData:');
    for (let [key, val] of formData.entries()) {
      console.log(`  ${key}: ${val}`);
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await studentsAPI.update(editingId, formData);
        toast.success("Talaba muvaffaqiyatli yangilandi!");
      } else {
        await studentsAPI.create(formData);
        toast.success("Talaba muvaffaqiyatli qo'shildi!");
      }
      resetForm();
      fetchStudents();
    } catch (err) {
      const errData = err.response?.data;
      console.log('=== XATO TAFSILOTI ===');
      console.log('Status:', err.response?.status);
      console.log('Full error:', errData);

      if (errData?.message && Array.isArray(errData.message)) {
        errData.message.forEach((m) => toast.error(m, { duration: 6000 }));
      } else if (errData?.message && typeof errData.message === 'string') {
        toast.error(errData.message, { duration: 6000 });
      } else {
        toast.error(errData?.error || err.message || 'Xato yuz berdi!', { duration: 6000 });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // =============================================
  // 🗑 TALABANI O'CHIRISH
  // DELETE /api/v1/students/:id
  // =============================================
  const handleDelete = async (id) => {
    const ok = await confirm();
    if (!ok) return;
    try {
      await studentsAPI.delete(id);
      toast.success("Talaba o'chirildi!");
      fetchStudents();
    } catch (err) {
      const errData = err.response?.data;
      const msg = Array.isArray(errData?.message)
        ? errData.message.join(', ')
        : errData?.message || "O'chirishda xato!";
      toast.error(msg);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm({ full_name: '', phone: '', email: '', address: '', birth_date: '', password: '', group_id: '', photo: null });
    setIsModalOpen(true);
  };

  const handleEdit = (student) => {
    setEditingId(student.id);
    const bDate = student.birth_date ? new Date(student.birth_date).toISOString().split('T')[0] : '';
    setForm({
      full_name: student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim(),
      phone: student.phone || '',
      email: student.email || '',
      address: student.address || '',
      birth_date: bDate,
      password: '', // Parolni o'zgartirish ixtiyoriy
      group_id: student.group?.id || student.group_id || '',
      photo: null, // Rasm yangilanmasa null
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setForm({ full_name: '', phone: '', email: '', address: '', birth_date: '', password: '', group_id: '', photo: null });
    setEditingId(null);
    setIsModalOpen(false);
  };

  // Qidiruv filtri
  const currentList = activeTab === 'active' ? students : archivedStudents;
  const filtered = currentList.filter((s) => {
    const name = s.full_name || `${s.first_name || ''} ${s.last_name || ''}`;
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.phone || '').includes(searchQuery)
    );
  });

  const getInitials = (s) => {
    const name = s.full_name || `${s.first_name || ''} ${s.last_name || ''}`;
    return name.trim().substring(0, 2).toUpperCase() || 'TL';
  };

  const getFullName = (s) =>
    s.full_name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || '—';

  return (
    <div className="page-container">
      {/* HEADER */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">{t.studentsTitle}</h1>
          <p className="page-subtitle" style={{ maxWidth: '600px', marginTop: '8px' }}>
            {t.studentsSubtitle}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => activeTab === 'active' ? fetchStudents() : fetchArchivedStudents()} 
            className="toolbar-btn" 
            title={t.refreshGroups}
          >
            <FiRefreshCw size={16} />
          </button>
          {activeTab === 'active' && (
            <button onClick={openAddModal} className="add-btn">
              {t.addStudent}
            </button>
          )}
        </div>
      </div>

      {/* STAT CARD */}
      <div className="stats-grid" style={{ marginBottom: '24px', gridTemplateColumns: '1fr' }}>
        <div className="group-stat-card" style={{ position: 'relative' }}>
          <div style={{ color: '#6b7280', marginBottom: '8px' }}>
            <FaUserGraduate size={20} />
          </div>
          <p className="stat-title" style={{ textAlign: 'left' }}>
            {activeTab === 'active' ? 'Jami talabalar' : 'Arxivlangan talabalar'}
          </p>
          <h3 className="stat-value">{currentList.length}</h3>
        </div>
      </div>

      {/* TABS - Faol va Arxiv */}
      <div style={{ 
        display: 'flex', 
        gap: '24px', 
        borderBottom: '2px solid #e5e7eb',
        marginBottom: '24px'
      }}>
        <button
          onClick={() => setActiveTab('active')}
          style={{
            padding: '12px 4px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'active' ? '700' : '500',
            fontSize: '15px',
            borderBottom: '2px solid',
            borderColor: activeTab === 'active' ? '#7c3aed' : 'transparent',
            color: activeTab === 'active' ? '#7c3aed' : '#6b7280',
            transition: 'all 0.2s',
            marginBottom: '-2px',
          }}
        >
          📚 Faol talabalar
        </button>
        <button
          onClick={() => setActiveTab('archive')}
          style={{
            padding: '12px 4px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'archive' ? '700' : '500',
            fontSize: '15px',
            borderBottom: '2px solid',
            borderColor: activeTab === 'archive' ? '#7c3aed' : 'transparent',
            color: activeTab === 'archive' ? '#7c3aed' : '#6b7280',
            transition: 'all 0.2s',
            marginBottom: '-2px',
          }}
        >
          📦 Arxiv
        </button>
      </div>

      {/* JADVAL */}
      <div className="content-card">
        <div className="table-toolbar">
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="toolbar-btn"><FiFilter /> Filters</button>
          </div>
          <div className="search-container">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Qidirish..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
              <div style={{
                width: '36px', height: '36px',
                border: '3px solid #e5e7eb',
                borderTopColor: '#7c3aed',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 12px',
              }} />
              Yuklanmoqda...
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '48px', paddingLeft: '24px' }}><input type="checkbox" /></th>
                  <th>F.I.SH</th>
                  <th>TELEFON</th>
                  <th>GURUH</th>
                  <th>QO'SHILGAN SANA</th>
                  <th style={{ textAlign: 'right', paddingRight: '24px' }}>AMALLAR</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                      <FiUser size={32} style={{ marginBottom: '8px', opacity: 0.4 }} />
                      <div>{searchQuery ? 'Natija topilmadi' : "Talabalar yo'q"}</div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <tr key={s.id}>
                      <td style={{ paddingLeft: '24px' }}><input type="checkbox" /></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            backgroundColor: '#059669', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '13px', fontWeight: 'bold', flexShrink: 0, overflow: 'hidden',
                          }}>
                            {s.photo
                              ? <img 
                                  src={s.photo.startsWith('http') ? s.photo : `https://najot-edu.softwareengineer.uz/files/${s.photo.split('/').pop()}`} 
                                  alt="" 
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                />
                              : getInitials(s)
                            }
                          </div>
                          <span style={{ fontWeight: '500' }}>{getFullName(s)}</span>
                        </div>
                      </td>
                      <td>{s.phone || '—'}</td>
                      <td>{s.group?.name || s.group_name || '—'}</td>
                      <td>
                        {s.created_at
                          ? new Date(s.created_at).toLocaleDateString('uz-UZ')
                          : s.createdAt
                            ? new Date(s.createdAt).toLocaleDateString('uz-UZ')
                            : '—'}
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                          <button
                            style={{ color: '#7c3aed', border: 'none', background: 'transparent', cursor: 'pointer' }}
                            title={t.view}
                            onClick={() => setSelectedStudent(s)}
                          >
                            <FiEye size={16} />
                          </button>
                          <button
                            style={{ color: '#3b82f6', border: 'none', background: 'transparent', cursor: 'pointer' }}
                            title={t.edit}
                            onClick={() => handleEdit(s)}
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button
                            style={{ color: '#ef4444', border: 'none', background: 'transparent', cursor: 'pointer' }}
                            title={t.delete}
                            onClick={() => handleDelete(s.id)}
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="pagination">
          <button className="toolbar-btn" style={{ fontSize: '12px' }}>&larr; Previous</button>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3].map((p, i) => (
              <button key={i} className={`page-btn ${p === 1 ? 'active' : ''}`}>{p}</button>
            ))}
          </div>
          <button className="toolbar-btn" style={{ fontSize: '12px' }}>Next &rarr;</button>
        </div>
      </div>

      {/* ===== DRAWER — TALABA QO'SHISH ===== */}
      <div
        className={`right-drawer-overlay ${isModalOpen ? 'open' : ''}`}
        onClick={resetForm}
      >
        <div
          className={`right-drawer ${isModalOpen ? 'open' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="drawer-header">
            <h2 className="drawer-title">{editingId ? "Talabani tahrirlash" : "Talaba qo'shish"}</h2>
            <button className="drawer-close" onClick={resetForm}>
              <FiX />
            </button>
          </div>

          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '20px' }}>
            Telefon: <strong>901234567</strong> formatida yozing (9 ta raqam, 998 siz).
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

            <div className="form-group">
              <label className="form-label">To'liq ism <span style={{ color: 'red' }}>*</span></label>
              <input
                type="text" required placeholder="Ali Karimov"
                className="form-input"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Telefon raqam <span style={{ color: 'red' }}>*</span></label>
              <input
                type="text" required placeholder="901234567"
                className="form-input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <small style={{ color: '#9ca3af', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                9 ta raqam kiriting: 901234567 (998 siz)
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">Parol {!editingId && <span style={{ color: 'red' }}>*</span>}</label>
              <input
                type="password" required={!editingId} placeholder={editingId ? "Yangi parol (ixtiyoriy)" : "Kamida 8 belgi"}
                className="form-input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <small style={{ color: '#9ca3af', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                {editingId ? "Agar parolni o'zgartirmoqchi bo'lmasangiz bo'sh qoldiring" : "Misol: Student123!"}
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">Email <span style={{ color: '#9ca3af', fontSize: '11px' }}>(ixtiyoriy)</span></label>
              <input
                type="email" placeholder="ali@gmail.com"
                className="form-input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Manzil <span style={{ color: '#9ca3af', fontSize: '11px' }}>(ixtiyoriy)</span></label>
              <input
                type="text" placeholder="Toshkent, Chilonzor"
                className="form-input"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tug'ilgan sana <span style={{ color: '#9ca3af', fontSize: '11px' }}>(ixtiyoriy)</span></label>
              <input
                type="date" placeholder="2000-01-01"
                className="form-input"
                value={form.birth_date}
                onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Guruh <span style={{ color: '#9ca3af', fontSize: '11px' }}>(ixtiyoriy)</span></label>
              
              {/* Tanlangan guruh ko'rsatiladi */}
              {form.group_id && (
                <div style={{
                  marginBottom: '8px',
                  padding: '8px',
                  background: '#f9fafb',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#374151'
                }}>
                  <strong>Tanlangan:</strong> {(() => {
                    const group = groups.find(g => String(g.id) === String(form.group_id));
                    return group ? (group.name || group.group_name) : 'Noma\'lum guruh';
                  })()}
                </div>
              )}
              
              <button
                type="button"
                onClick={() => setIsGroupsModalOpen(true)}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  background: '#fff',
                  color: '#7c3aed',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f9fafb';
                  e.currentTarget.style.borderColor = '#7c3aed';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fff';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                + Guruhga qo'shish
              </button>
            </div>

            {/* Profilga rasm yuklash */}
            <div className="form-group">
              <label className="form-label">{t.photo} <span style={{ color: '#9ca3af', fontSize: '11px' }}>{t.photoOptional}</span></label>
              
              {/* Rasm preview */}
              {form.photo && (
                <div style={{
                  marginBottom: '12px',
                  display: 'flex',
                  justifyContent: 'center',
                }}>
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '3px solid #e5e7eb',
                    position: 'relative',
                  }}>
                    <img
                      src={URL.createObjectURL(form.photo)}
                      alt="Preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, photo: null })}
                      style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        fontWeight: 'bold',
                      }}
                      title={t.delete}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
              
              {/* Drag and drop rasm yuklash */}
              <div
                style={{
                  border: '2px dashed #d1d5db',
                  borderRadius: '12px',
                  padding: '32px 24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: '#f9fafb',
                }}
                onClick={() => document.getElementById('photo-upload').click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = '#7c3aed';
                  e.currentTarget.style.background = '#f0fdf4';
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.background = '#f9fafb';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.background = '#f9fafb';
                  
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    // Fayl turini tekshirish
                    if (!file.type.match('image/jpeg') && !file.type.match('image/png') && !file.type.match('image/jpg')) {
                      alert(t.fileFormat);
                      return;
                    }
                    // Hajmni tekshirish (max 2MB)
                    if (file.size > 2 * 1024 * 1024) {
                      alert(t.maxSizeError);
                      return;
                    }
                    setForm({ ...form, photo: file });
                  }
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  margin: '0 auto 16px',
                  borderRadius: '50%',
                  background: '#e0e7ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p style={{
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                }}>
                  {t.clickToUpload}
                </p>
                <p style={{
                  margin: '0',
                  fontSize: '12px',
                  color: '#9ca3af',
                }}>
                  {t.fileFormat}
                </p>
              </div>
              {/* Rasm yuklash input */}
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                id="photo-upload"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Fayl turini tekshirish
                    if (!file.type.match('image/jpeg') && !file.type.match('image/png') && !file.type.match('image/jpg')) {
                      alert(t.fileFormat);
                      return;
                    }
                    // Hajmni tekshirish (max 2MB)
                    if (file.size > 2 * 1024 * 1024) {
                      alert(t.maxSizeError);
                      return;
                    }
                    setForm({ ...form, photo: file });
                  }
                }}
              />
              
              {/* Bottom upload button removed — using drag-and-drop area above */}
              <small style={{ color: '#9ca3af', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                JPG, PNG yoki GIF. Maksimal hajm: 5MB
              </small>
            </div>

            <div style={{
              display: 'flex', justifyContent: 'space-between',
              marginTop: 'auto', paddingTop: '24px',
              borderTop: '1px solid #f3f4f6',
            }}>
              <button
                type="button" onClick={resetForm}
                className="btn-secondary" style={{ width: '48%' }}
              >
                Bekor qilish
              </button>
              <button
                type="submit" disabled={isSubmitting}
                className="btn-primary"
                style={{ width: '48%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
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
                ) : 'Saqlash'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ===== GURUHLAR MODAL ===== */}
      {isGroupsModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
          }}
          onClick={() => setIsGroupsModalOpen(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '24px',
              width: '460px',
              maxWidth: '90%',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                Guruhga qo'shish
              </h3>
              <button
                onClick={() => setIsGroupsModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '4px'
                }}
              >
                <FiX size={20} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
              Bitta guruhni tanlang
            </p>

            {/* Qidiruv */}
            <div className="search-container" style={{ marginBottom: '16px' }}>
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Guruh qidirish..."
                className="search-input"
              />
            </div>

            {/* Guruhlar ro'yxati */}
            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              maxHeight: '300px',
              overflowY: 'auto',
              padding: '12px',
              flex: 1,
            }}>
              {groups.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                  Guruhlar yuklanmadi
                </p>
              ) : (
                <>
                  {/* Bo'sh guruh opsiyasi */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      transition: 'background 0.2s ease',
                      marginBottom: '8px',
                      borderBottom: '1px solid #f3f4f6',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <input
                      type="radio"
                      name="group_select"
                      checked={!form.group_id}
                      onChange={() => setForm({ ...form, group_id: '' })}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '14px', color: '#6b7280', fontStyle: 'italic' }}>
                      Guruhsiz
                    </span>
                  </label>
                  
                  {groups.map((g) => (
                    <label
                      key={g.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        transition: 'background 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f9fafb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <input
                        type="radio"
                        name="group_select"
                        checked={String(form.group_id) === String(g.id)}
                        onChange={() => setForm({ ...form, group_id: g.id })}
                        style={{ cursor: 'pointer' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', color: '#111827', fontWeight: '600' }}>
                          {g.name || g.group_name}
                        </div>
                        {(g.course?.name || g.course_name) && (
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                            {g.course?.name || g.course_name}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </>
              )}
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setIsGroupsModalOpen(false)}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={() => setIsGroupsModalOpen(false)}
                className="btn-primary"
                style={{ flex: 1 }}
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== STUDENT INFO MODAL ===== */}
      {selectedStudent && (
        <StudentInfoModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      )}
    </div>
  );
};

export default TeacherStudents;
