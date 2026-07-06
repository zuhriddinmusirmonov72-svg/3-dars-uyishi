import './index.css'

const Dashboard = () => {
  return (
    <div className="dash-container">
      <aside className="sidebar">
        <div className="sidebar-logo">🟡N105 Coin</div>
        <nav>
          <div className="menu-item active"> Asosiy</div>
          <div className="menu-item">O'qituvchilar</div>
          <div className="menu-item"> Sinflar</div>
          <div className="menu-item"> Talabalar</div>
          <div className="menu-item"> Sovg'alar</div>
          <div className="menu-item"> Boshqarish</div>
        </nav>

        <div className="obuna-card">
          <p style={{fontSize: '12px', margin: 0}}>Obuna</p>
          <p style={{fontSize: '10px', color: 'red'}}>Obunangiz tugagan</p>
          <button className="obuna-btn">⚡ Obunani yangilash</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="header">
          <button style={{border:'none', background:'#f0f0f0', padding:'5px 10px', borderRadius:'5px'}}>❮</button>
          <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
            <span>O'zbekcha ▾</span>
            <span>🔔</span>
            <span>🌙</span>
            <div style={{width:'30px', height:'30px', borderRadius:'50%', background:'#ddd'}}></div>
          </div>
        </header>

        <div style={{padding: '30px 30px 0'}}>
          <h1 style={{margin:0}}>Salom, Ustoz</h1>
          <p style={{color:'#888', marginTop:'5px'}}>105 Coin platformasiga xush kelibsiz!</p>
        </div>

        <div className="stats-grid">
          <div className="stat-box"><span>👥</span><h3>Sinflar</h3><p>0</p></div>
          <div className="stat-box"><span>📚</span><h3>Fanlar</h3><p>0</p></div>
          <div className="stat-box"><span>🎓</span><h3>Talabalar</h3><p>1</p></div>
          <div className="stat-box"><span>🎁</span><h3>Sovg'alar</h3><p>3</p></div>
          <div className="stat-box"><span>👤</span><h3>O'qituvchilar</h3><p>0</p></div>
        </div>

        <div className="table-placeholder">
          <span>Dars Jadvali</span>
          <span>⌄</span>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;