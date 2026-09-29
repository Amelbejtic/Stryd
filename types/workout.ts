export interface Coordinate {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed: number | null;
  altitude: number | null;
}

export interface ActiveRun {
  id: string;
  startTime: number;
  coordinates: Coordinate[];
  distanceMeters: number;
  elapsedSeconds: number;
  status: 'idle' | 'running' | 'paused' | 'finished';
}

// Et færdigt, gemt løb — det vi viser i Activity-historikken
export interface CompletedRun {
  id: string;
  startTime: number;
  endTime: number;
  durationMs: number;        // total tid løbet tog (fra elapsedMs)
  coordinates: Coordinate[];
  distanceMeters: number;
}

// En enkelt interval-runde
export interface IntervalRep {
  distanceMeters: number;    // fx 400
  targetPaceMinPerKm: number; // fx 4.5 (4:30 min/km)
  restSeconds: number;        // pause efter runden
}

// Målet for en session — enten distance, tid eller intervaller
export type SessionGoal =
  | { type: 'distance'; distanceKm: number; targetPaceMinPerKm?: number }
  | { type: 'duration'; durationMinutes: number; targetPaceMinPerKm?: number }
  | { type: 'intervals'; reps: IntervalRep[] }
  | { type: 'segments'; segments: Segment[] }; // nyt — progressive/custom løb

// Typen af session
export type SessionType = 'easy' | 'long' | 'interval' | 'rest' | 'race';

// En enkelt træningssession
export interface ProgramSession {
  id: string;
  date: string;           // ISO dato-string: "2026-08-04"
  type: SessionType;
  goal: SessionGoal;
  notes?: string;         // valgfri note fra brugeren/AI
  completed: boolean;     // er sessionen gennemført?
  runId?: string;         // reference til det faktiske løb hvis gennemført
}

// Et fuldt løbeprogram
export interface TrainingProgram {
  id: string;
  name: string;
  createdAt: number;      // timestamp
  startDate: string;      // ISO dato-string
  endDate: string;        // ISO dato-string
  weeks: number;
  sessions: ProgramSession[];
  isActive: boolean;
  generatedByAI: boolean; // var det AI eller manuelt opbygget?
  answers?: Record<string, string | string[]>; // gemte spørgeskema-svar til regenerering
}

// Et segment er en blok i et løb med individuel distance og pace
// Bruges til progressive runs og interval-variationer
export interface Segment {
  id: string;
  label: string;           // fx "Warm up", "Rep 1", "Cooldown"
  distanceMeters?: number; // distance i meter
  durationMinutes?: number;// ELLER tid i minutter
  targetPaceMinPerKm: number; // pace for dette segment
  restSeconds?: number;    // pause EFTER segmentet (kun intervaller)
}