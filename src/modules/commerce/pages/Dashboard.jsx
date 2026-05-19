// Dashboard.jsx — FIX #1 getCurrentCompany→useCompany + FIX #3 console.log supprimés
import { useState, useEffect } from 'react';
import { useCompany } from '../../shared/context/CompanyContext';
import { fetchProduits, getAlertesStockBas, getValeurTotaleStock } from '../services/produitService';
import { fetchVentes } from '../services/venteService';
import { fetchAchats } from '../services/achatService';
import { supabase } from '../../../supabaseClient';
import { formatAr } from '../../shared/utils/constants';
import { btn } from '../../shared/utils/helpers';
import { CardSkeleton } from '../../shared/components/common/Loader';

const today        = () => new Date().toISOString().split('T')[0];
const firstOfMonth = () => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; };

const StatCard = ({ title, value, icon, color }) => (
  <div style={{ background:'var(--card)', border:`1px solid ${color}20`, borderRadius:14, padding:'14px 16px', borderTop:`2px solid ${color}` }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
      <span style={{ fontSize:22 }}>{icon}</span>
      <span style={{ fontSize:11, color:'var(--muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', textAlign:'right' }}>{title}</span>
    </div>
    <div style={{ fontSize:22, fontWeight:800, color }}>{value}</div>
  </div>
);

const StatusBadge = ({ status }) => {
  const cfg = {
    paye:       { bg:'var(--green-dim)', color:'var(--green)',  label:'Payé' },
    credit:     { bg:'var(--yellow-dim)',color:'var(--yellow)', label:'Crédit' },
    en_attente: { bg:'var(--blue-dim)',  color:'var(--blue)',   label:'En attente' },
    annule:     { bg:'var(--red-dim)',   color:'var(--red)',    label:'Annulé' },
  };
  const c = cfg[status] || cfg.en_attente;
  return <span style={{ background:c.bg, color:c.color, padding:'3px 9px', borderRadius:20, fontSize:11, fontWeight:700 }}>{c.label}</span>;
};

export default function CommerceDashboard() {
  // FIX #1 : useCompany() uniquement — plus de getCurrentCompany()
  const { currentCompany } = useCompany();

  const [loading,      setLoading]      = useState(true);
  const [recentVentes, setRecentVentes] = useState([]);
  const [alertes,      setAlertes]      = useState([]);
  const [stats, setStats] = useState({
    ventesJour:0, ventesMois:0, caJour:0, caMois:0,
    nbProduits:0, stockBas:0, valeurStock:0, achatsMois:0,
    depensesJour:0, depensesMois:0,
  });

  useEffect(() => { if (currentCompany) load(); }, [currentCompany]);

  // Realtime
  useEffect(() => {
    const h = e => { if (['ventes','achats','produits','depenses'].includes(e.detail?.table)) load(); };
    window.addEventListener('supabase_realtime', h);
    return () => window.removeEventListener('supabase_realtime', h);
  }, [currentCompany]);

  // FIX #3 : tous les console.log supprimés
  const load = async () => {
    if (!currentCompany) return;
    setLoading(true);
    try {
      const t  = today();
      const fm = firstOfMonth();

      // Requêtes en parallèle — FIX performance
      const [toutesVentes, produits, alertesData, valeurStock, achats] = await Promise.all([
        fetchVentes(),
        fetchProduits(),
        getAlertesStockBas(),
        getValeurTotaleStock(),
        fetchAchats({ dateDebut: fm, dateFin: t }),
      ]);

      const ventesJour  = toutesVentes.filter(v => (v.date_vente||'').split('T')[0] === t);
      const ventesMois  = toutesVentes.filter(v => (v.date_vente||'').split('T')[0] >= fm);
      const caJour  = ventesJour.reduce((s,v) => s + (v.montant_total||0), 0);
      const caMois  = ventesMois.reduce((s,v) => s + (v.montant_total||0), 0);
      const totalAchats = achats.reduce((s,a) => s + (a.montant_total||0), 0);

      let depensesJour = 0, depensesMois = 0;
      if (currentCompany.slug === 'pomanay') {
        // FIX #1 : currentCompany.id directement (pas getCurrentCompany())
        const [{ data: dj }, { data: dm }] = await Promise.all([
          supabase.from('depenses').select('montant').eq('company_id', currentCompany.id).eq('date_depense', t),
          supabase.from('depenses').select('montant').eq('company_id', currentCompany.id).gte('date_depense', fm).lte('date_depense', t),
        ]);
        depensesJour = (dj||[]).reduce((s,d) => s+(d.montant||0), 0);
        depensesMois = (dm||[]).reduce((s,d) => s+(d.montant||0), 0);
      }

      setStats({ ventesJour:ventesJour.length, ventesMois:ventesMois.length, caJour, caMois, nbProduits:produits.length, stockBas:alertesData.length, valeurStock, achatsMois:totalAchats, depensesJour, depensesMois });
      setRecentVentes(toutesVentes.slice(0,5));
      setAlertes(alertesData.slice(0,5));
    } catch (_) {}
    finally { setLoading(false); }
  };

  if (loading) return (
    <div style={{ padding:'0 0 20px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginBottom:20 }}>
        {Array(6).fill(0).map((_,i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  );

  const benefice = stats.caMois - stats.achatsMois - stats.depensesMois;

  return (
    <div style={{ padding:'0 0 24px' }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:20, fontWeight:800, color:'var(--text)' }}>Dashboard</h1>
        <p style={{ color:'var(--muted)', fontSize:12, marginTop:2 }}>{currentCompany?.name} · Aperçu de l'activité</p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))', gap:10, marginBottom:16 }}>
        <StatCard title="Ventes aujourd'hui" value={stats.ventesJour}           icon="📦" color="var(--blue)"   />
        <StatCard title="CA aujourd'hui"      value={formatAr(stats.caJour)}     icon="💰" color="var(--green)"  />
        <StatCard title="Ventes du mois"      value={stats.ventesMois}           icon="📊" color="var(--purple)" />
        <StatCard title="CA du mois"          value={formatAr(stats.caMois)}     icon="💵" color="var(--green)"  />
        <StatCard title="Produits"            value={stats.nbProduits}           icon="🏷️" color="var(--teal)"   />
        <StatCard title="Valeur stock"        value={formatAr(stats.valeurStock)} icon="📦" color="var(--blue)"  />
        <StatCard title="Alertes stock"       value={stats.stockBas}             icon="⚠️" color={stats.stockBas>0?'var(--red)':'var(--green)'} />
        <StatCard title="Achats du mois"      value={formatAr(stats.achatsMois)} icon="📥" color="var(--orange)" />
        {currentCompany?.slug === 'pomanay' && <>
          <StatCard title="Dépenses aujourd'hui" value={formatAr(stats.depensesJour)} icon="💸" color="var(--red)"    />
          <StatCard title="Dépenses du mois"     value={formatAr(stats.depensesMois)} icon="📉" color="var(--orange)" />
        </>}
      </div>

      {/* Bénéfice net */}
      {currentCompany?.slug === 'pomanay' && (
        <div style={{ background:`linear-gradient(135deg, ${benefice>=0?'rgba(52,211,153,0.08)':'rgba(248,113,113,0.08)'}, var(--card))`, border:`1px solid ${benefice>=0?'var(--green)':'var(--red)'}30`, borderRadius:16, padding:'18px 20px', marginBottom:16 }}>
          <div style={{ fontSize:11, color:'var(--muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>📈 Bénéfice net du mois</div>
          <div style={{ fontSize:30, fontWeight:800, color:benefice>=0?'var(--green)':'var(--red)' }}>{formatAr(benefice)}</div>
          <div style={{ fontSize:11, color:'var(--muted)', marginTop:6 }}>CA {formatAr(stats.caMois)} − Achats {formatAr(stats.achatsMois)} − Dépenses {formatAr(stats.depensesMois)}</div>
        </div>
      )}

      {/* Alertes stock */}
      {alertes.length > 0 && (
        <div style={{ background:'var(--yellow-dim)', border:'1px solid rgba(251,191,36,0.3)', borderRadius:14, padding:16, marginBottom:16 }}>
          <h3 style={{ color:'var(--yellow)', marginBottom:10, fontSize:13, fontWeight:700 }}>⚠️ Stock bas ({alertes.length})</h3>
          {alertes.map(p => (
            <div key={p.id} style={{ display:'flex', justifyContent:'space-between', fontSize:13, padding:'5px 0', borderBottom:'1px solid rgba(251,191,36,0.15)' }}>
              <span style={{ color:'var(--text)' }}>{p.nom}</span>
              <span style={{ color:'var(--orange)', fontWeight:600 }}>{p.quantite_stock} / min {p.stock_minimum}</span>
            </div>
          ))}
        </div>
      )}

      {/* Dernières ventes */}
      <div style={{ background:'var(--card)', borderRadius:14, border:'1px solid var(--border2)', overflow:'hidden' }}>
        <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border2)', fontWeight:700, fontSize:14 }}>📋 Dernières ventes</div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'var(--bg)', fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                {['Facture','Client','Date','Montant','Statut'].map(h => (
                  <th key={h} style={{ padding:'9px 12px', textAlign:h==='Montant'?'right':h==='Statut'?'center':'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentVentes.length === 0
                ? <tr><td colSpan={5} style={{ padding:32, textAlign:'center', color:'var(--muted)' }}>Aucune vente</td></tr>
                : recentVentes.map(v => (
                  <tr key={v.id} style={{ borderBottom:'1px solid var(--border)' }}>
                    <td style={{ padding:'10px 12px', fontSize:13, fontWeight:600 }}>{v.numero_facture}</td>
                    <td style={{ padding:'10px 12px', fontSize:13 }}>{v.client_nom || '—'}</td>
                    <td style={{ padding:'10px 12px', fontSize:13 }}>{new Date(v.date_vente).toLocaleDateString('fr-FR')}</td>
                    <td style={{ padding:'10px 12px', textAlign:'right', fontSize:13, fontWeight:600, color:'var(--green)' }}>{formatAr(v.montant_total)}</td>
                    <td style={{ padding:'10px 12px', textAlign:'center' }}><StatusBadge status={v.statut} /></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
