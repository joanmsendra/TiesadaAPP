import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dxveaffgjuxkajubifxd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dmVhZmZnanV4a2FqdWJpZnhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MjUzNDMsImV4cCI6MjA3NDIwMTM0M30.xkmshnOFxHVQC-sMnknzonZEG5S4-Xs34lsmGcxdxEA';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Función para inicializar datos si no existen
export const initializeData = async () => {
  try {
    // Verificar si ya hay jugadores
    const { data: existingPlayers } = await supabase
      .from('players')
      .select('*')
      .limit(1);

    if (!existingPlayers || existingPlayers.length === 0) {
      // Si la tabla está vacía, no hacemos nada, ya que el SQL inicializa los datos.
      console.log('La tabla de jugadores está vacía, pero se debería haber inicializado con SQL.');
    }
  } catch (error) {
    console.error('Error inicializando datos:', error);
  }
};


