import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TrainingProgram, ProgramSession } from '../types/workout';

interface ProgramStore {
  programs: TrainingProgram[];
  
  // Tilføj et helt nyt program (bruges af både AI og manuel builder)
  addProgram: (program: TrainingProgram) => void;
  
  // Slet et program
  removeProgram: (id: string) => void;
  
  // Sæt ét program som aktivt — deaktiverer alle andre
  setActiveProgram: (id: string) => void;
  
  // Opdater en enkelt session (fx flyt dato, markér som gennemført)
  updateSession: (programId: string, session: ProgramSession) => void;
  
  // Tilføj en session til et program (manuel builder)
  addSession: (programId: string, session: ProgramSession) => void;
  
  // Slet en session fra et program
  removeSession: (programId: string, sessionId: string) => void;
  
  // Hent det aktive program — null hvis intet er aktivt
  getActiveProgram: () => TrainingProgram | null;
}

export const useProgramStore = create<ProgramStore>()(
  persist(
    (set, get) => ({
      programs: [],

      addProgram: (program) => set(state => ({
        programs: [program, ...state.programs],
      })),

      removeProgram: (id) => set(state => ({
        programs: state.programs.filter(p => p.id !== id),
      })),

      // Jeg sætter det valgte program til aktivt og deaktiverer alle andre
      // Dette sikrer kun ét program er aktivt ad gangen
      setActiveProgram: (id) => set(state => ({
        programs: state.programs.map(p => ({
          ...p,
          isActive: p.id === id,
        })),
      })),

      // Jeg finder det rigtige program og opdaterer den specifikke session
      // ved at mappe over sessions og erstatte den med matchende id
      updateSession: (programId, updatedSession) => set(state => ({
        programs: state.programs.map(p =>
          p.id !== programId ? p : {
            ...p,
            sessions: p.sessions.map(s =>
              s.id === updatedSession.id ? updatedSession : s
            ),
          }
        ),
      })),

      addSession: (programId, session) => set(state => ({
        programs: state.programs.map(p =>
          p.id !== programId ? p : {
            ...p,
            sessions: [...p.sessions, session],
          }
        ),
      })),

      removeSession: (programId, sessionId) => set(state => ({
        programs: state.programs.map(p =>
          p.id !== programId ? p : {
            ...p,
            sessions: p.sessions.filter(s => s.id !== sessionId),
          }
        ),
      })),

      // get() giver adgang til den nuværende state inde i en action
      // det er anderledes end set() — get() læser, set() skriver
      getActiveProgram: () => {
        return get().programs.find(p => p.isActive) ?? null;
      },
    }),
    {
      name: 'stryd-programs',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);