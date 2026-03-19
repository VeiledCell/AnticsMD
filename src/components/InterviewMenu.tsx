'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, User, Thermometer, Heart, Activity, 
  Droplets, ClipboardCheck, Stethoscope, Wind,
  FileText, AlertCircle, Info, ChevronRight,
  UserCheck, ShieldAlert
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
      {/* Dossier Header: High Fidelity Blue */}
      <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start shrink-0">
        <div className="flex gap-5 items-center">
          <div className="h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 shrink-0">
             <UserCheck className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-[0.2em]">Patient_Dossier_Verified</span>
              <span className="text-slate-400 text-[10px] font-mono font-bold tracking-widest">{vignette.id.substring(0, 12)}</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">
              {vignette.age}y {vignette.gender} • <span className="text-indigo-600 italic">{vignette.chiefComplaint}</span>
            </h2>
          </div>
        </div>
        {!isEmbedded && (
           <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-all text-slate-400">
             <X className="h-6 w-6" />
           </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10 custom-scrollbar">
        {/* Primary Case History: Professional Typography */}
        <section>
          <div className="flex items-center gap-2 mb-5">
             <FileText className="h-4 w-4 text-indigo-500" />
             <h4 className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400">Clinical Presentation Summary</h4>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-8 rounded-[2rem] shadow-inner relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
                <FileText className="h-24 w-24" />
             </div>
             <p className="text-slate-800 text-[17px] leading-[1.8] font-medium font-serif italic relative z-10 first-letter:text-5xl first-letter:font-black first-letter:text-indigo-600 first-letter:mr-3 first-letter:float-left first-letter:leading-[0.8]">
                {vignette.fullVignette || vignette.hpi.join(' ')}
             </p>
          </div>
        </section>

        {/* Biometrics & Objective Findings */}
        <section>
          <div className="flex items-center gap-2 mb-5">
             <Activity className="h-4 w-4 text-emerald-500" />
             <h4 className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400">Biometric Analysis</h4>
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
            <VitalHex icon={<Thermometer className="h-5 w-5 text-red-500" />} label="Temp" value={`${vignette.vitals.temp}°F`} />
            <VitalHex icon={<Heart className="h-5 w-5 text-pink-500" />} label="Heart Rate" value={`${vignette.vitals.hr} bpm`} />
            <VitalHex icon={<Droplets className="h-5 w-5 text-blue-500" />} label="BP" value={vignette.vitals.bp} />
            <VitalHex icon={<Wind className="h-5 w-5 text-cyan-500" />} label="Resp" value={`${vignette.vitals.rr || 16}/m`} />
            <VitalHex icon={<Activity className="h-5 w-5 text-emerald-500" />} label="SpO2" value={`${vignette.vitals.spo2}%`} />
          </div>
        </section>

        {/* Examination Findings */}
        <section>
          <div className="flex items-center gap-2 mb-5 text-slate-800">
             <Stethoscope className="h-4 w-4 text-indigo-500" />
             <h4 className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400">Physical Examination Report</h4>
          </div>
          <div className="bg-white border-2 border-slate-100 p-8 rounded-[2rem] text-[15px] font-bold text-slate-600 leading-relaxed shadow-sm">
            {vignette.physicalExam}
          </div>
        </section>

        {/* Diagnosis Selection: Terminal Interface */}
        <section className="pt-8 border-t border-slate-100 pb-20">
          <div className="flex items-center gap-3 mb-8 text-slate-900">
            <ClipboardCheck className="h-6 w-6 text-indigo-600" />
            <h4 className="font-black text-xs uppercase tracking-widest italic">Finalize Admission Assessment</h4>
          </div>
          
          <div className="grid gap-3 mb-10">
            {allDiagnoses.map((dx) => (
              <button
                key={dx}
                onClick={() => setSelectedDiagnosis(dx)}
                className={`w-full p-5 text-left rounded-2xl border-2 transition-all flex items-center justify-between group relative overflow-hidden ${
                  selectedDiagnosis === dx 
                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-2xl shadow-indigo-200' 
                  : 'border-slate-100 bg-white hover:border-indigo-200 text-slate-700 hover:translate-x-1'
                }`}
              >
                <div className="flex items-center gap-4 relative z-10">
                   <div className={`h-8 w-8 rounded-xl flex items-center justify-center transition-colors ${selectedDiagnosis === dx ? 'bg-white/20' : 'bg-slate-50 group-hover:bg-indigo-50'}`}>
                      <Info className={`h-4 w-4 ${selectedDiagnosis === dx ? 'text-white' : 'text-slate-400'}`} />
                   </div>
                   <span className={`text-base ${selectedDiagnosis === dx ? 'font-black italic' : 'font-bold'}`}>{dx}</span>
                </div>
                <div className={`h-6 w-6 rounded-full border-4 flex items-center justify-center transition-all relative z-10 ${selectedDiagnosis === dx ? 'border-white bg-white scale-110' : 'border-slate-100 group-hover:border-indigo-100'}`}>
                   {selectedDiagnosis === dx && <div className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />}
                </div>
              </button>
            ))}
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl flex gap-5 items-center mb-8 border border-white/5 shadow-2xl">
             <div className="h-12 w-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center shrink-0">
                <ShieldAlert className="h-6 w-6 text-indigo-500" />
             </div>
             <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest">
                Warning: Submission of this chart will finalize the patient state. Ensure all biometric data correlates with chosen diagnosis.
             </p>
          </div>

          <button
            onClick={handleChartSubmit}
            disabled={!selectedDiagnosis}
            className="w-full bg-indigo-600 text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-20 disabled:shadow-none transition-all flex items-center justify-center gap-3 active:scale-[0.98] group"
          >
            <span className="text-lg uppercase tracking-widest">Commit Clinical Analysis</span>
            <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </section>
      </div>
    </div>
  );

  if (isEmbedded) return content;

  return (
    <motion.div
      initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
      animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
      exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
      className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-[#05070a]/60"
    >
      <div className="bg-white w-full max-w-5xl max-h-[92vh] rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col border border-white/10">
        {content}
      </div>
    </motion.div>
  );
}

function VitalHex({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="p-5 rounded-[2rem] bg-white border border-slate-100 shadow-sm flex flex-col gap-3 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-slate-50 group-hover:bg-indigo-50 transition-colors">
           {icon}
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</span>
      </div>
      <p className="text-2xl font-black text-slate-900 leading-none tracking-tighter italic">{value}</p>
    </div>
  );
}
