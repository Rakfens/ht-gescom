import { useState } from 'react';
import { COLORS, STATUTS, PAIE_MODES, TODAY } from '../../utils/constants';
import { inp, btn, lbl } from '../../utils/helpers';

export const LivraisonForm = ({ agents, onAddLivraison, showToast, suggestions }) => {
  const [form, setForm] = useState({
    colis: '',
    client_donneur: '',      // Le vendeur qui nous confie le colis (SANS TÉLÉPHONE)
    destinataire: '',         // L'acheteur qui reçoit le colis
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
      statut: form.statut
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
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 18 }}>Nouvelle livraison</h1>
      <div style={{ background: COLORS.card, borderRadius: 14, padding: 18, border: '1px solid ' + COLORS.border2 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginBottom: 16 }}>
          
          {/* Informations colis */}
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
                style={{ ...inp(), opacity: form.paiement === 'client' ? 0.5 : 1, background: form.paiement === 'client' ? COLORS.border : COLORS.bg }}
                placeholder="50000" 
                value={form.montant} 
                onChange={e => setForm({ ...form, montant: e.target.value })}
                disabled={form.paiement === 'client'}
              />
            </div>
          </div>

          {/* Client donneur (celui qui nous confie le colis) - SANS TÉLÉPHONE */}
          <div style={{ background: '#1e3a5f', borderRadius: 10, padding: 12, marginBottom: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🏪</span> CLIENT DONNEUR (nous confie le colis)
            </div>
            <div>
              <label style={lbl()}>Nom du client donneur</label>
              <input style={inp()} list="client-list" placeholder="Ex: SARL TECH" value={form.client_donneur} onChange={e => setForm({ ...form, client_donneur: e.target.value })} />
              <datalist id="client-list">{suggestions?.clients?.map(c => <option key={c} value={c} />)}</datalist>
            </div>
          </div>

          {/* Destinataire (celui qui reçoit le colis) */}
          <div style={{ background: '#0c4a6e', borderRadius: 10, padding: 12, marginBottom: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
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

          {/* Livreur et date */}
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

          {/* Mode de paiement */}
          <div>
            <label style={lbl()}>💳 Mode de paiement</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {Object.entries(PAIE_MODES).map(([k, v]) => (
                <button key={k} onClick={() => setForm({ ...form, paiement: k })} style={{ padding: '10px 8px', border: '2px solid ' + (form.paiement === k ? COLORS.blue : COLORS.border2), borderRadius: 9, background: form.paiement === k ? '#1e3a5f' : COLORS.bg, color: form.paiement === k ? '#60a5fa' : COLORS.subtle, cursor: 'pointer', fontSize: 12, fontWeight: 600, textAlign: 'center' }}>
                  <div style={{ fontSize: 18 }}>{v.icon}</div>
                  <div style={{ fontSize: 11, marginTop: 2 }}>{v.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Frais livreur */}
          <div>
            <label style={lbl()}>🚚 Frais de livraison (Ar)</label>
            <input type="number" style={inp()} placeholder="3000" value={form.frais} onChange={e => setForm({ ...form, frais: e.target.value })} />
          </div>

          {/* Statut */}
          <div>
            <label style={lbl()}>📊 Statut</label>
            <select style={inp()} value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
              {Object.entries(STATUTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

        </div>
        <button style={{ ...btn(COLORS.blue, '#2563eb'), width: '100%', padding: 14, fontSize: 15 }} onClick={handleSubmit}>✅ Enregistrer la livraison</button>
      </div>
    </div>
  );
};