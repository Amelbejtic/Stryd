import { useState } from 'react';
import * as Speech from 'expo-speech';
import { HoldToStopButton } from '../components/HoldToStopButton';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useTracking } from '../hooks/useTracking';
import { speedToPace, formatDurationMs } from '../utils/calculations';
import { useSettingsStore } from '../store/settingsStore';
import { useProgramStore } from '../store/programStore';
import { useHistoryStore } from '../store/historyStore';
import { generateProgram } from '../utils/generateProgram';

export default function TrackingScreen() {
  const { run, elapsedMs, start, pause, resume, finish, startSession, skipToNextRep, pauseRep, resumeRep } = useTracking();
  const { audioCoachEnabled } = useSettingsStore();
  const { getActiveProgram, addProgram, setActiveProgram, removeProgram } = useProgramStore();
  const { runs } = useHistoryStore();

  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [repPaused, setRepPaused] = useState(false);

  const isIdle = !run || run.status === 'idle';
  const isRunning = run?.status === 'running';
  const isPaused = run?.status === 'paused';

  const currentSpeed = run?.coordinates[run.coordinates.length - 1]?.speed ?? 0;
  const distanceKm = ((run?.distanceMeters ?? 0) / 1000).toFixed(2);
  const pace = speedToPace(currentSpeed);
  const duration = formatDurationMs(elapsedMs);

  return (
    <View style={styles.container}>

      <View style={styles.statsContainer}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>km</Text>
          <Text style={styles.statValue}>{distanceKm}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>time</Text>
          <Text style={styles.statValue}>{duration}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>min/km</Text>
          <Text style={styles.statValue}>{pace}</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        {isIdle && (
          <TouchableOpacity style={styles.startButton} onPress={start}>
            <Text style={styles.buttonText}>Start</Text>
          </TouchableOpacity>
        )}
        {isRunning && (
          <View style={styles.runningControls}>
            <TouchableOpacity style={styles.pauseButton} onPress={pause}>
              <Text style={styles.buttonText}>Pause</Text>
            </TouchableOpacity>

            {/* Vis kun hvis der er en aktiv session med reps/segmenter */}
            {activeSession && (activeSession.goal.type === 'intervals' || activeSession.goal.type === 'segments') && (
              <View style={styles.repControls}>
                <TouchableOpacity
                  style={styles.repButton}
                  onPress={() => {
                    if (repPaused) {
                      resumeRep();
                      setRepPaused(false);
                    } else {
                      pauseRep();
                      setRepPaused(true);
                    }
                  }}
                >
                  <Text style={styles.repButtonText}>{repPaused ? '▶ Resume rep' : '⏸ Pause rep'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.repButton}
                  onPress={() => {
                    if (run) skipToNextRep(run.distanceMeters);
                  }}
                >
                  <Text style={styles.repButtonText}>Skip rep ▶▶</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        {isPaused && (
          <>
            <TouchableOpacity style={styles.startButton} onPress={resume}>
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
            <HoldToStopButton onComplete={() => {
              const result = finish();
              if (result?.shouldRegenerate) {
                setShowRegenerateModal(true);
              }
            }} />
          </>
        )}
      </View>

      {/* Testknap — fjernes når audio coach er testet */}
      <TouchableOpacity
        style={styles.testButton}
        onPress={() => {
          if (audioCoachEnabled) {
            Speech.speak('Audio coach is working!', { language: 'en-US' });
          }
        }}
      >
        <Text style={styles.buttonText}>Test audio</Text>
      </TouchableOpacity>

      {/* Regenererings-popup */}
      {showRegenerateModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>You're getting faster! 🚀</Text>
            <Text style={styles.modalText}>
              You ran significantly faster than your program suggests. Would you like to regenerate your program to match your current fitness level?
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              disabled={isRegenerating}
              onPress={async () => {
                setIsRegenerating(true);
                try {
                  const activeProgram = getActiveProgram();
                  if (!activeProgram?.answers) {
                    Alert.alert('Cannot regenerate', 'This program was not generated by AI or answers are missing.');
                    setShowRegenerateModal(false);
                    return;
                  }

                  // Jeg henter opdateret løbehistorik
                  const recentRuns = runs.map(r => ({
                    distanceMeters: r.distanceMeters,
                    durationMs: r.durationMs,
                    startTime: r.startTime,
                  }));

                  // Jeg regenererer med de samme svar men opdateret historik
                  const newProgram = await generateProgram(activeProgram.answers, recentRuns);
                  const newProgramWithAnswers = { ...newProgram, answers: activeProgram.answers };

                  // Jeg fjerner det gamle program og tilføjer det nye
                  removeProgram(activeProgram.id);
                  addProgram(newProgramWithAnswers);
                  setActiveProgram(newProgramWithAnswers.id);

                  Alert.alert('Program updated!', 'Your program has been regenerated based on your current fitness level.');
                } catch (error) {
                  Alert.alert('Error', 'Could not regenerate program. Please try again.');
                  console.error(error);
                } finally {
                  setIsRegenerating(false);
                  setShowRegenerateModal(false);
                }
              }}
            >
              {isRegenerating
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.modalButtonText}>Regenerate program</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButtonSecondary}
              onPress={() => setShowRegenerateModal(false)}
            >
              <Text style={styles.modalButtonSecondaryText}>Keep current program</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
  statsContainer: {
    width: '80%',
    marginBottom: 60,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
  },
  statLabel: {
    fontSize: 16,
    color: '#888',
  },
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
  runningControls: {
    alignItems: 'center',
    gap: 12,
  },
  repControls: {
    flexDirection: 'row',
    gap: 10,
  },
  repButton: {
    backgroundColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  repButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
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
  testButton: {
    backgroundColor: '#555',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 50,
    marginTop: 20,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: '#1c1c1c',
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalText: {
    color: '#888',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: '#00C853',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtonSecondary: {
    padding: 16,
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    color: '#888',
    fontSize: 16,
  },
});