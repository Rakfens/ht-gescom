import { formatAr, STATUTS } from './constants';

// Fonction utilitaire pour obtenir le logo
const getLogoUrl = (logoUrlParam) => {
  // Priorité : paramètre passé > localStorage > fichier public par défaut
  if (logoUrlParam && logoUrlParam !== 'null' && logoUrlParam !== 'undefined') {
    return logoUrlParam;
  }
  try {
    const saved = localStorage.getItem('aterinay_logo_url');
    if (saved && saved !== 'null' && saved !== 'undefined') {
      return saved;
    }
  } catch (e) {
    console.error('Erreur lecture logo:', e);
  }
  // Logo par défaut du dossier public
  return '/logo.png';
};

export const generateClientPDF = (client, livraisons, recuperation, province, logoUrlParam) => {
  const date = new Date().toISOString().split('T')[0];
  const w = window.open('', '_blank');
  if (!w) { alert('Autorisez les popups'); return; }
  
  const logoUrl = getLogoUrl(logoUrlParam);
  
  const livreesFacturees = livraisons.filter(l => l.statut === 'livre' && l.paiement !== 'client');
  const totalMontant = livreesFacturees.reduce((s, l) => s + parseFloat(l.montant || 0), 0);
  const net = totalMontant - (parseFloat(recuperation) || 0) - (parseFloat(province) || 0);
  
  let livraisonsHtml = '';
  for (let i = 0; i < livraisons.length; i++) {
    const l = livraisons[i];
    let statutText = STATUTS[l.statut]?.label || l.statut;
    let montantText = '-';
    let isPayeClient = l.paiement === 'client';
    
    if (l.statut === 'livre' && !isPayeClient) {
      montantText = formatAr(parseFloat(l.montant || 0));
    } else if (isPayeClient) {
      montantText = 'Payé client';
    } else if (l.statut === 'retourne') {
      montantText = 'Retourné';
    } else if (l.statut === 'reporte') {
      montantText = 'Reporté';
    } else if (l.statut === 'province') {
      montantText = 'Province';
    }
    
    livraisonsHtml += `
      <div class="item">
        <div class="item-header">📦 ${l.colis || '-'}</div>
        <div class="item-dest">🚚 ${l.destinataire || '-'}${l.destinataire_lieu ? ' • ' + l.destinataire_lieu : ''}</div>
        <div class="item-row"><span>Statut :</span><span>${statutText}</span></div>
        <div class="item-row"><span>Montant :</span><span>${montantText}</span></div>
      </div>
    `;
  }
  
  w.document.write(`<!DOCTYPE html>
  <html>
  <head><meta charset="UTF-8"><title>Facture - ${client}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Courier New',monospace;font-size:11px;max-width:180mm;margin:0 auto;padding:8px;color:#000}
    .header{text-align:center;margin-bottom:15px;padding-bottom:8px;border-bottom:1px solid #000;display:flex;align-items:center;justify-content:center;gap:10px}
    .logo{width:40px;height:40px;object-fit:contain}
    .title{font-size:14px;font-weight:bold}
    .subtitle{font-size:10px;color:#444}
    .client-box{margin:10px 0;padding:8px;border:1px solid #000;background:#f5f5f5}
    .client-name{font-weight:bold;font-size:13px}
    .client-date{font-size:10px;color:#444;margin-top:3px}
    .section-title{font-weight:bold;margin:12px 0 8px 0;padding-bottom:3px;border-bottom:1px solid #ccc;font-size:11px}
    .item{border:1px solid #ddd;margin-bottom:8px;padding:8px;background:#fff}
    .item-header{font-weight:bold;margin-bottom:5px;font-size:12px}
    .item-dest{font-size:10px;color:#444;margin-bottom:5px}
    .item-row{display:flex;justify-content:space-between;margin:3px 0;font-size:10px}
    .total-box{margin:12px 0;padding:8px;background:#f0f0f0;border:1px solid #000;text-align:right}
    .total-row{display:flex;justify-content:space-between;margin:4px 0}
    .net-row{font-weight:bold;font-size:12px;border-top:1px solid #000;padding-top:6px;margin-top:6px}
    .footer{text-align:center;margin-top:15px;padding-top:8px;border-top:1px solid #ccc;font-size:9px;color:#666}
    .no-print{text-align:center;margin-top:15px}
    .print-btn,.close-btn{background:#333;color:#fff;border:none;padding:8px 16px;margin:0 5px;cursor:pointer;font-size:11px}
    .close-btn{background:#999}
    @media print{.no-print{display:none}body{padding:0}}
  </style>
  </head>
  <body>
    <div class="header">
      <img src="${logoUrl}" class="logo" onerror="this.style.display='none'">
      <div>
        <div class="title">ATERINAY SERVICES</div>
        <div class="subtitle">Relevé de livraisons</div>
      </div>
    </div>
    <div class="client-box">
      <div class="client-name">🏪 CLIENT : ${client}</div>
      <div class="client-date">📅 Date : ${date}</div>
    </div>
    <div class="section-title">📦 LIVRAISONS CONFIÉES (${livraisons.length})</div>
    ${livraisonsHtml}
    <div class="total-box">
      <div class="total-row"><span>Total livraisons facturées :</span><span>${formatAr(totalMontant)}</span></div>
      ${recuperation ? `<div class="total-row"><span>- Récupération matin :</span><span>- ${formatAr(recuperation)}</span></div>` : ''}
      ${province ? `<div class="total-row"><span>- Envoi province :</span><span>- ${formatAr(province)}</span></div>` : ''}
      <div class="total-row net-row"><span>💳 MONTANT À VERSER :</span><span>${formatAr(net)}</span></div>
    </div>
    <div class="footer">Aterinay Services — Merci pour votre confiance</div>
    <div class="no-print"><button class="print-btn" onclick="window.print()">🖨️ Imprimer</button><button class="close-btn" onclick="window.close()">✕ Fermer</button></div>
  </body>
  </html>`);
  w.document.close();
  setTimeout(() => w.print(), 500);
};

