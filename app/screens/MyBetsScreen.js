import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, LayoutAnimation } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPlayerBets, getMatches, getPlayers, BET_ODDS } from '../api/storage';
import { Colors, Fonts, Spacing } from '../constants';
import { Ionicons } from '@expo/vector-icons';

const MyBetsScreen = () => {
  const [bets, setBets] = useState([]);
  const [matches, setMatches] = useState({});
  const [players, setPlayers] = useState({});
  const [player, setPlayer] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoading(true);
        try {
          const playerId = await AsyncStorage.getItem('selectedPlayerId');
          setPlayerId(playerId);
          
          const allPlayers = await getPlayers();
          const playerMap = allPlayers.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
          setPlayers(playerMap);
          setPlayer(playerMap[playerId]);

          const playerBets = await getPlayerBets(playerId);
          
          const allMatches = await getMatches();
          const matchMap = allMatches.reduce((acc, m) => ({ ...acc, [m.id]: m }), {});
          setMatches(matchMap);

          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setBets(playerBets.sort((a, b) => new Date(matchMap[b.matchId]?.date) - new Date(matchMap[a.matchId]?.date)));
        } catch (e) {
          console.error('Failed to load bets', e);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }, [])
  );

  const getBetStatusStyle = (status) => {
    if (status === 'won') return { backgroundColor: Colors.success, color: Colors.surface, text: 'Ganada' };
    if (status === 'lost') return { backgroundColor: Colors.error, color: Colors.surface, text: 'Perdida' };
    return { backgroundColor: Colors.border, color: Colors.textSecondary, text: 'Pendiente' };
  };

  const renderBetDetails = (bet) => {
    if (bet.type === 'result') {
      return `Resultado: ${bet.details.us} - ${bet.details.them}`;
    }
    if (bet.type === 'player_event') {
      const playerName = players[bet.details.playerId]?.name || 'Jugador';
      return `${playerName} marcará ${bet.details.goals > 1 ? bet.details.goals : ''} ${bet.details.goals > 1 ? 'o más goles' : 'gol'}`;
    }
    return '';
  };

  const getOddsForBet = (bet) => {
    if (bet.type === 'result') return BET_ODDS.RESULT;
    if (bet.type === 'player_event') {
        switch (bet.details.event) {
            case 'scores': return BET_ODDS.PLAYER_SCORES;
            case 'assists': return BET_ODDS.PLAYER_ASSISTS;
            case 'gets_card': return BET_ODDS.PLAYER_GETS_CARD;
            case 'no_card': return BET_ODDS.PLAYER_NO_CARD;
            default: return 1;
        }
    }
    return 1;
  };

  const renderBetItem = ({ item }) => {
    const match = matches[item.matchId];
    if (!match) return null;
    
    const statusStyle = getBetStatusStyle(item.status);
    const isProposer = item.proposerId === playerId;

    // For PvP bets, determine the opponent
    let opponentPlayer = null;
    if (item.betMode === 'pvp') {
        const opponentId = isProposer ? item.accepterId : item.proposerId;
        opponentPlayer = players[opponentId];
    }

    // For PvP bets, interpret the status from the current player's perspective
    let playerStatus = item.status;
    if (item.betMode === 'pvp' && item.status !== 'proposed' && item.status !== 'active') {
        if ((isProposer && item.status === 'won') || (!isProposer && item.status === 'lost')) {
            playerStatus = 'won';
        } else {
            playerStatus = 'lost';
        }
    }

    const finalStatusStyle = getBetStatusStyle(playerStatus);

    const odds = getOddsForBet(item);
    let risk = 0;
    let potentialGain = 0;

    if (item.betMode === 'standard') {
        risk = item.amount;
        potentialGain = item.amount * odds;
    } else { // pvp
        if (isProposer) {
            risk = item.amount;
            potentialGain = item.amount * odds;
        } else { // is accepter
            risk = item.amount * odds;
            potentialGain = item.amount;
        }
    }


    return (
      <View style={styles.betCard}>
        <View style={styles.betHeader}>
            <Text style={styles.betOpponent}>vs {match.opponent}</Text>
            <View style={[styles.statusBadge, { backgroundColor: finalStatusStyle.backgroundColor }]}>
                <Text style={[styles.statusText, { color: finalStatusStyle.color }]}>{finalStatusStyle.text}</Text>
            </View>
        </View>

        {item.betMode === 'pvp' && (
            <Text style={styles.pvpInfo}>
                {isProposer ? 'Propuesta a' : 'Aceptada de'} {opponentPlayer ? opponentPlayer.name : '...'}
            </Text>
        )}

        <Text style={styles.betDetails}>{renderBetDetails(item)}</Text>
        <View style={styles.betFooter}>
            <View>
                <Text style={styles.betAmount}>Arriesgas: {risk} monedas</Text>
                {playerStatus !== 'won' && playerStatus !== 'lost' &&
                    <Text style={[styles.betPayout, {color: Colors.textSecondary, fontSize: Fonts.size.xs}]}>
                        Ganancia Pot.: {potentialGain} monedas
                    </Text>
                }
            </View>
            {playerStatus === 'won' && 
                <Text style={styles.betPayout}>
                    Ganaste: {potentialGain} monedas
                </Text>
            }
            {playerStatus === 'lost' &&
                <Text style={[styles.betPayout, {color: Colors.error}]}>
                    Perdiste: {risk} monedas
                </Text>
            }
        </View>
      </View>
    );
  };

  if (loading) {
    return <ActivityIndicator style={styles.center} size="large" color={Colors.primary} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Mis Apuestas</Text>
        {player && (
            <View style={styles.walletContainer}>
                <Ionicons name="cash" size={Fonts.size.lg} color={Colors.primary} />
                <Text style={styles.coinText}>{player.coins} Monedas</Text>
            </View>
        )}
      </View>

      <FlatList
        data={bets}
        keyExtractor={(item) => item.id}
        renderItem={renderBetItem}
        ListEmptyComponent={<Text style={styles.emptyText}>Todavía no has hecho ninguna apuesta.</Text>}
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
    paddingBottom: Spacing.md,
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
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  betCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
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
    color: Colors.textPrimary,
  },
  pvpInfo: {
    fontFamily: Fonts.family.medium,
    fontSize: Fonts.size.sm,
    color: Colors.primary,
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  betFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  },
  betAmount: {
    fontFamily: Fonts.family.medium,
    fontSize: Fonts.size.sm,
    color: Colors.textPrimary,
  },
  betPayout: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.sm,
    color: Colors.success,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.lg,
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.md,
    color: Colors.textSecondary,
  },
});

export default MyBetsScreen;
