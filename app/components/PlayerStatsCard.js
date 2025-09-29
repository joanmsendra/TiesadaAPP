import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { Fonts, Spacing } from '../constants';
import { useTranslation } from 'react-i18next';

const PlayerStatsCard = ({ player, rank }) => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t } = useTranslation();
  
  // Aseguramos que los stats son números antes de calcular
  const goals = Number(player.goals) || 0;
  const assists = Number(player.assists) || 0;
  const cagadas = Number(player.cagadas) || 0;
  const mvpScore = (goals * 3) + (assists * 2) + (cagadas * -1);

  const getRankColor = (rank) => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return theme.textSecondary;
  };

  // Si no hay foto, muestra la inicial del nombre
  const renderAvatar = () => {
    if (player.photo) {
      return <Image source={{ uri: player.photo }} style={styles.playerImage} />;
    }
    return (
      <View style={[styles.playerImage, styles.avatarFallback, { backgroundColor: getRankColor(rank) }]}>
        <Text style={[styles.avatarFallbackText, { color: theme.surface }]}>{player.name.charAt(0)}</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.surface }]}
      onPress={() => navigation.navigate('PlayerDetails', { playerId: player.id })}
    >
      <View style={styles.rankContainer}>
        <Text style={[styles.rank, { color: getRankColor(rank) }]}>{rank}</Text>
      </View>
      
      {renderAvatar()}
      
      <View style={styles.playerInfo}>
        <Text style={[styles.playerName, { color: theme.textPrimary }]} numberOfLines={1}>{player.name}</Text>
        <Text style={[styles.playerPosition, { color: theme.textSecondary }]} numberOfLines={1}>{t(`positions.${player.position.toLowerCase()}`, player.position)}</Text>
        <View style={styles.statsContainer}>
            <Stat icon="football" value={goals} color="#3498db" />
            <Stat icon="star" value={assists} color="#f1c40f" />
            <Stat icon="thumbs-down" value={cagadas} color="#e74c3c" />
        </View>
      </View>

      <View style={styles.mvpContainer}>
        <Text style={[styles.mvpScore, { color: theme.primary }]}>{mvpScore}</Text>
        <Text style={[styles.mvpLabel, { color: theme.textSecondary }]}>MVP</Text>
      </View>
    </TouchableOpacity>
  );
};

const Stat = ({ icon, value, color }) => {
    const { theme } = useTheme();
    // Formatear a 2 dígitos, asegurando que no pase de 99 visualmente si hay un error
    const formattedValue = String(Math.min(value, 99)).padStart(2, '0');
    return (
        <View style={styles.statItem}>
            <Ionicons name={icon} size={Fonts.size.sm} color={color || theme.textSecondary} />
            <Text style={[styles.statText, { color: theme.textPrimary }]}>{formattedValue}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: Spacing.md,
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
    },
    rankContainer: {
        marginRight: Spacing.md,
        alignSelf: 'center',
    },
    rank: {
        fontFamily: Fonts.family.bold,
        fontSize: Fonts.size.lg,
    },
    playerImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: Spacing.md,
    },
    avatarFallback: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarFallbackText: {
      fontFamily: Fonts.family.bold,
      fontSize: Fonts.size.xl,
    },
    playerInfo: {
        flex: 1, 
        justifyContent: 'center',
    },
    playerName: {
        fontFamily: Fonts.family.bold,
        fontSize: Fonts.size.md,
        marginBottom: Spacing.xs,
    },
    playerPosition: {
        fontFamily: Fonts.family.medium,
        fontSize: Fonts.size.xs,
        marginBottom: Spacing.sm,
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: Spacing.md,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    statText: {
        fontFamily: Fonts.family.bold,
        fontSize: Fonts.size.sm,
    },
    mvpContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: Spacing.md,
        minWidth: 40,
    },
    mvpScore: {
        fontFamily: Fonts.family.bold,
        fontSize: Fonts.size.xl,
    },
    mvpLabel: {
        fontFamily: Fonts.family.regular,
        fontSize: Fonts.size.xs,
        marginTop: Spacing.xs,
    },
});

export default PlayerStatsCard;
