import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getOpenPvPBets, acceptPvPBet, getMatches, getPlayers, BET_ODDS } from '../api/storage';
import { Colors, Fonts, Spacing } from '../constants';

const PvPBetScreen = () => {
    const navigation = useNavigation();
    const [openBets, setOpenBets] = useState([]);
    const [matches, setMatches] = useState({});
    const [players, setPlayers] = useState({});
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const playerId = await AsyncStorage.getItem('selectedPlayerId');
            const bets = await getOpenPvPBets(playerId);
            setOpenBets(bets);

            const allMatches = await getMatches();
            const matchMap = allMatches.reduce((acc, m) => ({ ...acc, [m.id]: m }), {});
            setMatches(matchMap);

            const allPlayers = await getPlayers();
            const playerMap = allPlayers.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
            setPlayers(playerMap);

        } catch (e) {
            console.error('Failed to load open PvP bets', e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const handleAcceptBet = async (betId) => {
        try {
            const playerId = await AsyncStorage.getItem('selectedPlayerId');
            await acceptPvPBet(betId, playerId);
            Alert.alert('¡Éxito!', 'Has aceptado la apuesta.');
            loadData(); // Refresh the list
        } catch (e) {
            Alert.alert('Error', e.message);
        }
    };

    const renderBetDetails = (bet) => {
        if (bet.type === 'result') {
          return `Resultado: ${bet.details.us} - ${bet.details.them}`;
        }
        if (bet.type === 'player_event') {
          const playerName = players[bet.details.playerId]?.name || 'Jugador';
          const eventText = {
              scores: `marcará`,
              assists: `asistirá`,
              gets_card: `recibirá tarjeta`,
              no_card: `no recibirá tarjeta`
          }[bet.details.event];
          return `${playerName} ${eventText}`;
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
        const proposer = players[item.proposerId];
        if (!match || !proposer) return null;

        const odds = getOddsForBet(item);
        const potentialLoss = item.amount * odds;
        const potentialGain = item.amount;

        return (
            <View style={styles.betCard}>
                <Text style={styles.proposerText}>Propuesta por: {proposer.name}</Text>
                <Text style={styles.matchText}>Partido: vs {match.opponent}</Text>
                <Text style={styles.betDetailText}>{renderBetDetails(item)}</Text>
                <View style={styles.amountContainer}>
                    <Text style={styles.amountText}>Apuesta en contra:</Text>
                    <View style={styles.winningsContainer}>
                        <Text style={styles.winningsText}>Ganas: {potentialGain} monedas</Text>
                        <Text style={styles.riskText}>Arriesgas: {potentialLoss} monedas</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.acceptButton} onPress={() => handleAcceptBet(item.id)}>
                    <Text style={styles.acceptButtonText}>Aceptar Apuesta</Text>
                </TouchableOpacity>
            </View>
        );
    };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={openBets}
        keyExtractor={(item) => item.id}
        renderItem={renderBetItem}
        ListHeaderComponent={<Text style={styles.title}>Apuestas JcJ Abiertas</Text>}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay apuestas propuestas por otros jugadores.</Text>}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={loadData}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  listContent: { padding: Spacing.md },
  title: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.xxl,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  betCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  proposerText: { fontFamily: Fonts.family.bold, fontSize: Fonts.size.md, color: Colors.textPrimary },
  matchText: { fontFamily: Fonts.family.regular, fontSize: Fonts.size.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
  betDetailText: { fontFamily: Fonts.family.medium, fontSize: Fonts.size.md, color: Colors.textPrimary, marginTop: Spacing.sm, marginBottom: Spacing.sm },
  amountContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountText: { fontFamily: Fonts.family.bold, fontSize: Fonts.size.md, color: Colors.textPrimary },
  winningsContainer: {
    alignItems: 'flex-end',
  },
  winningsText: {
    fontFamily: Fonts.family.medium,
    fontSize: Fonts.size.sm,
    color: Colors.success,
  },
  riskText: {
    fontFamily: Fonts.family.medium,
    fontSize: Fonts.size.sm,
    color: Colors.error,
  },
  acceptButton: { backgroundColor: Colors.success, padding: Spacing.md, borderRadius: 8, alignItems: 'center' },
  acceptButtonText: { color: Colors.surface, fontFamily: Fonts.family.bold, fontSize: Fonts.size.md },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.lg,
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.md,
    color: Colors.textSecondary,
  },
});

export default PvPBetScreen;
