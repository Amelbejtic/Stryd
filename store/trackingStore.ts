// Jeg importerer create fra Zustand — det er funktionen der opretter min globale store
import { create } from 'zustand';

// Jeg importerer mine TypeScript typer så store'en ved hvordan data skal se ud
import { ActiveRun, Coordinate } from '../types/workout';

// Jeg importerer min haversine-funktion til at beregne distance mellem GPS-punkter
import { haversineDistance } from '../utils/calculations';

// Jeg definerer hvad min store indeholder — både data og funktioner
interface TrackingStore {
  run: ActiveRun | null;        // Det aktive løb — null hvis intet løb er i gang
  elapsedMs: number;            // Antal millisekunder løbet har kørt
  startRun: () => void;
  pauseRun: () => void;
  resumeRun: () => void;
  finishRun: () => void;
  addCoordinate: (coord: Coordinate) => void;
  tickMs: (ms: number) => void; // Kaldes hvert 10ms for at opdatere tælleren
}

export const useTrackingStore = create<TrackingStore>((set, get) => ({
  // Jeg starter med ingen aktive løb og 0 millisekunder
  run: null,
  elapsedMs: 0,

  // Jeg starter et nyt løb og nulstiller tælleren
  // Date.now() giver det nuværende tidspunkt i millisekunder — bruges som unikt id og starttidspunkt
  startRun: () => set({
    elapsedMs: 0,
    run: {
      id: Date.now().toString(),
      startTime: Date.now(),
      coordinates: [],
      distanceMeters: 0,
      elapsedSeconds: 0,
      status: 'running',
    }
  }),

  // Jeg pauser løbet ved at ændre status — GPS-lytteren stoppes i useTracking
  pauseRun: () => set(state => ({
    run: state.run ? { ...state.run, status: 'paused' } : null
  })),

  // Jeg genoptager løbet ved at sætte status tilbage til running
  resumeRun: () => set(state => ({
    run: state.run ? { ...state.run, status: 'running' } : null
  })),

  // Jeg afslutter løbet og nulstiller ms-tælleren
  finishRun: () => set(state => ({
    elapsedMs: 0,
    run: state.run ? { ...state.run, status: 'finished' } : null
  })),

  // Jeg opdaterer ms-tælleren — kaldes hvert 10ms fra mit interval i useTracking
  // Jeg tjekker at løbet kører — hvis det er pauset opdaterer jeg ikke tælleren
  tickMs: (ms: number) => set(state => {
    if (!state.run || state.run.status !== 'running') return state;
    return { elapsedMs: state.elapsedMs + ms };
  }),

  // Jeg tilføjer et nyt GPS-koordinat og beregner den nye distance
  // Jeg filtrerer GPS-støj væk — punkter mere end 50m fra forrige ignoreres
  addCoordinate: (coord: Coordinate) => set(state => {
    if (!state.run || state.run.status !== 'running') return state;

    const coords = state.run.coordinates;
    const prev = coords[coords.length - 1];
    const added = prev ? haversineDistance(prev, coord) : 0;
    const isNoise = added > 50;

    return {
      run: {
        ...state.run,
        coordinates: isNoise ? coords : [...coords, coord],
        distanceMeters: isNoise ? state.run.distanceMeters : state.run.distanceMeters + added,
        elapsedSeconds: state.run.elapsedSeconds + 1,
      }
    };
  }),
}));