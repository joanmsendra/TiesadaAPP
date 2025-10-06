import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import { BET_ODDS, getOddsForBet } from './betConstants';

// --- Match Functions ---
export const getMatches = async () => {
    try {
        const { data, error } = await supabase
            .from('matches')
            .select('*')
            .order('date', { ascending: true });
        
        if (error) {
            console.error('Error getting matches:', error);
            return [];
        }
        
        return data || [];
    } catch (error) {
        console.error('Failed to get matches.', error);
        return [];
    }
};

export const getMatch = async (matchId) => {
    try {
        const { data, error } = await supabase
            .from('matches')
            .select('*')
            .eq('id', matchId)
            .single();
        
        if (error) {
            console.error(`Error getting match ${matchId}:`, error);
            return null;
        }
        
        return data;
    } catch (error) {
        console.error(`Failed to get match ${matchId}.`, error);
        return null;
    }
};

export const addMatch = async (matchData, teamId = 'tiesada-fc-default') => {
    try {
        const newMatch = {
            id: uuidv4(),
            ...matchData,
            played: matchData.played || false,
            attending: matchData.attending || [],
            lineup: matchData.lineup || { 'gk': null, 'def1': null, 'def2': null, 'fwd1': null, 'fwd2': null },
            emoji: matchData.emoji || '⚽️',
            team_id: teamId,
        };

        const { data, error } = await supabase
            .from('matches')
            .insert([newMatch])
            .select()
            .single();
        
        if (error) {
            console.error('Error adding match:', error);
            return null;
        }
        
        return data;
    } catch (error) {
        console.error('Failed to add match.', error);
        return null;
    }
};

export const updateMatch = async (matchId, matchData) => {
  try {
    const { data, error } = await supabase
      .from('matches')
      .update(matchData)
      .eq('id', matchId)
      .select()
      .single();

    if (error) {
      // Si hay un error, lo lanzamos para que se capture en el catch
      throw error;
    }

    console.log(`Match ${matchId} updated successfully.`);
    return data; // Devolver el dato actualizado para confirmación

  } catch (error) {
    console.error('Error updating match:', matchId, error.message);
    throw new Error(`No se pudo actualizar el partido. Razón: ${error.message}`);
  }
};

export const deleteMatch = async (matchId, teamId = 'tiesada-fc-default') => {
    try {
        // 1) Delete related bets to avoid FK constraint errors
        const { error: betsError } = await supabase
            .from('bets')
            .delete()
            .eq('match_id', matchId)
            .eq('team_id', teamId);
        if (betsError) {
            console.error(`Error deleting bets for match ${matchId}:`, betsError);
            throw betsError;
        }

        // 2) Delete the match
        const { error: matchError } = await supabase
            .from('matches')
            .delete()
            .eq('id', matchId)
            .eq('team_id', teamId);

        if (matchError) {
            console.error(`Error deleting match ${matchId}:`, matchError);
            throw matchError;
        }
        return true;
    } catch (error) {
        console.error(`Failed to delete match ${matchId}.`, error);
        throw error;
    }
};

export const updateMatchAttendance = async (matchId, playerId) => {
    try {
        // Primero obtenemos el partido actual
        const { data: match, error: getError } = await supabase
            .from('matches')
            .select('attending')
            .eq('id', matchId)
            .single();
        
        if (getError) {
            console.error('Error getting match for attendance:', getError);
            throw new Error(`No se pudo obtener el partido: ${getError.message}`);
        }
        
        const attending = match.attending || [];
        let newAttending;
        
        if (attending.includes(playerId)) {
            // Quitar jugador
            newAttending = attending.filter(id => id !== playerId);
        } else {
            // Añadir jugador
            newAttending = [...attending, playerId];
        }
        
        const { data, error } = await supabase
            .from('matches')
            .update({ attending: newAttending })
            .eq('id', matchId)
            .select()
            .single();
        
        if (error) {
            console.error('Error updating attendance:', error);
            throw new Error(`No se pudo actualizar la asistencia: ${error.message}`);
        }
        
        return data;
    } catch (error) {
        console.error('Failed to update attendance.', error);
        throw error; // Re-lanzar el error para que el componente lo pueda manejar
    }
};

