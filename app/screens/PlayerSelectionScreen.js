import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPlayers } from '../api/storage';
import { Colors, Fonts, Spacing } from '../constants';
import { Image } from 'expo-image';

const PlayerSelectionScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    const checkPlayer = async () => {
      try {
        const playerId = await AsyncStorage.getItem('selectedPlayerId');
        if (playerId) {
          navigation.replace('Main');
        } else {
          const storedPlayers = await getPlayers();
          setPlayers(storedPlayers);
          setLoading(false);
        }
      } catch (e) {
        console.error('Failed to load data.', e);
        setLoading(false);
      }
    };

    checkPlayer();
  }, [navigation]);

  const handleSelectPlayer = async (playerId) => {
    try {
      await AsyncStorage.setItem('selectedPlayerId', playerId);
      navigation.replace('Main');
    } catch (e) {
      console.error('Failed to save player id.', e);
    }
  };

  if (loading) {
    return <ActivityIndicator style={styles.container} size="large" color={Colors.primary} />;
  }

  const renderPlayer = ({ item }) => (
    <TouchableOpacity style={styles.playerButton} onPress={() => handleSelectPlayer(item.id)}>
      <Image source={{ uri: item.photo }} style={styles.playerImage} />
      <Text style={styles.playerButtonText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>¿Qué jugador eres?</Text>
        <Text style={styles.subtitle}>Selecciona tu perfil para continuar</Text>
      </View>
      <FlatList
        data={players}
        renderItem={renderPlayer}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    width: '100%',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.xxl,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  list: {
    paddingHorizontal: Spacing.md,
  },
  playerButton: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: 12,
    marginBottom: Spacing.md,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    alignItems: 'center',
    margin: Spacing.sm,
    width: (Dimensions.get('window').width / 2) - (Spacing.md + Spacing.sm * 2),
  },
  playerImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: Spacing.md,
  },
  playerButtonText: {
    fontFamily: Fonts.family.medium,
    fontSize: Fonts.size.lg,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
});

export default PlayerSelectionScreen;
