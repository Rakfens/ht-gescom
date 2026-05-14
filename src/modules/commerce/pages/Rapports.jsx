
// src/modules/commerce/pages/Rapports.jsx
import { useState, useEffect } from 'react';
import { useCompany } from '../../shared/context/CompanyContext';
import { fetchVentes, getCA, getTopProduits } from '../services/venteService';
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

      console.log('📊 Chargement des rapports pour:', company.name);
      console.log('📅 Période:', dateDebut, '→', dateFin);

      // 1. Chiffre d'affaires
      const ca = await getCA(dateDebut, dateFin);
      console.log('💰 CA:', ca);

      // 2. Ventes
      const ventes = await fetchVentes({ dateDebut, dateFin });
      const totalVentes = ventes.length;
      console.log('📦 Nombre de ventes:', totalVentes);

      // 3. Achats
      const achats = await getTotalAchats(dateDebut, dateFin);
      console.log('📥 Total achats:', achats);

      // 4. Produits
      const produits = await fetchProduits();
      const alertes = await getAlertesStockBas();

      // 5. Top produits (NOUVELLE VERSION avec RPC)
      const top = await getTopProduits(10, dateDebut, dateFin);
      console.log('🏆 Top produits:', top?.length || 0);
      setTopProduits(top || []);

      // 6. Ventes par jour
      const ventesParJourMap = new Map();
      ventes.forEach(v => {
        const date = v.date_vente.split('T')[0];
        ventesParJourMap.set(date, (ventesParJourMap.get(date) || 0) + v.montant_total);
      });
      setVentesParJour(Array.from(ventesParJourMap.entries()).map(([date, total]) => ({ date, total })).sort((a, b) => a.date.localeCompare(b.date)));

      // 7. Dépenses (uniquement pour Pomanay)
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

      setStats({
        ca,
        totalVentes,
        totalAchats: achats,
        marge: ca - achats,
        nbProduits: produits.length,
        alertesStock: alertes.length
      });

    } catch (error) {
      console.error('❌ Erreur chargement rapports:', error);
    } finally {
      setLoading(false);
    }
  };

  const periodOptions = [
    { 
      value: 'aujourdhui', 
      label: 'Aujourd\'hui', 
      getDates: () => ({ 
        debut: new Date().toISOString().split('T')[0], 
        fin: new Date().toISOString().split('T')[0] 
      }) 
    },
    { 
      value: 'semaine', 
      label: 'Cette semaine', 
      getDates: () => {
        const today = new Date();
        const firstDay = new Date(today);
        const day = firstDay.getDay();
        const diff = day === 0 ? 6 : day - 1;
        firstDay.setDate(today.getDate() - diff);
        return { 
          debut: firstDay.toISOString().split('T')[0], 
          fin: new Date().toISOString().split('T')[0] 
        };
      }
    },
    { 
      value: 'mois', 
      label: 'Ce mois', 
      getDates: () => ({
        debut: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        fin: new Date().toISOString().split('T')[0]
      })
    },
    { 
      value: 'trimestre', 
      label: 'Ce trimestre', 
      getDates: () => {
        const now = new Date();
        const quarter = Math.floor(now.getMonth() / 3);
        const firstDay = new Date(now.getFullYear(), quarter * 3, 1);
        return { 
          debut: firstDay.toISOString().split('T')[0], 
          fin: new Date().toISOString().split('T')[0] 
        };
      }
    },
    { 
      value: 'annee', 
      label: 'Cette année', 
      getDates: () => ({
        debut: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        fin: new Date().toISOString().split('T')[0]
      })
    }
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
            <button 
              key={opt.value} 
              onClick={() => handlePeriodChange(opt.value)} 
              style={{ 
                padding: '8px 16px', 
                border: 'none', 
                borderRadius: 8, 
                background: period === opt.value ? COLORS.blue : 'transparent', 
                color: period === opt.value ? '#fff' : COLORS.subtle, 
                cursor: 'pointer' 
              }}
            >
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

      {/* Ventes par jour */}
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
                    <td style={{ padding: 8 }}>{p.produit_nom || p.produit?.nom || '-'}</td>
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
            }, {})).map(([categorie, total]) => {
              const totalDepenses = depenses.reduce((s, d) => s + d.montant, 0);
              const percentage = totalDepenses > 0 ? (total / totalDepenses) * 100 : 0;
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