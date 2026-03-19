'use client';
export const dynamic = 'force-dynamic';
import dynamicNext from 'next/dynamic';
import { Suspense, useState, useEffect } from 'react';
import { 
  Stethoscope, LogOut, Users, Activity, 
  FileText, Bell, Search, LayoutDashboard, Monitor
} from 'lucide-react';
import Link from 'next/link';
import { ClinicalVignette } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import InterviewMenu from '@/components/InterviewMenu';
import { saveGameStats, auth } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';

// Dynamically import Phaser component as it needs 'window'
const GameCanvas = dynamicNext(() => import('@/components/GameCanvas'), {
  ssr: false,
});

export default function PlayPage() {
  const [activeVignette, setActiveVignette] = useState<ClinicalVignette | null>(null);
  const [allVignettes, setAllVignettes] = useState<ClinicalVignette[]>([]);
  const [wardFeed, setWardFeed] = useState<Array<{id: string, text: string, type: 'info' | 'success'}>>([]);
  const [activeTab, setActiveTab] = useState<'patient' | 'feed'>('feed');

  // Fetch initial vignettes from Supabase
  useEffect(() => {
    const fetchVignettes = async () => {
      const { data, error } = await supabase
        .from('daily_vignettes')
        .select('*')
        .eq('is_active', true)
        .limit(10);
      
      if (data) {
        const vignettes = data.map((row: any) => ({
          ...row.data,
          id: row.id.toString(),
          fullVignette: row.data.full_vignette || row.data.fullVignette,
          chiefComplaint: row.data.chief_complaint || row.data.chiefComplaint,
          physicalExam: row.data.physical_exam || row.data.physicalExam,
          correctDiagnosis: row.data.correct_diagnosis || row.data.correctDiagnosis
        }));
        setAllVignettes(vignettes);
      }
    };
    fetchVignettes();
  }, []);

  // Listen for custom events from Phaser
  useEffect(() => {
    const handleInteract = (e: any) => {
      const found = allVignettes.find(v => v.id === e.detail.id);
      if (found) {
        setActiveVignette(found);
        setActiveTab('patient');
      }
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
              text: `Dr. ${id.substring(0, 4)} is currently rounding nearby...`,
              type: 'info'
            });
          }
        }
      });
      if (newFeedEntries.length > 0) {
        setWardFeed(prev => [...newFeedEntries, ...prev].slice(0, 10));
      }
    };

    window.addEventListener('phaser-patient-interact', handleInteract);
    window.addEventListener('phaser-remote-update', handleRemoteUpdate);
    return () => {
      window.removeEventListener('phaser-patient-interact', handleInteract);
      window.removeEventListener('phaser-remote-update', handleRemoteUpdate);
    };
  }, [allVignettes]);

  const handleClosePatient = () => {
    if (activeVignette) {
      const phaserGame = (window as any).phaserGame;
      const scene = phaserGame?.scene.getScene('WardScene') as any;
      if (scene) scene.unlockPatient(activeVignette.id);
    }
    setActiveVignette(null);
    setActiveTab('feed');
  };

  const handleSubmitDiagnosis = async (diagnosis: string) => {
    if (!activeVignette) return;
    const isCorrect = diagnosis === activeVignette.correctDiagnosis;
    
    setWardFeed(prev => [{
      id: `sys-${Date.now()}`,
      text: isCorrect ? `ADMISSION STATUS: Correct diagnosis confirmed for Unit #${activeVignette.id.substring(0,4)}.` : `CHART FINALIZED: Admission request submitted for Unit #${activeVignette.id.substring(0,4)}.`,
      type: isCorrect ? 'success' : 'info'
    }, ...prev]);

    if (auth?.currentUser) {
      await saveGameStats(auth.currentUser.uid, { xp: isCorrect ? 50 : 10, score: isCorrect ? 100 : 0, correct: isCorrect });
    }
    handleClosePatient();
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 overflow-hidden font-sans">
      
      {/* Station Header */}
      <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-30 shadow-md">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1 rounded-lg">
              <Stethoscope className="h-4 w-4 text-white" />
            </div>
            <h1 className="font-bold text-base tracking-tight text-slate-800">Antics MD <span className="text-slate-400 font-medium ml-2 text-xs uppercase tracking-widest">Infirmary Operations</span></h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-6">
            <div className="flex items-center gap-1.5 border-r pr-4 border-slate-200">
              <Users className="h-3.5 w-3.5" />
              <span>Physicians: 14</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-emerald-500" />
              <span>Network Efficiency: 96%</span>
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <Link href="/" className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-red-600 transition-colors">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Link>
        </div>
      </header>

      {/* Modern Horizontal Layout Workspace */}
      <main className="flex-1 flex overflow-hidden p-2 gap-2">
        
        {/* Left: Ward Monitor Window */}
        <section className="flex-1 min-w-0 bg-slate-800 rounded-xl overflow-hidden flex flex-col border border-slate-700 shadow-2xl relative">
          <div className="h-8 bg-slate-800 border-b border-slate-700 px-4 flex items-center justify-between shrink-0">
             <div className="flex items-center gap-2">
                <Monitor className="h-3 w-3 text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Live Ward Monitor • Node_04</span>
             </div>
             <div className="flex gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                <div className="h-1.5 w-1.5 rounded-full bg-slate-600" />
             </div>
          </div>
          
          <div className="flex-1 bg-black relative">
            <Suspense fallback={<div className="h-full w-full flex items-center justify-center text-slate-500 text-xs font-bold uppercase tracking-widest animate-pulse">Establishing Aether-Link...</div>}>
              <GameCanvas />
            </Suspense>
          </div>

          <div className="h-8 bg-slate-800 border-t border-slate-700 px-4 flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase tracking-tight">
             <div className="flex gap-4">
                <span>[W][A][S][D] Navigate</span>
                <span>[Mouse] Interact</span>
             </div>
             <span>System Status: Optimal</span>
          </div>
        </section>

        {/* Right: Electronic Health Record (EHR) Terminal */}
        <section className="w-[500px] lg:w-[600px] bg-slate-100 rounded-xl flex flex-col shrink-0 overflow-hidden border border-slate-200 shadow-2xl">
          
          {/* EHR Tabs */}
          <div className="flex bg-slate-200/50 p-1 gap-1 shrink-0">
            <button 
              onClick={() => setActiveTab('feed')}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'feed' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
            >
              <Bell className="h-3.5 w-3.5" />
              Unit Comms
            </button>
            <button 
              onClick={() => setActiveTab('patient')}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'patient' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
            >
              <FileText className="h-3.5 w-3.5" />
              Clinical Dossier
            </button>
          </div>

          {/* CIS Display Area */}
          <div className="flex-1 overflow-hidden relative flex flex-col bg-white rounded-b-xl border-t border-slate-200">
            <AnimatePresence mode="wait">
              {activeTab === 'feed' ? (
                <motion.div 
                  key="feed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Station Communication Log</h2>
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                  </div>
                  
                  <div className="flex-1 space-y-3 overflow-y-auto p-6 custom-scrollbar">
                    {wardFeed.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50 py-20">
                        <Activity className="h-12 w-12 mb-4" />
                        <p className="text-xs font-bold uppercase tracking-widest">No Incoming Logs</p>
                      </div>
                    ) : (
                      wardFeed.map((item) => (
                        <div key={item.id} className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm border-l-4 border-l-blue-600">
                          <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                            <span className="text-blue-600 font-black mr-2">LOG_{new Date().getMinutes()}:</span>
                            {item.text}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="patient"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  {activeVignette ? (
                    <InterviewMenu 
                      vignette={activeVignette} 
                      onClose={handleClosePatient}
                      onSubmit={handleSubmitDiagnosis}
                      isEmbedded={true}
                    />
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50/30">
                      <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center mb-6 border-2 border-slate-100 shadow-sm">
                        <Search className="h-6 w-6 text-slate-200" />
                      </div>
                      <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest mb-2">No Active Patient</h3>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-[240px]">
                        Please engage a patient on the Monitor to load their clinical file into the terminal.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
