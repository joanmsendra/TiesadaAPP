import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getMatch, getPlayers, addBet, addPvPBet } from '../api/storage';
import { BET_ODDS, getOddsForBet } from '../api/betConstants'; // <-- Importar constantes
import { useTheme } from '../context/ThemeContext';
import { Fonts, Spacing } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ModalSelector from 'react-native-modal-selector';
import { useTranslation } from 'react-i18next';

const MakeBetScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { matchId } = route.params;
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [match, setMatch] = useState(null);
  const [players, setPlayers] = useState([]);
  const [betType, setBetType] = useState('result');
  const [betAmount, setBetAmount] = useState('');
  
  // State for result bet
  const [resultUs, setResultUs] = useState('0');
  const [resultThem, setResultThem] = useState('0');

  // State for player event bet
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerEvent, setPlayerEvent] = useState('scores');

  // State for custom PvP bet
  const [customDescription, setCustomDescription] = useState('');
  const [customOdds, setCustomOdds] = useState('1.5');


  const [betMode, setBetMode] = useState('standard');

  const [loading, setLoading] = useState(true);
  const [potentialWinnings, setPotentialWinnings] = useState(0);

  useEffect(() => {
    const amount = parseInt(betAmount);
    if (!isNaN(amount) && amount > 0) {
        let odds = 0;
        if (betType === 'result') {
            odds = BET_ODDS.RESULT;
        } else if (betType === 'player_event') {
            switch (playerEvent) {
                case 'scores': odds = BET_ODDS.PLAYER_SCORES; break;
                case 'assists': odds = BET_ODDS.PLAYER_ASSISTS; break;
                case 'gets_card': odds = BET_ODDS.PLAYER_GETS_CARD; break;
                case 'no_card': odds = BET_ODDS.PLAYER_NO_CARD; break;
                case 'cagadas': odds = BET_ODDS.PLAYER_CAGADAS; break;
            }
        } else if (betType === 'custom_pvp') {
            odds = parseFloat(customOdds) || 0;
        }
        setPotentialWinnings(amount * odds);
    } else {
        setPotentialWinnings(0);
    }
  }, [betAmount, betType, playerEvent, customOdds]);

  useEffect(() => {
    // Si se cambia a modo 'standard', y está seleccionada la apuesta personalizada,
    // se cambia a tipo 'result' porque la personalizada solo es para JcJ.
    if (betMode === 'standard' && betType === 'custom_pvp') {
        setBetType('result');
    }
  }, [betMode]);


  useEffect(() => {
    const loadData = async () => {
      try {
        const matchData = await getMatch(matchId);
        setMatch(matchData);
        const allPlayers = await getPlayers();
        setPlayers(allPlayers);
        if (allPlayers.length > 0) {
            setSelectedPlayer(allPlayers[0].id);
        }
      } catch (e) {
        console.error('Failed to load bet screen data', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [matchId]);

  const handlePlaceBet = async () => {
    const amount = parseInt(betAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(t('alerts.error'), t('makeBet.enterValidAmount', 'Introduce una cantidad válida.'));
      return;
    }

    try {
        if (betMode === 'standard') {
            const playerId = await AsyncStorage.getItem('selectedPlayerId');
            let betDetails = {};
            if (betType === 'result') {
                betDetails = {
                    us: parseInt(resultUs),
                    them: parseInt(resultThem),
                }
            } else if (betType === 'player_event') {
                betDetails = {
                    playerId: selectedPlayer,
                    event: playerEvent,
                }
            }
    
            await addBet({
                playerId,
                matchId,
                type: betType,
                amount,
                details: betDetails,
            });
        } else { // pvp
            const proposerId = await AsyncStorage.getItem('selectedPlayerId');
            let betDetails = {};
            if (betType === 'result') {
                betDetails = {
                    us: parseInt(resultUs),
                    them: parseInt(resultThem),
                }
            } else if (betType === 'player_event') {
                betDetails = {
                    playerId: selectedPlayer,
                    event: playerEvent,
                }
            } else if (betType === 'custom_pvp') {
                if (!customDescription.trim()) {
                    Alert.alert(t('alerts.error'), t('makeBet.emptyDescription', 'La descripción de la apuesta no puede estar vacía.'));
                    return;
                }
                const odds = parseFloat(customOdds);
                if (isNaN(odds) || odds <= 1) {
                    Alert.alert(t('alerts.error'), t('makeBet.invalidOdds', 'La cuota debe ser un número mayor que 1.'));
                    return;
                }
                betDetails = {
                    custom_description: customDescription.trim(),
                    custom_odds: odds,
                }
            }
    
            await addPvPBet({
                proposerId,
                matchId,
                type: betType,
                amount,
                details: betDetails,
            });
        }

      Alert.alert(t('alerts.success'), t('alerts.betPlaced'));
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  if (loading) {
    return <ActivityIndicator style={styles.center} size="large" color={theme.primary} />;
  }

  return (
    <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{flex: 1, backgroundColor: theme.background}}
    >
        <ScrollView 
            contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
            keyboardShouldPersistTaps="handled"
        >
            <Text style={[styles.title, { color: theme.textSecondary }]}>{t('makeBet.bettingOn', 'Apostar en')}</Text>
            <Text style={[styles.matchTitle, { color: theme.textPrimary }]}>{match.opponent}</Text>
            
            <Text style={[styles.label, { color: theme.textPrimary }]}>{t('makeBet.betMode', 'Modo de Apuesta:')}</Text>
            <View style={styles.betTypeSelector}>
                <TouchableOpacity 
                    style={[styles.betTypeButton, { borderColor: theme.border }, betMode === 'standard' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                    onPress={() => setBetMode('standard')}
                >
                    <Text style={[styles.betTypeButtonText, { color: theme.textPrimary }, betMode === 'standard' && { color: theme.white }]}>{t('makeBet.normal', 'Normal')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.betTypeButton, { borderColor: theme.border }, betMode === 'pvp' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                    onPress={() => setBetMode('pvp')}
                >
                    <Text style={[styles.betTypeButtonText, { color: theme.textPrimary }, betMode === 'pvp' && { color: theme.white }]}>{t('makeBet.pvp', 'JcJ')}</Text>
                </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: theme.textPrimary }]}>{t('makeBet.betType', 'Tipo de Apuesta:')}</Text>
            <View style={styles.betTypeSelector}>
                <TouchableOpacity 
                    style={[styles.betTypeButton, { borderColor: theme.border }, betType === 'result' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                    onPress={() => setBetType('result')}
                >
                    <Text style={[styles.betTypeButtonText, { color: theme.textPrimary }, betType === 'result' && { color: theme.white }]}>{t('betting.betType.result')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.betTypeButton, { borderColor: theme.border }, betType === 'player_event' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                    onPress={() => setBetType('player_event')}
                >
                    <Text style={[styles.betTypeButtonText, { color: theme.textPrimary }, betType === 'player_event' && { color: theme.white }]}>{t('makeBet.playerEvent', 'Evento de Jugador')}</Text>
                </TouchableOpacity>
                {betMode === 'pvp' && (
                    <TouchableOpacity 
                        style={[styles.betTypeButton, { borderColor: theme.border }, betType === 'custom_pvp' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                        onPress={() => setBetType('custom_pvp')}
                    >
                        <Text style={[styles.betTypeButtonText, { color: theme.textPrimary }, betType === 'custom_pvp' && { color: theme.white }]}>{t('makeBet.custom', 'Personalitzada')}</Text>
                    </TouchableOpacity>
                )}
            </View>

            {betType === 'result' && (
                <View style={[styles.betOptionContainer, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.label, { color: theme.textPrimary }]}>{t('addEditMatch.result')}:</Text>
                    <View style={styles.resultInputContainer}>
                        <TextInput style={[styles.resultInput, { backgroundColor: theme.background, color: theme.textPrimary }]} value={resultUs} onChangeText={setResultUs} keyboardType="numeric" />
                        <Text style={[styles.resultSeparator, { color: theme.textSecondary }]}>-</Text>
                        <TextInput style={[styles.resultInput, { backgroundColor: theme.background, color: theme.textPrimary }]} value={resultThem} onChangeText={setResultThem} keyboardType="numeric" />
                    </View>
                </View>
            )}

            {betType === 'player_event' && (
                <View style={[styles.betOptionContainer, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.label, { color: theme.textPrimary }]}>{t('common.player')}:</Text>
                    <ModalSelector
                        data={players.map(p => ({ key: p.id, label: p.name }))}
                        initValue={t('addEditMatch.selectPlayer')}
                        onChange={(option) => setSelectedPlayer(option.key)}
                    >
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.background, color: theme.textPrimary }]}
                            editable={false}
                            value={players.find(p => p.id === selectedPlayer)?.name}
                        />
                    </ModalSelector>

                    <Text style={[styles.label, { color: theme.textPrimary }]}>{t('makeBet.event', 'Suceso:')}:</Text>
                    <ModalSelector
                        data={[
                            { key: 'scores', label: t('makeBet.willScore', 'Marcarà gol') },
                            { key: 'assists', label: t('makeBet.willAssist', 'Farà una assistència') },
                            { key: 'gets_card', label: t('makeBet.willGetCard', 'Rebrà una targeta') },
                            { key: 'no_card', label: t('makeBet.noCard', 'No rebrà cap targeta') },
                            { key: 'cagadas', label: t('makeBet.willMakeError', 'Farà una cagada') },
                        ]}
                        initValue={t('makeBet.selectEvent', 'Selecciona un suceso')}
                        onChange={(option) => setPlayerEvent(option.key)}
                    >
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.background, color: theme.textPrimary }]}
                            editable={false}
                            value={[
                                { key: 'scores', label: t('makeBet.willScore') },
                                { key: 'assists', label: t('makeBet.willAssist') },
                                { key: 'gets_card', label: t('makeBet.willGetCard') },
                                { key: 'no_card', label: t('makeBet.noCard') },
                                { key: 'cagadas', label: t('makeBet.willMakeError') },
                            ].find(e => e.key === playerEvent)?.label}
                        />
                    </ModalSelector>
                </View>
            )}

            {betType === 'custom_pvp' && (
                <View style={[styles.betOptionContainer, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.label, { color: theme.textPrimary }]}>{t('makeBet.describeBet', 'Descriu la teva aposta:')}:</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: theme.background, color: theme.textPrimary, textAlignVertical: 'top' }]}
                        placeholder={t('makeBet.betPlaceholder', 'Ex: Lopa no marcarà de falta directa.')}
                        placeholderTextColor={theme.textSecondary}
                        value={customDescription}
                        onChangeText={setCustomDescription}
                        multiline={true}
                        numberOfLines={3}
                    />
                    <Text style={[styles.label, { color: theme.textPrimary, marginTop: Spacing.md }]}>{t('makeBet.odds', 'Quota (ex: 1.5, 2.0, 3.5):')}:</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: theme.background, color: theme.textPrimary }]}
                        value={customOdds}
                        onChangeText={setCustomOdds}
                        keyboardType="numeric"
                        placeholder={t('makeBet.oddsPlaceholder', 'Ex: 2.0')}
                        placeholderTextColor={theme.textSecondary}
                    />
                </View>
            )}

            <Text style={[styles.label, { color: theme.textPrimary }]}>{t('betting.betAmount')}:</Text>
            <TextInput style={[styles.input, { backgroundColor: theme.background, color: theme.textPrimary }]} value={betAmount} onChangeText={setBetAmount} keyboardType="numeric" placeholder={t('makeBet.amountPlaceholder', 'Ex: 100')} />
            
            {potentialWinnings > 0 && (
                <Text style={[styles.winningsText, { color: theme.success }]}>
                    {betMode === 'standard'
                        ? t('makeBet.potentialWin', { amount: potentialWinnings })
                        : t('makeBet.rivalRisk', { risk: potentialWinnings, win: betAmount })
                    }
                </Text>
            )}

            <TouchableOpacity style={[styles.placeBetButton, { backgroundColor: theme.success }]} onPress={handlePlaceBet}>
                <Text style={[styles.placeBetButtonText, { color: theme.white }]}>{t('betting.makeBet')}</Text>
            </TouchableOpacity>
        </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
    container: { 
        padding: Spacing.md,
        flexGrow: 1,
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontFamily: Fonts.family.regular, fontSize: Fonts.size.lg, textAlign: 'center' },
    matchTitle: { fontFamily: Fonts.family.bold, fontSize: Fonts.size.xl, textAlign: 'center', marginBottom: Spacing.lg },
    betTypeSelector: { flexDirection: 'row', justifyContent: 'center', marginBottom: Spacing.lg, flexWrap: 'wrap', gap: Spacing.sm },
    betTypeButton: { padding: Spacing.md, borderRadius: 8, borderWidth: 1, marginHorizontal: Spacing.sm },
    betTypeButtonActive: { },
    betTypeButtonText: { fontFamily: Fonts.family.medium, fontSize: Fonts.size.md },
    betTypeButtonTextActive: { },
    betOptionContainer: { marginBottom: Spacing.md, padding: Spacing.md, borderRadius: 8 },
    label: { fontFamily: Fonts.family.bold, fontSize: Fonts.size.md, marginBottom: Spacing.sm, marginTop: Spacing.sm },
    input: { padding: Spacing.md, borderRadius: 8, fontFamily: Fonts.family.regular, fontSize: Fonts.size.md },
    resultInputContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    resultInput: { padding: Spacing.md, borderRadius: 8, fontFamily: Fonts.family.bold, fontSize: Fonts.size.lg, width: 80, textAlign: 'center' },
    resultSeparator: { fontFamily: Fonts.family.bold, fontSize: Fonts.size.xl, marginHorizontal: Spacing.md },
    winningsText: {
        fontFamily: Fonts.family.medium,
        fontSize: Fonts.size.md,
        textAlign: 'center',
        marginTop: Spacing.md,
    },
    placeBetButton: { padding: Spacing.lg, borderRadius: 8, alignItems: 'center', marginTop: Spacing.lg },
    placeBetButtonText: { fontFamily: Fonts.family.bold, fontSize: Fonts.size.lg },
});

export default MakeBetScreen;
