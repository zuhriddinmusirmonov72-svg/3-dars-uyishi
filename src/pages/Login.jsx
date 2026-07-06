import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import { authAPI } from '../api/api';
import loginImage from '../assets/login.png';
import NajotLogo from '../assets/Najot.png';
import { AppContext } from '../context/AppContext';

const Login = () => {
  const { t } = useContext(AppContext);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [resetPhone, setResetPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [savedPhone, setSavedPhone] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [timerKey, setTimerKey] = useState(0); // Timer qayta boshlash uchun
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const navigate = useNavigate();

  // 🔥 Token bo'lsa role ga qarab yo'naltiradi (faqat component mount bo'lganda)
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role') || 'student';
    if (token && window.location.pathname === '/login') {
      if (role?.toLowerCase() === 'student') {
        navigate('/student-dashboard');
      } else if (role?.toLowerCase() === 'teacher') {
        navigate('/teacher-dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!phone.trim() || !password.trim()) {
      toast.error(t.enterPhonePassword);
      return;
    }

    setIsLoading(true);

    try {
      // 📡 BACKEND GA SO'ROV — phone as-is yuboriladi (998 yoki 9756...)
      const res = await authAPI.login(phone.trim(), password.trim());

      console.log('Login response:', res.data); // debug uchun
      console.log('Full response:', res); // debug uchun

      // 🔥 TOKEN OLISH — backend qanday qaytarsa shuni olamiz
      const token =
        res.data?.token ||
        res.data?.data?.token ||
        res.data?.access_token ||
        res.data?.accessToken ||
        res.data?.data?.access_token;

      if (!token) {
        console.error('Token topilmadi. Response:', res.data);
        throw new Error('Token topilmadi');
      }

      // 🔐 TOKEN SAQLASH
      localStorage.setItem('token', token);

      // 👤 USER MA'LUMOTLARINI SAQLASH
      const userData = res.data?.user || res.data?.data?.user || res.data?.data;
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
      }

      // 👤 ROLE SAQLASH - backend response ni tekshirish
      console.log('Role tekshirish:', {
        'res.data?.role': res.data?.role,
        'res.data?.data?.role': res.data?.data?.role,
        'res.data?.user?.role': res.data?.user?.role,
        'res.data?.data?.user?.role': res.data?.data?.user?.role,
      });
      const role = res.data?.role || res.data?.data?.role || res.data?.user?.role || res.data?.data?.user?.role || 'student';
      console.log('Aniqlangan role:', role);
      localStorage.setItem('role', role);

      // ✅ MUVAFFAQIYAT XABARI
      toast.custom(
        () => (
          <div
            style={{
              backgroundColor: '#2e7d32',
              color: 'white',
              padding: '16px 24px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontWeight: '500',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
            }}
          >
            <FiCheckCircle size={20} />
            {t.loginSuccess}
          </div>
        ),
        { duration: 3000 }
      );

      // 🎯 ROLE GA QARAB YO'NALTIRISH (katta-kichik harfga e'tibor bermasdan)
      if (role?.toLowerCase() === 'student') {
        navigate('/student-dashboard');
      } else if (role?.toLowerCase() === 'teacher') {
        navigate('/teacher-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login xato:', err.response?.data || err.message);

      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        t.loginError;

      toast.custom(
        () => (
          <div
            style={{
              backgroundColor: '#c62828',
              color: 'white',
              padding: '16px 24px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontWeight: '500',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
            }}
          >
            <FiAlertCircle size={20} />
            {Array.isArray(message) ? message[0] : message}
          </div>
        ),
        { duration: 4000 }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    
    if (!resetPhone.trim()) {
      toast.error('Telefon raqamini kiriting');
      return;
    }

    setIsSendingOtp(true);

    try {
      // Phone formatni to'g'irlash - 998 prefiksiz yuborish (backend 9 ta raqam kutadi)
      let phoneToSend = resetPhone.trim().replace(/^998/, '');

      console.log('OTP yuborish uchun phone:', phoneToSend);
      console.log('Phone uzunligi:', phoneToSend.length);

      const res = await authAPI.sendOtp(phoneToSend);

      // Telefon raqamini localStorage ga saqlash (998 prefiksiz)
      localStorage.setItem('resetPhone', phoneToSend);
      setSavedPhone(phoneToSend);
      
      toast.success('Kod muvaffaqiyatli yuborildi!');
      setIsModalOpen(false);
      setIsOtpModalOpen(true);
      setResetPhone('');
      setOtpCode('');
      setCountdown(60);
      setTimerKey(prev => prev + 1); // Timer qayta boshlash
    } catch (err) {
      console.error('OTP yuborish xato:', err.response?.data || err.message);
      
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Kod yuborishda xatolik yuz berdi';

      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    if (!otpCode.trim()) {
      toast.error('SMS kodni kiriting');
      return;
    }

    const phone = localStorage.getItem('resetPhone');
    if (!phone) {
      toast.error('Telefon raqami topilmadi. Qaytadan urinib ko\'ring');
      setIsOtpModalOpen(false);
      return;
    }

    setIsVerifyingOtp(true);

    try {
      // OTP kodini string sifatida yuborish (backend "number string" kutadi)
      const otpString = otpCode.trim();

      console.log('OTP kod kiritildi:', otpString);
      console.log('OTP kod uzunligi:', otpString.length);

      // Bo'sh bo'lishini tekshirish
      if (!otpString) {
        toast.error('SMS kodni kiriting');
        setIsVerifyingOtp(false);
        return;
      }

      // Raqamlarni tekshirish
      if (!/^\d+$/.test(otpString)) {
        toast.error('Kod faqat raqamlardan iborat bo\'lishi kerak');
        setIsVerifyingOtp(false);
        return;
      }

      // Phone formatni to'g'irlash - 998 prefiksiz yuborish (sendOtp bilan bir xil format)
      const phoneToSend = phone.replace(/^998/, '');

      // OTP ni string sifatida yuborish (backend "number string" kutadi - raqamlardan iborat string)
      console.log('Backendga yuborilayotgan ma\'lumotlar:', { phone: phoneToSend, otp: otpString, otpType: typeof otpString });

      const res = await authAPI.verifyOtp(phoneToSend, otpString);

      toast.success('Kod muvaffaqiyatli tasdiqlandi!');
      setIsOtpModalOpen(false);
      setOtpCode('');
      // Parol o'zgartirish modalini ochish
      setIsPasswordModalOpen(true);
    } catch (err) {
      console.error('OTP tasdiqlash xato:', err);
      console.error('Error response:', err.response);
      console.error('Error data:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Error message array:', err.response?.data?.message);
      
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Kod tasdiqlashda xatolik yuz berdi';

      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    const phone = localStorage.getItem('resetPhone');
    if (!phone) {
      toast.error('Telefon raqami topilmadi. Qaytadan urinib ko\'ring');
      return;
    }

    setIsSendingOtp(true);

    try {
      await authAPI.sendOtp(phone);
      toast.success('Kod qayta yuborildi!');
      setCountdown(60); // Countdown ni qayta 60 ga o'rnatish
      setOtpCode('');
      setTimerKey(prev => prev + 1); // Timer qayta boshlash
    } catch (err) {
      console.error('OTP qayta yuborish xato:', err.response?.data || err.message);

      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Kod qayta yuborishda xatolik yuz berdi';

      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!newPassword.trim()) {
      toast.error('Yangi parolni kiriting');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Parollar mos kelmaydi');
      return;
    }

    const phone = localStorage.getItem('resetPhone');
    if (!phone) {
      toast.error('Telefon raqami topilmadi. Qaytadan urinib ko\'ring');
      setIsPasswordModalOpen(false);
      return;
    }

    setIsChangingPassword(true);

    try {
      const res = await authAPI.changePassword(phone, newPassword);

      toast.success('Parol muvaffaqiyatli o\'zgartirildi!');
      setIsPasswordModalOpen(false);
      setNewPassword('');
      setConfirmPassword('');
      localStorage.removeItem('resetPhone');
    } catch (err) {
      console.error('Parol o\'zgartirish xato:', err.response?.data || err.message);

      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Parol o\'zgartirishda xatolik yuz berdi';

      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Countdown timer
  useEffect(() => {
    let interval;
    if (isOtpModalOpen && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isOtpModalOpen && countdown === 0) {
      // Countdown tugaganda ogohlantirish
      toast.error('Kod muddati tugadi! Yangi kod oling.');
      setOtpCode(''); // Inputni tozalash
    }
    return () => clearInterval(interval);
  }, [isOtpModalOpen, timerKey]); // timerKey o'zgarganda timer qayta boshlanadi

  return (
    <div className="login-container">
      {/* CHAP TOMON — Login Image */}
      <div className="login-left">
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '500px',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={loginImage}
            alt="Login Illustration"
            style={{
              width: '100%',
              height: 'auto',
              maxWidth: '450px',
              objectFit: 'contain',
            }}
          />
        </div>
      </div>

      {/* O'NG TOMON — Form */}
      <div className="login-right">
        <div className="login-form-box">
          <div>
            <div className="login-logo">
              <img
                src={NajotLogo}
                alt="NajotEdu"
                style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
              />
            </div>
            <h2 className="login-main-title">{t.loginSystem}</h2>
          </div>

          <form
            onSubmit={handleLogin}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            {/* 📱 TELEFON RAQAM */}
            <div>
              <label
                className="form-label"
                style={{
                  textTransform: 'uppercase',
                  fontSize: '12px',
                  color: '#4b5563',
                  fontWeight: '600',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                {t.phoneNumberLabelLogin}
              </label>
              <input
                type="text"
                placeholder="975661099"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="form-input"
                style={{ padding: '12px 16px' }}
                autoComplete="username"
                required
              />
              <small
                style={{
                  color: '#9ca3af',
                  fontSize: '11px',
                  marginTop: '4px',
                  display: 'block',
                }}
              >
                {t.phoneExample}
              </small>
            </div>

            {/* 🔑 PAROL */}
            <div>
              <label
                className="form-label"
                style={{
                  textTransform: 'uppercase',
                  fontSize: '12px',
                  color: '#4b5563',
                  fontWeight: '600',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                {t.passwordLabelLogin}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t.enterPassword}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  style={{ padding: '12px 44px 12px 16px', width: '100%' }}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0',
                  }}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            {/* 🔐 PAROLNI UNITDINGIZMI? */}
            <div style={{ textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#556ee6',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  padding: '0',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#4c5fd6';
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#556ee6';
                  e.currentTarget.style.textDecoration = 'none';
                }}
              >
                Parolni unutdingizmi?
              </button>
            </div>

            {/* ✅ KIRISH TUGMASI */}
            <button
              type="submit"
              disabled={isLoading}
              className="login-submit-btn"
              style={{
                backgroundColor: phone && password ? '#556ee6' : '#e9ecef',
                color: phone && password ? 'white' : '#a6b0cf',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '13px',
                fontSize: '15px',
                fontWeight: '600',
                borderRadius: '8px',
                border: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {isLoading ? (
                <>
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                  {t.loggingIn}
                </>
              ) : (
                t.loginButton
              )}
            </button>
          </form>
        </div>

        <p className="login-copyright">
          {t.copyright}
        </p>
      </div>

      {/* 🔐 PAROLNI TIKLASH MODAL */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '32px',
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: '0 0 24px 0',
                fontSize: '20px',
                fontWeight: '600',
                color: '#1f2937',
                textAlign: 'center',
              }}
            >
              Parolni tiklash
            </h3>

            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#1f2937',
                    marginBottom: '8px',
                  }}
                >
                  Telefon raqami
                </label>
                <input
                  type="text"
                  placeholder="975661099"
                  value={resetPhone}
                  onChange={(e) => setResetPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#556ee6';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setResetPhone('');
                  }}
                  disabled={isSendingOtp}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#e5e7eb',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isSendingOtp ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSendingOtp) {
                      e.currentTarget.style.backgroundColor = '#d1d5db';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#e5e7eb';
                  }}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isSendingOtp}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#556ee6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isSendingOtp ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSendingOtp) {
                      e.currentTarget.style.backgroundColor = '#4c5fd6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#556ee6';
                  }}
                >
                  {isSendingOtp ? (
                    <>
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: 'white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                        }}
                      />
                      Yuborilmoqda...
                    </>
                  ) : (
                    'Kodni yuborish'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔐 SMS KODNI TASDIQLASH MODAL */}
      {isOtpModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setIsOtpModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '32px',
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: '0 0 16px 0',
                fontSize: '20px',
                fontWeight: '600',
                color: '#1f2937',
                textAlign: 'center',
              }}
            >
              SMS kodni tasdiqlash
            </h3>

            <p
              style={{
                fontSize: '13px',
                color: '#6b7280',
                textAlign: 'center',
                marginBottom: '24px',
              }}
            >
              Tasdiqlash kodi quyidagi raqamga yuborildi:{' '}
              <span style={{ fontWeight: '600', color: '#1f2937' }}>
                +998{localStorage.getItem('resetPhone') || ''}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOtpModalOpen(false);
                  setIsModalOpen(true);
                  setResetPhone(localStorage.getItem('resetPhone') || '');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#556ee6',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  padding: '0',
                  marginLeft: '8px',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none';
                }}
              >
                O'zgartirish
              </button>
            </p>

            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#1f2937',
                    marginBottom: '8px',
                  }}
                >
                  SMS Kod
                </label>
                <input
                  type="text"
                  placeholder="XXXXXX"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  maxLength={6}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    letterSpacing: '2px',
                    textAlign: 'center',
                    fontWeight: '600',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#556ee6';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }}
                  required
                />
              </div>

              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={countdown > 0}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: countdown > 0 ? '#9ca3af' : '#556ee6',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                    padding: '0',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (countdown === 0) {
                      e.currentTarget.style.textDecoration = 'underline';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = 'none';
                  }}
                >
                  Kodni qayta yuborish: {countdown > 0 ? `${countdown} soniya` : 'Yuborish'}
                </button>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsOtpModalOpen(false);
                    setOtpCode('');
                    localStorage.removeItem('resetPhone');
                  }}
                  disabled={isVerifyingOtp}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#e5e7eb',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isVerifyingOtp ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isVerifyingOtp) {
                      e.currentTarget.style.backgroundColor = '#d1d5db';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#e5e7eb';
                  }}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingOtp}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#556ee6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isVerifyingOtp ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isVerifyingOtp) {
                      e.currentTarget.style.backgroundColor = '#4c5fd6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#556ee6';
                  }}
                >
                  {isVerifyingOtp ? (
                    <>
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: 'white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                        }}
                      />
                      Tasdiqlanmoqda...
                    </>
                  ) : (
                    'Kodni tasdiqlash'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔐 PAROLNI O'ZGARTIRISH MODAL */}
      {isPasswordModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setIsPasswordModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '32px',
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: '0 0 16px 0',
                fontSize: '20px',
                fontWeight: '600',
                color: '#1f2937',
                textAlign: 'center',
              }}
            >
              Parolni o'zgartirish
            </h3>

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#1f2937',
                    marginBottom: '8px',
                  }}
                >
                  Yangi parol
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Yangi parol"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      paddingRight: '40px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#556ee6';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6b7280',
                    }}
                  >
                    {showNewPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontWeight: '600',
                    fontSize: '14px',
                    color: '#1f2937',
                    marginBottom: '8px',
                  }}
                >
                  Parolni tasdiqlash
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Parolni tasdiqlash"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      paddingRight: '40px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#556ee6';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6b7280',
                    }}
                  >
                    {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  disabled={isChangingPassword}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#e5e7eb',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isChangingPassword ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isChangingPassword) {
                      e.currentTarget.style.backgroundColor = '#d1d5db';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#e5e7eb';
                  }}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#556ee6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isChangingPassword ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isChangingPassword) {
                      e.currentTarget.style.backgroundColor = '#4c5fd6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#556ee6';
                  }}
                >
                  {isChangingPassword ? (
                    <>
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTopColor: 'white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                        }}
                      />
                      O'zgartirilmoqda...
                    </>
                  ) : (
                    'O\'zgartirish'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;