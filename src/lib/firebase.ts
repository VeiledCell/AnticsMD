import { initializeApp, getApps } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc, increment } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

// Set persistence to allow cross-subdomain SSO if needed
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence);
}

export const saveGameStats = async (uid: string, stats: { xp: number, score: number, correct: boolean }) => {
  const statsRef = doc(db, "game_stats", uid);
  const docSnap = await getDoc(statsRef);

  if (!docSnap.exists()) {
    await setDoc(statsRef, {
      uid,
      xp: stats.xp,
      score: stats.score,
      level: 1,
      wardMetrics: {
        patientsSeen: 1,
        correctDiagnoses: stats.correct ? 1 : 0,
        misdiagnoses: stats.correct ? 0 : 1,
        efficiencyRating: 100
      },
      lastActive: new Date().toISOString()
    });
  } else {
    await updateDoc(statsRef, {
      xp: increment(stats.xp),
      score: increment(stats.score),
      "wardMetrics.patientsSeen": increment(1),
      "wardMetrics.correctDiagnoses": increment(stats.correct ? 1 : 0),
      "wardMetrics.misdiagnoses": increment(stats.correct ? 0 : 1),
      lastActive: new Date().toISOString()
    });
  }
};

export { auth, db };
