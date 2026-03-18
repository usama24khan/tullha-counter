import { useGameStore, SUITS } from '../store/gameStore';

export default function Header({ onReset }) {
  const { players, playerNames, decks, meIndex, currentTurn, undoLastAction, nextTurn } = useGameStore();
  const isMyTurn = currentTurn === meIndex;

  return (
    <div className="bg-bg-header border-b border-gold/10 px-3.5 lg:px-8 py-2.5 lg:py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2.5">
        <span className="text-hearts text-lg">♥</span>
        <span className="text-spades text-lg">♠</span>
        <div className="ml-1">
          <div className="text-gold font-bold text-[15px] lg:text-lg tracking-[2px]">THULLA TRACKER</div>
          <div className="text-text-darker text-[10px]">
            {players.length} active · {decks} deck{decks > 1 ? 's' : ''} · {decks * 52} cards
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Turn indicator */}
        <div
          className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold tracking-wider border transition-all
            ${isMyTurn
              ? 'bg-gold/15 border-gold/40 text-gold animate-pulse'
              : 'bg-bg-secondary border-border-light text-text-dark'
            }`}
        >
          {isMyTurn ? '👑 YOUR TURN' : `🎯 ${playerNames[currentTurn] || 'P' + (currentTurn + 1)}`}
        </div>
        {/* Next turn */}
        <button
          onClick={nextTurn}
          className="bg-bg-secondary border border-border-light text-text-muted rounded-lg px-2.5 py-1.5 cursor-pointer text-[13px]
            hover:border-gold/30 hover:text-gold transition-all tap-btn-sm"
          title="Next player's turn"
        >
          ⏭
        </button>
        <button
          onClick={undoLastAction}
          className="bg-transparent border border-text-muted/30 text-text-muted rounded-lg px-3 py-1.5 cursor-pointer text-[15px]
            hover:border-text-muted/60 hover:text-text-primary transition-all tap-btn-sm"
          title="Undo last action"
        >
          ↩
        </button>
        <button
          onClick={onReset}
          className="bg-transparent border border-danger/30 text-danger rounded-lg px-3 py-1.5 cursor-pointer text-[15px]
            hover:border-danger/60 hover:bg-danger/10 transition-all tap-btn-sm"
          title="Reset game"
        >
          ↺
        </button>
      </div>
    </div>
  );
}
