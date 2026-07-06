import { useState, useEffect, useMemo } from "react";
import { FiSearch, FiRefreshCw, FiFilter } from "react-icons/fi";
import toast from "react-hot-toast";
import { homeworkAPI, unwrapHomeworkResults, parseApiError, normalizeHomeworkResultStatus } from "../api/api";

const MONTHS_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return `${d.getDate()} ${MONTHS_EN[d.getMonth()]}, ${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const getStudentName = (row) =>
  row.student?.full_name ||
  row.full_name ||
  row.student_name ||
  `${row.student?.first_name || ""} ${row.student?.last_name || ""}`.trim() ||
  row.name ||
  "—";

const getGroupId = (row) =>
  row.group_id ?? row.groupId ?? row.group?.id ?? row.homework?.group_id ?? row.homework?.groupId;

const getHomeworkTitle = (row) =>
  row.homework?.title ?? row.homework?.topic ?? row.homework_title ?? row.title ?? "—";

const TABS = [
  { key: "ACCEPTED", label: "Qabul qilinganlar", color: "#22c55e" },
  { key: "REJECTED", label: "Qaytarilganlar", color: "#ef4444" },
  { key: "PENDING", label: "Kutayotganlar", color: "#f97316" },
  { key: "CHECKED", label: "Tekshirilganlar", color: "#3b82f6" },
];

const HomeworkAccepted = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("ACCEPTED");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedHomework, setSelectedHomework] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ ACCEPTED: 0, REJECTED: 0, PENDING: 0, CHECKED: 0 });

  const limit = 20;

  const fetchResults = async () => {
    setLoading(true);
    try {
      // Enforce canonical endpoint: require both group and homework selection
      if (!selectedGroup || !selectedHomework) {
        setResults([]);
        setTotal(0);
        setStats({ ACCEPTED: 0, REJECTED: 0, PENDING: 0, CHECKED: 0 });
        setLoading(false);
        return;
      }

      const res = await homeworkAPI.getResults(Number(selectedGroup), Number(selectedHomework), activeTab);
      const body = res.data?.data ?? res.data ?? res;
      const resultsList = unwrapHomeworkResults(res);
      const totalCount = Array.isArray(resultsList) ? resultsList.length : 0;

      setResults(resultsList);
      setTotal(totalCount);

      // Statistikani yangilash from returned list
      const calculatedStats = { ACCEPTED: 0, REJECTED: 0, PENDING: 0, CHECKED: 0 };
      resultsList.forEach((r) => {
        const status = normalizeHomeworkResultStatus(r);
        if (calculatedStats[status] !== undefined) {
          calculatedStats[status]++;
        }
      });
      setStats(calculatedStats);
    } catch (err) {
      console.error("❌ getResults xato:", err.response?.data || err.message);
      const msg = await parseApiError(err);
      toast.error(msg);
      setResults([]);
      setTotal(0);
      setStats({ ACCEPTED: 0, REJECTED: 0, PENDING: 0, CHECKED: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [activeTab, page, selectedGroup, selectedHomework]);

  const handleSearch = () => {
    setPage(1);
    fetchResults();
  };

  const handleRefresh = () => {
    setPage(1);
    setSearchQuery("");
    setSelectedGroup("");
    setSelectedHomework("");
    fetchResults();
  };

  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return results;
    const q = searchQuery.trim().toLowerCase();
    return results.filter((row) => {
      const name = getStudentName(row).toLowerCase();
      const groupId = String(getGroupId(row));
      const hwTitle = getHomeworkTitle(row).toLowerCase();
      return name.includes(q) || groupId.includes(q) || hwTitle.includes(q);
    });
  }, [results, searchQuery]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="page-container">
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1 className="page-title">Uy vazifa natijalari</h1>
          <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>
            Barcha guruhlarning uy vazifa natijalari ro'yxati
          </p>
        </div>
        <button
          type="button"
          className="toolbar-btn"
          onClick={handleRefresh}
          disabled={loading}
        >
          <FiRefreshCw /> Yangilash
        </button>
      </div>

      {/* Statistika kartalari */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        {TABS.map((tab) => (
          <div
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setPage(1); }}
            style={{
              flex: "1",
              minWidth: "180px",
              padding: "16px 20px",
              borderRadius: "12px",
              background: activeTab === tab.key ? "#fff" : "#f8fafc",
              border: `2px solid ${activeTab === tab.key ? tab.color : "#e2e8f0"}`,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "8px" }}>
              {tab.label}
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: tab.color }}>
              {stats[tab.key] || 0}
            </div>
          </div>
        ))}
      </div>

      <div className="content-card">
        <div className="table-toolbar">
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button className="toolbar-btn">
              <FiFilter /> Filters
            </button>
            <select
              value={selectedGroup}
              onChange={(e) => { setSelectedGroup(e.target.value); setPage(1); }}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                fontSize: "13px",
                background: "#fff",
              }}
            >
              <option value="">Barcha guruhlar</option>
              {/* Guruhlar dinamik qo'shilishi mumkin */}
            </select>
            <select
              value={selectedHomework}
              onChange={(e) => { setSelectedHomework(e.target.value); setPage(1); }}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                fontSize: "13px",
                background: "#fff",
              }}
            >
              <option value="">Barcha vazifalar</option>
              {/* Vazifalar dinamik qo'shilishi mumkin */}
            </select>
          </div>
          <div className="search-container">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="O'quvchi ismi yoki guruh ID bo'yicha qidirish"
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: "24px" }}>O'quvchi</th>
                <th>Guruh</th>
                <th>Uy vazifa</th>
                <th>Ball</th>
                <th>Status</th>
                <th>Topshirilgan vaqt</th>
                <th style={{ paddingRight: "24px" }}>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "32px" }}>
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "32px" }}>
                    {searchQuery.trim() || selectedGroup || selectedHomework
                      ? "Natija topilmadi"
                      : "Ma'lumot mavjud emas"}
                  </td>
                </tr>
              ) : (
                filteredResults.map((row, idx) => {
                  const name = getStudentName(row);
                  const groupId = getGroupId(row);
                  const hwTitle = getHomeworkTitle(row);
                  const score = row.score ?? row.grade ?? "—";
                  const status = normalizeHomeworkResultStatus(row);
                  const submittedAt = row.submitted_at || row.created_at || null;

                  const statusColors = {
                    ACCEPTED: { bg: "#dcfce7", color: "#166534" },
                    REJECTED: { bg: "#fee2e2", color: "#991b1b" },
                    PENDING: { bg: "#ffedd5", color: "#9a3412" },
                    CHECKED: { bg: "#dbeafe", color: "#1e40af" },
                  };
                  const statusStyle = statusColors[status] || statusColors.PENDING;

                  return (
                    <tr key={`${row.id || idx}-${idx}`}>
                      <td style={{ paddingLeft: "24px", fontWeight: 500 }}>
                        {name}
                      </td>
                      <td>
                        {groupId ? `Guruh #${groupId}` : "—"}
                      </td>
                      <td style={{ maxWidth: "250px" }}>
                        {hwTitle.length > 50 ? `${hwTitle.slice(0, 50)}…` : hwTitle}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {typeof score === "number" ? `${score}/100` : score}
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: 600,
                            background: statusStyle.bg,
                            color: statusStyle.color,
                          }}
                        >
                          {status}
                        </span>
                      </td>
                      <td style={{ fontSize: "13px" }}>
                        {formatDate(submittedAt)}
                      </td>
                      <td style={{ paddingRight: "24px" }}>
                        <button
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            border: "1px solid #e2e8f0",
                            background: "#fff",
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                        >
                          Ko'rish
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
              padding: "16px 24px",
              borderTop: "1px solid #f3f4f6",
            }}
          >
            <button
              className="toolbar-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              &larr; Oldingi
            </button>
            <span style={{ fontSize: "13px", color: "#64748b" }}>
              Sahifa {page} / {totalPages}
            </span>
            <button
              className="toolbar-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Keyingi &rarr;
            </button>
          </div>
        )}

        {!loading && total > 0 && (
          <p
            style={{
              padding: "12px 24px",
              fontSize: "12px",
              color: "#9ca3af",
              borderTop: "1px solid #f3f4f6",
            }}
          >
            Jami: {total}
            {searchQuery.trim() || selectedGroup || selectedHomework
              ? ` · Ko'rsatilmoqda: ${filteredResults.length}`
              : ""}
          </p>
        )}
      </div>
    </div>
  );
};

export default HomeworkAccepted;
