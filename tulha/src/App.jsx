import { useState, useContext, createContext, useReducer, useCallback, useEffect } from "react";

// ─── RESPONSIVE HOOK ─────────────────────────────────────────────────────────
function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}

// ─── CONTEXT ────────────────────────────────────────────────────────────────
const GameContext = createContext(null);

const SUITS = [
  { key: "hearts",   label: "Hearts",   symbol: "♥", color: "#e63946" },
  { key: "diamonds", label: "Diamonds", symbol: "♦", color: "#e05c67" },
  { key: "clubs",    label: "Clubs",    symbol: "♣", color: "#d0e8ff" },
  { key: "spades",   label: "Spades",   symbol: "♠", color: "#c8d8f0" },
];

function buildInitialState({ players, decks, playerNames }) {
  const totalPerSuit = decks * 13;
  const suits = {};
  SUITS.forEach(s => { suits[s.key] = { total: totalPerSuit, discarded: 0 }; });
  const playerStatus = {};
  players.forEach((playerIdx) => {
    playerStatus[playerIdx] = { hearts: true, diamonds: true, clubs: true, spades: true };
  });
  return { players, playerNames, decks, suits, playerStatus, history: [], thullaLog: [] };
}

function reducer(state, action) {
  switch (action.type) {
    case "TRICK": {
      const { suit } = action;
      const s = state.suits[suit];
      const rem = s.total - s.discarded;
      const subtract = Math.min(state.players.length, rem);
      if (subtract <= 0) return state;
      const entry = { id: Date.now(), type: "trick", suit, count: subtract, ts: new Date().toLocaleTimeString() };
      return { ...state, suits: { ...state.suits, [suit]: { ...s, discarded: s.discarded + subtract } }, history: [entry, ...state.history] };
    }
    case "THULLA": {
      const { playerIdx, ledSuit, thrownSuit } = action;
      const entry = { id: Date.now(), type: "thulla", playerIdx, playerName: state.playerNames[playerIdx], ledSuit, thrownSuit, ts: new Date().toLocaleTimeString() };
      return {
        ...state,
        playerStatus: { ...state.playerStatus, [playerIdx]: { ...state.playerStatus[playerIdx], [ledSuit]: false } },
        thullaLog: [entry, ...state.thullaLog],
        history: [entry, ...state.history],
      };
    }
    case "UNDO": {
      const [last, ...rest] = state.history;
      if (!last) return state;
      if (last.type === "trick") {
        const s = state.suits[last.suit];
        return { ...state, suits: { ...state.suits, [last.suit]: { ...s, discarded: s.discarded - last.count } }, history: rest };
      }
      if (last.type === "thulla") {
        return {
          ...state,
          playerStatus: { ...state.playerStatus, [last.playerIdx]: { ...state.playerStatus[last.playerIdx], [last.ledSuit]: true } },
          thullaLog: state.thullaLog.filter(t => t.id !== last.id),
          history: rest,
        };
      }
      return state;
    }
    default: return state;
  }
}

function remCards(suit) { return suit.total - suit.discarded; }
function pct(suit) { return remCards(suit) / suit.total; }

