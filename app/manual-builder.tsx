import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Calendar } from 'react-native-calendars';
import { ProgramStackParamList } from './program-stack';
import { useProgramStore } from '../store/programStore';
import { TrainingProgram } from '../types/workout';

type NavigationProp = NativeStackNavigationProp<ProgramStackParamList, 'ManualBuilder'>;

export default function ManualBuilderScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { addProgram, setActiveProgram } = useProgramStore();

  const [step, setStep] = useState<'create' | 'build'>('create');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [weeks, setWeeks] = useState('');
  const [startDate, setStartDate] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEventCalendar, setShowEventCalendar] = useState(false);
  const [programId, setProgramId] = useState<string | null>(null);

  // Jeg bruger useEffect til navigation — aldrig naviger direkte i render
  useEffect(() => {
    if (step === 'build' && programId) {
      navigation.replace('ProgramDetail', { programId, editable: true });
    }
  }, [step, programId]);

  const handleCreateProgram = () => {
    if (!name.trim()) {
      Alert.alert('Please enter a program name.');
      return;
    }
    if (!startDate) {
      Alert.alert('Please select a start date.');
      return;
    }
    if (!weeks || isNaN(Number(weeks)) || Number(weeks) < 1) {
      Alert.alert('Please enter a valid number of weeks.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + Number(weeks) * 7 - 1);
    const endDate = end.toISOString().split('T')[0];

    const id = Date.now().toString();
    const program: TrainingProgram = {
      id,
      name: name.trim(),
      createdAt: Date.now(),
      startDate,
      endDate,
      weeks: Number(weeks),
      sessions: [],
      isActive: true,
      generatedByAI: false,
    };

    addProgram(program);
    setActiveProgram(id);
    setProgramId(id);
    setStep('build');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Create Program</Text>

      <Text style={styles.label}>Program name *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Marathon prep 2026"
        placeholderTextColor="#555"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Description (optional)</Text>
      <TextInput
        style={[styles.input, styles.inputMultiline]}
        placeholder="What is this program about?"
        placeholderTextColor="#555"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
      />

      <Text style={styles.label}>Number of weeks *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 12"
        placeholderTextColor="#555"
        value={weeks}
        onChangeText={setWeeks}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Start date *</Text>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => {
          setShowStartCalendar(!showStartCalendar);
          setShowEventCalendar(false);
        }}
      >
        <Text style={styles.dateButtonText}>
          {startDate || 'Select start date'}
        </Text>
      </TouchableOpacity>
      {showStartCalendar && (
        <View style={styles.calendarContainer}>
          <Calendar
            onDayPress={(day) => {
              setStartDate(day.dateString);
              setShowStartCalendar(false);
            }}
            markedDates={startDate ? { [startDate]: { selected: true, selectedColor: '#00C853' } } : {}}
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
        </View>
      )}

      <Text style={styles.label}>Goal event date (optional)</Text>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => {
          setShowEventCalendar(!showEventCalendar);
          setShowStartCalendar(false);
        }}
      >
        <Text style={styles.dateButtonText}>
          {eventDate || 'Select event date'}
        </Text>
      </TouchableOpacity>
      {showEventCalendar && (
        <View style={styles.calendarContainer}>
          <Calendar
            onDayPress={(day) => {
              setEventDate(day.dateString);
              setShowEventCalendar(false);
            }}
            markedDates={eventDate ? { [eventDate]: { selected: true, selectedColor: '#FF9800' } } : {}}
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
        </View>
      )}

      <TouchableOpacity style={styles.createButton} onPress={handleCreateProgram}>
        <Text style={styles.createButtonText}>Create & Build Program →</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  content: { padding: 24, paddingBottom: 48 },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  label: {
    color: '#888',
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 20,
  },
  input: {
    backgroundColor: '#1c1c1c',
    color: '#fff',
    fontSize: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  dateButton: {
    backgroundColor: '#1c1c1c',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  dateButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  calendarContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  createButton: {
    backgroundColor: '#00C853',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 40,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});