import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getMatches, getPlayers } from '../api/storage';
import PlayerStatsCard from '../components/PlayerStatsCard';
import { Colors, Fonts, Spacing } from '../constants';

const ScoreboardScreen = () => {
  const [playerStats, setPlayerStats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Corrected useFocusEffect
  useFocusEffect(
    useCallback(() => {
      const calculateStats = async () => {
        if (playerStats.length === 0) {
            setLoading(true);
        }
        try {
          const matches = await getMatches();
          const players = await getPlayers();
          const pastMatches = matches.filter(m => m.played);

          const stats = players.map(player => {
            let goals = 0;
            let assists = 0;
            let yellowCards = 0;
            let redCards = 0;

            pastMatches.forEach(match => {
              const playerStat = match.stats?.find(s => s.playerId === player.id);
              if (playerStat) {
                goals += playerStat.goals;
                assists += playerStat.assists;
                yellowCards += playerStat.yellowCards;
                redCards += playerStat.redCards;
              }
            });

            return {
              ...player,
              goals,
              assists,
              yellowCards,
              redCards,
              mvpScore: goals * 2 + assists,
            };
          });

          stats.sort((a, b) => b.mvpScore - a.mvpScore);
          setPlayerStats(stats);
        } catch (e) {
          console.error('Failed to calculate stats.', e);
        } finally {
          setLoading(false);
        }
      };
      calculateStats();
    }, [])
  );

  if (loading) {
    return <ActivityIndicator style={styles.center} size="large" color={Colors.primary} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={playerStats}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <PlayerStatsCard player={item} rank={index + 1} />}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Estadísticas</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    color: Colors.textPrimary,
  },
  listContent: {
    paddingBottom: Spacing.lg,
  }
});

export default ScoreboardScreen;
