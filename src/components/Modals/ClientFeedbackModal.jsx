import { useState } from 'react';
import { COLORS, formatAr } from '../../utils/constants';
import { btn, inp, lbl } from '../../utils/helpers';
import { generateClientPDF } from '../../utils/pdfExport';

export const ClientFeedbackModal = ({ fbClient, setFbClient, histDate, fbRecup, setFbRecup, fbProvince, setFbProvince, logoUrl }) => {
  if (!fbClient) return null;

  const livraisonsFacturees = fbClient.livs.filter(l => l.paiement !== 'client');
  const totalMontantFacture = livraisonsFacturees.reduce((s, l) => s + parseFloat(l.montant || 0), 0);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: COLORS.card, border: '1px solid ' + COLORS.border2, borderRadius: 16, padding: 24, width: '100%', maxWidth: 480 }}>
        <div style={{ fontWeight: 800, color: '#f1f5f9', fontSize: 18, marginBottom: 4 }}>📄 Feedback — {fbClient.client}</div>
        <div style={{ color: COLORS.muted, fontSize: 12, marginBottom: 18 }}>{fbClient.livs.length} livraison(s) — {histDate}</div>
        
        <div style={{ marginBottom: 12 }}>
          <label style={lbl()}>Récupération colis matin (Ar)</label>
          <input type="number" style={inp()} placeholder="0" value={fbRecup} onChange={e => setFbRecup(parseFloat(e.target.value) || 0)} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={lbl()}>Frais envoi province (Ar)</label>
          <input type="number" style={inp()} placeholder="0" value={fbProvince} onChange={e => setFbProvince(parseFloat(e.target.value) || 0)} />
        </div>
        
        <div style={{ background: COLORS.bg, borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
            <span>Total livraisons facturées</span>
            <span style={{ color: COLORS.green, fontWeight: 700 }}>{formatAr(totalMontantFacture)}</span>
          </div>
          {fbRecup > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span>- Récupération</span>
              <span style={{ color: COLORS.red, fontWeight: 700 }}>- {formatAr(fbRecup)}</span>
            </div>
          )}
          {fbProvince > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span>- Province</span>
              <span style={{ color: COLORS.red, fontWeight: 700 }}>- {formatAr(fbProvince)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, borderTop: '1px solid ' + COLORS.border, paddingTop: 8, marginTop: 4 }}>
            <span>À VERSER</span>
            <span style={{ color: COLORS.green }}>{formatAr(totalMontantFacture - fbRecup - fbProvince)}</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            style={{ ...btn(COLORS.blue, '#2563eb'), flex: 1, padding: 12 }} 
            onClick={() => { 
              generateClientPDF(fbClient.client, fbClient.livs, fbRecup, fbProvince, logoUrl); 
              setFbClient(null); 
            }}
          >
            🖨️ Générer PDF A4
          </button>
          <button style={{ ...btn('#475569', '#334155'), padding: 12 }} onClick={() => setFbClient(null)}>✕</button>
        </div>
      </div>
    </div>
  );
};