import { useState } from 'react';
import { useGameStore, SUITS } from '../store/gameStore';

export default function ThullaRecorder() {
  const { players, playerNames, playerStatus, recordThulla } = useGameStore();
  const [step, setStep] = useState(1);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const handlePlayer = (idx) => {
    setSelectedPlayer(idx);
    setStep(2);
  };

  const handleSuit = (suitKey) => {
    const thrownSuit = SUITS.find(s => s.key !== suitKey && playerStatus[selectedPlayer]?.[s.key])?.key || 'clubs';
    recordThulla(selectedPlayer, suitKey, thrownSuit);
    setStep(1);
    setSelectedPlayer(null);
  };

  const steps = [
    { n: 1, label: 'Pick Player' },
    { n: 2, label: 'Pick Led Suit' },
  ];

  return (
    <div>
      {/* Step indicator */}
      <div className="flex gap-2 mb-5 items-center">
        {steps.map(s => (
          <div key={s.n} className="flex items-center gap-1.5">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                ${step === s.n
                  ? 'bg-gradient-to-br from-gold to-gold-dark text-bg-primary'
                  : step > s.n
                    ? 'bg-[#1a3a1a] text-success border border-success/20'
                    : 'bg-bg-secondary text-text-dark'
                }`}
            >
              {step > s.n ? '✓' : s.n}
            </div>
            <span className={`text-[11px] ${step === s.n ? 'text-gold' : 'text-text-dark'}`}>{s.label}</span>
            {s.n < 2 && <span className="text-border text-base ml-1">›</span>}
          </div>
        ))}
        {step === 2 && (
          <button
            onClick={() => { setStep(1); setSelectedPlayer(null); }}
            className="ml-auto bg-transparent border-none text-text-dark text-xs cursor-pointer hover:text-text-muted"
          >
            ← back
          </button>
        )}
      </div>

      {/* Step 1: Pick player */}
      {step === 1 && (
        <div className="animate-fadeIn">
          <div className="text-text-dark text-[11px] tracking-[1px] mb-3">
            WHO THREW THULLA? ({players.length} active players)
          </div>
          <div className={`grid gap-2.5 ${players.length > 4 ? 'lg:grid-cols-4 grid-cols-2' : 'grid-cols-2'}`}>
            {players.map(i => (
              <button
                key={i}
                onClick={() => handlePlayer(i)}
                className="tap-btn-sm bg-bg-secondary border border-border rounded-xl py-4 px-3 cursor-pointer text-center
                  hover:border-gold/30 transition-all"
              >
                <div className="text-text-primary font-bold text-[15px] mb-1.5">{playerNames[i]}</div>
                <div className="flex justify-center gap-1">
                  {SUITS.map(s => (
                    <span
                      key={s.key}
                      className="text-sm"
                      style={{ color: playerStatus[i]?.[s.key] ? s.color : '#1a2a3a' }}
                    >
                      {s.symbol}
                    </span>
                  ))}
                </div>
                <div className="text-text-darker text-[9px] mt-1.5">TAP TO SELECT</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Pick led suit */}
      {step === 2 && selectedPlayer !== null && (
        <div className="animate-fadeIn">
          <div className="bg-bg-secondary border border-gold/10 rounded-[10px] px-3.5 py-2.5 mb-4 flex items-center gap-2.5">
            <span className="text-gold text-[13px]">Recording thulla for</span>
            <span className="text-text-primary font-bold">{playerNames[selectedPlayer]}</span>
          </div>
          <div className="text-text-dark text-[11px] tracking-[1px] mb-3">
            WHICH SUIT WAS LED? (THEY COULDN'T FOLLOW)
          </div>
          <div className="grid grid-cols-2 gap-3">
            {SUITS.map(s => (
              <button
                key={s.key}
                onClick={() => handleSuit(s.key)}
                className="tap-btn rounded-[14px] py-5 px-4 cursor-pointer text-center border-2 transition-all hover:scale-[1.02]"
                style={{
                  background: `${s.color}0f`,
                  borderColor: `${s.color}55`,
                }}
              >
                <div className="text-[36px] mb-1.5" style={{ color: s.color }}>{s.symbol}</div>
                <div className="text-[13px] font-bold" style={{ color: s.color }}>{s.label}</div>
                {!playerStatus[selectedPlayer]?.[s.key] && (
                  <div className="text-danger text-[9px] mt-1">ALREADY OUT</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
