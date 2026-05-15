// src/modules/livraison/services/recuperationService.js
import { supabase, getCurrentCompany } from '../../../supabaseClient';

// ==================== REQUÊTES DE BASE ====================

// Récupérer toutes les récupérations de la société actuelle
export const fetchRecuperations = async () => {
  try {
    const company = getCurrentCompany();
    if (!company) return [];

    const { data, error } = await supabase
      .from('recuperations')
      .select('*')
      .eq('company_id', company.id)
      .order('date', { ascending: false });
    
    if (error) throw error;
    console.log(`fetchRecuperations - ${company.name}:`, data?.length || 0, 'récupérations');
    return data || [];
  } catch (error) {
    console.error('fetchRecuperations - Erreur:', error);
    return [];
  }
};

// Récupérer les récupérations par date
export const getRecuperationsByDate = async (date) => {
  try {
    const company = getCurrentCompany();
    if (!company) return [];

    console.log('getRecuperationsByDate - Date:', date);
    
    const { data, error } = await supabase
      .from('recuperations')
      .select('*')
      .eq('company_id', company.id)
      .eq('date', date)
      .order('livreur_nom');
    
    if (error) throw error;
    
    console.log(`getRecuperationsByDate - ${date}:`, data?.length || 0, 'récupérations');
    return data || [];
  } catch (error) {
    console.error('getRecuperationsByDate - Erreur:', error);
    return [];
  }
};

// Récupérer les récupérations par mois (version corrigée sans ilike)
export const getRecuperationsByMonth = async (mois) => {
  try {
    const company = getCurrentCompany();
    if (!company) return [];

    console.log('getRecuperationsByMonth - Mois recherché:', mois);
    
    // Convertir le mois en plage de dates
    const parts = mois.split('-');
    const year = parts[0];
    const month = parts[1];
    const startDate = `${year}-${month}-01`;
    
    // Calculer le dernier jour du mois
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const endDate = `${year}-${month}-${lastDay}`;
    
    console.log('getRecuperationsByMonth - Plage:', startDate, '→', endDate);
    
    const { data, error } = await supabase
      .from('recuperations')
      .select('*')
      .eq('company_id', company.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    console.log(`getRecuperationsByMonth - ${mois}:`, data?.length || 0, 'récupérations');
    
    if (data && data.length > 0) {
      const dates = data.map(r => r.date);
      console.log('Dates trouvées:', dates);
    }
    
    return data || [];
  } catch (error) {
    console.error('getRecuperationsByMonth - Erreur:', error);
    return [];
  }
};

// Ajouter une récupération
export const addRecuperation = async (recuperation) => {
  try {
    const company = getCurrentCompany();
    if (!company) throw new Error('Aucune société sélectionnée');

    console.log('addRecuperation - Données reçues:', recuperation);
    
    // Validation des données
    if (!recuperation.date) throw new Error('La date est requise');
    if (!recuperation.livreur_nom) throw new Error('Le livreur_nom est requis');
    if (!recuperation.client_donneur) throw new Error('Le client_donneur est requis');
    
    const insertData = {
      date: recuperation.date,
      livreur_id: recuperation.livreur_id || null,
      livreur_nom: recuperation.livreur_nom,
      client_donneur: recuperation.client_donneur,
      frais_recuperation: parseFloat(recuperation.frais_recuperation) || 1000,
      company_id: company.id
    };
    
    console.log('addRecuperation - Données à insérer:', insertData);
    
    const { data, error } = await supabase
      .from('recuperations')
      .insert([insertData])
      .select();
    
    if (error) throw error;
    
    console.log('addRecuperation - Succès, données retournées:', data);
    return data[0];
  } catch (error) {
    console.error('addRecuperation - Erreur:', error);
    throw error;
  }
};

// Mettre à jour une récupération
export const updateRecuperation = async (id, updates) => {
  try {
    const company = getCurrentCompany();
    if (!company) throw new Error('Aucune société sélectionnée');

    console.log('updateRecuperation - ID:', id, 'Updates:', updates);
    
    const { data, error } = await supabase
      .from('recuperations')
      .update(updates)
      .eq('id', id)
      .eq('company_id', company.id)
      .select();
    
    if (error) throw error;
    
    console.log('updateRecuperation - Succès');
    return data[0];
  } catch (error) {
    console.error('updateRecuperation - Erreur:', error);
    throw error;
  }
};

// Supprimer une récupération
export const deleteRecuperation = async (id) => {
  try {
    const company = getCurrentCompany();
    if (!company) throw new Error('Aucune société sélectionnée');

    console.log('deleteRecuperation - ID:', id);
    
    const { error } = await supabase
      .from('recuperations')
      .delete()
      .eq('id', id)
      .eq('company_id', company.id);
    
    if (error) throw error;
    
    console.log('deleteRecuperation - Succès');
  } catch (error) {
    console.error('deleteRecuperation - Erreur:', error);
    throw error;
  }
};

// ==================== REQUÊTES SPÉCIFIQUES ====================

// Récupérer les récupérations par livreur (par ID)
export const getRecuperationsByLivreur = async (livreurId, mois) => {
  try {
    const company = getCurrentCompany();
    if (!company) return [];

    console.log('getRecuperationsByLivreur - Livreur ID:', livreurId, 'Mois:', mois);
    
    if (!livreurId) {
      console.log('Aucun livreur ID fourni');
      return [];
    }
    
    let query = supabase
      .from('recuperations')
      .select('*')
      .eq('livreur_id', livreurId)
      .eq('company_id', company.id);
    
    if (mois) {
      const parts = mois.split('-');
      const year = parts[0];
      const month = parts[1];
      const startDate = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const endDate = `${year}-${month}-${lastDay}`;
      query = query.gte('date', startDate).lte('date', endDate);
    }
    
    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) throw error;
    
    console.log(`getRecuperationsByLivreur - Trouvé ${data?.length || 0} récupérations`);
    return data || [];
  } catch (error) {
    console.error('getRecuperationsByLivreur - Erreur:', error);
    return [];
  }
};

