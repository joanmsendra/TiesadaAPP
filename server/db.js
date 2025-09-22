const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

// Create a connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const BET_ODDS = {
    RESULT: 5,
    PLAYER_SCORES: 3.5,
    PLAYER_ASSISTS: 2.5,
    PLAYER_GETS_CARD: 3,
    PLAYER_NO_CARD: 1 / 3,
};

// Initialize database tables
async function initializeDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS app_data (
                id SERIAL PRIMARY KEY,
                data_key VARCHAR(255) UNIQUE NOT NULL,
                data_value JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('[DB] Database initialized successfully');
    } catch (error) {
        console.error('[DB] Error initializing database:', error);
    }
}

async function readData() {
    try {
        await initializeDatabase(); // Ensure tables exist
        
        const result = await pool.query('SELECT data_value FROM app_data WHERE data_key = $1', ['tiesadafc-data']);
        
        if (result.rows.length === 0) {
            console.log('[DB] No data found, initializing with default data...');
            const initialData = {
                matches: [],
                players: [
                    { id: '1', name: 'Joan', position: 'Portero', photo: 'https://placehold.co/100x100/3498db/FFFFFF/png?text=J', coins: 1000 },
                    { id: '2', name: 'Guille', position: 'Defensa', photo: 'https://placehold.co/100x100/2ecc71/FFFFFF/png?text=G', coins: 1000 },
                    { id: '3', name: 'Ivan', position: 'Defensa', photo: 'https://placehold.co/100x100/e74c3c/FFFFFF/png?text=I', coins: 1000 },
                    { id: '4', name: 'Lopa', position: 'Medio', photo: 'https://placehold.co/100x100/f1c40f/FFFFFF/png?text=J', coins: 1000 },
                    { id: '5', name: 'Jota', position: 'Medio', photo: 'https://placehold.co/100x100/9b59b6/FFFFFF/png?text=J', coins: 1000 },
                    { id: '6', name: 'Carrasco', position: 'Delantero', photo: 'https://placehold.co/100x100/1abc9c/FFFFFF/png?text=C', coins: 1000 },
                    { id: '7', name: 'Toni', position: 'Delantero', photo: 'https://placehold.co/100x100/e67e22/FFFFFF/png?text=T', coins: 1000 },
                ],
                bets: [],
                defaultLineup: { 'gk': null, 'def1': null, 'def2': null, 'fwd1': null, 'fwd2': null },
            };
            await writeData(initialData);
            return initialData;
        }
        
        return result.rows[0].data_value;
    } catch (error) {
        console.error('[DB] Error reading data:', error);
        throw error;
    }
}

async function writeData(data) {
    try {
        await pool.query(
            `INSERT INTO app_data (data_key, data_value, updated_at) 
             VALUES ($1, $2, CURRENT_TIMESTAMP) 
             ON CONFLICT (data_key) 
             DO UPDATE SET data_value = $2, updated_at = CURRENT_TIMESTAMP`,
            ['tiesadafc-data', JSON.stringify(data)]
        );
        console.log('[DB] Data written successfully');
    } catch (error) {
        console.error('[DB] Error writing data:', error);
        throw error;
    }
}

async function getData() {
    return await readData();
}

// Match Functions
async function addMatch(matchData) {
    console.log('[DB] Adding match:', matchData);
    const data = await readData();
    const newMatch = {
        id: uuidv4(),
        ...matchData,
        played: matchData.played || false,
        attending: matchData.attending || [],
        lineup: matchData.lineup || { 'gk': null, 'def1': null, 'def2': null, 'fwd1': null, 'fwd2': null },
        emoji: matchData.emoji || '⚽️',
    };
    data.matches.push(newMatch);
    await writeData(data);
    console.log('[DB] Match added successfully:', newMatch.id);
    return newMatch;
}

