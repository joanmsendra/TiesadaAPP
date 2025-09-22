import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, ScrollView } from 'react-native';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { getPlayers, getMatches } from '../api/storage';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing } from '../constants';
import { Image } from 'expo-image';

const PlayerDetailsScreen = () => {
  const route = useRoute();
  const { playerId } = route.params;
  const [playerDetails, setPlayerDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  // Corrected useFocusEffect
  useFocusEffect(
    useCallback(() => {
      const loadPlayerDetails = async () => {
        setLoading(true);
        try {
          const players = await getPlayers();
          const matches = await getMatches();
          const player = players.find(p => p.id === playerId);
          
          if (player) {
            const pastMatches = matches.filter(m => m.played);
            let goals = 0;
            let assists = 0;
            let yellowCards = 0;
            let redCards = 0;
    
            pastMatches.forEach(match => {
              const stat = match.stats?.find(s => s.playerId === playerId);
              if (stat) {
                goals += stat.goals;
                assists += stat.assists;
                yellowCards += stat.yellowCards;
                redCards += stat.redCards;
              }
            });
            
            setPlayerDetails({ ...player, goals, assists, yellowCards, redCards });
          }
        } catch (e) {
          console.error("Failed to load player details", e);
        } finally {
          setLoading(false);
        }
      };
      loadPlayerDetails();
    }, [playerId])
  );

  if (loading) {
    return <ActivityIndicator style={styles.center} size="large" color={Colors.primary} />;
  }

  if (!playerDetails) {
    return (
      <View style={styles.center}>
        <Text>No se pudo cargar la información del jugador.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
            <Image source={{ uri: playerDetails.photo }} style={styles.avatar} />
          <Text style={styles.playerName}>{playerDetails.name}</Text>
          <Text style={styles.playerPosition}>{playerDetails.position}</Text>
        </View>
        <View style={styles.statsGrid}>
          <StatBox icon="football" label="Goles" value={playerDetails.goals} color="#3498db" />
          <StatBox icon="star" label="Asistencias" value={playerDetails.assists} color="#2ecc71" />
          <StatBox icon="albums" label="T. Amarillas" value={playerDetails.yellowCards} color="#f1c40f" />
          <StatBox icon="albums" label="T. Rojas" value={playerDetails.redCards} color="#e74c3c" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const StatBox = ({ icon, label, value, color }) => (
  <View style={styles.statBox}>
    <Ionicons name={icon} size={40} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

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
  header: {
    padding: Spacing.xl,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    marginBottom: Spacing.md,
    borderWidth: 3,
    borderColor: Colors.surface,
},
avatarLetter: {
    fontFamily: Fonts.family.bold,
    fontSize: 50,
    color: Colors.surface,
},
  playerName: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.xxl,
    color: Colors.textPrimary,
  },
  playerPosition: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.lg,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: Spacing.sm,
  },
  statBox: {
    width: '45%',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.lg,
    margin: '2.5%',
    alignItems: 'center',
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  statValue: {
    fontFamily: Fonts.family.bold,
    fontSize: 36,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});

export default PlayerDetailsScreen;
