import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getMatch, getPlayers, deleteMatch } from '../api/storage';
import { Colors, Fonts, Spacing } from '../constants';

const MatchDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { matchId } = route.params;

  const [match, setMatch] = useState(null);
  const [attendingPlayers, setAttendingPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Corrected useFocusEffect
  useFocusEffect(
    useCallback(() => {
      const loadMatchDetails = async () => {
        setLoading(true);
        try {
          const matchData = await getMatch(matchId);
          setMatch(matchData);

          if (matchData && matchData.attending) {
            const allPlayers = await getPlayers();
            const players = allPlayers.filter(p => matchData.attending.includes(p.id));
            setAttendingPlayers(players);
          }
        } catch (e) {
          console.error('Failed to load match details.', e);
        } finally {
          setLoading(false);
        }
      };
      loadMatchDetails();
    }, [matchId])
  );

  const handleEdit = () => {
    navigation.navigate('AddEditMatch', { matchId });
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Partido',
      '¿Estás seguro de que quieres eliminar este partido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          onPress: async () => {
            await deleteMatch(matchId);
            navigation.goBack();
          },
          style: 'destructive',
        },
      ],
      { cancelable: false }
    );
  };

  if (loading) {
    return <ActivityIndicator style={styles.center} size="large" color={Colors.primary} />;
  }

  if (!match) {
    return (
      <View style={styles.center}>
        <Text>No se encontró el partido.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.opponentTitle}>vs {match.opponent}</Text>
            <Text style={styles.dateText}>
                {new Date(match.date).toLocaleDateString('es-ES', {weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'})}h
            </Text>
        </View>

        <FlatList
            data={attendingPlayers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
            <View style={styles.playerItem}>
                <Ionicons name="person-circle-outline" size={Fonts.size.lg} color={Colors.primary} />
                <Text style={styles.playerName}>{item.name}</Text>
            </View>
            )}
            ListHeaderComponent={
                <Text style={styles.listHeader}>Jugadores Apuntados</Text>
            }
            ListEmptyComponent={<Text style={styles.emptyText}>Nadie se ha apuntado todavía.</Text>}
            contentContainerStyle={styles.list}
        />
        
        <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.editButton]} onPress={handleEdit}>
                <Ionicons name="pencil" size={Fonts.size.md} color={Colors.surface} />
                <Text style={styles.buttonText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDelete}>
                <Ionicons name="trash" size={Fonts.size.md} color={Colors.surface} />
                <Text style={styles.buttonText}>Eliminar</Text>
            </TouchableOpacity>
        </View>
    </SafeAreaView>
  );
};

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
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  opponentTitle: {
      fontFamily: Fonts.family.bold,
      fontSize: Fonts.size.xl,
      color: Colors.textPrimary,
  },
  dateText: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  list: {
    padding: Spacing.md,
  },
  listHeader: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.lg,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.sm,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  playerName: {
    fontFamily: Fonts.family.medium,
    fontSize: Fonts.size.md,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.lg,
    fontSize: Fonts.size.md,
    fontFamily: Fonts.family.regular,
    color: Colors.textSecondary,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background
  },
  button: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.xl,
      borderRadius: 8,
  },
  editButton: {
      backgroundColor: Colors.primary,
  },
  deleteButton: {
      backgroundColor: Colors.error,
  },
  buttonText: {
      color: Colors.surface,
      fontFamily: Fonts.family.bold,
      fontSize: Fonts.size.md,
      marginLeft: Spacing.sm,
  },
});

export default MatchDetailsScreen;
