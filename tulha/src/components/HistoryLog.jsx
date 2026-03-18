import { useGameStore, SUITS } from '../store/gameStore';

export default function HistoryLog() {
  const { history, exportHistory } = useGameStore();

  const getIcon = (type) => {
    switch (type) {
      case 'trick': return '🃏';
      case 'thulla': return '✂️';
      case 'remove': return '🚫';
      default: return '📌';
    }
  };

  const getBg = (type) => {
    switch (type) {
      case 'trick': return 'bg-bg-secondary border-gold/10';
      case 'thulla': return 'bg-[#0a0418] border-danger/10';
      case 'remove': return 'bg-[#1a0808] border-danger/15';
      default: return 'bg-bg-secondary border-border';
    }
  };

  const renderEntry = (entry) => {
    if (entry.type === 'trick') {
      const suit = SUITS.find(s => s.key === entry.suit);
      return (
        <div className="flex items-center gap-2">
          <span className="text-lg" style={{ color: suit?.color }}>{suit?.symbol}</span>
          <div>
            <span className="text-text-primary font-bold text-xs">Trick recorded</span>
            <span className="text-text-dark text-xs"> — {suit?.label}</span>
          </div>
          <span className="ml-auto text-gold/60 text-[10px] font-bold">−{entry.count} cards</span>
        </div>
      );
    }

    if (entry.type === 'thulla') {
      const led = SUITS.find(s => s.key === entry.ledSuit);
      const thrown = SUITS.find(s => s.key === entry.thrownSuit);
      return (
        <div className="flex items-center gap-2">
          <span className="text-lg" style={{ color: led?.color }}>{led?.symbol}</span>
          <div>
            <span className="text-text-primary font-bold text-xs">{entry.playerName}</span>
            <span className="text-text-dark text-xs"> cut </span>
            <span style={{ color: led?.color }} className="text-xs">{led?.label}</span>
            <span className="text-text-dark text-xs"> → </span>
            <span style={{ color: thrown?.color }} className="text-xs">{thrown?.symbol}</span>
          </div>
        </div>
      );
    }

    if (entry.type === 'remove') {
      return (
        <div className="flex items-center gap-2">
          <span className="text-danger text-sm">✕</span>
          <div>
            <span className="text-text-primary font-bold text-xs">{entry.playerName}</span>
            <span className="text-text-dark text-xs"> removed from game</span>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="bg-bg-secondary border border-gold/20 rounded-full px-3.5 py-1 text-gold text-xs font-bold">
            {history.length} Actions
          </span>
        </div>
        {history.length > 0 && (
          <button
            onClick={exportHistory}
            className="bg-bg-secondary border border-gold/20 rounded-lg px-3 py-1.5 text-gold text-[11px] cursor-pointer
              hover:border-gold/40 hover:bg-gold/5 transition-all tap-btn-sm"
          >
            📥 Export JSON
          </button>
        )}
      </div>

      {/* Log entries */}
      {history.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-text-darkest text-4xl mb-3">📋</div>
          <div className="text-text-darker text-sm">No actions recorded yet</div>
          <div className="text-text-darkest text-xs mt-1">Start playing to see the history log</div>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-[60vh] overflow-y-auto pr-1">
          {history.map((entry, idx) => (
            <div
              key={entry.id || idx}
              className={`${getBg(entry.type)} border rounded-lg py-2.5 px-3 transition-all hover:opacity-90`}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm">{getIcon(entry.type)}</span>
                <div className="flex-1">{renderEntry(entry)}</div>
              </div>
              <div className="text-[#0e1a28] text-[9px] text-right">{entry.ts}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
