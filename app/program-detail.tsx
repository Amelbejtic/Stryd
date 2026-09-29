import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { useProgramStore } from '../store/programStore';
import { useHistoryStore } from '../store/historyStore';
import { generateProgram } from '../utils/generateProgram';
import { ProgramStackParamList } from './program-stack';
import { ProgramSession, SessionType, Segment } from '../types/workout';
import { SegmentBuilder } from '../components/SegmentBuilder';

type RouteProps = RouteProp<ProgramStackParamList, 'ProgramDetail'>;

const SESSION_COLORS: Record<SessionType, string> = {
  easy: '#4CAF50',
  long: '#2196F3',
  interval: '#F44336',
  rest: '#555',
  race: '#FF9800',
  tempo: '#9C27B0',
  'cross-training': '#00BCD4',
};

const SESSION_LABELS: Record<SessionType, string> = {
  easy: 'Easy Run',
  long: 'Long Run',
  interval: 'Intervals',
  rest: 'Rest',
  race: 'Race',
  tempo: 'Tempo',
  'cross-training': 'Cross-training',
};

const SESSION_TEMPLATES: Partial<Record<SessionType, string>> = {
  easy: 'Comfortable conversational pace. Keep heart rate low.',
  long: '45-90 sec/km slower than race pace. Build endurance.',
  interval: 'High intensity work intervals with recovery periods.',
  tempo: 'Comfortably hard. Slightly slower than race pace.',
  race: 'Race day! Trust your training.',
  'cross-training': 'Low impact alternative training. Swimming, cycling or gym.',
};

