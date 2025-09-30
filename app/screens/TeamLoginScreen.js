import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Linking, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../api/supabase';
import { useTheme } from '../context/ThemeContext';
import { Fonts, Spacing } from '../constants';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const TeamLoginScreen = () => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const navigation = useNavigation();
    
    const [showPasswordInput, setShowPasswordInput] = useState(false);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!password) {
            Alert.alert(t('alerts.error'), t('teamLogin.enterPassword', 'Introdueix la contrasenya de l\'equip.'));
            return;
        }
        setLoading(true);
        try {
            const { data: teamId, error } = await supabase.rpc('verify_team_password', {
                team_name: 'Tiesada FC',
                team_password: password
            });

            if (error) throw error;

            if (teamId) {
                await AsyncStorage.setItem('selectedTeamId', teamId);
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'PlayerSelection' }],
                });
            } else {
                Alert.alert(t('alerts.error'), t('teamLogin.incorrectPassword', 'Contrasenya incorrecta. Torna a intentar-ho.'));
            }
        } catch (error) {
            console.error('Team login error:', error);
            Alert.alert(t('alerts.error'), t('teamLogin.loginError', 'Hi ha hagut un error durant l\'inici de sessió.'));
        } finally {
            setLoading(false);
        }
    };

    const handleContact = () => {
        const email = 'jmedinasendra@gmail.com';
        const subject = t('teamLogin.contactSubject', 'Inclusió del meu equip a l\'app TiesadaFC');
        const body = t('teamLogin.contactBody', 'Hola, m\'agradaria sol·licitar la inclusió del meu equip a la vostra aplicació. Detalls de l\'equip:');
        Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.content}>
                <Text style={[styles.mainTitle, { color: theme.textPrimary }]}>{t('teamLogin.welcome', 'Benvingut/da')}</Text>
                
                <TouchableOpacity 
                    style={[styles.teamButton, { backgroundColor: theme.surface, borderColor: theme.primary }]} 
                    onPress={() => setShowPasswordInput(true)}
                >
                    <Image source={require('../../assets/images/escudo.png')} style={styles.teamLogo} />
                    <Text style={[styles.teamButtonText, { color: theme.textPrimary }]}>Tiesada FC</Text>
                </TouchableOpacity>

                {showPasswordInput && (
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
                            placeholder={t('teamLogin.passwordPlaceholder', 'Contrasenya de l\'equip')}
                            placeholderTextColor={theme.textSecondary}
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            autoCapitalize="none"
                        />
                        {loading ? (
                            <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: Spacing.md }} />
                        ) : (
                            <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleLogin}>
                                <Text style={[styles.buttonText, { color: theme.white }]}>{t('teamLogin.enter', 'Entrar')}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {!showPasswordInput && (
                    <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
                        <Ionicons name="add-circle-outline" size={24} color={theme.textSecondary} />
                        <Text style={[styles.contactText, { color: theme.textSecondary }]}>{t('teamLogin.addYourTeam', 'Vols afegir el teu equip?')}</Text>
                        <Text style={[styles.contactLink, { color: theme.primary }]}>{t('teamLogin.contactUs', 'Contacta\'ns')}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    content: {
        padding: Spacing.xl,
        alignItems: 'center',
    },
    mainTitle: {
        fontFamily: Fonts.family.bold,
        fontSize: Fonts.size.xxl,
        marginBottom: Spacing.xl,
    },
    teamButton: {
        width: '100%',
        padding: Spacing.lg,
        borderRadius: 12,
        borderWidth: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    teamLogo: {
        width: 40,
        height: 40,
        marginRight: Spacing.md,
    },
    teamButtonText: {
        fontFamily: Fonts.family.bold,
        fontSize: Fonts.size.xl,
    },
    passwordContainer: {
        width: '100%',
        marginTop: Spacing.md,
    },
    input: {
        width: '100%',
        padding: Spacing.md,
        borderRadius: 8,
        borderWidth: 1,
        fontFamily: Fonts.family.regular,
        fontSize: Fonts.size.md,
        marginBottom: Spacing.lg,
    },
    button: {
        width: '100%',
        padding: Spacing.lg,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        fontFamily: Fonts.family.bold,
        fontSize: Fonts.size.lg,
    },
    contactButton: {
        marginTop: Spacing.xxl,
        alignItems: 'center',
    },
    contactText: {
        fontFamily: Fonts.family.regular,
        fontSize: Fonts.size.md,
        marginTop: Spacing.sm,
    },
    contactLink: {
        fontFamily: Fonts.family.bold,
        fontSize: Fonts.size.md,
        marginTop: Spacing.xs,
    },
});

export default TeamLoginScreen;
