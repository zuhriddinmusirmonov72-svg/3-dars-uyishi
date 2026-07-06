import { useState } from 'react';
import './index.css';
import Registe from "./assets/logo.svg";

const LoginPage = ({ onLogin }) => {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(login, password);
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <img
          src={Registe}
          alt="Illustration"
          className="login-illustration"
        />
      </div>
      <div className="login-right">
        <div className="login-form-box">
          <p className="login-tuit-title">
            NAJOT EDU — TA'LIM MARKAZI
          </p>
          <div className="login-logo">
            <img
              src="https://najotedu.uz/images/logo.png"
              alt="NajotEdu Logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <h2 className="login-main-title">O'QUV BOSHQARUV TIZIMI</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Login</label>
              <input
                className="form-input"
                type="text"
                placeholder="Loginni kiriting"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
              />
            </div>



            <div className="form-group">
              <label className="form-label">Parol</label>
              <input
                className="form-input"
                type="password"
                placeholder="Parolni kiriting"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="login-submit-btn btn-primary">Kirish</button>
          </form>
        </div>
        <p className="login-copyright">Copyright © 2025 NajotEdu Ta'lim Markazi. Barcha huquqlar himoyalangan.</p>
      </div>
    </div>
  );
};

export default LoginPage;