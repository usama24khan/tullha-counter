import { useState } from 'react';
import { useGameStore } from '../store/gameStore';

export default function SetupPage() {
  const [numPlayers, setNumPlayers] = useState(4);
  const [numDecks, setNumDecks] = useState(1);
  const [names, setNames] = useState(['Me', 'Player 2', 'Player 3', 'Player 4']);
  const initGame = useGameStore(s => s.initGame);

  const handlePlayerChange = (n) => {
    const count = Math.max(4, Math.min(7, n));
    setNumPlayers(count);
    setNames(prev => {
      const a = [...prev];
      a[0] = 'Me'; // Always keep "Me"
      while (a.length < count) a.push(`Player ${a.length + 1}`);
      return a.slice(0, count);
    });
  };

  const handleStart = () => {
    const finalNames = [...names];
    finalNames[0] = 'Me'; // Ensure "Me" is always index 0
    initGame({
      players: Array.from({ length: numPlayers }, (_, i) => i),
      playerNames: finalNames,
      decks: numDecks,
    });
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-5">
      <div className="w-full max-w-[440px] md:max-w-[860px]">

        {/* Title */}
        <div className="text-center mb-10">
          <div className="text-[40px] md:text-[52px] tracking-[6px] mb-2">
            <span className="text-hearts">♥</span>
            <span className="text-diamonds ml-1.5">♦</span>
            <span className="text-clubs ml-1.5">♣</span>
            <span className="text-spades ml-1.5">♠</span>
          </div>
          <h1 className="text-gold text-[28px] md:text-[36px] font-bold tracking-[6px] m-0">
            THULLA TRACKER
          </h1>
          <p className="text-text-dark text-xs tracking-[3px] mt-1.5">
            YOUR PERSONAL GAME COMPANION
          </p>
        </div>

        <div className="flex flex-col md:grid md:grid-cols-2 gap-6">

          {/* Left — controls */}
          <div className="flex flex-col gap-5">
            {/* Player count */}
            <div>
              <label className="block text-text-dark text-[10px] tracking-[2px] mb-2.5">PLAYERS</label>
              <div className="flex gap-2.5">
                {[4, 5, 6, 7].map(n => (
                  <button
                    key={n}
                    onClick={() => handlePlayerChange(n)}
                    className={`flex-1 py-3.5 rounded-[10px] text-lg font-bold cursor-pointer transition-all duration-200 tap-btn
                      ${numPlayers === n
                        ? 'bg-gradient-to-br from-gold to-gold-dark text-bg-primary border-none shadow-[0_2px_12px_#c9a84c33]'
                        : 'bg-bg-secondary text-text-muted border border-border hover:border-gold/30'
                      }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Deck count */}
            <div>
              <label className="block text-text-dark text-[10px] tracking-[2px] mb-2.5">DECKS</label>
              <div className="flex gap-2.5">
                {[1, 2, 3].map(n => (
                  <button
                    key={n}
                    onClick={() => setNumDecks(n)}
                    className={`flex-1 py-3.5 rounded-[10px] text-lg font-bold cursor-pointer transition-all duration-200 tap-btn
                      ${numDecks === n
                        ? 'bg-gradient-to-br from-gold to-gold-dark text-bg-primary border-none shadow-[0_2px_12px_#c9a84c33]'
                        : 'bg-bg-secondary text-text-muted border border-border hover:border-gold/30'
                      }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-text-dark text-[11px] mt-2">
                {numDecks} deck{numDecks > 1 ? 's' : ''} · {numDecks * 52} cards · {numDecks * 13} per suit
              </p>
            </div>
          </div>

          {/* Right — player names */}
          <div>
            <label className="block text-text-dark text-[10px] tracking-[2px] mb-2.5">PLAYER NAMES</label>
            <div className={`grid gap-2 ${numPlayers > 4 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {names.map((name, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 ${i === 0 ? 'rounded-lg border-2 border-gold/40 bg-gold/5 p-1.5' : ''}`}
                >
                  <span className={`text-xs w-4 text-center ${i === 0 ? 'text-gold text-base' : 'text-gold'}`}>
                    {i === 0 ? '👑' : i + 1}
                  </span>
                  {i === 0 ? (
                    <div className="flex-1 bg-bg-secondary border border-gold/30 text-gold rounded-lg px-3 py-2.5 text-sm font-bold tracking-wider flex items-center justify-between">
                      <span>Me</span>
                      <span className="text-[9px] text-text-dark font-normal tracking-[1px]">YOU — THE APP HELPS YOU WIN</span>
                    </div>
                  ) : (
                    <input
                      value={name}
                      onChange={e => {
                        const a = [...names];
                        a[i] = e.target.value;
                        setNames(a);
                      }}
                      className="flex-1 bg-bg-secondary border border-border text-text-primary rounded-lg px-3 py-2.5 text-sm
                        outline-none focus:border-gold/50 transition-colors"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          className="w-full mt-8 py-4 bg-gradient-to-br from-gold to-gold-dark text-bg-primary border-none
            rounded-xl font-bold text-[17px] cursor-pointer tracking-[2px] shadow-[0_4px_24px_#c9a84c33]
            hover:shadow-[0_6px_32px_#c9a84c55] hover:scale-[1.01] active:scale-[0.98] transition-all duration-200"
        >
          ▶ &nbsp; START GAME
        </button>
      </div>
    </div>
  );
}
