import { useRef } from 'react';
import * as Speech from 'expo-speech';
import { speedToPaceMinutes } from '../utils/calculations';
import { Coordinate, ProgramSession } from '../types/workout';
import { useSettingsStore } from '../store/settingsStore';

export function useAudioCoach() {
  const lastAnnouncedKm = useRef<number>(0);
  const { audioCoachEnabled } = useSettingsStore();

  // Session-tracking state
  const currentSession = useRef<ProgramSession | null>(null);
  const currentRepIndex = useRef<number>(0);
  const repStartDistance = useRef<number>(0);
  const isPausedRep = useRef<boolean>(false);
  const hasAnnouncedHalfway = useRef<boolean>(false);
  const hasAnnounced100m = useRef<boolean>(false);
  const countdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const speak = (message: string) => {
    if (!audioCoachEnabled) return;
    Speech.stop();
    Speech.speak(message, { language: 'en-US', rate: 1.0 });
  };

  // Formaterer pace til læsbar streng — fx 5.5 → "5 minutes 30 seconds"
  const formatPaceVoice = (paceMinPerKm: number): string => {
    const minutes = Math.floor(paceMinPerKm);
    const seconds = Math.round((paceMinPerKm - minutes) * 60);
    if (seconds === 0) return `${minutes} minutes`;
    return `${minutes} minutes ${seconds} seconds`;
  };

  // Starter en session — annoncerer hvad der skal løbes
  const startSession = (session: ProgramSession) => {
    if (!audioCoachEnabled) return;
    currentSession.current = session;
    currentRepIndex.current = 0;
    repStartDistance.current = 0;
    isPausedRep.current = false;
    hasAnnouncedHalfway.current = false;
    hasAnnounced100m.current = false;

    const goal = session.goal;

    if (goal.type === 'distance') {
      const pace = goal.targetPaceMinPerKm
        ? ` at ${formatPaceVoice(goal.targetPaceMinPerKm)} per kilometer`
        : '';
      speak(`Starting ${session.type} run. ${goal.distanceKm} kilometers${pace}.`);
    } else if (goal.type === 'duration') {
      speak(`Starting ${session.type} run. ${goal.durationMinutes} minutes.`);
    } else if (goal.type === 'intervals') {
      const rep = goal.reps[0];
      speak(`Starting intervals. ${goal.reps.length} reps of ${rep.distanceMeters} meters at ${formatPaceVoice(rep.targetPaceMinPerKm)} per kilometer. First rep, go!`);
    } else if (goal.type === 'segments') {
      const first = goal.segments[0];
      speak(`Starting ${session.type} run. First segment: ${first.label}. ${(first.distanceMeters ?? 0)} meters at ${formatPaceVoice(first.targetPaceMinPerKm)} per kilometer.`);
    }
  };

  // Starter pause-nedtælling
  const startCountdown = (seconds: number, onDone: () => void) => {
    if (!audioCoachEnabled) return;
    if (seconds <= 3) {
      speak(`${seconds}... Go!`);
      setTimeout(onDone, seconds * 1000);
    } else {
      speak(`Rest for ${seconds} seconds.`);
      // Annoncér 3-2-1 når der er 3 sekunder tilbage
      setTimeout(() => {
        speak('3... 2... 1... Go!');
        setTimeout(onDone, 3000);
      }, (seconds - 3) * 1000);
    }
  };

  // Springer til næste rep/segment
  const skipToNextRep = (totalDistanceMeters: number) => {
    if (!currentSession.current) return;
    const goal = currentSession.current.goal;

    if (goal.type === 'intervals') {
      const nextIndex = currentRepIndex.current + 1;
      if (nextIndex >= goal.reps.length) {
        speak('All reps completed. Great work!');
        return;
      }
      currentRepIndex.current = nextIndex;
      repStartDistance.current = totalDistanceMeters;
      hasAnnouncedHalfway.current = false;
      hasAnnounced100m.current = false;

      const rep = goal.reps[nextIndex];
      const isLast = nextIndex === goal.reps.length - 1;
      speak(`Rep ${nextIndex + 1} of ${goal.reps.length}. ${rep.distanceMeters} meters at ${formatPaceVoice(rep.targetPaceMinPerKm)} per kilometer.${isLast ? ' Last rep!' : ''}`);
    } else if (goal.type === 'segments') {
      const nextIndex = currentRepIndex.current + 1;
      if (nextIndex >= goal.segments.length) {
        speak('All segments completed. Great work!');
        return;
      }
      currentRepIndex.current = nextIndex;
      repStartDistance.current = totalDistanceMeters;
      hasAnnouncedHalfway.current = false;
      hasAnnounced100m.current = false;

      const seg = goal.segments[nextIndex];
      speak(`Next segment: ${seg.label}. ${(seg.distanceMeters ?? 0)} meters at ${formatPaceVoice(seg.targetPaceMinPerKm)} per kilometer.`);
    }
  };

  // Pauser den aktuelle rep
  const pauseRep = () => {
    isPausedRep.current = true;
    speak('Rep paused.');
  };

  // Genoptager den aktuelle rep
  const resumeRep = () => {
    isPausedRep.current = false;
    speak('Resume!');
  };

  // Hovedfunktion — kaldes hvert sekund med ny GPS-data
  const checkSessionProgress = (
    totalDistanceMeters: number,
    coordinates: Coordinate[],
  ) => {
    if (!audioCoachEnabled || !currentSession.current || isPausedRep.current) return;

    const goal = currentSession.current.goal;
    const distanceInRep = totalDistanceMeters - repStartDistance.current;

    if (goal.type === 'intervals') {
      const rep = goal.reps[currentRepIndex.current];
      if (!rep) return;

      const repDistanceM = rep.distanceMeters;
      const halfway = repDistanceM / 2;

      // Halvvejs
      if (!hasAnnouncedHalfway.current && distanceInRep >= halfway) {
        hasAnnouncedHalfway.current = true;
        speak(`Halfway through rep ${currentRepIndex.current + 1}.`);
      }

      // 100m tilbage
      if (!hasAnnounced100m.current && distanceInRep >= repDistanceM - 100) {
        hasAnnounced100m.current = true;
        speak('100 meters remaining.');
      }

      // Rep færdig
      if (distanceInRep >= repDistanceM) {
        const nextIndex = currentRepIndex.current + 1;
        hasAnnouncedHalfway.current = false;
        hasAnnounced100m.current = false;

        if (nextIndex >= goal.reps.length) {
          speak('All reps completed. Great work!');
          currentSession.current = null;
          return;
        }

        // Start pause-nedtælling
        const restSeconds = rep.restSeconds ?? 60;
        currentRepIndex.current = nextIndex;
        repStartDistance.current = totalDistanceMeters;

        const nextRep = goal.reps[nextIndex];
        const isLast = nextIndex === goal.reps.length - 1;

        startCountdown(restSeconds, () => {
          speak(`Rep ${nextIndex + 1} of ${goal.reps.length}. ${nextRep.distanceMeters} meters at ${formatPaceVoice(nextRep.targetPaceMinPerKm)} per kilometer.${isLast ? ' Last rep!' : ''}`);
        });
      }
    } else if (goal.type === 'segments') {
      const seg = goal.segments[currentRepIndex.current];
      if (!seg || !seg.distanceMeters) return;

      const halfway = seg.distanceMeters / 2;

      if (!hasAnnouncedHalfway.current && distanceInRep >= halfway) {
        hasAnnouncedHalfway.current = true;
        speak(`Halfway through ${seg.label}.`);
      }

      if (!hasAnnounced100m.current && distanceInRep >= seg.distanceMeters - 100) {
        hasAnnounced100m.current = true;
        speak('100 meters remaining.');
      }

      if (distanceInRep >= seg.distanceMeters) {
        const nextIndex = currentRepIndex.current + 1;
        hasAnnouncedHalfway.current = false;
        hasAnnounced100m.current = false;

        if (nextIndex >= goal.segments.length) {
          speak('Session complete. Great work!');
          currentSession.current = null;
          return;
        }

        currentRepIndex.current = nextIndex;
        repStartDistance.current = totalDistanceMeters;

        const nextSeg = goal.segments[nextIndex];
        const restSeconds = seg.restSeconds ?? 0;

        if (restSeconds > 0) {
          startCountdown(restSeconds, () => {
            speak(`Next: ${nextSeg.label}. ${nextSeg.distanceMeters} meters at ${formatPaceVoice(nextSeg.targetPaceMinPerKm)} per kilometer.`);
          });
        } else {
          speak(`Next: ${nextSeg.label}. ${nextSeg.distanceMeters} meters at ${formatPaceVoice(nextSeg.targetPaceMinPerKm)} per kilometer.`);
        }
      }
    } else if (goal.type === 'distance') {
      // Simpelt distance-løb — km milestones
      checkKmMilestone(totalDistanceMeters, coordinates);
    }
  };

  // Eksisterende km-milestone logik til frie løb
  const checkKmMilestone = (
    distanceMeters: number,
    coordinates: Coordinate[],
  ) => {
    if (!audioCoachEnabled) return;
    const currentKm = Math.floor(distanceMeters / 1000);
    if (currentKm > lastAnnouncedKm.current && currentKm > 0) {
      lastAnnouncedKm.current = currentKm;
      const lastCoord = coordinates[coordinates.length - 1];
      const currentSpeed = lastCoord?.speed ?? 0;
      const paceMin = speedToPaceMinutes(currentSpeed);
      const paceMinutes = Math.floor(paceMin);
      const paceSeconds = Math.round((paceMin - paceMinutes) * 60);
      speak(`${currentKm} kilometer. Pace ${paceMinutes} minutes and ${paceSeconds} seconds per kilometer.`);
    }
  };

  const reset = () => {
    lastAnnouncedKm.current = 0;
    currentSession.current = null;
    currentRepIndex.current = 0;
    repStartDistance.current = 0;
    isPausedRep.current = false;
    hasAnnouncedHalfway.current = false;
    hasAnnounced100m.current = false;
    if (countdownTimeout.current) clearTimeout(countdownTimeout.current);
    Speech.stop();
  };

  return {
    checkKmMilestone,
    checkSessionProgress,
    startSession,
    skipToNextRep,
    pauseRep,
    resumeRep,
    reset,
    speak,
  };
}