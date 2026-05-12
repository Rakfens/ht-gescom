// modules/shared/components/common/Toast.jsx
import { useEffect, useState } from 'react';
import { COLORS } from '../../utils/constants';

export const Toast = ({ toast, onClose, duration = 3000 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (toast) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [toast, duration, onClose]);

  if (!toast || !visible) return null;

  const getToastStyles = () => {
    switch (toast.type) {
      case 'error':
        return { background: '#ef4444', icon: '❌' };
      case 'warn':
        return { background: '#f59e0b', icon: '⚠️' };
      case 'success':
        return { background: '#10b981', icon: '✅' };
      case 'info':
        return { background: COLORS.blue, icon: 'ℹ️' };
      default:
        return { background: '#10b981', icon: '✅' };
    }
  };

  const { background, icon } = getToastStyles();

  return (
    <div style={{ 
      position: 'fixed', 
      top: 70, 
      right: 16, 
      left: 16, 
      padding: '12px 18px', 
      borderRadius: 10, 
      color: '#fff', 
      fontWeight: 600, 
      fontSize: 13, 
      zIndex: 9999,
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)', 
      background: background,
      textAlign: 'center', 
      maxWidth: 500, 
      margin: '0 auto',
      backdropFilter: 'blur(10px)',
      animation: 'slideIn 0.3s ease-out',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8
    }}>
      <span>{icon}</span>
      <span>{toast.msg}</span>
      <button 
        onClick={() => { setVisible(false); if (onClose) onClose(); }}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          marginLeft: 'auto',
          fontSize: 16,
          opacity: 0.7,
          padding: '0 4px'
        }}
      >
        ✕
      </button>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

// Hook personnalisé pour gérer les toasts
export const useToast = () => {
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  return {
    toast,
    showToast,
    hideToast,
    success: (msg) => showToast(msg, 'success'),
    error: (msg) => showToast(msg, 'error'),
    warn: (msg) => showToast(msg, 'warn'),
    info: (msg) => showToast(msg, 'info')
  };
};

// Composant ToastContainer pour gérer plusieurs toasts
export const ToastContainer = ({ toasts, onClose }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 70,
      right: 16,
      left: 16,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      pointerEvents: 'none'
    }}>
      {toasts.map((toast, index) => (
        <Toast 
          key={toast.id || index} 
          toast={toast} 
          onClose={() => onClose && onClose(toast.id)}
          duration={toast.duration || 3000}
        />
      ))}
    </div>
  );
};

// Version simplifiée (compatible avec votre code existant)
export const ToastSimple = ({ toast, onClose }) => {
  if (!toast) return null;

  const getBackground = () => {
    if (toast.type === 'error') return '#ef4444';
    if (toast.type === 'warn') return '#f59e0b';
    return '#10b981';
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: 65, 
      right: 16, 
      left: 16, 
      padding: '12px 18px', 
      borderRadius: 10, 
      color: '#fff', 
      fontWeight: 600, 
      fontSize: 13, 
      zIndex: 999, 
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)', 
      background: getBackground(), 
      textAlign: 'center', 
      maxWidth: 500, 
      margin: '0 auto' 
    }}>
      {toast.msg}
    </div>
  );
};