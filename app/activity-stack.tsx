// Jeg importerer Stack-navigatoren der håndterer frem/tilbage navigation
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// Jeg importerer de to skærme der skal ligge i denne stack
import ActivityScreen from './activity';
import RunDetailScreen, { ActivityStackParamList } from './run-detail';
import { ProfileHeaderButton, SettingsHeaderButton } from '../components/HeaderIcons';

// Jeg opretter en Stack-navigator med de korrekte parametre-typer
const Stack = createNativeStackNavigator<ActivityStackParamList>();

export default function ActivityStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#111' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="ActivityList"
        component={ActivityScreen}
        options={{
          title: 'Aktivitet',
          headerLeft: () => <ProfileHeaderButton />,
          headerRight: () => <SettingsHeaderButton />,
        }}
      />
      <Stack.Screen
        name="RunDetail"
        component={RunDetailScreen}
        options={{ title: 'Løb' }}
      />
    </Stack.Navigator>
  );
}