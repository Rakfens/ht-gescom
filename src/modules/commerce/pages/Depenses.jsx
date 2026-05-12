// src/modules/commerce/pages/Depenses.jsx
import { useState, useEffect } from 'react';
import { useCompany } from '../../shared/context/CompanyContext';
import { supabase, getCurrentCompany } from '../../../supabaseClient';
import { COLORS, formatAr } from '../../shared/utils/constants';
import { btn, inp, lbl, modalStyles } from '../../shared/utils/helpers';

export default function Depenses() {
  const { currentCompany } = useCompany();
  const [depenses, setDepenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    categorie: '',
    description: '',
    montant: 0,
    date_depense: new Date().toISOString().split('T')[0]
  });
  const [stats, setStats] = useState({
    totalJour: 0,
    totalSemaine: 0,
    totalMois: 0,
    totalAnnee: 0
  });
  const [filterCategorie, setFilterCategorie] = useState('');
  const [filterDateDebut, setFilterDateDebut] = useState('');
  const [filterDateFin, setFilterDateFin] = useState('');

  useEffect(() => {
    loadDepenses();
  }, [currentCompany]);

  const loadDepenses = async () => {
    setLoading(true);
    try {
      const company = getCurrentCompany();
      if (!company) return;

      let query = supabase
        .from('depenses')
        .select('*')
        .eq('company_id', company.id)
        .order('date_depense', { ascending: false });

      if (filterCategorie) {
        query = query.eq('categorie', filterCategorie);
      }
      if (filterDateDebut) {
        query = query.gte('date_depense', filterDateDebut);
      }
      if (filterDateFin) {
        query = query.lte('date_depense', filterDateFin);
      }

      const { data, error } = await query;
      if (error) throw error;
      setDepenses(data || []);

      // Calculer les statistiques
      calculateStats(data || []);
    } catch (error) {
      console.error('Erreur chargement dépenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (depensesList) => {
  // Obtenir la date d'aujourd'hui au format YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  const todayDate = new Date(today);
  
  // Début de la semaine (lundi)
  const startOfWeek = new Date(todayDate);
  const day = startOfWeek.getDay();
  const diff = day === 0 ? 6 : day - 1;
  startOfWeek.setDate(todayDate.getDate() - diff);
  const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
  
  // Début du mois
  const startOfMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
  const startOfMonthStr = startOfMonth.toISOString().split('T')[0];
  
  // Début de l'année
  const startOfYear = new Date(todayDate.getFullYear(), 0, 1);
  const startOfYearStr = startOfYear.toISOString().split('T')[0];

  // Filtrer les dépenses - CORRECTION ICI
  const totalJour = depensesList
    .filter(d => {
      // Extraire la date au format YYYY-MM-DD
      const dateDepense = d.date_depense ? d.date_depense.split('T')[0] : null;
      return dateDepense === today;
    })
    .reduce((sum, d) => sum + (d.montant || 0), 0);
  
  const totalSemaine = depensesList
    .filter(d => {
      const dateDepense = d.date_depense ? d.date_depense.split('T')[0] : null;
      return dateDepense && dateDepense >= startOfWeekStr;
    })
    .reduce((sum, d) => sum + (d.montant || 0), 0);
  
  const totalMois = depensesList
    .filter(d => {
      const dateDepense = d.date_depense ? d.date_depense.split('T')[0] : null;
      return dateDepense && dateDepense >= startOfMonthStr;
    })
    .reduce((sum, d) => sum + (d.montant || 0), 0);
  
  const totalAnnee = depensesList
    .filter(d => {
      const dateDepense = d.date_depense ? d.date_depense.split('T')[0] : null;
      return dateDepense && dateDepense >= startOfYearStr;
    })
    .reduce((sum, d) => sum + (d.montant || 0), 0);

  setStats({ totalJour, totalSemaine, totalMois, totalAnnee });
  };

  const handleSubmit = async () => {
    if (!form.categorie || !form.description || form.montant <= 0) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    const company = getCurrentCompany();
    if (!company) return;

    try {
      const { error } = await supabase
        .from('depenses')
        .insert([{
          company_id: company.id,
          categorie: form.categorie,
          description: form.description,
          montant: form.montant,
          date_depense: form.date_depense,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      setShowModal(false);
      setForm({ categorie: '', description: '', montant: 0, date_depense: new Date().toISOString().split('T')[0] });
      loadDepenses();
      
      // Émettre un événement pour rafraîchir le dashboard
      window.dispatchEvent(new CustomEvent('refreshDashboard'));
    } catch (error) {
      console.error('Erreur création dépense:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Supprimer cette dépense ?')) {
      const company = getCurrentCompany();
      try {
        const { error } = await supabase
          .from('depenses')
          .delete()
          .eq('id', id)
          .eq('company_id', company.id);

        if (error) throw error;
        loadDepenses();
        
        // Émettre un événement pour rafraîchir le dashboard
        window.dispatchEvent(new CustomEvent('refreshDashboard'));
      } catch (error) {
        console.error('Erreur suppression:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const categories = [...new Set(depenses.map(d => d.categorie))];
  const totalDepenses = depenses.reduce((sum, d) => sum + (d.montant || 0), 0);

  // Regrouper les dépenses par catégorie pour le graphique
  const depensesParCategorie = depenses.reduce((acc, d) => {
    const cat = d.categorie;
    if (!acc[cat]) acc[cat] = 0;
    acc[cat] += d.montant;
    return acc;
  }, {});

  if (loading) return <div style={{ color: COLORS.muted, padding: 50, textAlign: 'center' }}>Chargement...</div>;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9' }}>💰 Dépenses - {currentCompany?.name}</h1>
        <button style={{ ...btn(COLORS.blue, '#2563eb'), padding: '10px 20px' }} onClick={() => setShowModal(true)}>
          + Nouvelle dépense
        </button>
      </div>

      {/* Cartes statistiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border2}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>📅 Aujourd'hui</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.red }}>{formatAr(stats.totalJour)}</div>
        </div>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border2}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>📆 Cette semaine</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.orange }}>{formatAr(stats.totalSemaine)}</div>
        </div>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border2}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>📅 Ce mois</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.red }}>{formatAr(stats.totalMois)}</div>
        </div>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border2}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>📆 Cette année</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.pink }}>{formatAr(stats.totalAnnee)}</div>
        </div>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border2}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>💰 Total général</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.purple }}>{formatAr(totalDepenses)}</div>
        </div>
      </div>

      {/* Graphique des dépenses par catégorie */}
      {Object.keys(depensesParCategorie).length > 0 && (
        <div style={{ background: COLORS.card, borderRadius: 12, border: `1px solid ${COLORS.border2}`, padding: 20, marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>📊 Répartition par catégorie</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(depensesParCategorie).map(([categorie, total]) => {
              const percentage = (total / totalDepenses) * 100;
              return (
                <div key={categorie}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13 }}>{categorie}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{formatAr(total)} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div style={{ background: COLORS.bg, height: 8, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${percentage}%`, background: COLORS.red, height: '100%' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select style={inp()} value={filterCategorie} onChange={e => { setFilterCategorie(e.target.value); setTimeout(loadDepenses, 0); }}>
          <option value="">Toutes catégories</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <input type="date" style={inp()} value={filterDateDebut} onChange={e => { setFilterDateDebut(e.target.value); setTimeout(loadDepenses, 0); }} placeholder="Date début" />
        <input type="date" style={inp()} value={filterDateFin} onChange={e => { setFilterDateFin(e.target.value); setTimeout(loadDepenses, 0); }} placeholder="Date fin" />
        <button style={{ ...btn('#475569', '#334155') }} onClick={() => { setFilterCategorie(''); setFilterDateDebut(''); setFilterDateFin(''); loadDepenses(); }}>
          Réinitialiser
        </button>
      </div>

      {/* Liste des dépenses */}
      <div style={{ background: COLORS.card, borderRadius: 12, border: `1px solid ${COLORS.border2}`, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: COLORS.bg }}>
                <th style={{ padding: 12, textAlign: 'left' }}>Date</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Catégorie</th>
                <th style={{ padding: 12, textAlign: 'left' }}>Description</th>
                <th style={{ padding: 12, textAlign: 'right' }}>Montant</th>
                <th style={{ padding: 12, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {depenses.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: COLORS.muted }}>
                    Aucune dépense enregistrée
                  </td>
                </tr>
              ) : (
                depenses.map(depense => (
                  <tr key={depense.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: 12 }}>{new Date(depense.date_depense).toLocaleDateString()}</td>
                    <td style={{ padding: 12 }}>
                      <span style={{ background: '#1e3a5f', color: '#60a5fa', padding: '4px 8px', borderRadius: 8, fontSize: 11 }}>{depense.categorie}</span>
                    </td>
                    <td style={{ padding: 12 }}>{depense.description}</td>
                    <td style={{ padding: 12, textAlign: 'right', fontWeight: 600, color: COLORS.orange }}>{formatAr(depense.montant)}</td>
                    <td style={{ padding: 12, textAlign: 'center' }}>
                      <button onClick={() => handleDelete(depense.id)} style={{ ...btn(COLORS.red, '#b91c1c'), padding: '4px 12px', fontSize: 11 }}>
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr style={{ background: COLORS.bg, borderTop: `2px solid ${COLORS.border}` }}>
                <td colSpan={3} style={{ padding: 12, fontWeight: 700 }}>TOTAL</td>
                <td style={{ padding: 12, textAlign: 'right', fontWeight: 800, fontSize: 16, color: COLORS.red }}>
                  {formatAr(totalDepenses)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal Nouvelle dépense */}
      {showModal && (
        <div style={modalStyles.overlay}>
          <div style={{ ...modalStyles.container, maxWidth: 450 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>Nouvelle dépense</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: COLORS.muted, fontSize: 24, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={lbl()}>Catégorie</label>
                <input style={inp()} list="categoriesList" placeholder="Ex: Électricité, Eau, Transport..." value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })} />
                <datalist id="categoriesList">
                  <option value="Électricité" />
                  <option value="Eau" />
                  <option value="Transport" />
                  <option value="Fournitures" />
                  <option value="Communication" />
                  <option value="Loyer" />
                  <option value="Marketing" />
                  <option value="Salaires" />
                  <option value="Entretien" />
                  <option value="Impressions" />
                  <option value="Autres" />
                </datalist>
              </div>
              <div>
                <label style={lbl()}>Description</label>
                <textarea style={{ ...inp(), minHeight: 80 }} placeholder="Description détaillée..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label style={lbl()}>Montant (Ar)</label>
                <input type="number" style={inp()} placeholder="0" value={form.montant} onChange={e => setForm({ ...form, montant: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <label style={lbl()}>Date</label>
                <input type="date" style={inp()} value={form.date_depense} onChange={e => setForm({ ...form, date_depense: e.target.value })} />
              </div>
              <button style={{ ...btn(COLORS.green, '#047857'), padding: 12, marginTop: 12 }} onClick={handleSubmit}>
                Enregistrer la dépense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}