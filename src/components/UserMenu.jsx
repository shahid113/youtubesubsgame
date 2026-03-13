// components/UserMenu.jsx
import React, { useState, useRef, useEffect } from "react";
import { logout } from "../services/firebaseService";

export default function UserMenu({ user, profile, onOpenLeaderboard }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isAnon = user?.isAnonymous;
  const name = isAnon ? "Guest" : user?.displayName || "Player";
  const photo = user?.photoURL;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition border border-white/10"
      >
        {photo ? (
          <img src={photo} alt={name} className="w-6 h-6 rounded-full" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center text-xs font-bold">
            {name[0].toUpperCase()}
          </div>
        )}
        <span className="text-xs font-semibold max-w-[80px] truncate">{name}</span>
        <svg
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-white/10 overflow-hidden z-40"
          style={{ background: "#1e1b4b", boxShadow: "0 8px 32px #0008" }}
        >
          {/* Profile info */}
          <div className="px-4 py-3 border-b border-white/10">
            <p className="font-bold text-sm truncate">{name}</p>
            {!isAnon && (
              <p className="text-white/40 text-xs truncate">{user?.email}</p>
            )}
            {isAnon && (
              <p className="text-yellow-400 text-xs">
                Sign in to save scores
              </p>
            )}
          </div>

          {/* Stats */}
          {profile && (
            <div className="flex divide-x divide-white/10 border-b border-white/10">
              <div className="flex-1 px-3 py-2 text-center">
                <div className="text-cyan-400 font-black text-lg">{profile.highScore}</div>
                <div className="text-white/40 text-xs">Best</div>
              </div>
              <div className="flex-1 px-3 py-2 text-center">
                <div className="text-fuchsia-400 font-black text-lg">{profile.totalGames}</div>
                <div className="text-white/40 text-xs">Games</div>
              </div>
            </div>
          )}

          {/* Actions */}
          <button
            onClick={() => { setOpen(false); onOpenLeaderboard(); }}
            className="w-full text-left px-4 py-3 text-sm hover:bg-white/10 transition flex items-center gap-2"
          >
            🏆 Leaderboard
          </button>
          <button
            onClick={() => { setOpen(false); logout(); }}
            className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition flex items-center gap-2"
          >
            🚪 Sign Out
          </button>
        </div>
      )}
    </div>
  );
}