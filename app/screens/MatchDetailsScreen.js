import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, SafeAreaView, TouchableOpacity, Image, ScrollView, Linking, RefreshControl } from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getMatch, deleteMatch } from '../api/storage';
import { useRealtimePlayers } from '../hooks/useRealtimeData';
import { supabase } from '../api/supabase';
import { useTheme } from '../context/ThemeContext';
import { Fonts, Spacing } from '../constants';
import { useTranslation } from 'react-i18next';

const Stat = ({ icon, value, color }) => {
    const { theme } = useTheme();
    return (
        <View style={styles.statItem}>
            <Ionicons name={icon} size={Fonts.size.sm} color={color || theme.textSecondary} />
            <Text style={[styles.statText, { color: theme.textSecondary }]}>{String(value || 0).padStart(2, '0')}</Text>
        </View>
    );
};


const MatchDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { matchId } = route.params;
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Usar hook de tiempo real para jugadores
  const { data: allPlayers } = useRealtimePlayers();

  // Configurar suscripción en tiempo real para este partido específico
  useEffect(() => {
    if (!matchId) return;

    const loadMatch = async () => {
      try {
        const matchData = await getMatch(matchId);
        setMatch(matchData);
      } catch (e) {
        console.error('Failed to load match details.', e);
      } finally {
        setLoading(false);
      }
    };

    loadMatch();

    // Suscribirse a cambios en tiempo real del partido
    const channel = supabase
      .channel(`match-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${matchId}`,
        },
        (payload) => {
          console.log('Match updated in real-time:', payload);
          setMatch(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  const onRefresh = useCallback(async () => {
    if (!matchId) return;
    setRefreshing(true);
    try {
      const matchData = await getMatch(matchId);
      setMatch(matchData);
    } catch (e) {
      console.error('Failed to refresh match details.', e);
    } finally {
      setRefreshing(false);
    }
  }, [matchId]);

  // Cargar datos iniciales
  useFocusEffect(
    useCallback(() => {
      if (!matchId) return;
      
      const loadMatch = async () => {
        try {
          const matchData = await getMatch(matchId);
          setMatch(matchData);
        } catch (e) {
          console.error('Failed to load match details.', e);
        }
      };
      
      loadMatch();
    }, [matchId])
  );

  const handleEdit = () => {
    navigation.navigate('AddEditMatch', { matchId });
  };

  const handleDelete = () => {
    Alert.alert(
      t('alerts.deleteMatch', 'Eliminar Partit'),
      t('alerts.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
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

  const handleOpenVideo = () => {
    if (match?.youtube_url) {
      Linking.openURL(match.youtube_url).catch(err => {
        Alert.alert(t('alerts.error'), t('matchDetails.videoError', 'No s\'ha pogut obrir l\'enllaç del vídeo'));
        console.error('Failed to open video URL:', err);
      });
    }
  };

  // Calcular jugadores asistentes usando datos en tiempo real
  const attendingPlayers = match && match.attending && allPlayers
    ? allPlayers.filter(player => match.attending.includes(player.id))
    : [];

  if (loading) {
    return <ActivityIndicator style={styles.center} size="large" color={theme.primary} />;
  }

  if (!match) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.textPrimary }}>{t('matchDetails.matchNotFound', 'No s\'ha trobat el partit.')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <View style={styles.headerContent}>
                <Text style={[styles.opponentTitle, { color: theme.textPrimary }]}>vs {match.opponent}</Text>
                <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                    {new Date(match.date).toLocaleDateString('es-ES', {weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'})}h
                </Text>
            </View>
            {match.played && match.video_url && (
                <TouchableOpacity style={[styles.videoButton, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]} onPress={handleOpenVideo}>
                    <Ionicons name="play-circle" size={24} color={theme.primary} />
                    <Text style={[styles.videoButtonText, { color: theme.primary }]}>{t('matchDetails.watchVideo')}</Text>
                </TouchableOpacity>
            )}
        </View>

        <FlatList
            data={attendingPlayers}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.primary}
              />
            }
            renderItem={({ item }) => {
                const playerStats = match.played && match.stats ? match.stats.find(s => s.playerId === item.id) : null;
                
                return (
                    <View style={[styles.attendeeContainer, { backgroundColor: theme.surface }]}>
                        <Image source={{ uri: item.photo }} style={styles.attendeePhoto} />
                        <View style={styles.attendeeInfo}>
                            <Text style={[styles.attendeeName, { color: theme.textPrimary }]}>{item.name}</Text>
                            {match.played && playerStats && (
                                <View style={styles.statsContainer}>
                                    <Stat icon="football" value={playerStats.goals} color="#3498db" />
                                    <Stat icon="star" value={playerStats.assists} color="#f1c40f" />
                                    <Stat icon="thumbs-down" value={playerStats.cagadas} color="#e74c3c" />
                                    <Stat icon="document" value={playerStats.yellowCards} color="#f1c40f" />
                                    <Stat icon="document" value={playerStats.redCards} color="#e74c3c" />
                                </View>
                            )}
                        </View>
                    </View>
                );
            }}
            ListHeaderComponent={
                <Text style={[styles.listHeader, { color: theme.textSecondary }]}>{match.played ? t('matchDetails.matchStatistics') : `${t('matchDetails.attendingPlayers')} (${attendingPlayers.length})`}</Text>
            }
            ListEmptyComponent={<Text style={[styles.emptyText, { color: theme.textSecondary }]}>{t('matchDetails.noAttendees')}</Text>}
            contentContainerStyle={styles.list}
        />
        
        <View style={[styles.buttonContainer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
            <TouchableOpacity style={[styles.button, styles.editButton, { backgroundColor: theme.primary }]} onPress={handleEdit}>
                <Ionicons name="pencil" size={Fonts.size.md} color={theme.white} />
                <Text style={[styles.buttonText, { color: theme.white }]}>{t('common.edit')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.deleteButton, { backgroundColor: theme.error }]} onPress={handleDelete}>
                <Ionicons name="trash" size={Fonts.size.md} color={theme.white} />
                <Text style={[styles.buttonText, { color: theme.white }]}>{t('common.delete')}</Text>
            </TouchableOpacity>
        </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  opponentTitle: {
      fontFamily: Fonts.family.bold,
      fontSize: Fonts.size.xl,
  },
  dateText: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.md,
    marginTop: Spacing.xs,
  },
  list: {
    padding: Spacing.md,
  },
  listHeader: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.lg,
    marginBottom: Spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.lg,
    fontSize: Fonts.size.md,
    fontFamily: Fonts.family.regular,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: Spacing.md,
    borderTopWidth: 1,
  },
  button: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.xl,
      borderRadius: 8,
  },
  editButton: {
  },
  deleteButton: {
  },
  buttonText: {
      fontFamily: Fonts.family.bold,
      fontSize: Fonts.size.md,
      marginLeft: Spacing.sm,
  },
  attendeeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  attendeePhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.md,
  },
  attendeeInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  attendeeName: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.md,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statText: {
    fontFamily: Fonts.family.medium,
    fontSize: Fonts.size.sm,
  },
  noAttendeesText: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.md,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
  },
  videoButtonText: {
    fontFamily: Fonts.family.medium,
    fontSize: Fonts.size.sm,
    marginLeft: Spacing.xs,
  },
});

export default MatchDetailsScreen;
