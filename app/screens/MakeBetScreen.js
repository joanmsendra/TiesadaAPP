import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getMatch, getPlayers, addBet, BET_ODDS, addPvPBet } from '../api/storage';
import { Colors, Fonts, Spacing } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ModalSelector from 'react-native-modal-selector';

const MakeBetScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { matchId } = route.params;

  const [match, setMatch] = useState(null);
  const [players, setPlayers] = useState([]);
  const [betType, setBetType] = useState('result');
  const [betAmount, setBetAmount] = useState('');
  
  // State for result bet
  const [resultUs, setResultUs] = useState('0');
  const [resultThem, setResultThem] = useState('0');

  // State for player goals bet
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerEvent, setPlayerEvent] = useState('scores');

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
            }
        }
        setPotentialWinnings(amount * odds);
    } else {
        setPotentialWinnings(0);
    }
  }, [betAmount, betType, playerEvent]);

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
      Alert.alert('Error', 'Introduce una cantidad válida.');
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
            }
    
            await addPvPBet({
                proposerId,
                matchId,
                type: betType,
                amount,
                details: betDetails,
            });
        }

      Alert.alert('¡Éxito!', 'Tu apuesta se ha realizado correctamente.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  if (loading) {
    return <ActivityIndicator style={styles.center} size="large" color={Colors.primary} />;
  }

  return (
    <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{flex: 1, backgroundColor: Colors.background}}
    >
        <ScrollView 
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
        >
            <Text style={styles.title}>Apostar en</Text>
            <Text style={styles.matchTitle}>{match.opponent}</Text>
            
            <Text style={styles.label}>Modo de Apuesta:</Text>
            <View style={styles.betTypeSelector}>
                <TouchableOpacity 
                    style={[styles.betTypeButton, betMode === 'standard' && styles.betTypeButtonActive]}
                    onPress={() => setBetMode('standard')}
                >
                    <Text style={[styles.betTypeButtonText, betMode === 'standard' && styles.betTypeButtonTextActive]}>Normal</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.betTypeButton, betMode === 'pvp' && styles.betTypeButtonActive]}
                    onPress={() => setBetMode('pvp')}
                >
                    <Text style={[styles.betTypeButtonText, betMode === 'pvp' && styles.betTypeButtonTextActive]}>JcJ</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.label}>Tipo de Apuesta:</Text>
            <View style={styles.betTypeSelector}>
                <TouchableOpacity 
                    style={[styles.betTypeButton, betType === 'result' && styles.betTypeButtonActive]}
                    onPress={() => setBetType('result')}
                >
                    <Text style={[styles.betTypeButtonText, betType === 'result' && styles.betTypeButtonTextActive]}>Resultado Exacto</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.betTypeButton, betType === 'player_event' && styles.betTypeButtonActive]}
                    onPress={() => setBetType('player_event')}
                >
                    <Text style={[styles.betTypeButtonText, betType === 'player_event' && styles.betTypeButtonTextActive]}>Evento de Jugador</Text>
                </TouchableOpacity>
            </View>

            {betType === 'result' && (
                <View style={styles.betOptionContainer}>
                    <Text style={styles.label}>Resultado:</Text>
                    <View style={styles.resultInputContainer}>
                        <TextInput style={styles.resultInput} value={resultUs} onChangeText={setResultUs} keyboardType="numeric" />
                        <Text style={styles.resultSeparator}>-</Text>
                        <TextInput style={styles.resultInput} value={resultThem} onChangeText={setResultThem} keyboardType="numeric" />
                    </View>
                </View>
            )}

            {betType === 'player_event' && (
                <View style={styles.betOptionContainer}>
                    <Text style={styles.label}>Jugador:</Text>
                    <ModalSelector
                        data={players.map(p => ({ key: p.id, label: p.name }))}
                        initValue="Selecciona un jugador"
                        onChange={(option) => setSelectedPlayer(option.key)}
                    >
                        <TextInput
                            style={styles.input}
                            editable={false}
                            value={players.find(p => p.id === selectedPlayer)?.name}
                        />
                    </ModalSelector>

                    <Text style={styles.label}>Suceso:</Text>
                    <ModalSelector
                        data={[
                            { key: 'scores', label: 'Marcará gol' },
                            { key: 'assists', label: 'Hará una asistencia' },
                            { key: 'gets_card', label: 'Recibirá una tarjeta' },
                            { key: 'no_card', label: 'No recibirá ninguna tarjeta' },
                        ]}
                        initValue="Selecciona un suceso"
                        onChange={(option) => setPlayerEvent(option.key)}
                    >
                        <TextInput
                            style={styles.input}
                            editable={false}
                            value={[
                                { key: 'scores', label: 'Marcará gol' },
                                { key: 'assists', label: 'Hará una asistencia' },
                                { key: 'gets_card', label: 'Recibirá una tarjeta' },
                                { key: 'no_card', label: 'No recibirá ninguna tarjeta' },
                            ].find(e => e.key === playerEvent)?.label}
                        />
                    </ModalSelector>
                </View>
            )}

            <Text style={styles.label}>Cantidad a apostar:</Text>
            <TextInput style={styles.input} value={betAmount} onChangeText={setBetAmount} keyboardType="numeric" placeholder="Ej: 100" />
            
            {potentialWinnings > 0 && (
                <Text style={styles.winningsText}>
                    {betMode === 'standard'
                        ? `Ganancia potencial: ${potentialWinnings} monedas`
                        : `Tu rival arriesgará ${potentialWinnings} para ganar ${betAmount} monedas`
                    }
                </Text>
            )}

            <TouchableOpacity style={styles.placeBetButton} onPress={handlePlaceBet}>
                <Text style={styles.placeBetButtonText}>Realizar Apuesta</Text>
            </TouchableOpacity>
        </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
    container: { 
        backgroundColor: Colors.background, 
        padding: Spacing.md,
        flexGrow: 1,
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontFamily: Fonts.family.regular, fontSize: Fonts.size.lg, color: Colors.textSecondary, textAlign: 'center' },
    matchTitle: { fontFamily: Fonts.family.bold, fontSize: Fonts.size.xl, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.lg },
    betTypeSelector: { flexDirection: 'row', justifyContent: 'center', marginBottom: Spacing.lg },
    betTypeButton: { padding: Spacing.md, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, marginHorizontal: Spacing.sm },
    betTypeButtonActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    betTypeButtonText: { fontFamily: Fonts.family.medium, fontSize: Fonts.size.md, color: Colors.textPrimary },
    betTypeButtonTextActive: { color: Colors.surface },
    betOptionContainer: { marginBottom: Spacing.md, backgroundColor: Colors.surface, padding: Spacing.md, borderRadius: 8 },
    label: { fontFamily: Fonts.family.bold, fontSize: Fonts.size.md, color: Colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.sm },
    input: { backgroundColor: Colors.background, padding: Spacing.md, borderRadius: 8, fontFamily: Fonts.family.regular, fontSize: Fonts.size.md },
    resultInputContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    resultInput: { backgroundColor: Colors.background, padding: Spacing.md, borderRadius: 8, fontFamily: Fonts.family.bold, fontSize: Fonts.size.lg, width: 80, textAlign: 'center' },
    resultSeparator: { fontFamily: Fonts.family.bold, fontSize: Fonts.size.xl, marginHorizontal: Spacing.md },
    winningsText: {
        fontFamily: Fonts.family.medium,
        fontSize: Fonts.size.md,
        color: Colors.success,
        textAlign: 'center',
        marginTop: Spacing.md,
    },
    placeBetButton: { backgroundColor: Colors.success, padding: Spacing.lg, borderRadius: 8, alignItems: 'center', marginTop: Spacing.lg },
    placeBetButtonText: { fontFamily: Fonts.family.bold, fontSize: Fonts.size.lg, color: Colors.surface },
});

export default MakeBetScreen;
