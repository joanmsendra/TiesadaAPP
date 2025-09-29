import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SectionList, ActivityIndicator, SafeAreaView, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRealtimeMatches } from '../hooks/useRealtimeData';
import MatchCard from '../components/MatchCard';
import FadeInView from '../components/FadeInView';
import { useTheme } from '../context/ThemeContext';
import { Fonts, Spacing } from '../constants';
import { useTranslation } from 'react-i18next';

const ScheduleScreen = () => {
  const navigation = useNavigation();
  const [currentUserId, setCurrentUserId] = useState(null);
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Usar hook de tiempo real para partidos
  const { data: matches, loading, error, refetch } = useRealtimeMatches();
  
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    if (refetch) {
      await refetch();
    }
    setIsRefreshing(false);
  }, [refetch]);

  // Cargar ID del usuario actual y refrescar datos al enfocar
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const userId = await AsyncStorage.getItem('selectedPlayerId');
          setCurrentUserId(userId);
          
          // Refrescar datos cuando volvemos a la pantalla
          // Esto asegura que vemos los cambios más recientes
          if (refetch) {
            refetch();
          }
        } catch (e) {
          console.error('Failed to load data.', e);
        }
      };
      loadData();
    }, [refetch])
  );

  // No vaciar la lista mientras se recarga para evitar parpadeos
  const upcomingMatches = matches.filter(m => !m.played);
  const pastMatches = matches.filter(m => m.played).reverse();

  const sections = [
    { title: t('schedule.upcoming'), data: upcomingMatches },
    { title: t('schedule.played'), data: pastMatches },
  ].filter(s => s.data.length > 0);

  // Mostrar cargando solo en la primera carga
  if (loading && matches.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>{t('schedule.title')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AddEditMatch')}>
            <Ionicons name="add-circle" size={36} color={theme.primary} />
          </TouchableOpacity>
        </View>
        <ActivityIndicator style={styles.center} size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{t('schedule.title')}</Text>
        <View style={styles.headerRight}>
          {error && (
            <Ionicons 
              name="cloud-offline-outline" 
              size={24} 
              color={theme.error} 
              style={styles.connectionIcon} 
            />
          )}
          <TouchableOpacity onPress={() => navigation.navigate('AddEditMatch')}>
            <Ionicons name="add-circle" size={36} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <FadeInView delay={index * 100}>
            <MatchCard match={item} currentUserId={currentUserId} />
          </FadeInView>
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={[styles.sectionHeader, { color: theme.textSecondary, backgroundColor: theme.background }]}>{title}</Text>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{t('schedule.noMatches')}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.xxl,
  },
  sectionHeader: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  listContent: {
    paddingBottom: Spacing.lg,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionIcon: {
    marginRight: Spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing.xxl * 3,
  },
  emptyText: {
    fontFamily: Fonts.family.medium,
    fontSize: Fonts.size.lg,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});

export default ScheduleScreen;
