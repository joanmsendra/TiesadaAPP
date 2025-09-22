import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Fonts, Spacing } from '../constants';
import { Image } from 'expo-image';

const PlayerStatsCard = ({ player, rank }) => {
  const navigation = useNavigation();

  const getRankColor = (rank) => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return Colors.textSecondary;
  };

  return (
    <TouchableOpacity 
      style={styles.cardContainer}
      onPress={() => navigation.navigate('PlayerDetails', { playerId: player.id })}
    >
      <View style={styles.card}>
        <View style={styles.rankContainer}>
            <Text style={[styles.rank, { color: getRankColor(rank) }]}>{rank}</Text>
        </View>
        <Image source={{ uri: player.photo }} style={styles.playerImage} />
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{player.name}</Text>
          <Text style={styles.playerPosition}>{player.position}</Text>
        </View>
        <View style={styles.statsContainer}>
            <View style={styles.statItem}>
                <Ionicons name="football" size={Fonts.size.sm} color={Colors.textSecondary} />
                <Text style={styles.statText}>{player.goals}</Text>
            </View>
            <View style={styles.statItem}>
                <Ionicons name="star" size={Fonts.size.sm} color={Colors.textSecondary} />
                <Text style={styles.statText}>{player.assists}</Text>
            </View>
        </View>
        <View style={styles.mvpContainer}>
          <Text style={styles.mvpScore}>{player.mvpScore}</Text>
          <Text style={styles.mvpLabel}>MVP</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
    cardContainer: {
        paddingHorizontal: Spacing.md,
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: Colors.textPrimary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    rankContainer: {
        width: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.sm,
    },
    rank: {
        fontSize: Fonts.size.lg,
        fontFamily: Fonts.family.bold,
    },
    playerImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: Spacing.md,
    },
    playerInfo: {
        flex: 1,
    },
    playerName: {
        fontSize: Fonts.size.md,
        fontFamily: Fonts.family.bold,
        color: Colors.textPrimary,
    },
    playerPosition: {
        fontSize: Fonts.size.sm,
        fontFamily: Fonts.family.regular,
        color: Colors.textSecondary,
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: Spacing.md,
        marginTop: Spacing.xs,
    },
    statText: {
        marginLeft: Spacing.xs,
        fontSize: Fonts.size.md,
        fontFamily: Fonts.family.medium,
        color: Colors.textPrimary,
    },
    mvpContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: Spacing.sm,
    },
    mvpScore: {
        fontSize: Fonts.size.xl,
        fontFamily: Fonts.family.bold,
        color: Colors.primary,
    },
    mvpLabel: {
        fontSize: Fonts.size.xs,
        fontFamily: Fonts.family.medium,
        color: Colors.textSecondary,
    },
});

export default PlayerStatsCard;
