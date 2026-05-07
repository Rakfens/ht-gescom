import { formatAr, STATUTS } from './constants';

export const generateClientPDF = (client, livraisons, recuperation, province, logoUrlParam) => {
  const toutesLivraisons = livraisons;
  
  const livreesFacturees = livraisons.filter(l => l.statut === 'livre' && l.paiement !== 'client');
  const totalMontant = livreesFacturees.reduce((s, l) => s + parseFloat(l.montant || 0), 0);
  const net = totalMontant - (parseFloat(recuperation) || 0) - (parseFloat(province) || 0);
  const date = new Date().toISOString().split('T')[0];
  const w = window.open('', '_blank');
  if (!w) { alert('Autorisez les popups'); return; }
  
  const logoUrl = logoUrlParam || '/logo.png';
  
  // Générer le HTML des livraisons
  let livraisonsHtml = '';
  for (let i = 0; i < toutesLivraisons.length; i++) {
    const l = toutesLivraisons[i];
    
    let montantDisplay = '-';
    let montantColor = '#64748b';
    let statutBg = '#f1f5f9';
    let statutColor = '#475569';
    
    if (l.statut === 'livre' && l.paiement !== 'client') {
      montantDisplay = formatAr(parseFloat(l.montant || 0));
      montantColor = '#10b981';
      statutBg = '#d1fae5';
      statutColor = '#10b981';
    } else if (l.paiement === 'client') {
      montantDisplay = 'Payé par le client';
      montantColor = '#3b82f6';
      statutBg = '#dbeafe';
      statutColor = '#3b82f6';
    } else if (l.statut === 'retourne') {
      montantDisplay = 'Retourné';
      montantColor = '#ef4444';
      statutBg = '#fee2e2';
      statutColor = '#ef4444';
    } else if (l.statut === 'reporte') {
      montantDisplay = 'Reporté';
      montantColor = '#8b5cf6';
      statutBg = '#ede9fe';
      statutColor = '#8b5cf6';
    } else if (l.statut === 'province') {
      montantDisplay = 'Envoi province';
      montantColor = '#06b6d4';
      statutBg = '#cffafe';
      statutColor = '#06b6d4';
    }
    
    livraisonsHtml += `
      <div style="background: #fff; border-bottom: 1px solid #e2e8f0; margin-bottom: 12px; padding-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <div style="font-weight: 700; font-size: 14px; color: #0f172a;">📦 ${l.colis}</div>
          <div style="background: ${statutBg}; color: ${statutColor}; padding: 2px 10px; border-radius: 20px; font-size: 10px; font-weight: 600;">${STATUTS[l.statut]?.label || l.statut}</div>
        </div>
        <div style="background: #f8fafc; padding: 8px; border-radius: 8px; margin-bottom: 6px;">
          <div style="font-size: 11px; color: #1e293b;">
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              <span style="font-weight: 600;">🚚 Destinataire:</span>
              <span>${l.destinataire || '-'}</span>
              ${l.destinataire_telephone ? `<span style="margin-left: 10px;">📞 ${l.destinataire_telephone}</span>` : ''}
            </div>
            ${l.destinataire_lieu ? `<div style="margin-top: 4px;"><span style="font-weight: 600;">📍 Lieu:</span> ${l.destinataire_lieu}</div>` : ''}
          </div>
        </div>
        <div style="display: flex; justify-content: flex-end; margin-top: 4px;">
          <div style="text-align: right;">
            <div style="font-size: 11px; color: #475569;">Montant</div>
            <div style="font-size: 15px; font-weight: 700; color: ${montantColor};">${montantDisplay}</div>
          </div>
        </div>
      </div>
    `;
  }
  
  w.document.write(`<!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Facture - ${client}</title>
    <style>
      @media print {
        @page {
          size: A4;
          margin: 12mm;
        }
        body {
          margin: 0;
        }
        .no-print {
          display: none;
        }
      }
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
        color: #1e293b;
        max-width: 210mm;
        margin: 0 auto;
        padding: 15px;
        background: #fff;
      }
      
      /* En-tête */
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 25px;
        padding-bottom: 15px;
        border-bottom: 2px solid #1e293b;
      }
      
      .logo-section {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .logo {
        width: 50px;
        height: 50px;
        object-fit: contain;
        border-radius: 10px;
      }
      
      .company-name {
        font-size: 18px;
        font-weight: 800;
        color: #0f172a;
      }
      
      .company-sub {
        font-size: 10px;
        color: #64748b;
        margin-top: 2px;
      }
      
      .client-section {
        text-align: right;
      }
      
      .client-title {
        font-size: 11px;
        font-weight: 600;
        color: #475569;
        letter-spacing: 1px;
      }
      
      .client-name {
        font-size: 16px;
        font-weight: 800;
        margin-top: 4px;
        color: #0f172a;
      }
      
      .client-date {
        font-size: 11px;
        color: #64748b;
        margin-top: 4px;
      }
      
      /* Sections */
      .section-title {
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        color: #334155;
        margin: 20px 0 12px 0;
        letter-spacing: 0.5px;
      }
      
      /* Livraisons */
      .livraisons-list {
        margin-bottom: 20px;
      }
      
      /* Calcul du versement */
      .calculation-box {
        margin-top: 20px;
        display: flex;
        justify-content: flex-end;
      }
      
      .calculation-table {
        width: 380px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        overflow: hidden;
      }
      
      .calculation-row {
        display: flex;
        justify-content: space-between;
        padding: 10px 15px;
        border-bottom: 1px solid #e2e8f0;
        font-size: 13px;
      }
      
      .calculation-row:last-child {
        border-bottom: none;
      }
      
      .net-row {
        background: #0f172a;
        color: #10b981;
        font-weight: 800;
        font-size: 15px;
      }
      
      /* Footer */
      .footer {
        text-align: center;
        margin-top: 30px;
        padding-top: 12px;
        border-top: 1px solid #e2e8f0;
        font-size: 10px;
        color: #94a3b8;
      }
      
      .print-btn, .close-btn {
        background: #1e293b;
        color: #fff;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        margin: 5px;
      }
      
      .close-btn {
        background: #e2e8f0;
        color: #1e293b;
      }
    </style>
  </head>
  <body>
    <!-- En-tête -->
    <div class="header">
      <div class="logo-section">
        <img src="${logoUrl}" class="logo" onerror="this.style.display='none'">
        <div>
          <div class="company-name">Aterinay Services</div>
          <div class="company-sub">Solutions de livraison professionnelle</div>
        </div>
      </div>
      <div class="client-section">
        <div class="client-title">RÉCAPITULATIF CLIENT</div>
        <div class="client-name">🏪 ${client}</div>
        <div class="client-date">📅 ${date}</div>
      </div>
    </div>
    
    <!-- Liste des livraisons -->
    <div class="section-title">📦 LISTE DES LIVRAISONS (${toutesLivraisons.length})</div>
    <div class="livraisons-list">
      ${livraisonsHtml}
    </div>
    
    <!-- Total facturé -->
    <div style="background: #f1f5f9; border-radius: 10px; padding: 12px 15px; margin: 15px 0; text-align: right;">
      <div style="display: flex; justify-content: flex-end; gap: 20px;">
        <span style="font-weight: 600;">TOTAL FACTURÉ :</span>
        <span style="font-size: 18px; font-weight: 800; color: #10b981;">${formatAr(totalMontant)}</span>
      </div>
    </div>
    
    <!-- Calcul du versement -->
    <div class="section-title">💰 CALCUL DU VERSEMENT</div>
    <div class="calculation-box">
      <div class="calculation-table">
        <div class="calculation-row">
          <span>Total livraisons facturées</span>
          <span style="font-weight: 700;">${formatAr(totalMontant)}</span>
        </div>
        ${recuperation ? `
        <div class="calculation-row">
          <span style="color: #ef4444;">- Récupération matin</span>
          <span style="color: #ef4444;">- ${formatAr(recuperation)}</span>
        </div>
        ` : ''}
        ${province ? `
        <div class="calculation-row">
          <span style="color: #ef4444;">- Envoi province</span>
          <span style="color: #ef4444;">- ${formatAr(province)}</span>
        </div>
        ` : ''}
        <div class="calculation-row net-row">
          <span>💳 MONTANT À VERSER</span>
          <span style="font-size: 18px;">${formatAr(net)}</span>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      Aterinay Services — ${date}<br>
      Merci pour votre confiance
    </div>
    
    <!-- Boutons -->
    <div class="no-print" style="text-align: center; margin-top: 25px;">
      <button class="print-btn" onclick="window.print()">🖨️ Imprimer</button>
      <button class="close-btn" onclick="window.close()">✕ Fermer</button>
    </div>
  </body>
  </html>`);
  
  w.document.close();
  setTimeout(() => w.print(), 800);
};

