'use client';
export const dynamic = 'force-dynamic';
import dynamicNext from 'next/dynamic';
import { Suspense, useState, useEffect } from 'react';
import { 
  Stethoscope, LogOut, Users, Activity, 
  FileText, Bell, Settings, Clipboard,
  ShieldAlert, Search, LayoutDashboard
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
              text: `Dr. ${id.substring(0, 4)} is interviewing a patient nearby...`,
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
      text: isCorrect ? `ADMISSION: Patient ${activeVignette.id.substring(0,4)} correctly diagnosed.` : `DISCHARGE: Patient ${activeVignette.id.substring(0,4)} chart submitted.`,
      type: isCorrect ? 'success' : 'info'
    }, ...prev]);

    if (auth?.currentUser) {
      await saveGameStats(auth.currentUser.uid, { xp: isCorrect ? 50 : 10, score: isCorrect ? 100 : 0, correct: isCorrect });
    }
    handleClosePatient();
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      
      {/* Clinical Command Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-blue-200 shadow-lg">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-slate-800 leading-none">Antics MD</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Clinical Operations Center</p>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200" />

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>Ward Population: 14</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-emerald-500" />
              <span>Unit Efficiency: 96%</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-700 uppercase">Dr. {auth?.currentUser?.displayName?.split(' ')[0] || 'Resident'}</span>
          </div>
          <Link href="/" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
            <LogOut className="h-5 w-5" />
          </Link>
        </div>
      </header>

      {/* Main Workspace - Horizontal Split */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left: Interactive Ward Interface (Phaser) */}
        <section className="flex-1 min-w-0 bg-slate-100 p-4 overflow-hidden flex flex-col">
          <div className="flex-1 relative rounded-2xl border-2 border-slate-200 bg-black overflow-hidden shadow-inner flex items-center justify-center">
            <Suspense fallback={<div className="text-slate-400 font-medium animate-pulse">Initializing Ward Monitor...</div>}>
              <GameCanvas />
            </Suspense>
          </div>
          <div className="mt-4 flex items-center justify-between px-2">
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <div className="h-3 w-3 rounded-sm bg-[#00ff00] border border-black/20" />
                Local Unit
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <div className="h-3 w-3 rounded-sm bg-[#ff0000] border border-black/20" />
                Remote Unit
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <div className="h-3 w-3 rounded-sm bg-[#3b82f6] border border-black/20" />
                Patient
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Input: [WASD] / Arrow Keys</p>
          </div>
        </section>

        {/* Right: Clinical Information System (CIS) Panel */}
        <section className="w-[500px] lg:w-[600px] border-l border-slate-200 bg-white flex flex-col shrink-0 overflow-hidden">
          
          {/* Panel Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 px-2 shrink-0">
            <button 
              onClick={() => setActiveTab('feed')}
              className={`px-6 py-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all relative ${activeTab === 'feed' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Bell className="h-4 w-4" />
              Unit Feed
              {activeTab === 'feed' && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600" />}
            </button>
            <button 
              onClick={() => setActiveTab('patient')}
              className={`px-6 py-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-all relative ${activeTab === 'patient' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <FileText className="h-4 w-4" />
              Patient File
              {activeTab === 'patient' && <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600" />}
            </button>
          </div>

          {/* Panel Content Area */}
          <div className="flex-1 overflow-hidden relative flex flex-col">
            <AnimatePresence mode="wait">
              {activeTab === 'feed' ? (
                <motion.div 
                  key="feed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col overflow-hidden p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Operational Log</h2>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">Live Signal</span>
                  </div>
                  
                  <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                    {wardFeed.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300 italic py-20">
                        <Activity className="h-10 w-10 mb-4 opacity-20" />
                        <p className="text-sm">No recent activity detected on unit.</p>
                      </div>
                    ) : (
                      wardFeed.map((item) => (
                        <div key={item.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex gap-4 items-start shadow-sm border-l-4 border-l-blue-500">
                          <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${item.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                          <p className="text-sm font-medium text-slate-700 leading-snug">
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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col overflow-hidden bg-white"
                >
                  {activeVignette ? (
                    <InterviewMenu 
                      vignette={activeVignette} 
                      onClose={handleClosePatient}
                      onSubmit={handleSubmitDiagnosis}
                      isEmbedded={true}
                    />
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                      <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border-2 border-dashed border-slate-200">
                        <Search className="h-8 w-8 text-slate-300" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mb-2">Electronic Health Record (EHR)</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        Navigate to a patient unit on the monitor to retrieve and review their clinical dossier.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CIS Status Bar */}
          <div className="h-10 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-6 shrink-0">
             <div className="flex items-center gap-4">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">System Status: Nominal</span>
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                   <div className="h-1 w-1 rounded-full bg-emerald-500" /> 
                   Connection Secure
                </span>
             </div>
             <span className="text-[9px] font-bold text-slate-500 uppercase">EHR Terminal v4.2</span>
          </div>
        </section>
      </main>

      {/* Global Clinical Theme Overrides */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
