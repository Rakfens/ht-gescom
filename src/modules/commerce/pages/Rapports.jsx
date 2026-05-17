// Rapports.jsx — FIX #2 (console.log) + FIX #4 (useCompany) + graphique + marge
import { useState, useEffect } from 'react';
import { useCompany } from '../../shared/context/CompanyContext';
import { fetchVentes, getCA, getTopProduits } from '../services/venteService';
import { getTotalAchats } from '../services/achatService';
import { fetchProduits, getAlertesStockBas } from '../services/produitService';
import { supabase } from '../../../supabaseClient';
import { formatAr } from '../../shared/utils/constants';
import { btn, inp } from '../../shared/utils/helpers';

// ─── KPI Card ─────────────────────────────────────────────────────────
const KpiCard = ({ title, value, icon, color, sub }) => (
  <div style={{ background: 'var(--card)', border: `1px solid ${color}20`, borderRadius: 16, padding: 16, borderLeft: `3px solid ${color}` }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
      <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
      <span style={{ fontSize: 20 }}>{icon}</span>
    </div>
    <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{sub}</div>}
  </div>
);

// ─── Mini graphique barres ─────────────────────────────────────────────
const BarChart = ({ data, color = 'var(--blue)' }) => {
  if (!data.length) return null;
  const maxVal = Math.max(...data.map(d => d.total), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120, overflowX: 'auto', padding: '0 4px 4px' }}>
      {data.map(item => {
        const h = Math.max((item.total / maxVal) * 100, 2);
        return (
          <div key={item.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 44, flex: '0 0 auto' }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4, fontWeight: 600 }}>
              {formatAr(item.total).replace(' Ar', '')}
            </div>
            <div style={{ width: '100%', background: 'var(--bg)', borderRadius: '4px 4px 0 0', height: 84, display: 'flex', alignItems: 'flex-end' }}>
              <div style={{
                width: '100%',
                height: `${h}%`,
                background: color,
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.4s ease',
                minHeight: 3,
              }} />
            </div>
            <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 4, textAlign: 'center' }}>
              {new Date(item.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const PERIOD_OPTIONS = [
  { value: 'aujourdhui', label: "Aujourd'hui",
    getDates: () => { const d = new Date().toISOString().split('T')[0]; return { debut: d, fin: d }; } },
  { value: 'semaine', label: 'Semaine',
    getDates: () => {
      const today = new Date(); const day = today.getDay(); const diff = day === 0 ? 6 : day - 1;
      const first = new Date(today); first.setDate(today.getDate() - diff);
      return { debut: first.toISOString().split('T')[0], fin: today.toISOString().split('T')[0] };
    }},
  { value: 'mois', label: 'Ce mois',
    getDates: () => ({ debut: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], fin: new Date().toISOString().split('T')[0] }) },
  { value: 'trimestre', label: 'Trimestre',
    getDates: () => {
      const now = new Date(); const q = Math.floor(now.getMonth() / 3);
      return { debut: new Date(now.getFullYear(), q * 3, 1).toISOString().split('T')[0], fin: now.toISOString().split('T')[0] };
    }},
  { value: 'annee', label: 'Année',
    getDates: () => ({ debut: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], fin: new Date().toISOString().split('T')[0] }) },
];

