import { useState } from 'react';
import { FiSearch, FiFilter, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';

const TeacherCourses = () => {
  const [courses, setCourses] = useState([
    { id: 1, name: 'Backend', description: 'Python, Django, PostgreSQL', duration: '6 oy', status: 'Faol' },
    { id: 2, name: 'Frontend', description: 'HTML, CSS, React', duration: '5 oy', status: 'Faol' }
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({ name: '', description: '', duration: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newCourse.name) {
      setCourses([...courses, { ...newCourse, id: Date.now(), status: 'Faol' }]);
      setIsModalOpen(false);
      setNewCourse({ name: '', description: '', duration: '' });
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Kurslar</h1>
        <button onClick={() => setIsModalOpen(true)} className="add-btn">
          <span>+ Kurs qo'shish</span>
        </button>
      </div>

      <div className="content-card">
        <div className="table-toolbar">
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="toolbar-btn"><FiFilter /> Filters</button>
          </div>
          <div className="search-container">
            <FiSearch className="search-icon" />
            <input type="text" placeholder="Qidirish" className="search-input" />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: '24px' }}>Kurs Nomi</th>
                <th>Tavsifi</th>
                <th>Davomiyligi</th>
                <th>Status</th>
                <th style={{ textAlign: 'right', paddingRight: '24px' }}>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td style={{ paddingLeft: '24px', fontWeight: 'bold' }}>{course.name}</td>
                  <td>{course.description}</td>
                  <td>{course.duration}</td>
                  <td><span className="course-badge">{course.status}</span></td>
                  <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', color: '#7c3aed' }}>
                      <button><FiEdit2 size={16} /></button>
                      <button onClick={() => setCourses(courses.filter(c => c.id !== course.id))} style={{ color: '#6b7280' }}><FiTrash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`right-drawer-overlay ${isModalOpen ? 'open' : ''}`} onClick={() => setIsModalOpen(false)}>
        <div className={`right-drawer ${isModalOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h2 className="drawer-title">Kurs qo'shish</h2>
              <button className="drawer-close" onClick={() => setIsModalOpen(false)}><FiX /></button>
            </div>
            
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '24px' }}>Yangi kurs ma'lumotlarini kiriting.</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div className="form-group">
                <label className="form-label">Kurs nomi</label>
                <input 
                  type="text" required placeholder="Kurs nomini kiriting"
                  value={newCourse.name} onChange={e => setNewCourse({...newCourse, name: e.target.value})}
                  className="form-input" 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tavsifi</label>
                <input 
                  type="text" placeholder="Kurs haqida qisqacha"
                  value={newCourse.description} onChange={e => setNewCourse({...newCourse, description: e.target.value})}
                  className="form-input" 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Davomiyligi</label>
                <input 
                  type="text" placeholder="Masalan: 6 oy"
                  value={newCourse.duration} onChange={e => setNewCourse({...newCourse, duration: e.target.value})}
                  className="form-input" 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid #f3f4f6' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ width: '48%' }}>Bekor qilish</button>
                <button type="submit" className="btn-primary" style={{ width: '48%' }}>Saqlash</button>
              </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default TeacherCourses;
