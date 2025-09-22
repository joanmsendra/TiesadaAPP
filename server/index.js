const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// Endpoint to get all data
app.get('/data', async (req, res) => {
    const data = await db.getData();
    res.json(data);
});

// Matches
app.get('/matches', async (req, res) => {
    const data = await db.getData();
    res.json(data.matches);
});

app.post('/matches', async (req, res) => {
    try {
        const newMatch = await db.addMatch(req.body);
        res.json(newMatch);
    } catch (error) {
        console.error('[SERVER ERROR] Failed to add match:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.put('/matches/:id', async (req, res) => {
    try {
        const updatedMatch = await db.updateMatch(req.params.id, req.body);
        res.json(updatedMatch);
    } catch (error) {
        console.error('[SERVER ERROR] Failed to update match:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.delete('/matches/:id', async (req, res) => {
    await db.deleteMatch(req.params.id);
    res.status(204).send();
});

app.post('/matches/:id/attendance', async (req, res) => {
    const { playerId } = req.body;
    const updatedMatch = await db.updateMatchAttendance(req.params.id, playerId);
    res.json(updatedMatch);
});

app.put('/matches/:id/lineup', async (req, res) => {
    const updatedMatch = await db.updateLineup(req.params.id, req.body);
    res.json(updatedMatch);
});


// Players
app.get('/players', async (req, res) => {
    const data = await db.getData();
    res.json(data.players);
});

app.get('/players/:id/bets', async (req, res) => {
    const bets = await db.getPlayerBets(req.params.id);
    res.json(bets);
});

// Bets
app.get('/bets/pvp/open', async (req, res) => {
    const { excludePlayerId } = req.query;
    const openBets = await db.getOpenPvPBets(excludePlayerId);
    res.json(openBets);
});

app.post('/bets', async (req, res) => {
    try {
        const newBet = await db.addBet(req.body);
        res.json(newBet);
    } catch (error) {
        console.error('[SERVER ERROR] Failed to add bet:', error);
        res.status(400).json({ message: error.message });
    }
});

app.post('/bets/pvp', async (req, res) => {
    try {
        const newBet = await db.addPvPBet(req.body);
        res.json(newBet);
    } catch (error) {
        console.error('[SERVER ERROR] Failed to add PvP bet:', error);
        res.status(400).json({ message: error.message });
    }
});

app.post('/bets/pvp/:id/accept', async (req, res) => {
    try {
        const { accepterId } = req.body;
        const bet = await db.acceptPvPBet(req.params.id, accepterId);
        res.json(bet);
    } catch (error) {
        console.error('[SERVER ERROR] Failed to accept PvP bet:', error);
        res.status(400).json({ message: error.message });
    }
});

app.post('/matches/:id/resolve-bets', async (req, res) => {
    await db.resolveBetsForMatch(req.params.id);
    res.status(200).send();
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
