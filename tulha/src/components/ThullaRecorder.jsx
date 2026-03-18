import { useState } from 'react';
import { useGameStore, SUITS } from '../store/gameStore';

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUIT_SYMBOLS = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };

export default function ThullaRecorder() {
  const { players, playerNames, playerStatus, recordThulla } = useGameStore();
  const [step, setStep] = useState(1);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [ledSuit, setLedSuit] = useState(null);
  const [cardGiven, setCardGiven] = useState(null);

  const reset = () => { setStep(1); setSelectedPlayer(null); setLedSuit(null); setCardGiven(null); };

  // Step 1 → pick who threw thulla
  const handlePlayer = (idx) => { setSelectedPlayer(idx); setStep(2); };

  // Step 2 → pick which suit was led
  const handleSuit = (suitKey) => { setLedSuit(suitKey); setStep(3); };

  // Step 3 → pick the card they threw (the tullah card)
  const handleCard = (label) => { setCardGiven(label); setStep(4); };

  // Step 4 → pick who received the pile (and the card)
  const handleReceiver = (receiverIdx) => {
    const thrownSuit = SUITS.find(s => s.key !== ledSuit && playerStatus[selectedPlayer]?.[s.key])?.key || 'clubs';
    recordThulla(selectedPlayer, ledSuit, thrownSuit, cardGiven, receiverIdx);
    reset();
  };

  const steps = [
    { n: 1, label: 'Who threw' },
    { n: 2, label: 'Led suit' },
    { n: 3, label: 'Card given' },
    { n: 4, label: 'Received by' },
  ];

  const goBack = () => {
    if (step === 2) { setStep(1); setSelectedPlayer(null); }
    else if (step === 3) { setStep(2); setLedSuit(null); }
    else if (step === 4) { setStep(3); setCardGiven(null); }
  };

  return (
    <div>
      {/* Step indicator */}
      <div className="flex gap-1.5 mb-4 items-center flex-wrap">
        {steps.map(s => (
          <div key={s.n} className="flex items-center gap-1">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                ${step === s.n
                  ? 'bg-gradient-to-br from-gold to-gold-dark text-bg-primary'
                  : step > s.n
                    ? 'bg-[#1a3a1a] text-success border border-success/20'
                    : 'bg-bg-secondary text-text-dark'
                }`}
            >
              {step > s.n ? '✓' : s.n}
            </div>
            <span className={`text-[9px] ${step === s.n ? 'text-gold' : 'text-text-dark'}`}>{s.label}</span>
            {s.n < 4 && <span className="text-border text-xs ml-0.5">›</span>}
          </div>
        ))}
        {step > 1 && (
          <button
            onClick={goBack}
            className="ml-auto bg-transparent border-none text-text-dark text-xs cursor-pointer hover:text-text-muted"
          >
            ← back
          </button>
        )}
      </div>

      {/* Step 1: Pick player who threw thulla */}
      {step === 1 && (
        <div className="animate-fadeIn">
          <div className="text-text-dark text-[11px] tracking-[1px] mb-3">
            WHO THREW THULLA? ({players.length} active)
          </div>
          <div className={`grid gap-2 ${players.length > 4 ? 'lg:grid-cols-4 grid-cols-2' : 'grid-cols-2'}`}>
            {players.map(i => (
              <button
                key={i}
                onClick={() => handlePlayer(i)}
                className="tap-btn-sm bg-bg-secondary border border-border rounded-xl py-3 px-2 cursor-pointer text-center
                  hover:border-gold/30 transition-all"
              >
                <div className="text-text-primary font-bold text-sm mb-1">{playerNames[i]}</div>
                <div className="flex justify-center gap-1">
                  {SUITS.map(s => (
                    <span key={s.key} className="text-xs" style={{ color: playerStatus[i]?.[s.key] ? s.color : '#1a2a3a' }}>
                      {s.symbol}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Pick led suit */}
      {step === 2 && selectedPlayer !== null && (
        <div className="animate-fadeIn">
          <div className="bg-bg-secondary border border-gold/10 rounded-[10px] px-3 py-2 mb-3 flex items-center gap-2">
            <span className="text-gold text-[12px]">Thulla by</span>
            <span className="text-text-primary font-bold text-sm">{playerNames[selectedPlayer]}</span>
          </div>
          <div className="text-text-dark text-[11px] tracking-[1px] mb-3">
            WHICH SUIT WAS LED?
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {SUITS.map(s => (
              <button
                key={s.key}
                onClick={() => handleSuit(s.key)}
                className="tap-btn rounded-xl py-4 px-3 cursor-pointer text-center border-2 transition-all hover:scale-[1.02]"
                style={{ background: `${s.color}0f`, borderColor: `${s.color}55` }}
              >
                <div className="text-3xl mb-1" style={{ color: s.color }}>{s.symbol}</div>
                <div className="text-[12px] font-bold" style={{ color: s.color }}>{s.label}</div>
                {!playerStatus[selectedPlayer]?.[s.key] && (
                  <div className="text-danger text-[9px] mt-1">ALREADY OUT</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Pick the card they threw */}
      {step === 3 && (
        <div className="animate-fadeIn">
          <div className="bg-bg-secondary border border-gold/10 rounded-[10px] px-3 py-2 mb-3 flex items-center gap-2 flex-wrap">
            <span className="text-gold text-[12px]">Thulla by</span>
            <span className="text-text-primary font-bold text-sm">{playerNames[selectedPlayer]}</span>
            <span className="text-text-dark text-[10px]">·</span>
            <span className="text-[12px]" style={{ color: SUITS.find(s => s.key === ledSuit)?.color }}>
              {SUITS.find(s => s.key === ledSuit)?.symbol} {SUITS.find(s => s.key === ledSuit)?.label} led
            </span>
          </div>
          <div className="text-text-dark text-[11px] tracking-[1px] mb-3">
            WHICH CARD DID THEY THROW? (the tullah card)
          </div>
          {/* Show cards grouped by suit, 1 suit per row */}
          <div className="flex flex-col gap-2">
            {SUITS.map(suit => (
              <div key={suit.key}>
                <div className="text-[9px] tracking-[1px] mb-1" style={{ color: suit.color }}>
                  {suit.symbol} {suit.label.toUpperCase()}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {RANKS.map(rank => {
                    const label = `${rank}${SUIT_SYMBOLS[suit.key]}`;
                    return (
                      <button
                        key={label}
                        onClick={() => handleCard(label)}
                        className="tap-btn-sm rounded-lg py-2 px-0.5 cursor-pointer text-center border transition-all hover:scale-105
                          text-xs font-bold"
                        style={{
                          background: `${suit.color}0a`,
                          borderColor: `${suit.color}30`,
                          color: suit.color,
                        }}
                      >
                        {rank}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Pick who received the pile */}
      {step === 4 && (
        <div className="animate-fadeIn">
          <div className="bg-bg-secondary border border-gold/10 rounded-[10px] px-3 py-2 mb-3 flex items-center gap-2 flex-wrap">
            <span className="text-text-primary font-bold text-sm">{playerNames[selectedPlayer]}</span>
            <span className="text-text-dark text-[11px]">threw</span>
            <span className="text-gold font-bold text-sm">{cardGiven}</span>
            <span className="text-text-dark text-[10px]">·</span>
            <span className="text-[12px]" style={{ color: SUITS.find(s => s.key === ledSuit)?.color }}>
              {SUITS.find(s => s.key === ledSuit)?.symbol} led
            </span>
          </div>
          <div className="text-text-dark text-[11px] tracking-[1px] mb-3">
            WHO RECEIVED THE PILE? (gets the card {cardGiven})
          </div>
          <div className={`grid gap-2 ${players.length > 4 ? 'lg:grid-cols-4 grid-cols-2' : 'grid-cols-2'}`}>
            {players
              .filter(i => i !== selectedPlayer)
              .map(i => (
                <button
                  key={i}
                  onClick={() => handleReceiver(i)}
                  className="tap-btn-sm bg-bg-secondary border border-border rounded-xl py-3 px-2 cursor-pointer text-center
                    hover:border-gold/30 transition-all"
                >
                  <div className="text-text-primary font-bold text-sm mb-1">{playerNames[i]}</div>
                  <div className="text-text-darker text-[9px]">TAP TO SELECT</div>
                </button>
              ))}
          </div>
          <button onClick={reset} className="mt-3 bg-transparent border-none text-text-dark text-xs cursor-pointer hover:text-text-muted">
            × cancel
          </button>
        </div>
      )}
    </div>
  );
}
