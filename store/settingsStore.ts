import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsStore {
  audioCoachEnabled: boolean;
  setAudioCoachEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      audioCoachEnabled: true,
      setAudioCoachEnabled: (enabled) => set({ audioCoachEnabled: enabled }),
    }),
    {
      name: 'stryd-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);