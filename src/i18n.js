import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEN from './locales/en/translation.json';
import translationES from './locales/es/translation.json';
import landingEN from './locales/en/landing.json';
import landingES from './locales/es/landing.json';
import authEN from './locales/en/auth.json';
import authES from './locales/es/auth.json';
import legalEN from './locales/en/legal.json';
import legalES from './locales/es/legal.json';

const resources = {
  en: {
    translation: translationEN,
    landing: landingEN,
    auth: authEN,
    legal: legalEN
  },
  es: {
    translation: translationES,
    landing: landingES,
    auth: authES,
    legal: legalES
  }
};

// Obtener el idioma guardado en localStorage o usar 'en' como fallback
const savedLanguage = localStorage.getItem('language') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
