'use client';
import dynamic from 'next/dynamic';
import { Suspense, useState, useEffect } from 'react';
import { Stethoscope, LogOut, Users, Activity } from 'lucide-react';
import Link from 'next/link';
import { ClinicalVignette } from '@/types';
import { AnimatePresence } from 'framer-motion';
import InterviewMenu from '@/components/InterviewMenu';

// Dynamically import Phaser component as it needs 'window'
const GameCanvas = dynamic(() => import('@/components/GameCanvas'), {
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

  // Listen for custom events from Phaser
  useEffect(() => {
    const handleInteract = (e: any) => {
      console.log('🎉 React caught interaction event:', e.detail);
      // For now, always show the mock vignette regardless of ID
      setActiveVignette(MOCK_VIGNETTE);
    };

    window.addEventListener('phaser-patient-interact', handleInteract);
    return () => window.removeEventListener('phaser-patient-interact', handleInteract);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden relative">
      <AnimatePresence>
        {activeVignette && (
          <InterviewMenu 
            vignette={activeVignette} 
            onClose={() => setActiveVignette(null)} 
          />
        )}
      </AnimatePresence>
...
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
        {/* Left Sidebar - Player Stats / Objectives */}
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
            <div className="p-3 border rounded-lg bg-gray-50">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Clinical Logic</p>
              <p className="text-sm font-medium">No misdiagnoses today</p>
              <p className="text-xs text-green-600 mt-1 font-medium">Active Streak: 3</p>
            </div>
          </div>
        </aside>

        {/* Center - Phaser Stage */}
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <Suspense fallback={<div className="h-[600px] w-[800px] bg-slate-900 animate-pulse rounded-xl" />}>
            <GameCanvas />
          </Suspense>
        </div>

        {/* Right Sidebar - Feed / Eavesdrop */}
        <aside className="w-80 border-l bg-white flex flex-col overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-bold">Ward Feed</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">JD</div>
              <div className="space-y-1">
                <p className="text-xs font-semibold">Dr. John Doe <span className="text-gray-400 font-normal">at Charting Station B</span></p>
                <p className="text-sm p-2 bg-gray-50 rounded-lg italic">"Successfully charted Patient #402: Type 2 DM Exacerbation"</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs shrink-0">SC</div>
              <div className="space-y-1">
                <p className="text-xs font-semibold">Dr. Sarah Connor <span className="text-gray-400 font-normal">at Patient Room 4</span></p>
                <p className="text-sm p-2 bg-gray-50 rounded-lg italic">"Performing Deep Inquiry... examining vitals."</p>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
