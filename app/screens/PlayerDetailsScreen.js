import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, ScrollView } from 'react-native';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { getPlayers, getMatches } from '../api/storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Fonts, Spacing } from '../constants';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

const PlayerDetailsScreen = () => {
  const route = useRoute();
  const { playerId } = route.params;
  const [playerDetails, setPlayerDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const { t } = useTranslation();

  // Corrected useFocusEffect
   useFocusEffect(
     useCallback(() => {
       const fetchPlayerDetails = async () => {
         if (!playerId) {
           console.log('No playerId provided');
           return;
         }
         
         console.log('Fetching details for player:', playerId);
         setLoading(true);
         
         try {
           const allPlayers = await getPlayers();
           const currentPlayer = allPlayers.find(p => p.id === playerId);
           
           if (!currentPlayer) {
             console.error('Player not found:', playerId);
             return;
           }
           
           const allMatches = await getMatches();
           console.log('All matches:', allMatches.length);
           
           // Usar exactamente la misma lógica que ScoreboardScreen
           const pastMatches = allMatches.filter(m => m.played);
           console.log('Past matches:', pastMatches.length);

           let goals = 0;
           let assists = 0;
           let yellowCards = 0;
           let redCards = 0;
           let cagadas = 0;
           let matchesPlayed = 0; // Contador correcto

           pastMatches.forEach(match => {
             // Solo contar partidos donde el jugador estuvo apuntado
             if (match.attending && match.attending.includes(playerId)) {
               matchesPlayed++; // Incrementar solo si estaba apuntado
               const playerStat = match.stats?.find(s => s.playerId === playerId);
               if (playerStat) {
                 console.log('Found stats for match:', match.id, playerStat);
                 goals += Number(playerStat.goals) || 0;
                 assists += Number(playerStat.assists) || 0;
                 yellowCards += Number(playerStat.yellowCards) || 0;
                 redCards += Number(playerStat.redCards) || 0;
                 cagadas += Number(playerStat.cagadas) || 0;
               }
             }
           });

           // Calcular puntos MVP con el nuevo sistema
           const mvpPoints = (goals * 3) + (assists * 2) + (cagadas * -1);

           console.log('Final stats:', { goals, assists, yellowCards, redCards, cagadas, mvpPoints, matchesPlayed });

           setPlayerDetails({
             ...currentPlayer,
             matchesPlayed, // Usar el contador correcto
             goals,
             assists,
             yellowCards,
             redCards,
             cagadas,
             mvpPoints,
           });

         } catch (err) {
           console.error('Error fetching player details:', err);
         } finally {
           setLoading(false);
         }
       };

       fetchPlayerDetails();
     }, [playerId])
   );

  if (loading) {
    return <ActivityIndicator style={styles.center} size="large" color={theme.primary} />;
  }

  if (!playerDetails) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.textPrimary }}>{t('alerts.dataLoadError')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <Image source={{ uri: playerDetails.photo }} style={[styles.avatar, { backgroundColor: theme.primary, borderColor: theme.surface }]} />
          <Text style={[styles.playerName, { color: theme.textPrimary }]}>{playerDetails.name}</Text>
          <Text style={[styles.playerPosition, { color: theme.textSecondary }]}>{t(`positions.${playerDetails.position.toLowerCase()}`, playerDetails.position)}</Text>
        </View>
        <View style={styles.statsGrid}>
          <StatBox icon="trophy" label={t('playerDetails.mvpPoints', 'Puntos MVP')} value={playerDetails.mvpPoints} color={theme.primary} />
          <StatBox icon="shirt" label={t('playerDetails.matchesPlayed')} value={playerDetails.matchesPlayed} color="#9b59b6" />
          <StatBox icon="football" label={t('common.goals')} value={playerDetails.goals} color="#3498db" />
          <StatBox icon="star" label={t('common.assists')} value={playerDetails.assists} color="#2ecc71" />
          <StatBox icon="albums" label={t('common.yellowCards')} value={playerDetails.yellowCards} color="#f1c40f" />
          <StatBox icon="albums" label={t('common.redCards')} value={playerDetails.redCards} color="#e74c3c" />
          <StatBox icon="thumbs-down" label={t('common.cagadas')} value={playerDetails.cagadas} color="#95a5a6" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const StatBox = ({ icon, label, value, color }) => {
    const { theme } = useTheme();
    return (
      <View style={[styles.statBox, { backgroundColor: theme.surface, shadowColor: theme.textPrimary }]}>
        <Ionicons name={icon} size={40} color={color} />
        <Text style={[styles.statValue, { color: theme.textPrimary }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
      </View>
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
  header: {
    padding: Spacing.xl,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: Spacing.md,
    borderWidth: 3,
},
avatarLetter: {
    fontFamily: Fonts.family.bold,
    fontSize: 50,
},
  playerName: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.xxl,
  },
  playerPosition: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.lg,
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
    borderRadius: 12,
    padding: Spacing.lg,
    margin: '2.5%',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  statValue: {
    fontFamily: Fonts.family.bold,
    fontSize: 36,
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.sm,
    marginTop: Spacing.xs,
  },
});

export default PlayerDetailsScreen;
