import { useAudioCoach } from './useAudioCoach';
import { useHistoryStore } from '../store/historyStore';
import { useRef } from 'react';
import * as Location from 'expo-location';
import { useTrackingStore } from '../store/trackingStore';
import { useProgramStore } from '../store/programStore';
import { Coordinate } from '../types/workout';

export function useTracking() {
  const { run, elapsedMs, startRun, pauseRun, resumeRun, finishRun, addCoordinate, tickMs } = useTrackingStore();
  const { addRun } = useHistoryStore();
  const { getActiveProgram } = useProgramStore();
  const audioCoach = useAudioCoach();

  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const msInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const startMsInterval = () => {
    msInterval.current = setInterval(() => {
      tickMs(10);
    }, 10);
  };

  const stopMsInterval = () => {
    if (msInterval.current) {
      clearInterval(msInterval.current);
      msInterval.current = null;
    }
  };

  const requestPermissions = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Stryd needs access to your location to track your run.');
      return false;
    }
    return true;
  };

  // Jeg tjekker om løberen løb hurtigere end planlagt på interval-sessioner
  // Kun arbejdsperioder tælles — pauser filtreres fra
  const checkForPaceImprovement = (
    completedRun: { distanceMeters: number; durationMs: number; coordinates: Coordinate[] }
  ): { shouldRegenerate: boolean; session?: any } => {
    const activeProgram = getActiveProgram();
    if (!activeProgram) return { shouldRegenerate: false };

    const today = new Date().toISOString().split('T')[0];

    // Jeg finder dagens interval-session
    const todaySession = activeProgram.sessions.find(
      s => s.date === today && s.type === 'interval' && !s.completed
    );

    if (!todaySession || todaySession.goal.type !== 'intervals') {
      return { shouldRegenerate: false };
    }

    const plannedPace = todaySession.goal.reps[0]?.targetPaceMinPerKm;
    if (!plannedPace) return { shouldRegenerate: false };

    // Jeg filtrerer pauser fra — alt under 2 m/s (ca. 8:20 min/km) er pause
    const PAUSE_THRESHOLD_MS = 2.0;
    const workCoordinates = completedRun.coordinates.filter(
      c => c.speed !== null && c.speed > PAUSE_THRESHOLD_MS
    );

    // Ikke nok data til at bedømme
    if (workCoordinates.length < 10) return { shouldRegenerate: false };

    // Jeg beregner gennemsnitshastighed kun under arbejdsperioder
    const avgWorkSpeed = workCoordinates.reduce(
      (sum, c) => sum + (c.speed ?? 0), 0
    ) / workCoordinates.length;

    // Jeg konverterer m/s til min/km
    const actualPaceMinPerKm = 1000 / (avgWorkSpeed * 60);

    // Jeg sammenligner i sekunder — 15+ sek hurtigere udløser regenerering
    const actualPaceSec = actualPaceMinPerKm * 60;
    const plannedPaceSec = plannedPace * 60;
    const shouldRegenerate = (plannedPaceSec - actualPaceSec) >= 15;

    return { shouldRegenerate, session: todaySession };
  };

  const start = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    startRun();
    startMsInterval();

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 0,
      },
      (location) => {
        addCoordinate({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: location.timestamp,
          speed: location.coords.speed,
          altitude: location.coords.altitude,
        });
        const { run } = useTrackingStore.getState();
        if (run) {
          // Jeg bruger checkSessionProgress hvis der er en aktiv session
          // ellers falder vi tilbage til km-milestones
          audioCoach.checkSessionProgress(run.distanceMeters, run.coordinates);
        }
      }
    );
  };

  const pause = () => {
    pauseRun();
    stopMsInterval();
    locationSubscription.current?.remove();
    locationSubscription.current = null;
  };

  const resume = async () => {
    resumeRun();
    startMsInterval();

    locationSubscription.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 0,
      },
      (location) => {
        addCoordinate({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: location.timestamp,
          speed: location.coords.speed,
          altitude: location.coords.altitude,
        });
        const { run } = useTrackingStore.getState();
        if (run) {
          // Jeg bruger checkSessionProgress hvis der er en aktiv session
          // ellers falder vi tilbage til km-milestones
          audioCoach.checkSessionProgress(run.distanceMeters, run.coordinates);
        }
      }
    );
  };

  const finish = () => {
    let regenerationInfo: { shouldRegenerate: boolean; session?: any } = { shouldRegenerate: false };

    if (run) {
      // Jeg tjekker pace FØR vi nulstiller
      regenerationInfo = checkForPaceImprovement({
        distanceMeters: run.distanceMeters,
        durationMs: elapsedMs,
        coordinates: run.coordinates,
      });

      addRun({
        id: run.id,
        startTime: run.startTime,
        endTime: Date.now(),
        durationMs: elapsedMs,
        coordinates: run.coordinates,
        distanceMeters: run.distanceMeters,
      });
    }

    audioCoach.reset();
    finishRun();
    stopMsInterval();
    locationSubscription.current?.remove();
    locationSubscription.current = null;

    return regenerationInfo;
  };

  return {
    run,
    elapsedMs,
    start,
    pause,
    resume,
    finish,
    startSession: audioCoach.startSession,
    skipToNextRep: audioCoach.skipToNextRep,
    pauseRep: audioCoach.pauseRep,
    resumeRep: audioCoach.resumeRep,
  };
}