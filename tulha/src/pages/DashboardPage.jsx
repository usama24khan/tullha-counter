import { useState } from 'react';
import { useGameStore, SUITS } from '../store/gameStore';
import Header from '../components/Header';
import StatBar from '../components/StatBar';
import SuitCards from '../components/SuitCards';
import ThullaRecorder from '../components/ThullaRecorder';
import PlayerStatus from '../components/PlayerStatus';
import StrategyAdvisor from '../components/StrategyAdvisor';
import HistoryLog from '../components/HistoryLog';
import SuitProgress from '../components/SuitProgress';
import ResetModal from '../components/ResetModal';

const SECONDARY_TABS = [
  { id: 'advisor', labelFull: '👑 My Coach', labelShort: '👑' },
  { id: 'history', labelFull: '📋 History', labelShort: '📋' },
];

export default function DashboardPage() {
  const [showSecondary, setShowSecondary] = useState(null);
  const [showReset, setShowReset] = useState(false);
  const [thullaOverlay, setThullaOverlay] = useState(null);
  const state = useGameStore();
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 900;

  const { meIndex, playerNames, playerStatus, playerCards, currentTurn, suits } = state;
  const isMyTurn = currentTurn === meIndex;

  // My status calculations
  const mySuitsOut = SUITS.filter(s => !playerStatus[meIndex]?.[s.key]);
  const mySuitsIn = SUITS.filter(s => playerStatus[meIndex]?.[s.key]);
  const myCards = playerCards[meIndex] || [];

  // Find danger suits for me (suits where many players are out)
  const dangerForMe = SUITS.map(s => {
    const outCount = state.players.filter(i => i !== meIndex && !playerStatus[i]?.[s.key]).length;
    return { ...s, outCount };
  }).filter(s => s.outCount > 0).sort((a, b) => b.outCount - a.outCount);

  const handleQuickThulla = (playerIdx, ledSuit) => {
    const thrownSuit = SUITS.find(s => s.key !== ledSuit && state.playerStatus[playerIdx]?.[s.key])?.key || 'clubs';
    state.recordThulla(playerIdx, ledSuit, thrownSuit);
    setThullaOverlay(null);
  };

  return (
    <div className="min-h-screen w-screen max-w-[100vw] overflow-x-hidden bg-bg-primary text-text-primary flex flex-col pr-4 pl-4">

      <Header onReset={() => setShowReset(true)} />
      <StatBar />

      {/* Quick Thulla Overlay */}
      {thullaOverlay && (
        <div className="bg-[#0a0418] border-b-2 border-danger px-4 py-3 animate-slideDown">
          <div className="text-danger text-[11px] tracking-[2px] mb-2.5">
            ✂ {state.playerNames[thullaOverlay.playerIdx]?.toUpperCase()} — PICK THE SUIT THEY COULDN'T FOLLOW
          </div>
          <div className="grid grid-cols-4 gap-2">
            {SUITS.map(s => (
              <button
                key={s.key}
                onClick={() => handleQuickThulla(thullaOverlay.playerIdx, s.key)}
                className="tap-btn rounded-[10px] py-3 px-2 cursor-pointer text-center border-2 transition-all hover:scale-105"
                style={{
                  background: `${s.color}18`,
                  borderColor: `${s.color}66`,
                }}
              >
                <div className="text-2xl" style={{ color: s.color }}>{s.symbol}</div>
                <div className="text-[10px] mt-1" style={{ color: s.color }}>{s.label}</div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setThullaOverlay(null)}
            className="mt-2.5 bg-transparent border-none text-text-dark text-xs cursor-pointer"
          >
            × cancel
          </button>
        </div>
      )}

      {/* Secondary nav */}
      <div className="flex bg-bg-tertiary border-b border-border-light">
        <button
          onClick={() => setShowSecondary(null)}
          className={`flex-1 py-2.5 text-center cursor-pointer border-b-2 transition-all text-[13px]
            ${showSecondary === null
              ? 'bg-bg-secondary text-gold border-gold font-bold'
              : 'bg-transparent text-text-dark border-transparent hover:text-text-muted'
            }`}
        >
          <span className="lg:hidden">🎮</span>
          <span className="hidden lg:inline">🎮 Game</span>
        </button>
        {SECONDARY_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setShowSecondary(t.id)}
            className={`flex-1 py-2.5 text-center cursor-pointer border-b-2 transition-all text-[13px]
              ${showSecondary === t.id
                ? 'bg-bg-secondary text-gold border-gold font-bold'
                : 'bg-transparent text-text-dark border-transparent hover:text-text-muted'
              }`}
          >
            <span className="lg:hidden">{t.labelShort}</span>
            <span className="hidden lg:inline">{t.labelFull}</span>
          </button>
        ))}
      </div>

      {/* Main layout */}
      <div className={`flex-1 flex flex-col ${isDesktop ? 'lg:grid lg:grid-cols-[1fr_320px]' : ''} w-full`}>

        {/* Main content */}
        <div className="min-w-0 overflow-y-auto">
          <div className="p-3 lg:px-8 lg:py-6" key={showSecondary || 'main'}>

            {/* MAIN VIEW */}
            {showSecondary === null && (
              <div className="flex flex-col gap-5 animate-fadeIn">

                {/* ===== MY STATUS BANNER ===== */}
                <section>
                  <div
                    className={`rounded-xl p-4 border-2 transition-all ${
                      isMyTurn
                        ? 'bg-gradient-to-r from-gold/10 to-gold/5 border-gold/40 shadow-[0_0_20px_#c9a84c18]'
                        : 'bg-gradient-to-r from-bg-secondary to-bg-card border-border-light'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">👑</span>
                        <div>
                          <div className="text-gold font-bold text-sm tracking-wider">MY STATUS</div>
                          <div className="text-text-dark text-[10px]">
                            {isMyTurn ? '🟢 Your turn to play!' : `Waiting — ${playerNames[currentTurn] || 'next player'}'s turn`}
                          </div>
                        </div>
                      </div>
                      {isMyTurn && (
                        <div className="rounded-lg px-3 py-1.5 bg-gold/20 border border-gold/30 text-gold text-[10px] font-bold animate-pulse">
                          YOUR TURN
                        </div>
                      )}
                    </div>

                    {/* My suits row */}
                    <div className="flex gap-1.5 mb-2">
                      {SUITS.map(s => {
                        const has = playerStatus[meIndex]?.[s.key];
                        return (
                          <div
                            key={s.key}
                            className={`flex-1 rounded-lg py-1.5 text-center text-sm border transition-all ${
                              has
                                ? 'border-success/20 bg-success/8'
                                : 'border-danger/20 bg-danger/8 opacity-50'
                            }`}
                            style={{ color: has ? s.color : '#e6394666' }}
                          >
                            <div className="text-base">{s.symbol}</div>
                            <div className={`text-[7px] font-bold ${has ? 'text-success' : 'text-danger'}`}>
                              {has ? 'HAS' : 'OUT'}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick danger alert */}
                    {dangerForMe.length > 0 && isMyTurn && (
                      <div className="rounded-lg bg-danger/8 border border-danger/15 p-2 mt-2">
                        <div className="text-danger text-[9px] font-bold tracking-wider mb-1">⚠ AVOID LEADING:</div>
                        <div className="flex gap-1.5 flex-wrap">
                          {dangerForMe.slice(0, 3).map(s => (
                            <span key={s.key} className="text-[10px] text-danger/80">
                              {s.symbol} {s.label} ({s.outCount} out)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* My tullah cards */}
                    {myCards.length > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        <span className="text-text-dark text-[9px]">My cards:</span>
                        {myCards.map((c, idx) => (
                          <span key={idx} className="text-[10px] font-bold rounded px-1.5 py-0.5 bg-gold/10 border border-gold/20 text-gold">
                            🔄 {c.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </section>

                {/* Section: Suits */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-gold text-sm">♠</span>
                    <h2 className="text-gold text-xs font-bold tracking-[2px] m-0">SUIT TRACKER</h2>
                    <div className="flex-1 h-px bg-border-light ml-2" />
                  </div>
                  <SuitCards />
                </section>

                {/* Section: Thulla */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-danger text-sm">✂</span>
                    <h2 className="text-danger text-xs font-bold tracking-[2px] m-0">RECORD THULLA</h2>
                    <div className="flex-1 h-px bg-danger/15 ml-2" />
                  </div>
                  <ThullaRecorder onStartThulla={p => setThullaOverlay({ playerIdx: p })} />
                </section>

                {/* Section: Players */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-text-muted text-sm">👤</span>
                    <h2 className="text-text-muted text-xs font-bold tracking-[2px] m-0">PLAYER STATUS</h2>
                    <div className="flex-1 h-px bg-border-light ml-2" />
                  </div>
                  <PlayerStatus />
                </section>
              </div>
            )}

            {/* Secondary views */}
            {showSecondary === 'advisor' && (
              <div className="animate-fadeIn">
                <StrategyAdvisor />
              </div>
            )}
            {showSecondary === 'history' && (
              <div className="animate-fadeIn">
                <HistoryLog />
              </div>
            )}
          </div>
        </div>

        {/* Desktop sidebar */}
        {isDesktop && (
          <div className="border-l border-border-light p-6 overflow-y-auto bg-bg-tertiary/50 min-w-0">
            <SuitProgress />
          </div>
        )}
      </div>

      {showReset && <ResetModal onClose={() => setShowReset(false)} />}
    </div>
  );
}
