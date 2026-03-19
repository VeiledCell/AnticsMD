'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Send, User, Thermometer, Heart, Activity, 
  Droplets, ClipboardCheck, Stethoscope, Wind,
  MessageSquare, Search, FileText, AlertCircle
} from 'lucide-react';
import { ClinicalVignette } from '@/types';

interface InterviewMenuProps {
  vignette: ClinicalVignette;
  onClose: () => void;
  onSubmit: (diagnosis: string) => void;
}

export default function InterviewMenu({ vignette, onClose, onSubmit }: InterviewMenuProps) {
  const [selectedDiagnosis, setSelectedDiagnosis] = useState('');
  const [deepInquiry, setDeepInquiry] = useState('');

  const handleChartSubmit = () => {
    if (selectedDiagnosis) {
      onSubmit(selectedDiagnosis);
    }
  };

  const allDiagnoses = [vignette.correctDiagnosis, ...vignette.differential].sort();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 50 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-50 w-full max-w-6xl max-h-[90vh] rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col">
        {/* Modern Clinical Header */}
        <div className="bg-white border-b px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="h-14 w-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-200">
              <User className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-slate-800">Room #402 • Patient File</h3>
                <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Active Rounding</span>
              </div>
              <p className="text-slate-500 font-medium flex items-center gap-2">
                {vignette.age}y {vignette.gender} • <span className="text-blue-600">{vignette.chiefComplaint}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400 uppercase font-bold tracking-tight">Assigned Physician</p>
              <p className="text-sm font-semibold text-slate-700">Dr. Resident (You)</p>
            </div>
            <button 
              onClick={onClose}
              className="hover:bg-slate-100 p-2 rounded-xl transition-all text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Column 1: Case History (The MedQA Paragraph) */}
          <div className="w-full md:w-1/2 border-r bg-white p-8 overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-2 mb-6 text-blue-600">
              <FileText className="h-5 w-5" />
              <h4 className="font-bold uppercase text-xs tracking-widest">Clinical Presentation</h4>
            </div>
            
            {/* The Dense Paragraph */}
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-700 text-lg leading-relaxed font-serif first-letter:text-4xl first-letter:font-bold first-letter:text-blue-600 first-letter:mr-1 first-letter:float-left">
                {vignette.fullVignette || vignette.hpi.join(' ')}
              </p>
            </div>

            <div className="mt-10 pt-8 border-t">
              <div className="flex items-center gap-2 mb-4 text-slate-700">
                <Search className="h-5 w-5" />
                <h4 className="font-bold uppercase text-xs tracking-widest text-slate-500">Deep Inquiry (AI Chat)</h4>
              </div>
              <div className="relative group">
                <textarea
                  placeholder="Ask for more specific details not mentioned in the stem..."
                  className="w-full h-24 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                  value={deepInquiry}
                  onChange={(e) => setDeepInquiry(e.target.value)}
                />
                <button className="absolute bottom-3 right-3 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl shadow-lg shadow-blue-200 transition-all">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Column 2: Objective Data */}
          <div className="w-full md:w-1/4 p-6 overflow-y-auto bg-slate-50/50 border-r">
            {/* Vitals Grid */}
            <div className="flex items-center gap-2 mb-4 text-red-600">
              <Activity className="h-5 w-5" />
              <h4 className="font-bold uppercase text-xs tracking-widest">Objective Vitals</h4>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
              <VitalCard icon={<Thermometer className="h-4 w-4 text-red-500" />} label="Temp" value={`${vignette.vitals.temp}°F`} color="red" />
              <VitalCard icon={<Heart className="h-4 w-4 text-pink-500" />} label="HR" value={`${vignette.vitals.hr} bpm`} color="pink" />
              <VitalCard icon={<Droplets className="h-4 w-4 text-blue-500" />} label="BP" value={vignette.vitals.bp} color="blue" />
              <VitalCard icon={<Wind className="h-4 w-4 text-cyan-500" />} label="RR" value={`${vignette.vitals.rr || 16} /m`} color="cyan" />
              <VitalCard icon={<Activity className="h-4 w-4 text-green-500" />} label="SpO2" value={`${vignette.vitals.spo2}%`} color="green" />
            </div>

            {/* Physical Exam */}
            <div className="flex items-center gap-2 mb-4 text-emerald-600">
              <Stethoscope className="h-5 w-5" />
              <h4 className="font-bold uppercase text-xs tracking-widest">Physical Examination</h4>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <p className="text-slate-700 text-[15px] leading-loose whitespace-pre-wrap">
                {vignette.physicalExam}
              </p>
            </div>

            {/* Potential Labs/Imaging placeholder */}
            <div className="mt-6 flex gap-4">
              <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border border-slate-200">
                Order Labs
              </button>
              <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border border-slate-200">
                Imaging (STAT)
              </button>
            </div>
          </div>

          {/* Column 3: Diagnostic Chart (Action) */}
          <div className="w-full md:w-1/4 bg-slate-100/80 p-6 border-l flex flex-col">
            <div className="flex items-center gap-2 mb-6 text-amber-600">
              <ClipboardCheck className="h-6 w-6" />
              <h4 className="font-bold uppercase text-xs tracking-widest">Clinical Chart</h4>
            </div>
            
            <p className="text-xs text-slate-500 font-bold mb-4 uppercase tracking-tight">Primary Diagnosis</p>
            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {allDiagnoses.map((dx) => (
                <button
                  key={dx}
                  onClick={() => setSelectedDiagnosis(dx)}
                  className={`w-full p-4 text-left rounded-2xl border-2 transition-all group ${
                    selectedDiagnosis === dx 
                    ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-100' 
                    : 'border-white bg-white hover:border-blue-200 text-slate-700 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${selectedDiagnosis === dx ? 'font-bold' : 'font-medium'}`}>{dx}</span>
                    <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${selectedDiagnosis === dx ? 'border-white bg-white' : 'border-slate-200 group-hover:border-blue-300'}`}>
                      {selectedDiagnosis === dx && <div className="h-2 w-2 rounded-full bg-blue-600" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-4">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                <p className="text-[11px] text-amber-800 leading-tight">
                  Submission will lock this chart and transfer the patient. Ensure diagnosis is supported by findings.
                </p>
              </div>
              <button
                onClick={handleChartSubmit}
                disabled={!selectedDiagnosis}
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <FileText className="h-5 w-5" />
                Finalize Chart
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function VitalCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
  const colorMap: Record<string, string> = {
    red: 'bg-red-50 text-red-700 border-red-100',
    pink: 'bg-pink-50 text-pink-700 border-pink-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-100',
    green: 'bg-green-50 text-green-700 border-green-100',
  };

  return (
    <div className={`p-3 rounded-2xl border flex flex-col gap-1 ${colorMap[color] || 'bg-white'}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[10px] font-bold uppercase opacity-60">{label}</span>
      </div>
      <p className="text-lg font-black tracking-tight leading-none pt-1">{value}</p>
    </div>
  );
}