export const updateLineup = async (matchId, lineup) => {
    try {
        const { data, error } = await supabase
            .from('matches')
            .update({ lineup })
            .eq('id', matchId)
            .select()
            .single();
        
        if (error) {
            console.error('Error updating lineup:', error);
            return null;
        }
        
        return data;
    } catch (error) {
        console.error('Failed to update lineup.', error);
        return null;
    }
};

// For now, we'll keep default lineup local, as it's a user preference.
export const getDefaultLineup = async () => {
    return { 'gk': null, 'def1': null, 'def2': null, 'fwd1': null, 'fwd2': null };
};

export const saveDefaultLineup = async (lineup) => {
    // This part remains local for now
};

// --- Player Functions ---
export const getPlayers = async () => {
    try {
        const { data, error } = await supabase
            .from('players')
            .select('*')
            .order('name', { ascending: true });
        
        if (error) {
            console.error('Error getting players:', error);
            return [];
        }
        
        return data || [];
    } catch (error) {
        console.error('Failed to get players.', error);
        return [];
    }
};

// --- Bet Functions ---
export const getPlayerBets = async (playerId, teamId = 'tiesada-fc-default') => {
    try {
        const { data, error } = await supabase
            .from('bets')
            .select('*')
            .eq('team_id', teamId)
            .or(`and(bet_mode.eq.standard,player_id.eq.${playerId}),and(bet_mode.eq.pvp,or(proposer_id.eq.${playerId},accepter_id.eq.${playerId}))`)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error getting player bets:', error);
            return [];
        }
        
        return data.map(bet => ({ ...bet, matchId: bet.match_id, playerId: bet.player_id, proposerId: bet.proposer_id, accepterId: bet.accepter_id, betMode: bet.bet_mode })) || [];
    } catch (error) {
        console.error('Failed to get player bets', error);
        return [];
    }
};

export const addBet = async (betData, teamId = 'tiesada-fc-default') => {
    try {
        // Verificar y descontar monedas del jugador
        const { data: player, error: playerError } = await supabase
            .from('players')
            .select('coins')
            .eq('id', betData.playerId)
            .single();
        
        if (playerError || !player) {
            throw new Error('Player not found');
        }
        
        if (player.coins < betData.amount) {
            throw new Error('Not enough coins');
        }
        
        // Descontar monedas
        const { error: updateError } = await supabase
            .from('players')
            .update({ coins: player.coins - betData.amount })
            .eq('id', betData.playerId);
        
        if (updateError) {
            throw new Error('Failed to update player coins');
        }
        
        // Crear apuesta
        const newBet = {
            id: uuidv4(),
            ...betData,
            match_id: betData.matchId,
            player_id: betData.playerId,
            status: 'pending',
            bet_mode: 'standard',
            team_id: teamId,
            created_at: new Date().toISOString(),
        };
        delete newBet.matchId;
        delete newBet.playerId;
        
        const { data, error } = await supabase
            .from('bets')
            .insert([newBet])
            .select()
            .single();
        
        if (error) {
            // Revertir monedas si falla
            await supabase
                .from('players')
                .update({ coins: player.coins })
                .eq('id', betData.playerId);
            throw error;
        }
        
        return { ...data, matchId: data.match_id, playerId: data.player_id, betMode: data.bet_mode };
    } catch (error) {
        console.error('Failed to add bet.', error);
        throw error;
    }
};

