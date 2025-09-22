import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ActivityIndicator, SafeAreaView, 
  TouchableOpacity, Modal, Button
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getPlayers, getDefaultLineup, saveDefaultLineup } from '../api/storage';
import { Image } from 'expo-image';

const POSITIONS = {
  gk: { name: 'Portero', style: { top: '80%', left: '40%' } },
  def1: { name: 'Defensa', style: { top: '55%', left: '15%' } },
  def2: { name: 'Defensa', style: { top: '55%', left: '65%' } },
  fwd1: { name: 'Delantero', style: { top: '25%', left: '25%' } },
  fwd2: { name: 'Delantero', style: { top: '25%', left: '55%' } },
};

const PlayerToken = ({ position, player, onSelect }) => (
  <TouchableOpacity style={[styles.position, position.style]} onPress={onSelect}>
    <View style={styles.playerCircle}>
      {player ? (
        <Image source={{ uri: player.photo }} style={styles.playerImage} />
      ) : (
        <Text style={styles.playerInitial}>?</Text>
      )}
    </View>
    <Text style={styles.playerNameText}>{player ? player.name : position.name}</Text>
  </TouchableOpacity>
);

const FieldLines = () => (
    <>
      <View style={styles.halfwayLine} />
      <View style={styles.centerCircle} />
      <View style={styles.centerSpot} />
      <View style={[styles.penaltyBox, { bottom: -2 }]} />
      <View style={[styles.penaltyBox, { top: -2, transform: [{ rotate: '180deg'}] }]} />
    </>
);

const LineupScreen = () => {
  const [players, setPlayers] = useState([]);
  const [lineup, setLineup] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);

  useFocusEffect(
    useCallback(() => {
        const loadData = async () => {
            setLoading(true);
            try {
              const allPlayers = await getPlayers();
              const savedLineup = await getDefaultLineup();
              setPlayers(allPlayers);
              if (savedLineup) {
                setLineup(savedLineup);
              }
            } catch (e) { console.error('Failed to load lineup', e); } 
            finally { setLoading(false); }
          };
      loadData();
    }, [])
  );

  const openPlayerSelection = (positionKey) => {
    setSelectedPosition(positionKey);
    setModalVisible(true);
  };
  
  const handleSelectPlayer = async (playerId) => {
    const newL = { ...lineup, [selectedPosition]: playerId };
    Object.keys(newL).forEach(pos => {
      if (pos !== selectedPosition && newL[pos] === playerId) { newL[pos] = null; }
    });
    setLineup(newL);
    await saveDefaultLineup(newL);
    setModalVisible(false);
  };

  const getPlayerName = (playerId) => players.find(p => p.id === playerId)?.name;
  const getPlayerById = (playerId) => players.find(p => p.id === playerId);

  if (loading) return <ActivityIndicator style={styles.center} size="large" color={'#fff'} />;
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pizarra Táctica</Text>
        <Text style={styles.subTitle}>Organiza tu equipo ideal</Text>
      </View>

      <View style={styles.fieldContainer}>
        <View style={styles.field}>
            <FieldLines />
            {Object.entries(POSITIONS).map(([key, pos]) => (
            <PlayerToken 
                key={key}
                position={pos}
                player={getPlayerById(lineup[key])}
                onSelect={() => openPlayerSelection(key)}
            />
            ))}
        </View>
      </View>
      
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Asignar a {POSITIONS[selectedPosition]?.name}</Text>
            {players.map(p => (
              <TouchableOpacity key={p.id} style={styles.playerOption} onPress={() => handleSelectPlayer(p.id)}>
                <Text style={styles.playerOptionText}>{p.name}</Text>
              </TouchableOpacity>
            ))}
             <TouchableOpacity style={[styles.playerOption, {marginTop: 10}]} onPress={() => handleSelectPlayer(null)}>
                <Text style={[styles.playerOptionText, {color: 'red'}]}>Quitar jugador</Text>
              </TouchableOpacity>
            <Button title="Cerrar" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A3B09' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: 'rgba(0,0,0,0.2)'},
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  subTitle: { fontSize: 18, color: '#eee' },
  fieldContainer: {
      flex: 1,
      padding: 10,
  },
  field: {
    flex: 1,
    backgroundColor: '#53A050',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  halfwayLine: { position: 'absolute', top: '50%', left: 0, right: 0, height: 2, backgroundColor: 'rgba(255,255,255,0.5)'},
  centerCircle: { position: 'absolute', top: '50%', left: '50%', width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', transform: [{ translateX: -60 }, { translateY: -60 }]},
  centerSpot: { position: 'absolute', top: '50%', left: '50%', width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)', transform: [{ translateX: -4 }, { translateY: -4 }]},
  penaltyBox: { position: 'absolute', alignSelf: 'center', width: '60%', height: '25%', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', borderTopWidth: 0, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 },
  position: { position: 'absolute', alignItems: 'center', width: '20%' },
  playerCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 2,
    borderColor: '#fff'
  },
  playerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  playerSet: { borderColor: '#fff' },
  playerEmpty: { borderColor: '#778899' },
  playerInitial: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  playerNameText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 5
  },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 15, width: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  playerOption: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  playerOptionText: { fontSize: 18, textAlign: 'center' },
});

export default LineupScreen;
