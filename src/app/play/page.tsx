'use client';
export const dynamic = 'force-dynamic';
import dynamicNext from 'next/dynamic';
import { Suspense, useState, useEffect } from 'react';
import { 
  Stethoscope, LogOut, Users, Activity, 
  FileText, Bell, Search, Award, MessageSquare,
  Clipboard
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
      setPlayers(Object.values(remotePlayers));
      
      const localPlayer = e.detail.localPlayer;
      const newFeedEntries: any[] = [];
      Object.entries(remotePlayers).forEach(([id, player]: [string, any]) => {
        if (player.status === 'interviewing' || player.status === 'charting') {
          const dist = Math.sqrt(Math.pow(player.x - localPlayer.x, 2) + Math.pow(player.y - localPlayer.y, 2));
          if (dist < 400) { 
            newFeedEntries.push({
              id: `${id}-${Date.now()}`,
              text: `Dr. ${id.substring(0, 4)} observing Unit ${id.substring(4, 8)}`,
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
      text: isCorrect ? `RESOLVED: Patient ${activeVignette.id.substring(0,4)} cured.` : `CHARTED: Unit ${activeVignette.id.substring(0,4)} submitted.`,
      type: isCorrect ? 'success' : 'info'
    }, ...prev]);

    if (auth?.currentUser) {
      await saveGameStats(auth.currentUser.uid, { xp: isCorrect ? 50 : 10, score: isCorrect ? 100 : 0, correct: isCorrect });
    }
    handleClosePatient();
  };

  return (
    <div className="h-full w-full bg-[#f0f2f5] flex flex-col overflow-hidden" style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      
      {/* 1. Header */}
      <header className="h-16 shrink-0 bg-white border-b-4 border-[#1e293b] px-6 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <div className="bg-[#6366f1] p-1.5 rounded-xl border-4 border-[#1e293b]">
            <Stethoscope size={24} className="text-white" />
          </div>
          <h1 className="font-black text-2xl tracking-tighter text-[#1e293b] uppercase italic">Antics MD</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-slate-100 border-4 border-[#1e293b] px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-tight text-slate-600">
             Node_04 <span className="text-emerald-600 ml-2">● Online</span>
          </div>
          <Link href="/" className="bg-white border-4 border-[#1e293b] p-2 rounded-xl hover:bg-slate-50 transition-all shadow-[4px_4px_0_0_#1e293b] active:shadow-none active:translate-x-0.5 active:translate-y-0.5">
            <LogOut size={20} className="text-[#1e293b]" />
          </Link>
        </div>
      </header>

      {/* 2. Main Game Body - BULLETPROOF CSS GRID */}
      <main 
        className="flex-1 overflow-hidden p-4 gap-4" 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: '240px 1fr 380px', 
          minWidth: '1200px',
          height: 'calc(100vh - 64px)'
        }}
      >
        
        {/* COLUMN 1: PLAYERS */}
        <aside className="bg-white border-4 border-[#1e293b] rounded-[2rem] flex flex-col overflow-hidden shadow-[8px_8px_0_0_#1e293b]">
           <div className="p-5 border-b-4 border-[#1e293b] bg-slate-50 flex items-center justify-between">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Clinical Team</h2>
              <Users size={14} className="text-slate-400" />
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              <div className="bg-[#eef2ff] border-4 border-[#1e293b] p-3 rounded-2xl flex items-center gap-3">
                 <div className="h-10 w-10 bg-[#4f46e5] rounded-full border-4 border-[#1e293b] flex items-center justify-center text-white font-black text-sm">
                    DR
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-[#1e293b] truncate leading-none uppercase italic">{myName}</p>
                    <p className="text-[9px] font-bold text-[#4f46e5] uppercase tracking-widest mt-1">Resident</p>
                 </div>
              </div>
              
              {players.map((p, i) => (
                <div key={i} className="bg-white border-4 border-slate-200 p-3 rounded-2xl flex items-center gap-3 opacity-60">
                   <div className="h-10 w-10 bg-slate-200 rounded-full border-4 border-slate-200 flex items-center justify-center text-slate-400 font-black text-sm uppercase">
                      {p.id.substring(0, 2)}
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-600 truncate leading-none uppercase italic">Dr. {p.id.substring(0, 4)}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{p.status}</p>
                   </div>
                </div>
              ))}
           </div>
        </aside>

        {/* COLUMN 2: WARD VIEW */}
        <section className="flex flex-col gap-4 overflow-hidden">
           {/* Hint Area */}
           <div className="h-20 shrink-0 bg-white border-4 border-[#1e293b] rounded-3xl flex items-center px-8 shadow-[8px_8px_0_0_#1e293b]">
              <div className="flex items-center gap-6">
                 <div className="h-10 w-10 bg-[#fbbf24] border-4 border-[#1e293b] rounded-xl flex items-center justify-center shadow-[4px_4px_0_0_#92400e]">
                    <Award size={24} className="text-[#1e293b]" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Active Medical Objective</p>
                    <p className="text-xl font-black text-[#1e293b] uppercase italic">
                       {activeVignette ? `DIAGNOSING UNIT #${activeVignette.id.substring(0,6)}` : 'SECURE A UNIT TO RETRIEVE CLINICAL DATA'}
                    </p>
                 </div>
              </div>
           </div>

           {/* Game Area */}
           <div className="flex-1 bg-white border-4 border-[#1e293b] rounded-[3rem] shadow-[12px_12px_0_0_#1e293b] relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-slate-50 opacity-30 pointer-events-none" />
              <div className="w-full h-full relative z-10">
                <Suspense fallback={null}>
                  <GameCanvas />
                </Suspense>
              </div>
           </div>
        </section>

        {/* COLUMN 3: EHR TERMINAL */}
        <aside className="bg-white border-4 border-[#1e293b] rounded-[2rem] flex flex-col overflow-hidden shadow-[8px_8px_0_0_#1e293b]">
           {/* Tab Navigation */}
           <div className="flex bg-slate-50 border-b-4 border-[#1e293b] h-16 shrink-0">
              <button 
                onClick={() => setActiveTab('feed')}
                className="flex-1 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all"
                style={{ 
                  backgroundColor: activeTab === 'feed' ? '#white' : '#f8fafc',
                  color: activeTab === 'feed' ? '#6366f1' : '#94a3b8'
                }}
              >
                <MessageSquare size={18} /> Comms
              </button>
              <button 
                onClick={() => setActiveTab('patient')}
                className="flex-1 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all border-l-4 border-[#1e293b]"
                style={{ 
                  backgroundColor: activeTab === 'patient' ? '#white' : '#f8fafc',
                  color: activeTab === 'patient' ? '#6366f1' : '#94a3b8'
                }}
              >
                <FileText size={18} /> Dossier
              </button>
           </div>

           {/* Content View */}
           <div className="flex-1 overflow-hidden relative flex flex-col bg-white">
              <AnimatePresence mode="wait">
                {activeTab === 'feed' ? (
                  <motion.div 
                    key="feed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col p-6"
                  >
                    <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                      {wardFeed.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 italic opacity-50 py-20">
                          <Bell size={48} className="mb-4" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Hospital Comms</p>
                        </div>
                      ) : (
                        wardFeed.map((item) => (
                          <div key={item.id} className="bg-slate-50 border-4 border-[#1e293b] p-4 rounded-[1.5rem] relative shadow-[4px_4px_0_0_#1e293b]">
                            <p className="text-sm font-bold text-slate-700 leading-snug uppercase italic tracking-tight">
                              <span className={`inline-block w-2.5 h-2.5 rounded-full border-2 border-[#1e293b] mr-2 ${item.type === 'success' ? 'bg-[#10b981]' : 'bg-[#6366f1]'}`} />
                              {item.text}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                    {/* Chat Input Placeholder */}
                    <div className="mt-6 pt-6 border-t-4 border-[#1e293b] flex gap-3">
                       <input 
                         type="text" 
                         placeholder="Enter clinical note..." 
                         className="flex-1 bg-slate-50 border-4 border-[#1e293b] rounded-2xl px-4 py-3 text-sm font-black uppercase italic placeholder:text-slate-300 focus:outline-none transition-all"
                       />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="patient"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
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
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-30 italic">
                        <Search size={64} className="mb-6 text-slate-400" />
                        <h3 className="text-lg font-black uppercase text-slate-500 tracking-widest mb-2 italic">Dossier Locked</h3>
                        <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase">Engage unit on monitor to sync record.</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
        </aside>
      </main>
    </div>
  );
}
