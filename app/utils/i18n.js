import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Importar las traducciones
import ca from '../locales/ca.json';
import es from '../locales/es.json';

const LANGUAGE_DETECTOR = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      // Intentar obtener el idioma guardado del usuario
      const savedLanguage = await AsyncStorage.getItem('user-language');
      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }
      // Si no hay idioma guardado, usar catalán por defecto
      callback('ca');
    } catch (error) {
      console.error('Error detecting language:', error);
      callback('ca'); // Fallback al catalán
    }
  },
  cacheUserLanguage: async (language) => {
    try {
      await AsyncStorage.setItem('user-language', language);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  }
};

i18n
  .use(LANGUAGE_DETECTOR)
  .use(initReactI18next)
  .init({
    resources: {
      ca: { translation: ca },
      es: { translation: es }
    },
    fallbackLng: 'ca', // Catalán como idioma por defecto
    debug: false,
    interpolation: {
      escapeValue: false, // React ya escapa por defecto
    },
    react: {
      useSuspense: false, // Evitar problemas con AsyncStorage
    }
  });

export default i18n;

