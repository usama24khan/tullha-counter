import { useGameStore } from '../store/gameStore';

export default function Header({ onReset }) {
  const { players, decks, undoLastAction } = useGameStore();

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

      <div className="flex gap-2">
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
