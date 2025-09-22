import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getPlayers } from '../api/storage';
import { Colors, Fonts, Spacing } from '../constants';
import { Image } from 'expo-image';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
        const loadPlayer = async () => {
            if (!player) {
                setLoading(true);
            }
            try {
              const playerId = await AsyncStorage.getItem('selectedPlayerId');
              if (playerId) {
                const allPlayers = await getPlayers();
                const currentPlayer = allPlayers.find(p => p.id === playerId);
                setPlayer(currentPlayer);
              }
            } catch (e) {
              console.error('Failed to load player data.', e);
            } finally {
              setLoading(false);
            }
          };
      loadPlayer();
    }, [])
  );

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('selectedPlayerId');
      navigation.reset({
        index: 0,
        routes: [{ name: 'PlayerSelection' }],
      });
    } catch (e) {
      console.error('Failed to logout.', e);
    }
  };

  if (loading) {
    return <ActivityIndicator style={styles.center} size="large" color={Colors.primary} />;
  }

  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
            <Text style={styles.title}>Mi Perfil</Text>
        </View>

        {player ? (
            <View style={styles.profileCard}>
                <Image source={{ uri: player.photo }} style={styles.avatar} />
                <Text style={styles.playerName}>{player.name}</Text>
                <Text style={styles.playerPosition}>{player.position}</Text>
            </View>
        ) : (
            <Text style={styles.noPlayerText}>No se ha seleccionado ningún jugador.</Text>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="exit-outline" size={Fonts.size.lg} color={Colors.error} />
            <Text style={styles.logoutButtonText}>Cambiar de jugador</Text>
        </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
  },
  title: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.xxl,
    color: Colors.textPrimary,
  },
  profileCard: {
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: 16,
    shadowColor: Colors.textPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: Colors.primary,
      marginBottom: Spacing.lg,
      borderWidth: 3,
      borderColor: Colors.surface,
  },
  avatarLetter: {
      fontFamily: Fonts.family.bold,
      fontSize: 60,
      color: Colors.surface,
  },
  playerName: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.xl,
    color: Colors.textPrimary,
  },
  playerPosition: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.lg,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  noPlayerText: {
    textAlign: 'center',
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.md,
    color: Colors.textSecondary,
  },
  logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.md,
      margin: Spacing.md,
      backgroundColor: Colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Colors.border,
  },
  logoutButtonText: {
      fontFamily: Fonts.family.bold,
      fontSize: Fonts.size.md,
      color: Colors.error,
      marginLeft: Spacing.sm,
  },
});

export default ProfileScreen;
