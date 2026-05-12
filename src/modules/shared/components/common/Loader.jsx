// modules/shared/components/common/Loader.jsx
import { COLORS } from '../../utils/constants';

export const Loader = ({ message = "Chargement en cours...", fullScreen = true, size = "medium" }) => {
  const sizes = {
    small: { fontSize: 40, textSize: 12 },
    medium: { fontSize: 48, textSize: 14 },
    large: { fontSize: 64, textSize: 16 }
  };
  
  const currentSize = sizes[size] || sizes.medium;
  
  const containerStyle = fullScreen ? {
    background: COLORS.bg,
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: COLORS.text
  } : {
    background: COLORS.bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    color: COLORS.text
  };
  
  return (
    <div style={containerStyle}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ 
          fontSize: currentSize.fontSize, 
          marginBottom: 16,
          animation: 'pulse 1.5s ease-in-out infinite'
        }}>
          📦
        </div>
        <div style={{ fontSize: currentSize.textSize, color: COLORS.muted }}>
          {message}
        </div>
        <div style={{ 
          width: '100%', 
          maxWidth: 200, 
          margin: '12px auto 0',
          height: 2, 
          background: COLORS.border,
          borderRadius: 2,
          overflow: 'hidden'
        }}>
          <div style={{ 
            width: '30%', 
            height: '100%', 
            background: COLORS.blue,
            animation: 'loading 1s ease-in-out infinite'
          }} />
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        @keyframes loading {
          0% { transform: translateX(-100%); width: 30%; }
          50% { width: 70%; }
          100% { transform: translateX(100%); width: 30%; }
        }
      `}</style>
    </div>
  );
};

// Variante : Loader pour les boutons (small spinner)
export const ButtonLoader = () => {
  return (
    <span style={{ 
      display: 'inline-block',
      width: 16,
      height: 16,
      border: `2px solid ${COLORS.border}`,
      borderTopColor: COLORS.blue,
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
      marginRight: 8
    }}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </span>
  );
};

// Variante : Loader pour les cartes (skeleton loader)
export const CardSkeleton = () => {
  return (
    <div style={{ 
      background: COLORS.card, 
      border: `1px solid ${COLORS.border2}`, 
      borderRadius: 12, 
      padding: 20,
      animation: 'pulse 1.5s ease-in-out infinite'
    }}>
      <div style={{ 
        width: '40%', 
        height: 20, 
        background: COLORS.border, 
        borderRadius: 4, 
        marginBottom: 16 
      }} />
      <div style={{ 
        width: '80%', 
        height: 32, 
        background: COLORS.border, 
        borderRadius: 4, 
        marginBottom: 12 
      }} />
      <div style={{ 
        width: '60%', 
        height: 16, 
        background: COLORS.border, 
        borderRadius: 4 
      }} />
    </div>
  );
};

// Variante : Loader pour les tableaux (rows skeleton)
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div style={{ background: COLORS.card, borderRadius: 12, border: `1px solid ${COLORS.border2}`, overflow: 'hidden' }}>
      <div style={{ padding: 12, borderBottom: `1px solid ${COLORS.border2}` }}>
        <div style={{ display: 'flex', gap: 16 }}>
          {Array(columns).fill(0).map((_, i) => (
            <div key={i} style={{ width: `${100 / columns}%`, height: 20, background: COLORS.border, borderRadius: 4 }} />
          ))}
        </div>
      </div>
      {Array(rows).fill(0).map((_, i) => (
        <div key={i} style={{ padding: 12, borderBottom: `1px solid ${COLORS.border}`, display: 'flex', gap: 16 }}>
          {Array(columns).fill(0).map((_, j) => (
            <div key={j} style={{ width: `${100 / columns}%`, height: 16, background: COLORS.border, borderRadius: 4 }} />
          ))}
        </div>
      ))}
    </div>
  );
};