export const addPvPBet = async (betData, teamId = 'tiesada-fc-default') => {
    try {
        // Verificar y descontar monedas del proposer
        const { data: player, error: playerError } = await supabase
            .from('players')
            .select('coins')
            .eq('id', betData.proposerId)
            .single();
        
        if (playerError || !player) {
            throw new Error('Player not found');
        }
        
        if (player.coins < betData.amount) {
            throw new Error('Not enough coins');
        }
        
        // Descontar monedas
        const { error: updateError } = await supabase
            .from('players')
            .update({ coins: player.coins - betData.amount })
            .eq('id', betData.proposerId);
        
        if (updateError) {
            throw new Error('Failed to update player coins');
        }
        
        // Crear apuesta PvP
        const newBet = {
            id: uuidv4(),
            ...betData,
            match_id: betData.matchId,
            proposer_id: betData.proposerId,
            status: 'proposed',
            bet_mode: 'pvp',
            accepter_id: null,
            team_id: teamId,
            created_at: new Date().toISOString(),
        };
        delete newBet.matchId;
        delete newBet.proposerId;
        
        const { data, error } = await supabase
            .from('bets')
            .insert([newBet])
            .select()
            .single();
        
        if (error) {
            // Revertir monedas si falla
            await supabase
                .from('players')
                .update({ coins: player.coins })
                .eq('id', betData.proposerId);
            throw error;
        }
        
        return { ...data, matchId: data.match_id, proposerId: data.proposer_id, betMode: data.bet_mode };
    } catch (error) {
        console.error('Failed to add pvp bet.', error);
        throw error;
    }
};

export const acceptPvPBet = async (betId, accepterId) => {
    try {
        // Obtener la apuesta
        const { data: bet, error: betError } = await supabase
            .from('bets')
            .select('*')
            .eq('id', betId)
            .single();
        
        if (betError || !bet) {
            throw new Error('Bet not found');
        }
        
        if (bet.status !== 'proposed') {
            throw new Error('Bet is not open for acceptance');
        }
        
        // Obtener jugador accepter
        const { data: accepter, error: accepterError } = await supabase
            .from('players')
            .select('coins')
            .eq('id', accepterId)
            .single();
        
        if (accepterError || !accepter) {
            throw new Error('Accepter not found');
        }
        
        const odds = getOddsForBet(bet);
        const accepterStake = Math.round(bet.amount * odds);
        
        if (accepter.coins < accepterStake) {
            throw new Error('Not enough coins to accept');
        }
        
        // Descontar monedas del accepter
        const { error: updateError } = await supabase
            .from('players')
            .update({ coins: accepter.coins - accepterStake })
            .eq('id', accepterId);
        
        if (updateError) {
            throw new Error('Failed to update accepter coins');
        }
        
        // Actualizar apuesta
        const { data, error } = await supabase
            .from('bets')
            .update({
                accepter_id: accepterId,
                status: 'active'
            })
            .eq('id', betId)
            .select()
            .single();
        
        if (error) {
            // Revertir monedas si falla
            await supabase
                .from('players')
                .update({ coins: accepter.coins })
                .eq('id', accepterId);
            throw error;
        }
        
        return { ...data, accepterId: data.accepter_id };
    } catch (error) {
        console.error('Failed to accept pvp bet.', error);
        throw error;
    }
};

export const getOpenPvPBets = async (playerId, teamId = 'tiesada-fc-default') => {
    // Si no hay playerId, no podemos buscar apuestas, devolvemos un array vacío.
    if (!playerId) {
        return [];
    }
    try {
        const { data, error } = await supabase
            .from('bets')
            .select('*')
            .eq('team_id', teamId)
            .eq('bet_mode', 'pvp')
            .eq('status', 'proposed')
            .neq('proposer_id', playerId)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error getting open pvp bets:', error);
            return [];
        }
        
        return data.map(bet => ({ ...bet, matchId: bet.match_id, proposerId: bet.proposer_id, betMode: bet.bet_mode })) || [];
    } catch (error) {
        console.error('Failed to get open pvp bets', error);
        return [];
    }
};

