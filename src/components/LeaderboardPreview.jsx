// components/LeaderboardPreview.jsx
import React, { useEffect, useState } from "react";
import { getLeaderboard } from "../services/firebaseService";

const MEDAL = ["🥇", "🥈", "🥉"];

export default function LeaderboardPreview({ currentUser }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard(5)
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-2">
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <p className="text-center text-white/40 py-6 text-xs sm:text-sm">
          No scores yet. Sign in and be the first! 🔥
        </p>
      ) : (
        entries.map((e) => {
          const isMe = currentUser && e.uid === currentUser.uid;
          return (
            <div
              key={e.uid}
              className={`flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition ${
                isMe
                  ? "bg-cyan-500/20 border border-cyan-400/40"
                  : "bg-white/5 hover:bg-white/10"
              }`}
            >
              {/* Rank */}
              <div className="w-6 text-center font-black text-xs sm:text-sm">
                {e.rank <= 3 ? MEDAL[e.rank - 1] : (
                  <span className="text-white/40 text-xs">#{e.rank}</span>
                )}
              </div>

              {/* Avatar */}
              {e.photoURL ? (
                <img
                  src={e.photoURL}
                  alt={e.displayName}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0"
                  onError={(ev) => { ev.target.style.display = "none"; }}
                />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {(e.displayName?.[0] || "?").toUpperCase()}
                </div>
              )}

              {/* Name */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs sm:text-sm truncate">
                  {e.displayName}
                  {isMe && (
                    <span className="ml-2 text-xs text-cyan-400 font-normal">
                      (you)
                    </span>
                  )}
                </div>
              </div>

              {/* Score */}
              <div className="text-right">
                <div
                  className={`text-base sm:text-lg font-black ${
                    e.rank === 1
                      ? "text-yellow-400"
                      : e.rank === 2
                      ? "text-gray-300"
                      : e.rank === 3
                      ? "text-amber-600"
                      : "text-white"
                  }`}
                >
                  {e.score}
                </div>
                <div className="text-white/30 text-[10px] sm:text-xs">pts</div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
