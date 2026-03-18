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
  const playerCards = {};
  players.forEach(i => { playerCards[i] = []; });
  return {
    players,
    playerNames,
    decks,
    suits,
    playerStatus,
    playerCards,
    history: [],
    thullaLog: [],
    isStarted: true,
    meIndex: 0,           // "Me" is always index 0
    currentTurn: 0,       // whose turn it is currently
    turnLeader: 0,        // who led the current trick
  };
}

export const useGameStore = create((set, get) => ({
  // Initial empty state
  players: [],
  playerNames: [],
  decks: 1,
  suits: {},
  playerStatus: {},
  playerCards: {},
  history: [],
  thullaLog: [],
  isStarted: false,
  meIndex: 0,
  currentTurn: 0,
  turnLeader: 0,

  initGame: ({ players, playerNames, decks }) => {
    set(buildInitialState({ players, playerNames, decks }));
  },

  // Turn management
  setTurnLeader: (playerIdx) => {
    set({ turnLeader: playerIdx, currentTurn: playerIdx });
  },

  nextTurn: () => {
    const state = get();
    const activePlayers = state.players;
    if (activePlayers.length === 0) return;
    const currentIdx = activePlayers.indexOf(state.currentTurn);
    const nextIdx = (currentIdx + 1) % activePlayers.length;
    set({ currentTurn: activePlayers[nextIdx] });
  },

  isMyTurn: () => {
    const state = get();
    return state.currentTurn === state.meIndex;
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

  recordThulla: (playerIdx, ledSuit, thrownSuit, cardGiven, receiverIdx) => {
    const state = get();
    const entry = {
      id: Date.now() + Math.random(),
      type: 'thulla',
      playerIdx,
      playerName: state.playerNames[playerIdx],
      ledSuit,
      thrownSuit,
      cardGiven: cardGiven || null,
      receiverIdx: receiverIdx ?? null,
      receiverName: receiverIdx != null ? state.playerNames[receiverIdx] : null,
      ts: new Date().toLocaleTimeString(),
    };

    // Build updated playerCards — transfer card from giver (if they have it) and add to receiver
    const updatedCards = { ...state.playerCards };
    let removedFromGiver = false;
    if (cardGiven) {
      const giverCards = [...(updatedCards[playerIdx] || [])];
      const giverCardIdx = giverCards.findIndex(c => c.label === cardGiven);
      if (giverCardIdx >= 0) {
        giverCards.splice(giverCardIdx, 1);
        updatedCards[playerIdx] = giverCards;
        removedFromGiver = true;
      }
      if (receiverIdx != null) {
        updatedCards[receiverIdx] = [
          ...(updatedCards[receiverIdx] || []),
          { label: cardGiven, fromPlayer: state.playerNames[playerIdx], ts: entry.ts },
        ];
      }
    }
    entry.removedFromGiver = removedFromGiver;

    set({
      playerStatus: {
        ...state.playerStatus,
        [playerIdx]: { ...state.playerStatus[playerIdx], [ledSuit]: false },
      },
      playerCards: updatedCards,
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

  removeCardBadge: (playerIdx, cardIndex) => {
    const state = get();
    const cards = [...(state.playerCards[playerIdx] || [])];
    if (cardIndex >= 0 && cardIndex < cards.length) {
      cards.splice(cardIndex, 1);
      set({
        playerCards: { ...state.playerCards, [playerIdx]: cards },
      });
    }
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
      const updatedCards = { ...state.playerCards };
      if (last.receiverIdx != null && last.cardGiven) {
        const cards = [...(updatedCards[last.receiverIdx] || [])];
        const removeIdx = cards.findLastIndex(c => c.label === last.cardGiven);
        if (removeIdx >= 0) cards.splice(removeIdx, 1);
        updatedCards[last.receiverIdx] = cards;
      }
      if (last.removedFromGiver && last.cardGiven) {
        updatedCards[last.playerIdx] = [
          ...(updatedCards[last.playerIdx] || []),
          { label: last.cardGiven, fromPlayer: last.receiverName || 'restored', ts: last.ts },
        ];
      }

      set({
        playerStatus: {
          ...state.playerStatus,
          [last.playerIdx]: { ...state.playerStatus[last.playerIdx], [last.ledSuit]: true },
        },
        playerCards: updatedCards,
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
      playerCards: {},
      history: [],
      thullaLog: [],
      isStarted: false,
      meIndex: 0,
      currentTurn: 0,
      turnLeader: 0,
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
