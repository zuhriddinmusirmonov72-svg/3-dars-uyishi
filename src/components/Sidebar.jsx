import { useState, useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaHome, FaUsers, FaUserGraduate, FaGift, FaCog, FaBell, FaChevronLeft, FaBook, FaDoorOpen, FaUserTie, FaCoins, FaPaperPlane, FaGem, FaSignOutAlt, FaUser } from 'react-icons/fa';
import NajotLogo from '../assets/Najot.png';
import { AppContext } from '../context/AppContext';

const Sidebar = ({ isOpen, onToggle }) => {
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [isTeacherGroupsOpen, setIsTeacherGroupsOpen] = useState(true);
  const navigate = useNavigate();
  const { t } = useContext(AppContext);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const role = localStorage.getItem('role')?.toLowerCase() || 'student';
  const isTeacher = role === 'teacher';

  const navLinks = [
    { name: t.home,     path: isTeacher ? '/super-admin-2/dashboard' : '/dashboard', icon: <FaHome size={18} />, end: true },
    ...(!isTeacher ? [{ name: t.teachers, path: '/teachers',  icon: <FaUserGraduate size={18} /> }] : []),
    { name: t.groups,   path: isTeacher ? '/super-admin-2/groups' : '/groups',    icon: <FaUsers size={18} /> },
    { name: t.students, path: isTeacher ? '/super-admin-2/students' : '/students',  icon: <FaGem size={18} /> },
    { name: t.gifts,    path: isTeacher ? '/super-admin-2/gifts' : '/gifts',     icon: <FaGift size={18} /> },
  ];

  return (
    <div style={{ display: 'flex', position: 'relative' }}>
      <div className={`sidebar ${!isOpen ? 'collapsed' : ''}`} style={{ position: 'relative', zIndex: 20 }}>

        {/* LOGO */}
        <div style={{ 
          padding: '0 20px 0 24px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '17px', fontWeight: 800, color: '#1e293b', letterSpacing: '1px', fontFamily: 'Georgia, "Times New Roman", serif' }}>NAJOT</span>
            <img
              src={NajotLogo}
              alt="NajotEdu"
              style={{ width: '40px', height: '40px', objectFit: 'contain', display: 'block' }}
            />
            <span style={{ fontSize: '17px', fontWeight: 800, color: '#1e293b', letterSpacing: '1px', fontFamily: 'Georgia, "Times New Roman", serif' }}>TA'LIM</span>
          </div>
        </div>

        {/* NAV LINKS */}
        <nav className="sidebar-nav">
          {isTeacher ? (
            <>
              {/* Teacher Sidebar */}
              <div style={{ marginBottom: '8px' }}>
                <button
                  onClick={() => setIsTeacherGroupsOpen(!isTeacherGroupsOpen)}
                  className={`nav-link`}
                  style={{ width: '100%', justifyContent: 'space-between', paddingRight: '16px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FaUsers size={18} />
                    <span className="nav-link-text">{t.groups || 'Guruhlar'}</span>
                  </div>
                  <FaChevronLeft
                    size={12}
                    style={{
                      transform: isTeacherGroupsOpen ? 'rotate(-90deg)' : 'rotate(180deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </button>
                {isTeacherGroupsOpen && (
                  <div style={{ paddingLeft: '24px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <NavLink
                      to="/super-admin-2/groups"
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                      style={{ padding: '8px 12px', fontSize: '14px', borderRadius: '8px' }}
                    >
                      {t.groups || 'Guruhlar'}
                    </NavLink>
                    <NavLink
                      to="/super-admin-2/assembling-groups"
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                      style={{ padding: '8px 12px', fontSize: '14px', borderRadius: '8px' }}
                    >
                      Yig'ilayotgan guruhlar
                    </NavLink>
                  </div>
                )}
              </div>
              <NavLink
                to="/super-admin-2/profile"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                style={{ marginTop: '8px' }}
              >
                <FaUser size={18} />
                <span className="nav-link-text">{t.profile || 'Profil'}</span>
              </NavLink>
            </>
          ) : (
            <>
              {navLinks.map((link) => (
                <NavLink
                  key={link.name}
                  to={link.path}
                  end={link.end}
                  className={({ isActive }) => `nav-link ${isActive && !isManagementOpen ? 'active' : ''}`}
                  data-tooltip={link.name}
                  onClick={() => setIsManagementOpen(false)}
                >
                  {link.icon}
                  <span className="nav-link-text">{link.name}</span>
                </NavLink>
              ))}

              <button
                onClick={() => setIsManagementOpen(!isManagementOpen)}
                className={`nav-link ${isManagementOpen ? 'active' : ''}`}
                style={{ width: '100%' }}
                data-tooltip="Boshqarish"
              >
                <FaCog size={18} />
                <span className="nav-link-text">{t.management}</span>
              </button>
            </>
          )}

          {/* CHIQISH — Boshqarishdan pastda */}
          <button
            onClick={handleLogout}
            className="nav-link"
            style={{ width: '100%', color: '#ef4444' }}
            data-tooltip="Chiqish"
          >
            <FaSignOutAlt size={18} />
            <span className="nav-link-text">{t.logout}</span>
          </button>
        </nav>

        {!isTeacher && (
          <div className="sidebar-footer">
            <div className="alert-box">
              <div className="alert-indicator"></div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', paddingLeft: '4px' }}>
                <div style={{ 
                  width: '40px', height: '40px', 
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                }}>
                  <FaBell style={{ color: '#ffffff', fontSize: '20px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p className="alert-title">{t.subscription}</p>
                  <p className="alert-desc">{t.subscriptionExpired}</p>
                </div>
              </div>
              <button className="alert-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 4v6h-6M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                </svg>
                {t.renewSubscription}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TOGGLE BUTTON — Sidebar o'ng chekkasida, rasmda ko'rsatilganidek */}
      <button
        onClick={onToggle}
        style={{
          position: 'absolute',
          right: '-16px',
          top: '20px',
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: '#7c3aed',
          border: '2px solid #fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 30,
          boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
          transition: 'all 0.2s ease',
        }}
      >
        <FaChevronLeft
          size={12}
          color="#fff"
          style={{
            transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>

      {(!isTeacher && isManagementOpen) && (
        <div className="sidebar-submenu-overlay" onClick={() => setIsManagementOpen(false)}></div>
      )}
      {(!isTeacher) && (
        <div className={`sidebar-submenu ${isManagementOpen ? 'open' : ''}`}>
           <div className="submenu-header">
              <button className="submenu-back" onClick={() => setIsManagementOpen(false)}>
                <FaChevronLeft size={12} />
              </button>
              <h3 className="submenu-title">{t.menu}</h3>
           </div>
           <nav className="submenu-nav">
              <NavLink to="/management?tab=Kurslar" className="submenu-link" onClick={() => setIsManagementOpen(false)}>
                <FaBook size={16} /> {t.courses}
              </NavLink>
              <NavLink to="/management?tab=Xonalar" className="submenu-link" onClick={() => setIsManagementOpen(false)}>
                <FaDoorOpen size={16} /> {t.rooms}
              </NavLink>
              <NavLink to="/management?tab=Xodimlar" className="submenu-link" onClick={() => setIsManagementOpen(false)}>
                <FaUserTie size={16} /> {t.staff}
              </NavLink>
              <NavLink to="/coin" className="submenu-link" onClick={() => setIsManagementOpen(false)}>
                <FaCoins size={16} /> {t.coin}
              </NavLink>
              <NavLink to="/messages" className="submenu-link" onClick={() => setIsManagementOpen(false)}>
                <FaPaperPlane size={16} /> {t.sendMessage}
              </NavLink>
           </nav>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
