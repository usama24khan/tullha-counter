import { useGameStore, SUITS } from '../store/gameStore';

export default function SuitCards() {
  const { suits, players, addTrick } = useGameStore();

  return (
    <div className="grid grid-cols-2 gap-3">
      {SUITS.map(suit => {
        const s = suits[suit.key];
        if (!s) return null;
        const remaining = s.total - s.discarded;
        const percent = remaining / s.total;
        const risk = percent < 0.3;

        return (
          <button
            key={suit.key}
            className={`tap-btn block w-full text-left rounded-[14px] p-4 lg:p-5 cursor-pointer
              transition-all duration-200 border-2
              ${risk
                ? 'bg-gradient-to-br from-[#1a0808] to-[#120508] border-danger/25 shadow-[0_0_20px_#e6394614] animate-pulse-glow'
                : 'bg-gradient-to-br from-bg-secondary to-bg-card border-gold/10 hover:border-gold/25'
              }
              ${remaining <= 0 ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            onClick={() => remaining > 0 && addTrick(suit.key)}
            disabled={remaining <= 0}
          >
            {/* Top row */}
            <div className="flex justify-between items-start mb-2.5">
              <span className="text-[30px] lg:text-[36px] leading-none" style={{ color: suit.color }}>
                {suit.symbol}
              </span>
              {risk && (
                <span className="text-danger text-[10px] font-bold tracking-wider">⚠ RISK</span>
              )}
            </div>

            {/* Suit label */}
            <div className="text-text-muted text-xs mb-2">{suit.label}</div>

            {/* Progress bar */}
            <div className="bg-bg-primary rounded h-[5px] mb-2.5 overflow-hidden">
              <div
                className="h-full rounded transition-all duration-400"
                style={{
                  width: `${percent * 100}%`,
                  background: risk
                    ? 'linear-gradient(90deg, #e63946, #ff6b7a)'
                    : `linear-gradient(90deg, ${suit.color}44, ${suit.color})`,
                }}
              />
            </div>

            {/* Bottom row */}
            <div className="flex justify-between items-center">
              <div>
                <span
                  className="text-xl lg:text-[22px] font-bold"
                  style={{ color: risk ? '#e63946' : '#4ade80' }}
                >
                  {remaining}
                </span>
                <span className="text-text-darker text-[11px]"> / {s.total}</span>
              </div>
              <div
                className="rounded-lg px-2.5 py-1 text-[11px] font-bold border"
                style={{
                  background: remaining <= 0 ? '#0d1e33' : `${suit.color}22`,
                  borderColor: `${suit.color}44`,
                  color: remaining <= 0 ? '#1e3050' : suit.color,
                }}
              >
                {remaining <= 0 ? 'DONE' : `−${players.length}`}
              </div>
            </div>

            <div className="text-text-darker text-[9px] mt-1.5 tracking-wider">TAP TO RECORD TRICK</div>
          </button>
        );
      })}
    </div>
  );
}
