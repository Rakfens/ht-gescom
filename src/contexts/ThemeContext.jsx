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
  // Récupérer le thème sauvegardé ou utiliser 'dark' par défaut
  const [theme, setTheme] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('aterinay_theme');
      return savedTheme === 'light' ? 'light' : 'dark';
    } catch (e) {
      return 'dark';
    }
  });

  // Appliquer le thème au document
  useEffect(() => {
    try {
      localStorage.setItem('aterinay_theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
      console.log('Thème appliqué:', theme); // Pour vérifier dans la console
    } catch (e) {
      console.error('Erreur thème:', e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

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