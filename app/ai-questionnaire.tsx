import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProgramStackParamList } from './program-stack';
import { generateProgram } from '../utils/generateProgram';
import { useProgramStore } from '../store/programStore';
import { useHistoryStore } from '../store/historyStore';

type NavigationProp = NativeStackNavigationProp<ProgramStackParamList, 'AIQuestionnaire'>;

// Jeg definerer alle spørgsmål og deres typer
// Dette gør det nemt at tilføje/fjerne spørgsmål uden at ændre selve UI-logikken
const QUESTIONS = [
  {
    id: 'name',
    question: 'What is your name?',
    type: 'text',
    placeholder: 'Your name',
  },
  {
    id: 'age',
    question: 'How old are you?',
    type: 'number',
    placeholder: 'Age in years',
  },
  {
    id: 'weight',
    question: 'What is your weight?',
    type: 'number',
    placeholder: 'Weight in kg',
  },
  {
    id: 'experience',
    question: 'What is your running experience?',
    type: 'choice',
    options: ['Beginner', 'Intermediate', 'Advanced', 'Elite'],
  },
  {
    id: 'goal',
    question: 'What is your main goal?',
    type: 'choice',
    options: ['5K', '10K', 'Half marathon', 'Marathon', 'Weight loss', 'General fitness'],
  },
  {
    id: 'hasEvent',
    question: 'Do you have a specific race or event?',
    type: 'choice',
    options: ['Yes', 'No'],
  },
  {
    id: 'eventDate',
    question: 'When is your event? (dd/mm/yyyy)',
    type: 'text',
    placeholder: 'e.g. 15/09/2026',
    conditionalOn: { id: 'hasEvent', value: 'Yes' },
  },
  {
    id: 'weeks',
    question: 'How many weeks do you want the program to last?',
    type: 'number',
    placeholder: 'Number of weeks (e.g. 12)',
  },
  {
    id: 'daysPerWeek',
    question: 'How many days per week can you run?',
    type: 'choice',
    options: ['2', '3', '4', '5', '6'],
  },
  {
    id: 'sessionTypes',
    question: 'What types of runs do you prefer?',
    type: 'multichoice',
    options: ['Easy runs', 'Intervals', 'Long runs', 'Tempo runs'],
  },
  {
    id: 'terrainType',
    question: 'What terrain do you prefer?',
    type: 'choice',
    options: ['Road', 'Trail', 'Track', 'Mixed'],
  },
  {
    id: 'maxHeartRate',
    question: 'Do you know your max heart rate?',
    type: 'choice',
    options: ['Yes', 'No'],
  },
  {
    id: 'maxHeartRateValue',
    question: 'What is your max heart rate (bpm)?',
    type: 'number',
    placeholder: 'e.g. 185',
    conditionalOn: { id: 'maxHeartRate', value: 'Yes' },
  },
  {
    id: 'injuries',
    question: 'Do you have any injuries or limitations?',
    type: 'text',
    placeholder: 'e.g. knee pain, none',
  },
  {
    id: 'restDays',
    question: 'Which days do you prefer to rest?',
    type: 'multichoice',
    options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  },
] as const;

