import React, { createContext, useState, useContext, useEffect } from 'react';
import i18n from '../i18n';

const LanguageContext = createContext();

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageProvider({ children }) {
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    // Intentar recuperar el idioma del localStorage
    const savedLanguage = localStorage.getItem('language');
    // Si existe un idioma guardado, usarlo; si no, usar el idioma actual de i18n
    return savedLanguage || i18n.language;
  });

  // Efecto para actualizar i18n cuando cambia el idioma seleccionado
  useEffect(() => {
    i18n.changeLanguage(selectedLanguage);
    localStorage.setItem('language', selectedLanguage);
  }, [selectedLanguage]);

  const value = {
    selectedLanguage,
    setSelectedLanguage
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
} 