// components/LeaderboardModal.jsx
import React, { useEffect, useState } from "react";
import { getLeaderboard } from "../services/firebaseService";

const MEDAL = ["🥇", "🥈", "🥉"];

export default function LeaderboardModal({ currentUser, onClose }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard(15)
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 flex flex-col"
        style={{
          background: "linear-gradient(145deg, #0f172a, #1e1b4b)",
          boxShadow: "0 0 60px #6366f133",
          maxHeight: "85vh",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <h2 className="text-xl font-black bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            🏆 Leaderboard
          </h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white text-xl transition"
          >
            ✕
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <p className="text-center text-white/40 py-12">
              No scores yet. Be the first! 🔥
            </p>
          ) : (
            entries.map((e) => {
              const isMe = currentUser && e.uid === currentUser.uid;
              return (
                <div
                  key={e.uid}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition ${
                    isMe
                      ? "bg-cyan-500/20 border border-cyan-400/40"
                      : "bg-white/5 hover:bg-white/10"
                  }`}
                >
                  {/* Rank */}
                  <div className="w-8 text-center font-black text-sm">
                    {e.rank <= 3 ? MEDAL[e.rank - 1] : (
                      <span className="text-white/40">#{e.rank}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  {e.photoURL ? (
                    <img
                      src={e.photoURL}
                      alt={e.displayName}
                      className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                      onError={(ev) => { ev.target.style.display = "none"; }}
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {(e.displayName?.[0] || "?").toUpperCase()}
                    </div>
                  )}

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">
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
                      className={`text-lg font-black ${
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
                    <div className="text-white/30 text-xs">pts</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-6 py-4 border-t border-white/10 text-center text-white/30 text-xs">
          Top 15 players worldwide
        </div>
      </div>
    </div>
  );
}