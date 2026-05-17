// useRecuperations.js — v2 : fix loading infini + initialized guard
import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchRecuperations, addRecuperation, updateRecuperation, deleteRecuperation } from '../../livraison/services/recuperationService';
import { useCompany } from '../context/CompanyContext';

export const useRecuperations = () => {
  const [recuperations, setRecuperations] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const { currentCompany, initialized } = useCompany();
  const lastCompanyId = useRef(null);

  const loadRecuperations = useCallback(async (companyId) => {
    if (!companyId) { setRecuperations([]); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRecuperations();
      setRecuperations(data);
    } catch (err) {
      console.error('useRecuperations:', err);
      setError(err.message);
      setRecuperations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialized) return;
    const id = currentCompany?.id || null;
    if (id === lastCompanyId.current) return;
    lastCompanyId.current = id;
    loadRecuperations(id);
  }, [currentCompany?.id, initialized, loadRecuperations]);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.table === 'recuperations' && currentCompany?.id)
        loadRecuperations(currentCompany.id);
    };
    window.addEventListener('supabase_realtime', handler);
    return () => window.removeEventListener('supabase_realtime', handler);
  }, [currentCompany?.id, loadRecuperations]);

  const handleAddRecuperation = async (rec) => {
    try {
      setError(null);
      const newRec = await addRecuperation(rec);
      setRecuperations(prev => [newRec, ...prev]);
      return newRec;
    } catch (err) { setError(err.message); throw err; }
  };

  const handleUpdateRecuperation = async (id, updates) => {
    try {
      setError(null);
      await updateRecuperation(id, updates);
      setRecuperations(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    } catch (err) { setError(err.message); throw err; }
  };

  const handleDeleteRecuperation = async (id) => {
    try {
      setError(null);
      await deleteRecuperation(id);
      setRecuperations(prev => prev.filter(r => r.id !== id));
    } catch (err) { setError(err.message); throw err; }
  };

  return {
    recuperations, loading, error,
    addRecuperation: handleAddRecuperation,
    updateRecuperation: handleUpdateRecuperation,
    deleteRecuperation: handleDeleteRecuperation,
    reloadRecuperations: () => loadRecuperations(currentCompany?.id),
  };
};