// Récupérer les récupérations par livreur (par nom)
export const getRecuperationsByLivreurNom = async (livreurNom, mois) => {
  try {
    const company = getCurrentCompany();
    if (!company) return [];

    console.log('getRecuperationsByLivreurNom - Livreur Nom:', livreurNom, 'Mois:', mois);
    
    if (!livreurNom) {
      console.log('Aucun livreur nom fourni');
      return [];
    }
    
    let query = supabase
      .from('recuperations')
      .select('*')
      .eq('livreur_nom', livreurNom)
      .eq('company_id', company.id);
    
    if (mois) {
      const parts = mois.split('-');
      const year = parts[0];
      const month = parts[1];
      const startDate = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const endDate = `${year}-${month}-${lastDay}`;
      query = query.gte('date', startDate).lte('date', endDate);
    }
    
    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) throw error;
    
    console.log(`getRecuperationsByLivreurNom - Trouvé ${data?.length || 0} récupérations pour ${livreurNom}`);
    
    if (data && data.length > 0) {
      data.forEach(recup => {
        console.log(`  - Date: ${recup.date}, Client: ${recup.client_donneur}, Frais: ${recup.frais_recuperation}`);
      });
    }
    
    return data || [];
  } catch (error) {
    console.error('getRecuperationsByLivreurNom - Erreur:', error);
    return [];
  }
};