export const printAgentList = (agent, livraisons, date, logoUrlParam) => {
  const w = window.open('', '_blank');
  if (!w) return;
  
  const logoUrl = getLogoUrl(logoUrlParam);
  
  // Regrouper par DESTINATAIRE
  const destinatairesMap = {};
  let grandTotalMontant = 0;
  let grandTotalFrais = 0;
  
  for (const l of livraisons) {
    const destinataire = l.destinataire;
    const montant = l.paiement === 'client' ? 0 : parseFloat(l.montant || 0);
    const frais = parseFloat(l.frais || 0);
    
    grandTotalMontant += montant;
    grandTotalFrais += frais;
    
    if (!destinatairesMap[destinataire]) {
      destinatairesMap[destinataire] = {
        destinataire: destinataire,
        telephone: l.destinataire_telephone || '',
        lieu: l.destinataire_lieu || '',
        livraisons: [],
        totalMontant: 0,
        totalFrais: 0,
        totalGeneral: 0
      };
    }
    destinatairesMap[destinataire].livraisons.push(l);
    destinatairesMap[destinataire].totalMontant += montant;
    destinatairesMap[destinataire].totalFrais += frais;
    destinatairesMap[destinataire].totalGeneral += (montant + frais);
  }
  
  let clientsHtml = '';
  let destinataireNum = 1;
  
  for (const destinataire in destinatairesMap) {
    const data = destinatairesMap[destinataire];
    
    clientsHtml += `<div class="client-card">`;
    clientsHtml += `<div class="client-header">🚚 DESTINATAIRE ${destinataireNum} : ${data.destinataire}`;
    if (data.telephone) clientsHtml += `<div class="client-phone">📞 ${data.telephone}</div>`;
    if (data.lieu) clientsHtml += `<div class="client-lieu">📍 ${data.lieu}</div>`;
    clientsHtml += `</div>`;
    clientsHtml += `<div class="client-livraisons">`;
    
    for (let i = 0; i < data.livraisons.length; i++) {
      const l = data.livraisons[i];
      const montant = l.paiement === 'client' ? 0 : parseFloat(l.montant || 0);
      const frais = parseFloat(l.frais || 0);
      const statut = STATUTS[l.statut]?.label || l.statut;
      
      clientsHtml += `
        <div class="liv-item">
          <div class="liv-title">📦 ${i+1}. ${l.colis}</div>
          <div class="liv-row"><span>🏪 Client donneur :</span><span>${l.client_donneur || '-'}</span></div>
          <div class="liv-row"><span>💰 Montant :</span><span>${l.paiement === 'client' ? 'Payé client' : formatAr(montant)}</span></div>
          <div class="liv-row"><span>🚚 Frais :</span><span>${formatAr(frais)}</span></div>
          <div class="liv-row"><span>📊 Statut :</span><span>${statut}</span></div>
        </div>
      `;
    }
    
    clientsHtml += `<div class="client-total">`;
    clientsHtml += `<div class="total-line">💰 TOTAL MONTANT : ${formatAr(data.totalMontant)}</div>`;
    clientsHtml += `<div class="total-line">🚚 TOTAL FRAIS : ${formatAr(data.totalFrais)}</div>`;
    clientsHtml += `<div class="total-line grand">💵 TOTAL À PAYER PAR LE DESTINATAIRE : ${formatAr(data.totalGeneral)}</div>`;
    clientsHtml += `</div></div>`;
    destinataireNum++;
  }
  
  const grandTotalGeneral = grandTotalMontant + grandTotalFrais;
  
  w.document.write(`<!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Rapport livreur - ${agent.nom}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Courier New',monospace;font-size:10px;width:72mm;margin:0 auto;padding:3px;color:#000}
      .header{text-align:center;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #000;display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap}
      .logo{width:25px;height:25px;object-fit:contain}
      .title{font-weight:bold;font-size:11px}
      .subtitle{font-size:8px}
      .client-card{border:1px solid #000;margin-bottom:8px;background:#fff}
      .client-header{background:#000;color:#fff;padding:5px;text-align:center;font-weight:bold;font-size:9px}
      .client-phone{font-size:7px;margin-top:2px;opacity:0.8}
      .client-lieu{font-size:7px;margin-top:2px;opacity:0.8}
      .client-livraisons{padding:5px}
      .liv-item{border-bottom:1px solid #ccc;padding:5px 0;margin-bottom:5px}
      .liv-title{font-weight:bold;font-size:9px;margin-bottom:3px}
      .liv-row{display:flex;justify-content:space-between;font-size:8px;margin:2px 0}
      .client-total{background:#f0f0f0;padding:5px;border-top:1px solid #ccc}
      .total-line{display:flex;justify-content:space-between;font-size:8px;margin:2px 0}
      .grand{font-weight:bold;border-top:1px solid #000;margin-top:3px;padding-top:3px}
      .grand-total{background:#000;color:#fff;padding:6px;margin-top:6px;text-align:center}
      .gt-row{display:flex;justify-content:space-between;font-size:8px;margin:2px 0}
      .gt-total{font-weight:bold;border-top:1px solid #444;margin-top:4px;padding-top:4px;font-size:10px}
      .footer{text-align:center;margin-top:8px;padding-top:4px;border-top:1px solid #ccc;font-size:7px}
      .no-print{text-align:center;margin-top:8px}
      .print-btn{background:#000;color:#fff;border:none;padding:5px 10px;cursor:pointer}
      @media print{.no-print{display:none}}
    </style>
  </head>
  <body>
    <div class="header">
      <img src="${logoUrl}" class="logo" onerror="this.style.display='none'">
      <div>
        <div class="title">ATERINAY SERVICES</div>
        <div class="subtitle">Livraisons du ${date}</div>
        <div class="subtitle">👨‍💼 Livreur : ${agent.nom}</div>
      </div>
    </div>
    ${clientsHtml}
    <div class="grand-total">
      <div class="gt-row"><span>💰 TOTAL GÉNÉRAL MONTANT :</span><span>${formatAr(grandTotalMontant)}</span></div>
      <div class="gt-row"><span>🚚 TOTAL GÉNÉRAL FRAIS :</span><span>${formatAr(grandTotalFrais)}</span></div>
      <div class="gt-total gt-row"><span>💵 TOTAL GÉNÉRAL À REMETTRE AU LIVREUR :</span><span>${formatAr(grandTotalGeneral)}</span></div>
    </div>
    <div class="footer">--- Merci pour votre travail ---</div>
    <div class="no-print"><button class="print-btn" onclick="window.print()">🖨️ Imprimer</button></div>
  </body>
  </html>`);
  w.document.close();
  setTimeout(() => w.print(), 500);
};