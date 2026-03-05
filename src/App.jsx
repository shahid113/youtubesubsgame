import React, { useState, useEffect, useCallback, useRef } from "react";
import { fetchIndianChannels, fetchChannelDetails } from "./services/youtube";
import ChannelCard from "./components/ChannelCard";
import html2canvas from "html2canvas";

const SOUNDS = {
  correct: new Audio("https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3"),
  wrong: new Audio("https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3"),
  click: new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3"),
};

export default function App() {
  const [channels, setChannels] = useState({ left: null, right: null });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [status, setStatus] = useState("loading");
  const [result, setResult] = useState(null);

  const pool = useRef([]);
  const shareRef = useRef(null);

  const playSound = (type) => {
    try {
      SOUNDS[type].currentTime = 0;
      SOUNDS[type].play();
    } catch { }
  };

  // Generate share image
  const generateShareImage = async () => {
    const canvas = await html2canvas(shareRef.current, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#0f172a",
      logging: false
    });

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      });
    });
  };

  // Share function
  const shareScore = async () => {
    const blob = await generateShareImage();
    const file = new File([blob], "desi-clash-score.png", { type: "image/png" });

    const text = `🔥 I scored ${highScore} in DESI CLASH!\nCan you beat me? ${window.location.href}`;

    // Mobile share
    if (navigator.share) {
      try {
        await navigator.share({
          text,
          files: [file],
          title: "DESI CLASH",
        });
        return;
      } catch { }
    }

    // Fallback
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "desi-clash-score.png";
    link.click();
  };

  const loadRound = useCallback(async (winner = null) => {
    setStatus("loading");

    if (pool.current.length < 5) {
      pool.current = await fetchIndianChannels();
    }

    const getOne = () =>
      pool.current.splice(Math.floor(Math.random() * pool.current.length), 1)[0];

    try {
      const left = winner ? winner : await fetchChannelDetails(getOne());
      const right = await fetchChannelDetails(getOne());

      setChannels({ left, right });
      setStatus("playing");
      setResult(null);
    } catch {
      console.error("Error loading round");
    }
  }, []);

  useEffect(() => {
    loadRound();
    setHighScore(parseInt(localStorage.getItem("indHighScore") || "0"));
  }, [loadRound]);

  const handleChoice = (choice) => {
    if (status !== "playing") return;

    playSound("click");

    const isLeftWin = channels.left.subs >= channels.right.subs;
    const correct =
      (choice === "left" && isLeftWin) || (choice === "right" && !isLeftWin);

    setStatus("revealed");

    if (correct) {
      playSound("correct");
      const newScore = score + 1;
      setScore(newScore);
      setResult("win");

      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem("indHighScore", newScore);
      }
    } else {
      playSound("wrong");
      setResult("lose");
    }
  };

  if (status === "loading" && !channels.left) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-cyan-400 font-bold">Loading Indian Creators...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col">

      {/* HEADER */}

      <nav className="flex justify-between items-center px-4 py-4 md:px-8 border-b border-white/10 backdrop-blur bg-black/30">
        <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-cyan-400 to-fuchsia-500 bg-clip-text text-transparent">
          DESI CLASH
        </h1>

        <div className="flex gap-2 md:gap-4 text-xs md:text-sm font-bold">
          <div className="bg-white/10 px-3 py-1 rounded-full">
            Score: <span className="text-cyan-400">{score}</span>
          </div>

          <div className="bg-white/10 px-3 py-1 rounded-full">
            Best: <span className="text-yellow-400">{highScore}</span>
          </div>
        </div>
      </nav>

      {/* GAME */}

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6">

        <h2 className="text-lg md:text-3xl font-black mb-6 text-center">
          Who has more subscribers?
        </h2>

        <div className="w-full max-w-6xl grid grid-cols-2 gap-4 md:gap-8 items-center">

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

        {/* RESULT */}

        {status === "revealed" && (
          <div className="mt-10 flex flex-col items-center gap-6">

            <div
              className={`text-3xl md:text-5xl font-black ${result === "win" ? "text-green-400" : "text-red-500"
                }`}
            >
              {result === "win" ? "Correct 🔥" : "Game Over 💀"}
            </div>

            {result === "lose" && (
              <button
                onClick={shareScore}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-full font-bold hover:scale-105 transition"
              >
                Share Score 🚀
              </button>
            )}

            <button
              onClick={() =>
                result === "win"
                  ? loadRound(channels.right)
                  : (setScore(0), loadRound())
              }
              className="px-10 py-3 bg-white text-black rounded-full font-bold hover:scale-105 transition"
            >
              {result === "win" ? "Next Round" : "Play Again"}
            </button>
          </div>
        )}
      </main>

      {/* SHARE IMAGE TEMPLATE */}
      <div className="absolute -left-[9999px]">
        <div
          ref={shareRef}
          style={{
            width: "1080px",
            height: "1920px",
            position: "relative",
            background: "linear-gradient(135deg, #020617 60%, #f0abfc 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Inter', system-ui, sans-serif",
            overflow: "hidden"
          }}
        >
          {/* Modern Mesh Gradient Background */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 20% 10%, #4f46e5 0%, transparent 60%), radial-gradient(circle at 80% 90%, #ec4899 0%, transparent 60%), radial-gradient(circle at 80% 10%, #06b6d4 0%, transparent 60%)",
            opacity: 0.5
          }} />

          {/* Floating Avatar Grid - Modernized */}
          <div style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "40px",
            padding: "120px",
            opacity: 0.18,
            filter: "grayscale(100%) blur(3px)"
          }}>
            {[...Array(16)].map((_, i) => {
              const img = [channels.left?.image, channels.right?.image, ...pool.current.map(c => c.image)][i % 8];
              return <img key={i} src={img} style={{ width: "160px", height: "160px", borderRadius: "48px", objectFit: "cover", border: "4px solid #fff2" }} />;
            })}
          </div>

          {/* Main Content Card - Glassmorphism & Shadow */}
          <div style={{
            position: "relative",
            width: "900px",
            padding: "90px 60px",
            background: "rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(32px)",
            borderRadius: "96px",
            border: "2px solid rgba(255, 255, 255, 0.12)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            boxShadow: "0 40px 80px -20px rgba(0, 0, 0, 0.6)"
          }}>
            {/* Badge */}
            <div style={{
              background: "linear-gradient(90deg,#34d399 0%,#f472b6 100%)",
              color: "#fff",
              padding: "18px 48px",
              borderRadius: "100px",
              fontSize: "38px",
              fontWeight: "800",
              letterSpacing: "2px",
              marginBottom: "48px",
              border: "2px solid rgba(255,255,255,0.2)",
              boxShadow: "0 4px 24px #f472b6a0"
            }}>
              NEW HIGH SCORE
            </div>

            <div style={{ fontSize: "56px", fontWeight: "500", opacity: 0.8, marginBottom: "16px", color: "#fff" }}>
              I just scored
            </div>

            {/* Big Score with Gradient Text */}
            <div style={{
              fontSize: "300px",
              fontWeight: "900",
              lineHeight: "0.9",
              background: "linear-gradient(180deg, #fff 0%, #f0abfc 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 12px 32px rgba(0,0,0,0.35))"
            }}>
              {highScore}
            </div>

            <div style={{ fontSize: "54px", fontWeight: "700", marginTop: "48px", color: "#fff" }}>
              on <span style={{ color: "#ec4899", fontWeight: "900" }}>DESI CLASH</span>
            </div>
          </div>

          {/* CTA Section - Modern Button */}
          <div style={{ marginTop: "96px", textAlign: "center", zIndex: 10 }}>
            <div style={{
              padding: "36px 100px",
              background: "linear-gradient(90deg,#f472b6 0%,#34d399 100%)",
              color: "white",
              borderRadius: "120px",
              fontSize: "48px",
              fontWeight: "900",
              boxShadow: "0 12px 36px rgba(244,114,182,0.2), 0 2px 8px #34d39980"
            }}>
              PLAY & BEAT ME
            </div>

            <div style={{
              marginTop: "48px",
              fontSize: "32px",
              fontWeight: "600",
              opacity: 0.6,
              letterSpacing: "2px",
              color: "#fff"
            }}>
              {window.location.hostname}
            </div>
          </div>

          {/* Decorative Elements - Modern Glow */}
          <div style={{
            position: "absolute",
            bottom: "-120px",
            right: "-120px",
            width: "480px",
            height: "480px",
            background: "#f472b6",
            filter: "blur(140px)",
            borderRadius: "50%",
            opacity: 0.35
          }} />
        </div>
      </div>

    </div>
  );
}