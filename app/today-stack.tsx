import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TodayScreen from './today';
import TrackingScreen from './tracking';

export type TodayStackParamList = {
  TodayHome: undefined;
  Tracking: { sessionId?: string; sessionType?: string };
};

const Stack = createNativeStackNavigator<TodayStackParamList>();

export default function TodayStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#111' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerShown: false,
      }}
    >
      <Stack.Screen name="TodayHome" component={TodayScreen} />
      <Stack.Screen
        name="Tracking"
        component={TrackingScreen}
        options={{ headerShown: true, title: 'Workout' }}
      />
    </Stack.Navigator>
  );
}