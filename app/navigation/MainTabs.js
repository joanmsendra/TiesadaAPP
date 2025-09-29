import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext'; // Importar el hook del tema
import { useTranslation } from 'react-i18next';

import ScheduleScreen from '../screens/ScheduleScreen';
import ScoreboardScreen from '../screens/ScoreboardScreen';
import BettingScreen from '../screens/BettingScreen';
import LineupScreen from '../screens/LineupScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { Fonts, Spacing } from '../constants';

const Tab = createBottomTabNavigator();

const MainTabs = () => {
  const { theme } = useTheme(); // Usar el tema
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopWidth: 1,
          borderTopColor: theme.border,
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

          if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Statistics') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Betting') {
            iconName = focused ? 'cash' : 'cash-outline';
          } else if (route.name === 'Lineup') {
            iconName = focused ? 'shirt' : 'shirt-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          }

          return <Ionicons name={iconName} size={iconSize} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Calendar" 
        component={ScheduleScreen} 
        options={{ title: t('navigation.calendar') }}
      />
      <Tab.Screen 
        name="Statistics" 
        component={ScoreboardScreen} 
        options={{ title: t('navigation.statistics') }}
      />
      <Tab.Screen 
        name="Betting" 
        component={BettingScreen} 
        options={{ title: t('navigation.betting') }}
      />
      <Tab.Screen 
        name="Lineup" 
        component={LineupScreen} 
        options={{ title: t('navigation.lineup') }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: t('navigation.profile', 'Perfil') }}
      />
    </Tab.Navigator>
  );
};

export default MainTabs;
