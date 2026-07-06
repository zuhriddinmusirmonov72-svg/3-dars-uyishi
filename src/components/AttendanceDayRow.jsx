import { MONTH_SHORT } from "../utils/schedule";
import { isDateCompleted, canTakeAttendance } from "../utils/attendanceSchedule";

const getMonthLabel = (day) =>
  MONTH_SHORT[day.monthKey] ||
  MONTH_SHORT[day.monthLabel] ||
  day.monthKey ||
  day.monthLabel ||
  "";

/**
 * Dars jadvali — rasmdagidek gorizontal kun kartochkalari
 */
const AttendanceDayRow = ({ days, completedSet, onDayClick, singleRow = true }) => {
  if (!days.length) {
    return (
      <p style={{ color: "#9ca3af", textAlign: "center", padding: "20px" }}>
        Dars jadvali mavjud emas
      </p>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexWrap: singleRow ? "nowrap" : "wrap",
        gap: "10px",
        overflowX: singleRow ? "auto" : "visible",
        paddingBottom: singleRow ? "4px" : 0,
      }}
    >
      {days.map((d) => {
        const done = isDateCompleted(d.iso, completedSet);
        const { canTake, reason } = canTakeAttendance(d.iso, completedSet);
        
        let title = "Davomat kiritish";
        let borderColor = "1px solid #e5e7eb";
        let background = "#fff";
        let cursor = "pointer";
        let boxShadow = "none";
        let opacity = "1";

        if (done) {
          title = `${d.iso} — tugallangan dars (ko'rish)`;
          borderColor = "2px solid #86efac";
          background = "#f0fdf4";
          boxShadow = "0 1px 4px rgba(34,197,94,0.15)";
        } else if (!canTake) {
          if (reason === "not_yet") {
            title = `${d.iso} — hali kira olmaysiz (sana kelmagan)`;
            borderColor = "1px solid #d1d5db";
            background = "#f9fafb";
            cursor = "not-allowed";
            opacity = "0.5";
          } else if (reason === "already_done_today") {
            title = `${d.iso} — bugun davomat qilingan`;
            borderColor = "2px solid #86efac";
            background = "#f0fdf4";
            boxShadow = "0 1px 4px rgba(34,197,94,0.15)";
          } else if (reason === "view_only") {
            title = `${d.iso} — ko'rish uchun`;
            borderColor = "2px solid #86efac";
            background = "#f0fdf4";
            boxShadow = "0 1px 4px rgba(34,197,94,0.15)";
          } else if (reason === "past_not_available") {
            title = `${d.iso} — o'tgan kun (kirish mumkin emas)`;
            borderColor = "1px solid #d1d5db";
            background = "#f9fafb";
            cursor = "not-allowed";
            opacity = "0.5";
          }
        }

        return (
          <button
            key={d.iso}
            type="button"
            title={title}
            onClick={() => canTake || done ? onDayClick(d.iso) : null}
            disabled={!canTake && !done}
            style={{
              flex: singleRow ? "0 0 auto" : undefined,
              width: "60px",
              height: "70px",
              border: borderColor,
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              background: background,
              cursor: cursor,
              padding: 0,
              boxShadow: boxShadow,
              opacity: opacity,
            }}
          >
            <span style={{ fontSize: "12px", color: "#6b7280", lineHeight: 1.2 }}>
              {getMonthLabel(d)}
            </span>
            <strong
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#111827",
                lineHeight: 1.2,
              }}
            >
              {d.dayNum}
            </strong>
          </button>
        );
      })}
    </div>
  );
};

export default AttendanceDayRow;
