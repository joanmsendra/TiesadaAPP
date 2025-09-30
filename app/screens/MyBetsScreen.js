import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, LayoutAnimation } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRealtimePlayerBets, useRealtimePlayers, useRealtimeMatches } from '../hooks/useRealtimeData';
import { getOddsForBet } from '../api/betConstants';
import { useTheme } from '../context/ThemeContext';
import { Fonts, Spacing } from '../constants';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const MyBetsScreen = () => {
  const [player, setPlayer] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const { theme } = useTheme();
  const { t } = useTranslation();
  
  // Usar hooks de tiempo real
  const { data: players } = useRealtimePlayers();
  const { data: matches } = useRealtimeMatches();
  const { data: bets, loading } = useRealtimePlayerBets(playerId);
  
  // Convertir arrays a objetos para facilitar el acceso
  const playersMap = useMemo(() => {
    return players.reduce((acc, player) => {
      acc[player.id] = player;
      return acc;
    }, {});
  }, [players]);
  
  const matchesMap = useMemo(() => {
    return matches.reduce((acc, match) => {
      acc[match.id] = match;
      return acc;
    }, {});
  }, [matches]);

  // Función para obtener el estado de la apuesta desde la perspectiva del jugador
  const getPlayerStatus = (bet, currentUserId) => {
      if (bet.betMode !== 'pvp' || !['won', 'lost', 'void'].includes(bet.status)) {
          return bet.status;
      }
      
      const isProposer = bet.proposerId === currentUserId;
      
      if ((isProposer && bet.status === 'won') || (!isProposer && bet.status === 'lost')) {
          return 'won';
      }
      return 'lost';
  };

  const sortedBets = useMemo(() => {
    const statusOrder = {
      'pending': 1,
      'active': 2,
      'proposed': 3, // JcJ propuestas (casi pendientes) también arriba
      'won': 3,
      'lost': 4,
      'void': 5,
    };

    return [...bets].sort((a, b) => {
      const statusA = getPlayerStatus(a, playerId);
      const statusB = getPlayerStatus(b, playerId);

      // Grupo 0: pendientes/activas. Grupo 1: el resto (proposed, won, lost, void)
      const groupA = (statusA === 'pending' || statusA === 'active') ? 0 : 1;
      const groupB = (statusB === 'pending' || statusB === 'active') ? 0 : 1;
      if (groupA !== groupB) return groupA - groupB;

      // Dentro de cada grupo, ordenar estrictamente por fecha de realización (created_at), más recientes primero
      const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return createdB - createdA;
    });
  }, [bets, matchesMap, playerId]);

  const getBetDescription = (bet, players, matches) => {
      const match = matchesMap[bet.matchId];
      if (!match) {
          return t('myBets.betDetailsNotAvailable', 'Detalls de l\'aposta no disponibles');
      }

      if (bet.type === 'result') {
          const us = bet.details?.us ?? 0;
          const them = bet.details?.them ?? 0;
          // Mostrar claramente el marcador apostado
          return `${t('myBets.resultBet', 'Resultat')}: ${us}-${them} ${t('common.against', 'vs')} ${match.opponent}`;
      }
      if (bet.type === 'player_event') {
          const player = playersMap[bet.details.playerId];
          const eventText = {
              scores: t('myBets.scores', 'marca'),
              assists: t('myBets.assists', 'assisteix'),
              gets_card: t('myBets.getsCard', 'rep targeta'),
              no_card: t('myBets.noCard', 'no rep targeta'),
              cagadas: t('myBets.makesError', 'fa una cagada')
          };
          return `${player?.name || t('common.player')} ${eventText[bet.details.event] || ''} vs ${match.opponent}`;
      }
      if (bet.type === 'custom_pvp') {
          return bet.details.custom_description;
      }
      return t('myBets.betOn', `Aposta a ${match.opponent}`);
  };

  // Cargar ID del jugador al enfocar la pantalla
  useFocusEffect(
    useCallback(() => {
      const loadPlayerId = async () => {
        try {
          const id = await AsyncStorage.getItem('selectedPlayerId');
          setPlayerId(id);
          
          // Buscar el jugador actual
          const currentPlayer = playersMap[id];
          setPlayer(currentPlayer);
        } catch (e) {
          console.error('Failed to load player ID', e);
        }
      };
      loadPlayerId();
    }, [playersMap])
  );

  const getBetStatusStyle = (status) => {
    switch (status) {
        case 'won':
            return { backgroundColor: theme.success, color: theme.surface, text: t('betting.status.won') };
        case 'lost':
            return { backgroundColor: theme.error, color: theme.surface, text: t('betting.status.lost') };
        case 'active':
            return { backgroundColor: '#3498db', color: theme.white, text: t('betting.status.active').toUpperCase() };
        case 'void':
            return { backgroundColor: '#bdc3c7', color: theme.textPrimary, text: t('betting.status.void').toUpperCase() };
        default:
            return { backgroundColor: theme.border, color: theme.textSecondary, text: t('betting.status.pending').toUpperCase() };
    }
};

  const renderBetDetails = (bet) => {
    if (bet.type === 'result') {
      return `Resultado: ${bet.details.us} - ${bet.details.them}`;
    }
    if (bet.type === 'player_event') {
      const playerName = playersMap[bet.details.playerId]?.name || 'Jugador';
      return `${playerName} marcará ${bet.details.goals > 1 ? bet.details.goals : ''} ${bet.details.goals > 1 ? 'o más goles' : 'gol'}`;
    }
    return '';
  };

  const renderBetItem = ({ item }) => {
      // --- DEFENSA CONTRA DATOS CORRUPTOS ---
      const match = matchesMap[item.match_id];
      if (!match || !item.details) {
          console.warn("Saltando apuesta con datos incompletos:", item.id);
          return null; // No renderizar esta apuesta si le faltan datos
      }
      // --- FIN DE LA DEFENSA ---

      const isProposer = item.proposer_id === playerId;

      let odds = 1;
      if (item.type === 'custom_pvp') {
          odds = item.details.custom_odds || 1;
      } else {
          odds = getOddsForBet({ ...item, type: item.type, details: item.details }); // Asegurar que pasamos un objeto válido
      }
      
      const accepterStake = item.bet_mode === 'pvp' ? Math.round(item.amount * odds) : 0;
      
      let risk = 0;
      let potentialProfit = 0;

      if (item.betMode === 'standard') {
          risk = item.amount;
          potentialProfit = Math.round(item.amount * odds);
      } else { // pvp
          if (isProposer) {
              risk = item.amount;
              potentialProfit = accepterStake; // Tu ganas lo que el otro arriesga
          } else { // is accepter
              risk = accepterStake;
              potentialProfit = item.amount; // Tu ganas lo que el otro arriesgó
          }
      }
      
      const playerStatus = getPlayerStatus(item, playerId);
      const finalStatusStyle = getBetStatusStyle(playerStatus);

      const betStatusStyle = {
          backgroundColor: finalStatusStyle.backgroundColor,
          color: finalStatusStyle.color,
          text: finalStatusStyle.text,
      };

      const opponentPlayer = item.bet_mode === 'pvp' ? (isProposer ? playersMap[item.accepter_id] : playersMap[item.proposer_id]) : null;

      return (
          <View style={[styles.betCard, { borderLeftColor: betStatusStyle.backgroundColor, backgroundColor: theme.surface }]}>
              <View style={styles.betHeader}>
                  <Text style={[styles.betOpponent, { color: theme.textPrimary }]}>vs {match.opponent}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: betStatusStyle.backgroundColor }]}>
                      <Text style={[styles.statusText, { color: betStatusStyle.color }]}>{betStatusStyle.text}</Text>
                  </View>
              </View>

              <View style={styles.betDetails}>
                  <Text style={[styles.betMatchInfo, { color: theme.textSecondary }]} numberOfLines={2}>{getBetDescription(item, playersMap, matchesMap)}</Text>
                  
                  {item.bet_mode === 'pvp' && opponentPlayer && (
                      <Text style={[styles.pvpOpponent, { color: theme.primary }]}>{t('myBets.against')}: {opponentPlayer.name}</Text>
                  )}

                  <Text style={[styles.betRisk, { color: theme.textSecondary }]}>{t('myBets.risk')}: {risk} {t('common.coins').toLowerCase()}</Text>
                  {playerStatus !== 'won' && playerStatus !== 'lost' &&
                      <Text style={[styles.betPayout, { color: theme.success }]}>
                          {t('myBets.potentialProfit')}: {potentialProfit} {t('common.coins').toLowerCase()}
                      </Text>
                  }
              </View>
              {playerStatus === 'won' && 
                  <Text style={[styles.betWin, { color: theme.success }]}>
                      {t('myBets.won')}: {potentialProfit} {t('common.coins').toLowerCase()}
                  </Text>
              }
               {playerStatus === 'lost' &&
                  <Text style={[styles.betLoss, { color: theme.error }]}>
                      {t('myBets.lost')}: {risk} {t('common.coins').toLowerCase()}
                  </Text>
              }
          </View>
      );
  };

  if (loading) {
    return <ActivityIndicator style={styles.center} size="large" color={theme.primary} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerContainer}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{t('myBets.title')}</Text>
      </View>
      {player && (
        <View style={styles.walletSection}>
          <View style={[styles.walletContainer, { backgroundColor: theme.surface }]}>
            <Ionicons name="cash" size={Fonts.size.lg} color={theme.primary} />
            <Text style={[styles.coinText, { color: theme.primary }]}>{player.coins} {t('common.coins')}</Text>
          </View>
        </View>
      )}

      <FlatList
        data={sortedBets}
        keyExtractor={(item) => item.id}
        renderItem={renderBetItem}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.textSecondary }]}>{t('myBets.noBets')}</Text>}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  walletSection: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    alignItems: 'center',
  },
  title: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.xxl,
    textAlign: 'center',
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
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  betCard: {
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 5, // Added for the new border
  },
  betHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  betOpponent: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.md,
  },
  pvpInfo: {
    fontFamily: Fonts.family.medium,
    fontSize: Fonts.size.sm,
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0', // Placeholder for border, will be theme-aware
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 6,
  },
  statusText: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.xs,
  },
  betDetails: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.md,
    marginBottom: Spacing.md,
  },
  betFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0', // Placeholder for border, will be theme-aware
    paddingTop: Spacing.sm,
  },
  betAmount: {
    fontFamily: Fonts.family.medium,
    fontSize: Fonts.size.sm,
  },
  betPayout: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.sm,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.lg,
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.md,
  },
  pvpOpponent: { // Added for the new style
    fontFamily: Fonts.family.medium,
    fontSize: Fonts.size.sm,
    marginBottom: Spacing.sm,
  },
  betWin: { // Added for the new style
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.sm,
    marginTop: Spacing.sm,
  },
  betLoss: { // Added for the new style
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.sm,
    marginTop: Spacing.sm,
  },
});

export default MyBetsScreen;
