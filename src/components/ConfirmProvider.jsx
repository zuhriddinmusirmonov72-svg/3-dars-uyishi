import React, { createContext, useContext, useState, useCallback } from 'react';

const ConfirmContext = createContext(null);

export const useConfirm = () => {
  return useContext(ConfirmContext);
};

export const ConfirmProvider = ({ children }) => {
  const [state, setState] = useState({ open: false, title: '', description: '', resolve: null });

  const confirm = useCallback(({ title = "O'chirishni tasdiqlaysizmi?", description = "Ushbu amolni ortga qaytarib bo'lmaydi. Tanlangan ma'lumot tizimdan butunlay o'chiriladi." } = {}) => {
    return new Promise((res) => {
      setState({ open: true, title, description, resolve: res });
    });
  }, []);

  const handleClose = (answer) => {
    if (state.resolve) state.resolve(answer);
    setState({ open: false, title: '', description: '', resolve: null });
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state.open && (
        <div style={overlayStyle} onClick={() => handleClose(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={iconCircleStyle}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
              </div>
            </div>
            <h3 style={{ textAlign: 'center', margin: '8px 0 6px' }}>{state.title}</h3>
            <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', margin: '0 0 18px' }}>{state.description}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button style={cancelBtnStyle} onClick={() => handleClose(false)}>Bekor qilish</button>
              <button style={deleteBtnStyle} onClick={() => handleClose(true)}>O'chirish</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

const overlayStyle = {
  position: 'fixed', left: 0, top: 0, right: 0, bottom: 0,
  background: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20000,
  backdropFilter: 'blur(4px)'
};

const modalStyle = {
  width: '520px', background: '#fff', borderRadius: '12px', padding: '22px', boxShadow: '0 10px 30px rgba(2,6,23,0.12)'
};

const iconCircleStyle = {
  width: '56px', height: '56px', borderRadius: '50%', background: '#fff0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: -36
};

const cancelBtnStyle = {
  padding: '10px 18px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer'
};

const deleteBtnStyle = {
  padding: '10px 18px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer'
};

export default ConfirmProvider;
