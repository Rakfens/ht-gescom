// modules/livraison/pages/Livraisons.jsx
import { useState, useEffect } from 'react';
import { LivraisonForm } from '../components/LivraisonForm';
import { useLivraisons } from '../../../shared/hooks/useLivraisons';
import { useAgents } from '../../../shared/hooks/useAgents';
import { useToast } from '../../../shared/hooks/useToast';

export default function LivraisonsPage() {
  const { livraisons, addLivraison } = useLivraisons();
  const { agents } = useAgents();
  const { showToast } = useToast();
  const [suggestions, setSuggestions] = useState({
    colisList: [],
    clients: [],
    lieux: []
  });

  // Extraire les suggestions à partir des livraisons existantes
  useEffect(() => {
    if (livraisons && livraisons.length > 0) {
      setSuggestions({
        colisList: [...new Set(livraisons.map(l => l.colis).filter(Boolean))],
        clients: [...new Set(livraisons.map(l => l.client_donneur).filter(Boolean))],
        lieux: [...new Set(livraisons.map(l => l.destinataire_lieu).filter(Boolean))]
      });
    }
  }, [livraisons]);

  return (
    <div>
      <LivraisonForm 
        agents={agents}
        onAddLivraison={addLivraison}
        showToast={showToast}
        suggestions={suggestions}
      />
    </div>
  );
}