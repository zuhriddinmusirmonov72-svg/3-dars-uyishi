import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { examAPI, parseApiError } from "../api/api";

const getStudentName = (row) =>
  row.student?.full_name ||
  row.full_name ||
  row.student_name ||
  `${row.student?.first_name || ""} ${row.student?.last_name || ""}`.trim() ||
  row.name ||
  "—";

const getStudentId = (row) =>
  row.student_id ?? row.studentId ?? row.student?.id ?? row.id ?? null;

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()} ${hh}:${mm}`;
};

const TABS = [
  { key: "PENDING", label: "Kutayotganlar", badgeColor: "#f97316", badgeBg: "#fff7ed" },
  { key: "REJECTED", label: "Rad etilganlar", badgeColor: "#ef4444", badgeBg: "#fef2f2" },
  { key: "ACCEPTED", label: "Qabul qilinganlar", badgeColor: "#22c55e", badgeBg: "#f0fdf4" },
  { key: "NOT_SENT", label: "Topshirmaganlar", badgeColor: "#0f766e", badgeBg: "#f0fdfa" },
];

const ExamResultsPanel = ({ groupId, exam, students = [], onClose }) => {
  const examId = exam?.id;

  const topic =
    exam?.title ||
    exam?.topic ||
    exam?.mavzu ||
    exam?.lesson?.topic ||
    "Imtihon";

  const [activeTab, setActiveTab] = useState("PENDING");
  const [results, setResults] = useState([]);
  const [counts, setCounts] = useState({ PENDING: 0, REJECTED: 0, ACCEPTED: 0, NOT_SENT: 0 });
  const [loading, setLoading] = useState(true);

  const fetchResults = async () => {
    if (!groupId || !examId) return;
    setLoading(true);
    try {
      const res = await examAPI.getResults(groupId, examId);
      const body = res?.data?.data ?? res?.data ?? [];
      let all = [];

      if (Array.isArray(body)) all = body;
      else if (Array.isArray(body?.results)) all = body.results;
      else if (Array.isArray(body?.items)) all = body.items;
      else if (Array.isArray(body?.students)) all = body.students;

      const submittedIds = new Set(all.map((r) => String(getStudentId(r))));
      const notSent = students
        .filter((s) => !submittedIds.has(String(s.id)))
        .map((s) => ({
          student_id: s.id,
          full_name: s.full_name || `${s.first_name || ""} ${s.last_name || ""}`.trim() || s.name,
          status: "NOT_SENT",
          submitted_at: null,
        }));

      const combined = [...all, ...notSent];
      const c = { PENDING: 0, REJECTED: 0, ACCEPTED: 0, NOT_SENT: notSent.length };
      all.forEach((r) => {
        const st = r.status || "PENDING";
        if (st in c) c[st]++;
        else c.PENDING++;
      });

      setCounts(c);
      setResults(combined);
    } catch (err) {
      const msg = await parseApiError(err);
      toast.error(msg);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [groupId, examId]);

  if (!examId) return null;

  const filtered = results.filter((r) => (r.status || "PENDING") === activeTab);

  return (
    <div style={{ padding: "28px 0", width: "100%" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "24px" }}>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "4px",
              fontSize: "22px", fontWeight: 700, color: "#0f172a", padding: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Imtihonlar
          </button>
        </div>

        <h2 style={{ margin: "0 0 8px", fontSize: "24px", fontWeight: 700, color: "#0f172a" }}>
          {topic}
        </h2>
        <p style={{ margin: "0 0 24px", color: "#64748b", fontSize: "14px" }}>
          Topshirilgan vaqti: {formatDateTime(exam?.given_at || exam?.created_at)}
        </p>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: activeTab === tab.key ? `1.5px solid ${tab.badgeColor}` : "1.5px solid #e5e7eb",
                background: activeTab === tab.key ? tab.badgeBg : "#fff",
                color: activeTab === tab.key ? tab.badgeColor : "#6b7280",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              {tab.label}
              <span style={{ marginLeft: "6px", opacity: 0.8 }}>({counts[tab.key] || 0})</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>Yuklanmoqda...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>
            Bu bo'limda talabalar yo'q
          </div>
        ) : (
          <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "#6b7280", fontWeight: 600 }}>Talaba</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "#6b7280", fontWeight: 600 }}>Topshirilgan vaqt</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "#6b7280", fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, idx) => (
                  <tr key={row.id || row.student_id || idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#111827" }}>
                      {getStudentName(row)}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#374151" }}>
                      {formatDateTime(row.submitted_at || row.created_at)}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#374151" }}>
                      {row.status || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamResultsPanel;
