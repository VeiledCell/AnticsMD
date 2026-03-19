'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, User, Thermometer, Heart, Activity, 
  Droplets, ClipboardCheck, Stethoscope, Wind,
  FileText, AlertCircle, Info, ChevronRight
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

  const handleChartSubmit = () => {
    if (selectedDiagnosis) {
      onSubmit(selectedDiagnosis);
    }
  };

  const allDiagnoses = [vignette.correctDiagnosis, ...vignette.differential].sort();

  const content = (
    <div className="flex-1 flex flex-col overflow-hidden bg-white text-slate-900">
      {/* Dossier Header: Simplified Chunky */}
      <div className="px-6 py-5 border-b-4 border-slate-900 bg-indigo-50 flex justify-between items-start shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1 text-[10px] font-black uppercase text-indigo-600 tracking-widest">
            <div className="h-2 w-2 rounded-full bg-indigo-600" /> Patient Dossier
          </div>
          <h2 className="text-xl font-black text-slate-900 uppercase italic">
            {vignette.age}y {vignette.gender} • {vignette.chiefComplaint}
          </h2>
        </div>
        {!isEmbedded && (
           <button onClick={onClose} className="bg-white border-2 border-slate-900 p-1 rounded-lg hover:bg-slate-50 transition-all shadow-[2px_2px_0_0_#1e293b]">
             <X className="h-4 w-4" />
           </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 custom-scrollbar">
        {/* Presentation: High Legibility */}
        <section>
          <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-3 italic">Clinical Presentation</h4>
          <div className="bg-slate-50 border-2 border-slate-900 p-5 rounded-2xl shadow-[4px_4px_0_0_#1e293b]">
             <p className="text-slate-700 text-sm font-bold leading-relaxed italic">
                "{vignette.fullVignette || vignette.hpi.join(' ')}"
             </p>
          </div>
        </section>

        {/* Vitals: Grid */}
        <section>
          <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-3 italic">Vital Signs</h4>
          <div className="grid grid-cols-2 gap-3">
            <VitalCard label="Temp" value={`${vignette.vitals.temp}°F`} />
            <VitalCard label="HR" value={`${vignette.vitals.hr} bpm`} />
            <VitalCard label="BP" value={vignette.vitals.bp} />
            <VitalCard label="SpO2" value={`${vignette.vitals.spo2}%`} />
          </div>
        </section>

        {/* Physical Exam */}
        <section>
          <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-3 italic">Examination Findings</h4>
          <div className="bg-white border-2 border-slate-900 p-5 rounded-2xl text-sm font-bold text-slate-600 leading-relaxed">
            {vignette.physicalExam}
          </div>
        </section>

        {/* Selection */}
        <section className="pt-6 border-t-4 border-slate-900 pb-10">
          <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-indigo-600 mb-4 italic">Finalize Admission</h4>
          <div className="grid gap-2 mb-6">
            {allDiagnoses.map((dx) => (
              <button
                key={dx}
                onClick={() => setSelectedDiagnosis(dx)}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all flex items-center justify-between group ${
                  selectedDiagnosis === dx 
                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-[4px_4px_0_0_#312e81]' 
                  : 'border-slate-900 bg-white hover:bg-slate-50 text-slate-700 active:translate-y-0.5'
                }`}
              >
                <span className="text-xs font-black uppercase tracking-tight">{dx}</span>
                {selectedDiagnosis === dx && <div className="h-2 w-2 rounded-full bg-white animate-pulse" />}
              </button>
            ))}
          </div>

          <button
            onClick={handleChartSubmit}
            disabled={!selectedDiagnosis}
            className="w-full h-16 bg-[#6366f1] text-white flex items-center justify-center gap-3 border-4 border-slate-900 rounded-2xl text-lg font-black uppercase tracking-widest shadow-[0_4px_0_0_#312e81] hover:shadow-[0_2px_0_0_#312e81] hover:translate-y-0.5 transition-all disabled:opacity-20 active:translate-y-1 active:shadow-none"
          >
            Submit Chart
            <ChevronRight className="h-5 w-5" />
          </button>
        </section>
      </div>
    </div>
  );

  if (isEmbedded) return content;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md"
    >
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-[2.5rem] shadow-[12px_12px_0_0_#1e293b] overflow-hidden flex flex-col border-4 border-slate-900">
        {content}
      </div>
    </motion.div>
  );
}

function VitalCard({ label, value }: { label: string, value: string }) {
  return (
    <div className="p-3 bg-white border-2 border-slate-900 rounded-xl shadow-[2px_2px_0_0_#1e293b] flex flex-col gap-1">
      <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">{label}</p>
      <p className="text-sm font-black text-slate-900 italic">{value}</p>
    </div>
  );
}