export const resolveBetsForMatch = async (matchId) => {
    try {
        // Obtener el partido
        const { data: match, error: matchError } = await supabase
            .from('matches')
            .select('*')
            .eq('id', matchId)
            .single();
        
        if (matchError || !match || !match.played) {
            return;
        }
        
        // Obtener apuestas del partido
        const { data: bets, error: betsError } = await supabase
            .from('bets')
            .select('*')
            .eq('match_id', matchId)
            .in('status', ['pending', 'active', 'proposed']);
        
        if (betsError) {
            console.error('Error getting bets for resolution:', betsError);
            return;
        }
        
        for (const bet of bets || []) {
            let updateData = {};
            let playerUpdates = [];
            
            // Si es PvP propuesta no aceptada, devolver monedas
            if (bet.bet_mode === 'pvp' && bet.status === 'proposed') {
                playerUpdates.push({
                    id: bet.proposer_id,
                    coinsToAdd: bet.amount
                });
                updateData.status = 'void';
            } else {
                // Evaluar apuesta
                let isWin = false;
                let payout = 0;
                
                if (bet.type === 'result') {
                    const { us, them } = bet.details;
                    if (match.result && match.result.us === us && match.result.them === them) {
                        isWin = true;
                        payout = bet.amount * BET_ODDS.RESULT;
                    }
                } else if (bet.type === 'player_event') {
                    const { playerId, event } = bet.details;
                    const statsArray = Array.isArray(match.stats) ? match.stats : [];
                    const playerStat = statsArray.find(s => {
                        const statPlayerId = s.playerId ?? s.player_id ?? s.id;
                        return String(statPlayerId) === String(playerId);
                    });
                    const goals = playerStat?.goals ?? playerStat?.g ?? 0;
                    const assists = playerStat?.assists ?? playerStat?.a ?? 0;
                    const yellowCards = playerStat?.yellowCards ?? playerStat?.yellow_cards ?? playerStat?.yc ?? 0;
                    const redCards = playerStat?.redCards ?? playerStat?.red_cards ?? playerStat?.rc ?? 0;
                    const cagadas = playerStat?.cagadas ?? playerStat?.errors ?? 0; // <-- Leer stat
                    
                    switch (event) {
                        case 'scores':
                            if (goals > 0) isWin = true;
                            payout = bet.amount * BET_ODDS.PLAYER_SCORES;
                            break;
                        case 'assists':
                            if (assists > 0) isWin = true;
                            payout = bet.amount * BET_ODDS.PLAYER_ASSISTS;
                            break;
                        case 'gets_card':
                            if (yellowCards > 0 || redCards > 0) isWin = true;
                            payout = bet.amount * BET_ODDS.PLAYER_GETS_CARD;
                            break;
                        case 'no_card':
                            if (yellowCards === 0 && redCards === 0) isWin = true;
                            payout = bet.amount * BET_ODDS.PLAYER_NO_CARD;
                            break;
                        case 'cagadas': // <-- Evaluar apuesta
                            if (cagadas > 0) isWin = true;
                            payout = bet.amount * BET_ODDS.PLAYER_CAGADAS;
                            break;
                    }
                }
                
                if (bet.bet_mode === 'standard') {
                    if (isWin) {
                        updateData.status = 'won';
                        playerUpdates.push({
                            id: bet.player_id,
                            coinsToAdd: payout
                        });
                    } else {
                        updateData.status = 'lost';
                    }
                } else if (bet.bet_mode === 'pvp' && bet.status === 'active') {
                    const odds = getOddsForBet(bet);
                    const accepterStake = Math.round(bet.amount * odds);
                    const proposerStake = bet.amount;
                    
                    if (isWin) {
                        // Proposer gana
                        updateData.status = 'won';
                        playerUpdates.push({
                            id: bet.proposer_id,
                            coinsToAdd: proposerStake + accepterStake
                        });
                    } else {
                        // Accepter gana
                        updateData.status = 'lost';
                        playerUpdates.push({
                            id: bet.accepter_id,
                            coinsToAdd: accepterStake + proposerStake
                        });
                    }
                }
            }
            
            // Actualizar apuesta
            if (Object.keys(updateData).length > 0) {
                await supabase
                    .from('bets')
                    .update(updateData)
                    .eq('id', bet.id);
            }
            
            // Actualizar monedas de jugadores
            for (const playerUpdate of playerUpdates) {
                const { data: player, error: getPlayerError } = await supabase
                    .from('players')
                    .select('coins')
                    .eq('id', playerUpdate.id)
                    .single();
                
                if (!getPlayerError && player) {
                    await supabase
                        .from('players')
                        .update({ coins: player.coins + playerUpdate.coinsToAdd })
                        .eq('id', playerUpdate.id);
                }
            }
        }
        
        console.log(`Bets resolved for match ${matchId}`);
    } catch (error) {
        console.error(`Failed to resolve bets for match ${matchId}.`, error);
    }
};

