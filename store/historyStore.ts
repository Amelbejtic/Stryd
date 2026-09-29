// Jeg importerer create fra Zustand til at oprette storen
import { create } from 'zustand';
// persist-middleware gemmer automatisk state til disk og læser den igen ved app-start
import { persist, createJSONStorage } from 'zustand/middleware';
// AsyncStorage er selve lagrings-mekanismen på telefonen (key-value, som localStorage)
import AsyncStorage from '@react-native-async-storage/async-storage';
// Jeg importerer typen for et færdigt løb
import { CompletedRun } from '../types/workout';

interface HistoryStore {
  runs: CompletedRun[];                  // Liste over alle gemte løb, nyeste først
  addRun: (run: CompletedRun) => void;   // Tilføjer et nyt færdigt løb til historikken
  removeRun: (id: string) => void;      // Funktion til at slette et løb via id
}

export const useHistoryStore = create<HistoryStore>()(
  // persist wrapper'er hele storen — alt i 'runs' bliver automatisk gemt/læst
  persist(
    (set) => ({
      runs: [],
      addRun: (run) => set(state => ({
        // Jeg sætter det nye løb først i listen (nyeste øverst)
        runs: [run, ...state.runs],
      })),
      removeRun: (id) => set(state => ({
        runs: state.runs.filter(run => run.id !== id),
      })),
    }),
    {
      name: 'stryd-history',                    // Nøglen data gemmes under i AsyncStorage
      storage: createJSONStorage(() => AsyncStorage), // Brug AsyncStorage som lager
    }
  )
);