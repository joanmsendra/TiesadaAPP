import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Platform, UIManager } from 'react-native';

import { ThemeProvider } from './context/ThemeContext';
import AppNavigator from './navigation/AppNavigator';
import { initializeData } from './api/supabase';
import useCachedResources from './hooks/useCachedResources';
import './utils/i18n'; // Inicializar i18n

// Componente principal que envuelve toda la lógica de la app
const AppContent = () => {
  const isLoadingComplete = useCachedResources();

  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('Iniciando aplicación...');
        const success = await initializeData();
        if (!success) {
          console.warn('Hubo problemas inicializando la aplicación, pero continuando...');
        }
      } catch (error) {
        console.error('Error crítico en la inicialización:', error);
      }
    };

    initApp();

    if (Platform.OS === 'android') {
      if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      }
    }
  }, []);

  if (!isLoadingComplete) {
    return null; // Muestra la splash screen nativa mientras carga
  } else {
    return (
      <>
        <StatusBar style="auto" />
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </>
    );
  }
};


// Componente raíz que solo provee el tema
export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
