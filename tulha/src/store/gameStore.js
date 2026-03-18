import { create } from 'zustand';

const SUIT_KEYS = ['hearts', 'diamonds', 'clubs', 'spades'];

function buildInitialState({ players, playerNames, decks }) {
  const totalPerSuit = decks * 13;
  const suits = {};
  SUIT_KEYS.forEach(key => { suits[key] = { total: totalPerSuit, discarded: 0 }; });
  const playerStatus = {};
  players.forEach(i => {
    playerStatus[i] = { hearts: true, diamonds: true, clubs: true, spades: true };
  });
  return {
    players,
    playerNames,
    decks,
    suits,
    playerStatus,
    history: [],
    thullaLog: [],
    isStarted: true,
  };
}

export const useGameStore = create((set, get) => ({
  // Initial empty state
  players: [],
  playerNames: [],
  decks: 1,
  suits: {},
  playerStatus: {},
  history: [],
  thullaLog: [],
  isStarted: false,

  initGame: ({ players, playerNames, decks }) => {
    set(buildInitialState({ players, playerNames, decks }));
  },

  addTrick: (suitKey) => {
    const state = get();
    const s = state.suits[suitKey];
    const remaining = s.total - s.discarded;
    const sub = Math.min(state.players.length, remaining);
    if (sub <= 0) return;

    const entry = {
      id: Date.now() + Math.random(),
      type: 'trick',
      suit: suitKey,
      count: sub,
      ts: new Date().toLocaleTimeString(),
    };

    set({
      suits: { ...state.suits, [suitKey]: { ...s, discarded: s.discarded + sub } },
      history: [entry, ...state.history],
    });
  },

  recordThulla: (playerIdx, ledSuit, thrownSuit) => {
    const state = get();
    const entry = {
      id: Date.now() + Math.random(),
      type: 'thulla',
      playerIdx,
      playerName: state.playerNames[playerIdx],
      ledSuit,
      thrownSuit,
      ts: new Date().toLocaleTimeString(),
    };

    set({
      playerStatus: {
        ...state.playerStatus,
        [playerIdx]: { ...state.playerStatus[playerIdx], [ledSuit]: false },
      },
      thullaLog: [entry, ...state.thullaLog],
      history: [entry, ...state.history],
    });
  },

  removePlayer: (playerIdx) => {
    const state = get();
    const entry = {
      id: Date.now() + Math.random(),
      type: 'remove',
      playerIdx,
      playerName: state.playerNames[playerIdx],
      ts: new Date().toLocaleTimeString(),
    };
    set({
      players: state.players.filter(i => i !== playerIdx),
      history: [entry, ...state.history],
    });
  },

  undoLastAction: () => {
    const state = get();
    const [last, ...rest] = state.history;
    if (!last) return;

    if (last.type === 'trick') {
      const s = state.suits[last.suit];
      set({
        suits: { ...state.suits, [last.suit]: { ...s, discarded: s.discarded - last.count } },
        history: rest,
      });
    } else if (last.type === 'thulla') {
      set({
        playerStatus: {
          ...state.playerStatus,
          [last.playerIdx]: { ...state.playerStatus[last.playerIdx], [last.ledSuit]: true },
        },
        thullaLog: state.thullaLog.filter(t => t.id !== last.id),
        history: rest,
      });
    } else if (last.type === 'remove') {
      set({
        players: [...state.players, last.playerIdx].sort((a, b) => a - b),
        history: rest,
      });
    }
  },

  resetGame: () => {
    set({
      players: [],
      playerNames: [],
      decks: 1,
      suits: {},
      playerStatus: {},
      history: [],
      thullaLog: [],
      isStarted: false,
    });
  },

  // Helpers
  getRemaining: (suitKey) => {
    const s = get().suits[suitKey];
    return s ? s.total - s.discarded : 0;
  },

  getPercent: (suitKey) => {
    const s = get().suits[suitKey];
    return s ? (s.total - s.discarded) / s.total : 1;
  },

  getTotalRemaining: () => {
    const suits = get().suits;
    return Object.values(suits).reduce((a, s) => a + (s.total - s.discarded), 0);
  },

  getTotalDiscarded: () => {
    const suits = get().suits;
    return Object.values(suits).reduce((a, s) => a + s.discarded, 0);
  },

  exportHistory: () => {
    const state = get();
    const data = {
      gameInfo: {
        players: state.playerNames.filter((_, i) => state.players.includes(i)),
        decks: state.decks,
        totalCards: state.decks * 52,
      },
      suits: Object.entries(state.suits).map(([key, s]) => ({
        suit: key,
        total: s.total,
        discarded: s.discarded,
        remaining: s.total - s.discarded,
      })),
      playerStatus: state.players.map(i => ({
        name: state.playerNames[i],
        suits: state.playerStatus[i],
      })),
      history: state.history,
      thullaLog: state.thullaLog,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tullha-game-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },
}));

export const SUITS = [
  { key: 'hearts',   label: 'Hearts',   symbol: '♥', color: '#e63946', twColor: 'text-hearts'   },
  { key: 'diamonds', label: 'Diamonds', symbol: '♦', color: '#e05c67', twColor: 'text-diamonds' },
  { key: 'clubs',    label: 'Clubs',    symbol: '♣', color: '#a8c8ff', twColor: 'text-clubs'    },
  { key: 'spades',   label: 'Spades',   symbol: '♠', color: '#b8d0f0', twColor: 'text-spades'   },
];
