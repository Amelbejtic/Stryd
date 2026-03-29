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