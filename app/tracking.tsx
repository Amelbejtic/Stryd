// Jeg importerer React Native komponenter, mit GPS hook og mine beregningsfunktioner
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTracking } from '../hooks/useTracking';
import { speedToPace, formatDurationMs } from '../utils/calculations';

export default function TrackingScreen() {
  // Jeg henter løbets data og kontrolfunktioner fra mit hook
  const { run, elapsedMs, start, pause, resume, finish } = useTracking();

  // Jeg tjekker hvilken tilstand løbet er i så jeg kan vise de rigtige knapper
  const isIdle = !run || run.status === 'idle';
  const isRunning = run?.status === 'running';
  const isPaused = run?.status === 'paused';

  // Jeg beregner de værdier der skal vises på skærmen
  const currentSpeed = run?.coordinates[run.coordinates.length - 1]?.speed ?? 0;
  const distanceKm = ((run?.distanceMeters ?? 0) / 1000).toFixed(2);
  const pace = speedToPace(currentSpeed);
  const duration = formatDurationMs(elapsedMs);

  return (
    <View style={styles.container}>

      {/* Jeg viser de tre målinger lodret over hinanden */}
      <View style={styles.statsContainer}>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>km</Text>
          <Text style={styles.statValue}>{distanceKm}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>tid</Text>
          <Text style={styles.statValue}>{duration}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>min/km</Text>
          <Text style={styles.statValue}>{pace}</Text>
        </View>

      </View>

      {/* Jeg viser kun de knapper der giver mening i den nuværende tilstand */}
      <View style={styles.buttonContainer}>
        {isIdle && (
          <TouchableOpacity style={styles.startButton} onPress={start}>
            <Text style={styles.buttonText}>Start</Text>
          </TouchableOpacity>
        )}
        {isRunning && (
          <TouchableOpacity style={styles.pauseButton} onPress={pause}>
            <Text style={styles.buttonText}>Pause</Text>
          </TouchableOpacity>
        )}
        {isPaused && (
          <>
            <TouchableOpacity style={styles.startButton} onPress={resume}>
              <Text style={styles.buttonText}>Fortsæt</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stopButton} onPress={finish}>
              <Text style={styles.buttonText}>Stop</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Jeg samler de tre rækker i en boks med fast bredde
  statsContainer: {
    width: '80%',
    marginBottom: 60,
  },
  // Hver række har label til venstre og værdi til højre
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  // En tynd linje mellem rækkerne så det ser struktureret ud
  divider: {
    height: 1,
    backgroundColor: '#333',
  },
  statLabel: {
    fontSize: 16,
    color: '#888',
  },
  // Fast bredde på værdien så tallet ikke rykker layoutet når det skifter
  statValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'right',
    minWidth: 160,
  },
  buttonContainer: {
    gap: 16,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#00C853',
    paddingVertical: 20,
    paddingHorizontal: 60,
    borderRadius: 50,
  },
  pauseButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 20,
    paddingHorizontal: 60,
    borderRadius: 50,
  },
  stopButton: {
    backgroundColor: '#F44336',
    paddingVertical: 20,
    paddingHorizontal: 60,
    borderRadius: 50,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
});