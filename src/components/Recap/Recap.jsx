import { useState, useMemo } from 'react';
import { COLORS, formatAr, currentMonth, monthLabel, shouldCountGerantCommission } from '../../utils/constants';
import { btn, inpSm, lbl, tag, inp } from '../../utils/helpers';

export const Recap = ({ livraisons, avances, agents, commissionGerant, onAddAvance, onAnnulerAvance, onDeleteAvance, showToast }) => {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [avanceAgentId, setAvanceAgentId] = useState('');
  const [avanceMontant, setAvanceMontant] = useState('');
  const [avanceMotif, setAvanceMotif] = useState('');

  const months = useMemo(() => {
    const s = new Set(livraisons.map(l => l.date?.slice(0, 7)).filter(Boolean));
    s.add(currentMonth());
    return [...s].sort().reverse();
  }, [livraisons]);

  const monthLivs = useMemo(() => livraisons.filter(l => l.date && l.date.startsWith(selectedMonth)), [livraisons, selectedMonth]);
  const monthAvances = useMemo(() => avances.filter(a => a.mois === selectedMonth && !a.annule), [avances, selectedMonth]);

  const livsGerant = (arr) => arr.filter(l => shouldCountGerantCommission(l));

  const monthStatsByAgent = useMemo(() => agents.map(ag => {
    const ls = monthLivs.filter(l => l.agent_id === ag.id);
    const av = monthAvances.filter(a => a.agent_id === ag.id);
    const totalAvances = av.reduce((s, a) => s + parseFloat(a.montant || 0), 0);
    return {
      ...ag,
      nbLivs: ls.length,
      nbLivres: ls.filter(l => l.statut === 'livre').length,
      nbRetours: ls.filter(l => l.statut === 'retourne').length,
      nbReportes: ls.filter(l => l.statut === 'reporte').length,
      nbProvince: ls.filter(l => l.statut === 'province').length,
      totalFrais: ls.reduce((s, l) => s + parseFloat(l.frais || 0), 0),
      totalAvances: totalAvances,
      netSalaire: parseFloat(ag.salaire || 0) - totalAvances,
      avances: av
    };
  }), [agents, monthLivs, monthAvances]);

  const monthTotalMontant = monthLivs
    .filter(l => l.paiement !== 'client')
    .reduce((s, l) => s + parseFloat(l.montant || 0), 0);
  
  const monthTotalFrais = monthLivs.reduce((s, l) => s + parseFloat(l.frais || 0), 0);
  const monthTotalSalaires = monthStatsByAgent.reduce((s, a) => s + parseFloat(a.salaire || 0), 0);
  const monthTotalAvances = monthStatsByAgent.reduce((s, a) => s + a.totalAvances, 0);
  const monthTotalNet = monthTotalSalaires - monthTotalAvances;
  const monthGerantGain = livsGerant(monthLivs).length * commissionGerant;
  const monthBenefice = monthTotalFrais - monthTotalSalaires - monthGerantGain;

  const handleAddAvance = async () => {
    if (!avanceAgentId || !avanceMontant) {
      if (showToast) showToast('Agent et montant requis', 'error');
      return;
    }
    const agent = agents.find(a => a.id === parseInt(avanceAgentId));
    if (onAddAvance) {
      await onAddAvance({
        agent_id: parseInt(avanceAgentId),
        agent_nom: agent?.nom,
        montant: parseFloat(avanceMontant),
        motif: avanceMotif,
        date: new Date().toISOString().split('T')[0],
        mois: currentMonth(),
        annule: false
      });
    }
    setAvanceAgentId('');
    setAvanceMontant('');
    setAvanceMotif('');
    if (showToast) showToast('Avance ajoutée');
  };

  const handleAnnulerAvance = async (id) => {
    if (onAnnulerAvance) {
      await onAnnulerAvance(id);
      if (showToast) showToast('Avance annulée', 'warn');
    }
  };

  const handleDeleteAvance = async (id) => {
    if (onDeleteAvance) {
      await onDeleteAvance(id);
      if (showToast) showToast('Avance supprimée', 'warn');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Récapitulatif</h1>
        <select style={{ ...inpSm(), width: 'auto' }} value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
          {months.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
      </div>

      <div style={{ background: 'linear-gradient(135deg,' + (monthBenefice >= 0 ? '#14532d' : '#450a0a') + ',' + COLORS.bg + ')', border: '1px solid ' + (monthBenefice >= 0 ? '#34d399' : '#f87171'), borderRadius: 14, padding: '20px 22px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>BÉNÉFICE NET — {monthLabel(selectedMonth)}</div>
          <div style={{ fontSize: 30, fontWeight: 900, color: monthBenefice >= 0 ? COLORS.green : COLORS.red }}>{formatAr(monthBenefice)}</div>
          <div style={{ fontSize: 11, color: COLORS.muted }}>Frais − Salaires − Commission gérant</div>
        </div>
        <div style={{ fontSize: 12, color: COLORS.muted, textAlign: 'right' }}>
          <div>Montant colis: <b style={{ color: COLORS.green }}>{formatAr(monthTotalMontant)}</b></div>
          <div>Frais collectés: <b style={{ color: COLORS.orange }}>{formatAr(monthTotalFrais)}</b></div>
          <div>Salaires bruts: <b style={{ color: COLORS.red }}>{formatAr(monthTotalSalaires)}</b></div>
          <div>Avances déduites: <b style={{ color: COLORS.orange }}>- {formatAr(monthTotalAvances)}</b></div>
          <div>Salaires nets: <b style={{ color: COLORS.green }}>{formatAr(monthTotalNet)}</b></div>
          <div>Commission gérant: <b style={{ color: COLORS.pink }}>{formatAr(monthGerantGain)}</b></div>
          <div>{monthLivs.length} livraisons</div>
        </div>
      </div>

      <div style={{ background: 'linear-gradient(135deg,#1e1060,#0b1120)', border: '1px solid ' + COLORS.purple, borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: COLORS.purple, fontWeight: 700, marginBottom: 4 }}>🧑‍💼 COMMISSION GÉRANT — {monthLabel(selectedMonth)}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#f1f5f9' }}>{formatAr(monthGerantGain)}</div>
          <div style={{ fontSize: 11, color: COLORS.muted }}>{livsGerant(monthLivs).length} livraisons × {formatAr(commissionGerant)}</div>
        </div>
      </div>

      <h2 style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, textTransform: 'uppercase', marginBottom: 10 }}>Agents — {monthLabel(selectedMonth)}</h2>
      {monthStatsByAgent.map(a => (
        <div key={a.id} style={{ background: COLORS.card, border: '1px solid ' + COLORS.border, borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
          {/* En-tête avec nom et salaires */}
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            <div style={{ fontWeight: 800, color: '#f1f5f9', fontSize: 16 }}>{a.nom}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={tag('#14532d', COLORS.green)}>💰 Salaire: {formatAr(a.salaire)}</span>
              {a.totalAvances > 0 ? (
                <span style={tag('#431407', COLORS.orange)}>📉 Avances: - {formatAr(a.totalAvances)}</span>
              ) : (
                <span style={tag('#1e3a5f', '#60a5fa')}>✅ Aucune avance</span>
              )}
              <span style={{ ...tag(a.netSalaire >= 0 ? '#14532d' : '#431407', a.netSalaire >= 0 ? COLORS.green : COLORS.red), fontSize: 13 }}>
                💵 Net: {formatAr(a.netSalaire)}
              </span>
            </div>
          </div>
          
          {/* Statistiques des livraisons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12, color: COLORS.muted, marginBottom: 10 }}>
            <span>📦 Total: <b style={{ color: COLORS.text }}>{a.nbLivs}</b></span>
            <span>✅ Livrés: <b style={{ color: COLORS.green }}>{a.nbLivres}</b></span>
            <span>↩️ Retournés: <b style={{ color: COLORS.red }}>{a.nbRetours}</b></span>
            <span>⏳ Reportés: <b style={{ color: COLORS.purple }}>{a.nbReportes}</b></span>
            <span>🚛 Province: <b style={{ color: COLORS.teal }}>{a.nbProvince}</b></span>
            <span>💸 Frais: <b style={{ color: COLORS.orange }}>{formatAr(a.totalFrais)}</b></span>
          </div>
          
          {/* Liste des avances avec motif */}
          {a.avances.length > 0 && (
            <div style={{ marginTop: 8, borderTop: '1px solid ' + COLORS.border, paddingTop: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.pink, marginBottom: 6, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📋 AVANCES SUR SALAIRE</span>
                <span style={{ fontSize: 9, color: COLORS.orange }}>(déduites du salaire)</span>
              </div>
              {a.avances.map(av => (
                <div key={av.id} style={{ background: COLORS.bg, borderRadius: 7, padding: '8px 10px', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ color: COLORS.orange, fontWeight: 700, fontSize: 13 }}>{formatAr(parseFloat(av.montant || 0))}</span>
                      {av.motif && (
                        <span style={{ fontSize: 11, color: COLORS.subtle, background: COLORS.border, padding: '2px 10px', borderRadius: 15 }}>
                          📝 {av.motif}
                        </span>
                      )}
                      <span style={{ fontSize: 10, color: COLORS.muted }}>📅 {av.date}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button 
                      onClick={() => handleAnnulerAvance(av.id)} 
                      style={{ background: '#450a0a', border: 'none', borderRadius: 6, padding: '4px 10px', color: COLORS.red, fontSize: 11, cursor: 'pointer' }}
                      title="Annuler cette avance (ne sera pas déduite)"
                    >
                      ❌ Annuler
                    </button>
                    <button 
                      onClick={() => handleDeleteAvance(av.id)} 
                      style={{ background: '#1e3a5f', border: 'none', borderRadius: 6, padding: '4px 10px', color: '#60a5fa', fontSize: 11, cursor: 'pointer' }}
                      title="Supprimer définitivement"
                    >
                      🗑 Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Formulaire ajout avance */}
      <h2 style={{ fontSize: 13, fontWeight: 700, color: COLORS.muted, marginBottom: 10, marginTop: 20 }}>➕ Ajouter une avance sur salaire</h2>
      <div style={{ background: COLORS.card, border: '1px solid ' + COLORS.border2, borderRadius: 12, padding: 18, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={lbl()}>👤 Agent</label>
            <select style={inp()} value={avanceAgentId} onChange={e => setAvanceAgentId(e.target.value)}>
              <option value="">-- Sélectionner --</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl()}>💰 Montant (Ar)</label>
            <input type="number" style={inp()} placeholder="50000" value={avanceMontant} onChange={e => setAvanceMontant(e.target.value)} />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={lbl()}>📝 Motif de l'avance</label>
          <input style={inp()} placeholder="Ex: Urgence familiale, Achat matériel, Soins médicaux..." value={avanceMotif} onChange={e => setAvanceMotif(e.target.value)} />
        </div>
        <button style={{ ...btn(COLORS.orange, '#d97706'), width: '100%', padding: 12, fontSize: 14 }} onClick={handleAddAvance}>
          + Enregistrer l'avance
        </button>
        <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 10, textAlign: 'center' }}>
          ⚠️ Cette avance sera déduite automatiquement du salaire de l'agent
        </div>
      </div>

      {/* Avances annulées */}
      {avances.filter(a => a.mois === selectedMonth && a.annule).length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, textTransform: 'uppercase', marginBottom: 8 }}>📋 Avances annulées (non déduites)</h2>
          {avances.filter(a => a.mois === selectedMonth && a.annule).map(av => (
            <div key={av.id} style={{ background: COLORS.bg, border: '1px solid ' + COLORS.border, borderRadius: 8, padding: '8px 14px', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, opacity: 0.6 }}>
              <div>
                <span style={{ color: COLORS.muted, textDecoration: 'line-through' }}>{av.agent_nom} — {formatAr(parseFloat(av.montant || 0))}</span>
                {av.motif && <span style={{ fontSize: 11, color: COLORS.muted, marginLeft: 8 }}>({av.motif})</span>}
                <span style={{ fontSize: 10, color: COLORS.muted, marginLeft: 8 }}>⚠️ Non déduite du salaire</span>
              </div>
              <button onClick={() => handleDeleteAvance(av.id)} style={{ background: '#450a0a', border: 'none', borderRadius: 6, padding: '4px 8px', color: COLORS.red, fontSize: 11, cursor: 'pointer' }}>🗑 Supprimer</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};