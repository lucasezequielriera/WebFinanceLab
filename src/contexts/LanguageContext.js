import React, { createContext, useState, useContext } from 'react';

const LanguageContext = createContext();

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageProvider({ children }) {
  const [selectedLanguage, setSelectedLanguage] = useState('en');

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