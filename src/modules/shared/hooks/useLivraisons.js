// modules/shared/hooks/useLivraisons.js
import { useState, useEffect, useCallback } from 'react';
import { fetchLivraisons, addLivraison, updateLivraison, deleteLivraison } from '../../livraison/services/livraisonService';
import { useCompany } from '../context/CompanyContext';

export const useLivraisons = () => {
  const [livraisons, setLivraisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentCompany } = useCompany();

  const loadLivraisons = useCallback(async () => {
    if (!currentCompany?.id) {
      setLivraisons([]);
      setLoading(false);
      return;
    }
    
    try {
      setError(null);
      const data = await fetchLivraisons();
      setLivraisons(data);
    } catch (error) {
      console.error('Erreur chargement livraisons:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [currentCompany?.id]);

  const handleAddLivraison = async (livraison) => {
    if (!currentCompany?.id) {
      const err = new Error('Aucune société sélectionnée');
      setError(err.message);
      throw err;
    }
    
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
        montant: montant,
        frais: parseFloat(livraison.frais) || 0,
        paiement: livraison.paiement,
        date: livraison.date,
        statut: livraison.statut || 'en_cours',
        company_id: currentCompany.id
      };
      const data = await addLivraison(newLiv);
      setLivraisons(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Erreur ajout livraison:', error);
      setError(error.message);
      throw error;
    }
  };

  const handleUpdateLivraison = async (id, updates) => {
    try {
      setError(null);
      await updateLivraison(id, updates);
      setLivraisons(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    } catch (error) {
      console.error('Erreur mise à jour livraison:', error);
      setError(error.message);
      throw error;
    }
  };

  const handleDeleteLivraison = async (id) => {
    try {
      setError(null);
      await deleteLivraison(id);
      setLivraisons(prev => prev.filter(l => l.id !== id));
    } catch (error) {
      console.error('Erreur suppression livraison:', error);
      setError(error.message);
      throw error;
    }
  };

  useEffect(() => {
    loadLivraisons();
  }, [loadLivraisons]);

  return {
    livraisons,
    loading,
    error,
    addLivraison: handleAddLivraison,
    updateLivraison: handleUpdateLivraison,
    deleteLivraison: handleDeleteLivraison,
    reloadLivraisons: loadLivraisons
  };
};