// useAvances.js — v2 : fix loading infini + initialized guard
import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchAvances, addAvance, annulerAvance, deleteAvance } from '../../livraison/services/avanceService';
import { useCompany } from '../context/CompanyContext';

export const useAvances = () => {
  const [avances, setAvances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const { currentCompany, initialized } = useCompany();
  const lastCompanyId = useRef(null);

  const loadAvances = useCallback(async (companyId) => {
    if (!companyId) { setAvances([]); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAvances();
      setAvances(data);
    } catch (err) {
      console.error('useAvances:', err);
      setError(err.message);
      setAvances([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialized) return;
    const id = currentCompany?.id || null;
    if (id === lastCompanyId.current) return;
    lastCompanyId.current = id;
    loadAvances(id);
  }, [currentCompany?.id, initialized, loadAvances]);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.table === 'avances' && currentCompany?.id)
        loadAvances(currentCompany.id);
    };
    window.addEventListener('supabase_realtime', handler);
    return () => window.removeEventListener('supabase_realtime', handler);
  }, [currentCompany?.id, loadAvances]);

  const handleAddAvance = async (avance) => {
    try {
      setError(null);
      const newAvance = await addAvance(avance);
      setAvances(prev => [newAvance, ...prev]);
      return newAvance;
    } catch (err) { setError(err.message); throw err; }
  };

  const handleAnnulerAvance = async (id) => {
    try {
      setError(null);
      await annulerAvance(id);
      setAvances(prev => prev.map(a => a.id === id ? { ...a, statut: 'annule' } : a));
    } catch (err) { setError(err.message); throw err; }
  };

  const handleDeleteAvance = async (id) => {
    try {
      setError(null);
      await deleteAvance(id);
      setAvances(prev => prev.filter(a => a.id !== id));
    } catch (err) { setError(err.message); throw err; }
  };

  return {
    avances, loading, error,
    addAvance: handleAddAvance,
    annulerAvance: handleAnnulerAvance,
    deleteAvance: handleDeleteAvance,
    reloadAvances: () => loadAvances(currentCompany?.id),
  };
};