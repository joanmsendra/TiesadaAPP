import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Dimensions, TouchableOpacity, Alert, Modal, ScrollView } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { Image } from 'expo-image';

import { getPlayers, getGlobalLineupPositions, upsertGlobalLineupPosition, deleteGlobalLineupPosition, addDrawingStroke, getDrawingStrokes } from '../api/storage';
import { supabase } from '../api/supabase';
import { useTheme } from '../context/ThemeContext';
import { Fonts, Spacing } from '../constants';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Componente para una ficha de jugador arrastrable
const DraggablePlayerToken = ({ player, initialX, initialY, onDragEnd, fieldLayout }) => {
    const { theme } = useTheme();
    const isPressed = useSharedValue(false);
    const offsetX = useSharedValue(initialX);
    const offsetY = useSharedValue(initialY);

    // Actualizar posición si cambia desde el servidor (otro usuario la movió)
    useEffect(() => {
        offsetX.value = withSpring(initialX);
        offsetY.value = withSpring(initialY);
    }, [initialX, initialY]);

    const pan = Gesture.Pan()
        .onBegin(() => {
            isPressed.value = true;
        })
        .onChange((event) => {
            offsetX.value = initialX + event.translationX;
            offsetY.value = initialY + event.translationY;
        })
        .onFinalize(() => {
            isPressed.value = false;
            // Asegurarse de que el token no se salga de los límites del campo
            const newX = Math.max(0, Math.min(offsetX.value, fieldLayout.width - 60));
            const newY = Math.max(0, Math.min(offsetY.value, fieldLayout.height - 80));
            
            offsetX.value = withSpring(newX);
            offsetY.value = withSpring(newY);

            runOnJS(onDragEnd)({
                playerId: player.id,
                x: newX,
                y: newY,
            });
        })
        .runOnJS(true);

    const animatedStyles = useAnimatedStyle(() => ({
        transform: [
            { translateX: offsetX.value },
            { translateY: offsetY.value },
            { scale: withSpring(isPressed.value ? 1.2 : 1) },
        ],
        zIndex: isPressed.value ? 100 : 10,
    }));

    return (
        <GestureDetector gesture={pan}>
            <Animated.View style={[styles.position, animatedStyles]}>
                <View style={[styles.playerCircle, { backgroundColor: 'rgba(0,0,0,0.3)', borderColor: theme.white }]}>
                    <Image source={{ uri: player.photo }} style={styles.playerImage} />
                </View>
                <Text style={[styles.playerNameText, { color: theme.white }]}>{player.name}</Text>
            </Animated.View>
        </GestureDetector>
    );
};


const FieldLines = ({ theme }) => (
    <>
        <View style={[styles.halfwayLine, { backgroundColor: theme.white + '80' }]} />
        <View style={[styles.centerCircle, { borderColor: theme.white + '80' }]} />
        <View style={[styles.centerSpot, { backgroundColor: theme.white + '80' }]} />
        <View style={[styles.penaltyBox, { bottom: -2, borderColor: theme.white + '80' }]} />
        <View style={[styles.penaltyBox, { top: -2, transform: [{ rotate: '180deg' }], borderColor: theme.white + '80' }]} />
    </>
);

