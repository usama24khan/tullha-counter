import { useState } from 'react';
import { useGameStore, SUITS } from '../store/gameStore';

export default function StrategyAdvisor() {
  const { suits, players, playerNames, playerStatus, playerCards, decks, history, meIndex, currentTurn } = useGameStore();
  const n = players.length;
  const isMyTurn = currentTurn === meIndex;

  // Per-suit stats
  const stats = SUITS.map(suit => {
    const s = suits[suit.key];
    if (!s) return { ...suit, r: 0, p: 1, out: 0, inCount: n, danger: 0, played: 0, myHas: true };
    const r = s.total - s.discarded;
    const p = r / s.total;
    const out = players.filter(i => !playerStatus[i]?.[suit.key]).length;
    const outExcludeMe = players.filter(i => i !== meIndex && !playerStatus[i]?.[suit.key]).length;
    const danger = (1 - p) * 0.6 + (out / Math.max(n, 1)) * 0.4;
    const myHas = playerStatus[meIndex]?.[suit.key] ?? true;
    return { ...suit, r, p, out, outExcludeMe, inCount: n - out, danger, played: s.discarded, myHas };
  });

  // Best/worst for ME to lead
  const safeForMe = [...stats]
    .filter(s => s.r > 0)
    .sort((a, b) =>
      (b.p * 0.4 + (1 - b.outExcludeMe / Math.max(n - 1, 1)) * 0.6) -
      (a.p * 0.4 + (1 - a.outExcludeMe / Math.max(n - 1, 1)) * 0.6)
    );
  const bestForMe = safeForMe[0];
  const worstForMe = [...stats].filter(s => s.r > 0).sort((a, b) => b.danger - a.danger)[0];

  // My suits I should dump (out of or close to out)
  const mySuitsOut = SUITS.filter(s => !playerStatus[meIndex]?.[s.key]);
  const mySuitsIn = SUITS.filter(s => playerStatus[meIndex]?.[s.key]);

  // Players who can be trapped
  const trapTargets = players
    .filter(i => i !== meIndex)
    .map(i => {
      const missing = SUITS.filter(s => !playerStatus[i]?.[s.key]);
      const owned = playerCards[i] || [];
      return { i, name: playerNames[i], missing, owned };
    })
    .filter(t => t.missing.length > 0);

  // Game phase
  const totalCards = decks * 52;
  const totalPlayed = Object.values(suits).reduce((a, s) => a + s.discarded, 0);
  const playedPercent = totalPlayed / totalCards;
  const phase = playedPercent < 0.3 ? 'early' : playedPercent < 0.7 ? 'mid' : 'end';
  const cardsPerPlayer = n > 0 ? Math.round((totalCards - totalPlayed) / n) : 0;

  // === MY WINNING TIPS ===
  const myTips = [];

  // What should I play?
  if (isMyTurn && bestForMe) {
    if (bestForMe.outExcludeMe === 0) {
      myTips.push({
        icon: '🎯', type: 'safe',
        text: `Lead ${bestForMe.symbol} ${bestForMe.label} — no opponents are out. Safe!`,
      });
    } else {
      myTips.push({
        icon: '🎯', type: 'info',
        text: `Best lead: ${bestForMe.symbol} ${bestForMe.label} (${bestForMe.r} left, ${bestForMe.outExcludeMe} opponents out)`,
      });
    }
  }

  // Danger for me
  if (mySuitsOut.length > 0) {
    myTips.push({
      icon: '🛡️', type: 'warning',
      text: `You're out of ${mySuitsOut.map(s => s.symbol + ' ' + s.label).join(', ')}. If opponents lead these, you'll tullah!`,
    });
  }

  // Phase-based strategy for me
  if (phase === 'early') {
    myTips.push({ icon: '💡', type: 'info', text: 'Early game — play your high cards now while it\'s safe. Dump one suit to get void early.' });
    if (mySuitsIn.length === 4) {
      myTips.push({ icon: '🃏', type: 'info', text: 'Strategy: Identify your weakest suit and start discarding it when others lead.' });
    }
  } else if (phase === 'mid') {
    myTips.push({ icon: '🧠', type: 'warning', text: 'Mid-game — save low cards for risky leads. Play off-suit when forced to follow.' });
    if (mySuitsOut.length === 0) {
      myTips.push({ icon: '💪', type: 'safe', text: 'You still have all suits — strong position! Start voiding your weakest suit now.' });
    }
  } else {
    myTips.push({ icon: '🔴', type: 'danger', text: 'End game! Never hold Aces/Kings — they guarantee taking the pile.' });
    myTips.push({ icon: '⚡', type: 'danger', text: 'Lead with your lowest cards. Win = fewest tricks taken.' });
  }

  // Trap suggestions for ME
  if (trapTargets.length > 0 && isMyTurn) {
    const bestTrap = trapTargets.sort((a, b) => b.missing.length - a.missing.length)[0];
    myTips.push({
      icon: '🪤', type: 'info',
      text: `Trap ${bestTrap.name}: lead ${bestTrap.missing.map(s => s.symbol).join('/')} to force tullah!`,
    });
  }

  // Warn about opponent's known cards
  const opponentsWithCards = players
    .filter(i => i !== meIndex && (playerCards[i] || []).length > 0)
    .map(i => ({ name: playerNames[i], cards: playerCards[i] }));
  if (opponentsWithCards.length > 0) {
    opponentsWithCards.forEach(opp => {
      myTips.push({
        icon: '🔍', type: 'info',
        text: `${opp.name} holds: ${opp.cards.map(c => c.label).join(', ')} — avoid leading these suit ranks!`,
      });
    });
  }

  const tipBg = { safe: 'bg-[#081a0a] border-success/15', warning: 'bg-[#1a1208] border-warning/15', danger: 'bg-[#1a0808] border-danger/15', info: 'bg-bg-secondary border-gold/10' };
  const tipText = { safe: 'text-success', warning: 'text-warning', danger: 'text-danger', info: 'text-gold' };

  return (
    <div className="flex flex-col gap-4">

      {/* My Coach Header */}
      <div className="rounded-xl p-4 border-2 bg-gradient-to-r from-gold/10 to-gold/5 border-gold/30 text-center">
        <div className="text-gold text-[10px] tracking-[3px] mb-1">👑 YOUR PERSONAL</div>
        <div className="text-gold text-xl font-bold tracking-[4px]">MY COACH</div>
        <div className="text-text-dark text-[10px] mt-1">
          {isMyTurn ? '🟢 Your turn — see strategy below' : `⏳ ${playerNames[currentTurn]}'s turn`}
          {' · '}{phase === 'early' ? 'Early' : phase === 'mid' ? 'Mid' : 'End'} Game · ~{cardsPerPlayer} cards each
        </div>
      </div>

      {/* ===== WHAT SHOULD I PLAY? ===== */}
      <div className={`rounded-xl p-3.5 border-2 ${isMyTurn ? 'border-gold/30 bg-gradient-to-r from-[#1a1508] to-bg-secondary' : 'border-border-light bg-bg-secondary'}`}>
        <div className={`text-[9px] tracking-[2px] mb-3 ${isMyTurn ? 'text-gold' : 'text-text-dark'}`}>
          {isMyTurn ? '🎯 WHAT SHOULD I PLAY?' : '🎯 WHEN YOUR TURN COMES'}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {bestForMe && (
            <div className="bg-[#081a0a] border border-success/15 rounded-xl p-3">
              <div className="text-success text-[9px] tracking-[1px] mb-2">✅ LEAD THIS</div>
              <div className="flex items-center gap-2">
                <span className="text-[24px]" style={{ color: bestForMe.color }}>{bestForMe.symbol}</span>
                <div>
                  <div className="text-text-primary font-bold text-sm">{bestForMe.label}</div>
                  <div className="text-text-dark text-[10px]">{bestForMe.r} left · {bestForMe.outExcludeMe} out</div>
                </div>
              </div>
            </div>
          )}
          {worstForMe && (
            <div className="bg-[#1a0808] border border-danger/15 rounded-xl p-3">
              <div className="text-danger text-[9px] tracking-[1px] mb-2">🚫 AVOID</div>
              <div className="flex items-center gap-2">
                <span className="text-[24px]" style={{ color: worstForMe.color }}>{worstForMe.symbol}</span>
                <div>
                  <div className="text-text-primary font-bold text-sm">{worstForMe.label}</div>
                  <div className="text-[#3a1a1a] text-[10px]">{worstForMe.r} left · {worstForMe.out} out</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== VOID MATRIX ===== */}
      <div className="bg-bg-secondary border border-gold/10 rounded-xl p-3.5">
        <div className="text-text-dark text-[9px] tracking-[2px] mb-3">📊 VOID MATRIX — WHO'S OUT?</div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-center" style={{ minWidth: 0 }}>
            <thead>
              <tr>
                <th className="text-left text-text-dark text-[10px] pb-2 pr-2 font-normal">Player</th>
                {SUITS.map(s => (
                  <th key={s.key} className="pb-2 px-1">
                    <span className="text-base" style={{ color: s.color }}>{s.symbol}</span>
                  </th>
                ))}
                <th className="text-text-dark text-[9px] pb-2 pl-2 font-normal">Risk</th>
              </tr>
            </thead>
            <tbody>
              {/* Me first */}
              {players.sort((a, b) => a === meIndex ? -1 : b === meIndex ? 1 : a - b).map(i => {
                const isMe = i === meIndex;
                const outCount = SUITS.filter(s => !playerStatus[i]?.[s.key]).length;
                const riskLevel = outCount === 0 ? 'low' : outCount <= 2 ? 'med' : 'high';
                const rC = riskLevel === 'low' ? '#4ade80' : riskLevel === 'med' ? '#f59e0b' : '#e63946';
                const owned = playerCards[i] || [];
                return (
                  <tr key={i} className={`border-t border-border-light/30 ${isMe ? 'bg-gold/5' : ''}`}>
                    <td className={`text-left text-xs font-bold py-2 pr-2 whitespace-nowrap ${isMe ? 'text-gold' : 'text-text-primary'}`}>
                      {isMe ? '👑 ' : ''}{playerNames[i]}
                      {owned.length > 0 && (
                        <span className="text-gold text-[8px] ml-1">+{owned.length}🔄</span>
                      )}
                    </td>
                    {SUITS.map(s => {
                      const has = playerStatus[i]?.[s.key];
                      const hasRecoveredCard = !has && owned.some(c => c.label?.includes(s.symbol));
                      return (
                        <td key={s.key} className="py-2 px-1">
                          {has ? (
                            <span className="text-success text-sm">✅</span>
                          ) : hasRecoveredCard ? (
                            <span className="text-warning text-[10px] font-bold" title="Has card via tullah">🔄</span>
                          ) : (
                            <span className="text-danger text-sm">❌</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-2 pl-2">
                      <span
                        className="inline-block rounded-full px-1.5 py-0.5 text-[8px] font-bold"
                        style={{ color: rC, background: `${rC}18`, border: `1px solid ${rC}30` }}
                      >
                        {riskLevel === 'low' ? 'SAFE' : riskLevel === 'med' ? 'WATCH' : 'DANGER'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== TRAP OPPONENTS ===== */}
      {trapTargets.length > 0 && (
        <div className="bg-[#10080a] border border-[#e6394630] rounded-xl p-3.5">
          <div className="text-danger text-[9px] tracking-[2px] mb-3">🪤 TRAP YOUR OPPONENTS</div>
          <div className="flex flex-col gap-2">
            {trapTargets.slice(0, 4).map(target => (
              <div
                key={target.i}
                className="rounded-lg p-3 border flex items-start gap-3 bg-danger/5 border-danger/15"
              >
                <div className="w-8 h-8 rounded-full bg-danger/15 border border-danger/25 flex items-center justify-center text-danger text-xs font-bold flex-shrink-0">
                  {target.i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-text-primary font-bold text-xs mb-1">{target.name}</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {target.missing.map(s => (
                      <span
                        key={s.key}
                        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold border"
                        style={{ color: s.color, background: `${s.color}10`, borderColor: `${s.color}25` }}
                      >
                        Lead {s.symbol} → tullah!
                      </span>
                    ))}
                  </div>
                  {target.owned.length > 0 && (
                    <div className="mt-1 text-[9px] text-warning">
                      Known cards: {target.owned.map(c => c.label).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== MY STRATEGY TIPS ===== */}
      <div className="bg-bg-secondary border border-gold/10 rounded-xl p-3.5">
        <div className="text-gold text-[9px] tracking-[2px] mb-3">💡 MY WIN STRATEGY</div>
        <div className="flex flex-col gap-2">
          {myTips.slice(0, 8).map((tip, i) => (
            <div key={i} className={`${tipBg[tip.type]} border rounded-lg p-2.5 flex items-start gap-2`}>
              <span className="text-sm flex-shrink-0">{tip.icon}</span>
              <span className={`${tipText[tip.type]} text-[11px] leading-relaxed`}>{tip.text}</span>
            </div>
          ))}
          {myTips.length === 0 && (
            <div className="text-text-darker text-xs">Record some tricks and thullas to get personalized strategy tips!</div>
          )}
        </div>
      </div>

      {/* Threat meter */}
      <div className="bg-bg-secondary border border-gold/10 rounded-xl p-3.5">
        <div className="text-text-dark text-[9px] tracking-[2px] mb-3">SUIT THREAT LEVEL</div>
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
              {!s.myHas && (
                <span className="text-danger text-[8px] font-bold">YOU'RE OUT</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
