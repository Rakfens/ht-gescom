import { useState, useEffect } from 'react';
import { fetchLivraisons, addLivraison, updateLivraison, deleteLivraison } from '../services/livraisonService';

export const useLivraisons = () => {
  const [livraisons, setLivraisons] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLivraisons = async () => {
    try {
      const data = await fetchLivraisons();
      setLivraisons(data);
    } catch (error) {
      console.error('Erreur chargement livraisons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLivraison = async (livraison) => {
    try {
      // Ne pas utiliser 'agents' ici - l'agent_nom doit être passé directement
      // ou récupéré depuis le formulaire
      const montant = livraison.paiement === 'client' ? 0 : parseFloat(livraison.montant) || 0;
      const newLiv = {
        colis: livraison.colis,
        client: livraison.client,
        telephone: livraison.telephone || '',
        lieu: livraison.lieu || '',
        agent_id: parseInt(livraison.agentId),
        agent_nom: livraison.agentNom || '—',  // Utiliser agentNom passé du formulaire
        montant: montant,
        frais: parseFloat(livraison.frais) || 0,
        paiement: livraison.paiement,
        date: livraison.date,
        statut: livraison.statut
      };
      const data = await addLivraison(newLiv);
      setLivraisons([data, ...livraisons]);
      return data;
    } catch (error) {
      console.error('Erreur ajout livraison:', error);
      throw error;
    }
  };

  const handleUpdateLivraison = async (id, updates) => {
    try {
      await updateLivraison(id, updates);
      setLivraisons(livraisons.map(l => l.id === id ? { ...l, ...updates } : l));
    } catch (error) {
      console.error('Erreur mise à jour livraison:', error);
      throw error;
    }
  };

  const handleDeleteLivraison = async (id) => {
    try {
      await deleteLivraison(id);
      setLivraisons(livraisons.filter(l => l.id !== id));
    } catch (error) {
      console.error('Erreur suppression livraison:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadLivraisons();
  }, []);

  return {
    livraisons,
    loading,
    addLivraison: handleAddLivraison,
    updateLivraison: handleUpdateLivraison,
    deleteLivraison: handleDeleteLivraison,
    reloadLivraisons: loadLivraisons
  };
};