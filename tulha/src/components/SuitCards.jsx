import { useGameStore, SUITS } from '../store/gameStore';

export default function SuitCards() {
  const { suits, players, playerNames, playerStatus, meIndex, currentTurn, addTrick } = useGameStore();
  const isMyTurn = currentTurn === meIndex;

  // Find best suit for me to lead
  const suitScores = SUITS.map(suit => {
    const s = suits[suit.key];
    if (!s) return { key: suit.key, score: 0, r: 0 };
    const r = s.total - s.discarded;
    const outExcludeMe = players.filter(i => i !== meIndex && !playerStatus[i]?.[suit.key]).length;
    const p = r / s.total;
    return { key: suit.key, score: p * 0.4 + (1 - outExcludeMe / Math.max(players.length - 1, 1)) * 0.6, r };
  });
  const bestSuitKey = [...suitScores].filter(s => s.r > 0).sort((a, b) => b.score - a.score)[0]?.key;

  return (
    <div className="grid grid-cols-2 gap-3">
      {SUITS.map(suit => {
        const s = suits[suit.key];
        if (!s) return null;
        const remaining = s.total - s.discarded;
        const percent = remaining / s.total;
        const risk = percent < 0.3;

        // Safe-to-lead for ME
        const outPlayers = players.filter(i => i !== meIndex && !playerStatus[i]?.[suit.key]);
        const outCount = outPlayers.length;
        const safetyLevel = outCount === 0 ? 'safe' : outCount === 1 ? 'caution' : 'danger';
        const safetyLabel = outCount === 0
          ? '✅ SAFE — no one out'
          : outCount === 1
            ? `⚠ ${playerNames[outPlayers[0]]} will tullah`
            : `🚫 ${outCount} will tullah you`;
        const safetyColor = safetyLevel === 'safe' ? '#4ade80' : safetyLevel === 'caution' ? '#f59e0b' : '#e63946';

        const isBestForMe = isMyTurn && suit.key === bestSuitKey && remaining > 0;

        return (
          <button
            key={suit.key}
            className={`tap-btn block w-full text-left rounded-[14px] p-4 lg:p-5 cursor-pointer
              transition-all duration-200 border-2 relative
              ${isBestForMe
                ? 'bg-gradient-to-br from-[#0e1a0e] to-[#081a08] border-gold/40 shadow-[0_0_24px_#c9a84c20]'
                : risk
                  ? 'bg-gradient-to-br from-[#1a0808] to-[#120508] border-danger/25 shadow-[0_0_20px_#e6394614] animate-pulse-glow'
                  : 'bg-gradient-to-br from-bg-secondary to-bg-card border-gold/10 hover:border-gold/25'
              }
              ${remaining <= 0 ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            onClick={() => remaining > 0 && addTrick(suit.key)}
            disabled={remaining <= 0}
          >
            {/* Best for me ribbon */}
            {isBestForMe && (
              <div className="absolute -top-0.5 right-3 rounded-b-md px-2 py-0.5 bg-gold text-bg-primary text-[7px] font-bold tracking-wider">
                🎯 LEAD THIS
              </div>
            )}

            {/* Top row */}
            <div className="flex justify-between items-start mb-2">
              <span className="text-[30px] lg:text-[36px] leading-none" style={{ color: suit.color }}>
                {suit.symbol}
              </span>
              {risk && (
                <span className="text-danger text-[10px] font-bold tracking-wider">⚠ RISK</span>
              )}
            </div>

            {/* Suit label */}
            <div className="text-text-muted text-xs mb-2">{suit.label}</div>

            {/* Safe-to-lead indicator */}
            {remaining > 0 && (
              <div
                className="rounded-md px-2 py-1 mb-2 text-[9px] font-bold tracking-wide border"
                style={{
                  color: safetyColor,
                  background: `${safetyColor}12`,
                  borderColor: `${safetyColor}25`,
                }}
              >
                {safetyLabel}
              </div>
            )}

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
