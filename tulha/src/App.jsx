import { useState, useContext, createContext, useReducer, useCallback, useEffect } from "react";

function useWindowWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => { const h = () => setW(window.innerWidth); window.addEventListener("resize", h); return () => window.removeEventListener("resize", h); }, []);
  return w;
}

const GameContext = createContext(null);

const SUITS = [
  { key: "hearts",   label: "Hearts",   symbol: "♥", color: "#e63946" },
  { key: "diamonds", label: "Diamonds", symbol: "♦", color: "#e05c67" },
  { key: "clubs",    label: "Clubs",    symbol: "♣", color: "#a8c8ff" },
  { key: "spades",   label: "Spades",   symbol: "♠", color: "#b8d0f0" },
];

function buildInitialState({ players, decks, playerNames }) {
  const totalPerSuit = decks * 13;
  const suits = {};
  SUITS.forEach(s => { suits[s.key] = { total: totalPerSuit, discarded: 0 }; });
  const playerStatus = {};
  players.forEach(i => { playerStatus[i] = { hearts: true, diamonds: true, clubs: true, spades: true }; });
  return { players, playerNames, decks, suits, playerStatus, history: [], thullaLog: [] };
}

function reducer(state, action) {
  switch (action.type) {
    case "TRICK": {
      const s = state.suits[action.suit];
      const sub = Math.min(state.players.length, s.total - s.discarded);
      if (sub <= 0) return state;
      const e = { id: Date.now(), type: "trick", suit: action.suit, count: sub, ts: new Date().toLocaleTimeString() };
      return { ...state, suits: { ...state.suits, [action.suit]: { ...s, discarded: s.discarded + sub } }, history: [e, ...state.history] };
    }
    case "THULLA": {
      const { playerIdx, ledSuit, thrownSuit } = action;
      const e = { id: Date.now(), type: "thulla", playerIdx, playerName: state.playerNames[playerIdx], ledSuit, thrownSuit, ts: new Date().toLocaleTimeString() };
      return {
        ...state,
        playerStatus: { ...state.playerStatus, [playerIdx]: { ...state.playerStatus[playerIdx], [ledSuit]: false } },
        thullaLog: [e, ...state.thullaLog],
        history: [e, ...state.history],
      };
    }
    case "REMOVE_PLAYER": {
      const { playerIdx } = action;
      const e = { id: Date.now(), type: "remove", playerIdx, playerName: state.playerNames[playerIdx], ts: new Date().toLocaleTimeString() };
      const newPlayers = state.players.filter(i => i !== playerIdx);
      // Recalculate suits: each trick now removes one fewer card
      return {
        ...state,
        players: newPlayers,
        history: [e, ...state.history],
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
      if (last.type === "remove") {
        return { ...state, players: [...state.players, last.playerIdx].sort((a,b)=>a-b), history: rest };
      }
      return state;
    }
    default: return state;
  }
}

const rem = s => s.total - s.discarded;
const pct = s => rem(s) / s.total;

// ─── SETUP ───────────────────────────────────────────────────────────────────
function SetupPage({ onStart }) {
  const [numPlayers, setNumPlayers] = useState(4);
  const [numDecks, setNumDecks] = useState(1);
  const [names, setNames] = useState(["Player 1","Player 2","Player 3","Player 4"]);
  const w = useWindowWidth();
  const isDesktop = w >= 768;

  const setPlayers = v => {
    const n = Math.max(4, Math.min(7, +v || 4));
    setNumPlayers(n);
    setNames(p => { const a = [...p]; while (a.length < n) a.push(`Player ${a.length+1}`); return a.slice(0,n); });
  };

  return (
    <div style={{ minHeight:"100vh", background:"#060d18", display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:"'Georgia',serif" }}>
      <div style={{ width:"100%", maxWidth: isDesktop ? 860 : 440 }}>

        {/* Title */}
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ fontSize: isDesktop ? 52 : 40, letterSpacing:6, marginBottom:8 }}>
            <span style={{color:"#e63946"}}>♥</span>
            <span style={{color:"#e05c67",marginLeft:6}}>♦</span>
            <span style={{color:"#a8c8ff",marginLeft:6}}>♣</span>
            <span style={{color:"#b8d0f0",marginLeft:6}}>♠</span>
          </div>
          <h1 style={{ color:"#c9a84c", fontSize: isDesktop ? 36 : 28, margin:0, letterSpacing:6, fontWeight:"bold" }}>THULLA TRACKER</h1>
          <p style={{ color:"#2a4060", fontSize:12, marginTop:6, letterSpacing:3 }}>CARD GAME COMPANION</p>
        </div>

        <div style={{ display: isDesktop ? "grid" : "flex", flexDirection:"column", gridTemplateColumns:"1fr 1fr", gap:24 }}>

          {/* Left */}
          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
            <div>
              <label style={lbl}>PLAYERS</label>
              <div style={{ display:"flex", gap:10 }}>
                {[4,5,6,7].map(n => (
                  <button key={n} onClick={() => setPlayers(n)} style={{
                    flex:1, padding:"14px 0", borderRadius:10, fontFamily:"'Georgia',serif",
                    background: numPlayers===n ? "linear-gradient(135deg,#c9a84c,#9a6e20)" : "#0d1e33",
                    color: numPlayers===n ? "#060d18" : "#4a6a8a",
                    border: numPlayers===n ? "none" : "1px solid #1a2a3a",
                    fontSize:18, fontWeight:"bold", cursor:"pointer",
                  }}>{n}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={lbl}>DECKS</label>
              <div style={{ display:"flex", gap:10 }}>
                {[1,2,3].map(n => (
                  <button key={n} onClick={() => setNumDecks(n)} style={{
                    flex:1, padding:"14px 0", borderRadius:10, fontFamily:"'Georgia',serif",
                    background: numDecks===n ? "linear-gradient(135deg,#c9a84c,#9a6e20)" : "#0d1e33",
                    color: numDecks===n ? "#060d18" : "#4a6a8a",
                    border: numDecks===n ? "none" : "1px solid #1a2a3a",
                    fontSize:18, fontWeight:"bold", cursor:"pointer",
                  }}>{n}</button>
                ))}
              </div>
              <p style={{ color:"#2a4060", fontSize:11, marginTop:8 }}>
                {numDecks} deck{numDecks>1?"s":""} · {numDecks*52} cards · {numDecks*13} per suit
              </p>
            </div>
          </div>

          {/* Right — names */}
          <div>
            <label style={lbl}>PLAYER NAMES</label>
            <div style={{ display:"grid", gridTemplateColumns: numPlayers > 4 ? "1fr 1fr" : "1fr", gap:8 }}>
              {names.map((n,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ color:"#c9a84c", fontSize:12, width:16 }}>{i+1}</span>
                  <input value={n} onChange={e => { const a=[...names]; a[i]=e.target.value; setNames(a); }}
                    style={{ flex:1, background:"#0d1e33", border:"1px solid #1a2a3a", color:"#d8ccc0", borderRadius:8, padding:"10px 12px", fontFamily:"'Georgia',serif", fontSize:14, outline:"none" }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <button onClick={() => onStart({ players: Array.from({length:numPlayers},(_,i)=>i), playerNames:names, decks:numDecks })}
          style={{ width:"100%", marginTop:32, padding:"16px", background:"linear-gradient(135deg,#c9a84c,#9a6e20)", color:"#060d18", border:"none", borderRadius:12, fontWeight:"bold", fontSize:17, cursor:"pointer", fontFamily:"'Georgia',serif", letterSpacing:2, boxShadow:"0 4px 24px #c9a84c33" }}>
          ▶ &nbsp; START GAME
        </button>
      </div>
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
function Dashboard({ onReset }) {
  const { state, dispatch } = useContext(GameContext);
  const w = useWindowWidth();
  const isDesktop = w >= 900;
  const [activeTab, setActiveTab] = useState("suits");
  const [showReset, setShowReset] = useState(false);

  // Quick Thulla — 2-tap: pick player, then pick their missing suit
  const [thullaStep, setThullaStep] = useState(null); // null | { playerIdx }

  const totalRem = Object.values(state.suits).reduce((a,s)=>a+rem(s),0);
  const totalDisc = Object.values(state.suits).reduce((a,s)=>a+s.discarded,0);
  const danger = SUITS.reduce((a,b) => pct(state.suits[a.key]) < pct(state.suits[b.key]) ? a : b);

  const handleQuickThulla = (playerIdx, ledSuit) => {
    // Auto-detect thrown suit: first suit player still has that isn't the led suit
    const thrownSuit = SUITS.find(s => s.key !== ledSuit && state.playerStatus[playerIdx][s.key])?.key || "clubs";
    dispatch({ type:"THULLA", playerIdx, ledSuit, thrownSuit });
    setThullaStep(null);
  };

  return (
    <div style={{ minHeight:"100vh", width:"100vw", maxWidth:"100vw", overflowX:"hidden", background:"#060d18", fontFamily:"'Georgia',serif", color:"#d8ccc0", display:"flex", flexDirection:"column" }}>
      <style>{`
        * { box-sizing: border-box; }
        body, html, #root { margin:0; padding:0; width:100%; background:#060d18; }
        .suit-btn:active { transform: scale(0.94); }
        .player-btn:active { transform: scale(0.96); }
        @keyframes pop { 0%{transform:scale(1)} 50%{transform:scale(1.08)} 100%{transform:scale(1)} }
        .pop { animation: pop 0.2s ease; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background:"#080f1e", borderBottom:"1px solid #c9a84c22", padding: isDesktop ? "12px 32px" : "10px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ color:"#e63946", fontSize:18 }}>♥</span>
          <span style={{ color:"#b8d0f0", fontSize:18 }}>♠</span>
          <div style={{ marginLeft:4 }}>
            <div style={{ color:"#c9a84c", fontWeight:"bold", fontSize: isDesktop ? 18 : 15, letterSpacing:2 }}>THULLA TRACKER</div>
            <div style={{ color:"#1e3050", fontSize:10 }}>{state.players.length} active · {state.decks}deck · {state.decks*52} cards</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={() => dispatch({type:"UNDO"})} style={hdrBtn("#4a6a8a")}>↩</button>
          <button onClick={() => setShowReset(true)} style={hdrBtn("#e63946")}>↺</button>
        </div>
      </div>

      {/* ── STAT BAR ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", background:"#04090f", borderBottom:"1px solid #0e1e2e" }}>
        {[
          { label:"REMAINING", val:totalRem, color:"#4ade80" },
          { label:"DISCARDED", val:totalDisc, color:"#c9a84c" },
          { label:"DANGER", val:`${danger.symbol} ${danger.label}`, color:"#e63946" },
        ].map((s,i,a) => (
          <div key={s.label} style={{ padding: isDesktop?"14px 8px":"10px 4px", textAlign:"center", borderRight: i<a.length-1?"1px solid #0e1e2e":"none" }}>
            <div style={{ color:s.color, fontSize: isDesktop?22:18, fontWeight:"bold" }}>{s.val}</div>
            <div style={{ color:"#1e3050", fontSize:9, letterSpacing:1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── QUICK THULLA OVERLAY ── */}
      {thullaStep && (
        <div style={{ background:"#0a0418", borderBottom:"2px solid #e63946", padding:"12px 16px" }}>
          <div style={{ color:"#e63946", fontSize:11, letterSpacing:2, marginBottom:10 }}>
            ✂ {state.playerNames[thullaStep.playerIdx].toUpperCase()} — PICK THE SUIT THEY COULDN'T FOLLOW
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
            {SUITS.map(s => (
              <button key={s.key} onClick={() => handleQuickThulla(thullaStep.playerIdx, s.key)}
                className="suit-btn"
                style={{ background:`${s.color}18`, border:`2px solid ${s.color}66`, borderRadius:10, padding:"12px 8px", cursor:"pointer", fontFamily:"'Georgia',serif", textAlign:"center" }}>
                <div style={{ fontSize:24, color:s.color }}>{s.symbol}</div>
                <div style={{ color:s.color, fontSize:10, marginTop:3 }}>{s.label}</div>
              </button>
            ))}
          </div>
          <button onClick={() => setThullaStep(null)} style={{ marginTop:10, background:"transparent", border:"none", color:"#2a3a4a", fontSize:12, cursor:"pointer", fontFamily:"'Georgia',serif" }}>
            × cancel
          </button>
        </div>
      )}

      {/* ── MAIN ── */}
      <div style={{ flex:1, display: isDesktop?"grid":"flex", flexDirection:"column", gridTemplateColumns: isDesktop?"1fr 320px":undefined, width:"100%" }}>

        {/* LEFT / MAIN CONTENT */}
        <div style={{ minWidth:0 }}>

          {/* Tab bar */}
          <div style={{ display:"flex", background:"#04090f", borderBottom:"1px solid #0e1e2e" }}>
            {[
              { id:"suits", label: isDesktop ? "♠ Suits" : "♠" },
              { id:"thulla", label: isDesktop ? "✂ Thulla" : "✂" },
              { id:"players", label: isDesktop ? "👤 Players" : "👤" },
              { id:"advisor", label: isDesktop ? "🧠 Advisor" : "🧠" },
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                flex:1, padding: isDesktop?"12px 8px":"14px 6px",
                background: activeTab===t.id ? "#0d1e33" : "transparent",
                color: activeTab===t.id ? "#c9a84c" : "#2a4060",
                border:"none", borderBottom: activeTab===t.id?"2px solid #c9a84c":"2px solid transparent",
                cursor:"pointer", fontSize: isDesktop?13:16, fontFamily:"'Georgia',serif",
              }}>{t.label}</button>
            ))}
          </div>

          <div style={{ padding: isDesktop?"24px 28px 24px 32px":"12px" }}>
            {activeTab==="suits"    && <SuitsTab isDesktop={isDesktop} />}
            {activeTab==="thulla"   && <ThullaTab isDesktop={isDesktop} onStartThulla={p => setThullaStep({playerIdx:p})} />}
            {activeTab==="players"  && <PlayersTab isDesktop={isDesktop} />}
            {activeTab==="advisor"  && <AdvisorTab isDesktop={isDesktop} />}
          </div>
        </div>

        {/* RIGHT SIDEBAR — desktop only */}
        {isDesktop && (
          <div style={{ borderLeft:"1px solid #0e1e2e", padding:"24px 24px", overflowY:"auto", background:"#04090f88", minWidth:0 }}>

            <div style={{ color:"#1e3050", fontSize:10, letterSpacing:2, marginBottom:14 }}>SUIT PROGRESS</div>
            {SUITS.map(suit => {
              const s = state.suits[suit.key];
              const r = rem(s); const p = pct(s);
              return (
                <div key={suit.key} style={{ marginBottom:16 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ color:suit.color, fontSize:13 }}>{suit.symbol} {suit.label}</span>
                    <span style={{ color: p<0.3?"#e63946":"#4ade80", fontSize:12, fontWeight:"bold" }}>{r}/{s.total}</span>
                  </div>
                  <div style={{ background:"#060d18", borderRadius:4, height:8, overflow:"hidden" }}>
                    <div style={{ height:"100%", borderRadius:4, width:`${p*100}%`, background: p<0.3?"linear-gradient(90deg,#e63946,#ff6b7a)":`linear-gradient(90deg,${suit.color}44,${suit.color})`, transition:"width 0.4s" }}/>
                  </div>
                  {p<0.3 && <div style={{ color:"#e63946", fontSize:9, marginTop:2 }}>⚠ {Math.round(p*100)}% left</div>}
                </div>
              );
            })}

            <div style={{ borderTop:"1px solid #0e1e2e", paddingTop:18, marginTop:8 }}>
              <div style={{ color:"#1e3050", fontSize:10, letterSpacing:2, marginBottom:12 }}>THULLA LOG</div>
              {state.thullaLog.length===0
                ? <div style={{ color:"#0e1e2e", fontSize:12 }}>None yet.</div>
                : state.thullaLog.slice(0,8).map(t => {
                    const led = SUITS.find(s=>s.key===t.ledSuit);
                    const thrown = SUITS.find(s=>s.key===t.thrownSuit);
                    return (
                      <div key={t.id} style={{ background:"#0a0418", border:"1px solid #e6394618", borderRadius:8, padding:"7px 10px", marginBottom:6, fontSize:11 }}>
                        <span style={{ color:"#d8ccc0", fontWeight:"bold" }}>{t.playerName}</span>
                        <span style={{ color:"#1e3050" }}> out of </span>
                        <span style={{ color:led.color }}>{led.symbol}</span>
                        <span style={{ color:"#1e3050" }}> → </span>
                        <span style={{ color:thrown.color }}>{thrown.symbol}</span>
                        <span style={{ color:"#0e1a28", float:"right" }}>{t.ts}</span>
                      </div>
                    );
                  })
              }
            </div>
          </div>
        )}
      </div>

      {/* RESET MODAL */}
      {showReset && (
        <div style={{ position:"fixed", inset:0, background:"#000c", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={() => setShowReset(false)}>
          <div style={{ background:"#0d1e33", border:"1px solid #e6394644", borderRadius:16, padding:"28px 24px", width:"100%", maxWidth:340 }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ color:"#e63946", marginTop:0 }}>Reset Game?</h3>
            <p style={{ color:"#3a5060", marginBottom:24 }}>All progress will be lost.</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <button onClick={() => setShowReset(false)} style={{ ...actionBtn, background:"transparent", border:"1px solid #1a2a3a", color:"#3a5060" }}>Cancel</button>
              <button onClick={onReset} style={{ ...actionBtn, background:"linear-gradient(135deg,#e63946,#b02030)" }}>Reset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SUITS TAB ───────────────────────────────────────────────────────────────
function SuitsTab({ isDesktop }) {
  const { state, dispatch } = useContext(GameContext);
  return (
    <div style={{ display:"grid", gridTemplateColumns: isDesktop?"1fr 1fr":"1fr 1fr", gap:12 }}>
      {SUITS.map(suit => {
        const s = state.suits[suit.key];
        const r = rem(s); const p = pct(s);
        const risk = p < 0.3;
        return (
          <button key={suit.key} className="suit-btn" onClick={() => dispatch({type:"TRICK", suit:suit.key})}
            disabled={r<=0}
            style={{
              background: risk ? "linear-gradient(135deg,#1a0808,#120508)" : "linear-gradient(135deg,#0d1e33,#09172a)",
              border: `2px solid ${risk ? "#e6394644" : "#c9a84c22"}`,
              borderRadius:14, padding: isDesktop?"20px 18px":"16px 14px",
              cursor: r<=0?"not-allowed":"pointer", textAlign:"left",
              boxShadow: risk?"0 0 20px #e6394614":"none",
              transition:"all 0.2s", display:"block", width:"100%",
            }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <span style={{ fontSize: isDesktop?36:30, color:suit.color, lineHeight:1 }}>{suit.symbol}</span>
              {risk && <span style={{ color:"#e63946", fontSize:10, fontWeight:"bold" }}>⚠ RISK</span>}
            </div>
            <div style={{ color:"#8a9ab0", fontSize:12, marginBottom:8 }}>{suit.label}</div>
            <div style={{ background:"#060d18", borderRadius:4, height:5, marginBottom:10, overflow:"hidden" }}>
              <div style={{ height:"100%", borderRadius:4, width:`${p*100}%`, background: risk?"#e63946":suit.color, transition:"width 0.4s" }}/>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <span style={{ color: risk?"#e63946":"#4ade80", fontSize: isDesktop?22:20, fontWeight:"bold" }}>{r}</span>
                <span style={{ color:"#1e3050", fontSize:11 }}> / {s.total}</span>
              </div>
              <div style={{ background: r<=0?"#0d1e33":`${suit.color}22`, border:`1px solid ${suit.color}44`, borderRadius:8, padding:"5px 10px", color: r<=0?"#1e3050":suit.color, fontSize:11, fontWeight:"bold" }}>
                {r<=0 ? "DONE" : `−${state.players.length}`}
              </div>
            </div>
            <div style={{ color:"#1e3050", fontSize:9, marginTop:6 }}>TAP TO RECORD TRICK</div>
          </button>
        );
      })}
    </div>
  );
}

// ─── THULLA TAB ──────────────────────────────────────────────────────────────
// Ultra fast: tap player → tap led suit → done (2 taps total)
function ThullaTab({ isDesktop }) {
  const { state, dispatch } = useContext(GameContext);
  const [step, setStep] = useState(1); // 1=pick player, 2=pick suit
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const handlePlayer = (idx) => { setSelectedPlayer(idx); setStep(2); };
  const handleSuit = (suitKey) => {
    const thrownSuit = SUITS.find(s => s.key !== suitKey && state.playerStatus[selectedPlayer][s.key])?.key || "clubs";
    dispatch({ type:"THULLA", playerIdx:selectedPlayer, ledSuit:suitKey, thrownSuit });
    setStep(1); setSelectedPlayer(null);
  };

  return (
    <div>
      {/* Step indicator */}
      <div style={{ display:"flex", gap:8, marginBottom:20, alignItems:"center" }}>
        {[{n:1,label:"Pick Player"},{n:2,label:"Pick Led Suit"}].map(s => (
          <div key={s.n} style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:24, height:24, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:"bold",
              background: step===s.n ? "linear-gradient(135deg,#c9a84c,#9a6e20)" : step>s.n ? "#1a3a1a" : "#0d1e33",
              color: step===s.n ? "#060d18" : step>s.n ? "#4ade80" : "#2a4060",
              border: step>s.n ? "1px solid #4ade8033" : "none",
            }}>{step>s.n?"✓":s.n}</div>
            <span style={{ color: step===s.n?"#c9a84c":"#2a4060", fontSize:11 }}>{s.label}</span>
            {s.n<2 && <span style={{ color:"#1a2a3a", fontSize:16, marginLeft:4 }}>›</span>}
          </div>
        ))}
        {step===2 && (
          <button onClick={() => {setStep(1);setSelectedPlayer(null);}} style={{ marginLeft:"auto", background:"transparent", border:"none", color:"#2a4060", fontSize:12, cursor:"pointer", fontFamily:"'Georgia',serif" }}>← back</button>
        )}
      </div>

      {step===1 && (
        <div>
          <div style={{ color:"#2a4060", fontSize:11, letterSpacing:1, marginBottom:12 }}>WHO THREW THULLA? ({state.players.length} active players)</div>
          <div style={{ display:"grid", gridTemplateColumns: isDesktop && state.players.length>4?"repeat(4,1fr)":"repeat(2,1fr)", gap:10 }}>
            {state.players.map(i => (
              <button key={i} onClick={() => handlePlayer(i)} className="player-btn"
                style={{ background:"#0d1e33", border:"1px solid #1a2a3a", borderRadius:12, padding:"18px 12px", cursor:"pointer", fontFamily:"'Georgia',serif", textAlign:"center" }}>
                <div style={{ color:"#d8ccc0", fontWeight:"bold", fontSize:15, marginBottom:6 }}>{state.playerNames[i]}</div>
                <div style={{ display:"flex", justifyContent:"center", gap:4 }}>
                  {SUITS.map(s => (
                    <span key={s.key} style={{ fontSize:14, color: state.playerStatus[i][s.key] ? s.color : "#1a2a3a" }}>{s.symbol}</span>
                  ))}
                </div>
                <div style={{ color:"#1e3050", fontSize:9, marginTop:6 }}>TAP TO SELECT</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step===2 && selectedPlayer!==null && (
        <div>
          <div style={{ background:"#0d1e33", border:"1px solid #c9a84c22", borderRadius:10, padding:"10px 14px", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ color:"#c9a84c", fontSize:13 }}>Recording thulla for</span>
            <span style={{ color:"#d8ccc0", fontWeight:"bold" }}>{state.playerNames[selectedPlayer]}</span>
          </div>
          <div style={{ color:"#2a4060", fontSize:11, letterSpacing:1, marginBottom:12 }}>WHICH SUIT WAS LED? (THEY COULDN'T FOLLOW)</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {SUITS.map(s => (
              <button key={s.key} onClick={() => handleSuit(s.key)} className="suit-btn"
                style={{ background:`${s.color}0f`, border:`2px solid ${s.color}55`, borderRadius:14, padding:"20px 16px", cursor:"pointer", fontFamily:"'Georgia',serif", textAlign:"center" }}>
                <div style={{ fontSize:36, color:s.color, marginBottom:6 }}>{s.symbol}</div>
                <div style={{ color:s.color, fontSize:13, fontWeight:"bold" }}>{s.label}</div>
                {!state.playerStatus[selectedPlayer][s.key] && (
                  <div style={{ color:"#e63946", fontSize:9, marginTop:4 }}>ALREADY OUT</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PLAYERS TAB ─────────────────────────────────────────────────────────────
function PlayersTab({ isDesktop }) {
  const { state, dispatch } = useContext(GameContext);
  const [confirmRemove, setConfirmRemove] = useState(null); // playerIdx to confirm

  return (
    <div>
      {/* Active players count badge */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ background:"#0d1e33", border:"1px solid #c9a84c33", borderRadius:20, padding:"4px 14px", color:"#c9a84c", fontSize:12, fontWeight:"bold" }}>
            {state.players.length} Active Players
          </span>
          {state.players.length < 4 && (
            <span style={{ color:"#e63946", fontSize:11 }}>⚠ Below minimum</span>
          )}
        </div>
        <span style={{ color:"#1e3050", fontSize:11 }}>Tap ✕ to remove player</span>
      </div>

      {/* Player cards — one per player, big and easy to read */}
      <div style={{ display:"grid", gridTemplateColumns: isDesktop && state.players.length > 3 ? "1fr 1fr" : "1fr", gap:10, marginBottom:24 }}>
        {state.players.map(i => {
          const allOut = SUITS.every(s => !state.playerStatus[i][s.key]);
          const outCount = SUITS.filter(s => !state.playerStatus[i][s.key]).length;
          const isConfirming = confirmRemove === i;
          return (
            <div key={i} style={{
              background: allOut ? "linear-gradient(135deg,#1a0808,#120508)" : "linear-gradient(135deg,#0d1e33,#09172a)",
              border: `1px solid ${allOut ? "#e6394644" : isConfirming ? "#e6394688" : "#1a2a3a"}`,
              borderRadius:12, padding:"14px 16px",
              boxShadow: allOut ? "0 0 16px #e6394614" : "none",
              transition:"all 0.2s",
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:32, height:32, borderRadius:"50%", background: allOut?"#e6394622":"#c9a84c22", border:`1px solid ${allOut?"#e6394644":"#c9a84c44"}`, display:"flex", alignItems:"center", justifyContent:"center", color: allOut?"#e63946":"#c9a84c", fontWeight:"bold", fontSize:13 }}>
                    {i+1}
                  </div>
                  <div>
                    <div style={{ color:"#d8ccc0", fontWeight:"bold", fontSize: isDesktop?15:14 }}>{state.playerNames[i]}</div>
                    <div style={{ color: outCount===0?"#2a4060":outCount===1?"#f59e0b":"#e63946", fontSize:10, marginTop:1 }}>
                      {outCount===0 ? "All suits active" : outCount===1 ? "1 suit out" : `${outCount} suits out`}
                      {allOut && " · NO CARDS LEFT"}
                    </div>
                  </div>
                </div>

                {/* Remove button */}
                {!isConfirming ? (
                  <button onClick={() => setConfirmRemove(i)} style={{
                    background:"#1a0808", border:"1px solid #e6394633", borderRadius:8,
                    color:"#e63946", padding:"6px 10px", cursor:"pointer",
                    fontFamily:"'Georgia',serif", fontSize:13, lineHeight:1,
                  }}>✕</button>
                ) : (
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={() => setConfirmRemove(null)} style={{
                      background:"#0d1e33", border:"1px solid #1a2a3a", borderRadius:8,
                      color:"#4a6a8a", padding:"6px 10px", cursor:"pointer",
                      fontFamily:"'Georgia',serif", fontSize:12,
                    }}>Keep</button>
                    <button onClick={() => { dispatch({ type:"REMOVE_PLAYER", playerIdx:i }); setConfirmRemove(null); }} style={{
                      background:"linear-gradient(135deg,#e63946,#b02030)", border:"none", borderRadius:8,
                      color:"#fff", padding:"6px 12px", cursor:"pointer",
                      fontFamily:"'Georgia',serif", fontSize:12, fontWeight:"bold",
                    }}>Remove</button>
                  </div>
                )}
              </div>

              {/* Suit status row */}
              <div style={{ display:"flex", gap:8 }}>
                {SUITS.map(s => {
                  const has = state.playerStatus[i][s.key];
                  return (
                    <div key={s.key} style={{ flex:1, background: has?"#081a0a":"#1a0808", border:`1px solid ${has?"#4ade8018":"#e6394628"}`, borderRadius:8, padding:"6px 4px", textAlign:"center" }}>
                      <div style={{ fontSize: isDesktop?18:16, color: has?s.color:"#2a1010" }}>{s.symbol}</div>
                      <div style={{ fontSize:8, color: has?"#1a4a1a":"#4a1010", marginTop:2 }}>{has?"HAS":"OUT"}</div>
                    </div>
                  );
                })}
              </div>

              {/* "No cards" suggestion banner */}
              {allOut && !isConfirming && (
                <div style={{ marginTop:10, background:"#e6394618", border:"1px solid #e6394633", borderRadius:8, padding:"8px 12px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ color:"#e63946", fontSize:11 }}>🚫 Out of all suits — no cards left?</span>
                  <button onClick={() => setConfirmRemove(i)} style={{
                    background:"#e63946", border:"none", borderRadius:6, color:"#fff",
                    padding:"4px 10px", cursor:"pointer", fontFamily:"'Georgia',serif", fontSize:11, fontWeight:"bold",
                  }}>Remove Player</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Removed players list */}
      {state.history.filter(h=>h.type==="remove").length > 0 && (
        <div style={{ marginBottom:20 }}>
          <div style={{ color:"#1e3050", fontSize:10, letterSpacing:2, marginBottom:10 }}>REMOVED PLAYERS</div>
          {state.history.filter(h=>h.type==="remove").map(h => (
            <div key={h.id} style={{ background:"#080f1e", border:"1px solid #0e1e2e", borderRadius:8, padding:"8px 14px", marginBottom:6, display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:12 }}>
              <div>
                <span style={{ color:"#e63946" }}>✕ </span>
                <span style={{ color:"#4a6a8a" }}>{h.playerName}</span>
                <span style={{ color:"#1e3050" }}> removed from game</span>
              </div>
              <span style={{ color:"#0e1a28", fontSize:10 }}>{h.ts}</span>
            </div>
          ))}
        </div>
      )}

      {/* Thulla log */}
      {state.thullaLog.length > 0 && (
        <div>
          <div style={{ color:"#1e3050", fontSize:10, letterSpacing:2, marginBottom:10 }}>THULLA LOG</div>
          {state.thullaLog.map(t => {
            const led = SUITS.find(s=>s.key===t.ledSuit);
            const thrown = SUITS.find(s=>s.key===t.thrownSuit);
            return (
              <div key={t.id} style={{ background:"#0a0418", border:"1px solid #e6394618", borderRadius:8, padding:"8px 12px", marginBottom:6, display:"flex", justifyContent:"space-between", fontSize:12 }}>
                <div>
                  <span style={{ color:"#d8ccc0", fontWeight:"bold" }}>{t.playerName}</span>
                  <span style={{ color:"#2a4060" }}> out of </span>
                  <span style={{ color:led.color }}>{led.symbol} {led.label}</span>
                  <span style={{ color:"#2a4060" }}> · threw </span>
                  <span style={{ color:thrown.color }}>{thrown.symbol} {thrown.label}</span>
                </div>
                <span style={{ color:"#0e1e2e", fontSize:10 }}>{t.ts}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── ADVISOR TAB ─────────────────────────────────────────────────────────────
function AdvisorTab() {
  const { state } = useContext(GameContext);
  const [selPlayer, setSelPlayer] = useState(0);
  const n = state.players.length;

  const stats = SUITS.map(suit => {
    const s = state.suits[suit.key];
    const r = rem(s); const p = pct(s);
    const out = state.players.filter(i => !state.playerStatus[i][suit.key]).length;
    const danger = (1-p)*0.6 + (out/n)*0.4;
    return { ...suit, r, p, out, inCount:n-out, danger };
  });

  const bestLead = [...stats].sort((a,b) => (b.p*0.5 + (1-b.out/n)*0.5) - (a.p*0.5 + (1-a.out/n)*0.5))[0];
  const worstLead = [...stats].sort((a,b) => b.danger - a.danger)[0];

  const adv = state.players.map(i => {
    const missing = SUITS.filter(s => !state.playerStatus[i][s.key]);
    const risk = missing.length===0?"low":missing.length===1?"medium":"high";
    return { i, name:state.playerNames[i], missing, risk };
  });
  const sel = adv.find(a=>a.i===selPlayer);
  const rc = {low:"#4ade80",medium:"#f59e0b",high:"#e63946"};

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* Top 2 cards */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div style={{ background:"#081a0a", border:"1px solid #4ade8022", borderRadius:12, padding:"14px 16px" }}>
          <div style={{ color:"#4ade80", fontSize:9, letterSpacing:2, marginBottom:8 }}>✅ LEAD THIS</div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:28, color:bestLead.color }}>{bestLead.symbol}</span>
            <div>
              <div style={{ color:"#d8ccc0", fontWeight:"bold" }}>{bestLead.label}</div>
              <div style={{ color:"#2a4060", fontSize:11 }}>{bestLead.r} left · {bestLead.out} out</div>
            </div>
          </div>
        </div>
        <div style={{ background:"#1a0808", border:"1px solid #e6394622", borderRadius:12, padding:"14px 16px" }}>
          <div style={{ color:"#e63946", fontSize:9, letterSpacing:2, marginBottom:8 }}>⚠ AVOID</div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:28, color:worstLead.color }}>{worstLead.symbol}</span>
            <div>
              <div style={{ color:"#d8ccc0", fontWeight:"bold" }}>{worstLead.label}</div>
              <div style={{ color:"#3a1a1a", fontSize:11 }}>{worstLead.r} left · {worstLead.out} out</div>
            </div>
          </div>
        </div>
      </div>

      {/* Threat meter */}
      <div style={{ background:"#0d1e33", border:"1px solid #c9a84c18", borderRadius:12, padding:"14px 16px" }}>
        <div style={{ color:"#2a4060", fontSize:9, letterSpacing:2, marginBottom:12 }}>THREAT LEVEL</div>
        {[...stats].sort((a,b)=>b.danger-a.danger).map((s,rank) => {
          const t = Math.round(s.danger*100);
          const tc = t>60?"#e63946":t>35?"#f59e0b":"#4ade80";
          return (
            <div key={s.key} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
              <span style={{ color:"#1e3050", fontSize:10, width:16 }}>#{rank+1}</span>
              <span style={{ color:s.color, fontSize:18, width:20 }}>{s.symbol}</span>
              <span style={{ color:"#4a6a8a", fontSize:12, width:64 }}>{s.label}</span>
              <div style={{ flex:1, background:"#060d18", borderRadius:4, height:8, overflow:"hidden" }}>
                <div style={{ height:"100%", borderRadius:4, width:`${t}%`, background:`linear-gradient(90deg,${tc}55,${tc})`, transition:"width 0.4s" }}/>
              </div>
              <span style={{ color:tc, fontSize:12, fontWeight:"bold", width:32, textAlign:"right" }}>{t}%</span>
            </div>
          );
        })}
      </div>

      {/* Per-player */}
      <div style={{ background:"#0d1e33", border:"1px solid #c9a84c18", borderRadius:12, padding:"14px 16px" }}>
        <div style={{ color:"#2a4060", fontSize:9, letterSpacing:2, marginBottom:12 }}>PLAYER INTEL</div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
          {state.players.map(i => (
            <button key={i} onClick={() => setSelPlayer(i)} style={{
              background: selPlayer===i?"linear-gradient(135deg,#c9a84c,#9a6e20)":"#060d18",
              color: selPlayer===i?"#060d18":"#4a6a8a",
              border:`1px solid ${selPlayer===i?"#c9a84c":"#0e1e2e"}`,
              borderRadius:8, padding:"7px 14px", cursor:"pointer",
              fontFamily:"'Georgia',serif", fontSize:12, fontWeight: selPlayer===i?"bold":"normal",
            }}>{state.playerNames[i]}</button>
          ))}
        </div>
        {sel && (
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
              <div style={{ background: sel.risk==="low"?"#081a0a":sel.risk==="medium"?"#1a1208":"#1a0808", border:`1px solid ${rc[sel.risk]}33`, borderRadius:8, padding:"5px 12px", color:rc[sel.risk], fontSize:11, fontWeight:"bold" }}>
                {sel.risk==="low"?"🟢 SAFE":sel.risk==="medium"?"🟡 WATCH":"🔴 DANGER"}
              </div>
              <span style={{ color:"#2a4060", fontSize:11 }}>
                {sel.missing.length===0?"Has all suits":sel.missing.length===1?`Out of ${sel.missing[0].label}`:`Out of ${sel.missing.length} suits`}
              </span>
            </div>
            {sel.missing.length > 0 && (
              <div>
                <div style={{ color:"#2a4060", fontSize:10, letterSpacing:1, marginBottom:8 }}>EXPLOIT — LEAD THESE:</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {sel.missing.map(s => (
                    <div key={s.key} style={{ background:`${s.color}0f`, border:`2px solid ${s.color}55`, borderRadius:10, padding:"10px 16px", display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:22, color:s.color }}>{s.symbol}</span>
                      <div>
                        <div style={{ color:s.color, fontWeight:"bold", fontSize:13 }}>{s.label}</div>
                        <div style={{ color:"#3a1a1a", fontSize:10 }}>They will Thulla</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {sel.missing.length === 0 && (
              <div style={{ color:"#1e3050", fontSize:12, lineHeight:1.7 }}>
                No Thullas recorded yet. Watch this player — lead risky suits to reveal their weak cards.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const lbl = { display:"block", color:"#2a4060", fontSize:10, letterSpacing:2, marginBottom:10, fontFamily:"'Georgia',serif" };
const hdrBtn = c => ({ background:"transparent", border:`1px solid ${c}33`, color:c, borderRadius:8, padding:"7px 12px", cursor:"pointer", fontSize:15, fontFamily:"'Georgia',serif" });
const actionBtn = { width:"100%", padding:"12px", background:"linear-gradient(135deg,#c9a84c,#9a6e20)", color:"#060d18", border:"none", borderRadius:10, fontWeight:"bold", fontSize:14, cursor:"pointer", fontFamily:"'Georgia',serif" };

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [gameConfig, setGameConfig] = useState(null);
  const [gameState, gameDispatch] = useReducer((s,a) => {
    if (a.type==="__INIT__") return a.payload;
    return reducer(s,a);
  }, null);

  useEffect(() => {
    document.documentElement.style.cssText = "margin:0;padding:0;width:100%;";
    document.body.style.cssText = "margin:0;padding:0;width:100%;background:#060d18;";
    const r = document.getElementById("root");
    if (r) r.style.cssText = "width:100%;";
  }, []);

  const handleStart = useCallback(config => {
    gameDispatch({ type:"__INIT__", payload:buildInitialState(config) });
    setGameConfig(config);
  }, []);

  if (!gameConfig || !gameState) return <SetupPage onStart={handleStart} />;

  return (
    <GameContext.Provider value={{ state:gameState, dispatch:gameDispatch }}>
      <Dashboard onReset={() => { setGameConfig(null); gameDispatch({ type:"__INIT__", payload:null }); }} />
    </GameContext.Provider>
  );
}