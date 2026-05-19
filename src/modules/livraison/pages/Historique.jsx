import { useState, useMemo } from 'react';
import { COLORS, STATUTS, PAIE_MODES, formatAr, TODAY } from '../../shared/utils/constants';
import { btn, tag, inpSm, lbl } from '../../shared/utils/helpers'; 
import { exportToCSV } from '../../shared/utils/csvExport'; 
import { printAgentList } from '../../shared/utils/pdfExport'; 
import { ClientFeedbackModal } from '../../shared/components/Modals/ClientFeedbackModal'; 

export const Historique = ({ livraisons, agents, onUpdateLivraison, onDeleteLivraison, showToast, logoUrl }) => {
  const [histDate, setHistDate] = useState(TODAY());
  const [histAgent, setHistAgent] = useState('tous');
  const [histStatut, setHistStatut] = useState('tous');
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [fbClient, setFbClient] = useState(null);
  const [fbRecup, setFbRecup] = useState(0);
  const [fbProvince, setFbProvince] = useState(0);

  const livsFiltered = useMemo(() => livraisons.filter(l =>
    l.date === histDate &&
    (histAgent === 'tous' || l.agent_nom === histAgent) &&
    (histStatut === 'tous' || l.statut === histStatut)
  ), [livraisons, histDate, histAgent, histStatut]);

  const statsByClient = useMemo(() => {
    const map = {};
    livsFiltered.forEach(l => {
      const client = l.client_donneur;
      if (!map[client]) map[client] = { 
        client: client, 
        livs: [], 
        totalMontant: 0,
        totalFrais: 0
      };
      map[client].livs.push(l);
      if (l.paiement !== 'client') {
        map[client].totalMontant += parseFloat(l.montant || 0);
      }
      map[client].totalFrais += parseFloat(l.frais || 0);
    });
    return Object.values(map).sort((a, b) => b.totalMontant - a.totalMontant);
  }, [livsFiltered]);

  const handleExportCSV = () => {
    if (!livsFiltered.length) return;
    const keys = ['date', 'colis', 'client_donneur', 'destinataire', 'destinataire_lieu', 'agent_nom', 'montant', 'frais', 'paiement', 'statut'];
    const csv = [keys, ...livsFiltered.map(l => keys.map(k => '"' + (l[k] || '') + '"'))].map(r => r.join(',')).join('\n');
    const b = new Blob(['\uFEFF' + csv], { type: 'text/csv' });
    const u = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = u;
    a.download = 'livraisons_' + histDate + '.csv';
    a.click();
    URL.revokeObjectURL(u);
  };

  const handleUpdate = async () => {
    const montant = editData.paiement === 'client' ? 0 : parseFloat(editData.montant) || 0;
    await onUpdateLivraison(editId, { ...editData, montant, frais: parseFloat(editData.frais) || 0 });
    setEditId(null);
    showToast('Livraison mise à jour');
  };

  return (
    <div>
      <ClientFeedbackModal 
        fbClient={fbClient} 
        setFbClient={setFbClient} 
        histDate={histDate}
        fbRecup={fbRecup}
        setFbRecup={setFbRecup}
        fbProvince={fbProvince}
        setFbProvince={setFbProvince}
      />
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Historique</h1>
        <button style={btn('var(--green)', 'var(--green2)')} onClick={handleExportCSV}>📥 CSV</button>
      </div>
      
      <div style={{ background: 'var(--card)', padding: '14px 16px', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div><label style={lbl()}>Date</label><input type="date" style={inpSm()} value={histDate} onChange={e => setHistDate(e.target.value)} /></div>
        <div><label style={lbl()}>Agent</label><select style={inpSm()} value={histAgent} onChange={e => setHistAgent(e.target.value)}><option value="tous">Tous</option>{agents.map(a => <option key={a.id} value={a.nom}>{a.nom}</option>)}</select></div>
        <div><label style={lbl()}>Statut</label><select style={inpSm()} value={histStatut} onChange={e => setHistStatut(e.target.value)}><option value="tous">Tous</option>{Object.entries(STATUTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}><span style={{ ...tag('var(--blue-dim)', 'var(--blue)'), fontSize: 12, padding: '8px 14px' }}>{livsFiltered.length} résultat(s)</span></div>
      </div>

      {livsFiltered.length > 0 && (
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {agents.map(a => {
              const ls = livsFiltered.filter(l => l.agent_id === a.id);
              if (!ls.length) return null;
              return <button key={a.id} style={btn('var(--card2)', 'var(--card2)')} onClick={() => printAgentList(a, ls, histDate, logoUrl)}>🖨️ {a.nom} ({ls.length})</button>;
            })}
          </div>
          
          <h2 style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 10 }}>Frais par agent</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, marginBottom: 16 }}>
            {agents.map(a => {
              const ls = livsFiltered.filter(l => l.agent_id === a.id);
              if (!ls.length) return null;
              return (
                <div key={a.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{a.nom}</div>
                  <div style={{ fontSize: 12, color: 'var(--orange)', fontWeight: 600 }}>Frais: {formatAr(ls.reduce((s, l) => s + parseFloat(l.frais || 0), 0))}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{ls.length} livraison(s)</div>
                </div>
              );
            })}
          </div>
          
          <h2 style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 10 }}>Versement par client donneur</h2>
          {statsByClient.map(cl => (
            <div key={cl.client} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--text)', fontSize: 15 }}>🏪 {cl.client}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ color: 'var(--green)', fontWeight: 700, fontSize: 15 }}>{formatAr(cl.totalMontant)}</div>
                  <button style={{ ...btn('var(--blue)', 'var(--blue2)'), padding: '8px 12px', fontSize: 12 }} onClick={() => { setFbClient(cl); setFbRecup(0); setFbProvince(0); }}>📄 PDF</button>
                </div>
              </div>
              {cl.livs.map(l => (
                <div key={l.id} style={{ background: 'var(--bg)', borderRadius: 8, padding: '8px 12px', marginBottom: 6 }}>
                  {editId === l.id ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[['colis', 'Colis'], ['client_donneur', 'Client donneur'], ['destinataire', 'Destinataire'], ['destinataire_lieu', 'Lieu livraison']].map(([k, lb]) => (
                        <div key={k}><label style={{ ...lbl(), fontSize: 10 }}>{lb}</label><input style={inpSm()} value={editData[k] || ''} onChange={e => setEditData({ ...editData, [k]: e.target.value })} /></div>
                      ))}
                      <div><label style={{ ...lbl(), fontSize: 10 }}>Montant (Ar)</label><input type="number" style={inpSm()} value={editData.montant} onChange={e => setEditData({ ...editData, montant: e.target.value })} /></div>
                      <div><label style={{ ...lbl(), fontSize: 10 }}>Frais (Ar)</label><input type="number" style={inpSm()} value={editData.frais} onChange={e => setEditData({ ...editData, frais: e.target.value })} /></div>
                      <div><label style={{ ...lbl(), fontSize: 10 }}>Paiement</label><select style={inpSm()} value={editData.paiement} onChange={e => setEditData({ ...editData, paiement: e.target.value })}>
                        {Object.entries(PAIE_MODES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select></div>
                      <div><label style={{ ...lbl(), fontSize: 10 }}>Statut</label><select style={inpSm()} value={editData.statut} onChange={e => setEditData({ ...editData, statut: e.target.value })}>
                        {Object.entries(STATUTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select></div>
                      <div style={{ display: 'flex', gap: 8, gridColumn: '1/-1' }}>
                        <button style={{ ...btn('var(--green)', 'var(--green2)'), flex: 1, padding: 9, fontSize: 12 }} onClick={handleUpdate}>✓ Sauver</button>
                        <button style={{ ...btn('var(--card2)', 'var(--card2)'), padding: 9, fontSize: 12 }} onClick={() => setEditId(null)}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                      <div style={{ flex: 1, minWidth: 140 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>{l.colis}</div>
                        <div style={{ fontSize: 11, color: 'var(--subtle)' }}>
                          🏪 {l.client_donneur} → 🚚 {l.destinataire}
                          {l.destinataire_lieu && ` • 📍 ${l.destinataire_lieu}`}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--muted)' }}>Livreur: {l.agent_nom}</div>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                        {l.paiement === 'client' ? (
                          <span style={tag('var(--blue-dim)', 'var(--teal)')}>🤝 Payé client</span>
                        ) : (
                          <span style={tag('var(--green-dim)', 'var(--green)')}>{formatAr(parseFloat(l.montant || 0))}</span>
                        )}
                        <span style={tag(STATUTS[l.statut]?.bg || '#333', STATUTS[l.statut]?.color || '#fff')}>{STATUTS[l.statut]?.label || l.statut}</span>
                        <button style={{ background: 'var(--blue-dim)', border: 'none', borderRadius: 6, padding: '5px 8px', color: 'var(--blue)', fontSize: 12, cursor: 'pointer' }} onClick={() => { setEditId(l.id); setEditData(l); }}>✏️</button>
                        <button style={{ background: 'var(--red-dim)', border: 'none', borderRadius: 6, padding: '5px 8px', color: 'var(--red)', fontSize: 12, cursor: 'pointer' }} onClick={() => onDeleteLivraison(l.id)}>🗑</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
          
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ color: 'var(--subtle)', fontWeight: 700 }}>TOTAL DU JOUR</span>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--green)', fontWeight: 700 }}>{formatAr(livsFiltered.filter(l => l.paiement !== 'client').reduce((s, l) => s + parseFloat(l.montant || 0), 0))}</span>
              <span style={{ color: 'var(--orange)', fontWeight: 700 }}>Frais: {formatAr(livsFiltered.reduce((s, l) => s + parseFloat(l.frais || 0), 0))}</span>
            </div>
          </div>
        </div>
      )}
      {livsFiltered.length === 0 && <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0' }}>Aucune livraison pour cette date.</div>}
    </div>
  );
};