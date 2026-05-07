import { useState, useEffect } from 'react';
import { fetchAvances, addAvance, annulerAvance, deleteAvance } from '../services/avanceService';

export const useAvances = () => {
  const [avances, setAvances] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAvances = async () => {
    try {
      const data = await fetchAvances();
      setAvances(data);
    } catch (error) {
      console.error('Erreur chargement avances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAvance = async (avance) => {
    const newAvance = await addAvance(avance);
    setAvances([newAvance, ...avances]);
    return newAvance;
  };

  const handleAnnulerAvance = async (id) => {
    await annulerAvance(id);
    setAvances(avances.map(a => a.id === id ? { ...a, annule: true } : a));
  };

  const handleDeleteAvance = async (id) => {
    await deleteAvance(id);
    setAvances(avances.filter(a => a.id !== id));
  };

  useEffect(() => {
    loadAvances();
  }, []);

  return { 
    avances, 
    loading, 
    addAvance: handleAddAvance, 
    annulerAvance: handleAnnulerAvance, 
    deleteAvance: handleDeleteAvance, 
    reloadAvances: loadAvances 
  };
};