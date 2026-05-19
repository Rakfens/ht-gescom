import { useState, useMemo } from 'react';
import { COLORS, STATUTS, formatAr, TODAY, CURRENT_MONTH, monthLabel, shouldCountGerantCommission, EXCLUDED_CLIENTS } from '../../shared/utils/constants';
import { btn, inpSm, lbl, tag } from '../../shared/utils/helpers'; 

export const Gerant = ({ livraisons, commissionGerant, onUpdateCommission, showToast }) => {
  const [editCommission, setEditCommission] = useState(false);
  const [tmpCommission, setTmpCommission] = useState(commissionGerant);
  const [gerantTab, setGerantTab] = useState('jour');
  const [gerantDate, setGerantDate] = useState(TODAY());
  const [gerantMonth, setGerantMonth] = useState(CURRENT_MONTH());

  // Commission sur TOUTES les livraisons où les frais ont été payés (frais > 0)
  const livsGerant = (arr) => arr.filter(l => shouldCountGerantCommission(l));
  
  const gerantDayLivs = useMemo(() => livsGerant(livraisons.filter(l => l.date === gerantDate)), [livraisons, gerantDate]);
  const gerantDayCount = gerantDayLivs.length;
  const gerantDayGain = gerantDayCount * commissionGerant;
  const gerantDayFraisTotal = gerantDayLivs.reduce((s, l) => s + parseFloat(l.frais || 0), 0);
  const gerantDayNet = gerantDayFraisTotal - gerantDayGain;

  // Calcul des livraisons exclues pour affichage
  const gerantDayExcluded = useMemo(() => {
    return livraisons.filter(l => 
      l.date === gerantDate && 
      EXCLUDED_CLIENTS.includes(l.client_donneur?.toUpperCase() || '') &&
      parseFloat(l.frais || 0) > 0
    );
  }, [livraisons, gerantDate]);

  const months = useMemo(() => {
    const s = new Set(livraisons.map(l => l.date?.slice(0, 7)).filter(Boolean));
    s.add(CURRENT_MONTH());
    return [...s].sort().reverse();
  }, [livraisons]);

  const gerantMonthLivs = useMemo(() => livsGerant(livraisons.filter(l => l.date && l.date.startsWith(gerantMonth))), [livraisons, gerantMonth]);
  const gerantMonthCount = gerantMonthLivs.length;
  const gerantMonthGain = gerantMonthCount * commissionGerant;
  const gerantMonthFrais = gerantMonthLivs.reduce((s, l) => s + parseFloat(l.frais || 0), 0);

  const gerantMonthByDay = useMemo(() => {
    const map = {};
    gerantMonthLivs.forEach(l => {
      if (!map[l.date]) map[l.date] = { date: l.date, count: 0, gain: 0 };
      map[l.date].count++;
      map[l.date].gain += commissionGerant;
    });
    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
  }, [gerantMonthLivs, commissionGerant]);

  const handleUpdateCommission = async () => {
    await onUpdateCommission(tmpCommission);
    setEditCommission(false);
    if (showToast) showToast('Commission mise à jour');
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>🧑‍💼 Gérant</h1>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 18 }}>
        Commission : {formatAr(commissionGerant)} par livraison (dès que les frais sont payés)
        <div style={{ fontSize: 11, color: 'var(--orange)', marginTop: 4 }}>
          ⚠️ Clients exclus : {EXCLUDED_CLIENTS.join(', ')} (pas de commission)
        </div>
      </div>
      
      <div style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>Commission par livraison</div>
            {editCommission ? (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input type="number" style={{ ...inpSm(), width: 140 }} value={tmpCommission} onChange={e => setTmpCommission(parseFloat(e.target.value) || 0)} />
                <button style={{ ...btn('var(--green)', 'var(--green2)'), padding: '8px 14px', fontSize: 12 }} onClick={handleUpdateCommission}>✓ Sauver</button>
                <button style={{ ...btn('var(--card2)', 'var(--card2)'), padding: '8px 12px', fontSize: 12 }} onClick={() => setEditCommission(false)}>✕</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--pink)' }}>{formatAr(commissionGerant)}</span>
                <button style={{ background: 'var(--blue-dim)', border: 'none', borderRadius: 7, padding: '6px 12px', color: 'var(--blue)', fontSize: 12, cursor: 'pointer' }} onClick={() => { setTmpCommission(commissionGerant); setEditCommission(true); }}>✏️ Modifier</button>
              </div>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'right' }}>
            <div>💰 Commission sur toutes les livraisons</div>
            <div style={{ fontSize: 11 }}>Dès que les frais sont payés (montant &gt; 0)</div>
            <div style={{ fontSize: 11 }}>⚠️ Sauf pour les clients : {EXCLUDED_CLIENTS.join(', ')}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--card)', borderRadius: 12, padding: 4, border: '1px solid var(--border)' }}>
        <button onClick={() => setGerantTab('jour')} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 9, background: gerantTab === 'jour' ? 'var(--grad-purple)' : 'transparent', color: gerantTab === 'jour' ? '#fff' : 'var(--subtle)', fontWeight: gerantTab === 'jour' ? 700 : 500, cursor: 'pointer', fontSize: 13 }}>📅 Par jour</button>
        <button onClick={() => setGerantTab('mois')} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 9, background: gerantTab === 'mois' ? 'var(--grad-purple)' : 'transparent', color: gerantTab === 'mois' ? '#fff' : 'var(--subtle)', fontWeight: gerantTab === 'mois' ? 700 : 500, cursor: 'pointer', fontSize: 13 }}>📆 Par mois</button>
      </div>

      {gerantTab === 'jour' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <label style={lbl()}>Sélectionner une date</label>
            <input type="date" style={{ ...inpSm(), maxWidth: 220 }} value={gerantDate} onChange={e => setGerantDate(e.target.value)} />
          </div>
          
          {/* Message si des livraisons sont exclues */}
          {gerantDayExcluded.length > 0 && (
            <div style={{ background: 'var(--orange-dim)', border: '1px solid #f59e0b', borderRadius: 8, padding: '10px', marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--yellow)', fontWeight: 600 }}>
                ⚠️ {gerantDayExcluded.length} livraison(s) exclue(s) de la commission (clients {EXCLUDED_CLIENTS.join(', ')})
              </div>
            </div>
          )}
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 20 }}>
            <div style={{ background: 'linear-gradient(135deg, var(--card2), var(--bg))', border: '1px solid var(--purple)', borderRadius: 12, padding: '16px 18px', gridColumn: '1/-1' }}>
              <div style={{ fontSize: 11, color: 'var(--purple)', fontWeight: 700, marginBottom: 6 }}>GAIN DU GÉRANT — {gerantDate}</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)' }}>{formatAr(gerantDayGain)}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{gerantDayCount} livraisons × {formatAr(commissionGerant)}</div>
            </div>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--blue)', marginBottom: 3 }}>{gerantDayCount}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Livraisons avec commission</div>
            </div>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--pink)', marginBottom: 3 }}>{formatAr(gerantDayGain)}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Gain gérant</div>
            </div>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--orange)', marginBottom: 3 }}>{formatAr(gerantDayFraisTotal)}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Frais collectés</div>
            </div>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: gerantDayNet >= 0 ? 'var(--green)' : 'var(--red)', marginBottom: 3 }}>{formatAr(gerantDayNet)}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Frais nets (frais - commission)</div>
            </div>
          </div>
          
          {gerantDayLivs.length > 0 && (
            <div>
              <h2 style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 10 }}>Détail des livraisons avec commission — {gerantDate}</h2>
              <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 550 }}>
                  <thead>
                    <tr style={{ background: 'var(--card)' }}>
                      <th style={{ padding: '10px 12px', color: 'var(--muted)', fontWeight: 700, textAlign: 'left', fontSize: 11 }}>#</th>
                      <th style={{ padding: '10px 12px', color: 'var(--muted)', fontWeight: 700, textAlign: 'left', fontSize: 11 }}>Colis</th>
                      <th style={{ padding: '10px 12px', color: 'var(--muted)', fontWeight: 700, textAlign: 'left', fontSize: 11 }}>Client donneur</th>
                      <th style={{ padding: '10px 12px', color: 'var(--muted)', fontWeight: 700, textAlign: 'left', fontSize: 11 }}>Destinataire</th>
                      <th style={{ padding: '10px 12px', color: 'var(--muted)', fontWeight: 700, textAlign: 'left', fontSize: 11 }}>Agent</th>
                      <th style={{ padding: '10px 12px', color: 'var(--muted)', fontWeight: 700, textAlign: 'left', fontSize: 11 }}>Statut</th>
                      <th style={{ padding: '10px 12px', color: 'var(--muted)', textAlign: 'right', fontSize: 11 }}>Frais</th>
                      <th style={{ padding: '10px 12px', color: 'var(--muted)', textAlign: 'right', fontSize: 11 }}>Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gerantDayLivs.map((l, i) => (
                      <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 12px', color: 'var(--muted)' }}>{i + 1}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text)' }}>{l.colis}</td>
                        <td style={{ padding: '10px 12px' }}>{l.client_donneur}</td>
                        <td style={{ padding: '10px 12px' }}>{l.destinataire}</td>
                        <td style={{ padding: '10px 12px' }}>{l.agent_nom}</td>
                        <td style={{ padding: '10px 12px' }}><span style={tag(STATUTS[l.statut]?.bg || '#333', STATUTS[l.statut]?.color || '#fff')}>{STATUTS[l.statut]?.label || l.statut}</span></td>
                        <td style={{ padding: '10px 12px', color: 'var(--orange)', textAlign: 'right' }}>{formatAr(parseFloat(l.frais || 0))}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>{formatAr(commissionGerant)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#1e293b' }}>
                      <td colSpan={6} style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--muted)' }}>TOTAL</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--orange)' }}>{formatAr(gerantDayFraisTotal)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--pink)' }}>{formatAr(gerantDayGain)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
          {gerantDayLivs.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0' }}>
              Aucune livraison avec commission ce jour.
            </div>
          )}
        </div>
      )}

      {gerantTab === 'mois' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <label style={lbl()}>Sélectionner un mois</label>
            <select style={{ ...inpSm(), maxWidth: 220 }} value={gerantMonth} onChange={e => setGerantMonth(e.target.value)}>
              {months.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
            </select>
          </div>
          
          <div style={{ background: 'linear-gradient(135deg, var(--card2), var(--bg))', border: '1px solid var(--purple)', borderRadius: 14, padding: '20px 22px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--purple)', fontWeight: 700, marginBottom: 4 }}>GAIN TOTAL GÉRANT — {monthLabel(gerantMonth)}</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)' }}>{formatAr(gerantMonthGain)}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{gerantMonthCount} livraisons × {formatAr(commissionGerant)}</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--muted)' }}>
              <div>Frais collectés: <b style={{ color: 'var(--orange)' }}>{formatAr(gerantMonthFrais)}</b></div>
              <div>Frais nets: <b style={{ color: 'var(--green)' }}>{formatAr(gerantMonthFrais - gerantMonthGain)}</b></div>
            </div>
          </div>
          
          {gerantMonthByDay.length > 0 && (
            <div>
              <h2 style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 10 }}>Détail jour par jour — {monthLabel(gerantMonth)}</h2>
              <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 16 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 320 }}>
                  <thead>
                    <tr style={{ background: 'var(--card)' }}>
                      <th style={{ padding: '10px 14px', color: 'var(--muted)', fontWeight: 700, textAlign: 'left', fontSize: 11 }}>Date</th>
                      <th style={{ padding: '10px 14px', color: 'var(--muted)', fontWeight: 700, textAlign: 'left', fontSize: 11 }}>Livraisons avec commission</th>
                      <th style={{ padding: '10px 14px', color: 'var(--muted)', textAlign: 'right', fontSize: 11 }}>Gain gérant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gerantMonthByDay.map((d, i) => (
                      <tr key={d.date} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--bg)' : 'var(--card)' }}>
                        <td style={{ padding: '11px 14px', fontWeight: 600, color: 'var(--text)' }}>{d.date}</td>
                        <td style={{ padding: '11px 14px' }}><span style={{ background: 'var(--blue-dim)', color: 'var(--blue)', padding: '3px 9px', borderRadius: 20, fontSize: 11 }}>{d.count}</span></td>
                        <td style={{ padding: '11px 14px', textAlign: 'right' }}><span style={{ fontSize: 14, fontWeight: 800, color: 'var(--pink)' }}>{formatAr(d.gain)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#1e293b' }}>
                      <td style={{ padding: '11px 14px', fontWeight: 700, color: 'var(--muted)' }}>TOTAL DU MOIS</td>
                      <td style={{ padding: '11px 14px', fontWeight: 700, color: 'var(--blue)' }}>{gerantMonthCount}</td>
                      <td style={{ padding: '11px 14px', textAlign: 'right', fontWeight: 900, color: 'var(--pink)', fontSize: 15 }}>{formatAr(gerantMonthGain)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
          {gerantMonthByDay.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0' }}>
              Aucune livraison avec commission ce mois.
            </div>
          )}
        </div>
      )}
    </div>
  );
};