import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, TouchableOpacity, ScrollView, Alert, Modal, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getPlayers, uploadPlayerPhoto } from '../api/storage';
import { Colors, Fonts, Spacing } from '../constants';
import { Image } from 'expo-image';
import { useTheme } from '../context/ThemeContext';
import { themes } from '../constants/themes';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const { theme, themeName, changeTheme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const { t, i18n } = useTranslation();

  useFocusEffect(
    React.useCallback(() => {
        const loadPlayer = async () => {
            // No mostrar el spinner a pantalla completa si ya tenemos datos
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

  const handleChangePhoto = async () => {
    try {
      // Pedir permisos para acceder a la galería
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permisos necesarios', 'Necesitamos permisos para acceder a tu galería de fotos.');
        return;
      }

      // Abrir selector de imagen
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Aspecto cuadrado para foto de perfil
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        
        // Mostrar loading
        Alert.alert('Subiendo...', 'Estamos subiendo tu nueva foto de perfil.');
        
        try {
          // Subir la imagen y actualizar el perfil
          const newPhotoURL = await uploadPlayerPhoto(player.id, imageUri);
          
          // Actualizar el estado local del jugador
          setPlayer({ ...player, photo: newPhotoURL });
          
          Alert.alert('¡Éxito!', 'Tu foto de perfil se ha actualizado correctamente.');
        } catch (uploadError) {
          console.error('Error uploading photo:', uploadError);
          Alert.alert('Error', 'No se pudo subir la foto. Intenta de nuevo.');
        }
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
      Alert.alert('Error', 'Hubo un problema al seleccionar la foto.');
    }
  };

  const changeLanguage = async (languageCode) => {
    try {
      await i18n.changeLanguage(languageCode);
      setLanguageModalVisible(false);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const getLanguageName = (code) => {
    switch (code) {
      case 'ca': return t('profile.catalan');
      case 'es': return t('profile.spanish');
      default: return code;
    }
  };

  if (loading && !player) {
    return <ActivityIndicator style={[styles.center, { backgroundColor: theme.background }]} size="large" color={theme.primary} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView>
        <View style={styles.headerContainer}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>{t('profile.title')}</Text>
        </View>

        {player ? (
            <View style={[styles.profileCard, { backgroundColor: theme.surface }]}>
                <Image 
                  source={require('../../assets/images/escudo.png')} 
                  style={styles.teamLogo}
                />
                <Image source={{ uri: player.photo }} style={[styles.avatar, { borderColor: theme.surface }]} />
                <Text style={[styles.playerName, { color: theme.textPrimary }]}>{player.name}</Text>
                <Text style={[styles.playerPosition, { color: theme.textSecondary }]}>{player.position}</Text>
                 <TouchableOpacity style={[styles.photoButton, { backgroundColor: theme.primary + '20' }]} onPress={handleChangePhoto}>
                    <Ionicons name="camera-outline" size={Fonts.size.md} color={theme.primary} />
                    <Text style={[styles.photoButtonText, { color: theme.primary }]}>{t('profile.changePhoto')}</Text>
                </TouchableOpacity>
            </View>
        ) : (
            <Text style={[styles.noPlayerText, { color: theme.textSecondary }]}>No se ha seleccionado ningún jugador.</Text>
        )}

        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('profile.settings')}</Text>
            
            <TouchableOpacity 
                style={[styles.settingButton, { backgroundColor: theme.surface, borderColor: theme.border }]} 
                onPress={() => setLanguageModalVisible(true)}
            >
                <Ionicons name="language" size={Fonts.size.md} color={theme.primary} />
                <View style={styles.settingContent}>
                    <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>{t('profile.language')}</Text>
                    <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>{getLanguageName(i18n.language)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={Fonts.size.md} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.settingButton, { backgroundColor: theme.surface, borderColor: theme.border }]} 
                onPress={() => setModalVisible(true)}
            >
                <View style={[styles.themePreview, { backgroundColor: theme.primary }]} />
                <View style={styles.settingContent}>
                    <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>{t('profile.theme')}</Text>
                    <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>{themeName.charAt(0).toUpperCase() + themeName.slice(1)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={Fonts.size.md} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.settingButton, { backgroundColor: theme.surface, borderColor: theme.border }]} 
                onPress={handleLogout}
            >
                <Ionicons name="exit-outline" size={Fonts.size.md} color={theme.error} />
                <View style={styles.settingContent}>
                    <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>{t('profile.changePlayer')}</Text>
                    <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>{t('profile.changePlayerDesc')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={Fonts.size.md} color={theme.textSecondary} />
            </TouchableOpacity>
        </View>
      </ScrollView>

       <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
            <View style={[styles.modalView, { backgroundColor: theme.surface }]}>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Seleccionar Tema</Text>
                {Object.entries(themes).map(([name, themeColors]) => (
                    <TouchableOpacity
                        key={name}
                        style={styles.modalThemeOption}
                        onPress={() => {
                            changeTheme(name);
                            setModalVisible(false);
                        }}>
                        <View style={[styles.themePreview, { backgroundColor: themeColors.primary }]} />
                        <Text style={[styles.modalThemeName, { color: theme.textPrimary }]}>{name.charAt(0).toUpperCase() + name.slice(1)}</Text>
                         {themeName === name && <Ionicons name="checkmark-circle" size={Fonts.size.lg} color={theme.primary} />}
                    </TouchableOpacity>
                ))}
            </View>
        </Pressable>
      </Modal>

      {/* Modal de selección de idioma */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={languageModalVisible}
        onRequestClose={() => setLanguageModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setLanguageModalVisible(false)}>
            <View style={[styles.modalView, { backgroundColor: theme.surface }]}>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{t('profile.selectLanguage')}</Text>
                
                <TouchableOpacity
                    style={styles.modalThemeOption}
                    onPress={() => changeLanguage('ca')}>
                    <Ionicons name="language" size={Fonts.size.md} color={theme.primary} />
                    <Text style={[styles.modalThemeName, { color: theme.textPrimary }]}>{t('profile.catalan')}</Text>
                    {i18n.language === 'ca' && <Ionicons name="checkmark-circle" size={Fonts.size.lg} color={theme.primary} />}
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={styles.modalThemeOption}
                    onPress={() => changeLanguage('es')}>
                    <Ionicons name="language" size={Fonts.size.md} color={theme.primary} />
                    <Text style={[styles.modalThemeName, { color: theme.textPrimary }]}>{t('profile.spanish')}</Text>
                    {i18n.language === 'es' && <Ionicons name="checkmark-circle" size={Fonts.size.lg} color={theme.primary} />}
                </TouchableOpacity>
            </View>
        </Pressable>
      </Modal>

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
  headerContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  teamLogo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  title: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.xxl,
  },
  profileCard: {
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    padding: Spacing.xl,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      marginBottom: Spacing.md,
      borderWidth: 4,
  },
  playerName: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.xl,
  },
  playerPosition: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.lg,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
   photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
  },
  photoButtonText: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.sm,
    marginLeft: Spacing.sm,
  },
  noPlayerText: {
    textAlign: 'center',
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.md,
  },
  section: {
    marginTop: Spacing.xl,
    marginHorizontal: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.lg,
    marginBottom: Spacing.md,
  },
  themeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  settingContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  settingTitle: {
    fontFamily: Fonts.family.medium,
    fontSize: Fonts.size.md,
  },
  settingSubtitle: {
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.sm,
    marginTop: 2,
  },
  themePreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: Spacing.md,
  },
  themeButtonText: {
    flex: 1,
    fontFamily: Fonts.family.medium,
    fontSize: Fonts.size.md,
  },
  logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.md,
      margin: Spacing.md,
      borderRadius: 12,
      borderWidth: 1,
  },
  logoutButtonText: {
      fontFamily: Fonts.family.bold,
      fontSize: Fonts.size.md,
      marginLeft: Spacing.sm,
  },
   modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40, // Extra padding for safe area
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4, // Shadow points upwards
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  modalTitle: {
    marginBottom: 20,
    fontFamily: Fonts.family.bold,
    fontSize: Fonts.size.lg,
    textAlign: 'center',
  },
  modalThemeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  modalThemeName: {
    flex: 1,
    fontFamily: Fonts.family.regular,
    fontSize: Fonts.size.md,
  },
});

export default ProfileScreen;
