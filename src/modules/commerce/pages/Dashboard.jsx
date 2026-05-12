// src/modules/commerce/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useCompany } from '../../shared/context/CompanyContext';
import { fetchProduits, getAlertesStockBas, getValeurTotaleStock } from '../services/produitService';
import { fetchVentes, getCA } from '../services/venteService';
import { fetchAchats, getTotalAchats } from '../services/achatService';
import { supabase, getCurrentCompany } from '../../../supabaseClient';
import { COLORS, formatAr } from '../../shared/utils/constants';

export default function CommerceDashboard() {
  const { currentCompany } = useCompany();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    ventesJour: 0,
    ventesMois: 0,
    caJour: 0,
    caMois: 0,
    nbProduits: 0,
    stockBas: 0,
    valeurStock: 0,
    achatsMois: 0,
    depensesJour: 0,
    depensesMois: 0
  });
  const [recentVentes, setRecentVentes] = useState([]);
  const [alertesStock, setAlertesStock] = useState([]);

  // Fonction pour obtenir la date au bon format YYYY-MM-DD
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getFirstDayOfMonth = () => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (currentCompany) {
      loadDashboardData();
    }
  }, [currentCompany]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const today = getTodayDate();
      const firstDayOfMonth = getFirstDayOfMonth();

      console.log('📅 Aujourd\'hui:', today);
      console.log('📅 Début du mois:', firstDayOfMonth);

      // Charger toutes les ventes
      const toutesVentes = await fetchVentes();
      console.log('📊 Toutes les ventes:', toutesVentes.length);

      // Ventes du jour - Filtrer par date au bon format
      const ventesJour = toutesVentes.filter(v => {
        const dateVente = v.date_vente ? v.date_vente.split('T')[0] : null;
        return dateVente === today;
      });
      
      // Ventes du mois
      const ventesMois = toutesVentes.filter(v => {
        const dateVente = v.date_vente ? v.date_vente.split('T')[0] : null;
        return dateVente >= firstDayOfMonth;
      });

      console.log('📊 Ventes aujourd\'hui:', ventesJour.length);
      console.log('📊 Ventes du mois:', ventesMois.length);

      // CA du jour et du mois
      const caJour = ventesJour.reduce((sum, v) => sum + (v.montant_total || 0), 0);
      const caMois = ventesMois.reduce((sum, v) => sum + (v.montant_total || 0), 0);

      // Produits
      const produits = await fetchProduits();
      const alertes = await getAlertesStockBas();
      const valeurStock = await getValeurTotaleStock();

      // Achats du mois
      const achats = await fetchAchats({ dateDebut: firstDayOfMonth, dateFin: today });
      const totalAchats = achats.reduce((sum, a) => sum + (a.montant_total || 0), 0);

      // Dépenses (uniquement pour Pomanay)
      let depensesJour = 0;
      let depensesMois = 0;
      
      if (currentCompany.slug === 'pomanay') {
        const company = getCurrentCompany();
        // Dépenses du jour
        const { data: depensesJourData } = await supabase
          .from('depenses')
          .select('montant')
          .eq('company_id', company?.id)
          .eq('date_depense', today);
        
        depensesJour = depensesJourData?.reduce((sum, d) => sum + (d.montant || 0), 0) || 0;

        // Dépenses du mois
        const { data: depensesMoisData } = await supabase
          .from('depenses')
          .select('montant')
          .eq('company_id', company?.id)
          .gte('date_depense', firstDayOfMonth)
          .lte('date_depense', today);
        
        depensesMois = depensesMoisData?.reduce((sum, d) => sum + (d.montant || 0), 0) || 0;
        
        console.log('💰 Dépenses aujourd\'hui:', depensesJour);
        console.log('💰 Dépenses du mois:', depensesMois);
      }

      setStats({
        ventesJour: ventesJour.length,
        ventesMois: ventesMois.length,
        caJour: caJour,
        caMois: caMois,
        nbProduits: produits.length,
        stockBas: alertes.length,
        valeurStock: valeurStock,
        achatsMois: totalAchats,
        depensesJour: depensesJour,
        depensesMois: depensesMois
      });

      setRecentVentes(toutesVentes.slice(0, 5));
      setAlertesStock(alertes.slice(0, 5));
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ color: COLORS.muted, textAlign: 'center', padding: 50 }}>Chargement...</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', marginBottom: 8 }}>
        Dashboard {currentCompany?.name}
      </h1>
      <p style={{ color: COLORS.muted, marginBottom: 24 }}>Aperçu de votre activité</p>

      {/* Cartes statistiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard title="Ventes aujourd'hui" value={stats.ventesJour} icon="📦" color={COLORS.blue} />
        <StatCard title="CA aujourd'hui" value={formatAr(stats.caJour)} icon="💰" color={COLORS.green} />
        <StatCard title="Ventes du mois" value={stats.ventesMois} icon="📊" color={COLORS.purple} />
        <StatCard title="CA du mois" value={formatAr(stats.caMois)} icon="💵" color={COLORS.green} />
        <StatCard title="Produits" value={stats.nbProduits} icon="🏷️" color={COLORS.orange} />
        <StatCard title="Valeur stock" value={formatAr(stats.valeurStock)} icon="📦" color={COLORS.blue} />
        <StatCard title="Alertes stock" value={stats.stockBas} icon="⚠️" color={COLORS.red} />
        <StatCard title="Achats du mois" value={formatAr(stats.achatsMois)} icon="📥" color={COLORS.pink} />
        
        {/* Dépenses (uniquement pour Pomanay) */}
        {currentCompany?.slug === 'pomanay' && (
          <>
            <StatCard title="Dépenses aujourd'hui" value={formatAr(stats.depensesJour)} icon="💸" color={COLORS.red} />
            <StatCard title="Dépenses du mois" value={formatAr(stats.depensesMois)} icon="📉" color={COLORS.orange} />
          </>
        )}
      </div>

      {/* Bénéfice net (uniquement pour Pomanay) */}
      {currentCompany?.slug === 'pomanay' && (
        <div style={{ 
          background: 'linear-gradient(135deg, #1e3a5f, #0f172a)', 
          borderRadius: 12, 
          padding: 20, 
          marginBottom: 24,
          border: `1px solid ${COLORS.border2}`
        }}>
          <div style={{ fontSize: 14, color: COLORS.muted, marginBottom: 8 }}>📈 Bénéfice net</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: COLORS.green }}>
            {formatAr(stats.caMois - stats.achatsMois - stats.depensesMois)}
          </div>
          <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 8 }}>
            CA - Achats - Dépenses = {formatAr(stats.caMois)} - {formatAr(stats.achatsMois)} - {formatAr(stats.depensesMois)}
          </div>
        </div>
      )}

      {/* Alertes stock */}
      {alertesStock.length > 0 && (
        <div style={{ background: '#451a03', border: '1px solid #f59e0b', borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <h3 style={{ color: '#f59e0b', marginBottom: 12, fontSize: 14, fontWeight: 700 }}>
            ⚠️ Alertes stock bas ({alertesStock.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alertesStock.map(produit => (
              <div key={produit.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span>{produit.nom}</span>
                <span style={{ color: COLORS.orange }}>Stock: {produit.quantite_stock} / Min: {produit.stock_minimum}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dernières ventes */}
      <div style={{ background: COLORS.card, borderRadius: 12, border: `1px solid ${COLORS.border2}`, overflow: 'hidden' }}>
        <div style={{ padding: 16, borderBottom: `1px solid ${COLORS.border2}` }}>
          <h3 style={{ fontWeight: 700 }}>📋 Dernières ventes</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: COLORS.bg }}>
                <th style={{ padding: 12, textAlign: 'left', fontSize: 12, color: COLORS.muted }}>#Facture</th>
                <th style={{ padding: 12, textAlign: 'left', fontSize: 12, color: COLORS.muted }}>Client</th>
                <th style={{ padding: 12, textAlign: 'left', fontSize: 12, color: COLORS.muted }}>Date</th>
                <th style={{ padding: 12, textAlign: 'right', fontSize: 12, color: COLORS.muted }}>Montant</th>
                <th style={{ padding: 12, textAlign: 'center', fontSize: 12, color: COLORS.muted }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {recentVentes.map(vente => (
                <tr key={vente.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td style={{ padding: 12, fontSize: 13 }}>{vente.numero_facture}</td>
                  <td style={{ padding: 12, fontSize: 13 }}>{vente.client_nom || '-'}</td>
                  <td style={{ padding: 12, fontSize: 13 }}>{new Date(vente.date_vente).toLocaleDateString()}</td>
                  <td style={{ padding: 12, textAlign: 'right', fontSize: 13, fontWeight: 600 }}>{formatAr(vente.montant_total)}</td>
                  <td style={{ padding: 12, textAlign: 'center' }}>
                    <StatusBadge status={vente.statut} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ title, value, icon, color }) => (
  <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border2}`, borderRadius: 12, padding: 16 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
      <span style={{ fontSize: 24 }}>{icon}</span>
      <span style={{ fontSize: 12, color: COLORS.muted }}>{title}</span>
    </div>
    <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
  </div>
);

const StatusBadge = ({ status }) => {
  const config = {
    paye: { bg: '#064e3b', color: '#34d399', label: 'Payé' },
    credit: { bg: '#451a03', color: '#fbbf24', label: 'Crédit' },
    en_attente: { bg: '#1e3a5f', color: '#60a5fa', label: 'En attente' },
    annule: { bg: '#450a0a', color: '#f87171', label: 'Annulé' }
  };
  const c = config[status] || config.en_attente;
  return <span style={{ background: c.bg, color: c.color, padding: '4px 8px', borderRadius: 20, fontSize: 11 }}>{c.label}</span>;
};