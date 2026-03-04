import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchIndianChannels, fetchChannelDetails } from './services/youtube';
import ChannelCard from './components/ChannelCard';

// Audio Links (Royalty Free)
const SOUNDS = {
  correct: new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'),
  wrong: new Audio('https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3'),
  click: new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'),
};

export default function App() {
  const [channels, setChannels] = useState({ left: null, right: null });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [status, setStatus] = useState('loading'); // loading, playing, revealed
  const [result, setResult] = useState(null); // 'win' or 'lose'
  const pool = useRef([]);

  const playSound = (type) => {
    SOUNDS[type].currentTime = 0;
    SOUNDS[type].play().catch(() => {}); // Catch browser auto-play block
  };

  const loadRound = useCallback(async (winner = null) => {
    setStatus('loading');
    if (pool.current.length < 5) {
      pool.current = await fetchIndianChannels();
    }

    const getOne = () => pool.current.splice(Math.floor(Math.random() * pool.current.length), 1)[0];

    try {
      const left = winner ? winner : await fetchChannelDetails(getOne());
      const right = await fetchChannelDetails(getOne());
      setChannels({ left, right });
      setStatus('playing');
      setResult(null);
    } catch (e) {
      console.error("Failed to load round");
    }
  }, []);

  useEffect(() => {
    loadRound();
    setHighScore(parseInt(localStorage.getItem('indHighScore') || '0'));
  }, [loadRound]);

  const handleChoice = (choice) => {
    if (status !== 'playing') return;
    playSound('click');

    const isLeftWin = channels.left.subs >= channels.right.subs;
    const isCorrect = (choice === 'left' && isLeftWin) || (choice === 'right' && !isLeftWin);

    setStatus('revealed');
    if (isCorrect) {
      setResult('win');
      playSound('correct');
      const newScore = score + 1;
      setScore(newScore);
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('indHighScore', newScore.toString());
      }
    } else {
      setResult('lose');
      playSound('wrong');
    }
  };

  if (status === 'loading' && !channels.left) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-cyan-500 font-black tracking-widest animate-pulse">LOADING INDIAN CHANNELS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <nav className="p-6 flex justify-between items-center border-b border-white/5 bg-slate-900/50 backdrop-blur-xl">
        <h1 className="text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">
          DESI CLASH
        </h1>
        <div className="flex gap-4 font-black text-xs md:text-sm">
          <div className="bg-white/5 px-4 py-2 rounded-full border border-white/10">SCORE: <span className="text-cyan-400">{score}</span></div>
          <div className="bg-white/5 px-4 py-2 rounded-full border border-white/10 text-amber-400">BEST: {highScore}</div>
        </div>
      </nav>

      {/* Arena */}
      <main className="flex-grow flex flex-col items-center justify-center p-4 max-w-6xl mx-auto w-full">
        <h2 className="text-xl md:text-3xl font-black mb-8 uppercase tracking-tighter text-center italic">
          Who is <span className="text-fuchsia-500">Bigger</span> on YouTube?
        </h2>

        <div className="flex flex-row items-stretch justify-center gap-3 md:gap-10 w-full relative">
          <ChannelCard 
            side="left"
            channel={channels.left} 
            isRevealed={status === 'revealed'} 
            onClick={() => handleChoice('left')}
            disabled={status !== 'playing'}
          />

          <div className="flex items-center justify-center relative z-10">
            <div className="w-12 h-12 md:w-20 md:h-20 rounded-full bg-slate-950 border-2 border-white/20 flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)]">
              <span className="text-lg md:text-3xl font-black italic text-white/40">VS</span>
            </div>
          </div>

          <ChannelCard 
            side="right"
            channel={channels.right} 
            isRevealed={status === 'revealed'} 
            onClick={() => handleChoice('right')}
            disabled={status !== 'playing'}
          />
        </div>

        {/* Results Overlay */}
        <div className="mt-12 h-32 flex flex-col items-center justify-center">
          {status === 'revealed' && (
            <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in slide-in-from-bottom-4 duration-500">
              <div className={`text-4xl md:text-6xl font-black uppercase italic tracking-tighter ${result === 'win' ? 'text-green-400' : 'text-red-500'}`}>
                {result === 'win' ? 'Shandaar! 🔥' : 'Game Over 💀'}
              </div>
              <button
                onClick={() => result === 'win' ? loadRound(channels.right) : (setScore(0), loadRound())}
                className="px-12 py-4 bg-white text-black font-black rounded-full hover:scale-110 active:scale-95 transition-all uppercase tracking-widest text-sm shadow-[0_0_40px_rgba(255,255,255,0.2)]"
              >
                {result === 'win' ? 'Next Round ➔' : 'Try Again'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}