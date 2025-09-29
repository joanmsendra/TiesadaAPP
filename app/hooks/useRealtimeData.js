import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../api/supabase';

/**
 * Hook personalizado para manejar datos en tiempo real de Supabase
 * @param {string} table - Nombre de la tabla
 * @param {object} options - Opciones de configuración
 * @returns {object} { data, loading, error, refetch }
 */
export const useRealtimeData = (table, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    select = '*',
    filter = null,
    orderBy = null,
    transform = null,
  } = options;

  // Función para cargar datos iniciales
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      let query = supabase.from(table).select(select);
      
      // Aplicar filtros si existen
      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }
      
      // Aplicar ordenamiento si existe
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      }
      
      const { data: fetchedData, error: fetchError } = await query;
      
      if (fetchError) {
        throw fetchError;
      }
      
      // Aplicar transformación si existe
      const finalData = transform ? transform(fetchedData || []) : (fetchedData || []);
      setData(finalData);
    } catch (err) {
      console.error(`Error fetching ${table}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [table, select, filter, orderBy, transform]);

  // Configurar suscripción en tiempo real
  useEffect(() => {
    // Cargar datos iniciales
    fetchData();

    // Configurar canal de tiempo real
    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
        },
        (payload) => {
          console.log(`Realtime event for ${table}:`, payload);
          // Forzar un refetch completo para asegurar la consistencia de los datos.
          // Esto es más robusto que intentar manejar cada evento (INSERT, UPDATE, DELETE) individualmente.
          fetchData();
        }
      )
      .subscribe((status, err) => {
        console.log(`Realtime subscription status for ${table}:`, status);
        if (err) {
          console.error(`Realtime subscription error for ${table}:`, err);
        }
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Successfully subscribed to realtime updates for ${table}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Channel error for ${table}`);
        }
      });

    // Cleanup: desuscribirse cuando el componente se desmonte
    return () => {
      console.log(`Unsubscribing from ${table} realtime updates`);
      supabase.removeChannel(channel);
    };
  }, [table, fetchData]);

  // Función para refrescar manualmente
  const refetch = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
  };
};

/**
 * Hook específico para partidos con transformación
 */
export const useRealtimeMatches = () => {
  const result = useRealtimeData('matches', {
    orderBy: { column: 'date', ascending: true },
    transform: (matches) => matches || [],
  });
  
  // Añadir logging para debug (solo en desarrollo)
  React.useEffect(() => {
    if (__DEV__) {
      console.log('🔄 Matches data updated:', result.data.length, 'matches');
    }
  }, [result.data.length]);
  
  return result;
};

/**
 * Hook específico para jugadores
 */
export const useRealtimePlayers = () => {
  return useRealtimeData('players', {
    orderBy: { column: 'name', ascending: true },
    transform: (players) => players || [],
  });
};

/**
 * Hook específico para apuestas de un jugador
 */
export const useRealtimePlayerBets = (playerId) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBets = useCallback(async () => {
    if (!playerId) return;
    
    try {
      setError(null);
      const { data: bets, error: betsError } = await supabase
        .from('bets')
        .select('*')
        .or(`and(bet_mode.eq.standard,player_id.eq.${playerId}),and(bet_mode.eq.pvp,or(proposer_id.eq.${playerId},accepter_id.eq.${playerId}))`)
        .order('created_at', { ascending: false });
      
      if (betsError) {
        throw betsError;
      }
      
      const transformedBets = (bets || []).map(bet => ({
        ...bet,
        matchId: bet.match_id,
        playerId: bet.player_id,
        proposerId: bet.proposer_id,
        accepterId: bet.accepter_id,
        betMode: bet.bet_mode
      }));
      
      setData(transformedBets);
    } catch (err) {
      console.error('Error fetching player bets:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    if (!playerId) return;

    fetchBets();

    const channel = supabase
      .channel(`realtime-bets-${playerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bets',
        },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          
          // Solo procesamos cambios que afectan a este jugador
          const isRelevant = 
            (newRecord && (
              newRecord.player_id === playerId ||
              newRecord.proposer_id === playerId ||
              newRecord.accepter_id === playerId
            )) ||
            (oldRecord && (
              oldRecord.player_id === playerId ||
              oldRecord.proposer_id === playerId ||
              oldRecord.accepter_id === playerId
            ));
          
          if (isRelevant) {
            console.log(`Realtime bet event for player ${playerId}:`, payload);
            fetchBets(); // Refrescar todas las apuestas del jugador
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [playerId, fetchBets]);

  return { data, loading, error, refetch: fetchBets };
};

/**
 * Hook específico para apuestas JcJ abiertas de otros jugadores
 */
export const useRealtimeOpenPvPBets = (playerId) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOpenBets = useCallback(async () => {
    if (!playerId) {
      setData([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const { data: bets, error: betsError } = await supabase
        .from('bets')
        .select('*')
        .eq('bet_mode', 'pvp')
        .eq('status', 'proposed')
        .neq('proposer_id', playerId);
      
      if (betsError) {
        throw betsError;
      }
      
      const transformedBets = (bets || []).map(bet => ({
        ...bet,
        matchId: bet.match_id,
        playerId: bet.player_id,
        proposerId: bet.proposer_id,
        accepterId: bet.accepter_id,
        betMode: bet.bet_mode
      }));
      
      setData(transformedBets);
    } catch (err) {
      console.error('Error fetching open pvp bets:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    if (!playerId) return;

    fetchOpenBets();

    const channel = supabase
      .channel(`realtime-open-pvp-bets-for-${playerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bets',
        },
        (payload) => {
          // Para simplificar, recargamos si cualquier apuesta cambia.
          // Una lógica más fina podría comprobar si el cambio es relevante.
          console.log(`Realtime event for open pvp bets:`, payload);
          fetchOpenBets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [playerId, fetchOpenBets]);

  return { data, loading, error, refetch: fetchOpenBets };
};


export default useRealtimeData;