const LineupScreen = () => {
    const { theme } = useTheme();
    const { t } = useTranslation();

    const [players, setPlayers] = useState([]);
    const [playerPositions, setPlayerPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fieldLayout, setFieldLayout] = useState({ width: 0, height: 0, x: 0, y: 0 });
    const [isPlayerModalVisible, setPlayerModalVisible] = useState(false);
    
    // Estados para dibujo
    const [drawingStrokes, setDrawingStrokes] = useState([]);
    const [currentStroke, setCurrentStroke] = useState([]);

    // Cargar jugadores y posiciones iniciales
    useFocusEffect(
        useCallback(() => {
            const loadData = async () => {
                setLoading(true);
                try {
                    const allPlayers = await getPlayers();
                    const positions = await getGlobalLineupPositions();
                    const strokes = await getDrawingStrokes();
                    setPlayers(allPlayers);
                    setPlayerPositions(positions);
                    setDrawingStrokes(strokes);
                } catch (e) {
                    console.error('Failed to load lineup data', e);
                    Alert.alert('Error', 'No se pudieron cargar los datos de la alineación.');
                } finally {
                    setLoading(false);
                }
            };
            loadData();
        }, [])
    );
    
    // Suscripción a cambios en tiempo real
    useEffect(() => {
        const channel = supabase
            .channel('global_lineup_positions')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'global_lineup_positions' },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setPlayerPositions(current => {
                            // Remover cualquier versión temporal del mismo jugador y añadir la real
                            const filtered = current.filter(p => p.player_id !== payload.new.player_id);
                            return [...filtered, payload.new];
                        });
                    } else if (payload.eventType === 'UPDATE') {
                        setPlayerPositions(current => {
                            // Remover temporales y actualizar con la versión real
                            const filtered = current.filter(p => p.player_id !== payload.new.player_id);
                            return [...filtered, payload.new];
                        });
                    } else if (payload.eventType === 'DELETE') {
                        setPlayerPositions(current => current.filter(p => p.player_id !== payload.old.player_id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Suscripción para trazos de dibujo
    useEffect(() => {
        const drawingChannel = supabase
            .channel('drawing_strokes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'drawing_strokes' },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setDrawingStrokes(current => [...current, payload.new]);
                    } else if (payload.eventType === 'DELETE') {
                        setDrawingStrokes(current => current.filter(s => s.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(drawingChannel);
        };
    }, []);

    // Auto-borrado progresivo de trazos antiguos
    useEffect(() => {
        const cleanupInterval = setInterval(async () => {
            try {
                // Eliminar trazos más antiguos de 5 segundos de la base de datos
                const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();
                const { error } = await supabase
                    .from('drawing_strokes')
                    .delete()
                    .lt('created_at', fiveSecondsAgo);
                
                if (error) {
                    console.error('Error cleaning old strokes:', error);
                }
            } catch (error) {
                console.error('Failed to clean old strokes:', error);
            }
        }, 1000); // Comprobar cada segundo

        return () => clearInterval(cleanupInterval);
    }, []);


    const handleDragEnd = async ({ playerId, x, y }) => {
        // Convertir píxeles a porcentajes del campo
        const percentX = (x / fieldLayout.width) * 100;
        const percentY = (y / fieldLayout.height) * 100;
        
        // Actualizar el estado local inmediatamente para una respuesta rápida
        setPlayerPositions(current => {
            const existing = current.find(p => p.player_id === playerId);
            if (existing) {
                return current.map(p => (p.player_id === playerId ? { ...p, position_x: percentX, position_y: percentY } : p));
            }
            // Si no existe, añadirlo con un ID único
            return [...current, { 
                player_id: playerId, 
                position_x: percentX, 
                position_y: percentY, 
                id: `temp-${playerId}-${Date.now()}` 
            }]; 
        });
        
        await upsertGlobalLineupPosition(playerId, percentX, percentY);
    };
    
    const handleAddPlayer = async (player) => {
        // Añadir jugador en una posición aleatoria inicial (en porcentajes)
        if (fieldLayout.width > 0 && fieldLayout.height > 0) {
            const percentX = Math.random() * 80 + 10; // Entre 10% y 90%
            const percentY = Math.random() * 80 + 10; // Entre 10% y 90%
            
            setPlayerPositions(current => [...current, { 
                player_id: player.id, 
                position_x: percentX, 
                position_y: percentY, 
                id: `temp-${player.id}-${Date.now()}` 
            }]);
            
            await upsertGlobalLineupPosition(player.id, percentX, percentY);
        }
    };

    const handleRemovePlayer = async (playerId) => {
        // Optimistic update: remove from state immediately
        setPlayerPositions(current => current.filter(p => p.player_id !== playerId));
        await deleteGlobalLineupPosition(playerId);
    };

    // Funciones de dibujo
    const handleDrawingStart = (x, y) => {
        // Verificar si se está tocando cerca de algún jugador
        const isNearPlayer = playerPositions.some(pos => {
            const pixelX = (pos.position_x / 100) * fieldLayout.width;
            const pixelY = (pos.position_y / 100) * fieldLayout.height;
            const distance = Math.sqrt(Math.pow(x - pixelX, 2) + Math.pow(y - pixelY, 2));
            return distance < 30; // Radio de 30px alrededor del jugador
        });
        
        if (isNearPlayer) return; // No dibujar si está cerca de un jugador
        
        const percentX = (x / fieldLayout.width) * 100;
        const percentY = (y / fieldLayout.height) * 100;
        setCurrentStroke([{ x: percentX, y: percentY }]);
    };

    const handleDrawingMove = (x, y) => {
        if (currentStroke.length === 0) return;
        const percentX = (x / fieldLayout.width) * 100;
        const percentY = (y / fieldLayout.height) * 100;
        setCurrentStroke(current => [...current, { x: percentX, y: percentY }]);
    };

    const handleDrawingEnd = async () => {
        if (currentStroke.length < 2) {
            setCurrentStroke([]);
            return;
        }
        
        // Guardar el trazo en la base de datos
        await addDrawingStroke(currentStroke, theme.primary, 3);
        setCurrentStroke([]);
    };
    
    if (loading) {
        return <ActivityIndicator style={[styles.center, { backgroundColor: theme.background }]} size="large" color={theme.primary} />;
    }
    
    // Jugadores que ya están en el campo
    const playersOnFieldIds = playerPositions.map(p => p.player_id);
    const playersOnField = players.filter(p => playersOnFieldIds.includes(p.id));
    const availablePlayers = players.filter(p => !playersOnFieldIds.includes(p.id));

    // Gesto de dibujo
    const drawingGesture = Gesture.Pan()
        .onStart((e) => {
            handleDrawingStart(e.x, e.y);
        })
        .onUpdate((e) => {
            handleDrawingMove(e.x, e.y);
        })
        .onEnd(() => {
            handleDrawingEnd();
        })
        .runOnJS(true);

    // Función para convertir stroke a path SVG
    const strokeToPath = (stroke) => {
        if (!stroke || stroke.length < 2) return '';
        
        const points = stroke.map(point => ({
            x: (point.x / 100) * fieldLayout.width,
            y: (point.y / 100) * fieldLayout.height
        }));
        
        let path = `M${points[0].x},${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            path += ` L${points[i].x},${points[i].y}`;
        }
        return path;
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={[styles.header, { backgroundColor: theme.surface + '20' }]}>
                    <Text style={[styles.title, { color: theme.textPrimary }]}>{t('lineup.title')}</Text>
                    <Text style={[styles.subTitle, { color: theme.textSecondary }]}>{t('lineup.subtitle')}</Text>
                </View>

                <View style={styles.fieldContainer}>
                    <GestureDetector gesture={drawingGesture}>
                        <View 
                            style={[styles.field, { backgroundColor: theme.success, borderColor: theme.primary + '80' }]}
                            onLayout={(event) => setFieldLayout(event.nativeEvent.layout)}
                        >
                            <FieldLines theme={theme} />
                            
                            {/* SVG para dibujos */}
                            {fieldLayout.width > 0 && (
                                <Svg 
                                    style={StyleSheet.absoluteFillObject} 
                                    width={fieldLayout.width} 
                                    height={fieldLayout.height}
                                >
                                    {/* Trazos guardados */}
                                    {drawingStrokes.map((stroke) => (
                                        <Path
                                            key={stroke.id}
                                            d={strokeToPath(stroke.stroke_data)}
                                            stroke={stroke.color}
                                            strokeWidth={stroke.width}
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    ))}
                                    
                                    {/* Trazo actual */}
                                    {currentStroke.length > 1 && (
                                        <Path
                                            d={strokeToPath(currentStroke)}
                                            stroke={theme.primary}
                                            strokeWidth={3}
                                            fill="none"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    )}
                                </Svg>
                            )}
                            
                            {fieldLayout.width > 0 && playerPositions.map((pos, index) => {
                                const player = players.find(p => p.id === pos.player_id);
                                if (!player) return null;
                                
                                // Convertir porcentajes a píxeles para la posición actual
                                const pixelX = (pos.position_x / 100) * fieldLayout.width;
                                const pixelY = (pos.position_y / 100) * fieldLayout.height;
                                
                                return (
                                    <DraggablePlayerToken
                                        key={`player-${pos.player_id}-${pos.id || index}`}
                                        player={player}
                                        initialX={pixelX}
                                        initialY={pixelY}
                                        onDragEnd={handleDragEnd}
                                        fieldLayout={fieldLayout}
                                    />
                                );
                            })}
                        </View>
                    </GestureDetector>
                </View>

                <TouchableOpacity style={[styles.fab, { backgroundColor: theme.primary }]} onPress={() => setPlayerModalVisible(true)}>
                    <Ionicons name="people" size={30} color={theme.white} />
                </TouchableOpacity>

                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={isPlayerModalVisible}
                    onRequestClose={() => setPlayerModalVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{t('lineup.managePlayersTitle')}</Text>
                            
                            <ScrollView>
                                <Text style={[styles.modalSectionTitle, { color: theme.textSecondary }]}>{t('lineup.onField')}</Text>
                                {playersOnField.map(player => (
                                    <View key={player.id} style={styles.modalPlayerRow}>
                                        <Text style={[styles.modalPlayerName, { color: theme.textPrimary }]}>{player.name}</Text>
                                        <TouchableOpacity onPress={() => handleRemovePlayer(player.id)}>
                                            <Ionicons name="remove-circle" size={24} color={theme.error} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                {playersOnField.length === 0 && <Text style={{color: theme.textSecondary, textAlign: 'center', marginBottom: 20}}>{t('lineup.noPlayersOnField')}</Text>}

                                <Text style={[styles.modalSectionTitle, { color: theme.textSecondary, marginTop: 20 }]}>{t('lineup.bench')}</Text>
                                {availablePlayers.map(player => (
                                    <View key={player.id} style={styles.modalPlayerRow}>
                                        <Text style={[styles.modalPlayerName, { color: theme.textPrimary }]}>{player.name}</Text>
                                        <TouchableOpacity onPress={() => handleAddPlayer(player)}>
                                            <Ionicons name="add-circle" size={24} color={theme.success} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                {availablePlayers.length === 0 && <Text style={{color: theme.textSecondary, textAlign: 'center'}}>{t('lineup.noPlayersOnBench')}</Text>}
                            </ScrollView>

                            <TouchableOpacity style={[styles.closeButton, { backgroundColor: theme.primary }]} onPress={() => setPlayerModalVisible(false)}>
                                <Text style={styles.closeButtonText}>{t('common.close')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

            </SafeAreaView>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { paddingHorizontal: 20, paddingVertical: 10 },
    title: { fontSize: 32, fontFamily: Fonts.family.bold },
    subTitle: { fontSize: 18, fontFamily: Fonts.family.regular },
    fieldContainer: {
        flex: 1,
        padding: 10,
    },
    field: {
        flex: 1,
        borderRadius: 10,
        borderWidth: 2,
        position: 'relative',
    },
    halfwayLine: { position: 'absolute', top: '50%', left: 0, right: 0, height: 2 },
    centerCircle: { position: 'absolute', top: '50%', left: '50%', width: 120, height: 120, borderRadius: 60, borderWidth: 2, transform: [{ translateX: -60 }, { translateY: -60 }] },
    centerSpot: { position: 'absolute', top: '50%', left: '50%', width: 8, height: 8, borderRadius: 4, transform: [{ translateX: -4 }, { translateY: -4 }] },
    penaltyBox: { position: 'absolute', alignSelf: 'center', width: '60%', height: '25%', borderWidth: 2, borderTopWidth: 0, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 },
    position: { 
        position: 'absolute', 
        alignItems: 'center', 
        width: 60, // Ancho fijo para el token
    },
    playerCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    playerImage: {
        width: '100%',
        height: '100%',
        borderRadius: 25,
    },
    playerNameText: {
        fontFamily: Fonts.family.bold,
        textAlign: 'center',
        marginTop: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.9)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 5,
        fontSize: 12,
    },
    benchContainer: {
        padding: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
    },
    benchTitle: {
        fontFamily: Fonts.family.bold,
        fontSize: Fonts.size.md,
        marginBottom: Spacing.sm,
    },
    bench: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    benchPlayer: {
        alignItems: 'center',
        margin: Spacing.sm,
        width: 60,
    },
    benchPlayerImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginBottom: Spacing.xs,
    },
    benchPlayerName: {
        fontSize: 10,
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        height: '60%',
        padding: Spacing.lg,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    modalTitle: {
        fontFamily: Fonts.family.bold,
        fontSize: Fonts.size.xl,
        textAlign: 'center',
        marginBottom: Spacing.lg,
    },
    modalSectionTitle: {
        fontFamily: Fonts.family.bold,
        fontSize: Fonts.size.md,
        marginBottom: Spacing.md,
    },
    modalPlayerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalPlayerName: {
        fontFamily: Fonts.family.medium,
        fontSize: Fonts.size.md,
    },
    closeButton: {
        marginTop: Spacing.lg,
        padding: Spacing.md,
        borderRadius: 10,
        alignItems: 'center',
    },
    closeButtonText: {
        fontFamily: Fonts.family.bold,
        fontSize: Fonts.size.md,
        color: 'white',
    },
});

export default LineupScreen;
