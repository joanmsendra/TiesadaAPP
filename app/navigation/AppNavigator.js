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

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="PlayerSelection">
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
        options={{ title: 'Detalles del Partido' }} 
      />
      <Stack.Screen 
        name="AddEditMatch" 
        component={AddEditMatchScreen} 
        options={{ title: 'Gestionar Partido' }} 
      />
      <Stack.Screen 
        name="PlayerDetails" 
        component={PlayerDetailsScreen} 
        options={{ title: 'Detalles del Jugador' }} 
      />
       <Stack.Screen 
        name="MakeBet" 
        component={MakeBetScreen} 
        options={{ title: 'Hacer Apuesta' }} 
      />
       <Stack.Screen 
        name="MyBets" 
        component={MyBetsScreen} 
        options={{ title: 'Mis Apuestas' }} 
      />
       <Stack.Screen 
        name="PvPBetScreen" 
        component={PvPBetScreen} 
        options={{ title: 'Apuestas JcJ Abiertas' }} 
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
