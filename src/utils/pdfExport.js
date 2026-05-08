export const printAgentList = (agent, livraisons, date, logoUrlParam) => {
  const w = window.open('', '_blank');
  if (!w) return;
  
  // Récupérer le logo depuis localStorage ou utiliser le paramètre
  let logoUrl = logoUrlParam || '';
  
  // Si pas de logo en paramètre, essayer localStorage
  if (!logoUrl) {
    try {
      const savedLogo = localStorage.getItem('logo_url');
      if (savedLogo && savedLogo !== 'null' && savedLogo !== 'undefined') {
        logoUrl = savedLogo;
      }
    } catch (e) {
      console.error('Erreur récupération logo:', e);
    }
  }
  
  // Si toujours pas de logo, essayer depuis la table config via API
  if (!logoUrl) {
    try {
      const { data } = await supabase.from('config').select('valeur').eq('cle', 'logo_url').single();
      if (data?.valeur) {
        logoUrl = data.valeur;
        localStorage.setItem('logo_url', logoUrl);
      }
    } catch (e) {
      console.error('Erreur API logo:', e);
    }
  }
  
  // Fallback final : logo par défaut
  if (!logoUrl) {
    logoUrl = '/logo.png';
  }
  
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
    clientsHtml += `<div class="client-header">DESTINATAIRE ${destinataireNum} : ${data.destinataire}`;
    if (data.telephone) clientsHtml += `<div class="client-phone">TEL: ${data.telephone}</div>`;
    if (data.lieu) clientsHtml += `<div class="client-lieu">LIEU: ${data.lieu}</div>`;
    clientsHtml += `</div>`;
    clientsHtml += `<div class="client-livraisons">`;
    
    for (let i = 0; i < data.livraisons.length; i++) {
      const l = data.livraisons[i];
      const montant = l.paiement === 'client' ? 0 : parseFloat(l.montant || 0);
      const frais = parseFloat(l.frais || 0);
      const statut = STATUTS[l.statut]?.label || l.statut;
      
      clientsHtml += `
        <div class="liv-item">
          <div class="liv-title">${i+1}. ${l.colis}</div>
          <div class="liv-row"><span>Client donneur :</span><span>${l.client_donneur || '-'}</span></div>
          <div class="liv-row"><span>Montant :</span><span>${l.paiement === 'client' ? 'Paye client' : formatAr(montant)}</span></div>
          <div class="liv-row"><span>Frais :</span><span>${formatAr(frais)}</span></div>
          <div class="liv-row"><span>Statut :</span><span>${statut}</span></div>
        </div>
      `;
    }
    
    clientsHtml += `<div class="client-total">`;
    clientsHtml += `<div class="total-line">TOTAL MONTANT : ${formatAr(data.totalMontant)}</div>`;
    clientsHtml += `<div class="total-line">TOTAL FRAIS : ${formatAr(data.totalFrais)}</div>`;
    clientsHtml += `<div class="total-line grand">TOTAL CLIENT : ${formatAr(data.totalGeneral)}</div>`;
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
      body{
        font-family:'Courier New',monospace;
        font-size:11px;
        width:72mm;
        margin:0 auto;
        padding:3px;
        color:#000;
        background:#fff;
      }
      .header{text-align:center;margin-bottom:8px;padding-bottom:4px;border-bottom:2px solid #000}
      .logo{width:28px;height:28px;object-fit:contain}
      .title{font-weight:bold;font-size:13px;margin:2px 0}
      .subtitle{font-size:9px}
      .client-card{border:1px solid #000;margin-bottom:8px;background:#fff}
      .client-header{background:#000;color:#fff;padding:5px;text-align:center;font-weight:bold;font-size:10px}
      .client-phone{font-size:8px;margin-top:2px}
      .client-lieu{font-size:8px;margin-top:2px}
      .client-livraisons{padding:5px}
      .liv-item{border-bottom:1px solid #999;padding:6px 0;margin-bottom:4px}
      .liv-title{font-weight:bold;font-size:10px;margin-bottom:3px}
      .liv-row{display:flex;justify-content:space-between;font-size:9px;margin:2px 0}
      .client-total{background:#eee;padding:5px;border-top:1px solid #000}
      .total-line{display:flex;justify-content:space-between;font-size:9px;margin:2px 0}
      .grand{font-weight:bold;border-top:1px solid #000;margin-top:4px;padding-top:4px}
      .grand-total{background:#000;color:#fff;padding:6px;margin-top:6px;text-align:center}
      .gt-row{display:flex;justify-content:space-between;font-size:9px;margin:2px 0}
      .gt-total{font-weight:bold;border-top:1px solid #444;margin-top:4px;padding-top:4px;font-size:11px}
      .footer{text-align:center;margin-top:8px;padding-top:4px;border-top:1px solid #ccc;font-size:8px}
      .no-print{text-align:center;margin-top:8px}
      .print-btn{background:#000;color:#fff;border:none;padding:5px 10px;cursor:pointer;font-size:10px}
      @media print{.no-print{display:none}}
    </style>
  </head>
  <body>
    <div class="header">
      <img src="${logoUrl}" class="logo" onerror="this.style.display='none'">
      <div class="title">ATERINAY SERVICES</div>
      <div class="subtitle">Livraisons du ${date}</div>
      <div class="subtitle">Livreur : ${agent.nom}</div>
    </div>
    ${clientsHtml}
    <div class="grand-total">
      <div class="gt-row"><span>TOTAL MONTANT :</span><span>${formatAr(grandTotalMontant)}</span></div>
      <div class="gt-row"><span>TOTAL FRAIS :</span><span>${formatAr(grandTotalFrais)}</span></div>
      <div class="gt-total gt-row"><span>TOTAL A REMETTRE :</span><span>${formatAr(grandTotalGeneral)}</span></div>
    </div>
    <div class="footer">--- Merci pour votre travail ---</div>
    <div class="no-print"><button class="print-btn" onclick="window.print()">IMPRIMER</button></div>
  </body>
  </html>`);
  w.document.close();
  setTimeout(() => w.print(), 500);
};