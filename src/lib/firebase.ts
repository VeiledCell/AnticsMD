import { initializeApp, getApps } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc, increment } from "firebase/firestore";

// ... config same

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
