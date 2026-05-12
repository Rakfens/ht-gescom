// modules/shared/utils/helpers.js
import { COLORS } from './constants';

// ==================== FORMULAIRES ====================

export const inp = () => ({ 
  padding: '11px 14px', 
  borderRadius: 9, 
  border: '1px solid ' + COLORS.border2, 
  background: COLORS.bg, 
  color: COLORS.text, 
  fontSize: 14, 
  outline: 'none', 
  width: '100%', 
  boxSizing: 'border-box',
  transition: 'border-color 0.2s ease'
});

export const inpSm = () => ({ 
  ...inp(), 
  fontSize: 13, 
  padding: '9px 12px' 
});

export const inpLg = () => ({ 
  ...inp(), 
  fontSize: 15, 
  padding: '13px 16px' 
});

export const inpError = () => ({
  ...inp(),
  borderColor: COLORS.red,
  boxShadow: `0 0 0 1px ${COLORS.red}`
});

export const inpSuccess = () => ({
  ...inp(),
  borderColor: COLORS.green,
  boxShadow: `0 0 0 1px ${COLORS.green}`
});

// ==================== BOUTONS ====================

export const btn = (c1, c2) => ({ 
  padding: '11px 18px', 
  background: `linear-gradient(135deg, ${c1}, ${c2})`, 
  color: '#fff', 
  border: 'none', 
  borderRadius: 9, 
  fontWeight: 700, 
  fontSize: 13, 
  cursor: 'pointer',
  transition: 'transform 0.1s ease, opacity 0.2s ease',
  ':active': { transform: 'scale(0.98)' }
});

export const btnSm = (c1, c2) => ({ 
  ...btn(c1, c2), 
  padding: '6px 12px', 
  fontSize: 11 
});

export const btnLg = (c1, c2) => ({ 
  ...btn(c1, c2), 
  padding: '14px 24px', 
  fontSize: 15 
});

export const btnOutline = (color) => ({ 
  padding: '11px 18px', 
  background: 'transparent', 
  color: color, 
  border: `1px solid ${color}`, 
  borderRadius: 9, 
  fontWeight: 700, 
  fontSize: 13, 
  cursor: 'pointer',
  transition: 'all 0.2s ease'
});

export const btnDanger = () => btn(COLORS.red, '#b91c1c');
export const btnSuccess = () => btn(COLORS.green, '#047857');
export const btnPrimary = () => btn(COLORS.blue, '#2563eb');
export const btnWarning = () => btn(COLORS.orange, '#d97706');

// ==================== TAGS & BADGES ====================

export const tag = (bg, col) => ({ 
  background: bg, 
  color: col, 
  padding: '3px 9px', 
  borderRadius: 20, 
  fontSize: 11, 
  fontWeight: 700, 
  display: 'inline-block' 
});

export const tagSuccess = () => tag('#064e3b', '#34d399');
export const tagError = () => tag('#450a0a', '#f87171');
export const tagWarning = () => tag('#451a03', '#fbbf24');
export const tagInfo = () => tag('#1e3a5f', '#60a5fa');
export const tagNeutral = () => tag('#334155', '#cbd5e1');

// ==================== LABELS ====================

export const lbl = () => ({ 
  fontSize: 11, 
  fontWeight: 600, 
  color: COLORS.subtle, 
  display: 'block', 
  marginBottom: 5 
});

export const lblRequired = () => ({
  ...lbl(),
  '::after': { content: '" *"', color: COLORS.red }
});

// ==================== CARTES & CONTENEURS ====================

export const card = () => ({
  background: COLORS.card,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 12,
  padding: '16px 20px',
  marginBottom: 16
});

export const cardHover = () => ({
  ...card(),
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  ':hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
  }
});

// ==================== MODALES ====================

export const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16
  },
  container: {
    background: COLORS.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90vh',
    overflow: 'auto',
    border: `1px solid ${COLORS.border2}`,
    animation: 'modalFadeIn 0.2s ease-out'
  }
};

// ==================== TABLEAUX ====================

export const table = () => ({
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 13
});

export const th = () => ({
  padding: '12px 16px',
  textAlign: 'left',
  color: COLORS.muted,
  fontWeight: 600,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  borderBottom: `1px solid ${COLORS.border}`
});

export const td = () => ({
  padding: '12px 16px',
  borderBottom: `1px solid ${COLORS.border}`,
  color: COLORS.text
});

// ==================== GRILLES ====================

export const grid = (columns = 2, gap = 16) => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${columns}, 1fr)`,
  gap: gap
});

export const flexBetween = () => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
});

export const flexCenter = () => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
});

export const flexColumn = () => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 12
});

// ==================== ESPACEMENTS ====================

export const spacing = {
  p1: { padding: 4 },
  p2: { padding: 8 },
  p3: { padding: 12 },
  p4: { padding: 16 },
  p5: { padding: 20 },
  m1: { margin: 4 },
  m2: { margin: 8 },
  m3: { margin: 12 },
  m4: { margin: 16 },
  m5: { margin: 20 },
  mb1: { marginBottom: 4 },
  mb2: { marginBottom: 8 },
  mb3: { marginBottom: 12 },
  mb4: { marginBottom: 16 },
  mb5: { marginBottom: 20 },
  mt1: { marginTop: 4 },
  mt2: { marginTop: 8 },
  mt3: { marginTop: 12 },
  mt4: { marginTop: 16 },
  mt5: { marginTop: 20 }
};

// ==================== TEXTES ====================

export const textCenter = () => ({ textAlign: 'center' });
export const textRight = () => ({ textAlign: 'right' });
export const textLeft = () => ({ textAlign: 'left' });

export const title = () => ({
  fontSize: 24,
  fontWeight: 800,
  color: '#f1f5f9',
  marginBottom: 8
});

export const subtitle = () => ({
  fontSize: 14,
  color: COLORS.muted,
  marginBottom: 24
});

// ==================== RESPONSIVE ====================

export const responsive = {
  mobile: '@media (max-width: 768px)',
  tablet: '@media (max-width: 1024px)',
  desktop: '@media (min-width: 1025px)'
};