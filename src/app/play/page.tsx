'use client';
export const dynamic = 'force-dynamic';
import dynamicNext from 'next/dynamic';
import { Suspense, useState, useEffect } from 'react';
import { 
  Stethoscope, LogOut, Users, Activity, 
  FileText, Bell, Search, LayoutDashboard, Monitor,
  Microscope, Database, ShieldCheck, HeartPulse,
  User as UserIcon, Award, MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { ClinicalVignette } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import InterviewMenu from '@/components/InterviewMenu';
import { saveGameStats, auth } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';

const GameCanvas = dynamicNext(() => import('@/components/GameCanvas'), {
  ssr: false,
});

export default function PlayPage() {
  const [activeVignette, setActiveVignette] = useState<ClinicalVignette | null>(null);
  const [allVignettes, setAllVignettes] = useState<ClinicalVignette[]>([]);
  const [wardFeed, setWardFeed] = useState<Array<{id: string, text: string, type: 'info' | 'success'}>>([]);
  const [activeTab, setActiveTab] = useState<'patient' | 'feed'>('feed');
  const [players, setPlayers] = useState<any[]>([]);
  const [myName, setMyName] = useState('Resident');

  useEffect(() => {
    const savedName = localStorage.getItem('physician_name');
    if (savedName) setMyName(savedName);
  }, []);

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
      // Update local players list
      setPlayers(Object.values(remotePlayers));
      
      const localPlayer = e.detail.localPlayer;
      const newFeedEntries: any[] = [];
      Object.entries(remotePlayers).forEach(([id, player]: [string, any]) => {
        if (player.status === 'interviewing' || player.status === 'charting') {
          const dist = Math.sqrt(Math.pow(player.x - localPlayer.x, 2) + Math.pow(player.y - localPlayer.y, 2));
          if (dist < 400) { 
            newFeedEntries.push({
              id: `${id}-${Date.now()}`,
              text: `Dr. ${id.substring(0, 4)} examining Unit ${id.substring(4, 8)}`,
              type: 'info'
            });
          }
        }
      });
      if (newFeedEntries.length > 0) {
        setWardFeed(prev => [...newFeedEntries, ...prev].slice(0, 15));
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
      text: isCorrect ? `SUCCESS: Unit ${activeVignette.id.substring(0,4)} cured.` : `Dossier submitted for Unit ${activeVignette.id.substring(0,4)}.`,
      type: isCorrect ? 'success' : 'info'
    }, ...prev]);

    if (auth?.currentUser) {
      await saveGameStats(auth.currentUser.uid, { xp: isCorrect ? 50 : 10, score: isCorrect ? 100 : 0, correct: isCorrect });
    }
    handleClosePatient();
  };

  return (
    <div className="flex flex-col h-screen bg-[#e2e8f0] font-sans selection:bg-indigo-200">
      
      {/* Playful Header */}
      <header className="h-16 bg-white border-b-4 border-slate-900 px-6 flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-[#6366f1] p-1.5 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0_0_#1e293b]">
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <h1 className="font-black text-xl tracking-tighter text-slate-900 uppercase italic">Antics MD</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-slate-100 border-2 border-slate-900 px-4 py-1 rounded-lg text-xs font-black uppercase tracking-tight text-slate-600">
             Node_04.Status: <span className="text-emerald-600">Operational</span>
          </div>
          <Link href="/" className="bg-white border-2 border-slate-900 p-2 rounded-lg hover:bg-slate-50 transition-all shadow-[2px_2px_0_0_#1e293b] active:shadow-none active:translate-x-0.5 active:translate-y-0.5">
            <LogOut className="h-5 w-5 text-slate-900" />
          </Link>
        </div>
      </header>

      {/* Main 3-Column Grid */}
      <main className="flex-1 grid grid-cols-[240px_1fr_350px] overflow-hidden p-4 gap-4">
        
        {/* COLUMN 1: MEDICAL TEAM (Players) */}
        <aside className="bg-white border-4 border-slate-900 rounded-[2rem] flex flex-col overflow-hidden shadow-[6px_6px_0_0_#1e293b]">
           <div className="p-5 border-b-4 border-slate-900 bg-slate-50">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                 <Users className="h-4 w-4" /> Medical Team
              </h2>
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              <div className="bg-indigo-50 border-2 border-slate-900 p-3 rounded-xl flex items-center gap-3">
                 <div className="h-8 w-8 bg-indigo-600 rounded-full border-2 border-slate-900 flex items-center justify-center text-white font-black text-xs">
                    DR
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-900 truncate">YOU</p>
                    <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">Resident</p>
                 </div>
              </div>
              
              {players.map((p, i) => (
                <div key={i} className="bg-white border-2 border-slate-200 p-3 rounded-xl flex items-center gap-3 opacity-60">
                   <div className="h-8 w-8 bg-slate-200 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-400 font-black text-xs uppercase">
                      {p.id.substring(0, 2)}
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-600 truncate">Dr. {p.id.substring(0, 4)}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{p.status}</p>
                   </div>
                </div>
              ))}
           </div>
           <div className="p-4 bg-slate-50 border-t-4 border-slate-900">
              <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400">
                 <span>Active Now</span>
                 <span>{players.length + 1} Units</span>
              </div>
           </div>
        </aside>

        {/* COLUMN 2: WARD AREA (Phaser) */}
        <section className="flex flex-col gap-4">
           {/* Top Info Bar (Word Hint Area style) */}
           <div className="h-16 bg-white border-4 border-slate-900 rounded-2xl flex items-center px-6 shadow-[6px_6px_0_0_#1e293b] shrink-0">
              <div className="flex items-center gap-4">
                 <div className="h-8 w-8 bg-amber-400 border-2 border-slate-900 rounded-lg flex items-center justify-center">
                    <Award className="h-5 w-5 text-slate-900" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Active Objective</p>
                    <p className="text-sm font-black text-slate-900 uppercase">
                       {activeVignette ? `Diagnosing Patient: #${activeVignette.id.substring(0,6)}` : 'Navigate Ward: Approach Units to engage'}
                    </p>
                 </div>
              </div>
           </div>

           {/* The Canvas */}
           <div className="flex-1 bg-white border-4 border-slate-900 rounded-[2.5rem] shadow-[8px_8px_0_0_#1e293b] relative overflow-hidden group">
              <div className="absolute inset-0 bg-slate-50 opacity-50 pointer-events-none group-hover:opacity-0 transition-opacity" />
              <Suspense fallback={<div className="h-full w-full flex items-center justify-center font-black text-slate-300 uppercase tracking-[0.5em] animate-pulse">Initializing Aether-Ward...</div>}>
                <GameCanvas />
              </Suspense>
           </div>
        </section>

        {/* COLUMN 3: COMMS & DOSSIER */}
        <aside className="bg-white border-4 border-slate-900 rounded-[2rem] flex flex-col overflow-hidden shadow-[6px_6px_0_0_#1e293b]">
           {/* Tab Nav */}
           <div className="flex bg-slate-50 border-b-4 border-slate-900">
              <button 
                onClick={() => setActiveTab('feed')}
                className={`flex-1 py-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'feed' ? 'bg-white text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <MessageSquare className="h-4 w-4" /> Comms
              </button>
              <button 
                onClick={() => setActiveTab('patient')}
                className={`flex-1 py-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all border-l-4 border-slate-900 ${activeTab === 'patient' ? 'bg-white text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Clipboard className="h-4 w-4" /> Dossier
              </button>
           </div>

           <div className="flex-1 overflow-hidden relative flex flex-col">
              <AnimatePresence mode="wait">
                {activeTab === 'feed' ? (
                  <motion.div 
                    key="feed"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex-1 flex flex-col p-5"
                  >
                    <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                      {wardFeed.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 italic opacity-50 py-20">
                          <Bell className="h-12 w-12 mb-4" />
                          <p className="text-[10px] font-black uppercase tracking-widest">No Active Signals</p>
                        </div>
                      ) : (
                        wardFeed.map((item) => (
                          <div key={item.id} className="bg-slate-50 border-2 border-slate-900 p-3 rounded-xl relative shadow-[2px_2px_0_0_#1e293b]">
                            <p className="text-xs font-bold text-slate-700 leading-snug">
                              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${item.type === 'success' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                              {item.text}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                    {/* Fake Chat Input (Skribbl style) */}
                    <div className="mt-4 pt-4 border-t-2 border-slate-100 flex gap-2">
                       <input 
                         type="text" 
                         placeholder="Type a clinical note..." 
                         className="flex-1 bg-slate-50 border-2 border-slate-900 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none"
                       />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="patient"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
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
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-30">
                        <Search className="h-16 w-16 mb-6 text-slate-400" />
                        <h3 className="text-sm font-black uppercase text-slate-500 tracking-widest mb-2">No Dossier Loaded</h3>
                        <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase">Navigate to a unit to sync records.</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
        </aside>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
          border: 2px solid white;
        }
      `}</style>
    </div>
  );
}
