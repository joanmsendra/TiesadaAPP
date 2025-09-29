export const BET_ODDS = {
    RESULT: 5,
    PLAYER_SCORES: 3.5,
    PLAYER_ASSISTS: 2.5,
    PLAYER_GETS_CARD: 3,
    PLAYER_NO_CARD: 1 / 3,
    PLAYER_CAGADAS: 2.0, // <-- ¡Nueva apuesta!
};

export const getOddsForBet = (bet) => {
    if (!bet || !bet.type) return 1;

    if (bet.type === 'result') {
        return BET_ODDS.RESULT;
    }
    if (bet.type === 'player_event' && bet.details) {
        switch (bet.details.event) {
            case 'scores': return BET_ODDS.PLAYER_SCORES;
            case 'assists': return BET_ODDS.PLAYER_ASSISTS;
            case 'gets_card': return BET_ODDS.PLAYER_GETS_CARD;
            case 'no_card': return BET_ODDS.PLAYER_NO_CARD;
            case 'cagadas': return BET_ODDS.PLAYER_CAGADAS; // <-- ¡Nueva apuesta!
            default: return 1;
        }
    }
    return 1;
};