async function updateMatch(matchId, updatedData) {
    console.log('[DB] Updating match:', matchId);
    const data = await readData();
    const matchIndex = data.matches.findIndex(m => m.id === matchId);
    if (matchIndex > -1) {
        data.matches[matchIndex] = { ...data.matches[matchIndex], ...updatedData };
        await writeData(data);
        console.log('[DB] Match updated successfully:', matchId);
        return data.matches[matchIndex];
    }
    return null;
}

async function deleteMatch(matchId) {
    console.log('[DB] Deleting match:', matchId);
    const data = await readData();
    data.matches = data.matches.filter(m => m.id !== matchId);
    await writeData(data);
    console.log('[DB] Match deleted successfully:', matchId);
}

async function updateMatchAttendance(matchId, playerId) {
    console.log('[DB] Updating attendance for match:', matchId, 'player:', playerId);
    const data = await readData();
    const matchIndex = data.matches.findIndex(m => m.id === matchId);
    if (matchIndex > -1) {
        const attending = data.matches[matchIndex].attending || [];
        if (!attending.includes(playerId)) {
            data.matches[matchIndex].attending.push(playerId);
        } else {
            data.matches[matchIndex].attending = attending.filter(id => id !== playerId);
        }
        await writeData(data);
        console.log('[DB] Attendance updated successfully');
        return data.matches[matchIndex];
    }
    return null;
}

async function updateLineup(matchId, lineup) {
    console.log('[DB] Updating lineup for match:', matchId);
    const data = await readData();
    const matchIndex = data.matches.findIndex(m => m.id === matchId);
    if (matchIndex > -1) {
        data.matches[matchIndex].lineup = lineup;
        await writeData(data);
        console.log('[DB] Lineup updated successfully');
        return data.matches[matchIndex];
    }
    return null;
}

// Bet Functions
function getOddsForBet(bet) {
    if (bet.type === 'result') {
        return BET_ODDS.RESULT;
    }
    if (bet.type === 'player_event') {
        switch (bet.details.event) {
            case 'scores': return BET_ODDS.PLAYER_SCORES;
            case 'assists': return BET_ODDS.PLAYER_ASSISTS;
            case 'gets_card': return BET_ODDS.PLAYER_GETS_CARD;
            case 'no_card': return BET_ODDS.PLAYER_NO_CARD;
            default: return 1;
        }
    }
    return 1;
}

async function getPlayerBets(playerId) {
    const data = await readData();
    return data.bets.filter(b => 
        (b.betMode === 'standard' && b.playerId === playerId) ||
        (b.betMode === 'pvp' && (b.proposerId === playerId || b.accepterId === playerId))
    );
}

async function getOpenPvPBets(excludePlayerId) {
    const data = await readData();
    return data.bets.filter(b => b.betMode === 'pvp' && b.status === 'proposed' && b.proposerId !== excludePlayerId);
}

async function addBet(betData) {
    console.log('[DB] Adding bet:', betData);
    const data = await readData();
    const playerIndex = data.players.findIndex(p => p.id === betData.playerId);

    if (playerIndex === -1) throw new Error('Player not found');
    if (data.players[playerIndex].coins < betData.amount) throw new Error('Not enough coins');

    data.players[playerIndex].coins -= betData.amount;

    const newBet = {
        id: uuidv4(),
        ...betData,
        status: 'pending',
        betMode: 'standard',
    };
    data.bets.push(newBet);
    await writeData(data);
    console.log('[DB] Bet added successfully:', newBet.id);
    return newBet;
}

async function addPvPBet(betData) {
    console.log('[DB] Adding PvP bet:', betData);
    const data = await readData();
    const proposerIndex = data.players.findIndex(p => p.id === betData.proposerId);

    if (proposerIndex === -1) throw new Error('Player not found');
    if (data.players[proposerIndex].coins < betData.amount) throw new Error('Not enough coins');

    data.players[proposerIndex].coins -= betData.amount;

    const newBet = {
        id: uuidv4(),
        ...betData,
        status: 'proposed',
        betMode: 'pvp',
        accepterId: null,
    };
    data.bets.push(newBet);
    await writeData(data);
    console.log('[DB] PvP bet added successfully:', newBet.id);
    return newBet;
}