export default function ProgramDetailScreen() {
  const route = useRoute<RouteProps>();
  const { programId, editable } = route.params;
  const { programs, addSession, removeSession, removeProgram, addProgram, setActiveProgram } = useProgramStore();
  const { runs } = useHistoryStore();

  const program = programs.find(p => p.id === programId);

  const [showAddModal, setShowAddModal] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [sessionType, setSessionType] = useState<SessionType>('easy');
  const [goalType, setGoalType] = useState<'distance' | 'duration' | 'intervals' | 'segments'>('distance');
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [pace, setPace] = useState('');
  const [notes, setNotes] = useState('');
  const [intervalReps, setIntervalReps] = useState('4');
  const [intervalDistance, setIntervalDistance] = useState('400');
  const [intervalPace, setIntervalPace] = useState('');
  const [intervalRest, setIntervalRest] = useState('90');
  const [segments, setSegments] = useState<Segment[]>([]);

  const [showCopyModal, setShowCopyModal] = useState(false);
  const [sessionToCopy, setSessionToCopy] = useState<ProgramSession | null>(null);
  const [copyTargetDate, setCopyTargetDate] = useState('');
  const [showCopyCalendar, setShowCopyCalendar] = useState(false);
  const [copyMode, setCopyMode] = useState<'copy' | 'move'>('copy');

  if (!program) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Program not found</Text>
      </View>
    );
  }

  const markedDates = program.sessions.reduce((acc, session) => {
    const color = SESSION_COLORS[session.type];
    return {
      ...acc,
      [session.date]: {
        marked: true,
        dotColor: color,
        selected: session.completed,
        selectedColor: session.completed ? '#333' : undefined,
      },
    };
  }, {} as Record<string, any>);

  if (selectedDate) {
    markedDates[selectedDate] = {
      ...markedDates[selectedDate],
      selected: true,
      selectedColor: '#00C853',
    };
  }

  const sessionsByWeek: Record<number, ProgramSession[]> = {};
  program.sessions.forEach(session => {
    const sessionDate = new Date(session.date);
    const startDate = new Date(program.startDate);
    const weekNumber = Math.floor(
      (sessionDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
    ) + 1;
    if (!sessionsByWeek[weekNumber]) sessionsByWeek[weekNumber] = [];
    sessionsByWeek[weekNumber].push(session);
  });

  const formatGoal = (session: ProgramSession): string => {
    const goal = session.goal;
    if (goal.type === 'distance') {
      const p = goal.targetPaceMinPerKm
        ? ` @ ${Math.floor(goal.targetPaceMinPerKm)}:${Math.round((goal.targetPaceMinPerKm % 1) * 60).toString().padStart(2, '0')}/km`
        : '';
      return `${goal.distanceKm} km${p}`;
    }
    if (goal.type === 'duration') return `${goal.durationMinutes} min`;
    if (goal.type === 'intervals') {
      const rep = goal.reps[0];
      return `${goal.reps.length}x ${rep.distanceMeters}m @ ${Math.floor(rep.targetPaceMinPerKm)}:${Math.round((rep.targetPaceMinPerKm % 1) * 60).toString().padStart(2, '0')}/km`;
    }
    if (goal.type === 'segments') {
      const totalKm = (goal.segments.reduce((sum, s) => sum + (s.distanceMeters ?? 0), 0) / 1000).toFixed(1);
      return `${goal.segments.length} segments · ${totalKm} km total`;
    }
    return '';
  };

  const resetModal = () => {
    setSessionType('easy');
    setGoalType('distance');
    setDistance('');
    setDuration('');
    setPace('');
    setNotes('');
    setIntervalReps('4');
    setIntervalDistance('400');
    setIntervalPace('');
    setIntervalRest('90');
    setSegments([]);
    setSelectedDate('');
  };

  const handleAddSession = () => {
    if (!selectedDate) {
      Alert.alert('Please select a date.');
      return;
    }

    let goal: ProgramSession['goal'];

    if (goalType === 'distance') {
      if (!distance) { Alert.alert('Please enter a distance.'); return; }
      goal = {
        type: 'distance',
        distanceKm: Number(distance),
        targetPaceMinPerKm: pace ? Number(pace) : undefined,
      };
    } else if (goalType === 'duration') {
      if (!duration) { Alert.alert('Please enter a duration.'); return; }
      goal = {
        type: 'duration',
        durationMinutes: Number(duration),
        targetPaceMinPerKm: pace ? Number(pace) : undefined,
      };
    } else if (goalType === 'segments') {
      if (segments.length === 0) {
        Alert.alert('Please add at least one segment.');
        return;
      }
      goal = { type: 'segments', segments };
    } else {
      // Intervaller — gammelt flow (ensartede reps)
      if (!intervalReps || !intervalDistance || !intervalPace) {
        Alert.alert('Please fill in all interval fields.');
        return;
      }
      const reps = Array(Number(intervalReps)).fill({
        distanceMeters: Number(intervalDistance),
        targetPaceMinPerKm: Number(intervalPace),
        restSeconds: Number(intervalRest),
      });
      goal = { type: 'intervals', reps };
    }

    const session: ProgramSession = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      date: selectedDate,
      type: sessionType,
      goal,
      notes: notes || SESSION_TEMPLATES[sessionType],
      completed: false,
    };

    addSession(programId, session);
    setShowAddModal(false);
    resetModal();
  };

  const copyWeek = (weekNumber: number) => {
    const sessions = sessionsByWeek[weekNumber];
    if (!sessions) return;

    // Jeg kopierer alle sessioner en uge frem (7 dage)
    const newSessions = sessions.map(session => {
      const newDate = new Date(session.date);
      newDate.setDate(newDate.getDate() + 7);
      return {
        ...session,
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        date: newDate.toISOString().split('T')[0],
        completed: false, // kopierede sessioner er ikke gennemført
      };
    });

    newSessions.forEach(s => addSession(programId, s));
  };

  const handleRegenerate = async () => {
    if (!program.answers) {
      Alert.alert('Cannot regenerate', 'This program was not generated by AI.');
      return;
    }

    Alert.alert(
      'Regenerate program',
      'This will replace your current program with a new AI-generated one based on your original answers and updated running history. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          style: 'destructive',
          onPress: async () => {
            setIsRegenerating(true);
            try {
              const recentRuns = runs.map(r => ({
                distanceMeters: r.distanceMeters,
                durationMs: r.durationMs,
                startTime: r.startTime,
              }));

              const newProgram = await generateProgram(program.answers!, recentRuns);
              const newProgramWithAnswers = { ...newProgram, answers: program.answers };

              removeProgram(program.id);
              addProgram(newProgramWithAnswers);
              setActiveProgram(newProgramWithAnswers.id);

              Alert.alert('Done!', 'Your program has been regenerated.');
            } catch (error) {
              Alert.alert('Error', 'Could not regenerate program.');
            } finally {
              setIsRegenerating(false);
            }
          },
        },
      ]
    );
  };

  // Jeg bestemmer hvilke goal-type knapper der vises baseret på session-type
  const availableGoalTypes = (): ('distance' | 'duration' | 'intervals' | 'segments')[] => {
    if (sessionType === 'interval') return ['intervals', 'segments'];
    if (sessionType === 'long') return ['distance', 'segments'];
    if (sessionType === 'rest') return ['duration'];
    return ['distance', 'duration'];
  };

  const goalTypeLabels: Record<string, string> = {
    distance: 'Distance',
    duration: 'Time',
    intervals: 'Intervals',
    segments: 'Custom build',
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.programName}>{program.name}</Text>
        <Text style={styles.programMeta}>
          {program.weeks} weeks · {program.sessions.length} sessions ·{' '}
          {program.generatedByAI ? '✨ AI generated' : '🔧 Manual'}
        </Text>

        {program.generatedByAI && program.answers && (
          <TouchableOpacity
            style={styles.regenerateButton}
            onPress={handleRegenerate}
            disabled={isRegenerating}
          >
            {isRegenerating
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.regenerateButtonText}>✨ Regenerate with AI</Text>
            }
          </TouchableOpacity>
        )}

        <View style={styles.calendarContainer}>
          <Calendar
            markedDates={markedDates}
            onDayPress={(day) => {
              if (editable) {
                setSelectedDate(day.dateString);
                setShowAddModal(true);
              }
            }}
            theme={{
              backgroundColor: '#1c1c1c',
              calendarBackground: '#1c1c1c',
              textSectionTitleColor: '#888',
              dayTextColor: '#fff',
              todayTextColor: '#00C853',
              selectedDayTextColor: '#fff',
              monthTextColor: '#fff',
              arrowColor: '#00C853',
              dotColor: '#00C853',
              textDisabledColor: '#444',
            }}
            current={program.startDate}
          />
        </View>

        {editable && (
          <Text style={styles.editHint}>Tap a day to add a session</Text>
        )}

        <View style={styles.legend}>
          {Object.entries(SESSION_COLORS).filter(([type]) => type !== 'rest').map(([type, color]) => (
            <View key={type} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={styles.legendText}>{SESSION_LABELS[type as SessionType]}</Text>
            </View>
          ))}
        </View>

        {Object.entries(sessionsByWeek)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([week, sessions]) => (
            <View key={week} style={styles.weekContainer}>
              <View style={styles.weekHeader}>
                <Text style={styles.weekTitle}>Week {week}</Text>
                {editable && (
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        'Copy week',
                        `Copy all sessions from week ${week} to week ${Number(week) + 1}?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Copy', onPress: () => copyWeek(Number(week)) },
                        ]
                      );
                    }}
                  >
                    <Text style={styles.copyWeekText}>Copy week →</Text>
                  </TouchableOpacity>
                )}
              </View>
              {sessions
                .sort((a, b) => a.date.localeCompare(b.date))
                .map(session => (
                  <TouchableOpacity
                    key={session.id}
                    style={[styles.sessionCard, session.completed && styles.sessionCardCompleted]}
                    onLongPress={() => {
                      if (editable) {
                        Alert.alert(
                          SESSION_LABELS[session.type],
                          'What would you like to do?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Copy to another day',
                              onPress: () => {
                                setSessionToCopy(session);
                                setCopyMode('copy');
                                setShowCopyModal(true);
                              },
                            },
                            {
                              text: 'Move to another day',
                              onPress: () => {
                                setSessionToCopy(session);
                                setCopyMode('move');
                                setShowCopyModal(true);
                              },
                            },
                          ]
                        );
                      }
                    }}
                    delayLongPress={400}
                  >
                    <View style={[styles.sessionTypeBar, { backgroundColor: SESSION_COLORS[session.type] }]} />
                    <View style={styles.sessionInfo}>
                      <View style={styles.sessionHeader}>
                        <Text style={styles.sessionType}>{SESSION_LABELS[session.type]}</Text>
                        <View style={styles.sessionHeaderRight}>
                          <Text style={styles.sessionDate}>
                            {new Date(session.date).toLocaleDateString('en-GB', {
                              weekday: 'short', day: 'numeric', month: 'short'
                            })}
                          </Text>
                          {editable && (
                            <TouchableOpacity
                              onPress={() => {
                                Alert.alert('Delete session', 'Are you sure?', [
                                  { text: 'Cancel', style: 'cancel' },
                                  { text: 'Delete', style: 'destructive', onPress: () => removeSession(programId, session.id) },
                                ]);
                              }}
                            >
                              <Text style={styles.deleteText}>✕</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                      <Text style={styles.sessionGoal}>{formatGoal(session)}</Text>
                      {session.notes && <Text style={styles.sessionNotes}>{session.notes}</Text>}
                      {session.completed && <Text style={styles.completedBadge}>✓ Completed</Text>}
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          ))}
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                Add session — {selectedDate}
              </Text>

              <Text style={styles.modalLabel}>Session type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
                {(Object.keys(SESSION_LABELS) as SessionType[]).map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeChip, sessionType === type && { backgroundColor: SESSION_COLORS[type] }]}
                    onPress={() => {
                      setSessionType(type);
                      if (type === 'interval') setGoalType('intervals');
                      else if (type === 'long') setGoalType('segments');
                      else if (type === 'rest') setGoalType('duration');
                      else setGoalType('distance');
                      setSegments([]);
                    }}
                  >
                    <Text style={[styles.typeChipText, sessionType === type && styles.typeChipTextSelected]}>
                      {SESSION_LABELS[type]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {SESSION_TEMPLATES[sessionType] && (
                <Text style={styles.templateNote}>
                  💡 {SESSION_TEMPLATES[sessionType]}
                </Text>
              )}

              {sessionType !== 'rest' && (
                <>
                  <Text style={styles.modalLabel}>Goal type</Text>
                  <View style={styles.goalTypeRow}>
                    {availableGoalTypes().map(g => (
                      <TouchableOpacity
                        key={g}
                        style={[styles.goalTypeButton, goalType === g && styles.goalTypeButtonSelected]}
                        onPress={() => setGoalType(g)}
                      >
                        <Text style={[styles.goalTypeText, goalType === g && styles.goalTypeTextSelected]}>
                          {goalTypeLabels[g]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {goalType === 'distance' && (
                    <>
                      <Text style={styles.modalLabel}>Distance (km)</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="e.g. 8"
                        placeholderTextColor="#555"
                        keyboardType="numeric"
                        value={distance}
                        onChangeText={setDistance}
                      />
                      <Text style={styles.modalLabel}>Target pace (min/km, optional)</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="e.g. 5.5 for 5:30/km"
                        placeholderTextColor="#555"
                        keyboardType="numeric"
                        value={pace}
                        onChangeText={setPace}
                      />
                    </>
                  )}

                  {goalType === 'duration' && (
                    <>
                      <Text style={styles.modalLabel}>Duration (minutes)</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="e.g. 45"
                        placeholderTextColor="#555"
                        keyboardType="numeric"
                        value={duration}
                        onChangeText={setDuration}
                      />
                      <Text style={styles.modalLabel}>Target pace (min/km, optional)</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="e.g. 5.5 for 5:30/km"
                        placeholderTextColor="#555"
                        keyboardType="numeric"
                        value={pace}
                        onChangeText={setPace}
                      />
                    </>
                  )}

                  {goalType === 'intervals' && (
                    <>
                      <Text style={styles.modalLabel}>Number of reps</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="e.g. 8"
                        placeholderTextColor="#555"
                        keyboardType="numeric"
                        value={intervalReps}
                        onChangeText={setIntervalReps}
                      />
                      <Text style={styles.modalLabel}>Distance per rep (meters)</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="e.g. 400"
                        placeholderTextColor="#555"
                        keyboardType="numeric"
                        value={intervalDistance}
                        onChangeText={setIntervalDistance}
                      />
                      <Text style={styles.modalLabel}>Target pace (min/km)</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="e.g. 4.5 for 4:30/km"
                        placeholderTextColor="#555"
                        keyboardType="numeric"
                        value={intervalPace}
                        onChangeText={setIntervalPace}
                      />
                      <Text style={styles.modalLabel}>Rest between reps (seconds)</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="e.g. 90"
                        placeholderTextColor="#555"
                        keyboardType="numeric"
                        value={intervalRest}
                        onChangeText={setIntervalRest}
                      />
                    </>
                  )}

                  {goalType === 'segments' && (
                    <>
                      <Text style={styles.modalLabel}>Build your run</Text>
                      <SegmentBuilder
                        segments={segments}
                        onChange={setSegments}
                        mode={sessionType === 'interval' ? 'interval' : 'run'}
                      />
                    </>
                  )}
                </>
              )}

              <Text style={styles.modalLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.modalInput, styles.modalInputMultiline]}
                placeholder="Add coaching notes..."
                placeholderTextColor="#555"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setShowAddModal(false);
                    resetModal();
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalAddButton} onPress={handleAddSession}>
                  <Text style={styles.modalAddText}>Add session</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Kopier session modal */}
      <Modal visible={showCopyModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {copyMode === 'copy' ? 'Copy' : 'Move'} {sessionToCopy ? SESSION_LABELS[sessionToCopy.type] : ''}
            </Text>
            <Text style={styles.modalSubtitle}>
              Select a date to copy this session to
            </Text>

            <Calendar
              onDayPress={(day) => setCopyTargetDate(day.dateString)}
              markedDates={copyTargetDate ? {
                [copyTargetDate]: { selected: true, selectedColor: '#00C853' }
              } : {}}
              theme={{
                backgroundColor: '#1c1c1c',
                calendarBackground: '#1c1c1c',
                textSectionTitleColor: '#888',
                dayTextColor: '#fff',
                todayTextColor: '#00C853',
                selectedDayTextColor: '#fff',
                monthTextColor: '#fff',
                arrowColor: '#00C853',
                textDisabledColor: '#444',
              }}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowCopyModal(false);
                  setSessionToCopy(null);
                  setCopyTargetDate('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalAddButton}
                onPress={() => {
                  if (!copyTargetDate) {
                    Alert.alert('Please select a date.');
                    return;
                  }
                  if (sessionToCopy) {
                    // Tilføj session på ny dato
                    addSession(programId, {
                      ...sessionToCopy,
                      id: Date.now().toString() + Math.random().toString(36).slice(2),
                      date: copyTargetDate,
                      completed: false,
                    });
                    // Hvis move: slet den originale
                    if (copyMode === 'move') {
                      removeSession(programId, sessionToCopy.id);
                    }
                  }
                  setShowCopyModal(false);
                  setSessionToCopy(null);
                  setCopyTargetDate('');
                }}
              >
                <Text style={styles.modalAddText}>
                  {copyMode === 'copy' ? 'Copy session' : 'Move session'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  content: { padding: 24, paddingBottom: 48 },
  errorText: { color: '#888', fontSize: 16, textAlign: 'center', marginTop: 100 },
  programName: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  programMeta: { color: '#888', fontSize: 14, marginBottom: 24 },
  regenerateButton: {
    backgroundColor: '#1a2e1a',
    borderWidth: 1,
    borderColor: '#00C853',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 24,
  },
  regenerateButtonText: {
    color: '#00C853',
    fontSize: 14,
    fontWeight: 'bold',
  },
  calendarContainer: { borderRadius: 12, overflow: 'hidden', marginBottom: 8 },
  editHint: { color: '#555', fontSize: 13, textAlign: 'center', marginBottom: 16 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: '#888', fontSize: 12 },
  weekContainer: { marginBottom: 24 },
  weekHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  weekTitle: {
    color: '#888', fontSize: 13, fontWeight: 'bold',
    textTransform: 'uppercase', letterSpacing: 1,
  },
  copyWeekText: { color: '#00C853', fontSize: 13 },
  sessionCard: {
    backgroundColor: '#1c1c1c', borderRadius: 12,
    marginBottom: 8, flexDirection: 'row', overflow: 'hidden',
  },
  sessionCardCompleted: { opacity: 0.6 },
  sessionTypeBar: { width: 4 },
  sessionInfo: { flex: 1, padding: 14 },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  sessionHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sessionType: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  sessionDate: { color: '#888', fontSize: 13 },
  deleteText: { color: '#F44336', fontSize: 16, fontWeight: 'bold' },
  sessionGoal: { color: '#00C853', fontSize: 14, marginBottom: 4 },
  sessionNotes: { color: '#666', fontSize: 13, fontStyle: 'italic' },
  completedBadge: { color: '#00C853', fontSize: 12, marginTop: 4 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#1c1c1c', borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 24,
    maxHeight: '90%',
  },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  modalSubtitle: { color: '#888', fontSize: 14, marginBottom: 16 },
  modalLabel: {
    color: '#888', fontSize: 13, fontWeight: 'bold',
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 8, marginTop: 16,
  },
  typeScroll: { marginBottom: 4 },
  typeChip: {
    backgroundColor: '#333', paddingVertical: 8,
    paddingHorizontal: 14, borderRadius: 20, marginRight: 8,
  },
  typeChipText: { color: '#888', fontSize: 14 },
  typeChipTextSelected: { color: '#fff', fontWeight: 'bold' },
  templateNote: { color: '#555', fontSize: 13, fontStyle: 'italic', marginTop: 8 },
  goalTypeRow: { flexDirection: 'row', gap: 8 },
  goalTypeButton: {
    flex: 1, backgroundColor: '#333',
    padding: 12, borderRadius: 8, alignItems: 'center',
  },
  goalTypeButtonSelected: { backgroundColor: '#00C853' },
  goalTypeText: { color: '#888', fontSize: 14 },
  goalTypeTextSelected: { color: '#fff', fontWeight: 'bold' },
  modalInput: {
    backgroundColor: '#333', color: '#fff',
    fontSize: 16, padding: 14, borderRadius: 10,
  },
  modalInputMultiline: { height: 80, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
  modalCancelButton: {
    flex: 1, backgroundColor: '#333',
    padding: 16, borderRadius: 12, alignItems: 'center',
  },
  modalCancelText: { color: '#fff', fontSize: 16 },
  modalAddButton: {
    flex: 2, backgroundColor: '#00C853',
    padding: 16, borderRadius: 12, alignItems: 'center',
  },
  modalAddText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});