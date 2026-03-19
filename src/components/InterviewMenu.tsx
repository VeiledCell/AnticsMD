'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, User, Thermometer, Heart, Activity, 
  Droplets, ClipboardCheck, Stethoscope, Wind,
  FileText, AlertCircle, Info
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
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Dossier Header */}
      <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded tracking-widest uppercase">Clinical Dossier</span>
            <span className="text-slate-400 text-[10px] font-bold">UID: {vignette.id.substring(0, 8)}</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            {vignette.age}y {vignette.gender} • <span className="text-blue-600 font-medium">{vignette.chiefComplaint}</span>
          </h2>
        </div>
        {!isEmbedded && (
           <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400">
             <X className="h-5 w-5" />
           </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-10 custom-scrollbar">
        {/* Case Presentation (MedQA Paragraph) */}
        <section>
          <div className="flex items-center gap-2 mb-4">
             <div className="h-6 w-1 bg-blue-600 rounded-full" />
             <h4 className="font-bold text-xs uppercase tracking-widest text-slate-500">Clinical Presentation</h4>
          </div>
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
             <p className="text-slate-700 text-[16px] leading-relaxed font-normal italic">
                {vignette.fullVignette || vignette.hpi.join(' ')}
             </p>
          </div>
        </section>

        {/* Vital Signs */}
        <section>
          <div className="flex items-center gap-2 mb-4">
             <div className="h-6 w-1 bg-red-500 rounded-full" />
             <h4 className="font-bold text-xs uppercase tracking-widest text-slate-500">Objective Vital Signs</h4>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <VitalRow icon={<Thermometer className="h-4 w-4 text-red-500" />} label="Temperature" value={`${vignette.vitals.temp}°F`} />
            <VitalRow icon={<Heart className="h-4 w-4 text-pink-500" />} label="Heart Rate" value={`${vignette.vitals.hr} bpm`} />
            <VitalRow icon={<Droplets className="h-4 w-4 text-blue-500" />} label="Blood Pressure" value={vignette.vitals.bp} />
            <VitalRow icon={<Wind className="h-4 w-4 text-cyan-500" />} label="Resp. Rate" value={`${vignette.vitals.rr || 16}/m`} />
            <VitalRow icon={<Activity className="h-4 w-4 text-emerald-500" />} label="SpO2" value={`${vignette.vitals.spo2}%`} />
          </div>
        </section>

        {/* Examination Findings */}
        <section>
          <div className="flex items-center gap-2 mb-4">
             <div className="h-6 w-1 bg-emerald-500 rounded-full" />
             <h4 className="font-bold text-xs uppercase tracking-widest text-slate-500">Physical Examination</h4>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl text-[15px] text-slate-700 leading-relaxed">
            {vignette.physicalExam}
          </div>
        </section>

        {/* Diagnosis Selection */}
        <section className="pt-6 border-t border-slate-100 pb-12">
          <div className="flex items-center gap-2 mb-6 text-slate-800">
            <ClipboardCheck className="h-5 w-5 text-blue-600" />
            <h4 className="font-bold text-sm">Finalize Clinical Chart</h4>
          </div>
          
          <div className="grid gap-3 mb-8">
            {allDiagnoses.map((dx) => (
              <button
                key={dx}
                onClick={() => setSelectedDiagnosis(dx)}
                className={`w-full p-4 text-left rounded-xl border transition-all flex items-center justify-between group ${
                  selectedDiagnosis === dx 
                  ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-600' 
                  : 'border-slate-200 bg-white hover:border-blue-300 text-slate-700'
                }`}
              >
                <span className={`text-sm ${selectedDiagnosis === dx ? 'font-bold text-blue-700' : 'font-medium'}`}>{dx}</span>
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedDiagnosis === dx ? 'border-blue-600 bg-blue-600' : 'border-slate-200 group-hover:border-blue-300'}`}>
                   {selectedDiagnosis === dx && <div className="h-2 w-2 rounded-full bg-white" />}
                </div>
              </button>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 mb-6">
             <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
             <p className="text-[12px] text-amber-800 leading-snug">
                Submit medical findings to the ward attending. Once submitted, the clinical chart is locked and the patient will be transferred for treatment.
             </p>
          </div>

          <button
            onClick={handleChartSubmit}
            disabled={!selectedDiagnosis}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-30 disabled:shadow-none transition-all flex items-center justify-center gap-2"
          >
            <FileText className="h-5 w-5" />
            Submit Final Assessment
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
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
    >
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
        {content}
      </div>
    </motion.div>
  );
}

function VitalRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm flex flex-col gap-1.5 hover:border-slate-300 transition-colors">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-base font-black text-slate-800 leading-none">{value}</p>
    </div>
  );
}
