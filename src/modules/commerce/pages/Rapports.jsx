// modules/commerce/pages/Rapports.jsx
import { useState, useEffect } from 'react';
import { useCompany } from '../../shared/context/CompanyContext';
import { fetchVentes, getCA } from '../services/venteService';
import { fetchAchats, getTotalAchats } from '../services/achatService';
import { fetchProduits, getAlertesStockBas } from '../services/produitService';
import { supabase, getCurrentCompany } from '../../../supabaseClient';
import { COLORS, formatAr } from '../../shared/utils/constants';
import { btn, inp } from '../../shared/utils/helpers';

export default function Rapports() {
  const { currentCompany } = useCompany();
  const [period, setPeriod] = useState('mois');
  const [dateDebut, setDateDebut] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [dateFin, setDateFin] = useState(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState({
    ca: 0,
    totalVentes: 0,
    totalAchats: 0,
    marge: 0,
    nbProduits: 0,
    alertesStock: 0
  });
  const [ventesParJour, setVentesParJour] = useState([]);
  const [topProduits, setTopProduits] = useState([]);
  const [depenses, setDepenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [currentCompany, dateDebut, dateFin]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const company = getCurrentCompany();
      if (!company) return;

      const [ca, ventes, achats, produits, alertes] = await Promise.all([
        getCA(dateDebut, dateFin),
        fetchVentes({ dateDebut, dateFin }),
        getTotalAchats(dateDebut, dateFin),
        fetchProduits(),
        getAlertesStockBas()
      ]);

      const totalVentes = ventes.length;
      const marge = ca - achats;

      setStats({
        ca,
        totalVentes,
        totalAchats: achats,
        marge,
        nbProduits: produits.length,
        alertesStock: alertes.length
      });

      // Ventes par jour
      const ventesParJourMap = new Map();
      ventes.forEach(v => {
        const date = v.date_vente.split('T')[0];
        ventesParJourMap.set(date, (ventesParJourMap.get(date) || 0) + v.montant_total);
      });
      setVentesParJour(Array.from(ventesParJourMap.entries()).map(([date, total]) => ({ date, total })).sort((a, b) => a.date.localeCompare(b.date)));

      // Top produits
      const { data: top } = await supabase
        .from('vente_details')
        .select('produit_id, produits(nom), quantite, sous_total')
        .eq('ventes.company_id', company.id)
        .gte('ventes.date_vente', dateDebut)
        .lte('ventes.date_vente', dateFin);

      const produitsMap = new Map();
      top?.forEach(item => {
        const produitId = item.produit_id;
        if (!produitsMap.has(produitId)) {
          produitsMap.set(produitId, {
            nom: item.produits?.nom || 'Produit',
            quantite: 0,
            chiffre: 0
          });
        }
        const p = produitsMap.get(produitId);
        p.quantite += item.quantite;
        p.chiffre += item.sous_total;
      });
      setTopProduits(Array.from(produitsMap.values()).sort((a, b) => b.chiffre - a.chiffre).slice(0, 10));

      // Dépenses (si Pomanay)
      if (currentCompany.slug === 'pomanay') {
        const { data: depensesData } = await supabase
          .from('depenses')
          .select('*')
          .eq('company_id', company.id)
          .gte('date_depense', dateDebut)
          .lte('date_depense', dateFin)
          .order('date_depense', { ascending: false });
        setDepenses(depensesData || []);
      }
    } catch (error) {
      console.error('Erreur chargement rapports:', error);
    } finally {
      setLoading(false);
    }
  };

  const periodOptions = [
    { value: 'aujourdhui', label: 'Aujourd\'hui', getDates: () => ({ debut: new Date().toISOString().split('T')[0], fin: new Date().toISOString().split('T')[0] }) },
    { value: 'semaine', label: 'Cette semaine', getDates: () => {
      const today = new Date();
      const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
      return { debut: firstDay.toISOString().split('T')[0], fin: new Date().toISOString().split('T')[0] };
    }},
    { value: 'mois', label: 'Ce mois', getDates: () => ({
      debut: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      fin: new Date().toISOString().split('T')[0]
    })},
    { value: 'trimestre', label: 'Ce trimestre', getDates: () => {
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3);
      const firstDay = new Date(now.getFullYear(), quarter * 3, 1);
      return { debut: firstDay.toISOString().split('T')[0], fin: new Date().toISOString().split('T')[0] };
    }},
    { value: 'annee', label: 'Cette année', getDates: () => ({
      debut: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      fin: new Date().toISOString().split('T')[0]
    })}
  ];

  const handlePeriodChange = (value) => {
    setPeriod(value);
    const { debut, fin } = periodOptions.find(o => o.value === value).getDates();
    setDateDebut(debut);
    setDateFin(fin);
  };

  if (loading) return <div style={{ color: COLORS.muted, padding: 50, textAlign: 'center' }}>Chargement...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', marginBottom: 8 }}>📊 Rapports</h1>
      <p style={{ color: COLORS.muted, marginBottom: 24 }}>Analyse des performances</p>

      {/* Sélecteur de période */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, background: COLORS.card, borderRadius: 10, padding: 4 }}>
          {periodOptions.map(opt => (
            <button key={opt.value} onClick={() => handlePeriodChange(opt.value)} style={{ padding: '8px 16px', border: 'none', borderRadius: 8, background: period === opt.value ? COLORS.blue : 'transparent', color: period === opt.value ? '#fff' : COLORS.subtle, cursor: 'pointer' }}>
              {opt.label}
            </button>
          ))}
        </div>
        <input type="date" style={inp()} value={dateDebut} onChange={e => setDateDebut(e.target.value)} />
        <span>→</span>
        <input type="date" style={inp()} value={dateFin} onChange={e => setDateFin(e.target.value)} />
        <button style={{ ...btn(COLORS.blue, '#2563eb') }} onClick={loadReports}>Actualiser</button>
      </div>

      {/* Cartes KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <KpiCard title="Chiffre d'affaires" value={formatAr(stats.ca)} icon="💰" color={COLORS.green} />
        <KpiCard title="Nombre de ventes" value={stats.totalVentes} icon="📦" color={COLORS.blue} />
        <KpiCard title="Total achats" value={formatAr(stats.totalAchats)} icon="📥" color={COLORS.orange} />
        <KpiCard title="Marge brute" value={formatAr(stats.marge)} icon="📈" color={COLORS.purple} />
        <KpiCard title="Produits" value={stats.nbProduits} icon="🏷️" color={COLORS.pink} />
        <KpiCard title="Alertes stock" value={stats.alertesStock} icon="⚠️" color={COLORS.red} />
      </div>

      {/* Ventes par jour (graphique simplifié) */}
      {ventesParJour.length > 0 && (
        <div style={{ background: COLORS.card, borderRadius: 12, border: `1px solid ${COLORS.border2}`, padding: 20, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📈 Évolution des ventes</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, overflowX: 'auto', minHeight: 200 }}>
            {ventesParJour.map(item => {
              const maxValue = Math.max(...ventesParJour.map(v => v.total));
              const height = maxValue > 0 ? (item.total / maxValue) * 150 : 0;
              return (
                <div key={item.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 60 }}>
                  <div style={{ height: 150, display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{ width: 40, background: COLORS.blue, borderRadius: '4px 4px 0 0', height: `${height}px` }} />
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 8 }}>{new Date(item.date).toLocaleDateString()}</div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{formatAr(item.total)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top produits */}
      {topProduits.length > 0 && (
        <div style={{ background: COLORS.card, borderRadius: 12, border: `1px solid ${COLORS.border2}`, padding: 20, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🏆 Top 10 produits</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: 8, textAlign: 'left' }}>#</th>
                  <th style={{ padding: 8, textAlign: 'left' }}>Produit</th>
                  <th style={{ padding: 8, textAlign: 'right' }}>Quantité</th>
                  <th style={{ padding: 8, textAlign: 'right' }}>Chiffre</th>
                </tr>
              </thead>
              <tbody>
                {topProduits.map((p, idx) => (
                  <tr key={idx} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: 8, color: COLORS.muted }}>{idx + 1}</td>
                    <td style={{ padding: 8 }}>{p.nom}</td>
                    <td style={{ padding: 8, textAlign: 'right' }}>{p.quantite}</td>
                    <td style={{ padding: 8, textAlign: 'right' }}>{formatAr(p.chiffre)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dépenses par catégorie (Pomanay uniquement) */}
      {currentCompany?.slug === 'pomanay' && depenses.length > 0 && (
        <div style={{ background: COLORS.card, borderRadius: 12, border: `1px solid ${COLORS.border2}`, padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>💰 Dépenses par catégorie</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {Object.entries(depenses.reduce((acc, d) => {
              acc[d.categorie] = (acc[d.categorie] || 0) + d.montant;
              return acc;
            }, {})).map(([categorie, total]) => (
              <div key={categorie}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13 }}>{categorie}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{formatAr(total)}</span>
                </div>
                <div style={{ background: COLORS.bg, height: 8, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${(total / depenses.reduce((s, d) => s + d.montant, 0)) * 100}%`, background: COLORS.red, height: '100%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const KpiCard = ({ title, value, icon, color }) => (
  <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border2}`, borderRadius: 12, padding: 16 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <span style={{ fontSize: 24 }}>{icon}</span>
      <span style={{ fontSize: 12, color: COLORS.muted }}>{title}</span>
    </div>
    <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
  </div>
);