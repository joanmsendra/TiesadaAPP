import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRealtimePlayers, useRealtimeMatches, useRealtimePlayerBets, useRealtimeOpenPvPBets } from '../hooks/useRealtimeData';
import { acceptPvPBet } from '../api/storage';
import { getOddsForBet } from '../api/betConstants';
import { useTheme } from '../context/ThemeContext';
import { Fonts, Spacing } from '../constants';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const PvPBetScreen = () => {
    const [playerId, setPlayerId] = useState(null);
    const [player, setPlayer] = useState(null);
    const { theme } = useTheme();
    const { t } = useTranslation();

    // Hooks de datos en tiempo real
    const { data: players } = useRealtimePlayers();
    const { data: matches } = useRealtimeMatches();
    const { data: myBets } = useRealtimePlayerBets(playerId);
    const { data: openBets, loading, refetch: refetchOpenBets } = useRealtimeOpenPvPBets(playerId);

    // Incluir también mis propias apuestas PvP en estado 'proposed'
    const myProposedPvP = useMemo(() => {
        return (myBets || []).filter(b => b.betMode === 'pvp' && b.status === 'proposed' && b.proposerId === playerId);
    }, [myBets, playerId]);

    const combinedBets = useMemo(() => {
        // Unir las abiertas de otros + las mías propuestas (evitar duplicados por id)
        const map = new Map();
        [...(openBets || []), ...(myProposedPvP || [])].forEach(b => map.set(b.id, b));
        return Array.from(map.values());
    }, [openBets, myProposedPvP]);

    const playersMap = useMemo(() => players.reduce((acc, p) => ({ ...acc, [p.id]: p }), {}), [players]);
    const matchesMap = useMemo(() => matches.reduce((acc, m) => ({ ...acc, [m.id]: m }), {}), [matches]);

    useFocusEffect(
        useCallback(() => {
            const loadPlayer = async () => {
                const id = await AsyncStorage.getItem('selectedPlayerId');
                setPlayerId(id);
                if (playersMap[id]) {
                    setPlayer(playersMap[id]);
                }
            };
            loadPlayer();
        }, [playersMap])
    );
    
    const availableCoins = useMemo(() => {
        if (!player) return 0;
        if (!myBets || !myBets.length) return player.coins;

        const moneyInActiveBets = myBets.reduce((total, bet) => {
            if (bet.status === 'active' || bet.status === 'pending') {
                if (bet.betMode === 'standard') {
                    return total + bet.amount;
                } else { // pvp
                    if (bet.proposerId === player.id) {
                        return total + bet.amount;
                    } else if (bet.accepterId === player.id) {
                        const odds = getOddsForBet(bet);
                        const accepterStake = Math.round(bet.amount * odds);
                        return total + accepterStake;
                    }
                }
            }
            return total;
        }, 0);

        return (player.coins || 0) - moneyInActiveBets;
    }, [player, myBets]);


    const handleAcceptBet = async (bet) => {
        let accepterStake = 0;
        if (bet.type === 'custom_pvp') {
            accepterStake = Math.round(bet.amount * bet.details.custom_odds);
        } else {
            const odds = getOddsForBet(bet);
            accepterStake = Math.round(bet.amount * odds);
        }

        if (availableCoins < accepterStake) {
            Alert.alert(t('alerts.notEnoughCoins'), t('pvpBets.needCoins', { amount: accepterStake }));
            return;
        }

        try {
            await acceptPvPBet(bet.id, playerId);
            Alert.alert(t('alerts.success'), t('alerts.betAccepted'));
            refetchOpenBets(); 
        } catch (e) {
            Alert.alert(t('alerts.error'), e.message);
        }
    };

    const renderBetDetails = (bet) => {
        if (bet.type === 'result') {
          return t('myBets.resultBet') + `: ${bet.details.us} - ${bet.details.them}`;
        }
        if (bet.type === 'player_event') {
          const playerName = playersMap[bet.details.playerId]?.name || t('common.player');
          const eventText = {
              scores: t('pvpBets.willScore', 'marcarà'),
              assists: t('pvpBets.willAssist', 'assistirà'),
              gets_card: t('pvpBets.willGetCard', 'rebrà targeta'),
              no_card: t('pvpBets.willNotGetCard', 'no rebrà targeta'),
              cagadas: t('pvpBets.willMakeError', 'tindrà una cagada')
          }[bet.details.event];
          return `${playerName} ${eventText}`;
        }
        if (bet.type === 'custom_pvp') {
            return bet.details.custom_description;
        }
        return '';
    };

    const renderBetItem = ({ item }) => {
        const match = matchesMap[item.matchId];
        const proposer = playersMap[item.proposerId];
        if (!match || !proposer) return null;

        let potentialLoss = 0;
        if (item.type === 'custom_pvp') {
            potentialLoss = Math.round(item.amount * item.details.custom_odds);
        } else {
            const odds = getOddsForBet(item);
            potentialLoss = Math.round(item.amount * odds);
        }
        
        const potentialGain = item.amount;

        const isMine = item.proposerId === playerId;

        return (
            <View style={[styles.betCard, { backgroundColor: theme.surface }]}>
                <Text style={[styles.proposerText, { color: theme.textPrimary }]}>
                    {t('pvpBets.proposedBy', 'Proposada per')}: {proposer.name}
                    {isMine && ' · '}
                    {isMine && <Text style={{ color: theme.primary }}>{t('common.yours', 'Teva')}</Text>}
                </Text>
                <Text style={[styles.matchText, { color: theme.textSecondary }]}>{t('common.match')}: vs {match.opponent}</Text>
                <Text style={[styles.betDetailText, { color: theme.textPrimary }]}>{renderBetDetails(item)}</Text>
                <View style={[styles.amountContainer, { borderColor: theme.border }]}>
                    <Text style={[styles.amountText, { color: theme.textPrimary }]}>{t('pvpBets.betAgainst', 'Aposta en contra')}:</Text>
                    <View style={styles.winningsContainer}>
                        <Text style={[styles.winningsText, { color: theme.success }]}>{t('pvpBets.youWin', 'Guanyes')}: {potentialGain} {t('common.coins').toLowerCase()}</Text>
                        <Text style={[styles.riskText, { color: theme.error }]}>{t('myBets.risk')}: {potentialLoss} {t('common.coins').toLowerCase()}</Text>
                    </View>
                </View>
                {!isMine && (
                    <TouchableOpacity style={[styles.acceptButton, { backgroundColor: theme.success }]} onPress={() => handleAcceptBet(item)}>
                        <Text style={[styles.acceptButtonText, { color: theme.white }]}>{t('pvpBets.accept')}</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.headerContainer}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>{t('pvpBets.title')}</Text>
            {player && (
                <View style={[styles.walletContainer, { backgroundColor: theme.surface }]}>
                    <Ionicons name="cash" size={Fonts.size.lg} color={theme.primary} />
                    <Text style={[styles.coinText, { color: theme.primary }]}>{player.coins} {t('common.coins')}</Text>
                </View>
            )}
        </View>
      <FlatList
        data={combinedBets}
        keyExtractor={(item) => item.id}
        renderItem={renderBetItem}
        ListEmptyComponent={!loading && <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{t('pvpBets.noBets')}</Text>}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={refetchOpenBets}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: Spacing.md },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  title: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.xl,
    flex: 1, // Añadido para que el título ocupe el espacio disponible
    marginRight: Spacing.sm, // Añadido para dar espacio al contador
  },
  walletContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: 8,
  },
  coinText: {
      fontFamily: Fonts.family.bold,
      fontSize: Fonts.size.md,
      marginLeft: Spacing.sm,
  },
  betCard: {
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  proposerText: { fontFamily: Fonts.family.bold, fontSize: Fonts.size.md },
  matchText: { fontFamily: Fonts.family.regular, fontSize: Fonts.size.sm, marginTop: Spacing.xs },
  betDetailText: { fontFamily: Fonts.family.medium, fontSize: Fonts.size.md, marginTop: Spacing.sm, marginBottom: Spacing.sm },
  amountContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountText: { fontFamily: Fonts.family.bold, fontSize: Fonts.size.md },
  winningsContainer: {
    alignItems: 'flex-end',
  },
  winningsText: {
    fontFamily: Fonts.family.medium,
    fontSize: Fonts.size.sm,
  },
  riskText: {
    fontFamily: Fonts.family.medium,
    fontSize: Fonts.size.sm,
  },
  acceptButton: { padding: Spacing.md, borderRadius: 8, alignItems: 'center' },
  acceptButtonText: { fontFamily: Fonts.family.bold, fontSize: Fonts.size.md },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.lg,
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.md,
  },
});

export default PvPBetScreen;
