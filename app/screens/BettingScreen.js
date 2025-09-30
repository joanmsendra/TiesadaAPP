import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRealtimePlayers, useRealtimeMatches, useRealtimePlayerBets } from '../hooks/useRealtimeData';
import FadeInView from '../components/FadeInView';
import { useTheme } from '../context/ThemeContext';
import { Fonts, Spacing } from '../constants';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { supabase } from '../api/supabase';

const BettingScreen = () => {
  const navigation = useNavigation();
  const [player, setPlayer] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  
  // Usar hooks de tiempo real
  const { data: players } = useRealtimePlayers();
  const { data: matches, loading, refetch: refetchMatches } = useRealtimeMatches();
  // Forzar la actualización cuando las apuestas del jugador cambien
  useRealtimePlayerBets(playerId);

  // Calcular partidos futuros usando useMemo
  const upcomingMatches = useMemo(() => {
    if (!matches.length) return [];
    
    // Mostrar solo partidos que no se han jugado, ordenados por fecha más cercana
    return matches
      .filter(m => !m.played)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [matches]);

  // Cargar jugador actual (siempre desde DB para saldo fresco)
  useFocusEffect(
    useCallback(() => {
      const loadPlayer = async () => {
        try {
          const id = await AsyncStorage.getItem('selectedPlayerId');
          setPlayerId(id);
          if (id) {
            const { data, error } = await supabase
              .from('players')
              .select('*')
              .eq('id', id)
              .single();
            if (!error && data) {
              setPlayer(data);
            }
          }
        } catch (e) {
          console.error('Failed to load player data.', e);
        }
      };
      loadPlayer();
    }, [])
  );

  // Suscripción en tiempo real al jugador actual para actualizar coins al vuelo
  React.useEffect(() => {
    if (!playerId) return;
    const channel = supabase
      .channel(`realtime-player-${playerId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `id=eq.${playerId}` },
        (payload) => {
          const latest = payload.new;
          if (latest) setPlayer(latest);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [playerId]);

  // Removed loading check - we'll use fade-in instead

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      const id = await AsyncStorage.getItem('selectedPlayerId');
      if (id) {
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .eq('id', id)
          .single();
        if (!error && data) {
          setPlayer(data);
        }
      }
      // Refrescar lista de partidos
      refetchMatches();
    } catch (e) {
      console.error('Failed to refresh player coins', e);
    } finally {
      setRefreshing(false);
    }
  }, [refetchMatches]);

  const renderMatchItem = ({ item, index }) => (
    <FadeInView delay={index * 100}>
      <TouchableOpacity 
        style={[styles.matchCard, { backgroundColor: theme.surface }]}
        onPress={() => navigation.navigate('MakeBet', { matchId: item.id })}
      >
        <Text style={styles.matchEmoji}>{item.emoji || '⚽️'}</Text>
        <View style={styles.matchInfo}>
          <Text style={[styles.matchOpponent, { color: theme.textPrimary }]}>{item.opponent}</Text>
          <Text style={[styles.matchDate, { color: theme.textSecondary }]}>
              {new Date(item.date).toLocaleDateString('es-ES', {weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'})}h
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={Fonts.size.lg} color={theme.textSecondary} />
      </TouchableOpacity>
    </FadeInView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{t('betting.title')}</Text>
        {player && (
            <View style={[styles.walletContainer, { backgroundColor: theme.surface }]}>
                <Ionicons name="cash" size={Fonts.size.lg} color={theme.primary} />
                <Text style={[styles.coinText, { color: theme.primary }]}>{player.coins} {t('common.coins')}</Text>
            </View>
        )}
      </View>

        <TouchableOpacity 
            style={[styles.myBetsButton, { backgroundColor: theme.surface }]}
            onPress={() => navigation.navigate('MyBets')}
        >
            <Ionicons name="list" size={Fonts.size.lg} color={theme.primary} />
            <Text style={[styles.myBetsText, { color: theme.primary }]}>{t('betting.myBets')}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
            style={[styles.myBetsButton, { backgroundColor: theme.surface }]}
            onPress={() => navigation.navigate('PvPBetScreen')}
        >
            <Ionicons name="people" size={Fonts.size.lg} color={theme.primary} />
            <Text style={[styles.myBetsText, { color: theme.primary }]}>{t('betting.pvpBets')}</Text>
        </TouchableOpacity>

      <FlatList
        data={upcomingMatches}
        keyExtractor={(item) => item.id}
        renderItem={renderMatchItem}
        ListHeaderComponent={<Text style={[styles.listHeader, { color: theme.textSecondary }]}>{t('betting.upcomingMatches')}</Text>}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.textSecondary }]}>{t('betting.noMatches')}</Text>}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  walletContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.sm,
      borderRadius: 8,
  },
  coinText: {
      fontFamily: Fonts.family.bold,
      fontSize: Fonts.size.md,
      marginLeft: Spacing.sm,
  },
  myBetsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.md,
      borderRadius: 8,
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.md,
  },
  myBetsText: {
      fontFamily: Fonts.family.bold,
      fontSize: Fonts.size.md,
      marginLeft: Spacing.sm,
  },
  listHeader: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.lg,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  listContent: {
      paddingBottom: Spacing.lg,
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 8,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  matchEmoji: {
    fontSize: Fonts.size.xxl,
    marginRight: Spacing.lg,
  },
  matchInfo: {
      flex: 1,
  },
  matchOpponent: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.lg,
  },
  matchDate: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.sm,
    marginTop: Spacing.xs,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.lg,
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.md,
  },
});

export default BettingScreen;
