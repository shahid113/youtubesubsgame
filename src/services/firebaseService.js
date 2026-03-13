// services/firebaseService.js
import {
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";

// ─── AUTH ───────────────────────────────────────────────────────────────────

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);

export const loginAnonymously = () => signInAnonymously(auth);

export const logout = () => signOut(auth);

export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);

// ─── USER PROFILE ────────────────────────────────────────────────────────────

export const createOrUpdateUser = async (user) => {
  if (!user) return;
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      displayName: user.displayName || "Anonymous",
      photoURL: user.photoURL || null,
      highScore: 0,
      totalGames: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
};

export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
};

// ─── SCORE ───────────────────────────────────────────────────────────────────

/**
 * Called at game-over. Updates user's high score + total games,
 * then writes / updates the leaderboard entry if this is a new personal best.
 */
export const saveScore = async (user, newScore) => {
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  const current = snap.exists() ? snap.data() : {};

  const isNewBest = newScore > (current.highScore || 0);
  const totalGames = (current.totalGames || 0) + 1;

  // Update user profile
  await updateDoc(userRef, {
    highScore: isNewBest ? newScore : current.highScore || 0,
    totalGames,
    updatedAt: serverTimestamp(),
  });

  // Update leaderboard if new best
  if (isNewBest) {
    await setDoc(doc(db, "leaderboard", user.uid), {
      uid: user.uid,
      displayName: user.displayName || "Anonymous",
      photoURL: user.photoURL || null,
      score: newScore,
      updatedAt: serverTimestamp(),
    });
  }

  return { isNewBest, highScore: isNewBest ? newScore : current.highScore };
};

// ─── LEADERBOARD ─────────────────────────────────────────────────────────────

export const getLeaderboard = async (topN = 10) => {
  const q = query(
    collection(db, "leaderboard"),
    orderBy("score", "desc"),
    limit(topN)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d, i) => ({ rank: i + 1, ...d.data() }));
};