import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ExpandableCalendar, CalendarProvider } from 'react-native-calendars';
import { useProgramStore } from '../store/programStore';
import { TodayStackParamList } from './today-stack';
import { ProgramSession, SessionType } from '../types/workout';
import { ProfileHeaderButton, SettingsHeaderButton } from '../components/HeaderIcons';

type NavigationProp = NativeStackNavigationProp<TodayStackParamList, 'TodayHome'>;

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

export default function TodayScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { programs } = useProgramStore();
  const activeProgram = programs.find(p => p.isActive) ?? null;
  const insets = useSafeAreaInsets();

  const today = new Date().toISOString().split('T')[0];
  const todaySessions = activeProgram?.sessions.filter(s => s.date === today) ?? [];
  const isRestDay = todaySessions.length === 0 || todaySessions.every(s => s.type === 'rest');

  // Jeg bygger marked dates til kalenderen fra det aktive program
  const markedDates = activeProgram?.sessions.reduce((acc, session) => {
    const color = SESSION_COLORS[session.type];
    const existing = acc[session.date];
    return {
      ...acc,
      [session.date]: {
        marked: true,
        dotColor: session.completed ? '#555' : color,
        selected: session.date === today,
        selectedColor: session.date === today ? '#1a2e1a' : undefined,
        selectedTextColor: '#fff',
      },
    };
  }, {} as Record<string, any>) ?? {
    [today]: { selected: true, selectedColor: '#1a2e1a', selectedTextColor: '#fff' }
  };

  // Formaterer session-målet til læsbar streng
  const formatGoal = (session: ProgramSession): string => {
    const goal = session.goal;
    if (goal.type === 'distance') {
      const pace = goal.targetPaceMinPerKm
        ? ` @ ${Math.floor(goal.targetPaceMinPerKm)}:${Math.round((goal.targetPaceMinPerKm % 1) * 60).toString().padStart(2, '0')}/km`
        : '';
      return `${goal.distanceKm} km${pace}`;
    }
    if (goal.type === 'duration') return `${goal.durationMinutes} min`;
    if (goal.type === 'intervals') {
      const rep = goal.reps[0];
      return `${goal.reps.length}x ${rep.distanceMeters}m @ ${Math.floor(rep.targetPaceMinPerKm)}:${Math.round((rep.targetPaceMinPerKm % 1) * 60).toString().padStart(2, '0')}/km`;
    }
    if (goal.type === 'segments') {
      const totalKm = (goal.segments.reduce((sum, s) => sum + (s.distanceMeters ?? 0), 0) / 1000).toFixed(1);
      return `${goal.segments.length} segments · ${totalKm} km`;
    }
    return '';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* App header — profil venstre, Stryd-branding centreret, indstillinger højre */}
      <View style={styles.appHeader}>
        <ProfileHeaderButton />
        <View style={styles.appHeaderCenter}>
          <Text style={styles.appHeaderIcon}>🏃</Text>
          <Text style={styles.appHeaderTitle}>Stryd</Text>
        </View>
        <SettingsHeaderButton />
      </View>

      {/* Kalender — ligger uden for ScrollView'en så dens egen træk-gestus (op/ned for at folde ud til måned) ikke kolliderer med sidens scroll */}
      <View style={styles.calendarContainer}>
        <CalendarProvider date={today}>
          <ExpandableCalendar
            markedDates={markedDates}
            firstDay={1}
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
              // 'expandableKnobColor' styrer håndtagets farve, men mangler i typen selvom runtime bruger den
              ...({ expandableKnobColor: '#333' } as any),
            }}
          />
        </CalendarProvider>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Dagens program */}
        {activeProgram ? (
          <View style={styles.todaySection}>
            <Text style={styles.sectionTitle}>Today</Text>

            {isRestDay ? (
              <View style={styles.restCard}>
                <Text style={styles.restEmoji}>😴</Text>
                <Text style={styles.restTitle}>Rest day</Text>
                <Text style={styles.restSubtitle}>
                  Recovery is part of training. Take it easy today, {activeProgram.name.split(' ')[0]}.
                </Text>
              </View>
            ) : (
              todaySessions.map(session => (
                <TouchableOpacity
                  key={session.id}
                  style={[styles.sessionCard, { borderLeftColor: SESSION_COLORS[session.type] }]}
                  onPress={() => navigation.navigate('Tracking', { sessionId: session.id, sessionType: session.type })}
                >
                  <View style={styles.sessionCardHeader}>
                    <Text style={styles.sessionType}>{SESSION_LABELS[session.type]}</Text>
                    {session.completed && <Text style={styles.completedBadge}>✓ Done</Text>}
                  </View>
                  <Text style={styles.sessionGoal}>{formatGoal(session)}</Text>
                  {session.notes && <Text style={styles.sessionNotes}>{session.notes}</Text>}
                  {!session.completed && (
                    <Text style={styles.startHint}>Tap to start →</Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : (
          <View style={styles.noProgramSection}>
            <Text style={styles.noProgramText}>No active program</Text>
            <Text style={styles.noProgramSubtext}>Create or activate a program in the Program tab.</Text>
          </View>
        )}

      </ScrollView>

      {/* Record workout knap — fast i bunden */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.recordButton}
          onPress={() => navigation.navigate('Tracking', {})}
        >
          <Text style={styles.recordButtonText}>⏱ Record workout</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  content: { padding: 24, paddingBottom: 120 },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  appHeaderCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appHeaderIcon: { fontSize: 22 },
  appHeaderTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  calendarContainer: {
    overflow: 'hidden',
  },
  todaySection: { marginBottom: 24 },
  sectionTitle: {
    color: '#888',
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  restCard: {
    backgroundColor: '#1c1c1c',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  restEmoji: { fontSize: 40, marginBottom: 12 },
  restTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  restSubtitle: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  sessionCard: {
    backgroundColor: '#1c1c1c',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionType: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  completedBadge: {
    color: '#00C853',
    fontSize: 13,
    fontWeight: 'bold',
  },
  sessionGoal: {
    color: '#00C853',
    fontSize: 15,
    marginBottom: 6,
  },
  sessionNotes: {
    color: '#666',
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  startHint: {
    color: '#555',
    fontSize: 13,
    marginTop: 4,
  },
  noProgramSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noProgramText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noProgramSubtext: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 34,
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  recordButton: {
    backgroundColor: '#00C853',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});