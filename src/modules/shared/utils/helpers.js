// helpers.js — v2 design système unifié
import { COLORS } from './constants';

// ==================== FORMULAIRES ====================

export const inp = () => ({
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid var(--border2)',
  background: 'rgba(255,255,255,0.04)',
  color: 'var(--text)',
  fontSize: 14,
  fontFamily: 'var(--font)',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
});

export const inpSm = () => ({
  ...inp(),
  fontSize: 13,
  padding: '9px 12px',
  borderRadius: 10,
});

export const inpLg = () => ({
  ...inp(),
  fontSize: 15,
  padding: '14px 16px',
});

export const inpError = () => ({
  ...inp(),
  borderColor: 'var(--red)',
  boxShadow: '0 0 0 2px rgba(248,113,113,0.18)',
});

export const inpSuccess = () => ({
  ...inp(),
  borderColor: 'var(--green)',
  boxShadow: '0 0 0 2px rgba(52,211,153,0.18)',
});

// ==================== BOUTONS ====================

export const btn = (c1, c2) => ({
  padding: '11px 18px',
  background: c2
    ? `linear-gradient(135deg, ${c1}, ${c2})`
    : c1,
  color: '#fff',
  border: 'none',
  borderRadius: 11,
  fontWeight: 700,
  fontFamily: 'var(--font)',
  fontSize: 13,
  cursor: 'pointer',
  letterSpacing: '-0.01em',
  transition: 'opacity 0.15s ease, transform 0.15s ease',
});

export const btnSm = (c1, c2) => ({
  ...btn(c1, c2),
  padding: '7px 13px',
  fontSize: 12,
  borderRadius: 9,
});

export const btnLg = (c1, c2) => ({
  ...btn(c1, c2),
  padding: '14px 24px',
  fontSize: 15,
  borderRadius: 13,
});

export const btnOutline = (color) => ({
  padding: '10px 16px',
  background: `${color}14`,
  color: color,
  border: `1px solid ${color}30`,
  borderRadius: 11,
  fontWeight: 600,
  fontFamily: 'var(--font)',
  fontSize: 13,
  cursor: 'pointer',
  transition: 'all 0.18s ease',
});

export const btnGhost = () => ({
  padding: '9px 14px',
  background: 'transparent',
  color: 'var(--text2)',
  border: '1px solid var(--border2)',
  borderRadius: 10,
  fontWeight: 600,
  fontFamily: 'var(--font)',
  fontSize: 13,
  cursor: 'pointer',
  transition: 'all 0.18s ease',
});

export const btnDanger = () => ({
  ...btn('var(--red)', 'var(--red2)'),
  boxShadow: '0 4px 16px rgba(248,113,113,0.25)',
});

// ==================== LABELS ====================

export const lbl = () => ({
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--muted)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  display: 'block',
  marginBottom: 7,
});

// ==================== CARDS ====================

export const card = (extra = {}) => ({
  background: 'var(--card)',
  border: '1px solid var(--border2)',
  borderRadius: 16,
  padding: 18,
  ...extra,
});

export const statCard = (color) => ({
  background: `linear-gradient(135deg, ${color}12 0%, ${color}06 100%)`,
  border: `1px solid ${color}20`,
  borderRadius: 18,
  padding: 18,
});

// ==================== SECTIONS ====================

export const section = () => ({
  marginBottom: 20,
});

export const sectionHeader = () => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
});

// ==================== TAG / CHIP ====================
export const tag = (bg, color = '#fff') => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 9px',
  background: bg,
  color: color,
  borderRadius: 100,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.05em',
});

// ==================== MODAL STYLES ====================
export const modalStyles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.65)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    padding: '0 0 0 0',
    animation: 'fadeIn 0.2s ease',
  },
  box: {
    background: 'var(--card)',
    border: '1px solid var(--border2)',
    borderRadius: '24px 24px 0 0',
    padding: '24px 20px 32px',
    width: '100%',
    maxWidth: 480,
    maxHeight: '90vh',
    overflowY: 'auto',
    animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
    boxShadow: '0 -12px 48px rgba(0,0,0,0.5)',
  },
  title: {
    fontSize: 17,
    fontWeight: 700,
    color: 'var(--text)',
    marginBottom: 18,
    letterSpacing: '-0.02em',
  },
  handle: {
    width: 36,
    height: 4,
    background: 'var(--border2)',
    borderRadius: 4,
    margin: '-8px auto 18px',
  },
};
