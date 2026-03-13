import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB957D_M3lmEZhsjVpRGx9aDj7cUa9CuB4",
  authDomain: "desiclash-89075.firebaseapp.com",
  projectId: "desiclash-89075",
  storageBucket: "desiclash-89075.firebasestorage.app",
  messagingSenderId: "502006970895",
  appId: "1:502006970895:web:eb2864b28ff0bde5ba017a",
  measurementId: "G-VH2JJNT3ZB"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();