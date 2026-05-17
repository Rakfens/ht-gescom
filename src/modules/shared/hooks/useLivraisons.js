// useLivraisons.js — v2 : fix loading infini + initialized guard
import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchLivraisons, addLivraison, updateLivraison, deleteLivraison } from '../../livraison/services/livraisonService';
import { useCompany } from '../context/CompanyContext';

export const useLivraisons = () => {
  const [livraisons, setLivraisons] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const { currentCompany, initialized } = useCompany();
  const lastCompanyId = useRef(null);

  const loadLivraisons = useCallback(async (companyId) => {
    if (!companyId) { setLivraisons([]); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLivraisons();
      setLivraisons(data);
    } catch (err) {
      console.error('useLivraisons:', err);
      setError(err.message);
      setLivraisons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialized) return;
    const id = currentCompany?.id || null;
    if (id === lastCompanyId.current) return;
    lastCompanyId.current = id;
    loadLivraisons(id);
  }, [currentCompany?.id, initialized, loadLivraisons]);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.table === 'livraisons' && currentCompany?.id)
        loadLivraisons(currentCompany.id);
    };
    window.addEventListener('supabase_realtime', handler);
    return () => window.removeEventListener('supabase_realtime', handler);
  }, [currentCompany?.id, loadLivraisons]);

  const handleAddLivraison = async (livraison) => {
    if (!currentCompany?.id) throw new Error('Aucune société sélectionnée');
    try {
      setError(null);
      const montant = livraison.paiement === 'client' ? 0 : parseFloat(livraison.montant) || 0;
      const newLiv = {
        colis: livraison.colis,
        client_donneur: livraison.client_donneur || livraison.client,
        destinataire: livraison.destinataire,
        destinataire_telephone: livraison.destinataire_telephone || livraison.telephone || '',
        destinataire_lieu: livraison.destinataire_lieu || livraison.lieu || '',
        agent_id: parseInt(livraison.agentId),
        agent_nom: livraison.agentNom || livraison.agent_nom || '—',
        montant,
        frais: parseFloat(livraison.frais) || 0,
        paiement: livraison.paiement,
        date: livraison.date,
        statut: livraison.statut || 'en_cours',
        company_id: currentCompany.id,
      };
      const data = await addLivraison(newLiv);
      setLivraisons(prev => [data, ...prev]);
      return data;
    } catch (err) { setError(err.message); throw err; }
  };

  const handleUpdateLivraison = async (id, updates) => {
    try {
      setError(null);
      await updateLivraison(id, updates);
      setLivraisons(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    } catch (err) { setError(err.message); throw err; }
  };

  const handleDeleteLivraison = async (id) => {
    try {
      setError(null);
      await deleteLivraison(id);
      setLivraisons(prev => prev.filter(l => l.id !== id));
    } catch (err) { setError(err.message); throw err; }
  };

  return {
    livraisons, loading, error,
    addLivraison: handleAddLivraison,
    updateLivraison: handleUpdateLivraison,
    deleteLivraison: handleDeleteLivraison,
    reloadLivraisons: () => loadLivraisons(currentCompany?.id),
  };
};