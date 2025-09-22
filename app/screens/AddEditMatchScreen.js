import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Platform, SafeAreaView
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getMatch, addMatch, updateMatch, getPlayers, resolveBetsForMatch } from '../api/storage';
import { Colors, Fonts, Spacing } from '../constants';
import { Ionicons } from '@expo/vector-icons';

const AddEditMatchScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const matchId = route.params?.matchId;

  const [opponent, setOpponent] = useState('');
  const [emoji, setEmoji] = useState('⚽️');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [played, setPlayed] = useState(false);
  const [result, setResult] = useState({ us: '0', them: '0' });
  const [stats, setStats] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);

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
          if (match.played) {
            setResult({ us: match.result.us.toString(), them: match.result.them.toString() });
            
            const initialStats = players.map(p => {
              const stat = match.stats?.find(s => s.playerId === p.id);
              return {
                playerId: p.id,
                name: p.name,
                goals: stat?.goals?.toString() || '0',
                assists: stat?.assists?.toString() || '0',
                yellowCards: stat?.yellowCards?.toString() || '0',
                redCards: stat?.redCards?.toString() || '0',
              };
            });
            setStats(initialStats);
          } else {
            const initialStats = players.map(p => ({
              playerId: p.id, name: p.name, goals: '0', assists: '0', yellowCards: '0', redCards: '0'
            }));
            setStats(initialStats);
          }
        }
      } else {
        const initialStats = players.map(p => ({
          playerId: p.id, name: p.name, goals: '0', assists: '0', yellowCards: '0', redCards: '0'
        }));
        setStats(initialStats);
      }
    };
    loadData();
  }, [matchId]);
  
  const handleStatChange = (playerId, field, value) => {
    const newStats = stats.map(stat => {
      if (stat.playerId === playerId) {
        return { ...stat, [field]: value };
      }
      return stat;
    });
    setStats(newStats);
  };

  const handleSave = async () => {
    const matchData = {
      opponent,
      date: date.toISOString(),
      played,
      emoji,
      result: played ? { us: parseInt(result.us) || 0, them: parseInt(result.them) || 0 } : null,
      stats: played ? stats.map(s => ({
        playerId: s.playerId,
        goals: parseInt(s.goals) || 0,
        assists: parseInt(s.assists) || 0,
        yellowCards: parseInt(s.yellowCards) || 0,
        redCards: parseInt(s.redCards) || 0,
      })).filter(s => s.goals > 0 || s.assists > 0 || s.yellowCards > 0 || s.redCards > 0) : [],
    };

    if (matchId) {
      await updateMatch(matchId, matchData);
      if (played) {
        await resolveBetsForMatch(matchId);
      }
    } else {
      await addMatch(matchData);
    }
    navigation.goBack();
  };

  const StatInput = ({ value, onChangeText, placeholder, icon, color }) => (
    <View style={styles.statInputContainer}>
      <Ionicons name={icon} size={Fonts.size.md} color={color} />
      <TextInput
        style={styles.statInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        placeholder={placeholder}
        placeholderTextColor={Colors.textSecondary}
      />
    </View>
  );

  return (
    <SafeAreaView style={{flex: 1}}>
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Oponente</Text>
      <TextInput
        style={styles.input}
        value={opponent}
        onChangeText={setOpponent}
        placeholder="Nombre del equipo rival"
        placeholderTextColor={Colors.textSecondary}
      />

      <Text style={styles.label}>Emoji del Partido</Text>
      <TextInput
        style={styles.input}
        value={emoji}
        onChangeText={setEmoji}
        placeholder="⚽️"
        maxLength={2}
        placeholderTextColor={Colors.textSecondary}
      />

      <Text style={styles.label}>Fecha y Hora</Text>
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
        <Text style={styles.dateText}>{date.toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}</Text>
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

      <View style={styles.switchContainer}>
        <Text style={[styles.label, {marginTop: 0, marginBottom: 0}]}>¿Partido jugado?</Text>
        <Switch
          trackColor={{ false: Colors.border, true: Colors.primary }}
          thumbColor={played ? Colors.surface : Colors.surface}
          ios_backgroundColor={Colors.border}
          value={played}
          onValueChange={setPlayed}
        />
      </View>

      {played && (
        <>
          <Text style={styles.subHeader}>Resultado</Text>
          <View style={styles.resultContainer}>
            <TextInput
              style={styles.resultInput}
              value={result.us}
              onChangeText={val => setResult({ ...result, us: val })}
              keyboardType="numeric"
            />
            <Text style={styles.resultSeparator}>-</Text>
            <TextInput
              style={styles.resultInput}
              value={result.them}
              onChangeText={val => setResult({ ...result, them: val })}
              keyboardType="numeric"
            />
          </View>

          <Text style={styles.subHeader}>Estadísticas</Text>
          {stats.map(playerStat => (
            <View key={playerStat.playerId} style={styles.playerStatContainer}>
              <Text style={styles.playerName}>{playerStat.name}</Text>
              <View style={styles.statsRow}>
                <StatInput icon="football" color="#3498db" value={playerStat.goals} onChangeText={val => handleStatChange(playerStat.playerId, 'goals', val)} />
                <StatInput icon="star" color="#2ecc71" value={playerStat.assists} onChangeText={val => handleStatChange(playerStat.playerId, 'assists', val)} />
                <StatInput icon="albums" color="#f1c40f" value={playerStat.yellowCards} onChangeText={val => handleStatChange(playerStat.playerId, 'yellowCards', val)} />
                <StatInput icon="albums" color="#e74c3c" value={playerStat.redCards} onChangeText={val => handleStatChange(playerStat.playerId, 'redCards', val)} />
              </View>
            </View>
          ))}
        </>
      )}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Guardar Partido</Text>
        </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: Spacing.md, backgroundColor: Colors.background },
    label: { fontFamily: Fonts.family.bold, fontSize: Fonts.size.md, marginTop: Spacing.md, marginBottom: Spacing.xs, color: Colors.textPrimary },
    input: { backgroundColor: Colors.surface, padding: Spacing.md, borderRadius: 8, fontSize: Fonts.size.md, fontFamily: Fonts.family.regular, color: Colors.textPrimary, justifyContent: 'center' },
    dateText: { fontSize: Fonts.size.md, fontFamily: Fonts.family.regular, color: Colors.textPrimary },
    switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.surface, borderRadius: 8, paddingHorizontal: Spacing.md },
    subHeader: { fontFamily: Fonts.family.bold, fontSize: Fonts.size.lg, marginTop: Spacing.lg, marginBottom: Spacing.md, color: Colors.primary, textAlign: 'center' },
    resultContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
    resultInput: { backgroundColor: Colors.surface, padding: Spacing.md, borderRadius: 8, fontSize: Fonts.size.xl, width: 80, textAlign: 'center', fontFamily: Fonts.family.bold, color: Colors.textPrimary },
    resultSeparator: { fontSize: Fonts.size.xl, marginHorizontal: Spacing.sm, fontFamily: Fonts.family.bold, color: Colors.textSecondary },
    playerStatContainer: { backgroundColor: Colors.surface, padding: Spacing.md, borderRadius: 8, marginBottom: Spacing.sm, shadowColor: Colors.textPrimary, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
    playerName: { fontSize: Fonts.size.md, fontFamily: Fonts.family.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
    statInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        paddingHorizontal: Spacing.sm,
        borderRadius: 6,
        flex: 1,
        marginHorizontal: Spacing.xs,
    },
    statInput: {
        fontFamily: Fonts.family.medium,
        fontSize: Fonts.size.md,
        color: Colors.textPrimary,
        padding: Spacing.sm,
        flex: 1,
        textAlign: 'center',
    },
    saveButton: {
        backgroundColor: Colors.primary,
        padding: Spacing.lg,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    saveButtonText: {
        color: Colors.surface,
        fontFamily: Fonts.family.bold,
        fontSize: Fonts.size.lg,
    },
  });

export default AddEditMatchScreen;
