// modules/shared/hooks/useRecuperations.js
import { useState, useEffect, useCallback } from 'react';
import { fetchRecuperations, addRecuperation, updateRecuperation, deleteRecuperation } from '../../livraison/services/recuperationService'; 
import { useCompany } from '../context/CompanyContext';

export const useRecuperations = () => {
  const [recuperations, setRecuperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentCompany } = useCompany();

  const loadRecuperations = useCallback(async () => {
    if (!currentCompany?.id) {
      setRecuperations([]);
      setLoading(false);
      return;
    }
    
    try {
      setError(null);
      const data = await fetchRecuperations();
      setRecuperations(data);
    } catch (error) {
      console.error('Erreur chargement récupérations:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [currentCompany?.id]);

  const handleAddRecuperation = async (recuperation) => {
    if (!currentCompany?.id) {
      const err = new Error('Aucune société sélectionnée');
      setError(err.message);
      throw err;
    }
    
    try {
      setError(null);
      const newRecuperation = {
        ...recuperation,
        company_id: currentCompany.id
      };
      const data = await addRecuperation(newRecuperation);
      setRecuperations(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Erreur ajout récupération:', error);
      setError(error.message);
      throw error;
    }
  };

  const handleUpdateRecuperation = async (id, updates) => {
    try {
      setError(null);
      await updateRecuperation(id, updates);
      setRecuperations(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    } catch (error) {
      console.error('Erreur mise à jour récupération:', error);
      setError(error.message);
      throw error;
    }
  };

  const handleDeleteRecuperation = async (id) => {
    try {
      setError(null);
      await deleteRecuperation(id);
      setRecuperations(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Erreur suppression récupération:', error);
      setError(error.message);
      throw error;
    }
  };

  useEffect(() => {
    loadRecuperations();
  }, [loadRecuperations]);

  return { 
    recuperations, 
    loading, 
    error,
    addRecuperation: handleAddRecuperation, 
    updateRecuperation: handleUpdateRecuperation, 
    deleteRecuperation: handleDeleteRecuperation, 
    reloadRecuperations: loadRecuperations 
  };
};