import { useState, useMemo, useEffect } from 'react';
import { COLORS, formatAr, currentMonth, monthLabel, shouldCountGerantCommission } from '../../shared/utils/constants';
import { btn, inpSm, lbl, tag, inp } from '../../shared/utils/helpers'; 
import { getRecuperationsByMonth } from '../services/recuperationService';  

export const Recap = ({ livraisons, avances, agents, commissionGerant, onAddAvance, onDeleteAvance, showToast }) => {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [avanceAgentId, setAvanceAgentId] = useState('');
  const [avanceMontant, setAvanceMontant] = useState('');
  const [avanceMotif, setAvanceMotif] = useState('');
  const [recuperationsMois, setRecuperationsMois] = useState([]);
  const [loadingRecup, setLoadingRecup] = useState(false);

  const months = useMemo(() => {
    const s = new Set(livraisons.map(l => l.date?.slice(0, 7)).filter(Boolean));
    s.add(currentMonth());
    return [...s].sort().reverse();
  }, [livraisons]);

  const monthLivs = useMemo(() => livraisons.filter(l => l.date && l.date.startsWith(selectedMonth)), [livraisons, selectedMonth]);
  const monthAvances = useMemo(() => avances.filter(a => a.mois === selectedMonth && !a.annule), [avances, selectedMonth]);

  // Charger les récupérations du mois sélectionné
  useEffect(() => {
    const loadRecuperations = async () => {
      setLoadingRecup(true);
      try {
        const data = await getRecuperationsByMonth(selectedMonth);
        setRecuperationsMois(data || []);
      } catch (error) {
        console.error('Erreur chargement récupérations:', error);
      } finally {
        setLoadingRecup(false);
      }
    };
    loadRecuperations();
  }, [selectedMonth]);

  const livsGerant = (arr) => arr.filter(l => shouldCountGerantCommission(l));

  const monthStatsByAgent = useMemo(() => agents.map(ag => {
    const ls = monthLivs.filter(l => l.agent_id === ag.id);
    const av = monthAvances.filter(a => a.agent_id === ag.id);
    const recups = recuperationsMois.filter(r => r.livreur_id === ag.id);
    const totalRecuperations = recups.reduce((s, r) => s + (r.frais_recuperation || 0), 0);
    return {
      ...ag,
      nbLivs: ls.length,
      nbLivres: ls.filter(l => l.statut === 'livre').length,
      nbRetours: ls.filter(l => l.statut === 'retourne').length,
      nbReportes: ls.filter(l => l.statut === 'reporte').length,
      totalFrais: ls.reduce((s, l) => s + parseFloat(l.frais || 0), 0),
      totalAvances: av.reduce((s, a) => s + parseFloat(a.montant || 0), 0),
      netSalaire: parseFloat(ag.salaire || 0) - av.reduce((s, a) => s + parseFloat(a.montant || 0), 0),
      avances: av,
      recuperations: recups,
      totalRecuperations: totalRecuperations,
      nbRecuperations: recups.length
    };
  }), [agents, monthLivs, monthAvances, recuperationsMois]);

  const monthTotalMontant = monthLivs
    .filter(l => l.paiement !== 'client')
    .reduce((s, l) => s + parseFloat(l.montant || 0), 0);
  
  const monthTotalFrais = monthLivs.reduce((s, l) => s + parseFloat(l.frais || 0), 0);
  const monthTotalSalaires = monthStatsByAgent.reduce((s, a) => s + parseFloat(a.salaire || 0), 0);
  const monthGerantGain = livsGerant(monthLivs).length * commissionGerant;
  const monthTotalRecuperations = monthStatsByAgent.reduce((s, a) => s + a.totalRecuperations, 0);
  const monthBenefice = monthTotalFrais - monthTotalSalaires - monthGerantGain - monthTotalRecuperations;

  const handleAddAvance = async () => {
    if (!avanceAgentId || !avanceMontant) {
      showToast('Agent et montant requis', 'error');
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
    showToast('Avance ajoutée');
  };

  const [confirmAvance, setConfirmAvance] = useState(null);
  const handleDeleteAvance = (id) => { setConfirmAvance(id); };
  const executeDeleteAvance = async () => {
    if (!confirmAvance) return;
    const id = confirmAvance;
    setConfirmAvance(null);
    await onDeleteAvance(id);
    showToast('Avance supprimée', 'warn');
  };

  return (
    <div>
      {/* Modal suppression avance */}
      {confirmAvance && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(6px)', zIndex:300, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div style={{ background:'var(--card)', width:'100%', maxWidth:380, borderRadius:'20px 20px 0 0', padding:'20px 20px 32px', boxShadow:'0 -8px 32px rgba(0,0,0,0.4)' }}>
            <div style={{ width:36, height:4, background:'var(--border2)', borderRadius:4, margin:'0 auto 16px' }} />
            <div style={{ fontSize:26, textAlign:'center', marginBottom:8 }}>⚠️</div>
            <div style={{ fontSize:16, fontWeight:700, textAlign:'center', marginBottom:8, color:'var(--text)' }}>Supprimer l'avance ?</div>
            <div style={{ fontSize:13, color:'var(--text2)', textAlign:'center', marginBottom:20 }}>Cette action est irréversible.</div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setConfirmAvance(null)} style={{ flex:1, padding:12, background:'var(--card2)', border:'1px solid var(--border2)', borderRadius:11, color:'var(--text2)', fontWeight:600, cursor:'pointer', fontFamily:'var(--font)' }}>Annuler</button>
              <button onClick={executeDeleteAvance} style={{ flex:1, padding:12, background:'var(--red)', border:'none', borderRadius:11, color:'#fff', fontWeight:700, cursor:'pointer', fontFamily:'var(--font)' }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Récapitulatif</h1>
        <select style={{ ...inpSm(), width: 'auto' }} value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
          {months.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
      </div>

      <div style={{ background: 'linear-gradient(135deg,' + (monthBenefice >= 0 ? 'var(--green-dim)' : 'var(--red-dim)') + ',var(--bg)' + ')', border: '1px solid ' + (monthBenefice >= 0 ? 'var(--green)' : 'var(--red)'), borderRadius: 14, padding: '20px 22px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>BÉNÉFICE NET — {monthLabel(selectedMonth)}</div>
          <div style={{ fontSize: 30, fontWeight: 900, color: monthBenefice >= 0 ? 'var(--green)' : 'var(--red)' }}>{formatAr(monthBenefice)}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Frais − Salaires − Commission − Récupérations</div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'right' }}>
          <div>Montant colis: <b style={{ color: 'var(--green)' }}>{formatAr(monthTotalMontant)}</b></div>
          <div>Frais collectés: <b style={{ color: 'var(--orange)' }}>{formatAr(monthTotalFrais)}</b></div>
          <div>Salaires agents: <b style={{ color: 'var(--red)' }}>{formatAr(monthTotalSalaires)}</b></div>
          <div>Commission gérant: <b style={{ color: 'var(--pink)' }}>{formatAr(monthGerantGain)}</b></div>
          <div>Récupérations: <b style={{ color: 'var(--yellow)' }}>{formatAr(monthTotalRecuperations)}</b></div>
          <div>{monthLivs.length} livraisons</div>
        </div>
      </div>

      <div style={{ background: 'linear-gradient(135deg, var(--card2), var(--bg))', border: '1px solid var(--purple)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--purple)', fontWeight: 700, marginBottom: 4 }}>🧑‍💼 COMMISSION GÉRANT — {monthLabel(selectedMonth)}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)' }}>{formatAr(monthGerantGain)}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{livsGerant(monthLivs).length} livraisons × {formatAr(commissionGerant)}</div>
        </div>
      </div>

      <h2 style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 10 }}>Agents — {monthLabel(selectedMonth)}</h2>
      {monthStatsByAgent.map(a => (
        <div key={a.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            <div style={{ fontWeight: 800, color: 'var(--text)', fontSize: 16 }}>{a.nom}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={tag('var(--green-dim)', 'var(--green)')}>Sal: {formatAr(a.salaire)}</span>
              {a.totalAvances > 0 && <span style={tag('var(--orange-dim)', 'var(--orange)')}>Av: {formatAr(a.totalAvances)}</span>}
              <span style={{ ...tag(a.netSalaire >= 0 ? 'var(--green-dim)' : 'var(--orange-dim)', a.netSalaire >= 0 ? 'var(--green)' : 'var(--red)'), fontSize: 13 }}>Net: {formatAr(a.netSalaire)}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
            <span>📦 Total: <b style={{ color: 'var(--text)' }}>{a.nbLivs}</b></span>
            <span>✅ Livrés: <b style={{ color: 'var(--green)' }}>{a.nbLivres}</b></span>
            <span>↩️ Retournés: <b style={{ color: 'var(--red)' }}>{a.nbRetours}</b></span>
            <span>⏳ Reportés: <b style={{ color: 'var(--purple)' }}>{a.nbReportes}</b></span>
            <span>💸 Frais: <b style={{ color: 'var(--orange)' }}>{formatAr(a.totalFrais)}</b></span>
          </div>

          {/* Liste des avances avec bouton Supprimer */}
          {a.avances.length > 0 && (
            <div style={{ marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--pink)', marginBottom: 6, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📋 AVANCES SUR SALAIRE</span>
                <span style={{ fontSize: 9, color: 'var(--orange)' }}>(déduites du salaire)</span>
              </div>
              {a.avances.map(av => (
                <div key={av.id} style={{ background: 'var(--bg)', borderRadius: 7, padding: '8px 10px', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--orange)', fontWeight: 700, fontSize: 13 }}>{formatAr(parseFloat(av.montant || 0))}</span>
                      {av.motif && (
                        <span style={{ fontSize: 11, color: 'var(--subtle)', background: 'var(--border)', padding: '2px 10px', borderRadius: 15 }}>
                          📝 {av.motif}
                        </span>
                      )}
                      <span style={{ fontSize: 10, color: 'var(--muted)' }}>📅 {av.date}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteAvance(av.id)} 
                    style={{ background: 'var(--red-dim)', border: 'none', borderRadius: 6, padding: '4px 10px', color: 'var(--red)', fontSize: 11, cursor: 'pointer' }}
                    title="Supprimer cette avance"
                  >
                    🗑 Supprimer
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Récupérations du mois */}
          {a.nbRecuperations > 0 && (
            <div style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--yellow)', marginBottom: 6, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📦 RÉCUPÉRATIONS MATINALES</span>
                <span style={{ fontSize: 9, color: 'var(--orange)' }}>({a.nbRecuperations} récupérations)</span>
                <span style={{ fontSize: 11, color: 'var(--green)', marginLeft: 'auto' }}>💰 {formatAr(a.totalRecuperations)}</span>
              </div>
              {a.recuperations.map(rec => (
                <div key={rec.id} style={{ background: 'var(--bg)', borderRadius: 7, padding: '6px 10px', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--yellow)' }}>🏪 {rec.client_donneur}</span>
                    <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 10 }}>📅 {rec.date}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--green)', fontWeight: 600 }}>{formatAr(rec.frais_recuperation)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <h2 style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 10, marginTop: 20 }}>Ajouter une avance</h2>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <label style={lbl()}>Agent</label>
            <select style={inp()} value={avanceAgentId} onChange={e => setAvanceAgentId(e.target.value)}>
              <option value="">-- Agent --</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl()}>Montant (Ar)</label>
            <input type="number" style={inp()} placeholder="50000" value={avanceMontant} onChange={e => setAvanceMontant(e.target.value)} />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={lbl()}>Motif de l'avance</label>
          <input style={inp()} placeholder="Ex: Urgence familiale, Achat matériel, Soins médicaux..." value={avanceMotif} onChange={e => setAvanceMotif(e.target.value)} />
        </div>
        <button style={{ ...btn('var(--orange)', '#d97706'), width: '100%', padding: 12 }} onClick={handleAddAvance}>+ Enregistrer l'avance</button>
      </div>

      {/* Avances annulées */}
      {avances.filter(a => a.mois === selectedMonth && a.annule).length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>Avances annulées</h2>
          {avances.filter(a => a.mois === selectedMonth && a.annule).map(av => (
            <div key={av.id} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, opacity: 0.6 }}>
              <div>
                <span style={{ color: 'var(--muted)', textDecoration: 'line-through' }}>{av.agent_nom} — {formatAr(parseFloat(av.montant || 0))}</span>
                {av.motif && <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 8 }}>({av.motif})</span>}
              </div>
              <button onClick={() => handleDeleteAvance(av.id)} style={{ background: 'var(--red-dim)', border: 'none', borderRadius: 6, padding: '4px 8px', color: 'var(--red)', fontSize: 11, cursor: 'pointer' }}>🗑 Définitivement</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};