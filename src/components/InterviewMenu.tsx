'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Send, User, Thermometer, Heart, Activity, 
  Droplets, ClipboardCheck, Stethoscope, Wind,
  Search, FileText, AlertCircle, Bookmark
} from 'lucide-react';
import { ClinicalVignette } from '@/types';

interface InterviewMenuProps {
  vignette: ClinicalVignette;
  onClose: () => void;
  onSubmit: (diagnosis: string) => void;
  isEmbedded?: boolean;
}

export default function InterviewMenu({ vignette, onClose, onSubmit, isEmbedded = false }: InterviewMenuProps) {
  const [selectedDiagnosis, setSelectedDiagnosis] = useState('');
  const [deepInquiry, setDeepInquiry] = useState('');

  const handleChartSubmit = () => {
    if (selectedDiagnosis) {
      onSubmit(selectedDiagnosis);
    }
  };

  const allDiagnoses = [vignette.correctDiagnosis, ...vignette.differential].sort();

  const content = (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Patient Profile Header */}
      <div className="border-b-2 border-[#1a1410]/20 pb-4 mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-[#2a1f18] italic flex items-center gap-3">
            <Bookmark className="h-6 w-6 text-[#8b5a2b]" />
            Dossier: #{vignette.id.substring(0, 5)}
          </h2>
          <p className="text-sm font-bold text-[#8b5a2b] uppercase tracking-widest mt-1">
            {vignette.age}yr {vignette.gender} • <span className="text-red-900">{vignette.chiefComplaint}</span>
          </p>
        </div>
        {!isEmbedded && (
           <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
             <X className="h-6 w-6 text-[#1a1410]" />
           </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-8">
        {/* Case Presentation */}
        <section>
          <div className="flex items-center gap-2 mb-3 text-[#1a1410] opacity-60">
            <FileText className="h-4 w-4" />
            <h4 className="font-bold uppercase text-[10px] tracking-[0.2em]">Clinical Presentation</h4>
          </div>
          <div className="bg-white/40 p-6 rounded-xl border border-[#1a1410]/10 italic leading-relaxed text-[#2a1f18] font-serif shadow-inner">
             {vignette.fullVignette || vignette.hpi.join(' ')}
          </div>
        </section>

        {/* Vitals Grid */}
        <section>
          <div className="flex items-center gap-2 mb-3 text-[#1a1410] opacity-60">
            <Activity className="h-4 w-4" />
            <h4 className="font-bold uppercase text-[10px] tracking-[0.2em]">Objective Vitals</h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <VitalCard icon={<Thermometer className="h-4 w-4" />} label="Temp" value={`${vignette.vitals.temp}°F`} />
            <VitalCard icon={<Heart className="h-4 w-4" />} label="Pulse" value={`${vignette.vitals.hr} bpm`} />
            <VitalCard icon={<Droplets className="h-4 w-4" />} label="Pressure" value={vignette.vitals.bp} />
            <VitalCard icon={<Wind className="h-4 w-4" />} label="Resp" value={`${vignette.vitals.rr || 16}/m`} />
          </div>
        </section>

        {/* Physical Exam */}
        <section>
          <div className="flex items-center gap-2 mb-3 text-[#1a1410] opacity-60">
            <Stethoscope className="h-4 w-4" />
            <h4 className="font-bold uppercase text-[10px] tracking-[0.2em]">Examination Findings</h4>
          </div>
          <div className="bg-[#1a1410]/5 p-5 rounded-xl border border-[#1a1410]/10 text-sm text-[#2a1f18] font-medium leading-loose">
            {vignette.physicalExam}
          </div>
        </section>

        {/* Diagnostic Action */}
        <section className="pt-4 border-t-2 border-[#1a1410]/10 pb-10">
          <div className="flex items-center gap-2 mb-4 text-[#8b5a2b]">
            <ClipboardCheck className="h-5 w-5" />
            <h4 className="font-bold uppercase text-xs tracking-widest">Final Diagnosis Selection</h4>
          </div>
          
          <div className="grid gap-2">
            {allDiagnoses.map((dx) => (
              <button
                key={dx}
                onClick={() => setSelectedDiagnosis(dx)}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                  selectedDiagnosis === dx 
                  ? 'border-[#8b5a2b] bg-[#3d2b1f] text-[#e6d5b8] shadow-lg' 
                  : 'border-[#1a1410]/10 bg-white/50 hover:bg-white/80 text-[#2a1f18]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${selectedDiagnosis === dx ? 'font-bold' : 'font-medium'}`}>{dx}</span>
                  {selectedDiagnosis === dx && <div className="h-2 w-2 rounded-full bg-[#cd7f32] shadow-[0_0_5px_#cd7f32]" />}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleChartSubmit}
            disabled={!selectedDiagnosis}
            className="w-full mt-6 bg-[#2a1f18] text-[#cd7f32] font-black py-4 rounded-xl shadow-xl hover:bg-[#3d2b1f] disabled:opacity-20 disabled:grayscale transition-all uppercase tracking-[0.2em] text-xs border-b-4 border-black"
          >
            Submit Clinical Chart
          </button>
        </section>
      </div>
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 50 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a1410]/80 backdrop-blur-md"
    >
      <div className="bg-[#e6d5b8] w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border-8 border-[#3d2b1f] overflow-hidden p-8 flex flex-col relative">
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
        {content}
      </div>
    </motion.div>
  );
}

function VitalCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="p-4 rounded-xl bg-white/40 border border-[#1a1410]/10 flex items-center gap-4 shadow-sm group hover:bg-white/60 transition-colors">
      <div className="h-10 w-10 rounded-lg bg-[#3d2b1f] flex items-center justify-center text-[#cd7f32] shadow-inner group-hover:rotate-6 transition-transform">
        {icon}
      </div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest text-[#8b5a2b] mb-0.5">{label}</p>
        <p className="text-base font-black text-[#1a1410] tracking-tight">{value}</p>
      </div>
    </div>
  );
}
