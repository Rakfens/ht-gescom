import { supabase } from '../supabaseClient';

export const fetchRecuperations = async () => {
  try {
    const { data, error } = await supabase
      .from('recuperations')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    console.log('fetchRecuperations - Total:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('fetchRecuperations - Erreur:', error);
    return [];
  }
};

export const addRecuperation = async (recuperation) => {
  try {
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
      frais_recuperation: parseFloat(recuperation.frais_recuperation) || 1000
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

export const updateRecuperation = async (id, updates) => {
  try {
    console.log('updateRecuperation - ID:', id, 'Updates:', updates);
    
    const { data, error } = await supabase
      .from('recuperations')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    console.log('updateRecuperation - Succès');
    return data[0];
  } catch (error) {
    console.error('updateRecuperation - Erreur:', error);
    throw error;
  }
};

export const deleteRecuperation = async (id) => {
  try {
    console.log('deleteRecuperation - ID:', id);
    
    const { error } = await supabase
      .from('recuperations')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    console.log('deleteRecuperation - Succès');
  } catch (error) {
    console.error('deleteRecuperation - Erreur:', error);
    throw error;
  }
};

export const getRecuperationsByDate = async (date) => {
  try {
    console.log('getRecuperationsByDate - Date:', date);
    
    const { data, error } = await supabase
      .from('recuperations')
      .select('*')
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

export const getRecuperationsByMonth = async (mois) => {
  try {
    console.log('getRecuperationsByMonth - Mois recherché:', mois);
    
    const { data, error } = await supabase
      .from('recuperations')
      .select('*')
      .ilike('date', `${mois}%`)
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    console.log(`getRecuperationsByMonth - ${mois}:`, data?.length || 0, 'récupérations');
    
    // Afficher les dates trouvées pour vérification
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

// Version qui utilise le livreur_id (originale)
export const getRecuperationsByLivreur = async (livreurId, mois) => {
  try {
    console.log('getRecuperationsByLivreur - Livreur ID:', livreurId, 'Mois:', mois);
    
    if (!livreurId) {
      console.log('Aucun livreur ID fourni');
      return [];
    }
    
    let query = supabase
      .from('recuperations')
      .select('*')
      .eq('livreur_id', livreurId);
    
    if (mois) {
      query = query.ilike('date', `${mois}%`);
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

// NOUVELLE VERSION : Utilise le nom du livreur (recommandé)
export const getRecuperationsByLivreurNom = async (livreurNom, mois) => {
  try {
    console.log('getRecuperationsByLivreurNom - Livreur Nom:', livreurNom, 'Mois:', mois);
    
    if (!livreurNom) {
      console.log('Aucun livreur nom fourni');
      return [];
    }
    
    let query = supabase
      .from('recuperations')
      .select('*')
      .eq('livreur_nom', livreurNom);
    
    if (mois) {
      query = query.ilike('date', `${mois}%`);
    }
    
    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) throw error;
    
    console.log(`getRecuperationsByLivreurNom - Trouvé ${data?.length || 0} récupérations pour ${livreurNom}`);
    
    // Afficher le détail des récupérations trouvées
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

// NOUVELLE FONCTION : Total cumulé par nom (toutes périodes)
export const getTotalRecuperationsByLivreurNom = async (livreurNom) => {
  try {
    console.log('getTotalRecuperationsByLivreurNom - Livreur Nom:', livreurNom);
    
    if (!livreurNom) {
      return { total: 0, count: 0 };
    }
    
    const { data, error } = await supabase
      .from('recuperations')
      .select('frais_recuperation, date, client_donneur')
      .eq('livreur_nom', livreurNom)
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    const total = data.reduce((sum, r) => sum + (parseFloat(r.frais_recuperation) || 0), 0);
    const count = data.length;
    
    console.log(`getTotalRecuperationsByLivreurNom - ${livreurNom}: ${count} récupérations, total ${total} Ar`);
    
    // Afficher le détail cumulé
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

// Total cumulé par ID (version alternative)
export const getTotalRecuperationsByLivreur = async (livreurId) => {
  try {
    console.log('getTotalRecuperationsByLivreur - Livreur ID:', livreurId);
    
    if (!livreurId) {
      return { total: 0, count: 0 };
    }
    
    const { data, error } = await supabase
      .from('recuperations')
      .select('frais_recuperation')
      .eq('livreur_id', livreurId);
    
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

// Récupérer toutes les récupérations d'un livreur par nom (sans filtre de mois)
export const getAllRecuperationsByLivreurNom = async (livreurNom) => {
  try {
    console.log('getAllRecuperationsByLivreurNom - Livreur Nom:', livreurNom);
    
    if (!livreurNom) {
      return [];
    }
    
    const { data, error } = await supabase
      .from('recuperations')
      .select('*')
      .eq('livreur_nom', livreurNom)
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    console.log(`getAllRecuperationsByLivreurNom - Trouvé ${data?.length || 0} récupérations pour ${livreurNom}`);
    return data || [];
  } catch (error) {
    console.error('getAllRecuperationsByLivreurNom - Erreur:', error);
    return [];
  }
};

// Récupérer les statistiques par mois pour tous les livreurs
export const getRecuperationsStatsByMonth = async (mois) => {
  try {
    console.log('getRecuperationsStatsByMonth - Mois:', mois);
    
    const { data, error } = await supabase
      .from('recuperations')
      .select('*')
      .ilike('date', `${mois}%`);
    
    if (error) throw error;
    
    // Grouper par livreur
    const stats = {};
    data.forEach(recup => {
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