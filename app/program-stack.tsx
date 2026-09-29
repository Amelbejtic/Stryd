import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProgramScreen from './program';
import AIQuestionnaireScreen from './ai-questionnaire';
import ProgramDetailScreen from './program-detail';
import ManualBuilderScreen from './manual-builder';
import { ProfileHeaderButton, SettingsHeaderButton } from '../components/HeaderIcons';

export type ProgramStackParamList = {
  ProgramList: undefined;
  AIQuestionnaire: undefined;
  ManualBuilder: { programId?: string };
  ProgramDetail: { programId: string; editable?: boolean };
};

const Stack = createNativeStackNavigator<ProgramStackParamList>();

export default function ProgramStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#111' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="ProgramList"
        component={ProgramScreen}
        options={{
          title: 'Programs',
          headerLeft: () => <ProfileHeaderButton />,
          headerRight: () => <SettingsHeaderButton />,
        }}
      />
      <Stack.Screen
        name="AIQuestionnaire"
        component={AIQuestionnaireScreen}
        options={{ title: 'Generate Program' }}
      />
      <Stack.Screen
        name="ProgramDetail"
        component={ProgramDetailScreen}
        options={{ title: 'Program' }}
      />
      <Stack.Screen
        name="ManualBuilder"
        component={ManualBuilderScreen}
        options={{ title: 'Build Program' }}
        />
    </Stack.Navigator>
  );
}