export default function AIQuestionnaireScreen() {
  const navigation = useNavigation<NavigationProp>();

  // currentStep holder styr på hvilket spørgsmål vi er på
  const [currentStep, setCurrentStep] = useState(0);

  // answers er et objekt hvor nøglen er spørgsmålets id og værdien er svaret
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  const [isGenerating, setIsGenerating] = useState(false);
    const { addProgram, setActiveProgram } = useProgramStore();
    const { runs } = useHistoryStore();

  // Jeg filtrerer spørgsmål der har en betingelse og betingelsen ikke er opfyldt
  const visibleQuestions = QUESTIONS.filter(q => {
    if (!('conditionalOn' in q) || !q.conditionalOn) return true;
    return answers[q.conditionalOn.id] === q.conditionalOn.value;
  });

  const currentQuestion = visibleQuestions[currentStep];
  const isLastStep = currentStep === visibleQuestions.length - 1;
  const progress = (currentStep + 1) / visibleQuestions.length;

  const handleAnswer = (value: string | string[]) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

const handleNext = async () => {
  if (!answers[currentQuestion.id]) {
    Alert.alert('Please answer the question before continuing.');
    return;
  }
  if (isLastStep) {
    setIsGenerating(true);
    try {
      // Jeg henter de seneste løb fra historikken til AI'en
      const recentRuns = runs.map(r => ({
        distanceMeters: r.distanceMeters,
        durationMs: r.durationMs,
        startTime: r.startTime,
      }));

      const program = await generateProgram(answers, recentRuns);

      // Jeg gemmer svarene på programmet så vi kan regenerere senere
      const programWithAnswers = { ...program, answers };

      addProgram(programWithAnswers);
      setActiveProgram(programWithAnswers.id);

      // Jeg navigerer tilbage til program-oversigten
      navigation.navigate('ProgramList');
    } catch (error) {
      Alert.alert('Error', 'Could not generate program. Please try again.');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  } else {
    setCurrentStep(prev => prev + 1);
  }
};

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
    else navigation.goBack();
  };

  const currentAnswer = answers[currentQuestion.id];

  return (
    <View style={styles.container}>

      {/* Progress bar øverst */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      </View>

      <Text style={styles.stepText}>
        {currentStep + 1} / {visibleQuestions.length}
      </Text>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <Text style={styles.question}>{currentQuestion.question}</Text>

        {/* Text input */}
        {currentQuestion.type === 'text' && (
          <TextInput
            style={styles.input}
            placeholder={'placeholder' in currentQuestion ? currentQuestion.placeholder : ''}
            placeholderTextColor='#555'
            value={typeof currentAnswer === 'string' ? currentAnswer : ''}
            onChangeText={handleAnswer}
          />
        )}

        {/* Number input */}
        {currentQuestion.type === 'number' && (
          <TextInput
            style={styles.input}
            placeholder={'placeholder' in currentQuestion ? currentQuestion.placeholder : ''}
            placeholderTextColor='#555'
            keyboardType='numeric'
            value={typeof currentAnswer === 'string' ? currentAnswer : ''}
            onChangeText={handleAnswer}
          />
        )}

        {/* Single choice */}
        {currentQuestion.type === 'choice' && 'options' in currentQuestion && (
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map(option => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.option,
                  currentAnswer === option && styles.optionSelected,
                ]}
                onPress={() => handleAnswer(option)}
              >
                <Text style={[
                  styles.optionText,
                  currentAnswer === option && styles.optionTextSelected,
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Multi choice */}
        {currentQuestion.type === 'multichoice' && 'options' in currentQuestion && (
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map(option => {
              const selected = Array.isArray(currentAnswer) && currentAnswer.includes(option);
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => {
                    const current = Array.isArray(currentAnswer) ? currentAnswer : [];
                    // Jeg tilføjer eller fjerner valget fra listen
                    const updated = selected
                      ? current.filter(v => v !== option)
                      : [...current, option];
                    handleAnswer(updated);
                  }}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Navigation knapper */}
      <View style={styles.navigation}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
<TouchableOpacity 
  style={[styles.nextButton, isGenerating && styles.nextButtonDisabled]} 
  onPress={handleNext}
  disabled={isGenerating}
>
  {isGenerating ? (
    <ActivityIndicator color="#fff" />
  ) : (
    <Text style={styles.nextButtonText}>
      {isLastStep ? 'Generate program' : 'Next'}
    </Text>
  )}
</TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  progressContainer: {
    height: 4,
    backgroundColor: '#222',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#00C853',
  },
  stepText: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 12,
  },
  content: { flex: 1 },
  contentInner: { padding: 24 },
  question: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 32,
    lineHeight: 32,
  },
  input: {
    backgroundColor: '#1c1c1c',
    color: '#fff',
    fontSize: 18,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  optionsContainer: { gap: 10 },
  option: {
    backgroundColor: '#1c1c1c',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  optionSelected: {
    backgroundColor: '#1a2e1a',
    borderColor: '#00C853',
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
  },
  optionTextSelected: {
    color: '#00C853',
    fontWeight: 'bold',
  },
  navigation: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#1c1c1c',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#00C853',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButtonDisabled: {
  backgroundColor: '#005c26',
},
});