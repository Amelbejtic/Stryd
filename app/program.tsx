import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useProgramStore } from '../store/programStore';
import { ProgramStackParamList } from './program-stack';

type NavigationProp = NativeStackNavigationProp<ProgramStackParamList, 'ProgramList'>;

export default function ProgramScreen() {
  const { programs, setActiveProgram } = useProgramStore();
  const navigation = useNavigation<NavigationProp>();

  const activeProgram = programs.find(p => p.isActive) ?? null;
  const inactivePrograms = programs.filter(p => !p.isActive);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <Text style={styles.sectionTitle}>Active Program</Text>
      {activeProgram ? (
        <View style={styles.activeProgramCard}>
          <Text style={styles.programName}>{activeProgram.name}</Text>
          <Text style={styles.programMeta}>
            {activeProgram.weeks} weeks · {activeProgram.sessions.length} sessions
          </Text>
          <Text style={styles.programMeta}>
            {new Date(activeProgram.startDate).toLocaleDateString('en-GB')} →{' '}
            {new Date(activeProgram.endDate).toLocaleDateString('en-GB')}
          </Text>
          <View style={styles.programActions}>
   <TouchableOpacity
  style={styles.viewButton}
  onPress={() => navigation.navigate('ProgramDetail', { programId: activeProgram.id })}
>
  <Text style={styles.viewButtonText}>View program</Text>
</TouchableOpacity>
          </View>
        </View>
      ) : (
        <Text style={styles.emptyText}>No active program</Text>
      )}

      <View style={styles.createButtons}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('AIQuestionnaire')}
        >
          <Text style={styles.createButtonText}>✨ Generate with AI</Text>
        </TouchableOpacity>
        <TouchableOpacity
  style={styles.createButtonSecondary}
  onPress={() => navigation.navigate('ManualBuilder', {})}
>
          <Text style={styles.createButtonSecondaryText}>+ Build manually</Text>
        </TouchableOpacity>
      </View>

      {inactivePrograms.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Other programs</Text>
          {inactivePrograms.map(program => (
            <TouchableOpacity
              key={program.id}
              style={styles.programCard}
              onPress={() => setActiveProgram(program.id)}
            >
              <Text style={styles.programName}>{program.name}</Text>
              <Text style={styles.programMeta}>
                {program.weeks} weeks · {program.sessions.length} sessions
              </Text>
              <Text style={styles.setActiveText}>Tap to set active</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  content: { padding: 24 },
  sectionTitle: {
    color: '#888',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  activeProgramCard: {
    backgroundColor: '#1a2e1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#00C853',
    marginBottom: 24,
  },
  programCard: {
    backgroundColor: '#1c1c1c',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  programName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  programMeta: {
    color: '#888',
    fontSize: 14,
    marginBottom: 4,
  },
  programActions: {
    marginTop: 16,
  },
  viewButton: {
    backgroundColor: '#00C853',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 32,
  },
  createButtons: {
    gap: 12,
    marginBottom: 32,
  },
  createButton: {
    backgroundColor: '#00C853',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createButtonSecondary: {
    backgroundColor: '#1c1c1c',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  createButtonSecondaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  setActiveText: {
    color: '#00C853',
    fontSize: 13,
    marginTop: 8,
  },
});