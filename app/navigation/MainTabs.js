import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import ScheduleScreen from '../screens/ScheduleScreen';
import ScoreboardScreen from '../screens/ScoreboardScreen';
import BettingScreen from '../screens/BettingScreen';
import LineupScreen from '../screens/LineupScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { Colors, Fonts, Spacing } from '../constants';

const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 90,
          paddingTop: Spacing.sm,
          paddingBottom: Spacing.lg,
        },
        tabBarLabelStyle: {
          fontFamily: Fonts.family.medium,
          fontSize: Fonts.size.xs,
          marginTop: Spacing.xs,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          const iconSize = focused ? 30 : 26;

          if (route.name === 'Calendario') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Estadisticas') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Apuestas') {
            iconName = focused ? 'cash' : 'cash-outline';
          } else if (route.name === 'Alineación') {
            iconName = focused ? 'shirt' : 'shirt-outline';
          } else if (route.name === 'Perfil') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          }

          return <Ionicons name={iconName} size={iconSize} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Calendario" component={ScheduleScreen} />
      <Tab.Screen name="Estadisticas" component={ScoreboardScreen} />
      <Tab.Screen name="Apuestas" component={BettingScreen} />
      <Tab.Screen name="Alineación" component={LineupScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default MainTabs;
