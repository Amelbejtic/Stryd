// Jeg importerer useEffect til oprydning og useRef til at gemme referencer på tværs af renders
import { useEffect, useRef } from 'react';

// Jeg importerer GPS-biblioteket fra Expo
import * as Location from 'expo-location';

// Jeg importerer min globale store hvor løbets data lever
import { useTrackingStore } from '../store/trackingStore';

export function useTracking() {
  // Jeg henter alt hvad jeg skal bruge fra min store
  // inklusiv den nye tickMs funktion og elapsedMs tæller
  const { run, elapsedMs, startRun, pauseRun, resumeRun, finishRun, addCoordinate, tickMs } = useTrackingStore();

  // Jeg gemmer en reference til GPS-lytteren så jeg kan stoppe den igen ved pause/stop
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  // Jeg gemmer en reference til mit ms-interval så jeg kan stoppe det igen ved pause/stop
  const msInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Jeg starter et interval der kører hvert 10ms og kalder tickMs
  // Det giver en flydende tæller der er uafhængig af GPS-opdateringer
  const startMsInterval = () => {
    msInterval.current = setInterval(() => {
      tickMs(10);
    }, 10);
  };

  // Jeg stopper ms-intervallet og rydder referencen op så der ikke er memory leaks
  const stopMsInterval = () => {
    if (msInterval.current) {
      clearInterval(msInterval.current);
      msInterval.current = null;
    }
  };

  // Jeg beder brugeren om GPS-tilladelse
  // Hvis tilladelse ikke gives, viser jeg en besked og returnerer false så løbet ikke starter
  const requestPermissions = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      alert('Stryd har brug for adgang til din placering for at tracke dit løb.');
      return false;
    }
    return true;
  };

  // Jeg starter løbet — tjekker tilladelse, starter store, ms-interval og GPS-lytter
  const start = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    startRun();
    startMsInterval();

    // Jeg starter GPS-lytteren og sender nye koordinater til store'en hvert sekund
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
      }
    );
  };

  // Jeg pauser løbet — opdaterer store, stopper ms-interval og GPS-lytter
  const pause = () => {
    pauseRun();
    stopMsInterval();
    locationSubscription.current?.remove();
    locationSubscription.current = null;
  };

  // Jeg genoptager løbet — opdaterer store, starter ms-interval og GPS-lytter igen
  const resume = async () => {
    resumeRun();
    startMsInterval();

    // Jeg starter GPS-lytteren igen med samme indstillinger som ved start
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
      }
    );
  };

  // Jeg afslutter løbet — opdaterer store, stopper ms-interval og GPS-lytter
  const finish = () => {
    finishRun();
    stopMsInterval();
    locationSubscription.current?.remove();
    locationSubscription.current = null;
  };

  // Jeg sørger for oprydning hvis skærmen lukkes mens løbet kører
  // Den tomme [] betyder at dette kun sættes op én gang når komponenten mountes
  useEffect(() => {
    return () => {
      locationSubscription.current?.remove();
      stopMsInterval();
    };
  }, []);

  // Jeg returnerer det tracking-skærmen skal bruge for at vise data og styre løbet
  return { run, elapsedMs, start, pause, resume, finish };
}