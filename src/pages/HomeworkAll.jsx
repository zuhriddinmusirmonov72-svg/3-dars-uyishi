import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { FiSearch, FiRefreshCw } from "react-icons/fi";
import toast from "react-hot-toast";
import { homeworkAPI, unwrapHomeworkList, parseApiError } from "../api/api";

const MONTHS_EN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return `${d.getDate()} ${MONTHS_EN[d.getMonth()]}, ${d.getFullYear()}`;
};

const getLessonLabel = (hw) => {
  const lesson = hw.lesson;
  if (lesson) {
    const topic =
      lesson.topic || lesson.title || lesson.name || lesson.description;
    const id = lesson.id ? ` #${lesson.id}` : "";
    return topic ? `${topic}${id}` : `Dars${id}`;
  }
  if (hw.lesson_id) return `Dars #${hw.lesson_id}`;
  if (hw.lesson_topic) return hw.lesson_topic;
  return "—";
};

const getGroupId = (hw) =>
  hw.group_id ??
  hw.groupId ??
  hw.group?.id ??
  hw.lesson?.group_id ??
  hw.lesson?.group?.id;

const HomeworkAll = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await homeworkAPI.getAll();
      setList(unwrapHomeworkList(res));
    } catch (err) {
      toast.error(parseApiError(err, "Uy vazifalarni yuklashda xato"));
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((hw) => {
      const title = (hw.title || hw.topic || "").toLowerCase();
      const desc = (hw.description || "").toLowerCase();
      const lesson = getLessonLabel(hw).toLowerCase();
      const id = String(hw.id ?? "");
      return (
        title.includes(q) ||
        desc.includes(q) ||
        lesson.includes(q) ||
        id.includes(q)
      );
    });
  }, [list, searchQuery]);

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
          <h1 className="page-title">Barcha uy vazifalar</h1>
          <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "4px" }}>
            SUPERADMIN va ADMIN — tizimdagi barcha uy vazifalar ro&apos;yxati
          </p>
        </div>
        <button
          type="button"
          className="toolbar-btn"
          onClick={fetchAll}
          disabled={loading}
        >
          <FiRefreshCw /> Yangilash
        </button>
      </div>

      <div className="content-card">
        <div className="table-toolbar">
          <div />
          <div className="search-container">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Sarlavha, tavsif yoki dars bo'yicha qidirish"
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: "24px", width: "72px" }}>ID</th>
                <th>Sarlavha</th>
                <th>Tavsif</th>
                <th>Dars</th>
                <th>Guruh</th>
                <th>Yaratilgan</th>
                <th style={{ paddingRight: "24px" }}>Deadline</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "32px" }}>
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "32px" }}>
                    {searchQuery.trim()
                      ? "Qidiruv bo'yicha natija topilmadi"
                      : "Uy vazifalar yo'q"}
                  </td>
                </tr>
              ) : (
                filtered.map((hw) => {
                  const groupId = getGroupId(hw);
                  const title = hw.title || hw.topic || "—";
                  const created =
                    hw.created_at || hw.createdAt || hw.given_at;
                  const deadline =
                    hw.deadline || hw.end_date || hw.due_date;

                  return (
                    <tr key={hw.id}>
                      <td style={{ paddingLeft: "24px", color: "#6b7280" }}>
                        #{hw.id}
                      </td>
                      <td style={{ fontWeight: 600, maxWidth: "200px" }}>
                        {title}
                      </td>
                      <td
                        style={{
                          maxWidth: "280px",
                          color: "#4b5563",
                          fontSize: "13px",
                        }}
                      >
                        {hw.description
                          ? hw.description.length > 120
                            ? `${hw.description.slice(0, 120)}…`
                            : hw.description
                          : "—"}
                      </td>
                      <td style={{ fontSize: "13px" }}>{getLessonLabel(hw)}</td>
                      <td>
                        {groupId ? (
                          <Link
                            to={`/groups/${groupId}?tab=1`}
                            style={{ color: "#7c3aed", fontWeight: 500 }}
                          >
                            Guruh #{groupId}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td style={{ fontSize: "13px", whiteSpace: "nowrap" }}>
                        {formatDate(created)}
                      </td>
                      <td
                        style={{
                          paddingRight: "24px",
                          fontSize: "13px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatDate(deadline)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && list.length > 0 && (
          <p
            style={{
              padding: "12px 24px",
              fontSize: "12px",
              color: "#9ca3af",
              borderTop: "1px solid #f3f4f6",
            }}
          >
            Jami: {list.length}
            {searchQuery.trim() ? ` · Ko'rsatilmoqda: ${filtered.length}` : ""}
          </p>
        )}
      </div>
    </div>
  );
};

export default HomeworkAll;
