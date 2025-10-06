import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

const AuthLoadingScreen = () => {
    const navigation = useNavigation();
    const { theme } = useTheme();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const teamId = await AsyncStorage.getItem('selectedTeamId');
                const playerId = await AsyncStorage.getItem('selectedPlayerId');

                if (teamId && playerId) {
                    // Si ya ha iniciado sesión y seleccionado jugador, va a la app principal
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Main' }],
                    });
                } else if (teamId) {
                    // Si ha seleccionado equipo pero no jugador, va a la selección de jugador
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'PlayerSelection' }],
                    });
                } else {
                    // Si no, va al login del equipo
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'TeamLogin' }],
                    });
                }
            } catch (e) {
                console.error('Failed to load auth state', e);
                // En caso de error, ir a la pantalla de login por seguridad
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'TeamLogin' }],
                });
            }
        };

        checkAuth();
    }, [navigation]);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ActivityIndicator size="large" color={theme.primary} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default AuthLoadingScreen;



