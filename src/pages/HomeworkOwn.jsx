import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FiArrowLeft, FiUpload, FiFile, FiClock } from "react-icons/fi";
import toast from "react-hot-toast";
import { homeworkAPI, unwrapHomeworkList, parseApiError, getHomeworkId } from "../api/api";

const MONTHS_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 16).replace("T", " ");
  const month = MONTHS_EN[d.getMonth()];
  const year = d.getFullYear();
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year} ${month} ${day} ${hours}:${minutes}`;
};

const HomeworkOwn = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [homework, setHomework] = useState(null);
  const [submission, setSubmission] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!lessonId) return;
      setLoading(true);
      try {
        const res = await homeworkAPI.getOwn(lessonId);
        const list = unwrapHomeworkList(res);
        const item = list[0] || (res.data?.data?.id ? res.data.data : res.data?.data) || null;
        setHomework(item);
        
        // Fetch submission data if homework exists
        if (item && getHomeworkId(item)) {
          try {
            const subRes = await homeworkAPI.getStudentResult(
              item.group_id || item.groupId,
              getHomeworkId(item),
              localStorage.getItem('studentId') || 'current'
            );
            setSubmission(subRes.data?.data || subRes.data);
          } catch (subErr) {
            // Submission might not exist yet, that's okay
            console.log('No submission found yet');
          }
        }
      } catch (err) {
        const msg = await parseApiError(err);
        toast.error(msg);
        setHomework(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [lessonId]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px", color: "#6b7280" }}>
        Yuklanmoqda...
      </div>
    );
  }

  if (!getHomeworkId(homework)) {
    return (
      <div className="page-container" style={{ textAlign: "center", paddingTop: "60px" }}>
        <p style={{ color: "#6b7280", marginBottom: "16px" }}>
          Bu dars uchun uy vazifa topilmadi
        </p>
        <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
          <FiArrowLeft style={{ marginRight: "6px" }} /> Orqaga
        </button>
      </div>
    );
  }

  const title = homework.title || homework.topic || "Uy vazifa";
  const deadline = homework.deadline || homework.end_date || homework.due_date;
  const score = submission?.score || submission?.grade || 0;
  const status = submission?.status || 'PENDING';
  const comment = submission?.comment || submission?.teacher_comment || '';
  const submissionText = submission?.answer_text || submission?.comment || '';
  const files = submission?.files || submission?.attachments || [];
  const filesCount = Array.isArray(files) ? files.length : 0;

  const statusColors = {
    ACCEPTED: { bg: '#dcfce7', color: '#166534', text: 'Qabul qilingan' },
    REJECTED: { bg: '#fee2e2', color: '#991b1b', text: 'Qaytarilgan' },
    PENDING: { bg: '#fef3c7', color: '#92400e', text: 'Kutayabti' },
  };
  const statusStyle = statusColors[status] || statusColors.PENDING;

  return (
    <div className="page-container">
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "8px" }}
        >
          <FiArrowLeft size={18} />
        </button>
        <h1 className="page-title" style={{ margin: 0 }}>
          Uy vazifa
        </h1>
      </div>

      <div style={{ maxWidth: "800px" }}>
        {/* Vazifalarim Section */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '16px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1f2937' }}>
              Vazifalarim
            </h2>
            <div style={{
              background: '#f3f4f6',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#374151',
            }}>
              Ball: {score}
            </div>
          </div>

          {/* Uyga vazifa Section */}
          <div style={{
            background: '#f9fafb',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '12px',
            border: '1px solid #e5e7eb',
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
              Uyga vazifa
            </h3>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#374151', lineHeight: 1.5 }}>
              {title}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#dc2626', fontWeight: 500 }}>
                <FiClock size={14} />
                Uyga vazifa muddati: {formatDate(deadline)}
              </div>
              <div style={{ fontSize: '13px', color: '#dc2626', fontWeight: 500 }}>
                Fayllar soni: {filesCount}
              </div>
            </div>
          </div>

          {/* Mening jo'natmalarim Section */}
          <div style={{
            background: '#f9fafb',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '12px',
            border: '1px solid #e5e7eb',
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
              Mening jo'natmalarim
            </h3>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#374151', lineHeight: 1.5 }}>
              {submissionText || 'Jo\'natma mavjud emas'}
            </p>
            <div style={{ fontSize: '13px', color: '#dc2626', fontWeight: 500 }}>
              Fayllar soni: {filesCount}
            </div>
          </div>

          {/* O'qituvchi izohi Section */}
          {comment && (
            <div style={{
              background: '#fef2f2',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '12px',
              border: '1px solid #fecaca',
            }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, color: '#991b1b' }}>
                O'qituvchi izohi
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#7f1d1d', lineHeight: 1.5 }}>
                {comment}
              </p>
            </div>
          )}

          {/* Status Badge */}
          <div style={{
            display: 'inline-block',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 600,
            background: statusStyle.bg,
            color: statusStyle.color,
          }}>
            {status === 'REJECTED' ? 'Vazifa qaytarildi' : statusStyle.text}
          </div>
        </div>

        {/* Action Button */}
        {!submission || status === 'REJECTED' ? (
          <Link
            to={`/homework/${getHomeworkId(homework)}/submit`}
            className="btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              textDecoration: 'none',
              borderRadius: '8px',
            }}
          >
            <FiUpload size={16} /> Topshirish
          </Link>
        ) : null}
      </div>
    </div>
  );
};

export default HomeworkOwn;
