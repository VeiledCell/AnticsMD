'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Stethoscope, Activity, Users, ShieldCheck, ChevronRight, Lock } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Navigation */}
      <nav className="p-6 flex justify-between items-center bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-xl shadow-lg shadow-blue-200">
            <Stethoscope className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">Antics MD</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/about" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors">Documentation</Link>
          <Link href="/play" className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center gap-2">
            Clinical Portal
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
             <Activity className="h-3 w-3" />
             Next-Gen Clinical Simulation
          </div>
          
          <h1 className="text-6xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9]">
            Master the Art of <br />
            <span className="text-blue-600 italic">Competitive Medicine.</span>
          </h1>
          
          <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed pt-4">
            A high-stakes multiplayer hospital simulator designed for rapid clinical reasoning and unit management. Identify, diagnose, and treat patients in a live environment.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link href="/play" className="group w-full sm:w-auto bg-blue-600 text-white px-10 py-5 rounded-2xl text-lg font-black shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
              Establish Connection
              <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="w-full sm:w-auto bg-white text-slate-600 border border-slate-200 px-10 py-5 rounded-2xl text-lg font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
              <Lock className="h-5 w-5 opacity-40" />
              Administrative Login
            </button>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-32 w-full text-left">
          <FeatureCard 
            icon={<Users className="h-6 w-6 text-blue-600" />}
            title="Multiplayer Rounds"
            description="Collaborate or compete with other residents in a live, synchronized hospital ward environment."
          />
          <FeatureCard 
            icon={<ShieldCheck className="h-6 w-6 text-emerald-600" />}
            title="MedQA Powered"
            description="Tackle authentic USMLE-style vignettes generated from real-world clinical datasets."
          />
          <FeatureCard 
            icon={<Activity className="h-6 w-6 text-red-600" />}
            title="Real-Time Vitality"
            description="Experience dynamic patient states that require immediate observation and intervention."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="p-8 border-t border-slate-200 bg-white text-center">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">© 2026 Antics MD • Imperial Clinical Operations Center • Node_01</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
      <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 border border-slate-100">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed font-medium">{description}</p>
    </div>
  );
}
