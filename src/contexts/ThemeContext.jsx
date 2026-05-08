import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Récupérer le thème sauvegardé dans localStorage ou utiliser 'dark' par défaut
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('aterinay_theme');
    return savedTheme || 'dark';
  });

  // Appliquer le thème au document
  useEffect(() => {
    localStorage.setItem('aterinay_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Fonction pour basculer entre les thèmes
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  // Fonction pour définir un thème spécifique
  const setThemeMode = (mode) => {
    if (mode === 'dark' || mode === 'light') {
      setTheme(mode);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};