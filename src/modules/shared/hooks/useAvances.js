// modules/shared/hooks/useAvances.js
import { useState, useEffect, useCallback } from 'react';
import { fetchAvances, addAvance, annulerAvance, deleteAvance } from '../../livraison/services/avanceService'; 
import { useCompany } from '../context/CompanyContext';

export const useAvances = () => {
  const [avances, setAvances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentCompany } = useCompany();

  const loadAvances = useCallback(async () => {
    if (!currentCompany?.id) {
      setAvances([]);
      setLoading(false);
      return;
    }
    
    try {
      setError(null);
      const data = await fetchAvances();
      setAvances(data);
    } catch (error) {
      console.error('Erreur chargement avances:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [currentCompany?.id]);

  const handleAddAvance = async (avance) => {
    if (!currentCompany?.id) {
      const err = new Error('Aucune société sélectionnée');
      setError(err.message);
      throw err;
    }
    
    try {
      setError(null);
      const newAvance = {
        ...avance,
        company_id: currentCompany.id
      };
      const data = await addAvance(newAvance);
      setAvances(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Erreur ajout avance:', error);
      setError(error.message);
      throw error;
    }
  };

  const handleAnnulerAvance = async (id) => {
    try {
      setError(null);
      await annulerAvance(id);
      setAvances(prev => prev.map(a => a.id === id ? { ...a, annule: true } : a));
    } catch (error) {
      console.error('Erreur annulation avance:', error);
      setError(error.message);
      throw error;
    }
  };

  const handleDeleteAvance = async (id) => {
    try {
      setError(null);
      await deleteAvance(id);
      setAvances(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('Erreur suppression avance:', error);
      setError(error.message);
      throw error;
    }
  };

  useEffect(() => {
    loadAvances();
  }, [loadAvances]);

  return { 
    avances, 
    loading, 
    error,
    addAvance: handleAddAvance, 
    annulerAvance: handleAnnulerAvance, 
    deleteAvance: handleDeleteAvance, 
    reloadAvances: loadAvances 
  };
};