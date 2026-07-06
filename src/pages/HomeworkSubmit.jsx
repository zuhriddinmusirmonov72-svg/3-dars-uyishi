import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiUpload, FiX, FiCheckCircle, FiArrowLeft, FiFile, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { studentsAPI } from '../api/api';

const HomeworkSubmit = () => {
  const { homeworkId } = useParams();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [comment, setComment] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // =============================================
  // 📎 FAYL TANLASH
  // =============================================
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) setFile(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const removeFile = () => setFile(null);

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // =============================================
  // 📤 UY VAZIFASINI TOPSHIRISH
  // POST /api/v1/students/homeworkAnswer/{homeworkId}
  // =============================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file && !comment.trim()) {
      toast.error("Fayl yoki izoh kiritish shart!");
      return;
    }

    const formData = new FormData();
    if (file) formData.append('file', file);
    if (comment.trim()) formData.append('comment', comment.trim());

    console.log('Yuborilayotgan homework FormData:');
    for (let [key, val] of formData.entries()) {
      console.log(`  ${key}:`, val);
    }

    setIsSubmitting(true);
    try {
      const res = await studentsAPI.submitHomework(homeworkId, formData);
      console.log("Topshirildi:", res.data);
      toast.success("Uy vazifasi muvaffaqiyatli topshirildi! ✅");
      setSubmitted(true);
    } catch (err) {
      const errData = err.response?.data;
      console.log('=== XATO ===', err.response?.status, errData);

      if (errData?.message && Array.isArray(errData.message)) {
        errData.message.forEach((m) => toast.error(m, { duration: 6000 }));
      } else if (errData?.message) {
        toast.error(errData.message, { duration: 6000 });
      } else {
        toast.error(errData?.error || err.message || 'Xato yuz berdi!', { duration: 6000 });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // =============================================
  // ✅ MUVAFFAQIYAT EKRANI
  // =============================================
  if (submitted) {
    return (
      <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{
          textAlign: 'center', padding: '60px 40px',
          background: 'white', borderRadius: '16px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          maxWidth: '480px', width: '100%',
        }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <FiCheckCircle size={40} color="white" />
          </div>
          <h2 style={{ margin: '0 0 12px', fontSize: '24px', color: '#111827' }}>
            Muvaffaqiyatli topshirildi!
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '32px', lineHeight: '1.6' }}>
            Uy vazifasi #{homeworkId} muvaffaqiyatli topshirildi.
            O'qituvchi ko'rib chiqadi va baho qo'yadi.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                padding: '12px 24px', borderRadius: '8px',
                border: '1px solid #e5e7eb', background: 'white',
                cursor: 'pointer', fontWeight: '500',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              <FiArrowLeft size={16} /> Orqaga
            </button>
            <button
              onClick={() => { setSubmitted(false); setFile(null); setComment(''); }}
              className="btn-primary"
              style={{ padding: '12px 24px' }}
            >
              Yana topshirish
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* HEADER */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none', border: '1px solid #e5e7eb',
            borderRadius: '8px', cursor: 'pointer',
            padding: '8px', display: 'flex', alignItems: 'center',
          }}
        >
          <FiArrowLeft size={18} />
        </button>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>Uy vazifasini topshirish</h1>
          <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: '14px' }}>
            Vazifa ID: <strong style={{ color: '#7c3aed' }}>#{homeworkId}</strong>
          </p>
        </div>
      </div>

      {/* FORM CARD */}
      <div className="content-card" style={{ maxWidth: '680px' }}>
        <form onSubmit={handleSubmit}>

          {/* FAYL YUKLASH ZONA */}
          <div className="form-group">
            <label className="form-label">Fayl yuklash</label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => document.getElementById('hw-file-input').click()}
              style={{
                border: `2px dashed ${isDragging ? '#7c3aed' : '#d1d5db'}`,
                borderRadius: '12px',
                padding: '48px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                background: isDragging ? '#f5f3ff' : '#f9fafb',
                transition: 'all 0.2s ease',
              }}
            >
              <FiUpload size={32} style={{ color: isDragging ? '#7c3aed' : '#9ca3af', marginBottom: '12px' }} />
              <p style={{ margin: '0 0 4px', fontWeight: '500', color: '#374151' }}>
                Faylni bu yerga tashlang yoki bosing
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>
                PDF, DOC, DOCX, ZIP, JPG, PNG — max 50MB
              </p>
              <input
                id="hw-file-input"
                type="file"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept=".pdf,.doc,.docx,.zip,.jpg,.jpeg,.png,.txt"
              />
            </div>

            {/* TANLANGAN FAYL */}
            {file && (
              <div style={{
                marginTop: '12px', padding: '14px 16px',
                background: '#f5f3ff', border: '1px solid #ede9fe',
                borderRadius: '8px', display: 'flex',
                alignItems: 'center', gap: '12px',
              }}>
                <FiFile size={20} style={{ color: '#7c3aed', flexShrink: 0 }} />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <p style={{ margin: 0, fontWeight: '500', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', flexShrink: 0 }}
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {/* IZOH */}
          <div className="form-group">
            <label className="form-label">Izoh <span style={{ color: '#9ca3af', fontSize: '11px' }}>(ixtiyoriy)</span></label>
            <textarea
              className="form-input"
              placeholder="Uy vazifangiz haqida izoh yozing..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              style={{ resize: 'vertical', minHeight: '100px' }}
            />
          </div>

          {/* TUGMALAR */}
          <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary"
              style={{ flex: 1 }}
            >
              <FiX size={16} style={{ marginRight: '6px' }} />
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!file && !comment.trim())}
              className="btn-primary"
              style={{
                flex: 1, display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px',
                opacity: (!file && !comment.trim()) ? 0.6 : 1,
              }}
            >
              {isSubmitting ? (
                <>
                  <div style={{
                    width: '16px', height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white', borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                  Topshirilmoqda...
                </>
              ) : (
                <>
                  <FiUpload size={16} /> Topshirish
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HomeworkSubmit;
