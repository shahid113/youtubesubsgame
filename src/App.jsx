// App.jsx — DESI CLASH with Firebase Auth + Firestore
import React, { useState, useEffect, useCallback, useRef } from "react";
import { fetchIndianChannels, fetchChannelDetails } from "./services/youtube";
import ChannelCard from "./components/ChannelCard";
import AuthModal from "./components/AuthModal";
import LeaderboardModal from "./components/LeaderboardModal";
import UserMenu from "./components/UserMenu";
import html2canvas from "html2canvas";

import {
  onAuthChange,
  createOrUpdateUser,
  getUserProfile,
  saveScore,
} from "./services/firebaseService";

// ─── Sounds ──────────────────────────────────────────────────────────────────
const SOUNDS = {
  correct: new Audio("https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3"),
  wrong: new Audio("https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3"),
  click: new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3"),
};

const playSound = (type) => {
  try { SOUNDS[type].currentTime = 0; SOUNDS[type].play(); } catch { }
};

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  // Game state
  const [channels, setChannels] = useState({ left: null, right: null });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [status, setStatus] = useState("loading"); // loading | playing | revealed | maintenance
  const [result, setResult] = useState(null);      // win | lose

  // Auth / profile state
  const [user, setUser] = useState(undefined);  // undefined = still loading
  const [profile, setProfile] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showBoard, setShowBoard] = useState(false);
  const [savingScore, setSavingScore] = useState(false);
  const [newBestAlert, setNewBestAlert] = useState(false);

  const pool = useRef([]);
  const shareRef = useRef(null);

  // ── Auth listener ──────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthChange(async (u) => {
      setUser(u);
      if (u) {
        await createOrUpdateUser(u);
        const p = await getUserProfile(u.uid);
        setProfile(p);
        // Show Firebase best score for logged-in user
        setHighScore(p?.highScore || 0);
      } else {
        // When logged out: show 0 (no best score without account)
        setProfile(null);
        setHighScore(0);
      }
    });
    return unsub;
  }, []);

  // ── Round loader ───────────────────────────────────────────────────────────
  const loadRound = useCallback(async (winner = null) => {
    setStatus("loading");
    try {
      if (pool.current.length < 5) {
        pool.current = await fetchIndianChannels();
        if (!pool.current?.length) { setStatus("maintenance"); return; }
      }

      const getOne = () =>
        pool.current.splice(Math.floor(Math.random() * pool.current.length), 1)[0];

      const left = winner ? winner : await fetchChannelDetails(getOne());
      const right = await fetchChannelDetails(getOne());

      setChannels({ left, right });
      setStatus("playing");
      setResult(null);
    } catch (err) {
      console.error(err);
      setStatus("maintenance");
    }
  }, []);

  useEffect(() => { loadRound(); }, [loadRound]);

  // ── Handle choice ──────────────────────────────────────────────────────────
  const handleChoice = (choice) => {
    if (status !== "playing") return;
    playSound("click");

    const isLeftWin = channels.left.subs >= channels.right.subs;
    const correct = (choice === "left" && isLeftWin) || (choice === "right" && !isLeftWin);

    setStatus("revealed");

    if (correct) {
      playSound("correct");
      const newScore = score + 1;
      setScore(newScore);
      setResult("win");

      // Update high-score if new score beats current best
      if (newScore > highScore) {
        setHighScore(newScore);
      }
    } else {
      playSound("wrong");
      setResult("lose");
      handleGameOver(score);
    }
  };

  // ── Game over: persist score ───────────────────────────────────────────────
  const handleGameOver = async (finalScore) => {
    if (!finalScore) return; // score 0 → nothing to save
    if (!user || user.isAnonymous) return; // guests don't save

    setSavingScore(true);
    try {
      const { isNewBest, highScore: savedBest } = await saveScore(user, finalScore);
      if (isNewBest) {
        setHighScore(savedBest);
        setNewBestAlert(true);
        setTimeout(() => setNewBestAlert(false), 3000);
        // Refresh profile
        const p = await getUserProfile(user.uid);
        setProfile(p);
      }
    } catch (e) {
      console.error("Score save failed:", e);
    } finally {
      setSavingScore(false);
    }
  };

  // ── Share image ────────────────────────────────────────────────────────────
  const generateShareImage = async () => {
    const canvas = await html2canvas(shareRef.current, {
      scale: 3, useCORS: true, backgroundColor: "#0f172a", logging: false,
    });
    return new Promise((res) => canvas.toBlob(res));
  };

  const shareScore = async () => {
    const blob = await generateShareImage();
    const file = new File([blob], "desi-clash-score.png", { type: "image/png" });

    // Share saved best score if logged in, otherwise current game score
    const scoreToShare = user && !user.isAnonymous ? highScore : score;
    const text = `🔥 I scored ${scoreToShare} in DESI CLASH!\nCan you beat me? ${window.location.href}`;

    if (navigator.share) {
      try { await navigator.share({ text, files: [file], title: "DESI CLASH" }); return; }
      catch { }
    }
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), { href: url, download: "desi-clash-score.png" }).click();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render guards
  if (status === "maintenance") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] text-white text-center px-6">
        <div className="text-5xl mb-6">🚧</div>
        <h1 className="text-3xl md:text-4xl font-black mb-4 bg-gradient-to-r from-yellow-400 to-red-500 bg-clip-text text-transparent">
          Site Under Maintenance
        </h1>
        <p className="text-white/70 max-w-lg mb-6">The game will be available again soon.</p>
        <div className="text-sm text-white/40">Please come back later 🙏</div>
      </div>
    );
  }

  if (status === "loading" && !channels.left) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-cyan-400 font-bold">Loading Creators...</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <nav className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 px-3 sm:px-4 py-3 sm:py-4 md:px-8 border-b border-white/10 backdrop-blur bg-black/30 z-10">
        <h1 className="text-lg sm:text-xl md:text-2xl font-black bg-gradient-to-r from-cyan-400 to-fuchsia-500 bg-clip-text text-transparent">
          DESI CLASH
        </h1>

        <div className="flex flex-wrap gap-2 items-center text-xs sm:text-sm font-bold w-full sm:w-auto">
          <div className="bg-white/10 px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-xs whitespace-nowrap">
            Score: <span className="text-cyan-400">{score}</span>
          </div>
          <div className="bg-white/10 px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-xs whitespace-nowrap">
            Best: <span className="text-yellow-400">{highScore}</span>
          </div>

          {/* Leaderboard button (always visible) */}
          <button
            onClick={() => setShowBoard(true)}
            className="bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 px-2.5 sm:px-3 py-1 rounded-full transition text-yellow-400 text-xs font-bold"
          >
            🏆
          </button>

          {/* Auth area */}
          {user === undefined ? (
            <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          ) : user ? (
            <UserMenu
              user={user}
              profile={profile}
              onOpenLeaderboard={() => setShowBoard(true)}
            />
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="bg-gradient-to-r from-cyan-500 to-fuchsia-600 px-3 sm:px-4 py-1.5 rounded-full font-bold text-xs hover:scale-105 transition"
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* ── NEW BEST TOAST ──────────────────────────────────────────────────── */}
      {newBestAlert && (
        <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full font-black text-xs sm:text-sm shadow-lg animate-bounce">
          🎉 New Personal Best! Saved to leaderboard!
        </div>
      )}

      {/* ── GUEST NUDGE (shown after game over for anonymous users) ─────────── */}
      {result === "lose" && user?.isAnonymous && (
        <div className="mx-auto mt-3 sm:mt-4 max-w-xs sm:max-w-sm px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-center text-xs sm:text-sm text-yellow-300">
          🔑 <button className="underline font-bold hover:text-yellow-200 transition" onClick={() => setShowAuth(true)}>Sign in</button> to save your score & compete on the leaderboard!
        </div>
      )}

      {/* ── SAVING INDICATOR ───────────────────────────────────────────────── */}
      {savingScore && (
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 bg-white/10 backdrop-blur px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm flex items-center gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          Saving score…
        </div>
      )}

      {/* ── GAME ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center px-3 sm:px-4 py-6 sm:py-10 md:px-6">
        <h2 className="text-base sm:text-lg md:text-3xl font-black mb-4 sm:mb-6 text-center">
          Who has more subscribers?
        </h2>

        {/* Responsive Layout */}
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 items-center">
          <ChannelCard
            side="left"
            channel={channels.left}
            isRevealed={status === "revealed"}
            onClick={() => handleChoice("left")}
            disabled={status !== "playing"}
          />

          <ChannelCard
            side="right"
            channel={channels.right}
            isRevealed={status === "revealed"}
            onClick={() => handleChoice("right")}
            disabled={status !== "playing"}
          />
        </div>

        {/* ── RESULT ─────────────────────────────────────────────────────── */}
        {status === "revealed" && (
          <div className="mt-6 sm:mt-10 flex flex-col items-center gap-3 sm:gap-6">
            <div
              className={`text-2xl sm:text-3xl md:text-5xl font-black ${result === "win" ? "text-green-400" : "text-red-500"
                }`}
            >
              {result === "win" ? "Correct 🔥" : "Game Over 💀"}
            </div>

            {result === "lose" && (
              <button
                onClick={shareScore}
                className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full font-bold hover:scale-105 transition shadow-md text-sm sm:text-base"
              >
                <WhatsAppIcon />
                Share Score
              </button>
            )}

            <button
              onClick={() =>
                result === "win"
                  ? loadRound(channels.right)
                  : (setScore(0), loadRound())
              }
              className="px-6 sm:px-10 py-2 sm:py-3 bg-white text-black rounded-full font-bold hover:scale-105 transition text-sm sm:text-base"
            >
              {result === "win" ? "Next Round" : "Play Again"}
            </button>
          </div>
        )}
      </main>

      {/* ── MODALS ─────────────────────────────────────────────────────────── */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showBoard && (
        <LeaderboardModal currentUser={user} onClose={() => setShowBoard(false)} />
      )}

      {/* ── SHARE IMAGE TEMPLATE ───────────────────────────────────────────── */}
      <div className="absolute -left-[9999px]">
        <div
          ref={shareRef}
          style={{
            width: "1080px", height: "1080px", position: "relative",
            background: "linear-gradient(135deg,#020617,#0f172a,#020617)",
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", color: "white",
            fontFamily: "Inter, sans-serif", overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", inset: 0, opacity: 0.15, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "40px", padding: "60px" }}>
            {[channels.left?.image, channels.right?.image]
              .concat(pool.current.slice(0, 6).map((c) => c.image))
              .map((img, i) => (
                <img key={i} src={img} style={{ width: "140px", height: "140px", borderRadius: "50%", objectFit: "cover" }} />
              ))}
          </div>
          <div style={{ fontSize: "70px", fontWeight: "900" }}>🔥 DESI CLASH</div>
          <div style={{ marginTop: "40px", fontSize: "36px", opacity: 0.8 }}>My Score</div>
          <div style={{ fontSize: "180px", fontWeight: "900", margin: "20px 0", color: "#22c55e" }}>
            {user && !user.isAnonymous ? highScore : score}
          </div>
          <div style={{ fontSize: "40px", marginTop: "20px" }}>Can you beat me?</div>
          <div style={{ position: "absolute", bottom: "40px", fontSize: "26px", opacity: 0.7 }}>{window.location.href}</div>
        </div>
      </div>

    </div>
  );
}

const WhatsAppIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.408.002 12.045a11.815 11.815 0 001.591 5.976L0 24l6.144-1.612a11.833 11.833 0 005.904 1.577h.005c6.632 0 12.042-5.41 12.046-12.048a11.811 11.811 0 00-3.576-8.517z" />
  </svg>
);