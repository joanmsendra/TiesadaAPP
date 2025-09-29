import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Platform, KeyboardAvoidingView, Image, Alert
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getMatch, addMatch, updateMatch, getPlayers, resolveBetsForMatch, getCustomPvPBetsForMatch, resolveCustomPvPBet } from '../api/storage';
import { useTheme } from '../context/ThemeContext';
import { Fonts, Spacing } from '../constants';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const StatInput = ({ icon, color, value, onChangeText }) => {
    const { theme } = useTheme();
    return (
        <View style={styles.statInputContainer}>
            <Ionicons name={icon} size={20} color={color} style={styles.statIcon} />
            <TextInput
                style={[styles.statInput, { borderColor: theme.border, color: theme.textPrimary }]}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={theme.textSecondary}
                value={value}
                onChangeText={onChangeText}
            />
        </View>
    );
};

const AddEditMatchScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const matchId = route.params?.matchId;
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [opponent, setOpponent] = useState('');
  const [emoji, setEmoji] = useState('⚽️');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [played, setPlayed] = useState(false);
  const [result, setResult] = useState({ us: '0', them: '0' });
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [stats, setStats] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [attendingPlayerIds, setAttendingPlayerIds] = useState([]);
  const [customBets, setCustomBets] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const players = await getPlayers();
      setAllPlayers(players);

      if (matchId) {
        const match = await getMatch(matchId);
        if (match) {
          setOpponent(match.opponent);
          setDate(new Date(match.date));
          setPlayed(match.played);
          setEmoji(match.emoji || '⚽️');
          setAttendingPlayerIds(match.attending || []);

          if (match.played) {
            setResult({ us: match.result.us.toString(), them: match.result.them.toString() });
            setYoutubeUrl(match.youtube_url || '');
            
            // Inicializar stats solo para los jugadores que asistieron
            const attendingPlayers = players.filter(p => (match.attending || []).includes(p.id));
            const initialStats = attendingPlayers.map(p => {
              const stat = match.stats?.find(s => s.playerId === p.id);
              return {
                playerId: p.id,
                name: p.name,
                goals: stat?.goals?.toString() || '0',
                assists: stat?.assists?.toString() || '0',
                yellowCards: stat?.yellowCards?.toString() || '0',
                redCards: stat?.redCards?.toString() || '0',
                cagadas: stat?.cagadas?.toString() || '0',
              };
            });
            setStats(initialStats);
          }
          
          // Cargar apuestas custom JcJ para este partido
          const bets = await getCustomPvPBetsForMatch(matchId);
          setCustomBets(bets);
        }
      } else {
        const initialStats = players.map(p => ({
          playerId: p.id, name: p.name, goals: '0', assists: '0', yellowCards: '0', redCards: '0', cagadas: '0'
        }));
        setStats(initialStats);
      }
    };
    loadData();
  }, [matchId]);
  
  const togglePlayerAttendance = (playerId) => {
    setAttendingPlayerIds(prevIds => {
      if (prevIds.includes(playerId)) {
        return prevIds.filter(id => id !== playerId);
      } else {
        return [...prevIds, playerId];
      }
    });
  };

  useEffect(() => {
    // Cuando la lista de asistentes cambie y el partido esté marcado como 'jugado',
    // actualizamos la lista de jugadores para los que se pueden introducir estadísticas.
    if (played) {
      const attendingPlayers = allPlayers.filter(p => attendingPlayerIds.includes(p.id));
      const newStats = attendingPlayers.map(p => {
        // Mantenemos las stats existentes si el jugador ya estaba en la lista
        const existingStat = stats.find(s => s.playerId === p.id);
        if (existingStat) return existingStat;
        // Añadimos un nuevo objeto de stats para el nuevo jugador
        return {
          playerId: p.id, name: p.name, goals: '0', assists: '0', yellowCards: '0', redCards: '0', cagadas: '0'
        };
      });
      setStats(newStats);
    }
  }, [attendingPlayerIds, played, allPlayers]);
  
  const handleStatChange = (playerId, field, value) => {
    const newStats = stats.map(stat => {
      if (stat.playerId === playerId) {
        return { ...stat, [field]: value };
      }
      return stat;
    });
    setStats(newStats);
  };

  const handleResolveBet = async (betId, resolution) => {
    try {
      await resolveCustomPvPBet(betId, resolution);
      // Recargar las apuestas para mostrar el cambio
      const bets = await getCustomPvPBetsForMatch(matchId);
      setCustomBets(bets);
      Alert.alert(t('alerts.success'), t('alerts.betResolved', 'La apuesta ha sido resuelta correctamente.'));
    } catch (error) {
      Alert.alert(t('alerts.error'), t('alerts.betError'));
      console.error('Error resolving bet:', error);
    }
  };

  const handleSave = async () => {
    const matchData = {
      opponent,
      date: date.toISOString(),
      played,
      emoji,
      attending: attendingPlayerIds,
      result: played ? { us: parseInt(result.us) || 0, them: parseInt(result.them) || 0 } : null,
      ...(played && youtubeUrl.trim() && { video_url: youtubeUrl.trim() }),
      // CORRECCIÓN: Convertir todas las stats a números antes de guardar
      stats: played ? stats.map(s => ({
        playerId: s.playerId,
        goals: parseInt(s.goals, 10) || 0,
        assists: parseInt(s.assists, 10) || 0,
        yellowCards: parseInt(s.yellowCards, 10) || 0,
        redCards: parseInt(s.redCards, 10) || 0,
        cagadas: parseInt(s.cagadas, 10) || 0,
      })) : [],
    };

    try {
      if (matchId) {
        await updateMatch(matchId, matchData);
        if (played) {
          await resolveBetsForMatch(matchId);
        }
        console.log('✅ Match updated successfully');
      } else {
        await addMatch(matchData);
        console.log('✅ Match created successfully');
      }
      
      // Trigger manual refresh si realtime no funciona
      console.log('🔄 Triggering manual refresh...');
      // Pequeño delay para asegurar que la BD se actualiza
      setTimeout(() => {
        navigation.goBack();
      }, 100);
      
    } catch (error) {
      console.error('❌ Error saving match:', error);
      Alert.alert(
        t('alerts.error'),
        t('alerts.saveError', `No se pudo guardar el partido. Motivo: ${error.message}`)
      );
      // NO navegar hacia atrás si hay error, para que el usuario pueda intentarlo de nuevo.
    }
  };


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.label, { color: theme.textPrimary }]}>{t('addEditMatch.opponent')}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, color: theme.textPrimary }]}
          value={opponent}
          onChangeText={setOpponent}
          placeholder={t('addEditMatch.opponentPlaceholder', 'Nombre del equipo rival')}
          placeholderTextColor={theme.textSecondary}
        />

        <Text style={[styles.label, { color: theme.textPrimary }]}>{t('addEditMatch.emoji')}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, color: theme.textPrimary }]}
          value={emoji}
          onChangeText={setEmoji}
          placeholder="⚽️"
          maxLength={2}
          placeholderTextColor={theme.textSecondary}
        />

        <Text style={[styles.label, { color: theme.textPrimary }]}>{t('addEditMatch.date')} {t('addEditMatch.time')}</Text>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.input, { backgroundColor: theme.surface }]}>
          <Text style={[styles.dateText, { color: theme.textPrimary }]}>{date.toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="datetime"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )}

        <View style={[styles.switchContainer, { backgroundColor: theme.surface }]}>
          <Text style={[styles.label, {marginTop: 0, marginBottom: 0, color: theme.textPrimary }]}>{t('addEditMatch.played')}</Text>
          <Switch
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={played ? theme.surface : theme.surface}
            ios_backgroundColor={theme.border}
            value={played}
            onValueChange={setPlayed}
          />
        </View>

        {played && (
          <>
            <Text style={[styles.subHeader, { color: theme.textPrimary }]}>{t('addEditMatch.attendingPlayers', 'Jugadores que Asistieron')}</Text>
            <View style={styles.playerSelectionContainer}>
              {allPlayers.map(player => (
                <TouchableOpacity
                  key={player.id}
                  style={[
                    styles.playerChip,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    attendingPlayerIds.includes(player.id) && { backgroundColor: theme.primary, borderColor: theme.primary }
                  ]}
                  onPress={() => togglePlayerAttendance(player.id)}
                >
                  <Image source={{ uri: player.photo }} style={styles.playerChipImage} />
                  <Text
                    style={[
                      styles.playerChipText,
                      { color: theme.textPrimary },
                      attendingPlayerIds.includes(player.id) && { color: theme.white, fontFamily: Fonts.family.bold }
                    ]}
                  >
                    {player.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.subHeader, { color: theme.textPrimary }]}>{t('addEditMatch.result', 'Resultado')}</Text>
            <View style={styles.resultContainer}>
              <TextInput
                style={[styles.resultInput, { backgroundColor: theme.surface, color: theme.textPrimary }]}
                value={result.us}
                onChangeText={val => setResult({ ...result, us: val })}
                keyboardType="numeric"
              />
              <Text style={[styles.resultSeparator, { color: theme.textSecondary }]}>-</Text>
              <TextInput
                style={[styles.resultInput, { backgroundColor: theme.surface, color: theme.textPrimary }]}
                value={result.them}
                onChangeText={val => setResult({ ...result, them: val })}
                keyboardType="numeric"
              />
            </View>

            <Text style={[styles.subHeader, { color: theme.textPrimary }]}>{t('addEditMatch.video', 'Video del Partido')}</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="videocam" size={20} color={theme.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, color: theme.textPrimary, paddingLeft: Spacing.xl }]}
                placeholder={t('addEditMatch.videoPlaceholder', 'URL del video (YouTube, Instagram, etc.)')}
                placeholderTextColor={theme.textSecondary}
                value={youtubeUrl}
                onChangeText={setYoutubeUrl}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {stats.length > 0 ? (
              <>
                <Text style={[styles.subHeader, { color: theme.textPrimary }]}>{t('addEditMatch.playerStats')}</Text>
                {stats.map(playerStat => {
                    const player = allPlayers.find(p => p.id === playerStat.playerId);
                    if (!player) return null;
                    return (
                        <View key={playerStat.playerId} style={[styles.playerStatContainer, { backgroundColor: theme.surface }]}>
                            <View style={styles.playerHeader}>
                                <Image source={{ uri: player?.photo }} style={styles.playerImage} />
                                <Text style={[styles.playerName, { color: theme.textPrimary }]}>{playerStat.name}</Text>
                            </View>
                            <View style={styles.statsRow}>
                                <StatInput icon="football" color="#3498db" value={playerStat.goals} onChangeText={val => handleStatChange(playerStat.playerId, 'goals', val)} />
                                <StatInput icon="star" color="#2ecc71" value={playerStat.assists} onChangeText={val => handleStatChange(playerStat.playerId, 'assists', val)} />
                                <StatInput icon="document-text" color="#f1c40f" value={playerStat.yellowCards} onChangeText={val => handleStatChange(playerStat.playerId, 'yellowCards', val)} />
                                <StatInput icon="document-text" color="#e74c3c" value={playerStat.redCards} onChangeText={val => handleStatChange(playerStat.playerId, 'redCards', val)} />
                                <StatInput icon="thumbs-down" color="#95a5a6" value={playerStat.cagadas} onChangeText={val => handleStatChange(playerStat.playerId, 'cagadas', val)} />
                            </View>
                        </View>
                    );
                })}
              </>
            ) : (
              <Text style={[styles.noPlayersMessage, { color: theme.textSecondary }]}>
                {t('addEditMatch.selectPlayersMessage', 'Selecciona los jugadores que asistieron para añadir estadísticas.')}
              </Text>
            )}

            {/* Sección de Apuestas Custom JcJ */}
            {customBets.length > 0 && (
              <>
                <Text style={[styles.subHeader, { color: theme.textPrimary }]}>{t('addEditMatch.customBets')}</Text>
                {customBets.map(bet => {
                  const proposer = allPlayers.find(p => p.id === bet.proposerId);
                  const accepter = allPlayers.find(p => p.id === bet.accepterId);
                  
                  return (
                    <View key={bet.id} style={[styles.betContainer, { backgroundColor: theme.surface }]}>
                      <Text style={[styles.betDescription, { color: theme.textPrimary }]}>
                        "{bet.details.custom_description}"
                      </Text>
                      <Text style={[styles.betPlayers, { color: theme.textSecondary }]}>
                        {proposer?.name} vs {accepter?.name} - {bet.amount} {t('common.coins').toLowerCase()} (x{bet.details.custom_odds})
                      </Text>
                      
                      <View style={styles.betActions}>
                        <TouchableOpacity 
                          style={[styles.resolutionButton, { backgroundColor: theme.success }]}
                          onPress={() => handleResolveBet(bet.id, 'proposer_wins')}
                        >
                          <Text style={[styles.resolutionButtonText, { color: theme.white }]}>
                            {t('addEditMatch.proposerWins')} {proposer?.name}
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[styles.resolutionButton, { backgroundColor: theme.primary }]}
                          onPress={() => handleResolveBet(bet.id, 'accepter_wins')}
                        >
                          <Text style={[styles.resolutionButtonText, { color: theme.white }]}>
                            {t('addEditMatch.accepterWins')} {accepter?.name}
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[styles.resolutionButton, { backgroundColor: theme.border }]}
                          onPress={() => handleResolveBet(bet.id, 'void')}
                        >
                          <Text style={[styles.resolutionButtonText, { color: theme.textPrimary }]}>
                            {t('addEditMatch.voidBet')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </>
            )}
          </>
        )}

        <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.success }]} onPress={handleSave}>
            <Text style={[styles.saveButtonText, { color: theme.white }]}>{t('addEditMatch.saveMatch', 'Guardar Partido')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: Spacing.md },
    label: { fontFamily: Fonts.family.bold, fontSize: Fonts.size.md, marginTop: Spacing.md, marginBottom: Spacing.xs },
    input: { padding: Spacing.md, borderRadius: 8, fontSize: Fonts.size.md, fontFamily: Fonts.family.regular, justifyContent: 'center' },
    dateText: { fontSize: Fonts.size.md, fontFamily: Fonts.family.regular },
    switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md, paddingVertical: Spacing.sm, borderRadius: 8, paddingHorizontal: Spacing.md },
    subHeader: {
        fontSize: Fonts.size.lg,
        fontFamily: Fonts.Poppins_SemiBold,
        marginTop: Spacing.lg,
        marginBottom: Spacing.md,
    },
    resultContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
    resultInput: { padding: Spacing.md, borderRadius: 8, fontSize: Fonts.size.xl, width: 80, textAlign: 'center', fontFamily: Fonts.family.bold },
    resultSeparator: { fontSize: Fonts.size.xl, marginHorizontal: Spacing.sm, fontFamily: Fonts.family.bold },
    playerSelectionContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    playerChip: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        padding: Spacing.xs,
        paddingRight: Spacing.sm,
        borderWidth: 1,
    },
    playerChipSelected: {
    },
    playerChipImage: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: Spacing.xs,
    },
    playerChipText: {
        fontFamily: Fonts.family.medium,
    },
    playerChipTextSelected: {
    },
    noPlayersMessage: {
        textAlign: 'center',
        fontFamily: Fonts.family.regular,
        marginVertical: Spacing.lg,
    },
    playerStatContainer: {
        borderRadius: 12,
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    playerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    playerImage: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: Spacing.sm,
    },
    playerName: {
        fontSize: Fonts.size.md,
        fontFamily: Fonts.Poppins_Bold, // <-- Poner en negrita
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statInputContainer: {
        alignItems: 'center',
    },
    statIcon: {
        marginBottom: Spacing.xs,
    },
    statInput: {
        width: 40,
        textAlign: 'center',
        borderBottomWidth: 2,
        paddingVertical: Spacing.xs,
        fontFamily: Fonts.Poppins_Medium,
        fontSize: Fonts.size.md,
    },
    saveButton: {
        paddingVertical: Spacing.md,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: Spacing.md,
        marginBottom: Spacing.xl,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    saveButtonText: {
        fontFamily: Fonts.Poppins_Bold,
        fontSize: Fonts.size.lg,
        fontWeight: 'bold',
    },
    betContainer: {
        borderRadius: 12,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    betDescription: {
        fontFamily: Fonts.family.bold,
        fontSize: Fonts.size.md,
        marginBottom: Spacing.sm,
        fontStyle: 'italic',
    },
    betPlayers: {
        fontFamily: Fonts.family.regular,
        fontSize: Fonts.size.sm,
        marginBottom: Spacing.md,
    },
    betActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: Spacing.sm,
    },
    resolutionButton: {
        flex: 1,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.xs,
        borderRadius: 8,
        alignItems: 'center',
    },
    resolutionButtonText: {
        fontFamily: Fonts.family.bold,
        fontSize: Fonts.size.sm,
        textAlign: 'center',
    },
});

export default AddEditMatchScreen;
