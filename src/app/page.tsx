'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Stethoscope, User, Play, Plus } from 'lucide-react';

export default function Home() {
  const [name, setName] = useState('');

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col items-center justify-center p-6 font-sans selection:bg-indigo-200">
      
      {/* Title Area */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-4 bg-white border-4 border-slate-900 p-6 rounded-3xl shadow-[8px_8px_0_0_#1e293b]">
           <Stethoscope className="h-12 w-12 text-indigo-600" />
           <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic">Antics MD</h1>
        </div>
        <p className="mt-4 text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Multiplayer Clinical Rounds</p>
      </div>

      {/* Main Container: Chunky Modal */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white border-4 border-slate-900 rounded-[2.5rem] shadow-[12px_12px_0_0_#1e293b] p-10 space-y-8 overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 p-6 opacity-[0.05] pointer-events-none">
           <Stethoscope className="h-32 w-32 text-indigo-900" />
        </div>

        {/* Avatar Placeholder: Chunky Circle */}
        <div className="flex justify-center">
          <div className="h-32 w-32 bg-slate-100 border-4 border-slate-900 rounded-full flex items-center justify-center relative shadow-[inset_0_4px_10px_rgba(0,0,0,0.1)]">
             <User className="h-16 w-16 text-slate-400" />
             <div className="absolute bottom-0 right-0 bg-indigo-600 border-4 border-slate-900 rounded-full p-2 text-white">
                <Plus className="h-4 w-4" />
             </div>
          </div>
        </div>

        {/* Input Field: Chunky Border */}
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Physician Name..."
            className="w-full h-16 bg-slate-50 border-4 border-slate-900 rounded-2xl px-6 text-xl font-bold placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all text-slate-900"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Action Buttons: Chunky Rounded Borders */}
        <div className="space-y-4">
          <button 
            onClick={() => {
              if (name) {
                localStorage.setItem('physician_name', name);
                window.location.href = '/play';
              }
            }}
            className={`w-full h-20 bg-[#6366f1] text-white flex items-center justify-center gap-4 border-4 border-slate-900 rounded-2xl text-2xl font-black uppercase tracking-widest shadow-[0_6px_0_0_#312e81] hover:shadow-[0_2px_0_0_#312e81] hover:translate-y-1 transition-all active:shadow-none active:translate-y-1.5 ${!name ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <Play className="h-8 w-8 fill-current" />
            Establish rounds
          </button>

          <button className="w-full h-14 bg-emerald-500 text-white flex items-center justify-center gap-2 border-4 border-slate-900 rounded-2xl text-base font-black uppercase tracking-widest shadow-[0_4px_0_0_#065f46] hover:shadow-[0_2px_0_0_#065f46] hover:translate-y-0.5 transition-all">
            Private Unit
          </button>
        </div>
      </motion.div>

      {/* Footer Info */}
      <div className="mt-12 text-slate-400 font-black text-[10px] uppercase tracking-widest flex gap-8">
         <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-[#6366f1]" /> 12 Rounds Active</div>
         <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-emerald-500" /> Server Node_04</div>
      </div>
    </div>
  );
}
