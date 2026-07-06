import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Autentifikatsiya tekshiruvi - faqat bir marta ishlaydi
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    // User string bo'lsa, JSON parse qilish
    let user = null;
    if (userStr) {
      try {
        user = JSON.parse(userStr);
      } catch (e) {
        console.error('User parse xato:', e);
      }
    }

    // Agar token yo'q yoki user yo'q bo'lsa, login ga yo'naltirish
    if (!token || !user) {
      navigate('/login', { replace: true });
    }

    setIsChecking(false);
  }, []); // Bo'sh dependency array - faqat bir marta ishlaydi

  // Agar tekshiruv davom etayotgan bo'lsa, loading ko'rsatish
  if (isChecking) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f8fafc'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e5e7eb',
          borderTopColor: '#7c3aed',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="layout-wrapper">
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <div className="layout-content">
        <Navbar />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
