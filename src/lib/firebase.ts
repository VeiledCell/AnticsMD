import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore, Firestore, doc, setDoc, getDoc, updateDoc, increment } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// Initialize Firebase only if we have an API key (prevents build-time crashes)
if (process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);

  if (typeof window !== "undefined") {
    setPersistence(auth, browserLocalPersistence);
  }
} else {
  // Mock objects for build time
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
}

export const saveGameStats = async (uid: string, stats: { xp: number, score: number, correct: boolean }) => {
  if (!db || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return;
  
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
