import { COLORS } from '../../utils/constants';

export const Loader = () => {
  return (
    <div style={{ 
      background: COLORS.bg, 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      color: COLORS.text 
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 24, marginBottom: 16 }}>📦</div>
        <div>Chargement en cours...</div>
      </div>
    </div>
  );
};