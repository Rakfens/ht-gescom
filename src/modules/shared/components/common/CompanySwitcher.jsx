// src/modules/shared/components/common/CompanySwitcher.jsx
import { useState } from 'react';
import { useCompany } from '../../context/CompanyContext';

export const CompanySwitcher = () => {
  const { currentCompany, companies, switchCompany } = useCompany();
  const [isOpen, setIsOpen] = useState(false);

  if (!companies || companies.length <= 1) {
    return null;
  }

  const handleSwitchCompany = (company) => {
    switchCompany(company);  // Utiliser switchCompany au lieu de setCurrentCompany
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          cursor: 'pointer',
          color: 'var(--text)'
        }}
      >
        <span>🏢</span>
        <span>{currentCompany?.name || 'Société'}</span>
        <span>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '4px',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            minWidth: '200px',
            zIndex: 1000,
            overflow: 'hidden'
          }}
        >
          {companies.map(company => (
            <button
              key={company.id}
              onClick={() => handleSwitchCompany(company)}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                textAlign: 'left',
                background: currentCompany?.id === company.id ? 'var(--bg)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text)',
                fontWeight: currentCompany?.id === company.id ? 'bold' : 'normal'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg)';
              }}
              onMouseLeave={(e) => {
                if (currentCompany?.id !== company.id) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {company.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};