// --- Photo Upload Functions ---
export const uploadPlayerPhoto = async (playerId, imageUri) => {
    try {
        // Generar un nombre único para la imagen
        const fileExtension = imageUri.split('.').pop() || 'jpg';
        const fileName = `player_${playerId}_${Date.now()}.${fileExtension}`;

        // Crear FormData para React Native
        const formData = new FormData();
        formData.append('file', {
            uri: imageUri,
            type: `image/${fileExtension}`,
            name: fileName,
        });

        // Usar la API REST de Supabase directamente para React Native
        const supabaseUrl = 'https://dxveaffgjuxkajubifxd.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dmVhZmZnanV4a2FqdWJpZnhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MjUzNDMsImV4cCI6MjA3NDIwMTM0M30.xkmshnOFxHVQC-sMnknzonZEG5S4-Xs34lsmGcxdxEA';
        
        const response = await fetch(
            `${supabaseUrl}/storage/v1/object/player-photos/${fileName}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                },
                body: formData,
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error al subir la imagen: ${errorText}`);
        }

        // Obtener la URL pública de la imagen
        const { data: urlData } = supabase.storage
            .from('player-photos')
            .getPublicUrl(fileName);

        const publicURL = urlData.publicUrl;

        // Actualizar la URL de la foto en la base de datos
        const { error: updateError } = await supabase
            .from('players')
            .update({ photo: publicURL })
            .eq('id', playerId);

        if (updateError) {
            throw new Error(`Error al actualizar la foto del jugador: ${updateError.message}`);
        }

        return publicURL;
    } catch (error) {
        console.error('Error uploading player photo:', error);
        throw error;
    }
};

export const getCustomPvPBetsForMatch = async (matchId) => {
    try {
        const { data, error } = await supabase
            .from('bets')
            .select('*')
            .eq('match_id', matchId)
            .eq('bet_mode', 'pvp')
            .eq('type', 'custom_pvp')
            .in('status', ['active', 'proposed']);
        
        if (error) {
            console.error('Error getting custom pvp bets for match:', error);
            return [];
        }
        
        return data.map(bet => ({ ...bet, matchId: bet.match_id, proposerId: bet.proposer_id, accepterId: bet.accepter_id, betMode: bet.bet_mode })) || [];
    } catch (error) {
        console.error('Failed to get custom pvp bets for match', error);
        return [];
    }
};

