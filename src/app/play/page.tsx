'use client';
export const dynamic = 'force-dynamic';
import dynamicNext from 'next/dynamic';
import { Suspense, useState, useEffect } from 'react';
import { Stethoscope, LogOut, Users, Activity } from 'lucide-react';
import Link from 'next/link';
import { ClinicalVignette } from '@/types';
import { AnimatePresence } from 'framer-motion';
import InterviewMenu from '@/components/InterviewMenu';
import { saveGameStats, auth } from '@/lib/firebase';

// Dynamically import Phaser component as it needs 'window'
const GameCanvas = dynamicNext(() => import('@/components/GameCanvas'), {
  ssr: false,
});

const MOCK_VIGNETTE: ClinicalVignette = {
  id: 'patient-1',
  age: 65,
  gender: 'Male',
  chiefComplaint: 'Shortness of breath and cough',
  hpi: [
    "I've been feeling short of breath for about 3 days now.",
    "The cough is producing some yellowish phlegm.",
    "I've had a bit of a fever and chills as well.",
    "My chest hurts a bit when I take deep breaths."
  ],
  vitals: {
    temp: 101.4,
    hr: 105,
    rr: 24,
    bp: '135/85',
    spo2: 91
  },
  physicalExam: "Dullness to percussion at the right base. Increased tactile fremitus. Crackles heard on auscultation in the right lower lobe.",
  correctDiagnosis: "Community Acquired Pneumonia",
  differential: ["CHF Exacerbation", "Pulmonary Embolism", "Acute Bronchitis"],
  explanation: "Patient presents with classic signs of lobar pneumonia including fever, productive cough, and focal lung exam findings."
};

export default function PlayPage() {
  const [activeVignette, setActiveVignette] = useState<ClinicalVignette | null>(null);
  const [wardFeed, setWardFeed] = useState<Array<{id: string, text: string, type: 'info' | 'success'}>>([]);

  // Listen for custom events from Phaser
  useEffect(() => {
    const handleInteract = (e: any) => {
      console.log('🎉 React caught interaction event:', e.detail);
      setActiveVignette(MOCK_VIGNETTE);
    };

    const handleRemoteUpdate = (e: any) => {
      const remotePlayers = e.detail.players; 
      const localPlayer = e.detail.localPlayer;
      
      const newFeedEntries: any[] = [];
      Object.entries(remotePlayers).forEach(([id, player]: [string, any]) => {
        if (player.status === 'interviewing' || player.status === 'charting') {
          const dist = Math.sqrt(Math.pow(player.x - localPlayer.x, 2) + Math.pow(player.y - localPlayer.y, 2));
          if (dist < 400) { 
            newFeedEntries.push({
              id: `${id}-${Date.now()}`,
              text: `Dr. ${id.substring(0, 4)} is ${player.status === 'interviewing' ? 'interviewing' : 'charting'} a patient nearby...`,
              type: 'info'
            });
          }
        }
      });
      if (newFeedEntries.length > 0) {
        setWardFeed(prev => [...newFeedEntries, ...prev].slice(0, 5));
      }
    };

    const handleAutoUnlock = () => {
      setActiveVignette(null);
    };

    window.addEventListener('phaser-patient-interact', handleInteract);
    window.addEventListener('phaser-remote-update', handleRemoteUpdate);
    window.addEventListener('phaser-patient-autounlock', handleAutoUnlock);
    return () => {
      window.removeEventListener('phaser-patient-interact', handleInteract);
      window.removeEventListener('phaser-remote-update', handleRemoteUpdate);
      window.removeEventListener('phaser-patient-autounlock', handleAutoUnlock);
    };
  }, []);

  const handleClose = () => {
    if (activeVignette) {
      const phaserGame = (window as any).phaserGame;
      const scene = phaserGame?.scene.getScene('WardScene') as any;
      if (scene) scene.unlockPatient(activeVignette.id);
    }
    setActiveVignette(null);
  };

  const handleSubmitDiagnosis = async (diagnosis: string) => {
    if (!activeVignette) return;

    const isCorrect = diagnosis === activeVignette.correctDiagnosis;
    const xpEarned = isCorrect ? 50 : 10;
    const scoreEarned = isCorrect ? 100 : 0;

    const newEntry = {
      id: `system-${Date.now()}`,
      text: isCorrect 
        ? `✅ Success! Patient ${activeVignette.id} diagnosed correctly.` 
        : `📝 Chart submitted for patient ${activeVignette.id}.`,
      type: isCorrect ? 'success' : 'info' as 'success' | 'info'
    };
    setWardFeed(prev => [newEntry, ...prev]);

    if (auth.currentUser) {
      await saveGameStats(auth.currentUser.uid, {
        xp: xpEarned,
        score: scoreEarned,
        correct: isCorrect
      });
    }

    alert(isCorrect ? "✅ Correct Diagnosis! +100 Points" : "❌ Incorrect. Patient transferred.");
    handleClose();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden relative">
      <AnimatePresence>
        {activeVignette && (
          <InterviewMenu 
            vignette={activeVignette} 
            onClose={handleClose}
            onSubmit={handleSubmitDiagnosis}
          />
        )}
      </AnimatePresence>

      {/* Game Header */}
      <header className="h-16 bg-white border-b px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-xl">Antics MD</span>
          </div>
          <div className="h-6 w-px bg-gray-200 mx-2" />
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>Ward Population: 3</span>
            </div>
            <div className="flex items-center gap-1">
              <Activity className="h-4 w-4 text-green-500" />
              <span>Unit Efficiency: 94%</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-blue-50 px-3 py-1 rounded-full text-blue-700 font-medium text-sm">
            Dr. Resident (Level 4)
          </div>
          <Link href="/" className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <LogOut className="h-5 w-5" />
          </Link>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-64 border-r bg-white p-6 overflow-y-auto hidden lg:block">
          <h2 className="font-bold mb-4">Daily Objectives</h2>
          <div className="space-y-4">
            <div className="p-3 border rounded-lg bg-gray-50">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient Rounding</p>
              <p className="text-sm font-medium">Clear 5 ED Boarders</p>
              <div className="mt-2 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-2/5" />
              </div>
            </div>
          </div>
        </aside>

        {/* Center - Phaser Stage */}
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <Suspense fallback={<div className="h-[600px] w-[800px] bg-slate-900 animate-pulse rounded-xl" />}>
            <GameCanvas />
          </Suspense>
        </div>

        {/* Right Sidebar - Feed */}
        <aside className="w-80 border-l bg-white flex flex-col overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-bold">Ward Feed</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {wardFeed.length === 0 ? (
              <p className="text-sm text-gray-400 text-center mt-10 italic">No activity detected nearby...</p>
            ) : (
              wardFeed.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${item.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                    DR
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm p-2 bg-gray-50 rounded-lg italic text-gray-700 leading-snug">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
