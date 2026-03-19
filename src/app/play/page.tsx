'use client';
export const dynamic = 'force-dynamic';
import dynamicNext from 'next/dynamic';
import { Suspense, useState, useEffect } from 'react';
import { 
  Stethoscope, LogOut, Users, Activity, 
  Scroll, Radio, Settings, Hammer, 
  ShieldAlert, UserSearch, ClipboardList
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
        setActiveTab('patient'); // Auto-switch to dossier when clicking patient
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
              text: `Dr. ${id.substring(0, 4)} is operating nearby...`,
              type: 'info'
            });
          }
        }
      });
      if (newFeedEntries.length > 0) {
        setWardFeed(prev => [...newFeedEntries, ...prev].slice(0, 8));
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
      text: isCorrect ? `SUCCESS: Patient ${activeVignette.id.substring(0,4)} cured.` : `NOTICE: Patient ${activeVignette.id.substring(0,4)} discharged.`,
      type: isCorrect ? 'success' : 'info'
    }, ...prev]);

    if (auth?.currentUser) {
      await saveGameStats(auth.currentUser.uid, { xp: isCorrect ? 50 : 10, score: isCorrect ? 100 : 0, correct: isCorrect });
    }
    handleClosePatient();
  };

  return (
    <div className="flex flex-col h-screen bg-[#1a1410] text-[#d4c3a1] overflow-hidden font-serif selection:bg-amber-900 selection:text-amber-100">
      
      {/* Steampunk Header */}
      <header className="h-20 border-b-4 border-[#3d2b1f] bg-[#2a1f18] px-8 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.5)] z-20 relative">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/leather.png')]" />
        
        <div className="flex items-center gap-8 relative">
          <div className="flex items-center gap-4 group cursor-default">
            <div className="p-2 rounded-full bg-[#3d2b1f] border-2 border-[#8b5a2b] shadow-[0_0_15px_rgba(139,90,43,0.3)] group-hover:rotate-45 transition-transform duration-500">
              <Hammer className="h-8 w-8 text-[#cd7f32]" />
            </div>
            <div>
              <h1 className="font-black text-2xl tracking-tighter text-[#cd7f32] uppercase italic">Antics <span className="text-[#8b5a2b]">M.D.</span></h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5d4037]">Royal Infirmary • Steam-District</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-6 border-l border-[#3d2b1f] pl-8 h-10">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-[#8b5a2b]">Steam Pressure</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-32 bg-[#1a1410] rounded-full overflow-hidden border border-[#3d2b1f]">
                  <div className="h-full bg-gradient-to-r from-amber-900 to-amber-500 w-[92%]" />
                </div>
                <span className="text-xs font-mono">92%</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6 relative">
          <div className="bg-[#1a1410] px-5 py-2 rounded-lg border-2 border-[#3d2b1f] flex flex-col items-end shadow-inner">
            <span className="text-[9px] uppercase font-bold text-[#8b5a2b]">Senior Chirurgeon</span>
            <span className="text-sm font-bold text-[#cd7f32] tracking-wide uppercase">Dr. {auth?.currentUser?.displayName?.split(' ')[0] || 'Resident'}</span>
          </div>
          <Link href="/" className="p-3 bg-[#3d2b1f] border-2 border-[#8b5a2b] hover:bg-[#4d3b2f] rounded-lg transition-all text-[#cd7f32] hover:shadow-[0_0_15px_rgba(205,127,50,0.4)] group">
            <LogOut className="h-6 w-6 group-hover:scale-110 transition-transform" />
          </Link>
        </div>
      </header>

      {/* Main Split Layout */}
      <main className="flex-1 flex overflow-hidden p-4 gap-4 relative">
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/pinstripe.png')]" />

        {/* Left: The Aether-Scope (Phaser Game) */}
        <section className="flex-[3] flex flex-col relative rounded-2xl overflow-hidden border-8 border-[#3d2b1f] bg-[#0c0907] shadow-[0_0_50px_rgba(0,0,0,0.8)]">
          <div className="absolute inset-0 pointer-events-none z-10 border-[20px] border-transparent shadow-[inset_0_0_100px_rgba(0,0,0,0.9)]" />
          
          {/* Decorative Corner Bolts */}
          <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-[#8b5a2b] border-2 border-[#3d2b1f] shadow-lg z-20" />
          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#8b5a2b] border-2 border-[#3d2b1f] shadow-lg z-20" />
          <div className="absolute bottom-2 left-2 w-4 h-4 rounded-full bg-[#8b5a2b] border-2 border-[#3d2b1f] shadow-lg z-20" />
          <div className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-[#8b5a2b] border-2 border-[#3d2b1f] shadow-lg z-20" />

          <div className="flex-1 flex items-center justify-center bg-black">
            <Suspense fallback={<div className="text-amber-600 animate-pulse font-bold tracking-[0.5em] uppercase">Initializing Aether-Scope...</div>}>
              <GameCanvas />
            </Suspense>
          </div>
          
          {/* Manual / Instructions footer */}
          <div className="h-10 bg-[#2a1f18] border-t-2 border-[#3d2b1f] flex items-center justify-center text-[10px] uppercase font-bold tracking-widest text-[#8b5a2b]">
            Use [WASD] to navigate the steam-ward • Approach Patients to engage
          </div>
        </section>

        {/* Right: The Officer's Ledger (Content Panel) */}
        <section className="flex-[2] flex flex-col bg-[#e6d5b8] rounded-2xl border-8 border-[#3d2b1f] shadow-[10px_10px_30px_rgba(0,0,0,0.4)] overflow-hidden">
          
          {/* Tab Navigation */}
          <div className="flex bg-[#2a1f18] border-b-4 border-[#3d2b1f]">
            <button 
              onClick={() => setActiveTab('feed')}
              className={`flex-1 py-4 flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'feed' ? 'bg-[#e6d5b8] text-[#1a1410] rounded-tr-3xl' : 'text-[#8b5a2b] hover:text-[#cd7f32]'}`}
            >
              <Radio className="h-4 w-4" />
              Ward Telegrams
            </button>
            <button 
              onClick={() => setActiveTab('patient')}
              className={`flex-1 py-4 flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'patient' ? 'bg-[#e6d5b8] text-[#1a1410] rounded-tl-3xl' : 'text-[#8b5a2b] hover:text-[#cd7f32]'}`}
            >
              <Scroll className="h-4 w-4" />
              Patient Dossier
            </button>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden relative p-8">
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
            
            <AnimatePresence mode="wait">
              {activeTab === 'feed' ? (
                <motion.div 
                  key="feed"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 flex flex-col gap-6"
                >
                  <div className="border-b-2 border-[#1a1410]/20 pb-4">
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-[#2a1f18] italic">Station Logs</h2>
                    <p className="text-[10px] font-bold text-[#8b5a2b] uppercase tracking-widest">Incoming Morse Communication</p>
                  </div>
                  
                  <div className="flex-1 space-y-4 overflow-y-auto pr-4 custom-scrollbar">
                    {wardFeed.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center opacity-30 italic">
                        <Radio className="h-12 w-12 mb-4" />
                        <p>Awaiting Signal...</p>
                      </div>
                    ) : (
                      wardFeed.map((item) => (
                        <div key={item.id} className="bg-white/50 border border-[#1a1410]/10 p-4 rounded-xl shadow-sm relative group overflow-hidden">
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.type === 'success' ? 'bg-green-700' : 'bg-amber-700'}`} />
                          <p className="text-sm font-bold text-slate-800 leading-tight">
                            <span className="opacity-40 mr-2">[{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}]</span>
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
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 italic px-10">
                      <UserSearch className="h-16 w-16 mb-6" />
                      <h3 className="text-xl font-bold uppercase mb-2">No Active Dossier</h3>
                      <p className="text-sm">Please identify and engage a patient within the infirmary to retrieve their clinical records.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Ledger Footer */}
          <div className="bg-[#2a1f18] p-4 flex items-center justify-between border-t-4 border-[#3d2b1f]">
            <div className="flex gap-4">
               <ShieldAlert className="h-5 w-5 text-red-700" />
               <ClipboardList className="h-5 w-5 text-amber-700" />
            </div>
            <span className="text-[10px] font-bold text-[#8b5a2b] uppercase tracking-tighter">Imperial Medical Ledger v1.8</span>
          </div>
        </section>
      </main>

      {/* Global CSS for scrollbars */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3d2b1f;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
