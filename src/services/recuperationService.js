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
    if (!recuperation.livreur_id) throw new Error('Le livreur_id est requis');
    if (!recuperation.livreur_nom) throw new Error('Le livreur_nom est requis');
    
    const insertData = {
      date: recuperation.date,
      livreur_id: recuperation.livreur_id,
      livreur_nom: recuperation.livreur_nom,
      client_donneur: recuperation.client_donneur || '',
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

export const getRecuperationsByLivreur = async (livreurId, mois) => {
  try {
    console.log('=== getRecuperationsByLivreur ===');
    console.log('Livreur ID reçu:', livreurId);
    console.log('Type du livreur ID:', typeof livreurId);
    console.log('Mois reçu:', mois);
    
    // Vérifier si livreurId est valide
    if (!livreurId) {
      console.log('Aucun livreur ID fourni');
      return [];
    }
    
    // Construction de la requête
    let query = supabase
      .from('recuperations')
      .select('*')
      .eq('livreur_id', livreurId);
    
    // Ajouter le filtre par mois si fourni
    if (mois) {
      console.log('Ajout du filtre mois:', mois);
      query = query.ilike('date', `${mois}%`);
    }
    
    // Exécuter la requête
    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) {
      console.error('Erreur Supabase:', error);
      throw error;
    }
    
    console.log(`Récupérations trouvées pour livreur ${livreurId}:`, data?.length || 0);
    
    // Afficher les détails si des données sont trouvées
    if (data && data.length > 0) {
      console.log('Détails des récupérations:');
      data.forEach((recup, index) => {
        console.log(`  ${index + 1}. Date: ${recup.date}, Client: ${recup.client_donneur}, Frais: ${recup.frais_recuperation}`);
      });
    } else {
      console.log('Aucune récupération trouvée pour ce livreur/mois');
      
      // Vérifier si le livreur a des récupérations sur d'autres mois
      const { data: allData, error: allError } = await supabase
        .from('recuperations')
        .select('*')
        .eq('livreur_id', livreurId);
      
      if (!allError && allData && allData.length > 0) {
        console.log(`Mais ce livreur a ${allData.length} récupération(s) sur d'autres mois:`);
        const months = [...new Set(allData.map(r => r.date.substring(0, 7)))];
        console.log('Mois disponibles:', months);
      }
    }
    
    return data || [];
    
  } catch (error) {
    console.error('getRecuperationsByLivreur - Erreur:', error);
    return [];
  }
};

// Nouvelle fonction utilitaire pour obtenir toutes les récupérations d'un livreur sans filtre
export const getAllRecuperationsByLivreur = async (livreurId) => {
  try {
    console.log('getAllRecuperationsByLivreur - ID:', livreurId);
    
    const { data, error } = await supabase
      .from('recuperations')
      .select('*')
      .eq('livreur_id', livreurId)
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    console.log(`Total récupérations pour livreur ${livreurId}:`, data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('getAllRecuperationsByLivreur - Erreur:', error);
    return [];
  }
};