import apiClient from './client';
import { v4 as uuidv4 } from 'uuid'; // Keep for potential frontend ID generation if needed

// --- Match Functions ---
export const getMatches = async () => {
    try {
        const response = await apiClient.get('/matches');
        return response.data;
    } catch (error) {
        console.error('Failed to get matches.', error);
        return [];
    }
};

export const getMatch = async (matchId) => {
    try {
        const response = await apiClient.get(`/matches/${matchId}`);
        return response.data;
    } catch (error) {
        console.error(`Failed to get match ${matchId}.`, error);
        return null;
    }
};

export const addMatch = async (matchData) => {
    try {
        const response = await apiClient.post('/matches', matchData);
        return response.data;
    } catch (error) {
        console.error('Failed to add match.', error);
        return null;
    }
};

export const updateMatch = async (matchId, updatedData) => {
    try {
        const response = await apiClient.put(`/matches/${matchId}`, updatedData);
        return response.data;
    } catch (error) {
        console.error(`Failed to update match ${matchId}.`, error);
        return null;
    }
};

export const deleteMatch = async (matchId) => {
    try {
        await apiClient.delete(`/matches/${matchId}`);
    } catch (error) {
        console.error(`Failed to delete match ${matchId}.`, error);
    }
};

export const updateMatchAttendance = async (matchId, playerId) => {
    try {
        const response = await apiClient.post(`/matches/${matchId}/attendance`, { playerId });
        return response.data;
    } catch (error) {
        console.error('Failed to update attendance.', error);
        return null;
    }
};

export const updateLineup = async (matchId, lineup) => {
    try {
        const response = await apiClient.put(`/matches/${matchId}/lineup`, lineup);
        return response.data;
    } catch (error) {
        console.error('Failed to update lineup.', error);
        return null;
    }
}

// For now, we'll keep default lineup local, as it's a user preference.
// This can be moved to the backend later if we add user accounts.
export const getDefaultLineup = async () => {
    // This part remains local
    return {}; // Simplified for now
}

export const saveDefaultLineup = async (lineup) => {
    // This part remains local
}


// --- Player Functions ---
export const getPlayers = async () => {
    try {
        const response = await apiClient.get('/players');
        return response.data;
    } catch (error) {
        console.error('Failed to get players.', error);
        return [];
    }
}

// --- Bet Functions ---
export const getPlayerBets = async (playerId) => {
    // This would need a new endpoint, e.g., GET /players/:id/bets
    // For now, we might need to fetch all bets and filter locally, or adjust the backend.
    // Let's assume we will create this endpoint.
    try {
        const response = await apiClient.get(`/players/${playerId}/bets`); // Assuming this endpoint exists
        return response.data;
    } catch (error) {
        console.error('Failed to get player bets', error);
        return [];
    }
}

export const addBet = async (betData) => {
    try {
        const response = await apiClient.post('/bets', betData);
        return response.data;
    } catch (error) {
        console.error('Failed to add bet.', error);
        throw error;
    }
}

export const addPvPBet = async (betData) => {
    try {
        const response = await apiClient.post('/bets/pvp', betData);
        return response.data;
    } catch (error) {
        console.error('Failed to add pvp bet.', error);
        throw error;
    }
}

export const acceptPvPBet = async (betId, accepterId) => {
    try {
        const response = await apiClient.post(`/bets/pvp/${betId}/accept`, { accepterId });
        return response.data;
    } catch (error) {
        console.error('Failed to accept pvp bet.', error);
        throw error;
    }
}

export const getOpenPvPBets = async (playerId) => {
    // This needs a new endpoint, e.g., GET /bets/pvp/open?excludePlayerId=:playerId
    try {
        const response = await apiClient.get(`/bets/pvp/open?excludePlayerId=${playerId}`); // Assuming this endpoint
        return response.data;
    } catch (error) {
        console.error('Failed to get open pvp bets', error);
        return [];
    }
}

export const resolveBetsForMatch = async (matchId) => {
    try {
        await apiClient.post(`/matches/${matchId}/resolve-bets`);
    } catch (error) {
        console.error(`Failed to resolve bets for match ${matchId}.`, error);
    }
};

// We no longer need initializeData as the server will have its own initial state.
export const initializeData = async () => {
  // This function can be removed or left empty.
  console.log("Data is now managed by the server.");
};