// Total cumulé des récupérations par livreur (par nom)
export const getTotalRecuperationsByLivreurNom = async (livreurNom) => {
  try {
    const company = getCurrentCompany();
    if (!company) return { total: 0, count: 0 };
    
    console.log('getTotalRecuperationsByLivreurNom - Livreur Nom:', livreurNom);
    
    if (!livreurNom) {
      return { total: 0, count: 0 };
    }
    
    const { data, error } = await supabase
      .from('recuperations')
      .select('frais_recuperation, date, client_donneur')
      .eq('livreur_nom', livreurNom)
      .eq('company_id', company.id)
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    const total = data.reduce((sum, r) => sum + (parseFloat(r.frais_recuperation) || 0), 0);
    const count = data.length;
    
    console.log(`getTotalRecuperationsByLivreurNom - ${livreurNom}: ${count} récupérations, total ${total} Ar`);
    
    if (data && data.length > 0) {
      console.log('Détail des récupérations cumulées:');
      data.forEach(recup => {
        console.log(`  - Date: ${recup.date}, Client: ${recup.client_donneur}, Frais: ${recup.frais_recuperation}`);
      });
    }
    
    return { total, count, details: data };
  } catch (error) {
    console.error('getTotalRecuperationsByLivreurNom - Erreur:', error);
    return { total: 0, count: 0, details: [] };
  }
};

// Total cumulé des récupérations par livreur (par ID)
export const getTotalRecuperationsByLivreur = async (livreurId) => {
  try {
    const company = getCurrentCompany();
    if (!company) return { total: 0, count: 0 };
    
    console.log('getTotalRecuperationsByLivreur - Livreur ID:', livreurId);
    
    if (!livreurId) {
      return { total: 0, count: 0 };
    }
    
    const { data, error } = await supabase
      .from('recuperations')
      .select('frais_recuperation')
      .eq('livreur_id', livreurId)
      .eq('company_id', company.id);
    
    if (error) throw error;
    
    const total = data.reduce((sum, r) => sum + (parseFloat(r.frais_recuperation) || 0), 0);
    const count = data.length;
    
    console.log(`getTotalRecuperationsByLivreur - Total: ${count} récupérations, ${total} Ar`);
    return { total, count };
  } catch (error) {
    console.error('getTotalRecuperationsByLivreur - Erreur:', error);
    return { total: 0, count: 0 };
  }
};

// Récupérer toutes les récupérations d'un livreur par nom
export const getAllRecuperationsByLivreurNom = async (livreurNom) => {
  try {
    const company = getCurrentCompany();
    if (!company) return [];
    
    console.log('getAllRecuperationsByLivreurNom - Livreur Nom:', livreurNom);
    
    if (!livreurNom) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('recuperations')
      .select('*')
      .eq('livreur_nom', livreurNom)
      .eq('company_id', company.id)
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    console.log(`getAllRecuperationsByLivreurNom - Trouvé ${data?.length || 0} récupérations pour ${livreurNom}`);
    return data || [];
  } catch (error) {
    console.error('getAllRecuperationsByLivreurNom - Erreur:', error);
    return [];
  }
};

// Statistiques des récupérations par mois
export const getRecuperationsStatsByMonth = async (mois) => {
  try {
    const company = getCurrentCompany();
    if (!company) return {};
    
    console.log('getRecuperationsStatsByMonth - Mois:', mois);
    
    const parts = mois.split('-');
    const year = parts[0];
    const month = parts[1];
    const startDate = `${year}-${month}-01`;
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const endDate = `${year}-${month}-${lastDay}`;
    
    const { data, error } = await supabase
      .from('recuperations')
      .select('*')
      .eq('company_id', company.id)
      .gte('date', startDate)
      .lte('date', endDate);
    
    if (error) throw error;
    
    // Grouper par livreur
    const stats = {};
    (data || []).forEach(recup => {
      const nom = recup.livreur_nom;
      if (!stats[nom]) {
        stats[nom] = {
          livreur_nom: nom,
          total: 0,
          count: 0,
          details: []
        };
      }
      stats[nom].total += parseFloat(recup.frais_recuperation) || 0;
      stats[nom].count += 1;
      stats[nom].details.push(recup);
    });
    
    console.log(`getRecuperationsStatsByMonth - Stats pour ${mois}:`, stats);
    return stats;
  } catch (error) {
    console.error('getRecuperationsStatsByMonth - Erreur:', error);
    return {};
  }
};