export default function Rapports() {
  // FIX #4 : utiliser useCompany() au lieu de getCurrentCompany()
  const { currentCompany } = useCompany();
  const [period, setPeriod] = useState('mois');
  const [dateDebut, setDateDebut] = useState(PERIOD_OPTIONS[2].getDates().debut);
  const [dateFin, setDateFin] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ ca: 0, totalVentes: 0, totalAchats: 0, marge: 0, txMarge: 0, nbProduits: 0, alertesStock: 0, totalDepenses: 0 });
  const [ventesParJour, setVentesParJour] = useState([]);
  const [topProduits, setTopProduits] = useState([]);
  const [depenses, setDepenses] = useState([]);

  useEffect(() => { if (currentCompany) loadReports(); }, [currentCompany, dateDebut, dateFin]);

  // FIX #2 : suppression de tous les console.log + FIX #4 : currentCompany (pas getCurrentCompany)
  const loadReports = async () => {
    if (!currentCompany) return;
    setLoading(true);
    try {
      const [ca, ventes, achatsTotal, produits, alertes, top] = await Promise.all([
        getCA(dateDebut, dateFin),
        fetchVentes({ dateDebut, dateFin }),
        getTotalAchats(dateDebut, dateFin),
        fetchProduits(),
        getAlertesStockBas(),
        getTopProduits(10, dateDebut, dateFin),
      ]);

      setTopProduits(top || []);

      // Ventes par jour
      const byDay = new Map();
      ventes.forEach(v => {
        const date = (v.date_vente || '').split('T')[0];
        if (date) byDay.set(date, (byDay.get(date) || 0) + (v.montant_total || 0));
      });
      setVentesParJour([...byDay.entries()].map(([date, total]) => ({ date, total })).sort((a, b) => a.date.localeCompare(b.date)));

      // Dépenses (Pomanay)
      let totalDepenses = 0;
      if (currentCompany.slug === 'pomanay') {
        const { data: dep } = await supabase
          .from('depenses').select('*')
          .eq('company_id', currentCompany.id)
          .gte('date_depense', dateDebut).lte('date_depense', dateFin)
          .order('date_depense', { ascending: false });
        setDepenses(dep || []);
        totalDepenses = (dep || []).reduce((s, d) => s + (d.montant || 0), 0);
      }

      const marge = ca - achatsTotal;
      const txMarge = ca > 0 ? ((marge / ca) * 100).toFixed(1) : 0;

      setStats({
        ca, totalVentes: ventes.length, totalAchats: achatsTotal,
        marge, txMarge, nbProduits: produits.length,
        alertesStock: alertes.length, totalDepenses,
      });
    } catch (_) {
      // Silencieux en production
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (value) => {
    setPeriod(value);
    const { debut, fin } = PERIOD_OPTIONS.find(o => o.value === value).getDates();
    setDateDebut(debut); setDateFin(fin);
  };

  if (loading) return (
    <div style={{ color: 'var(--muted)', padding: 60, textAlign: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>Chargement des rapports...
    </div>
  );

  return (
    <div style={{ padding: '0 0 24px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>Rapports</h1>
        <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 3 }}>{currentCompany?.name} · Analyse des performances</p>
      </div>

      {/* Sélecteur période */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--card)', borderRadius: 12, padding: 4, border: '1px solid var(--border2)', flexWrap: 'wrap' }}>
          {PERIOD_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => handlePeriodChange(opt.value)} style={{
              padding: '7px 14px', border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font)',
              background: period === opt.value ? 'var(--accent)' : 'transparent',
              color: period === opt.value ? '#fff' : 'var(--text2)',
              transition: 'all 0.2s ease',
            }}>{opt.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="date" style={{ ...inp(), maxWidth: 150 }} value={dateDebut} onChange={e => setDateDebut(e.target.value)} />
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>→</span>
          <input type="date" style={{ ...inp(), maxWidth: 150 }} value={dateFin} onChange={e => setDateFin(e.target.value)} />
          <button style={{ ...btn('var(--blue)', 'var(--blue2)'), padding: '9px 16px', fontSize: 13 }} onClick={loadReports}>↻</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 20 }}>
        <KpiCard title="Chiffre d'affaires" value={formatAr(stats.ca)} icon="💰" color="var(--green)" />
        <KpiCard title="Nb ventes" value={stats.totalVentes} icon="🧾" color="var(--blue)" />
        <KpiCard title="Total achats" value={formatAr(stats.totalAchats)} icon="📥" color="var(--orange)" />
        {/* FIX #2 : marge affichée avec taux */}
        <KpiCard title="Marge brute" value={formatAr(stats.marge)} icon="📈" color={stats.marge >= 0 ? 'var(--purple)' : 'var(--red)'}
          sub={`Taux : ${stats.txMarge}%`} />
        <KpiCard title="Produits" value={stats.nbProduits} icon="🏷️" color="var(--teal)" />
        <KpiCard title="Alertes stock" value={stats.alertesStock} icon="⚠️" color={stats.alertesStock > 0 ? 'var(--red)' : 'var(--green)'}
          sub={stats.alertesStock > 0 ? 'Stock bas ou rupture' : 'Tout est OK'} />
        {currentCompany?.slug === 'pomanay' && (
          <KpiCard title="Dépenses" value={formatAr(stats.totalDepenses)} icon="💸" color="var(--pink)" />
        )}
      </div>

      {/* Graphique ventes par jour */}
      {ventesParJour.length > 0 && (
        <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border2)', padding: '18px 18px 14px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Évolution des ventes</h3>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{ventesParJour.length} jour(s)</span>
          </div>
          <BarChart data={ventesParJour} color="var(--blue)" />
        </div>
      )}

      {/* Top produits */}
      {topProduits.length > 0 && (
        <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border2)', padding: 18, marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>🏆 Top 10 produits</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '7px 10px', textAlign: 'left' }}>#</th>
                  <th style={{ padding: '7px 10px', textAlign: 'left' }}>Produit</th>
                  <th style={{ padding: '7px 10px', textAlign: 'right' }}>Qté</th>
                  <th style={{ padding: '7px 10px', textAlign: 'right' }}>CA</th>
                </tr>
              </thead>
              <tbody>
                {topProduits.map((p, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 10px', color: idx < 3 ? 'var(--yellow)' : 'var(--muted)', fontWeight: 700 }}>
                      {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : `${idx + 1}`}
                    </td>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{p.produit_nom || p.produit?.nom || '—'}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{p.quantite}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--green)' }}>{formatAr(p.chiffre)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dépenses par catégorie (Pomanay) */}
      {currentCompany?.slug === 'pomanay' && depenses.length > 0 && (
        <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border2)', padding: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>💸 Dépenses par catégorie</h3>
          {Object.entries(depenses.reduce((acc, d) => { acc[d.categorie || 'Autre'] = (acc[d.categorie || 'Autre'] || 0) + d.montant; return acc; }, {}))
            .sort(([, a], [, b]) => b - a)
            .map(([cat, total]) => {
              const totalDep = depenses.reduce((s, d) => s + d.montant, 0);
              const pct = totalDep > 0 ? (total / totalDep) * 100 : 0;
              return (
                <div key={cat} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{cat}</span>
                    <span style={{ fontSize: 13, color: 'var(--text2)' }}>{formatAr(total)} · {pct.toFixed(1)}%</span>
                  </div>
                  <div style={{ background: 'var(--bg)', height: 7, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, background: 'var(--pink)', height: '100%', borderRadius: 4, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
