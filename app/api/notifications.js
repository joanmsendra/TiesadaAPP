import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

// Configura cómo se deben mostrar las notificaciones cuando la app está abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Función principal para registrarse y obtener el token
export async function registerForPushNotificationsAsync() {
  let token;

  // En Android, es necesario configurar un "canal" de notificación
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // Comprobar si ya tenemos permiso
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Si no, pedir permiso al usuario
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // Si el usuario no da permiso, salimos
  if (finalStatus !== 'granted') {
    alert('¡Atención! No has activado las notificaciones. No recibirás avisos de partidos o apuestas.');
    return;
  }
  
  // Obtener el token único del dispositivo
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      throw new Error('No se encontró el Project ID de EAS en la configuración de la app. Asegúrate de que está configurado en app.json.');
    }
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch(e) {
    console.error("No se pudo obtener el token de notificación:", e);
  }

  return token;
}

// Función para guardar el token en la base de datos de Supabase
export async function savePushToken(playerId, token) {
  if (!playerId || !token) return;

  const { error } = await supabase
    .from('players')
    .update({ push_token: token })
    .eq('id', playerId);

  if (error) {
    console.error('Error guardando el token:', error);
  } else {
    console.log('Token guardado para el jugador:', playerId);
  }
}