async function acceptPvPBet(betId, accepterId) {
    console.log('[DB] Accepting PvP bet:', betId, 'by player:', accepterId);
    const data = await readData();
    const betIndex = data.bets.findIndex(b => b.id === betId);
    if (betIndex === -1) throw new Error('Bet not found');

    const accepterIndex = data.players.findIndex(p => p.id === accepterId);
    if (accepterIndex === -1) throw new Error('Accepter not found');
    
    const bet = data.bets[betIndex];
    if (bet.status !== 'proposed') throw new Error('Bet is not open for acceptance');

    const odds = getOddsForBet(bet);
    const accepterStake = Math.round(bet.amount * odds);

    if (data.players[accepterIndex].coins < accepterStake) throw new Error('Not enough coins to accept');

    data.players[accepterIndex].coins -= accepterStake;
    bet.accepterId = accepterId;
    bet.status = 'active';

    await writeData(data);
    console.log('[DB] PvP bet accepted successfully');
    return bet;
}

async function resolveBetsForMatch(matchId) {
    console.log('[DB] Resolving bets for match:', matchId);
    const data = await readData();
    const match = data.matches.find(m => m.id === matchId);

    if (!match || !match.played) return;

    const betsToResolve = data.bets.filter(b => b.matchId === matchId && (b.status === 'pending' || b.status === 'active' || b.status === 'proposed'));

    for (const bet of betsToResolve) {
        if (bet.betMode === 'pvp' && bet.status === 'proposed') {
            const proposerIndex = data.players.findIndex(p => p.id === bet.proposerId);
            if (proposerIndex !== -1) {
                data.players[proposerIndex].coins += bet.amount;
            }
            bet.status = 'void';
            continue;
        }

        let isWin = false;
        let payout = 0;

        if (bet.type === 'result') {
            const { us, them } = bet.details;
            if (match.result.us === us && match.result.them === them) {
                isWin = true;
                payout = bet.amount * BET_ODDS.RESULT;
            }
        } else if (bet.type === 'player_event') {
            const { playerId, event } = bet.details;
            const playerStat = match.stats.find(s => s.playerId === playerId);
            const goals = playerStat?.goals || 0;
            const assists = playerStat?.assists || 0;
            const yellowCards = playerStat?.yellowCards || 0;
            const redCards = playerStat?.redCards || 0;

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
            }
        }

        if (bet.betMode === 'standard') {
            if (isWin) {
                bet.status = 'won';
                const playerIndex = data.players.findIndex(p => p.id === bet.playerId);
                if (playerIndex !== -1) {
                    data.players[playerIndex].coins += payout;
                }
            } else {
                bet.status = 'lost';
            }
        } else if (bet.betMode === 'pvp' && bet.status === 'active') {
            const proposerIndex = data.players.findIndex(p => p.id === bet.proposerId);
            const accepterIndex = data.players.findIndex(p => p.id === bet.accepterId);
            const odds = getOddsForBet(bet);
            const accepterStake = Math.round(bet.amount * odds);
            const proposerStake = bet.amount;

            if (proposerIndex !== -1 && accepterIndex !== -1) {
                if (isWin) { // Proposer wins
                    data.players[proposerIndex].coins += proposerStake + accepterStake;
                    bet.status = 'won';
                } else { // Accepter wins
                    data.players[accepterIndex].coins += accepterStake + proposerStake;
                    bet.status = 'lost';
                }
            }
        }
    }
    await writeData(data);
    console.log('[DB] Bets resolved successfully for match:', matchId);
}

module.exports = {
    getData,
    addMatch,
    updateMatch,
    deleteMatch,
    updateMatchAttendance,
    updateLineup,
    getPlayerBets,
    getOpenPvPBets,
    addBet,
    addPvPBet,
    acceptPvPBet,
    resolveBetsForMatch,
};