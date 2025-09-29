import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { updateMatchAttendance } from '../api/storage';
import { Colors, Fonts, Spacing } from '../constants';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const MatchCard = ({ match, currentUserId }) => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t } = useTranslation();
  
  // Usar el estado para la asistencia, que se puede actualizar dinámicamente
  const [isAttending, setIsAttending] = useState(false);
  
  // Obtener el contador directamente de los datos del partido (siempre actualizado)
  const attendingCount = match.attending?.length || 0;
  
  // Efecto para actualizar 'isAttending' si 'currentUserId' o 'match.attending' cambian
  useEffect(() => {
    setIsAttending(match.attending?.includes(currentUserId));
  }, [currentUserId, match.attending]);


  const matchDate = new Date(match.date);

  const handleAttendanceToggle = async () => {
    try {
      const updatedMatch = await updateMatchAttendance(match.id, currentUserId);
      if (updatedMatch) {
        setIsAttending(updatedMatch.attending.includes(currentUserId));
        // Ya no necesitamos actualizar attendingCount localmente porque
        // se obtiene directamente de match.attending, que se actualiza vía tiempo real
      } else {
        // Si updateMatchAttendance devuelve null, significa que falló
        Alert.alert(t('alerts.error'), t('alerts.attendanceError'));
      }
    } catch (error) {
      console.error('Error toggling attendance:', error);
      Alert.alert(t('alerts.error'), t('alerts.attendanceError'));
    }
  };

  const navigateToDetails = () => {
    navigation.navigate('MatchDetails', { matchId: match.id });
  };
  
  const cardStyle = [
    styles.card,
    {
      backgroundColor: theme.surface,
    },
    // Corregido: Usar la variable de estado 'isAttending' y añadir la condición 'match.played'
    (isAttending && match.played) && {
      borderLeftWidth: 5,
      borderLeftColor: theme.primary,
    },
  ];

  return (
    <TouchableOpacity onPress={navigateToDetails} style={styles.cardContainer}>
      <View style={cardStyle}>
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.emoji}>{match.emoji || '⚽️'}</Text>
            <Text style={[styles.opponent, { color: theme.textPrimary }]}>{match.opponent}</Text>
          </View>
          {match.played && (
            <View style={styles.headerRight}>
              <View style={[styles.resultContainer, { backgroundColor: theme.background }]}>
                  <Text style={[styles.result, { color: theme.textPrimary }]}>{match.result.us}</Text>
                  <Text style={[styles.resultSeparator, { color: theme.textSecondary }]}>-</Text>
                  <Text style={[styles.result, { color: theme.textPrimary }]}>{match.result.them}</Text>
              </View>
              {match?.youtube_url && (
                <View style={[styles.videoIndicator, { backgroundColor: theme.primary + '20', borderColor: theme.primary + '50'}]}>
                  <Ionicons name="play-circle" size={16} color={theme.primary} />
                </View>
              )}
            </View>
          )}
        </View>
        <View style={styles.cardBody}>
            <View style={styles.leftColumn}>
                <View style={styles.dateContainer}>
                    <Ionicons name="calendar-outline" size={Fonts.size.md} color={theme.textSecondary} />
                    <Text style={[styles.date, { color: theme.textSecondary }]}>{`${matchDate.toLocaleDateString('es-ES', {weekday: 'long', day: 'numeric', month: 'long'})} - ${matchDate.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    })}h`}</Text>
                </View>
                {!match.played && (
                    <TouchableOpacity
                        style={[styles.attendanceButton, isAttending ? styles.attending : styles.notAttending]}
                        onPress={handleAttendanceToggle}
                    >
                        <Ionicons name={isAttending ? 'checkmark-circle' : 'add-circle-outline'} size={Fonts.size.lg} color={theme.surface} />
                        <Text style={styles.attendanceButtonText}>{isAttending ? t('matchDetails.signedUp') : t('matchDetails.signUp')}</Text>
                    </TouchableOpacity>
                )}
            </View>
            {!match.played && (
                <View style={styles.rightColumn}>
                    <Text style={styles.attendanceCount}>{`${attendingCount} ${t('matchDetails.playersSignedUp')}`}</Text>
                </View>
            )}
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
        marginBottom: Spacing.md,
        shadowColor: Colors.textPrimary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    headerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    opponent: {
        fontFamily: Fonts.family.bold,
        fontSize: Fonts.size.lg,
    },
    emoji: {
        fontSize: Fonts.size.xxl,
        marginRight: Spacing.md,
    },
    resultContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: 6,
    },
    result: {
        fontFamily: Fonts.family.bold,
        fontSize: Fonts.size.lg,
    },
    resultSeparator: {
        fontFamily: Fonts.family.bold,
        marginHorizontal: Spacing.xs,
    },
    cardBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: Spacing.sm,
    },
    leftColumn: {
        flex: 1,
    },
    rightColumn: {
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.xs,
    },
    date: {
        fontFamily: Fonts.family.regular,
        fontSize: Fonts.size.sm,
        marginLeft: Spacing.sm,
    },
    attendanceContainer: {
        alignItems: 'flex-end',
    },
    attendanceActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    attendanceButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: 20,
        marginTop: Spacing.md,
        alignSelf: 'flex-start',
    },
    attending: {
        backgroundColor: Colors.success,
    },
    notAttending: {
        backgroundColor: Colors.primary,
    },
    attendanceButtonText: {
        color: Colors.surface,
        marginLeft: Spacing.sm,
        fontFamily: Fonts.family.bold,
        fontSize: Fonts.size.sm,
    },
    attendanceCount: {
        fontSize: Fonts.size.sm,
        fontFamily: Fonts.family.medium,
        color: Colors.textSecondary,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    videoIndicator: {
        borderRadius: 12,
        padding: Spacing.xs,
        borderWidth: 1,
    },
});

export default MatchCard;
