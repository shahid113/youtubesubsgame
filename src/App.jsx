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

      <main className="flex-1 flex flex-col items-center px-4 py-6">

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
            height: "1080px",
            position: "relative",
            background:
              "linear-gradient(135deg,#020617,#0f172a,#020617)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontFamily: "Inter, sans-serif",
            overflow: "hidden"
          }}
        >

          {/* background logos */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.15,
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: "40px",
              padding: "60px"
            }}
          >
            {[channels.left?.image, channels.right?.image]
              .concat(pool.current.slice(0, 6).map(c => c.image))
              .map((img, i) => (
                <img
                  key={i}
                  src={img}
                  style={{
                    width: "140px",
                    height: "140px",
                    borderRadius: "50%",
                    objectFit: "cover"
                  }}
                />
              ))}
          </div>

          {/* game title */}
          <div style={{ fontSize: "70px", fontWeight: "900" }}>
            🔥 DESI CLASH
          </div>

          {/* text */}
          <div style={{ marginTop: "40px", fontSize: "36px", opacity: .8 }}>
            My Score
          </div>

          {/* big score */}
          <div
            style={{
              fontSize: "180px",
              fontWeight: "900",
              margin: "20px 0",
              color: "#22c55e"
            }}
          >
            {highScore}
          </div>

          {/* challenge text */}
          <div style={{ fontSize: "40px", marginTop: "20px" }}>
            Can you beat me?
          </div>

          {/* URL */}
          <div
            style={{
              position: "absolute",
              bottom: "40px",
              fontSize: "26px",
              opacity: .7
            }}
          >
            {window.location.href}
          </div>

        </div>
      </div>

    </div>
  );
}