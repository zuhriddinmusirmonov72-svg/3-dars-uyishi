import { Link } from 'react-router-dom';
import { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { FiSearch, FiBell, FiMoon } from 'react-icons/fi';
import { FaCalendarAlt } from 'react-icons/fa';

const LANGUAGES = [
  { code: 'uz', label: "O'zbekcha", flag: '🇺🇿' },
  { code: 'ru', label: 'Русский',   flag: '🇷🇺' },
  { code: 'en', label: 'English',   flag: '🇬🇧' },
];

const Navbar = () => {
  const { user, darkMode, toggleDarkMode, language, changeLanguage, t } = useContext(AppContext);
  const [langOpen, setLangOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  // Tashqariga bosganda yopish
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="nav-icon-btn">
          <FaCalendarAlt size={16} color="#6b7280" />
        </button>
        <button className="add-btn" style={{ marginLeft: '12px' }}>
          <span>{t.add}</span>
          <span style={{ fontSize: '10px' }}>▼</span>
        </button>
        
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input type="text" placeholder={t.search} className="search-input" />
        </div>
      </div>

      <div className="navbar-right">
        {/* Til tanlash */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setLangOpen(!langOpen)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: '20px',
              border: '1.5px solid #e5e7eb',
              background: langOpen ? '#f5f3ff' : '#fff',
              cursor: 'pointer', transition: 'all 0.15s',
              fontSize: '13px', fontWeight: 600, color: '#374151',
            }}
          >
            <span style={{ fontSize: '16px' }}>{currentLang.flag}</span>
            <span>{currentLang.label}</span>
            <span style={{ fontSize: '9px', color: '#9ca3af', marginLeft: '2px' }}>▼</span>
          </button>

          {langOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              background: '#fff', borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              minWidth: '160px', zIndex: 100, overflow: 'hidden',
            }}>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { changeLanguage(lang.code); setLangOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    width: '100%', padding: '10px 16px',
                    background: language === lang.code ? '#f5f3ff' : 'transparent',
                    border: 'none', cursor: 'pointer',
                    fontSize: '14px', fontWeight: language === lang.code ? 700 : 400,
                    color: language === lang.code ? '#7c3aed' : '#374151',
                    textAlign: 'left', transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    if (language !== lang.code) e.currentTarget.style.background = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    if (language !== lang.code) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{lang.flag}</span>
                  <span>{lang.label}</span>
                  {language === lang.code && (
                    <span style={{ marginLeft: 'auto', color: '#7c3aed', fontSize: '14px' }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="nav-icons">
          <button className="nav-icon-btn notification-btn">
            <FiBell size={20} color="#4b5563" />
            <span className="notification-dot"></span>
          </button>
          <button className="nav-icon-btn" onClick={toggleDarkMode}>
            <FiMoon size={20} color={darkMode ? "#f3f4f6" : "#4b5563"} />
          </button>
        </div>

        <Link to="/profile" className="profile-avatar">
          {user.photo ? (
            <img src={user.photo} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            user.name.charAt(0).toUpperCase()
          )}
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
