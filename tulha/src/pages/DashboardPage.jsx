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
  { id: 'advisor', labelFull: '🧠 Advisor', labelShort: '🧠' },
  { id: 'history', labelFull: '📋 History', labelShort: '📋' },
];

export default function DashboardPage() {
  const [showSecondary, setShowSecondary] = useState(null); // null = main view, 'advisor' | 'history'
  const [showReset, setShowReset] = useState(false);
  const [thullaOverlay, setThullaOverlay] = useState(null);
  const state = useGameStore();
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 900;

  const handleQuickThulla = (playerIdx, ledSuit) => {
    const thrownSuit = SUITS.find(s => s.key !== ledSuit && state.playerStatus[playerIdx]?.[s.key])?.key || 'clubs';
    state.recordThulla(playerIdx, ledSuit, thrownSuit);
    setThullaOverlay(null);
  };

  return (
    <div className="min-h-screen w-screen max-w-[100vw] overflow-x-hidden bg-bg-primary text-text-primary flex flex-col">

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

      {/* Secondary nav — Advisor / History toggle */}
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

            {/* MAIN VIEW: Suits + Thulla + Players stacked */}
            {showSecondary === null && (
              <div className="flex flex-col gap-5 animate-fadeIn">

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
