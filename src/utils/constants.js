// ==================== FONCTIONS DATE ====================
export const TODAY = () => new Date().toISOString().split('T')[0];
export const CURRENT_MONTH = () => TODAY().slice(0, 7);
export const currentMonth = CURRENT_MONTH;

export const monthLabel = (m) => {
  if (!m) return '';
  const [y, mo] = m.split('-');
  const mois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  return `${mois[parseInt(mo) - 1]} ${y}`;
};

// ==================== FORMATAGE ====================
export const formatAr = (n) => (n || 0).toLocaleString() + ' Ar';

// ==================== STATUTS DES LIVRAISONS ====================
export const STATUTS = {
  en_cours: { label: 'En cours', color: '#f59e0b', bg: '#451a03' },
  livre: { label: 'Livré', color: '#34d399', bg: '#14532d' },
  retourne: { label: 'Retourné', color: '#f87171', bg: '#450a0a' },
  reporte: { label: 'Reporté', color: '#a78bfa', bg: '#2e1065' },
  province: { label: 'Province', color: '#38bdf8', bg: '#0c4a6e' },
};

// ==================== MODES DE PAIEMENT ====================
export const PAIE_MODES = {
  espece: { label: 'Espèces', icon: '💵' },
  mobile_money: { label: 'Mobile Money', icon: '📱' },
  client: { label: 'Payé au client', icon: '🤝' },
};

// ==================== COULEURS (STYLES) ====================
export const COLORS = {
  bg: '#0b1120',
  card: '#141e2e',
  border: '#1e293b',
  border2: '#2d3d55',
  text: '#e2e8f0',
  muted: '#64748b',
  subtle: '#94a3b8',
  blue: '#3b82f6',
  green: '#34d399',
  orange: '#fb923c',
  yellow: '#fbbf24',
  red: '#f87171',
  purple: '#a78bfa',
  teal: '#38bdf8',
  pink: '#f472b6'
};

// ==================== AUTHENTIFICATION ====================
export const LOGIN_EMAIL = 'admin@aterinay.com';
export const LOGIN_PASSWORD = 'admin123';
export const COMMISSION_DEFAUT = 500;

// ==================== COMMISSION GÉRANT ====================
// Clients exclus de la commission (le gérant ne gagne rien pour ces clients)
export const EXCLUDED_CLIENTS = ['POMANAY', 'ZAZATIANA' ];

// Fonction pour déterminer si le gérant doit recevoir une commission
// Le gérant gagne sa commission si :
// 1. Les frais sont payés (frais > 0)
// 2. Le client donneur n'est pas dans la liste des exclus
export const shouldCountGerantCommission = (livraison) => {
  // Vérifier si les frais sont payés
  const hasFrais = parseFloat(livraison.frais || 0) > 0;
  
  if (!hasFrais) {
    return false;
  }
  
  // Vérifier si le client donneur est exclu
  const clientDonneur = livraison.client_donneur?.toUpperCase() || '';
  const isExcluded = EXCLUDED_CLIENTS.includes(clientDonneur);
  
  // Si le client est exclus, pas de commission
  if (isExcluded) {
    return false;
  }
  
  // Sinon, commission accordée
  return true;
};

// ==================== CLIENTS EXCLUS POUR AFFICHAGE ====================
export const getExcludedClientsText = () => {
  return EXCLUDED_CLIENTS.join(', ');
};