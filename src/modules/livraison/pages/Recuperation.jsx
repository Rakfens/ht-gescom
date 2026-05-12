import { useState, useEffect } from 'react';
import { COLORS, formatAr, TODAY } from '../../shared/utils/constants';
import { btn, inp, lbl, tag } from '../../shared/utils/helpers'; 
import { fetchRecuperations, addRecuperation, updateRecuperation, deleteRecuperation, getRecuperationsByDate } from '../services/recuperationService'; 

export const Recuperation = ({ agents, showToast }) => {
  const [recuperations, setRecuperations] = useState([]);
  const [selectedDate, setSelectedDate] = useState(TODAY());
  const [form, setForm] = useState({
    livreur_id: '',
    livreur_nom: '',
    client_donneur: '',
    frais_recuperation: 1000
  });
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(false);

  // Charger les récupérations du jour
  useEffect(() => {
    loadRecuperations();
  }, [selectedDate]);

  const loadRecuperations = async () => {
    setLoading(true);
    try {
      const data = await getRecuperationsByDate(selectedDate);
      setRecuperations(data || []);
    } catch (error) {
      console.error('Erreur chargement récupérations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!form.livreur_id || !form.client_donneur) {
      showToast('Livreur et client donneur requis', 'error');
      return;
    }
    const agent = agents.find(a => a.id === parseInt(form.livreur_id));
    const newRecup = {
      date: selectedDate,
      livreur_id: parseInt(form.livreur_id),
      livreur_nom: agent?.nom,
      client_donneur: form.client_donneur,
      frais_recuperation: parseInt(form.frais_recuperation) || 0
    };
    await addRecuperation(newRecup);
    setForm({ livreur_id: '', livreur_nom: '', client_donneur: '', frais_recuperation: 1000 });
    loadRecuperations();
    showToast('Récupération ajoutée');
  };

  const handleUpdate = async () => {
    await updateRecuperation(editId, { 
      frais_recuperation: parseInt(editData.frais_recuperation) || 0
    });
    setEditId(null);
    loadRecuperations();
    showToast('Récupération modifiée');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer cette récupération ?')) {
      await deleteRecuperation(id);
      loadRecuperations();
      showToast('Récupération supprimée', 'warn');
    }
  };

  // Calcul des totaux du jour
  const totalGains = recuperations.reduce((s, r) => s + (r.frais_recuperation || 0), 0);
  const totalRecuperations = recuperations.length;

  // Regrouper par livreur
  const recuperationsParLivreur = recuperations.reduce((acc, r) => {
    const nom = r.livreur_nom;
    if (!acc[nom]) acc[nom] = { livreur: nom, recuperations: [], totalGain: 0 };
    acc[nom].recuperations.push(r);
    acc[nom].totalGain += (r.frais_recuperation || 0);
    return acc;
  }, {});

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 18 }}>📦 Récupération matinale</h1>
      
      {/* Carte info */}
      <div style={{ background: 'linear-gradient(135deg, #1e1060, #0b1120)', border: '1px solid #a78bfa', borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: '#a78bfa', fontWeight: 700, marginBottom: 4 }}>📅 Récupérations du {selectedDate}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>{formatAr(totalGains)}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{totalRecuperations} récupération(s)</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#64748b' }}>💰 Frais variable selon distance</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>✅ Non inclus dans le salaire mensuel</div>
          </div>
        </div>
      </div>

      {/* Sélecteur de date */}
      <div style={{ background: COLORS.card, padding: '14px 16px', borderRadius: 12, border: '1px solid ' + COLORS.border, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <label style={lbl()}>📅 Date des récupérations</label>
            <input type="date" style={inp()} value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
          </div>
          <button style={{ ...btn(COLORS.blue, '#2563eb'), padding: '8px 20px' }} onClick={loadRecuperations}>Actualiser</button>
        </div>
      </div>

      {/* Formulaire d'ajout */}
      <div style={{ background: COLORS.card, border: '1px solid ' + COLORS.border2, borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: COLORS.muted, marginBottom: 12 }}>➕ Ajouter une récupération</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={lbl()}>👨‍💼 Livreur</label>
            <select style={inp()} value={form.livreur_id} onChange={e => {
              const id = e.target.value;
              const agent = agents.find(a => a.id === parseInt(id));
              setForm({ ...form, livreur_id: id, livreur_nom: agent?.nom || '' });
            }}>
              <option value="">-- Choisir --</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl()}>🏪 Client donneur</label>
            <input style={inp()} placeholder="Ex: SARL TECH" value={form.client_donneur} onChange={e => setForm({ ...form, client_donneur: e.target.value })} />
          </div>
          <div>
            <label style={lbl()}>💰 Frais de récupération (Ar)</label>
            <input type="number" style={inp()} placeholder="1000" value={form.frais_recuperation} onChange={e => setForm({ ...form, frais_recuperation: e.target.value })} />
          </div>
        </div>
        <button style={{ ...btn(COLORS.green, '#059669'), width: '100%', padding: '10px', marginTop: 12 }} onClick={handleAdd}>+ Ajouter la récupération</button>
      </div>

      {/* Liste des récupérations du jour */}
      <h2 style={{ fontSize: 13, fontWeight: 700, color: COLORS.muted, marginBottom: 12 }}>📋 Récupérations du {selectedDate}</h2>
      {loading ? (
        <div style={{ textAlign: 'center', color: COLORS.muted, padding: 40 }}>Chargement...</div>
      ) : recuperations.length === 0 ? (
        <div style={{ textAlign: 'center', color: COLORS.muted, padding: 40, background: COLORS.card, borderRadius: 12, border: '1px solid ' + COLORS.border }}>
          Aucune récupération enregistrée pour cette date.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Object.values(recuperationsParLivreur).map(rl => (
            <div key={rl.livreur} style={{ background: COLORS.card, border: '1px solid ' + COLORS.border, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ background: '#1e3a5f', padding: '10px 15px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div><span style={{ fontWeight: 700, color: '#fff' }}>👨‍💼 {rl.livreur}</span></div>
                <div><span style={{ color: '#34d399' }}>💰 {formatAr(rl.totalGain)}</span></div>
              </div>
              <div style={{ padding: '10px' }}>
                {rl.recuperations.map(r => (
                  <div key={r.id} style={{ background: COLORS.bg, borderRadius: 8, padding: '8px 12px', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    {editId === r.id ? (
                      <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ minWidth: 150, fontWeight: 600 }}>🏪 {editData.client_donneur}</span>
                        <input type="number" style={{ ...inp(), width: 150 }} placeholder="Frais" value={editData.frais_recuperation} onChange={e => setEditData({ ...editData, frais_recuperation: e.target.value })} />
                        <button style={{ ...btn(COLORS.green, '#047857'), padding: '6px 12px' }} onClick={handleUpdate}>✓</button>
                        <button style={{ ...btn('#475569', '#334155'), padding: '6px 12px' }} onClick={() => setEditId(null)}>✕</button>
                      </div>
                    ) : (
                      <>
                        <div style={{ flex: 1 }}>
                          <div><span style={{ fontWeight: 600 }}>🏪 {r.client_donneur}</span></div>
                          <div style={{ fontSize: 11, color: COLORS.muted }}>💰 {formatAr(r.frais_recuperation)}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button style={{ background: '#1e3a5f', border: 'none', borderRadius: 6, padding: '5px 10px', color: '#60a5fa', fontSize: 11, cursor: 'pointer' }} onClick={() => { setEditId(r.id); setEditData({ client_donneur: r.client_donneur, frais_recuperation: r.frais_recuperation }); }}>✏️</button>
                          <button style={{ background: '#450a0a', border: 'none', borderRadius: 6, padding: '5px 10px', color: '#f87171', fontSize: 11, cursor: 'pointer' }} onClick={() => handleDelete(r.id)}>🗑</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};