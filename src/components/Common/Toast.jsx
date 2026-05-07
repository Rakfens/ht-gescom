export const Toast = ({ toast }) => {
  if (!toast) return null;
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
      background: toast.type === 'error' ? '#ef4444' : toast.type === 'warn' ? '#f59e0b' : '#10b981', 
      textAlign: 'center', 
      maxWidth: 500, 
      margin: '0 auto' 
    }}>
      {toast.msg}
    </div>
  );
};