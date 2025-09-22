import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Platform, UIManager, LayoutAnimation } from 'react-native';

import AppNavigator from './navigation/AppNavigator';
import { initializeData } from './api/storage';
import useCachedResources from './hooks/useCachedResources';

export default function App() {
  const isLoadingComplete = useCachedResources();

  useEffect(() => {
    initializeData();

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
}
