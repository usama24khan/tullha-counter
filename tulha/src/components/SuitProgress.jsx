import { useGameStore, SUITS } from '../store/gameStore';

export default function SuitProgress() {
  const { suits, thullaLog } = useGameStore();

  return (
    <>
      {/* Suit progress bars */}
      <div className="text-text-darker text-[10px] tracking-[2px] mb-3.5">SUIT PROGRESS</div>
      {SUITS.map(suit => {
        const s = suits[suit.key];
        if (!s) return null;
        const r = s.total - s.discarded;
        const p = r / s.total;
        return (
          <div key={suit.key} className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-[13px]" style={{ color: suit.color }}>{suit.symbol} {suit.label}</span>
              <span
                className="text-xs font-bold"
                style={{ color: p < 0.3 ? '#e63946' : '#4ade80' }}
              >
                {r}/{s.total}
              </span>
            </div>
            <div className="bg-bg-primary rounded h-2 overflow-hidden">
              <div
                className="h-full rounded transition-all duration-400"
                style={{
                  width: `${p * 100}%`,
                  background: p < 0.3
                    ? 'linear-gradient(90deg, #e63946, #ff6b7a)'
                    : `linear-gradient(90deg, ${suit.color}44, ${suit.color})`,
                }}
              />
            </div>
            {p < 0.3 && (
              <div className="text-danger text-[9px] mt-0.5">⚠ {Math.round(p * 100)}% left</div>
            )}
          </div>
        );
      })}

      {/* Thulla log */}
      <div className="border-t border-border-light pt-4 mt-2">
        <div className="text-text-darker text-[10px] tracking-[2px] mb-3">THULLA LOG</div>
        {thullaLog.length === 0 ? (
          <div className="text-border-light text-xs">None yet.</div>
        ) : (
          thullaLog.slice(0, 8).map(t => {
            const led = SUITS.find(s => s.key === t.ledSuit);
            const thrown = SUITS.find(s => s.key === t.thrownSuit);
            return (
              <div key={t.id} className="bg-[#0a0418] border border-danger/10 rounded-lg py-1.5 px-2.5 mb-1.5 text-[11px]">
                <span className="text-text-primary font-bold">{t.playerName}</span>
                <span className="text-text-darker"> out of </span>
                <span style={{ color: led?.color }}>{led?.symbol}</span>
                <span className="text-text-darker"> → </span>
                <span style={{ color: thrown?.color }}>{thrown?.symbol}</span>
                <span className="text-[#0e1a28] float-right">{t.ts}</span>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
