import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import PlayerSelectionScreen from '../screens/PlayerSelectionScreen';
import MatchDetailsScreen from '../screens/MatchDetailsScreen';
import AddEditMatchScreen from '../screens/AddEditMatchScreen';
import PlayerDetailsScreen from '../screens/PlayerDetailsScreen';
import MakeBetScreen from '../screens/MakeBetScreen';
import MyBetsScreen from '../screens/MyBetsScreen';
import PvPBetScreen from '../screens/PvPBetScreen';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    const { theme } = useTheme();
    const { t } = useTranslation();
  return (
    <Stack.Navigator 
        initialRouteName="PlayerSelection"
        screenOptions={{
            headerStyle: {
                backgroundColor: theme.surface,
            },
            headerTintColor: theme.textPrimary,
            headerTitleStyle: {
                fontFamily: 'Poppins-Bold',
            },
            contentStyle: {
                backgroundColor: theme.background,
            }
        }}
    >
      <Stack.Screen 
        name="PlayerSelection" 
        component={PlayerSelectionScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Main" 
        component={MainTabs} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="MatchDetails" 
        component={MatchDetailsScreen} 
        options={{ title: t('navigation.matchDetails', 'Detalles del Partido') }} 
      />
      <Stack.Screen 
        name="AddEditMatch" 
        component={AddEditMatchScreen} 
        options={{ title: t('navigation.manageMatch', 'Gestionar Partido') }} 
      />
      <Stack.Screen 
        name="PlayerDetails" 
        component={PlayerDetailsScreen} 
        options={{ title: t('navigation.playerDetails', 'Detalles del Jugador') }} 
      />
       <Stack.Screen 
        name="MakeBet" 
        component={MakeBetScreen} 
        options={{ title: t('navigation.makeBet', 'Hacer Apuesta') }} 
      />
       <Stack.Screen 
        name="MyBets" 
        component={MyBetsScreen} 
        options={{ title: t('navigation.myBets', 'Mis Apuestas') }} 
      />
       <Stack.Screen 
        name="PvPBetScreen" 
        component={PvPBetScreen} 
        options={{ title: t('navigation.pvpBets', 'Apuestas JcJ Abiertas') }} 
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
