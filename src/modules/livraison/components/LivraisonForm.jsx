// src/modules/livraison/components/LivraisonForm.jsx
import { useState } from 'react';
// Utilisation du chemin absolu depuis la racine du projet
import { useCompany } from '/src/modules/shared/context/CompanyContext.jsx';
import { COLORS, STATUTS, PAIE_MODES, TODAY } from '/src/modules/shared/utils/constants.js';
import { inp, btn, lbl } from '/src/modules/shared/utils/helpers.js';

export const LivraisonForm = ({ agents, onAddLivraison, showToast, suggestions }) => {
  const { currentCompany } = useCompany();
  
  const [form, setForm] = useState({
    colis: '',
    client_donneur: '',
    destinataire: '',
    destinataire_telephone: '',
    destinataire_lieu: '',
    agentId: '',
    agent_nom: '',
    montant: '',
    frais: '',
    paiement: 'espece',
    date: TODAY(),
    statut: 'en_cours'
  });

  const handleSubmit = async () => {
    if (!form.colis || !form.client_donneur || !form.destinataire || !form.agentId || !form.date) {
      showToast('Colis, client donneur, destinataire, livreur et date requis', 'error');
      return;
    }
    
    const selectedAgent = agents.find(a => a.id === parseInt(form.agentId));
    const agent_nom = selectedAgent?.nom || '—';
    
    const livraisonData = {
      colis: form.colis,
      client_donneur: form.client_donneur,
      destinataire: form.destinataire,
      destinataire_telephone: form.destinataire_telephone,
      destinataire_lieu: form.destinataire_lieu,
      agent_id: parseInt(form.agentId),
      agent_nom: agent_nom,
      montant: form.paiement === 'client' ? 0 : parseFloat(form.montant) || 0,
      frais: parseFloat(form.frais) || 0,
      paiement: form.paiement,
      date: form.date,
      statut: form.statut,
      company_id: currentCompany?.id
    };
    
    await onAddLivraison(livraisonData);
    setForm({
      colis: '',
      client_donneur: '',
      destinataire: '',
      destinataire_telephone: '',
      destinataire_lieu: '',
      agentId: '',
      agent_nom: '',
      montant: '',
      frais: '',
      paiement: 'espece',
      date: TODAY(),
      statut: 'en_cours'
    });
    showToast('Livraison enregistrée');
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 18 }}>
        Nouvelle livraison {currentCompany && `- ${currentCompany.name}`}
      </h1>
      <div style={{ background: 'var(--card)', borderRadius: 14, padding: 18, border: '1px solid var(--border2)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginBottom: 16 }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl()}>📦 Nom du colis</label>
              <input style={inp()} list="colis-list" placeholder="Ex: Téléphone" value={form.colis} onChange={e => setForm({ ...form, colis: e.target.value })} />
              <datalist id="colis-list">{suggestions?.colisList?.map(c => <option key={c} value={c} />)}</datalist>
            </div>
            <div>
              <label style={lbl()}>💰 Montant (Ar)</label>
              <input 
                type="number" 
                style={{ ...inp(), opacity: form.paiement === 'client' ? 0.5 : 1, background: form.paiement === 'client' ? 'var(--border)' : 'var(--bg)' }}
                placeholder="50000" 
                value={form.montant} 
                onChange={e => setForm({ ...form, montant: e.target.value })}
                disabled={form.paiement === 'client'}
              />
            </div>
          </div>

          <div style={{ background: 'var(--blue-dim)', borderRadius: 10, padding: 12, marginBottom: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🏪</span> CLIENT DONNEUR (nous confie le colis)
            </div>
            <div>
              <label style={lbl()}>Nom du client donneur</label>
              <input style={inp()} list="client-list" placeholder="Ex: SARL TECH" value={form.client_donneur} onChange={e => setForm({ ...form, client_donneur: e.target.value })} />
              <datalist id="client-list">{suggestions?.clients?.map(c => <option key={c} value={c} />)}</datalist>
            </div>
          </div>

          <div style={{ background: 'var(--blue-dim)', borderRadius: 10, padding: 12, marginBottom: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🚚</span> DESTINATAIRE (reçoit le colis)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl()}>Nom du destinataire</label>
                <input style={inp()} list="destinataire-list" placeholder="Ex: Jean RAZAFY" value={form.destinataire} onChange={e => setForm({ ...form, destinataire: e.target.value })} />
              </div>
              <div>
                <label style={lbl()}>📞 Téléphone</label>
                <input style={inp()} type="tel" placeholder="034 00 000 00" value={form.destinataire_telephone} onChange={e => setForm({ ...form, destinataire_telephone: e.target.value })} />
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <label style={lbl()}>📍 Lieu de livraison</label>
              <input style={inp()} list="lieu-list" placeholder="Ex: Analakely, Antaninarenina..." value={form.destinataire_lieu} onChange={e => setForm({ ...form, destinataire_lieu: e.target.value })} />
              <datalist id="lieu-list">{suggestions?.lieux?.map(c => <option key={c} value={c} />)}</datalist>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl()}>👨‍💼 Livreur</label>
              <select style={inp()} value={form.agentId} onChange={e => {
                const agentId = e.target.value;
                const agent = agents.find(a => a.id === parseInt(agentId));
                setForm({ ...form, agentId, agent_nom: agent?.nom || '' });
              }}>
                <option value="">-- Choisir --</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl()}>📅 Date</label>
              <input type="date" style={inp()} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>

          <div>
            <label style={lbl()}>💳 Mode de paiement</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {Object.entries(PAIE_MODES).map(([k, v]) => (
                <button key={k} onClick={() => setForm({ ...form, paiement: k })} style={{ padding: '10px 8px', border: '2px solid ' + (form.paiement === k ? 'var(--blue)' : 'var(--border2)'), borderRadius: 9, background: form.paiement === k ? 'var(--blue-dim)' : 'var(--bg)', color: form.paiement === k ? 'var(--blue)' : 'var(--subtle)', cursor: 'pointer', fontSize: 12, fontWeight: 600, textAlign: 'center' }}>
                  <div style={{ fontSize: 18 }}>{v.icon}</div>
                  <div style={{ fontSize: 11, marginTop: 2 }}>{v.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={lbl()}>🚚 Frais de livraison (Ar)</label>
            <input type="number" style={inp()} placeholder="3000" value={form.frais} onChange={e => setForm({ ...form, frais: e.target.value })} />
          </div>

          <div>
            <label style={lbl()}>📊 Statut</label>
            <select style={inp()} value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
              {Object.entries(STATUTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

        </div>
        <button style={{ ...btn('var(--blue)', 'var(--blue2)'), width: '100%', padding: 14, fontSize: 15 }} onClick={handleSubmit}>✅ Enregistrer la livraison</button>
      </div>
    </div>
  );
};