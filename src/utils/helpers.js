import { COLORS } from './constants';

export const inp = () => ({ 
  padding: '11px 14px', 
  borderRadius: 9, 
  border: '1px solid ' + COLORS.border2, 
  background: COLORS.bg, 
  color: COLORS.text, 
  fontSize: 14, 
  outline: 'none', 
  width: '100%', 
  boxSizing: 'border-box' 
});

export const inpSm = () => ({ 
  ...inp(), 
  fontSize: 13, 
  padding: '9px 12px' 
});

export const btn = (c1, c2) => ({ 
  padding: '11px 18px', 
  background: `linear-gradient(135deg,${c1},${c2})`, 
  color: '#fff', 
  border: 'none', 
  borderRadius: 9, 
  fontWeight: 700, 
  fontSize: 13, 
  cursor: 'pointer' 
});

export const tag = (bg, col) => ({ 
  background: bg, 
  color: col, 
  padding: '3px 9px', 
  borderRadius: 20, 
  fontSize: 11, 
  fontWeight: 700, 
  display: 'inline-block' 
});

export const lbl = () => ({ 
  fontSize: 11, 
  fontWeight: 600, 
  color: COLORS.subtle, 
  display: 'block', 
  marginBottom: 5 
});