// Usage: TOKEN=your_token node scripts/fetchHomeworkResults.js <groupId> <homeworkId> [status]
// Example: TOKEN=abc node scripts/fetchHomeworkResults.js 84 205 PENDING

const [,, groupId, homeworkId, status] = process.argv;
const TOKEN = process.env.TOKEN;

if (!groupId || !homeworkId) {
  console.error('Usage: TOKEN=your_token node scripts/fetchHomeworkResults.js <groupId> <homeworkId> [status]');
  process.exit(1);
}
if (!TOKEN) {
  console.error('Please provide your auth token via the TOKEN environment variable');
  process.exit(1);
}

const BASE = 'https://najot-edu.softwareengineer.uz/api/v1';
const buildUrl = (g, h, s) => {
  let u = `${BASE}/group/${encodeURIComponent(g)}/homework/${encodeURIComponent(h)}/results`;
  if (s) u += `?status=${encodeURIComponent(s)}`;
  return u;
};

const normResults = (json) => {
  const body = (json && json.data && json.data.data) || (json && json.data) || json || {};
  // common array shapes
  if (Array.isArray(body)) return body;
  if (Array.isArray(body.results)) return body.results;
  if (Array.isArray(body.items)) return body.items;
  if (Array.isArray(body.students)) return body.students;
  if (Array.isArray(body.data && body.data.results)) return body.data.results;
  if (Array.isArray(body.data && body.data.students)) return body.data.students;
  // single object
  if (body && typeof body === 'object') {
    if (body.id || body.student_id || body.student?.id || body.homework_answer_id) return [body];
    if (body.data && typeof body.data === 'object') {
      const nested = body.data.result || body.data.results || body.data.items || body.data.students;
      if (Array.isArray(nested)) return nested;
      if (nested && typeof nested === 'object') return [nested];
    }
  }
  return [];
};

(async () => {
  try {
    const url = buildUrl(groupId, homeworkId, status);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' } });
    const json = await res.json();
    const list = normResults(json);

    if (!Array.isArray(list) || list.length === 0) {
      console.log('No results found. Full response:');
      console.log(JSON.stringify(json, null, 2));
      process.exit(0);
    }

    // Map to readable student rows
    const students = list.map((r) => {
      const id = r.student_id ?? r.studentId ?? r.student?.id ?? r.id ?? null;
      const name = r.student?.full_name || r.full_name || r.student_name || `${r.student?.first_name || ''} ${r.student?.last_name || ''}`.trim() || r.name || r.title || null;
      const status = r.status ?? r.state ?? null;
      const submitted_at = r.submitted_at ?? r.created_at ?? r.submittedAt ?? r.createdAt ?? null;
      return { id, name, status, submitted_at, raw: r };
    });

    console.log(`Found ${students.length} items:`);
    students.forEach((s, i) => {
      console.log(`${i+1}. id=${s.id} name=${s.name || '--'} status=${s.status || '--'} submitted_at=${s.submitted_at || '--'}`);
    });

    // Also print JSON for easy copy/paste
    console.log('\nJSON output:');
    console.log(JSON.stringify(students, null, 2));
  } catch (err) {
    console.error('Error fetching results:', err.message || err);
    process.exit(2);
  }
})();
