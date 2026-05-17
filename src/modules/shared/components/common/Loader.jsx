// Loader.jsx — v3 : bouton réessayer si bloqué + design premium
import { useState, useEffect } from 'react';
import { supabase, clearCurrentCompany } from '../../../../supabaseClient';

export const Loader = ({ message = "Chargement...", fullScreen = true, timeout = 10000 }) => {
  const [showRetry, setShowRetry] = useState(false);

  // Si le Loader reste affiché plus de `timeout` ms → montrer le bouton Réessayer
  useEffect(() => {
    const t = setTimeout(() => setShowRetry(true), timeout);
    return () => clearTimeout(t);
  }, [timeout]);

  const handleForceLogout = async () => {
    try {
      clearCurrentCompany();
      await supabase.auth.signOut();
    } catch (_) {}
    window.location.reload();
  };

  const handleReload = () => window.location.reload();

  const containerStyle = fullScreen ? {
    background: 'var(--bg)',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } : {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 20px',
  };

  return (
    <div style={containerStyle}>
      <div style={{ textAlign: 'center', maxWidth: 280 }}>
        {/* Spinner */}
        <div style={{ width: 64, height: 64, margin: '0 auto 20px', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(79,158,255,0.2) 0%, rgba(99,102,241,0.1) 100%)', border: '1.5px solid rgba(79,158,255,0.2)' }} />
          <div style={{ position: 'absolute', inset: 4, borderRadius: '50%', border: '2px solid transparent', borderTopColor: 'var(--accent)', animation: 'spin 0.9s linear infinite' }} />
          <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', border: '2px solid transparent', borderTopColor: 'rgba(79,158,255,0.3)', animation: 'spin 1.4s linear infinite reverse' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📦</div>
        </div>

        <div style={{ fontSize: 14, color: 'var(--text2)', fontWeight: 500 }}>{message}</div>

        {/* Dots */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 14 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', opacity: 0.4, animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>

        {/* Boutons de secours après timeout */}
        {showRetry && (
          <div style={{ marginTop: 28, animation: 'fadeIn 0.4s ease' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.5 }}>
              Le chargement prend plus de temps que prévu.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={handleReload} style={{
                padding: '10px 20px', background: 'var(--blue-dim)', color: 'var(--blue)',
                border: '1px solid rgba(79,158,255,0.25)', borderRadius: 11,
                fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font)',
              }}>
                🔄 Réessayer
              </button>
              <button onClick={handleForceLogout} style={{
                padding: '10px 20px', background: 'var(--red-dim)', color: 'var(--red)',
                border: '1px solid rgba(248,113,113,0.25)', borderRadius: 11,
                fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font)',
              }}>
                Se déconnecter
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const ButtonLoader = ({ size = 16 }) => (
  <span style={{ display: 'inline-block', width: size, height: size, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginRight: 8, verticalAlign: 'middle', flexShrink: 0 }} />
);

export const CardSkeleton = () => (
  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 18, overflow: 'hidden' }}>
    {[40, 80, 60].map((w, i) => (
      <div key={i} style={{ width: `${w}%`, height: i === 1 ? 28 : 14, background: 'var(--card2)', borderRadius: 8, marginBottom: i < 2 ? 12 : 0, backgroundImage: 'linear-gradient(90deg, var(--card) 0%, var(--card2) 50%, var(--card) 100%)', backgroundSize: '200% 100%', animation: `shimmer 1.5s infinite` }} />
    ))}
  </div>
);

export const TableSkeleton = ({ rows = 4, columns = 3 }) => (
  <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
    {Array(rows).fill(0).map((_, i) => (
      <div key={i} style={{ padding: '12px 14px', borderBottom: i < rows - 1 ? '1px solid var(--border)' : 'none', display: 'flex', gap: 12 }}>
        {Array(columns).fill(0).map((_, j) => (
          <div key={j} style={{ flex: j === 0 ? 2 : 1, height: 14, background: 'var(--card2)', borderRadius: 6, backgroundImage: 'linear-gradient(90deg, var(--card) 0%, var(--card2) 50%, var(--card) 100%)', backgroundSize: '200% 100%', animation: `shimmer 1.5s ${j * 0.1}s infinite` }} />
        ))}
      </div>
    ))}
  </div>
);
