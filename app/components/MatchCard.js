import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { updateMatchAttendance } from '../api/storage';
import { Colors, Fonts, Spacing } from '../constants';

const MatchCard = ({ match, currentUserId }) => {
  const navigation = useNavigation();
  const [isAttending, setIsAttending] = useState(match.attending?.includes(currentUserId));
  const [attendingCount, setAttendingCount] = useState(match.attending?.length || 0);

  const matchDate = new Date(match.date);

  const handleAttendanceToggle = async () => {
    const updatedMatch = await updateMatchAttendance(match.id, currentUserId);
    if (updatedMatch) {
      setIsAttending(updatedMatch.attending.includes(currentUserId));
      setAttendingCount(updatedMatch.attending.length);
    }
  };

  const navigateToDetails = () => {
    navigation.navigate('MatchDetails', { matchId: match.id });
  };

  return (
    <TouchableOpacity onPress={navigateToDetails} style={styles.cardContainer}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.opponent}><Text style={styles.emoji}>{match.emoji || '⚽️'}</Text> {match.opponent}</Text>
          {match.played && (
            <View style={styles.resultContainer}>
                <Text style={styles.result}>{match.result.us}</Text>
                <Text style={styles.resultSeparator}>-</Text>
                <Text style={styles.result}>{match.result.them}</Text>
            </View>
          )}
        </View>
        <View style={styles.cardBody}>
            <View style={styles.leftColumn}>
                <View style={styles.dateContainer}>
                    <Ionicons name="calendar-outline" size={Fonts.size.md} color={Colors.textSecondary} />
                    <Text style={styles.date}>{`${matchDate.toLocaleDateString('es-ES', {weekday: 'long', day: 'numeric', month: 'long'})} - ${matchDate.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    })}h`}</Text>
                </View>
                {!match.played && (
                    <TouchableOpacity
                        style={[styles.attendanceButton, isAttending ? styles.attending : styles.notAttending]}
                        onPress={handleAttendanceToggle}
                    >
                        <Ionicons name={isAttending ? 'checkmark-circle' : 'add-circle-outline'} size={Fonts.size.lg} color={Colors.surface} />
                        <Text style={styles.attendanceButtonText}>{isAttending ? 'Apuntado' : 'Apuntarse'}</Text>
                    </TouchableOpacity>
                )}
            </View>
            {!match.played && (
                <View style={styles.rightColumn}>
                    <Text style={styles.attendanceCount}>{`${attendingCount} apuntados`}</Text>
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
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    opponent: {
        fontFamily: Fonts.family.bold,
        fontSize: Fonts.size.lg,
        color: Colors.textPrimary,
        flex: 1,
    },
    emoji: {
        fontSize: Fonts.size.lg,
    },
    resultContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: 8,
    },
    result: {
        fontFamily: Fonts.family.bold,
        fontSize: Fonts.size.lg,
        color: Colors.primary,
    },
    resultSeparator: {
        fontFamily: Fonts.family.bold,
        fontSize: Fonts.size.lg,
        color: Colors.textSecondary,
        marginHorizontal: Spacing.sm,
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
    },
    date: {
        marginLeft: Spacing.sm,
        fontFamily: Fonts.family.regular,
        fontSize: Fonts.size.sm,
        color: Colors.textSecondary,
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
});

export default MatchCard;
