import { useState } from 'react';
import { useGameStore, SUITS } from '../store/gameStore';

export default function StrategyAdvisor() {
  const { suits, players, playerNames, playerStatus, decks, history } = useGameStore();
  const [selPlayer, setSelPlayer] = useState(players[0] ?? 0);
  const n = players.length;

  // Calculate per-suit stats
  const stats = SUITS.map(suit => {
    const s = suits[suit.key];
    if (!s) return { ...suit, r: 0, p: 1, out: 0, inCount: n, danger: 0, played: 0 };
    const r = s.total - s.discarded;
    const p = r / s.total;
    const out = players.filter(i => !playerStatus[i]?.[suit.key]).length;
    const danger = (1 - p) * 0.6 + (out / Math.max(n, 1)) * 0.4;
    return { ...suit, r, p, out, inCount: n - out, danger, played: s.discarded };
  });

  const bestLead = [...stats].sort((a, b) =>
    (b.p * 0.5 + (1 - b.out / Math.max(n, 1)) * 0.5) - (a.p * 0.5 + (1 - a.out / Math.max(n, 1)) * 0.5)
  )[0];
  const worstLead = [...stats].sort((a, b) => b.danger - a.danger)[0];

  // Per-player analysis
  const playerAnalysis = players.map(i => {
    const missing = SUITS.filter(s => !playerStatus[i]?.[s.key]);
    const risk = missing.length === 0 ? 'low' : missing.length === 1 ? 'medium' : 'high';
    return { i, name: playerNames[i], missing, risk };
  });
  const sel = playerAnalysis.find(a => a.i === selPlayer);
  const riskColors = { low: '#4ade80', medium: '#f59e0b', high: '#e63946' };

  // Game phase detection
  const totalCards = decks * 52;
  const totalPlayed = Object.values(suits).reduce((a, s) => a + s.discarded, 0);
  const playedPercent = totalPlayed / totalCards;
  const phase = playedPercent < 0.3 ? 'early' : playedPercent < 0.7 ? 'mid' : 'end';
  const cardsPerPlayer = n > 0 ? Math.round((totalCards - totalPlayed) / n) : 0;

  // Decision tree tips
  const tips = [];

  // Phase-based tips
  if (phase === 'early') {
    tips.push({ icon: '🟢', text: 'Early game — Safe to play high cards (Ace, King, Queen). Low probability of cuts.', type: 'safe' });
    tips.push({ icon: '🎯', text: 'Strategy: Start building a short suit by dumping one suit early.', type: 'info' });
  } else if (phase === 'mid') {
    const highRiskSuits = stats.filter(s => s.played >= 8 || s.out > 0);
    if (highRiskSuits.length > 0) {
      tips.push({
        icon: '⚠️',
        text: `Mid-game caution: ${highRiskSuits.map(s => s.label).join(', ')} ${highRiskSuits.length === 1 ? 'has' : 'have'} high cut risk.`,
        type: 'warning'
      });
    }
    tips.push({ icon: '🧠', text: 'Lead with low cards in risky suits. Save high cards for safe suits.', type: 'info' });
  } else {
    tips.push({ icon: '🔴', text: 'End game! Avoid holding high cards. Lead with lowest cards possible.', type: 'danger' });
    tips.push({ icon: '⚡', text: 'CRITICAL: Never keep an Ace in your last 3 cards — almost guarantees taking the pile.', type: 'danger' });
    tips.push({ icon: '🎯', text: `Lead the suit with most cards played (fewest remaining).`, type: 'info' });
  }

  // Player count adjustment
  if (n >= 6) {
    tips.push({ icon: '👥', text: `${n} players — suits exhaust fast. Each player has ~${Math.round(13 * decks / n)} cards per suit. Play high cards early!`, type: 'info' });
  }

  // Suit-specific danger warnings
  stats.forEach(s => {
    if (s.played >= 9) {
      tips.push({ icon: '🚨', text: `${s.symbol} ${s.label}: ${s.played} cards played — high chance 1-2 players are out. Do NOT lead unless sure!`, type: 'danger' });
    }
    if (s.out > 0 && s.r > 0) {
      tips.push({ icon: '✂️', text: `${s.symbol} ${s.label}: ${s.out} player(s) confirmed out. Leading this suit WILL cause cuts.`, type: 'warning' });
    }
  });

  const tipBg = { safe: 'bg-[#081a0a] border-success/15', warning: 'bg-[#1a1208] border-warning/15', danger: 'bg-[#1a0808] border-danger/15', info: 'bg-bg-secondary border-gold/10' };
  const tipText = { safe: 'text-success', warning: 'text-warning', danger: 'text-danger', info: 'text-gold' };

  return (
    <div className="flex flex-col gap-4">

      {/* Game Phase Banner */}
      <div className={`rounded-xl p-3.5 border text-center
        ${phase === 'early' ? 'bg-[#081a0a] border-success/20' : phase === 'mid' ? 'bg-[#1a1208] border-warning/20' : 'bg-[#1a0808] border-danger/20'}`}
      >
        <div className={`text-[9px] tracking-[2px] mb-1
          ${phase === 'early' ? 'text-success' : phase === 'mid' ? 'text-warning' : 'text-danger'}`}
        >
          {phase === 'early' ? '🟢 EARLY GAME' : phase === 'mid' ? '🟡 MID GAME' : '🔴 END GAME'}
        </div>
        <div className="text-text-primary text-sm font-bold">
          {totalPlayed} / {totalCards} cards played · ~{cardsPerPlayer} per player
        </div>
      </div>

      {/* Lead / Avoid cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#081a0a] border border-success/15 rounded-xl p-3.5">
          <div className="text-success text-[9px] tracking-[2px] mb-2">✅ LEAD THIS</div>
          <div className="flex items-center gap-2">
            <span className="text-[28px]" style={{ color: bestLead.color }}>{bestLead.symbol}</span>
            <div>
              <div className="text-text-primary font-bold">{bestLead.label}</div>
              <div className="text-text-dark text-[11px]">{bestLead.r} left · {bestLead.out} out</div>
            </div>
          </div>
        </div>
        <div className="bg-[#1a0808] border border-danger/15 rounded-xl p-3.5">
          <div className="text-danger text-[9px] tracking-[2px] mb-2">⚠ AVOID</div>
          <div className="flex items-center gap-2">
            <span className="text-[28px]" style={{ color: worstLead.color }}>{worstLead.symbol}</span>
            <div>
              <div className="text-text-primary font-bold">{worstLead.label}</div>
              <div className="text-[#3a1a1a] text-[11px]">{worstLead.r} left · {worstLead.out} out</div>
            </div>
          </div>
        </div>
      </div>

      {/* Decision Tree Tips */}
      <div className="bg-bg-secondary border border-gold/10 rounded-xl p-3.5">
        <div className="text-text-dark text-[9px] tracking-[2px] mb-3">🧠 DECISION TREE</div>
        <div className="flex flex-col gap-2">
          {tips.slice(0, 6).map((tip, i) => (
            <div key={i} className={`${tipBg[tip.type]} border rounded-lg p-2.5 flex items-start gap-2`}>
              <span className="text-sm flex-shrink-0">{tip.icon}</span>
              <span className={`${tipText[tip.type]} text-[11px] leading-relaxed`}>{tip.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Threat meter */}
      <div className="bg-bg-secondary border border-gold/10 rounded-xl p-3.5">
        <div className="text-text-dark text-[9px] tracking-[2px] mb-3">THREAT LEVEL</div>
        {[...stats].sort((a, b) => b.danger - a.danger).map((s, rank) => {
          const t = Math.round(s.danger * 100);
          const tc = t > 60 ? '#e63946' : t > 35 ? '#f59e0b' : '#4ade80';
          return (
            <div key={s.key} className="flex items-center gap-2.5 mb-2.5">
              <span className="text-text-darker text-[10px] w-4">#{rank + 1}</span>
              <span className="text-lg w-5" style={{ color: s.color }}>{s.symbol}</span>
              <span className="text-text-muted text-xs w-16">{s.label}</span>
              <div className="flex-1 bg-bg-primary rounded h-2 overflow-hidden">
                <div
                  className="h-full rounded transition-all duration-400"
                  style={{ width: `${t}%`, background: `linear-gradient(90deg, ${tc}55, ${tc})` }}
                />
              </div>
              <span className="text-xs font-bold w-8 text-right" style={{ color: tc }}>{t}%</span>
            </div>
          );
        })}
      </div>

      {/* Player Intel */}
      <div className="bg-bg-secondary border border-gold/10 rounded-xl p-3.5">
        <div className="text-text-dark text-[9px] tracking-[2px] mb-3">PLAYER INTEL</div>
        <div className="flex gap-1.5 flex-wrap mb-3.5">
          {players.map(i => (
            <button
              key={i}
              onClick={() => setSelPlayer(i)}
              className={`rounded-lg px-3.5 py-1.5 cursor-pointer text-xs border transition-all
                ${selPlayer === i
                  ? 'bg-gradient-to-br from-gold to-gold-dark text-bg-primary border-gold font-bold'
                  : 'bg-bg-primary text-text-muted border-border-light hover:border-gold/30'
                }`}
            >
              {playerNames[i]}
            </button>
          ))}
        </div>
        {sel && (
          <div className="animate-fadeIn">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="rounded-lg px-3 py-1 text-[11px] font-bold border"
                style={{
                  background: sel.risk === 'low' ? '#081a0a' : sel.risk === 'medium' ? '#1a1208' : '#1a0808',
                  borderColor: `${riskColors[sel.risk]}33`,
                  color: riskColors[sel.risk],
                }}
              >
                {sel.risk === 'low' ? '🟢 SAFE' : sel.risk === 'medium' ? '🟡 WATCH' : '🔴 DANGER'}
              </div>
              <span className="text-text-dark text-[11px]">
                {sel.missing.length === 0
                  ? 'Has all suits'
                  : sel.missing.length === 1
                    ? `Out of ${sel.missing[0].label}`
                    : `Out of ${sel.missing.length} suits`
                }
              </span>
            </div>
            {sel.missing.length > 0 && (
              <div>
                <div className="text-text-dark text-[10px] tracking-[1px] mb-2">EXPLOIT — LEAD THESE:</div>
                <div className="flex gap-2 flex-wrap">
                  {sel.missing.map(s => (
                    <div
                      key={s.key}
                      className="rounded-[10px] py-2.5 px-4 flex items-center gap-2 border-2"
                      style={{ background: `${s.color}0f`, borderColor: `${s.color}55` }}
                    >
                      <span className="text-[22px]" style={{ color: s.color }}>{s.symbol}</span>
                      <div>
                        <div className="text-[13px] font-bold" style={{ color: s.color }}>{s.label}</div>
                        <div className="text-[#3a1a1a] text-[10px]">They will Thulla</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {sel.missing.length === 0 && (
              <div className="text-text-darker text-xs leading-relaxed">
                No Thullas recorded yet. Watch this player — lead risky suits to reveal their weak cards.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
