import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SectionList, ActivityIndicator, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { getMatches } from '../api/storage';
import MatchCard from '../components/MatchCard';
import { Colors, Fonts, Spacing } from '../constants';

const ScheduleScreen = () => {
  const navigation = useNavigation();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Corrected useFocusEffect
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        if (matches.length === 0) {
            setLoading(true);
        }
        try {
          const storedMatches = await getMatches();
          storedMatches.sort((a, b) => new Date(a.date) - new Date(b.date));
          setMatches(storedMatches);
          
          const userId = await AsyncStorage.getItem('selectedPlayerId');
          setCurrentUserId(userId);
        } catch (e) {
          console.error('Failed to load data.', e);
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }, [])
  );

  if (loading) {
    return <ActivityIndicator style={styles.center} size="large" color={Colors.primary} />;
  }

  const upcomingMatches = matches.filter(m => !m.played);
  const pastMatches = matches.filter(m => m.played).reverse();

  const sections = [
    { title: 'Próximos Partidos', data: upcomingMatches },
    { title: 'Partidos Anteriores', data: pastMatches },
  ].filter(s => s.data.length > 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Calendario</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddEditMatch')}>
          <Ionicons name="add-circle" size={36} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MatchCard match={item} currentUserId={currentUserId} />}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        contentContainerStyle={styles.listContent}
      />
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.xxl,
    color: Colors.textPrimary,
  },
  sectionHeader: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.lg,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingBottom: Spacing.lg,
  }
});

export default ScheduleScreen;
