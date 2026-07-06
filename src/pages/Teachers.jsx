import { useState, useEffect, useContext } from 'react';
import { FiSearch, FiFilter, FiTrash2, FiEye, FiX, FiRefreshCw, FiUser, FiEdit2 } from 'react-icons/fi';
import { FaUserGraduate } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { teachersAPI, groupsAPI } from '../api/api';
import { AppContext } from '../context/AppContext';
import { useConfirm } from '../components/ConfirmProvider';

const Teachers = () => {
  const { t } = useContext(AppContext);
  const [teachers, setTeachers] = useState([]);
  const [archivedTeachers, setArchivedTeachers] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    selectedGroupIds: [],
    password: '',
    photo: null,
  });

  const [availableGroups, setAvailableGroups] = useState([]);
  const [isGroupPickerOpen, setIsGroupPickerOpen] = useState(false);
  const [groupSearch, setGroupSearch] = useState('');
  const [tempSelectedGroups, setTempSelectedGroups] = useState([]);

  const fetchTeachers = async () => {
    setIsLoading(true);
    try {
      const res = await teachersAPI.getAll();
      const data = res.data?.data || res.data || [];
      setTeachers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch xato:', err.response?.data || err.message);
      toast.error('O\'qituvchilarni yuklashda xato!');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchArchivedTeachers = async () => {
    setIsLoading(true);
    try {
      const res = await teachersAPI.getArchive();
      const data = res.data?.data || res.data || [];
      setArchivedTeachers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Arxiv fetch xato:', err.response?.data || err.message);
      toast.error('Arxiv o\'qituvchilarni yuklashda xato!');
    } finally {
      setIsLoading(false);
    }
  };

  const confirm = useConfirm();

  useEffect(() => {
    if (activeTab === 'active') {
      fetchTeachers();
    } else {
      fetchArchivedTeachers();
    }
  }, [activeTab]);

  const fetchAvailableGroups = async () => {
    try {
      const res = await groupsAPI.getAll();
      const data = res.data?.data || res.data || [];
      setAvailableGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Guruhlarni yuklashda xato:', err);
    }
  };

  const openGroupPicker = () => {
    if (availableGroups.length === 0) {
      fetchAvailableGroups();
    }
    setTempSelectedGroups([...form.selectedGroupIds]);
    setGroupSearch('');
    setIsGroupPickerOpen(true);
  };

  const saveGroupSelection = () => {
    setForm({ ...form, selectedGroupIds: tempSelectedGroups });
    setIsGroupPickerOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.full_name || !form.phone || (!editingId && !form.password)) {
      toast.error(editingId ? 'Ism va telefon majburiy!' : 'Ism, telefon va parol majburiy!');
      return;
    }

    const rawPhone = form.phone.trim().replace(/\D/g, '');
    const phone = rawPhone.length > 9 ? rawPhone.slice(-9) : rawPhone;

    if (phone.length !== 9) {
      toast.error("Telefon raqam 9 ta raqamdan iborat bo'lishi kerak! Misol: 901234567");
      return;
    }

    const formData = new FormData();
    formData.append('full_name', form.full_name.trim());
    formData.append('phone', phone);
    if (form.password) formData.append('password', form.password.trim());
    
    if (form.email.trim()) formData.append('email', form.email.trim());
    if (form.address.trim()) formData.append('address', form.address.trim());
    
    form.selectedGroupIds.forEach(id => formData.append('groups[]', id));
    if (form.photo) formData.append('photo', form.photo);

    setIsSubmitting(true);
    try {
      if (editingId) {
        await teachersAPI.update(editingId, formData);
        toast.success("O'qituvchi muvaffaqiyatli yangilandi!");
      } else {
        await teachersAPI.create(formData);
        toast.success("O'qituvchi muvaffaqiyatli qo'shildi!");
      }
      resetForm();
      fetchTeachers();
    } catch (err) {
      const errData = err.response?.data;
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

  const handleDelete = async (id) => {
    const ok = await confirm();
    if (!ok) return;
    try {
      await teachersAPI.delete(id);
      toast.success("O'qituvchi o'chirildi!");
      if (activeTab === 'active') fetchTeachers();
      else fetchArchivedTeachers();
    } catch (err) {
      toast.error("O'chirishda xato!");
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm({ full_name: '', phone: '', email: '', address: '', selectedGroupIds: [], password: '', photo: null });
    setIsModalOpen(true);
  };

  const handleEdit = (teacher) => {
    setEditingId(teacher.id);
    const groupsList = Array.isArray(teacher.groups) 
      ? teacher.groups.map(g => typeof g === 'object' ? g.id : g)
      : [];
    setForm({
      full_name: teacher.full_name || `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim(),
      phone: teacher.phone || '',
      email: teacher.email || '',
      address: teacher.address || '',
      selectedGroupIds: groupsList,
      password: '',
      photo: null,
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setForm({ full_name: '', phone: '', email: '', address: '', selectedGroupIds: [], password: '', photo: null });
    setEditingId(null);
    setIsModalOpen(false);
  };

  const currentList = activeTab === 'active' ? teachers : archivedTeachers;
  const filtered = currentList.filter((t) => {
    const name = t.full_name || `${t.first_name || ''} ${t.last_name || ''}`;
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.phone || '').includes(searchQuery)
    );
  });

  const getInitials = (t) => {
    const name = t.full_name || `${t.first_name || ''} ${t.last_name || ''}`;
    return name.trim().substring(0, 2).toUpperCase() || 'OQ';
  };

  const getFullName = (t) =>
    t.full_name || `${t.first_name || ''} ${t.last_name || ''}`.trim() || '—';

  return (
    <div className="page-container">
      {/* HEADER */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">O'qituvchilar</h1>
          <p className="page-subtitle" style={{ maxWidth: '600px', marginTop: '8px' }}>
            O'qituvchilar ro'yxati va ularni boshqarish
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => activeTab === 'active' ? fetchTeachers() : fetchArchivedTeachers()} 
            className="toolbar-btn" 
            title="Yangilash"
          >
            <FiRefreshCw size={16} />
          </button>
          {activeTab === 'active' && (
            <button onClick={openAddModal} className="add-btn">
              + O'qituvchi qo'shish
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
            {activeTab === 'active' ? 'Faol o\'qituvchilar' : 'Arxivlangan o\'qituvchilar'}
          </p>
          <h3 className="stat-value">{currentList.length}</h3>
        </div>
      </div>

      {/* TABS */}
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
          👨‍🏫 Faol o'qituvchilar
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
              Yuklanmoqda...
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '48px', paddingLeft: '24px' }}><input type="checkbox" /></th>
                  <th>F.I.SH</th>
                  <th>TELEFON</th>
                  <th>QO'SHILGAN SANA</th>
                  <th style={{ textAlign: 'right', paddingRight: '24px' }}>AMALLAR</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                      <FiUser size={32} style={{ marginBottom: '8px', opacity: 0.4 }} />
                      <div>O'qituvchilar topilmadi</div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => (
                    <tr key={t.id}>
                      <td style={{ paddingLeft: '24px' }}><input type="checkbox" /></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            backgroundColor: '#059669', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '13px', fontWeight: 'bold', flexShrink: 0, overflow: 'hidden',
                          }}>
                            {t.photo
                              ? <img 
                                  src={t.photo.startsWith('http') ? t.photo : `https://najot-edu.softwareengineer.uz/files/${t.photo.split('/').pop()}`} 
                                  alt="" 
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                />
                              : getInitials(t)
                            }
                          </div>
                          <span style={{ fontWeight: '500' }}>{getFullName(t)}</span>
                        </div>
                      </td>
                      <td>{t.phone || '—'}</td>
                      <td>
                        {t.created_at
                          ? new Date(t.created_at).toLocaleDateString('uz-UZ')
                          : '—'}
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                          <button
                            style={{ color: '#3b82f6', border: 'none', background: 'transparent', cursor: 'pointer' }}
                            title="Tahrirlash"
                            onClick={() => handleEdit(t)}
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button
                            style={{ color: '#ef4444', border: 'none', background: 'transparent', cursor: 'pointer' }}
                            title="O'chirish"
                            onClick={() => handleDelete(t.id)}
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
      </div>

      {/* ===== DRAWER — O'QITUVCHI QO'SHISH ===== */}
      <div
        className={`right-drawer-overlay ${isModalOpen ? 'open' : ''}`}
        onClick={resetForm}
      >
        <div
          className={`right-drawer ${isModalOpen ? 'open' : ''}`}
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: '480px' }}
        >
          <div className="drawer-header">
            <h2 className="drawer-title">{editingId ? "O'qituvchini tahrirlash" : "O'qituvchi qo'shish"}</h2>
            <button className="drawer-close" onClick={resetForm}>
              <FiX />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '24px', gap: '16px', overflowY: 'auto' }}>

            {/* TO'LIQ ISM */}
            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', color: '#374151', marginBottom: '6px' }}>
                To'liq ism <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text" required placeholder="Ali Karimov"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #d1d5db', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                onFocus={e => e.target.style.borderColor = '#7c3aed'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* TELEFON */}
            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', color: '#374151', marginBottom: '6px' }}>
                Telefon raqam <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text" required placeholder="901234567 (9 raqam)"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #d1d5db', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                onFocus={e => e.target.style.borderColor = '#7c3aed'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'}
              />
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9ca3af' }}>Misol: 901234567 (998 siz)</p>
            </div>

            {/* PAROL */}
            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', color: '#374151', marginBottom: '6px' }}>
                Parol {!editingId && <span style={{ color: '#ef4444' }}>*</span>}
              </label>
              <input
                type="password"
                required={!editingId}
                placeholder={editingId ? "Yangi parol (ixtiyoriy)" : "Parolni kiriting"}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #d1d5db', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onFocus={e => e.target.style.borderColor = '#7c3aed'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* EMAIL */}
            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', color: '#374151', marginBottom: '6px' }}>
                Email (ixtiyoriy)
              </label>
              <input
                type="email" placeholder="example@gmail.com"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #d1d5db', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onFocus={e => e.target.style.borderColor = '#7c3aed'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* MANZIL */}
            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', color: '#374151', marginBottom: '6px' }}>
                Manzil (ixtiyoriy)
              </label>
              <input
                type="text" placeholder="Toshkent, Chilonzor"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #d1d5db', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                onFocus={e => e.target.style.borderColor = '#7c3aed'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* GURUHLAR */}
            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', color: '#374151', marginBottom: '6px' }}>
                Guruhlar
              </label>
              <button
                type="button"
                onClick={openGroupPicker}
                style={{
                  width: '100%', padding: '12px', background: '#fff', border: '1.5px solid #d1d5db',
                  borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
              >
                <span style={{ color: form.selectedGroupIds.length > 0 ? '#111827' : '#9ca3af', fontSize: '14px' }}>
                  {form.selectedGroupIds.length > 0 
                    ? `${form.selectedGroupIds.length} ta guruh tanlandi`
                    : "Guruhga qo'shish"}
                </span>
                <FiEdit2 size={16} color="#6b7280" />
              </button>
            </div>

            {/* SURATI — Drag & Drop uslubida, eng pastda */}
            <div>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', color: '#374151', marginBottom: '8px' }}>
                Surati <span style={{ color: '#9ca3af', fontWeight: '400' }}>(ixtiyoriy)</span>
              </label>
              <label
                htmlFor="teacher-photo-upload"
                style={{
                  display: 'block',
                  border: '2px dashed #d1d5db',
                  borderRadius: '12px',
                  padding: '28px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: form.photo ? '#f5f3ff' : '#fafafa',
                  transition: 'all 0.2s ease',
                  borderColor: form.photo ? '#7c3aed' : '#d1d5db',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#7c3aed';
                  e.currentTarget.style.background = '#f5f3ff';
                }}
                onMouseLeave={e => {
                  if (!form.photo) {
                    e.currentTarget.style.borderColor = '#d1d5db';
                    e.currentTarget.style.background = '#fafafa';
                  }
                }}
              >
                {form.photo ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <img
                      src={URL.createObjectURL(form.photo)}
                      alt="preview"
                      style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #7c3aed' }}
                    />
                    <span style={{ fontSize: '13px', color: '#7c3aed', fontWeight: '600' }}>
                      ✓ {form.photo.name}
                    </span>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                      Boshqa rasm tanlash uchun bosing
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                        Fayl yuklash uchun ustiga bosing yoki shu
                      </p>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                        yerga sudrab olib keling
                      </p>
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
                      JPG yoki PNG (maks. 2 MB)
                    </p>
                  </div>
                )}
                <input
                  id="teacher-photo-upload"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => setForm({ ...form, photo: e.target.files[0] || null })}
                />
              </label>
              {form.photo && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, photo: null })}
                  style={{ marginTop: '8px', fontSize: '12px', color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', padding: '0' }}
                >
                  ✕ Rasmni olib tashlash
                </button>
              )}
              <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                JPG, PNG yoki GIF. Maksimal hajm: 5MB
              </p>
            </div>

            {/* TUGMALAR */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="button" onClick={resetForm}
                style={{ flex: 1, padding: '11px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', color: '#374151' }}
              >
                Bekor qilish
              </button>
              <button
                type="submit" disabled={isSubmitting}
                style={{ flex: 1, padding: '11px', background: isSubmitting ? '#a78bfa' : 'linear-gradient(135deg, #7c3aed, #a855f7)', color: 'white', border: 'none', borderRadius: '8px', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '14px' }}
              >
                {isSubmitting ? 'Saqlanmoqda...' : (editingId ? 'Yangilash' : "Qo'shish")}
              </button>
            </div>
          </form>
        </div>
      </div>
      {/* ===== MODAL — GURUH TANLASH ===== */}
      {isGroupPickerOpen && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)', zIndex: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }} onClick={() => setIsGroupPickerOpen(false)}>
          <div style={{
            background: '#fff', borderRadius: '16px',
            width: '100%', maxWidth: '480px', maxHeight: '80vh',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Guruhga qo'shish</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>Bitta yoki nechta guruhni tanlang</p>
              </div>
              <button onClick={() => setIsGroupPickerOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}>
                <FiX size={20} color="#6b7280" />
              </button>
            </div>
            
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{
                display: 'flex', alignItems: 'center', background: '#f9fafb',
                border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0 12px'
              }}>
                <FiSearch color="#9ca3af" />
                <input
                  type="text"
                  placeholder="Guruh qidirish..."
                  style={{ width: '100%', padding: '12px', border: 'none', background: 'transparent', outline: 'none', fontSize: '14px' }}
                  value={groupSearch}
                  onChange={(e) => setGroupSearch(e.target.value)}
                />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px' }}>
              {availableGroups
                .filter(g => (g.name || '').toLowerCase().includes(groupSearch.toLowerCase()))
                .map((g) => {
                  const isSelected = tempSelectedGroups.includes(g.id);
                  return (
                    <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          if (isSelected) setTempSelectedGroups(prev => prev.filter(id => id !== g.id));
                          else setTempSelectedGroups(prev => [...prev, g.id]);
                        }}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '15px', color: '#374151', fontWeight: '500' }}>
                        {g.name}
                      </span>
                    </label>
                  );
                })
              }
            </div>

            <div style={{ padding: '20px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setIsGroupPickerOpen(false)}
                style={{ flex: 1, padding: '12px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
              >
                Bekor qilish
              </button>
              <button
                onClick={saveGroupSelection}
                style={{ flex: 1, padding: '12px', background: '#9333ea', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teachers;