// ─── SETUP PAGE ──────────────────────────────────────────────────────────────
function SetupPage({ onStart }) {
  const [numPlayers, setNumPlayers] = useState(4);
  const [numDecks, setNumDecks] = useState(1);
  const [names, setNames] = useState(["Player 1","Player 2","Player 3","Player 4"]);
  const w = useWindowWidth();
  const isDesktop = w >= 900;

  const handlePlayers = v => {
    const n = Math.max(4, Math.min(7, parseInt(v) || 4));
    setNumPlayers(n);
    setNames(prev => {
      const arr = [...prev];
      while (arr.length < n) arr.push(`Player ${arr.length + 1}`);
      return arr.slice(0, n);
    });
  };

  const handleSubmit = () => {
    onStart({ players: Array.from({ length: numPlayers }, (_, i) => i), playerNames: names, decks: numDecks });
  };

  return (
    <div style={{
      minHeight: "100vh", width: "100%",
      background: "linear-gradient(135deg, #050e1a 0%, #0a1a2e 50%, #050e1a 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Georgia', serif", padding: isDesktop ? "40px" : "20px",
      boxSizing: "border-box",
    }}>
      <div style={{
        position: "fixed", inset: 0, opacity: 0.035,
        backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
        backgroundSize: "6px 6px", pointerEvents: "none",
      }}/>

      <div style={{
        width: "100%", maxWidth: isDesktop ? 960 : 560,
        display: isDesktop ? "grid" : "block",
        gridTemplateColumns: isDesktop ? "1fr 1fr" : undefined,
        background: "linear-gradient(160deg, #0f2340 0%, #0b1a30 100%)",
        border: "1px solid #c9a84c55",
        borderRadius: 24, overflow: "hidden",
        boxShadow: "0 0 80px #000c, 0 0 160px #c9a84c18",
        position: "relative",
      }}>
        {/* Left branding panel (desktop only) */}
        {isDesktop && (
          <div style={{
            background: "linear-gradient(160deg, #0a1628, #061020)",
            borderRight: "1px solid #c9a84c33",
            padding: "60px 48px",
            display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
          }}>
            <div style={{ fontSize: 68, letterSpacing: 8, marginBottom: 24, textAlign: "center", lineHeight: 1.2 }}>
              <span style={{ color: "#e63946" }}>♥</span>
              <span style={{ color: "#d0e8ff", marginLeft: 8 }}>♠</span>
              <br/>
              <span style={{ color: "#e05c67" }}>♦</span>
              <span style={{ color: "#c8d8f0", marginLeft: 8 }}>♣</span>
            </div>
            <h1 style={{ color: "#c9a84c", fontSize: 34, fontWeight: "bold", margin: 0, letterSpacing: 4, textAlign: "center", lineHeight: 1.3 }}>
              THULLA<br/>TRACKER
            </h1>
            <p style={{ color: "#4a6a8a", fontSize: 12, marginTop: 12, letterSpacing: 2, textAlign: "center" }}>CARD GAME COMPANION</p>
            <div style={{ marginTop: 36, padding: "18px 22px", background: "#ffffff07", borderRadius: 12, border: "1px solid #c9a84c22", maxWidth: 220 }}>
              <p style={{ color: "#5a7a9a", fontSize: 12, lineHeight: 1.8, margin: 0 }}>
                Track suits, discards, Thullas, and player status in real time during gameplay.
              </p>
            </div>
          </div>
        )}

        {/* Form panel */}
        <div style={{ padding: isDesktop ? "48px 48px" : "36px 24px", position: "relative" }}>
          {!isDesktop && (
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 30, marginBottom: 8 }}>
                <span style={{ color: "#e63946" }}>♥ </span>
                <span style={{ color: "#e05c67" }}>♦ </span>
                <span style={{ color: "#d0e8ff" }}>♣ </span>
                <span style={{ color: "#c8d8f0" }}>♠</span>
              </div>
              <h1 style={{ color: "#c9a84c", fontSize: 24, fontWeight: "bold", margin: 0, letterSpacing: 3 }}>THULLA TRACKER</h1>
              <p style={{ color: "#4a6a8a", fontSize: 11, marginTop: 5, letterSpacing: 1 }}>CARD GAME COMPANION</p>
            </div>
          )}

          {isDesktop && (
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ color: "#c9a84c", margin: 0, fontSize: 20, letterSpacing: 2 }}>GAME SETUP</h2>
              <div style={{ width: 40, height: 2, background: "linear-gradient(90deg, #c9a84c, transparent)", marginTop: 8 }}/>
            </div>
          )}

          {/* Players */}
          <div style={{ marginBottom: 22 }}>
            <label style={labelStyle}>NUMBER OF PLAYERS</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => handlePlayers(numPlayers - 1)} style={stepBtn}>−</button>
              <input type="number" min={4} max={7} value={numPlayers}
                onChange={e => handlePlayers(e.target.value)}
                style={{ ...inputStyle, fontSize: isDesktop ? 22 : 18, width: isDesktop ? 100 : 80 }}
              />
              <button onClick={() => handlePlayers(numPlayers + 1)} style={stepBtn}>+</button>
              <span style={{ color: "#3a5060", fontSize: 12 }}>(4 – 7)</span>
            </div>
          </div>

          {/* Decks */}
          <div style={{ marginBottom: 22 }}>
            <label style={labelStyle}>NUMBER OF DECKS</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => setNumDecks(Math.max(1, numDecks - 1))} style={stepBtn}>−</button>
              <input type="number" min={1} max={6} value={numDecks}
                onChange={e => setNumDecks(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ ...inputStyle, fontSize: isDesktop ? 22 : 18, width: isDesktop ? 100 : 80 }}
              />
              <button onClick={() => setNumDecks(Math.min(6, numDecks + 1))} style={stepBtn}>+</button>
            </div>
            <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[{ label: "Total Cards", value: numDecks * 52 }, { label: "Per Suit", value: numDecks * 13 }].map(stat => (
                <div key={stat.label} style={{ background: "#ffffff07", borderRadius: 8, padding: "6px 14px", border: "1px solid #c9a84c1a" }}>
                  <span style={{ color: "#c9a84c", fontWeight: "bold", fontSize: 15 }}>{stat.value}</span>
                  <span style={{ color: "#3a5060", fontSize: 11, marginLeft: 6 }}>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Player names */}
          <div style={{ marginBottom: 30 }}>
            <label style={labelStyle}>PLAYER NAMES</label>
            <div style={{
              display: "grid",
              gridTemplateColumns: isDesktop && numPlayers > 4 ? "1fr 1fr" : "1fr",
              gap: 10,
            }}>
              {names.map((n, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    color: "#c9a84c", width: 26, height: 26, borderRadius: "50%",
                    background: "#c9a84c1a", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 11, fontWeight: "bold", flexShrink: 0,
                  }}>{i + 1}</span>
                  <input value={n}
                    onChange={e => { const arr = [...names]; arr[i] = e.target.value; setNames(arr); }}
                    style={{ ...inputStyle, flex: 1, width: "auto", textAlign: "left", paddingLeft: 14, fontSize: 14 }}
                  />
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleSubmit} style={{ ...primaryBtn, fontSize: isDesktop ? 17 : 15, padding: isDesktop ? "16px" : "14px" }}>
            ▶ &nbsp; START GAME
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function Dashboard({ onReset }) {
  const { state, dispatch } = useContext(GameContext);
  const w = useWindowWidth();
  const isDesktop = w >= 900;
  const [tab, setTab] = useState("players");
  const [thullaForm, setThullaForm] = useState({ playerIdx: 0, ledSuit: "hearts", thrownSuit: "clubs" });
  const [showThullaModal, setShowThullaModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const totalRemaining = Object.values(state.suits).reduce((a, s) => a + remCards(s), 0);
  const totalDiscarded = Object.values(state.suits).reduce((a, s) => a + s.discarded, 0);
  const totalCards = Object.values(state.suits).reduce((a, s) => a + s.total, 0);
  const dangerSuit = SUITS.reduce((a, b) => pct(state.suits[a.key]) < pct(state.suits[b.key]) ? a : b);

  return (
    <div style={{
      minHeight: "100vh", width: "100vw", maxWidth: "100vw", overflowX: "hidden",
      background: "linear-gradient(160deg, #050e1a 0%, #081520 100%)",
      fontFamily: "'Georgia', serif", color: "#e8dcc8",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        position: "fixed", inset: 0, opacity: 0.03,
        backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
        backgroundSize: "6px 6px", pointerEvents: "none", zIndex: 0,
      }}/>

      {/* HEADER */}
      <div style={{
        background: "linear-gradient(90deg, #07132200, #0f2340, #071322)",
        borderBottom: "1px solid #c9a84c44",
        padding: isDesktop ? "16px 40px" : "12px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 4px 24px #000c", width: "100%", boxSizing: "border-box",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: isDesktop ? 16 : 10 }}>
          <div style={{ fontSize: isDesktop ? 26 : 20 }}>
            <span style={{ color: "#e63946" }}>♥</span>
            <span style={{ color: "#d0e8ff", marginLeft: 3 }}>♠</span>
          </div>
          <div>
            <div style={{ color: "#c9a84c", fontWeight: "bold", fontSize: isDesktop ? 20 : 16, letterSpacing: 2 }}>THULLA TRACKER</div>
            <div style={{ color: "#3a5a6a", fontSize: isDesktop ? 11 : 9 }}>
              {state.players.length} players · {state.decks} deck{state.decks > 1?"s":""} · {totalCards} cards
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: isDesktop ? 10 : 6, alignItems: "center" }}>
          <button onClick={() => dispatch({ type: "UNDO" })} style={iconBtn("#8aa0be", isDesktop)}>
            ↩ {isDesktop ? "Undo" : ""}
          </button>
          <button onClick={() => setShowThullaModal(true)} style={{
            background: "linear-gradient(135deg, #c9a84c, #9a6e20)",
            color: "#060f1c", border: "none", borderRadius: 10,
            padding: isDesktop ? "10px 22px" : "8px 14px",
            fontWeight: "bold", fontSize: isDesktop ? 14 : 12,
            cursor: "pointer", fontFamily: "'Georgia', serif",
            boxShadow: "0 3px 14px #c9a84c44", whiteSpace: "nowrap",
          }}>
            ✂ {isDesktop ? "Record Thulla" : "Thulla"}
          </button>
          <button onClick={() => setShowResetConfirm(true)} style={iconBtn("#e63946", isDesktop)}>
            ↺ {isDesktop ? "Reset" : ""}
          </button>
        </div>
      </div>

      {/* STATS STRIP */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isDesktop ? "repeat(4,1fr)" : "repeat(3,1fr)",
        background: "#040c16", borderBottom: "1px solid #c9a84c1a",
        width: "100%",
      }}>
        {[
          { label: "Remaining", value: totalRemaining, color: "#4ade80" },
          { label: "Discarded", value: totalDiscarded, color: "#c9a84c" },
          { label: "Danger Suit", value: `${dangerSuit.symbol} ${dangerSuit.label}`, color: "#e63946" },
          ...(isDesktop ? [{ label: "Thullas", value: state.thullaLog.length, color: "#a78bfa" }] : []),
        ].map((s, i, arr) => (
          <div key={s.label} style={{
            padding: isDesktop ? "16px 10px" : "10px 6px", textAlign: "center",
            borderRight: i < arr.length - 1 ? "1px solid #c9a84c18" : "none",
          }}>
            <div style={{ color: s.color, fontSize: isDesktop ? 24 : 18, fontWeight: "bold" }}>{s.value}</div>
            <div style={{ color: "#3a5060", fontSize: isDesktop ? 11 : 9, letterSpacing: 1 }}>{s.label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* MAIN LAYOUT */}
      <div style={{
        flex: 1, position: "relative", zIndex: 1,
        display: isDesktop ? "grid" : "flex",
        flexDirection: "column",
        gridTemplateColumns: isDesktop ? "1fr minmax(340px, 32vw)" : undefined,
        width: "100%", minWidth: 0,
      }}>

        {/* ── DESKTOP LEFT: Suits grid always visible ── */}
        {isDesktop ? (
          <div style={{ padding: "28px 32px 28px 40px", overflowY: "auto", minWidth: 0 }}>
            <div style={{ color: "#3a5060", fontSize: 10, letterSpacing: 2, marginBottom: 16 }}>SUIT TRACKER</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 28 }}>
              {SUITS.map(suit => <SuitCard key={suit.key} suit={suit} isDesktop={true} />)}
            </div>

            {/* Tabs below suits on desktop */}
            <div style={{ borderTop: "1px solid #c9a84c1a", paddingTop: 24 }}>
              <div style={{ display: "flex", gap: 0, marginBottom: 16 }}>
                {[{ id: "players", label: "👤 Players" }, { id: "history", label: "📜 History" }].map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)} style={{
                    padding: "10px 22px", background: tab === t.id ? "#0d1e33" : "transparent",
                    color: tab === t.id ? "#c9a84c" : "#3a5060",
                    border: "none", borderBottom: tab === t.id ? "2px solid #c9a84c" : "2px solid transparent",
                    cursor: "pointer", fontSize: 13, fontFamily: "'Georgia', serif",
                  }}>{t.label}</button>
                ))}
              </div>
              {tab === "players" && <PlayersTab isDesktop={true} />}
              {tab === "history" && <HistoryTab />}
            </div>
          </div>
        ) : (
          /* ── MOBILE: Tabs ── */
          <>
            <div style={{ display: "flex", background: "#040c16", borderBottom: "1px solid #c9a84c1a" }}>
              {[{ id: "suits", label: "♠ Suits" }, { id: "players", label: "👤 Players" }, { id: "history", label: "📜 History" }].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  flex: 1, padding: "12px 6px",
                  background: tab === t.id ? "#0d1e33" : "transparent",
                  color: tab === t.id ? "#c9a84c" : "#3a5060",
                  border: "none", borderBottom: tab === t.id ? "2px solid #c9a84c" : "2px solid transparent",
                  cursor: "pointer", fontSize: 12, fontFamily: "'Georgia', serif",
                }}>{t.label}</button>
              ))}
            </div>
            <div style={{ padding: "16px" }}>
              {tab === "suits" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {SUITS.map(suit => <SuitCard key={suit.key} suit={suit} isDesktop={false} />)}
                </div>
              )}
              {tab === "players" && <PlayersTab isDesktop={false} />}
              {tab === "history" && <HistoryTab />}
            </div>
          </>
        )}

        {/* ── DESKTOP RIGHT SIDEBAR ── */}
        {isDesktop && (
          <div style={{
            borderLeft: "1px solid #c9a84c1a",
            padding: "28px 32px",
            overflowY: "auto",
            background: "#040c1688",
            minWidth: 0,
          }}>
            <div style={{ color: "#3a5060", fontSize: 10, letterSpacing: 2, marginBottom: 16 }}>SUIT PROGRESS</div>
            {SUITS.map(suit => {
              const s = state.suits[suit.key];
              const rem = remCards(s);
              const p = pct(s);
              return (
                <div key={suit.key} style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ color: suit.color, fontSize: 14 }}>{suit.symbol} {suit.label}</span>
                    <span style={{ color: p < 0.3 ? "#e63946" : "#4ade80", fontSize: 13, fontWeight: "bold" }}>
                      {rem} / {s.total}
                    </span>
                  </div>
                  <div style={{ background: "#060f1c", borderRadius: 6, height: 10, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 6, width: `${p * 100}%`,
                      background: p < 0.3 ? "linear-gradient(90deg,#e63946,#ff6b7a)" : `linear-gradient(90deg,${suit.color}44,${suit.color})`,
                      transition: "width 0.5s ease",
                    }}/>
                  </div>
                  {p < 0.3 && <div style={{ color: "#e63946", fontSize: 10, marginTop: 3 }}>⚠ HIGH RISK — {Math.round(p*100)}% left</div>}
                </div>
              );
            })}

            <div style={{ borderTop: "1px solid #c9a84c1a", paddingTop: 22, marginTop: 8 }}>
              <div style={{ color: "#3a5060", fontSize: 10, letterSpacing: 2, marginBottom: 14 }}>RECENT THULLAS</div>
              {state.thullaLog.length === 0 ? (
                <div style={{ color: "#1e2e3e", fontSize: 13 }}>No thullas yet.</div>
              ) : state.thullaLog.slice(0, 7).map(t => {
                const led = SUITS.find(s => s.key === t.ledSuit);
                const thrown = SUITS.find(s => s.key === t.thrownSuit);
                return (
                  <div key={t.id} style={{
                    background: "#0d1e30", border: "1px solid #e6394618",
                    borderRadius: 8, padding: "8px 12px", marginBottom: 8, fontSize: 12,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <span style={{ color: "#c8d8e8", fontWeight: "bold" }}>{t.playerName}</span>
                      <span style={{ color: "#2a3a4a", fontSize: 10 }}>{t.ts}</span>
                    </div>
                    <span style={{ color: "#4a6a8a" }}>out of </span>
                    <span style={{ color: led.color }}>{led.symbol} {led.label}</span>
                    <span style={{ color: "#4a6a8a" }}> · threw </span>
                    <span style={{ color: thrown.color }}>{thrown.symbol} {thrown.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* THULLA MODAL */}
      {showThullaModal && (
        <Modal onClose={() => setShowThullaModal(false)} isDesktop={isDesktop}>
          <h3 style={{ color: "#c9a84c", marginTop: 0, letterSpacing: 2, fontSize: isDesktop ? 19 : 16, marginBottom: 20 }}>RECORD THULLA</h3>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>PLAYER</label>
            <select value={thullaForm.playerIdx} onChange={e => setThullaForm(f => ({ ...f, playerIdx: +e.target.value }))} style={selectStyle}>
              {state.players.map(i => <option key={i} value={i}>{state.playerNames[i]}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>LED SUIT (COULDN'T FOLLOW)</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {SUITS.map(s => (
                <button key={s.key} onClick={() => setThullaForm(f => ({ ...f, ledSuit: s.key }))} style={{
                  background: thullaForm.ledSuit === s.key ? `${s.color}1a` : "#060f1c",
                  border: thullaForm.ledSuit === s.key ? `2px solid ${s.color}` : "1px solid #c9a84c1a",
                  color: thullaForm.ledSuit === s.key ? s.color : "#4a6a8a",
                  borderRadius: 8, padding: "10px", cursor: "pointer",
                  fontFamily: "'Georgia', serif", fontSize: 14, fontWeight: "bold",
                }}>{s.symbol} {s.label}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>SUIT THROWN</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {SUITS.filter(s => s.key !== thullaForm.ledSuit).map(s => (
                <button key={s.key} onClick={() => setThullaForm(f => ({ ...f, thrownSuit: s.key }))} style={{
                  background: thullaForm.thrownSuit === s.key ? `${s.color}1a` : "#060f1c",
                  border: thullaForm.thrownSuit === s.key ? `2px solid ${s.color}` : "1px solid #c9a84c1a",
                  color: thullaForm.thrownSuit === s.key ? s.color : "#4a6a8a",
                  borderRadius: 8, padding: "10px", cursor: "pointer",
                  fontFamily: "'Georgia', serif", fontSize: 14, fontWeight: "bold",
                }}>{s.symbol} {s.label}</button>
              ))}
            </div>
          </div>
          <button onClick={() => { dispatch({ type: "THULLA", ...thullaForm }); setShowThullaModal(false); }} style={primaryBtn}>
            ✓ &nbsp; Record Thulla
          </button>
        </Modal>
      )}

      {/* RESET CONFIRM */}
      {showResetConfirm && (
        <Modal onClose={() => setShowResetConfirm(false)} isDesktop={isDesktop}>
          <h3 style={{ color: "#e63946", marginTop: 0, fontSize: isDesktop ? 20 : 17 }}>Reset Game?</h3>
          <p style={{ color: "#3a5a6a", marginBottom: 24, lineHeight: 1.7 }}>All tracked progress will be lost. This cannot be undone.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <button onClick={() => setShowResetConfirm(false)} style={{ ...primaryBtn, background: "transparent", border: "1px solid #3a5a6a", color: "#4a6a8a", boxShadow: "none" }}>Cancel</button>
            <button onClick={onReset} style={{ ...primaryBtn, background: "linear-gradient(135deg, #e63946, #b02030)" }}>Reset</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── SUIT CARD ───────────────────────────────────────────────────────────────
function SuitCard({ suit, isDesktop }) {
  const { state, dispatch } = useContext(GameContext);
  const s = state.suits[suit.key];
  const rem = remCards(s);
  const p = pct(s);
  const isRisk = p < 0.3;

  return (
    <div style={{
      background: "linear-gradient(135deg, #0d1e33, #09172a)",
      border: `1px solid ${isRisk ? "#e6394655" : "#c9a84c22"}`,
      borderRadius: 14, padding: isDesktop ? "20px 22px" : "14px 16px",
      boxShadow: isRisk ? "0 0 28px #e6394614" : "0 2px 12px #00000033",
      transition: "all 0.3s",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: isDesktop ? 30 : 26, color: suit.color, lineHeight: 1, textShadow: `0 0 12px ${suit.color}44` }}>{suit.symbol}</span>
          <div>
            <div style={{ fontWeight: "bold", fontSize: isDesktop ? 16 : 15, color: "#d8ccc0" }}>{suit.label}</div>
            {isRisk
              ? <div style={{ color: "#e63946", fontSize: 10, fontWeight: "bold" }}>⚠ HIGH RISK</div>
              : <div style={{ color: "#2a3a4a", fontSize: 10 }}>{Math.round(p * 100)}% left</div>
            }
          </div>
        </div>
        <button
          onClick={() => dispatch({ type: "TRICK", suit: suit.key })}
          disabled={rem <= 0}
          style={{
            background: rem <= 0 ? "#0d1e33" : `linear-gradient(135deg, ${suit.color}cc, ${suit.color}88)`,
            color: rem <= 0 ? "#2a3a4a" : "#fff",
            border: `1px solid ${rem <= 0 ? "#1a2a3a" : suit.color + "66"}`,
            borderRadius: 10, padding: isDesktop ? "10px 16px" : "8px 12px",
            fontWeight: "bold", cursor: rem <= 0 ? "not-allowed" : "pointer",
            fontSize: isDesktop ? 13 : 12, fontFamily: "'Georgia', serif",
            boxShadow: rem > 0 ? `0 3px 10px ${suit.color}28` : "none",
            whiteSpace: "nowrap", flexShrink: 0,
          }}
        >+ Trick <span style={{ opacity: 0.7 }}>({state.players.length})</span></button>
      </div>

      <div style={{ background: "#040c16", borderRadius: 6, height: 6, marginBottom: 10, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 6, width: `${p * 100}%`,
          background: isRisk ? "linear-gradient(90deg,#e63946,#ff6b7a)" : `linear-gradient(90deg,${suit.color}44,${suit.color})`,
          transition: "width 0.5s ease",
        }}/>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 4 }}>
        {[
          { l: "Total", v: s.total, c: "#2a3a4a" },
          { l: "Discarded", v: s.discarded, c: "#c9a84c" },
          { l: "Remaining", v: rem, c: "#4ade80", bold: true },
        ].map(({ l, v, c, bold }) => (
          <div key={l} style={{ textAlign: "center", background: "#ffffff04", borderRadius: 6, padding: "6px 4px" }}>
            <div style={{ color: c, fontWeight: bold ? "bold" : "normal", fontSize: bold ? (isDesktop ? 18 : 16) : (isDesktop ? 14 : 13) }}>{v}</div>
            <div style={{ color: "#1e2e3e", fontSize: 9, letterSpacing: 0.5 }}>{l.toUpperCase()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PLAYERS TAB ─────────────────────────────────────────────────────────────
function PlayersTab({ isDesktop }) {
  const { state } = useContext(GameContext);
  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: isDesktop ? 14 : 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #c9a84c22" }}>
              <th style={{ color: "#3a5060", padding: isDesktop ? "12px 14px" : "10px 8px", textAlign: "left", fontSize: 10, letterSpacing: 1.5 }}>PLAYER</th>
              {SUITS.map(s => (
                <th key={s.key} style={{ color: s.color, padding: "10px 8px", textAlign: "center", fontSize: isDesktop ? 22 : 18 }}>{s.symbol}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.players.map(i => (
              <tr key={i} style={{ borderBottom: "1px solid #0d1e2e" }}>
                <td style={{ padding: isDesktop ? "14px 14px" : "12px 8px", color: "#d8ccc0", fontWeight: "bold", whiteSpace: "nowrap" }}>
                  {state.playerNames[i]}
                </td>
                {SUITS.map(s => {
                  const has = state.playerStatus[i][s.key];
                  return (
                    <td key={s.key} style={{ padding: "10px 8px", textAlign: "center" }}>
                      <div style={{
                        display: "inline-flex", flexDirection: "column", alignItems: "center",
                        background: has ? "#081a0a" : "#1a0808",
                        border: `1px solid ${has ? "#4ade8022" : "#e6394622"}`,
                        borderRadius: 8, padding: isDesktop ? "5px 12px" : "4px 8px", minWidth: 36,
                      }}>
                        <span style={{ fontSize: isDesktop ? 15 : 14, color: has ? "#4ade80" : "#e63946" }}>{has ? "✓" : "✗"}</span>
                        <span style={{ fontSize: 8, color: has ? "#1a4a1a" : "#6a1a1a", letterSpacing: 0.5 }}>{has ? "HAS" : "OUT"}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!isDesktop && state.thullaLog.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ color: "#3a5060", fontSize: 10, letterSpacing: 2, marginBottom: 12 }}>THULLA LOG</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {state.thullaLog.map(t => {
              const led = SUITS.find(s => s.key === t.ledSuit);
              const thrown = SUITS.find(s => s.key === t.thrownSuit);
              return (
                <div key={t.id} style={{ background: "#0d1e30", border: "1px solid #e6394618", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 12 }}>
                    <span style={{ color: "#d8ccc0", fontWeight: "bold" }}>{t.playerName}</span>
                    <span style={{ color: "#3a5060" }}> out of </span>
                    <span style={{ color: led.color }}>{led.symbol}</span>
                    <span style={{ color: "#3a5060" }}> · threw </span>
                    <span style={{ color: thrown.color }}>{thrown.symbol}</span>
                  </div>
                  <div style={{ color: "#1e2e3e", fontSize: 10 }}>{t.ts}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HISTORY TAB ─────────────────────────────────────────────────────────────
function HistoryTab() {
  const { state } = useContext(GameContext);
  if (state.history.length === 0) {
    return <div style={{ textAlign: "center", padding: 40, color: "#1e2e3e" }}>No actions recorded yet.</div>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {state.history.map(entry => {
        if (entry.type === "trick") {
          const suit = SUITS.find(s => s.key === entry.suit);
          return (
            <div key={entry.id} style={{ background: "#0d1e33", border: "1px solid #c9a84c18", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ color: suit.color, fontSize: 18, marginRight: 8 }}>{suit.symbol}</span>
                <span style={{ color: "#c8d8e8" }}>Trick — {suit.label}</span>
                <span style={{ color: "#4ade80", marginLeft: 8, fontSize: 13 }}>−{entry.count} cards</span>
              </div>
              <div style={{ color: "#1e2e3e", fontSize: 11 }}>{entry.ts}</div>
            </div>
          );
        }
        if (entry.type === "thulla") {
          const led = SUITS.find(s => s.key === entry.ledSuit);
          return (
            <div key={entry.id} style={{ background: "#180a10", border: "1px solid #e6394622", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ color: "#e63946", marginRight: 8 }}>✂</span>
                <span style={{ color: "#c8d8e8" }}>Thulla — {entry.playerName}</span>
                <span style={{ color: "#3a5060" }}> out of </span>
                <span style={{ color: led.color }}>{led.symbol} {led.label}</span>
              </div>
              <div style={{ color: "#1e2e3e", fontSize: 11 }}>{entry.ts}</div>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

// ─── MODAL ───────────────────────────────────────────────────────────────────
function Modal({ children, onClose, isDesktop }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "#000d", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{
        background: "linear-gradient(160deg, #0f2340, #0b1a30)",
        border: "1px solid #c9a84c44", borderRadius: 18,
        padding: isDesktop ? "36px 32px" : "26px 22px",
        width: "100%", maxWidth: isDesktop ? 480 : 420,
        boxShadow: "0 0 60px #000c, 0 0 100px #c9a84c14",
      }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// ─── STYLE CONSTANTS ─────────────────────────────────────────────────────────
const labelStyle = { display: "block", color: "#3a5060", fontSize: 10, letterSpacing: 1.5, marginBottom: 8, fontFamily: "'Georgia', serif" };
const inputStyle = { background: "#060f1c", border: "1px solid #c9a84c33", color: "#e8dcc8", borderRadius: 8, padding: "10px 12px", fontSize: 16, width: 80, textAlign: "center", fontFamily: "'Georgia', serif", outline: "none", boxSizing: "border-box" };
const stepBtn = { background: "#0d1e33", border: "1px solid #c9a84c33", color: "#c9a84c", width: 40, height: 40, borderRadius: 8, cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
const primaryBtn = { width: "100%", padding: "14px", background: "linear-gradient(135deg, #c9a84c, #9a6e20)", color: "#060f1c", border: "none", borderRadius: 10, fontWeight: "bold", fontSize: 15, cursor: "pointer", fontFamily: "'Georgia', serif", letterSpacing: 1, boxShadow: "0 4px 20px #c9a84c33" };
const selectStyle = { width: "100%", background: "#060f1c", border: "1px solid #c9a84c33", color: "#e8dcc8", borderRadius: 8, padding: "11px 14px", fontSize: 15, fontFamily: "'Georgia', serif", outline: "none" };
const iconBtn = (color, isDesktop) => ({ background: "transparent", border: `1px solid ${color}33`, color, borderRadius: 8, padding: isDesktop ? "9px 16px" : "7px 10px", cursor: "pointer", fontSize: isDesktop ? 13 : 11, fontFamily: "'Georgia', serif", whiteSpace: "nowrap" });

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [gameConfig, setGameConfig] = useState(null);
  useEffect(() => {
    document.documentElement.style.cssText = "margin:0;padding:0;width:100%;height:100%;";
    document.body.style.cssText = "margin:0;padding:0;width:100%;min-height:100vh;overflow-x:hidden;";
    const root = document.getElementById("root");
    if (root) root.style.cssText = "width:100%;min-height:100vh;";
  }, []);
  const [gameState, gameDispatch] = useReducer((s, a) => {
    if (a.type === "__INIT__") return a.payload;
    return reducer(s, a);
  }, null);

  const handleStart = useCallback(config => {
    gameDispatch({ type: "__INIT__", payload: buildInitialState(config) });
    setGameConfig(config);
  }, []);

  if (!gameConfig || !gameState) return <SetupPage onStart={handleStart} />;

  return (
    <GameContext.Provider value={{ state: gameState, dispatch: gameDispatch }}>
      <Dashboard onReset={() => { setGameConfig(null); gameDispatch({ type: "__INIT__", payload: null }); }} />
    </GameContext.Provider>
  );
}