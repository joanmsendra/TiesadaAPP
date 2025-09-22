import { v4 as uuidv4 } from 'uuid';

export const PLAYERS = [
  { id: '1', name: 'Joan', position: 'Portero', photo: 'https://placehold.co/100x100/3498db/FFFFFF/png?text=J', coins: 1000 },
  { id: '2', name: 'Guille', position: 'Defensa', photo: 'https://placehold.co/100x100/2ecc71/FFFFFF/png?text=G', coins: 1000 },
  { id: '3', name: 'Ivan', position: 'Defensa', photo: 'https://placehold.co/100x100/e74c3c/FFFFFF/png?text=I', coins: 1000 },
  { id: '4', name: 'Jandro', position: 'Medio', photo: 'https://placehold.co/100x100/f1c40f/FFFFFF/png?text=J', coins: 1000 },
  { id: '5', name: 'Jota', position: 'Medio', photo: 'https://placehold.co/100x100/9b59b6/FFFFFF/png?text=J', coins: 1000 },
  { id: '6', name: 'Carrasco', position: 'Delantero', photo: 'https://placehold.co/100x100/1abc9c/FFFFFF/png?text=C', coins: 1000 },
  { id: '7', name: 'Toni', position: 'Delantero', photo: 'https://placehold.co/100x100/e67e22/FFFFFF/png?text=T', coins: 1000 },
];

export const MATCHES = [
  {
    id: '1',
    opponent: 'Los Rivales FC',
    date: '2025-09-27T19:00:00.000Z',
    played: false,
    attending: ['1', '3', '5', '6'],
    lineup: { 'gk': null, 'def1': null, 'def2': null, 'fwd1': null, 'fwd2': null },
    emoji: '⚔️',
  },
  {
    id: '2',
    opponent: 'Atlético de Bario',
    date: '2025-10-04T18:30:00.000Z',
    played: false,
    attending: [],
    lineup: { 'gk': null, 'def1': null, 'def2': null, 'fwd1': null, 'fwd2': null },
    emoji: '🔥',
  },
  {
    id: '3',
    opponent: 'La Penya',
    date: '2025-09-20T20:00:00.000Z',
    played: true,
    result: { us: 4, them: 2 },
    stats: [
      { playerId: '6', goals: 2, assists: 1, yellowCards: 1, redCards: 0 },
      { playerId: '7', goals: 2, assists: 0, yellowCards: 0, redCards: 0 },
      { playerId: '4', goals: 0, assists: 2, yellowCards: 0, redCards: 0 },
      { playerId: '2', goals: 0, assists: 0, yellowCards: 0, redCards: 1 },
    ],
    emoji: '🏆',
  },
];
