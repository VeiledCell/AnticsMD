'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, Thermometer, Heart, Activity, Droplets } from 'lucide-react';
import { ClinicalVignette } from '@/types';

interface InterviewMenuProps {
  vignette: ClinicalVignette;
  onClose: () => void;
}

export default function InterviewMenu({ vignette, onClose }: InterviewMenuProps) {
  const [activeTab, setActiveTab] = useState<'hpi' | 'vitals' | 'exam'>('hpi');
  const [deepInquiry, setDeepInquiry] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50"
    >
      {/* Header */}
      <div className="bg-blue-600 p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold">Patient Room: #402</h3>
            <p className="text-xs text-blue-100">{vignette.age}y {vignette.gender} • {vignette.chiefComplaint}</p>
          </div>
        </div>
        <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-full transition-colors">
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b text-sm font-medium">
        <button
          onClick={() => setActiveTab('hpi')}
          className={`flex-1 py-3 px-4 ${activeTab === 'hpi' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
        >
          Interview (HPI)
        </button>
        <button
          onClick={() => setActiveTab('vitals')}
          className={`flex-1 py-3 px-4 ${activeTab === 'vitals' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
        >
          Vitals
        </button>
        <button
          onClick={() => setActiveTab('exam')}
          className={`flex-1 py-3 px-4 ${activeTab === 'exam' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
        >
          Physical Exam
        </button>
      </div>

      {/* Content */}
      <div className="h-[300px] overflow-y-auto p-6 bg-gray-50">
        {activeTab === 'hpi' && (
          <div className="space-y-4">
            {vignette.hpi.map((line, i) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={i}
                className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 italic text-sm text-gray-700"
              >
                "{line}"
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === 'vitals' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border flex items-center gap-3">
              <Thermometer className="text-red-500" />
              <div>
                <p className="text-xs text-gray-500 uppercase">Temp</p>
                <p className="font-bold">{vignette.vitals.temp}°F</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border flex items-center gap-3">
              <Heart className="text-pink-500" />
              <div>
                <p className="text-xs text-gray-500 uppercase">Heart Rate</p>
                <p className="font-bold">{vignette.vitals.hr} bpm</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border flex items-center gap-3">
              <Droplets className="text-blue-500" />
              <div>
                <p className="text-xs text-gray-500 uppercase">Blood Pressure</p>
                <p className="font-bold">{vignette.vitals.bp}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border flex items-center gap-3">
              <Activity className="text-green-500" />
              <div>
                <p className="text-xs text-gray-500 uppercase">SpO2</p>
                <p className="font-bold">{vignette.vitals.spo2}%</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'exam' && (
          <div className="bg-white p-4 rounded-xl border">
            <p className="text-sm text-gray-700 leading-relaxed">{vignette.physicalExam}</p>
          </div>
        )}
      </div>

      {/* Deep Inquiry Input */}
      <div className="p-4 bg-white border-t flex gap-2">
        <input
          type="text"
          placeholder="Ask a specific clinical question (Deep Inquiry)..."
          className="flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={deepInquiry}
          onChange={(e) => setDeepInquiry(e.target.value)}
        />
        <button className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
