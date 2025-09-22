import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPlayers, getMatches } from '../api/storage';
import { Colors, Fonts, Spacing } from '../constants';
import { Ionicons } from '@expo/vector-icons';

const BettingScreen = () => {
  const navigation = useNavigation();
  const [player, setPlayer] = useState(null);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        if (upcomingMatches.length === 0) {
            setLoading(true);
        }
        try {
          const playerId = await AsyncStorage.getItem('selectedPlayerId');
          const players = await getPlayers();
          const currentPlayer = players.find(p => p.id === playerId);
          setPlayer(currentPlayer);

          const allMatches = await getMatches();
          const futureMatches = allMatches
            .filter(m => !m.played && new Date(m.date) > new Date())
            .sort((a, b) => new Date(a.date) - new Date(b.date));
          setUpcomingMatches(futureMatches);
        } catch (e) {
          console.error('Failed to load betting data.', e);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }, [])
  );

  if (loading) {
    return <ActivityIndicator style={styles.center} size="large" color={Colors.primary} />;
  }

  const renderMatchItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.matchCard}
      onPress={() => navigation.navigate('MakeBet', { matchId: item.id })}
    >
      <Text style={styles.matchEmoji}>{item.emoji || '⚽️'}</Text>
      <View style={styles.matchInfo}>
        <Text style={styles.matchOpponent}>{item.opponent}</Text>
        <Text style={styles.matchDate}>
            {new Date(item.date).toLocaleDateString('es-ES', {weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'})}h
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={Fonts.size.lg} color={Colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Apostar</Text>
        {player && (
            <View style={styles.walletContainer}>
                <Ionicons name="cash" size={Fonts.size.lg} color={Colors.primary} />
                <Text style={styles.coinText}>{player.coins} Monedas</Text>
            </View>
        )}
      </View>

        <TouchableOpacity 
            style={styles.myBetsButton}
            onPress={() => navigation.navigate('MyBets')}
        >
            <Ionicons name="list" size={Fonts.size.lg} color={Colors.primary} />
            <Text style={styles.myBetsText}>Ver Mis Apuestas</Text>
        </TouchableOpacity>

        <TouchableOpacity 
            style={styles.myBetsButton}
            onPress={() => navigation.navigate('PvPBetScreen')}
        >
            <Ionicons name="people" size={Fonts.size.lg} color={Colors.primary} />
            <Text style={styles.myBetsText}>Ver Apuestas JcJ Abiertas</Text>
        </TouchableOpacity>

      <FlatList
        data={upcomingMatches}
        keyExtractor={(item) => item.id}
        renderItem={renderMatchItem}
        ListHeaderComponent={<Text style={styles.listHeader}>Próximos Partidos para Apostar</Text>}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay partidos disponibles para apostar.</Text>}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
    color: Colors.textPrimary,
  },
  walletContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.surface,
      padding: Spacing.sm,
      borderRadius: 8,
  },
  coinText: {
      fontFamily: Fonts.family.bold,
      fontSize: Fonts.size.md,
      color: Colors.primary,
      marginLeft: Spacing.sm,
  },
  myBetsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.surface,
      padding: Spacing.md,
      borderRadius: 8,
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.md,
  },
  myBetsText: {
      fontFamily: Fonts.family.bold,
      fontSize: Fonts.size.md,
      color: Colors.primary,
      marginLeft: Spacing.sm,
  },
  listHeader: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.lg,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  listContent: {
      paddingBottom: Spacing.lg,
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 8,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  matchEmoji: {
    fontSize: Fonts.size.xl,
    marginRight: Spacing.md,
  },
  matchInfo: {
      flex: 1,
  },
  matchOpponent: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.md,
    color: Colors.textPrimary,
  },
  matchDate: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.lg,
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.md,
    color: Colors.textSecondary,
  },
});

export default BettingScreen;
