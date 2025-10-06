import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = 'https://dxveaffgjuxkajubifxd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dmVhZmZnanV4a2FqdWJpZnhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MjUzNDMsImV4cCI6MjA3NDIwMTM0M30.xkmshnOFxHVQC-sMnknzonZEG5S4-Xs34lsmGcxdxEA';

// Configuración específica para iOS
const supabaseOptions = {
  auth: {
    storage: Platform.OS === 'ios' ? undefined : undefined, // Usar AsyncStorage por defecto
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
};

export const supabase = createClient(supabaseUrl, supabaseKey, supabaseOptions);

// Función para inicializar datos si no existen
export const initializeData = async () => {
  try {
    console.log('Inicializando datos de Supabase...');
    
    // Verificar conexión con Supabase
    const { error: connectionError } = await supabase
      .from('players')
      .select('count')
      .limit(1);

    if (connectionError) {
      console.error('Error de conexión con Supabase:', connectionError);
      return false;
    }

    console.log('Conexión con Supabase establecida correctamente');
    
    // Verificar si ya hay jugadores
    const { data: existingPlayers, error: playersError } = await supabase
      .from('players')
      .select('*')
      .limit(1);

    if (playersError) {
      console.error('Error obteniendo jugadores:', playersError);
      return false;
    }

    if (!existingPlayers || existingPlayers.length === 0) {
      console.log('La tabla de jugadores está vacía, pero se debería haber inicializado con SQL.');
    } else {
      console.log(`Se encontraron ${existingPlayers.length} jugadores en la base de datos`);
    }
    
    return true;
  } catch (error) {
    console.error('Error crítico inicializando datos:', error);
    return false;
  }
};


