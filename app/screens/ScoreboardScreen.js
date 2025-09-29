import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRealtimePlayers, useRealtimeMatches } from '../hooks/useRealtimeData';
import PlayerStatsCard from '../components/PlayerStatsCard';
import FadeInView from '../components/FadeInView';
import { useTheme } from '../context/ThemeContext';
import { Fonts, Spacing } from '../constants';
import { useTranslation } from 'react-i18next';

const ScoreboardScreen = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  // Usar hooks de tiempo real
  const { data: players, loading: playersLoading, refetch: refetchPlayers } = useRealtimePlayers();
  const { data: matches, loading: matchesLoading, refetch: refetchMatches } = useRealtimeMatches();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const loading = (playersLoading || matchesLoading) && !isRefreshing;

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([refetchPlayers(), refetchMatches()]);
    setIsRefreshing(false);
  }, [refetchPlayers, refetchMatches]);

  // Calcular estadísticas usando useMemo para optimizar rendimiento
  const playerStats = useMemo(() => {
    if (!players.length || !matches.length) return [];
    
    const playedMatches = matches.filter(m => m.played);
    if (__DEV__) {
      console.log('📊 Total matches:', matches.length, 'Played matches:', playedMatches.length);
    }
    
    const stats = players.map(player => {
      let goals = 0;
      let assists = 0;
      let yellowCards = 0;
      let redCards = 0;
      let cagadas = 0;
      let matchesPlayed = 0;

      playedMatches.forEach(match => {
        if (match.attending && match.attending.includes(player.id)) {
          matchesPlayed++;
          const playerStat = match.stats?.find(s => s.playerId === player.id);
          if (playerStat) {
            goals += Number(playerStat.goals) || 0;
            assists += Number(playerStat.assists) || 0;
            yellowCards += Number(playerStat.yellowCards) || 0;
            redCards += Number(playerStat.redCards) || 0;
            cagadas += Number(playerStat.cagadas) || 0;
          }
        }
      });

      return {
        ...player,
        goals,
        assists,
        yellowCards,
        redCards,
        cagadas,
        matchesPlayed,
        mvpScore: (goals * 3) + (assists * 2) + (cagadas * -1),
      };
    });

    // Ordenar por MVP score
    return stats.sort((a, b) => b.mvpScore - a.mvpScore);
  }, [players, matches]);

  const renderHeader = () => (
      <View style={styles.headerRow}>
          <Text style={[styles.headerText, { flex: 3 }]}>Jugador</Text>
          <Text style={styles.headerText}>PJ</Text>
          <Text style={styles.headerText}>GL</Text>
          <Text style={styles.headerText}>AS</Text>
          <Text style={styles.headerText}>TA</Text>
          <Text style={styles.headerText}>TR</Text>
          <Text style={styles.headerText}>CG</Text>
      </View>
  );

  // Mostrar indicador de carga solo en la primera carga
  if (loading && playerStats.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>{t('scoreboard.title')}</Text>
        </View>
        <ActivityIndicator style={styles.center} size="large" color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={playerStats}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <FadeInView delay={index * 80}>
            <PlayerStatsCard player={item} rank={index + 1} />
          </FadeInView>
        )}
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>{t('scoreboard.title')}</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{t('scoreboard.noStats')}</Text>
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
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.xxl,
  },
  listContent: {
    paddingBottom: Spacing.lg,
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
    textAlign: 'center',
  },
});

export default ScoreboardScreen;
