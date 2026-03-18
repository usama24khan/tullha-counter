import { useState } from 'react';
import { useGameStore, SUITS } from '../store/gameStore';

export default function PlayerStatus() {
  const { players, playerNames, playerStatus, removePlayer, thullaLog, history } = useGameStore();
  const [confirmRemove, setConfirmRemove] = useState(null);

  const removedPlayers = history.filter(h => h.type === 'remove');

  return (
    <div>
      {/* Active count */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <span className="bg-bg-secondary border border-gold/20 rounded-full px-3.5 py-1 text-gold text-xs font-bold">
            {players.length} Active Players
          </span>
          {players.length < 4 && (
            <span className="text-danger text-[11px]">⚠ Below minimum</span>
          )}
        </div>
        <span className="text-text-darker text-[11px]">Tap ✕ to remove player</span>
      </div>

      {/* Player cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 mb-6">
        {players.map(i => {
          const allOut = SUITS.every(s => !playerStatus[i]?.[s.key]);
          const outCount = SUITS.filter(s => !playerStatus[i]?.[s.key]).length;
          const isConfirming = confirmRemove === i;

          return (
            <div
              key={i}
              className={`rounded-xl p-3.5 px-4 transition-all duration-200 border
                ${allOut
                  ? 'bg-gradient-to-br from-[#1a0808] to-[#120508] border-danger/25 shadow-[0_0_16px_#e6394614]'
                  : isConfirming
                    ? 'bg-gradient-to-br from-bg-secondary to-bg-card border-danger/50'
                    : 'bg-gradient-to-br from-bg-secondary to-bg-card border-border'
                }`}
            >
              {/* Header row */}
              <div className="flex justify-between items-center mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[13px] border
                      ${allOut
                        ? 'bg-danger/10 border-danger/25 text-danger'
                        : 'bg-gold/10 border-gold/25 text-gold'
                      }`}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-text-primary font-bold text-sm lg:text-[15px]">{playerNames[i]}</div>
                    <div
                      className={`text-[10px] mt-0.5
                        ${outCount === 0 ? 'text-text-dark' : outCount === 1 ? 'text-warning' : 'text-danger'}`}
                    >
                      {outCount === 0 ? 'All suits active' : outCount === 1 ? '1 suit out' : `${outCount} suits out`}
                      {allOut && ' · NO CARDS LEFT'}
                    </div>
                  </div>
                </div>

                {/* Remove/confirm buttons */}
                {!isConfirming ? (
                  <button
                    onClick={() => setConfirmRemove(i)}
                    className="bg-[#1a0808] border border-danger/20 rounded-lg text-danger px-2.5 py-1.5 cursor-pointer text-[13px]
                      hover:border-danger/40 hover:bg-danger/10 transition-all tap-btn-sm"
                  >
                    ✕
                  </button>
                ) : (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setConfirmRemove(null)}
                      className="bg-bg-secondary border border-border rounded-lg text-text-muted px-2.5 py-1.5 cursor-pointer text-xs"
                    >
                      Keep
                    </button>
                    <button
                      onClick={() => { removePlayer(i); setConfirmRemove(null); }}
                      className="bg-gradient-to-br from-danger to-[#b02030] border-none rounded-lg text-white px-3 py-1.5 cursor-pointer text-xs font-bold"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Suit status */}
              <div className="flex gap-2">
                {SUITS.map(s => {
                  const has = playerStatus[i]?.[s.key];
                  return (
                    <div
                      key={s.key}
                      className={`flex-1 rounded-lg py-1.5 px-1 text-center border
                        ${has
                          ? 'bg-[#081a0a] border-success/10'
                          : 'bg-[#1a0808] border-danger/15'
                        }`}
                    >
                      <div className="text-base lg:text-lg" style={{ color: has ? s.color : '#2a1010' }}>
                        {s.symbol}
                      </div>
                      <div className={`text-[8px] mt-0.5 ${has ? 'text-[#1a4a1a]' : 'text-[#4a1010]'}`}>
                        {has ? 'HAS' : 'OUT'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* All-out suggestion */}
              {allOut && !isConfirming && (
                <div className="mt-2.5 bg-danger/10 border border-danger/20 rounded-lg py-2 px-3 flex justify-between items-center">
                  <span className="text-danger text-[11px]">🚫 Out of all suits — no cards left?</span>
                  <button
                    onClick={() => setConfirmRemove(i)}
                    className="bg-danger border-none rounded-md text-white px-2.5 py-1 cursor-pointer text-[11px] font-bold"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Removed players */}
      {removedPlayers.length > 0 && (
        <div className="mb-5">
          <div className="text-text-darker text-[10px] tracking-[2px] mb-2.5">REMOVED PLAYERS</div>
          {removedPlayers.map(h => (
            <div key={h.id} className="bg-bg-header border border-border-light rounded-lg py-2 px-3.5 mb-1.5 flex justify-between items-center text-xs">
              <div>
                <span className="text-danger">✕ </span>
                <span className="text-text-muted">{h.playerName}</span>
                <span className="text-text-darker"> removed from game</span>
              </div>
              <span className="text-[#0e1a28] text-[10px]">{h.ts}</span>
            </div>
          ))}
        </div>
      )}

      {/* Thulla log */}
      {thullaLog.length > 0 && (
        <div>
          <div className="text-text-darker text-[10px] tracking-[2px] mb-2.5">THULLA LOG</div>
          {thullaLog.map(t => {
            const led = SUITS.find(s => s.key === t.ledSuit);
            const thrown = SUITS.find(s => s.key === t.thrownSuit);
            return (
              <div key={t.id} className="bg-[#0a0418] border border-danger/10 rounded-lg py-2 px-3 mb-1.5 flex justify-between text-xs">
                <div>
                  <span className="text-text-primary font-bold">{t.playerName}</span>
                  <span className="text-text-dark"> out of </span>
                  <span style={{ color: led?.color }}>{led?.symbol} {led?.label}</span>
                  <span className="text-text-dark"> · threw </span>
                  <span style={{ color: thrown?.color }}>{thrown?.symbol} {thrown?.label}</span>
                </div>
                <span className="text-[#0e1e2e] text-[10px]">{t.ts}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