export const resolveCustomPvPBet = async (betId, resolution) => {
    try {
        // resolution puede ser: 'proposer_wins', 'accepter_wins', 'void'
        const { data: bet, error: betError } = await supabase
            .from('bets')
            .select('*')
            .eq('id', betId)
            .single();
        
        if (betError || !bet) {
            throw new Error('Bet not found');
        }
        
        let newStatus = 'lost';
        let playerUpdates = [];
        
        if (resolution === 'void') {
            // Devolver monedas a ambos jugadores
            newStatus = 'void';
            playerUpdates.push(
                { id: bet.proposer_id, coinsToAdd: bet.amount },
                { id: bet.accepter_id, coinsToAdd: Math.round(bet.amount * bet.details.custom_odds) }
            );
        } else if (resolution === 'proposer_wins') {
            // El que propuso la apuesta gana
            newStatus = 'won';
            const accepterStake = Math.round(bet.amount * bet.details.custom_odds);
            playerUpdates.push({
                id: bet.proposer_id,
                coinsToAdd: bet.amount + accepterStake
            });
        } else if (resolution === 'accepter_wins') {
            // El que aceptó la apuesta gana
            newStatus = 'lost'; // Para el proposer
            const accepterStake = Math.round(bet.amount * bet.details.custom_odds);
            playerUpdates.push({
                id: bet.accepter_id,
                coinsToAdd: accepterStake + bet.amount
            });
        }
        
        // Actualizar el estado de la apuesta
        const { error: updateError } = await supabase
            .from('bets')
            .update({ status: newStatus })
            .eq('id', betId);
            
        if (updateError) {
            throw new Error('Failed to update bet status');
        }
        
        // Actualizar monedas de los jugadores
        for (const playerUpdate of playerUpdates) {
            const { data: player, error: getPlayerError } = await supabase
                .from('players')
                .select('coins')
                .eq('id', playerUpdate.id)
                .single();
            
            if (!getPlayerError && player) {
                await supabase
                    .from('players')
                    .update({ coins: player.coins + playerUpdate.coinsToAdd })
                    .eq('id', playerUpdate.id);
            }
        }
        
        return true;
    } catch (error) {
        console.error('Failed to resolve custom pvp bet:', error);
        throw error;
    }
};

// --- Global Lineup Functions (Simplified) ---
export const getGlobalLineupPositions = async (teamId = 'tiesada-fc-default') => {
    try {
        const { data, error } = await supabase
            .from('global_lineup_positions')
            .select('*')
            .eq('team_id', teamId);

        if (error) {
            console.error('Error getting global lineup positions:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Failed to get global lineup positions.', error);
        return [];
    }
};

export const upsertGlobalLineupPosition = async (playerId, x, y, teamId = 'tiesada-fc-default') => {
    try {
        const { data, error } = await supabase
            .from('global_lineup_positions')
            .upsert(
                {
                    player_id: playerId,
                    position_x: x,
                    position_y: y,
                    updated_at: new Date().toISOString(),
                    team_id: teamId
                },
                { onConflict: 'player_id' }
            )
            .select()
            .single();

        if (error) {
            console.error('Error upserting global lineup position:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Failed to upsert global lineup position.', error);
        return null;
    }
};

export const deleteGlobalLineupPosition = async (playerId, teamId = 'tiesada-fc-default') => {
    try {
        const { error } = await supabase
            .from('global_lineup_positions')
            .delete()
            .eq('player_id', playerId)
            .eq('team_id', teamId);

        if (error) {
            console.error('Error deleting global lineup position:', error);
            throw error;
        }
        return true;
    } catch (error) {
        console.error('Failed to delete global lineup position.', error);
        return false;
    }
};

// --- Drawing Functions ---
export const addDrawingStroke = async (strokeData, color = '#FF0000', width = 3.0, teamId = 'tiesada-fc-default') => {
    try {
        const { data, error } = await supabase
            .from('drawing_strokes')
            .insert({
                stroke_data: strokeData,
                color: color,
                width: width,
                team_id: teamId
            })
            .select()
            .single();

        if (error) {
            console.error('Error adding drawing stroke:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Failed to add drawing stroke.', error);
        return null;
    }
};

export const getDrawingStrokes = async (teamId = 'tiesada-fc-default') => {
    try {
        const { data, error } = await supabase
            .from('drawing_strokes')
            .select('*')
            .eq('team_id', teamId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error getting drawing strokes:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Failed to get drawing strokes.', error);
        return [];
    }
};

export const deleteOldStrokes = async () => {
    try {
        const { error } = await supabase.rpc('cleanup_old_strokes');
        
        if (error) {
            console.error('Error cleaning old strokes:', error);
        }
    } catch (error) {
        console.error('Failed to clean old strokes.', error);
    }
};

export const deleteDrawingStroke = async (strokeId) => {
    try {
        const { error } = await supabase
            .from('drawing_strokes')
            .delete()
            .eq('id', strokeId);
        if (error) {
            console.error('Error deleting drawing stroke:', error);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Failed to delete drawing stroke.', error);
        return false;
    }
};