export const printAgentList = (agent, livraisons, date, logoUrlParam) => {
  const w = window.open('', '_blank');
  if (!w) return;
  
  const logoUrl = logoUrlParam || '/logo.png';
  
  // Regrouper les livraisons par client donneur
  const livraisonsParClientDonneur = {};
  let grandTotalMontant = 0;
  let grandTotalFrais = 0;
  
  for (let i = 0; i < livraisons.length; i++) {
    const l = livraisons[i];
    const clientDonneur = l.client_donneur;
    const montant = l.paiement === 'client' ? 0 : parseFloat(l.montant || 0);
    const frais = parseFloat(l.frais || 0);
    
    grandTotalMontant += montant;
    grandTotalFrais += frais;
    
    if (!livraisonsParClientDonneur[clientDonneur]) {
      livraisonsParClientDonneur[clientDonneur] = {
        clientDonneur: clientDonneur,
        livraisons: [],
        totalMontant: 0,
        totalFrais: 0,
        totalGeneral: 0
      };
    }
    
    livraisonsParClientDonneur[clientDonneur].livraisons.push(l);
    livraisonsParClientDonneur[clientDonneur].totalMontant += montant;
    livraisonsParClientDonneur[clientDonneur].totalFrais += frais;
    livraisonsParClientDonneur[clientDonneur].totalGeneral += (montant + frais);
  }
  
  const grandTotalGeneral = grandTotalMontant + grandTotalFrais;
  
  let clientsHtml = '';
  let clientIndex = 1;
  
  for (const clientDonneur in livraisonsParClientDonneur) {
    const data = livraisonsParClientDonneur[clientDonneur];
    
    clientsHtml += `
      <div class="client-card">
        <div class="client-header">
          <div class="client-number">Client ${clientIndex}</div>
          <div class="client-name">🏪 CLIENT DONNEUR: ${data.clientDonneur}</div>
        </div>
        <div class="client-livraisons">
    `;
    
    for (let i = 0; i < data.livraisons.length; i++) {
      const l = data.livraisons[i];
      const montant = l.paiement === 'client' ? 0 : parseFloat(l.montant || 0);
      const frais = parseFloat(l.frais || 0);
      
      clientsHtml += `
        <div class="livraison-item">
          <div class="livraison-title">📦 ${i+1}. ${l.colis}</div>
          <div class="destinataire-info">
            <div>🚚 DESTINATAIRE: <strong>${l.destinataire || '-'}</strong></div>
            ${l.destinataire_telephone ? `<div>📞 Tél: ${l.destinataire_telephone}</div>` : ''}
            ${l.destinataire_lieu ? `<div>📍 Lieu: ${l.destinataire_lieu}</div>` : ''}
          </div>
          <div class="livraison-details">
            <div class="detail-row">
              <span>💰 Montant :</span>
              <strong>${l.paiement === 'client' ? 'Payé client' : formatAr(montant)}</strong>
            </div>
            <div class="detail-row">
              <span>🚚 Frais :</span>
              <strong>${formatAr(frais)}</strong>
            </div>
            <div class="detail-row">
              <span>💵 Total (Montant + Frais) :</span>
              <strong style="color:#10b981">${formatAr(montant + frais)}</strong>
            </div>
            <div class="detail-row">
              <span>📊 Statut :</span>
              <span class="statut-badge">${STATUTS[l.statut]?.label || l.statut}</span>
            </div>
          </div>
        </div>
      `;
    }
    
    clientsHtml += `
        </div>
        <div class="client-total">
          <div class="total-row">
            <span>💰 TOTAL MONTANT :</span>
            <span class="montant">${formatAr(data.totalMontant)}</span>
          </div>
          <div class="total-row">
            <span>🚚 TOTAL FRAIS :</span>
            <span class="frais">${formatAr(data.totalFrais)}</span>
          </div>
          <div class="total-row grand-total">
            <span>💵 TOTAL GÉNÉRAL (Montant + Frais) :</span>
            <span class="client-total-amount">${formatAr(data.totalGeneral)}</span>
          </div>
        </div>
      </div>
    `;
    
    clientIndex++;
  }
  
  w.document.write(`<!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Rapport livreur - ${agent.nom}</title>
    <style>
      @media print {
        @page {
          size: 80mm auto;
          margin: 3mm;
        }
        body {
          margin: 0;
        }
        .no-print {
          display: none;
        }
      }
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: monospace;
        font-size: 11px;
        width: 72mm;
        margin: 0 auto;
        padding: 4px;
        background: #fff;
      }
      
      .header {
        text-align: center;
        margin-bottom: 8px;
        padding-bottom: 6px;
        border-bottom: 2px solid #000;
      }
      
      .logo {
        width: 35px;
        height: 35px;
        object-fit: contain;
        margin-bottom: 4px;
      }
      
      .title {
        font-weight: 700;
        font-size: 14px;
        margin-top: 4px;
      }
      
      .subtitle {
        font-size: 10px;
        color: #666;
        margin-top: 2px;
      }
      
      .client-card {
        border: 1px solid #ccc;
        border-radius: 8px;
        margin-bottom: 12px;
        overflow: hidden;
        page-break-inside: avoid;
      }
      
      .client-header {
        background: #1e293b;
        color: #fff;
        padding: 8px;
        text-align: center;
      }
      
      .client-number {
        font-size: 9px;
        opacity: 0.7;
        letter-spacing: 1px;
      }
      
      .client-name {
        font-weight: 700;
        font-size: 11px;
        margin-top: 2px;
        word-break: break-word;
      }
      
      .client-livraisons {
        padding: 8px;
      }
      
      .livraison-item {
        margin-bottom: 10px;
        padding-bottom: 6px;
        border-bottom: 1px solid #eee;
      }
      
      .livraison-title {
        font-weight: 700;
        font-size: 11px;
        margin-bottom: 4px;
      }
      
      .destinataire-info {
        background: #f0f9ff;
        padding: 6px;
        border-radius: 6px;
        margin: 6px 0;
        font-size: 10px;
      }
      
      .destinataire-info div {
        margin: 2px 0;
      }
      
      .livraison-details {
        margin-top: 4px;
      }
      
      .detail-row {
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        margin: 2px 0;
      }
      
      .statut-badge {
        background: #e2e8f0;
        padding: 2px 6px;
        border-radius: 12px;
        font-size: 9px;
      }
      
      .client-total {
        background: #f8fafc;
        padding: 8px;
        border-top: 1px solid #e2e8f0;
      }
      
      .total-row {
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        margin: 3px 0;
      }
      
      .montant {
        color: #10b981;
        font-weight: 600;
      }
      
      .frais {
        color: #f59e0b;
        font-weight: 600;
      }
      
      .grand-total {
        margin-top: 6px;
        padding-top: 6px;
        border-top: 1px solid #cbd5e1;
        font-weight: 700;
        font-size: 11px;
      }
      
      .client-total-amount {
        color: #10b981;
        font-weight: 800;
        font-size: 12px;
      }
      
      .grand-total-final {
        background: #0f172a;
        color: #fff;
        padding: 10px;
        margin-top: 8px;
        border-radius: 8px;
        text-align: center;
      }
      
      .grand-total-final .row {
        display: flex;
        justify-content: space-between;
        margin: 4px 0;
        font-size: 11px;
      }
      
      .grand-total-final .total-general {
        border-top: 1px solid #334155;
        margin-top: 6px;
        padding-top: 6px;
        font-size: 13px;
        font-weight: 700;
      }
      
      .total-general-amount {
        color: #34d399;
        font-size: 14px;
      }
      
      .footer {
        text-align: center;
        margin-top: 10px;
        padding-top: 6px;
        border-top: 1px solid #ccc;
        font-size: 9px;
        color: #666;
      }
      
      .no-print {
        text-align: center;
        margin-top: 10px;
      }
      
      .print-btn {
        background: #000;
        color: #fff;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 11px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <img src="${logoUrl}" class="logo" onerror="this.style.display='none'">
      <div class="title">ATERINAY SERVICES</div>
      <div class="subtitle">Livraisons du ${date}</div>
      <div class="subtitle">👨‍💼 Livreur: ${agent.nom}</div>
    </div>
    
    ${clientsHtml}
    
    <div class="grand-total-final">
      <div class="row">
        <span>💰 TOTAL GÉNÉRAL MONTANT :</span>
        <span>${formatAr(grandTotalMontant)}</span>
      </div>
      <div class="row">
        <span>🚚 TOTAL GÉNÉRAL FRAIS :</span>
        <span>${formatAr(grandTotalFrais)}</span>
      </div>
      <div class="total-general">
        <span>💵 TOTAL GÉNÉRAL À REMETTRE :</span>
        <span class="total-general-amount">${formatAr(grandTotalGeneral)}</span>
      </div>
    </div>
    
    <div class="footer">
      Merci pour votre travail
    </div>
    
    <div class="no-print">
      <button class="print-btn" onclick="window.print()">🖨️ Imprimer</button>
    </div>
  </body>
  </html>`);
  
  w.document.close();
  setTimeout(() => w.print(), 600);
};