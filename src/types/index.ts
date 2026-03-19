export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  // Shared hsieh.org ecosystem properties
  roles?: string[];
}

export interface GameStats {
  uid: string;
  xp: number;
  score: number;
  level: number;
  wardMetrics: {
    patientsSeen: number;
    correctDiagnoses: number;
    misdiagnoses: number;
    efficiencyRating: number;
  };
  lastActive: Date | string;
}

export interface ClinicalVignette {
  id: string;
  age: number;
  gender: string;
  chiefComplaint: string;
  fullVignette: string; // The dense USMLE-style paragraph
  hpi: string[]; // Static RPG branching dialogue bits
  vitals: {
    temp: number;
    hr: number;
    rr: number;
    bp: string;
    spo2: number;
  };
  physicalExam: string;
  labs?: Record<string, string | number>;
  imaging?: string;
  correctDiagnosis: string;
  differential: string[];
  explanation: string;
}

export interface PlayerPosition {
  uid: string;
  x: number;
  y: number;
  rotation: number;
  status: 'idle' | 'walking' | 'interviewing' | 'charting';
}
