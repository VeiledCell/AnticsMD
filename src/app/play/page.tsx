'use client';
export const dynamic = 'force-dynamic';
import dynamicNext from 'next/dynamic';
import { Suspense, useState, useEffect } from 'react';
import { 
  Stethoscope, LogOut, Users, Activity, 
  FileText, Bell, Search, LayoutDashboard, Monitor,
  Microscope, Database, ShieldCheck, HeartPulse
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
      const localPlayer = e.detail.localPlayer;
      
      const newFeedEntries: any[] = [];
      Object.entries(remotePlayers).forEach(([id, player]: [string, any]) => {
        if (player.status === 'interviewing' || player.status === 'charting') {
          const dist = Math.sqrt(Math.pow(player.x - localPlayer.x, 2) + Math.pow(player.y - localPlayer.y, 2));
          if (dist < 400) { 
            newFeedEntries.push({
              id: `${id}-${Date.now()}`,
              text: `Dr. ${id.substring(0, 4)} rounds on Unit ${id.substring(4, 8)}`,
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
      text: isCorrect ? `DIAGNOSIS CONFIRMED: ${activeVignette.id.substring(0,6)} initialized for transfer.` : `CHART FILED: Diagnosis pending for ${activeVignette.id.substring(0,6)}.`,
      type: isCorrect ? 'success' : 'info'
    }, ...prev]);

    if (auth?.currentUser) {
      await saveGameStats(auth.currentUser.uid, { xp: isCorrect ? 50 : 10, score: isCorrect ? 100 : 0, correct: isCorrect });
    }
    handleClosePatient();
  };

  return (
    <div className="flex flex-col h-screen bg-[#05070a] text-slate-200 overflow-hidden font-sans">
      
      {/* Top Navigation Bar: High-Tech Indigo */}
      <header className="h-16 bg-[#0a0d14] border-b border-white/5 px-8 flex items-center justify-between shrink-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight text-white italic">Antics <span className="text-indigo-500 not-italic uppercase text-sm tracking-widest ml-1">M.D.</span></h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500 leading-none">Command & Control Center</p>
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-6 border-l border-white/10 pl-8">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Network Load</span>
              <div className="h-1 w-32 bg-slate-800 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '42%' }} className="h-full bg-indigo-500" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Unit Capacity</span>
              <div className="h-1 w-32 bg-slate-800 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '78%' }} className="h-full bg-emerald-500" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10 backdrop-blur-md">
            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
            <span className="text-xs font-black text-slate-300 uppercase tracking-tighter">DR. {auth?.currentUser?.displayName?.split(' ')[0] || 'RESIDENT'}</span>
            <div className="h-4 w-px bg-white/10 mx-1" />
            <Link href="/" className="text-slate-500 hover:text-white transition-colors">
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout - Explicit Grid for Side-by-Side */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_minmax(450px,550px)] overflow-hidden">
        
        {/* LEFT: REAL-TIME WARD MONITOR */}
        <section className="relative flex flex-col bg-[#05070a] overflow-hidden p-3 gap-3">
          
          {/* Monitor Header */}
          <div className="h-10 bg-[#0a0d14] rounded-t-2xl border-x border-t border-white/5 px-5 flex items-center justify-between shadow-lg">
             <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1] animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Live Visual Feed • Ward_Delta_04</span>
             </div>
             <div className="flex items-center gap-4 text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                <span className="flex items-center gap-1"><Monitor className="h-3 w-3" /> 1080p_Stream</span>
                <span className="flex items-center gap-1"><Database className="h-3 w-3" /> Sync_Active</span>
             </div>
          </div>

          {/* Game Canvas Container */}
          <div className="flex-1 bg-black rounded-b-2xl border-x border-b border-white/5 relative overflow-hidden shadow-2xl group">
            {/* Corner Decorative Elements */}
            <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-indigo-500/30 rounded-tl-xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-indigo-500/30 rounded-tr-xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-indigo-500/30 rounded-bl-xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-indigo-500/30 rounded-br-xl pointer-events-none" />
            
            <Suspense fallback={<div className="h-full w-full flex items-center justify-center text-slate-600 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse italic">Establishing Neural Link...</div>}>
              <GameCanvas />
            </Suspense>

            {/* Overlay Grid lines (Very subtle) */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px]" />
          </div>

          {/* Monitor Footer Info */}
          <div className="flex items-center justify-between px-4 text-[9px] font-black uppercase tracking-widest text-slate-600">
             <div className="flex gap-6">
                <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-indigo-500" /> Interaction Range: 60u</span>
                <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-500" /> Active Rounding</span>
             </div>
             <div className="bg-white/5 px-3 py-1 rounded-full border border-white/5 flex items-center gap-2">
                <span className="opacity-50 italic">Controls:</span>
                <span className="text-slate-400 font-mono">[W][A][S][D] / Arrows</span>
             </div>
          </div>
        </section>

        {/* RIGHT: CLINICAL INFORMATION TERMINAL */}
        <section className="flex flex-col bg-[#0a0d14] border-l border-white/5 overflow-hidden shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
          
          {/* Terminal Tabs: Clean Modern Interface */}
          <div className="flex bg-[#05070a] p-2 gap-2 shrink-0 border-b border-white/5">
            <button 
              onClick={() => setActiveTab('feed')}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'feed' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
            >
              <Bell className="h-3.5 w-3.5" />
              Unit Comms
            </button>
            <button 
              onClick={() => setActiveTab('patient')}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'patient' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
            >
              <FileText className="h-3.5 w-3.5" />
              Electronic Dossier
            </button>
          </div>

          {/* Terminal Display Area: High Contrast Content */}
          <div className="flex-1 overflow-hidden relative flex flex-col bg-[#05070a]">
            <AnimatePresence mode="wait">
              {activeTab === 'feed' ? (
                <motion.div 
                  key="feed"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="flex-1 flex flex-col overflow-hidden p-6 gap-6"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center gap-2">
                      <Microscope className="h-4 w-4 text-indigo-500" />
                      <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-300">Operations Feed</h2>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded uppercase tracking-tighter">Live_Encrypted</span>
                  </div>
                  
                  <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                    {wardFeed.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-700 italic py-20 opacity-30">
                        <HeartPulse className="h-16 w-16 mb-4" />
                        <p className="text-xs font-black uppercase tracking-[0.3em]">No Comms Logged</p>
                      </div>
                    ) : (
                      wardFeed.map((item) => (
                        <div key={item.id} className="bg-[#0a0d14] border border-white/5 p-4 rounded-2xl flex gap-4 items-start shadow-xl relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.type === 'success' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                          <div className="flex-1">
                             <div className="flex justify-between items-center mb-1">
                                <span className={`text-[8px] font-black uppercase tracking-widest ${item.type === 'success' ? 'text-emerald-500' : 'text-indigo-500'}`}>{item.type === 'success' ? 'Resolution' : 'Update'}</span>
                                <span className="text-[8px] font-mono text-slate-600">{new Date().toLocaleTimeString()}</span>
                             </div>
                             <p className="text-[13px] font-bold text-slate-300 leading-snug">
                                {item.text}
                             </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="patient"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
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
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-[#05070a]">
                      <div className="h-24 w-24 bg-[#0a0d14] rounded-3xl flex items-center justify-center mb-8 border border-white/5 shadow-2xl relative">
                        <div className="absolute inset-0 bg-indigo-500/5 blur-xl rounded-full" />
                        <Search className="h-8 w-8 text-slate-700 relative z-10" />
                      </div>
                      <h3 className="text-sm font-black uppercase text-slate-500 tracking-[0.3em] mb-3 italic">Record Selection Required</h3>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-[280px] font-medium tracking-tight">
                        Navigate to a patient unit on the monitor to securely retrieve their clinical profile from the central database.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Terminal Status Bar */}
          <div className="h-10 bg-[#0a0d14] border-t border-white/5 flex items-center justify-between px-8 shrink-0">
             <div className="flex items-center gap-6">
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 italic">
                   <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_5px_#6366f1]" /> 
                   Terminal_A32.Secure
                </span>
                <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest border-l border-white/5 pl-6">
                   Vignette_ID: {activeVignette?.id?.substring(0,8) || 'N/A'}
                </span>
             </div>
             <div className="flex items-center gap-2">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                <span className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Hi-Def Interface v2.5</span>
             </div>
          </div>
        </section>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #312e81;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4338ca;
        }
      `}</style>
    </div>
  );
}
