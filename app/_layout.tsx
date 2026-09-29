import ActivityStack from './activity-stack';

// Jeg importerer navigation-bibliotekerne vi skal bruge til faner i bunden
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

// Jeg importerer alle fire skærme der skal ligge bag fanerne
import TodayStack from './today-stack';
import ProgramStack from './program-stack';
import ProfileScreen from './profile';

// Account og Settings er ekstra sider man klikker sig ind på fra hjørne-ikonerne
// De ligger uden for Tab.Navigator så de kan dække fanebjælken når de åbnes
import AccountScreen from './account';
import SettingsScreen from './settings';
import { ProfileHeaderButton, SettingsHeaderButton } from '../components/HeaderIcons';

// Jeg opretter en Tab-navigator — det er den der styrer fanerne i bunden
const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        // Jeg sætter det generelle udseende for alle faner
        tabBarStyle: {
          backgroundColor: '#111',
          borderTopColor: '#222',
        },
        tabBarActiveTintColor: '#00C853',   // aktiv fane er grøn
        tabBarInactiveTintColor: '#888',     // inaktiv fane er grå
        headerShown: false,                  // jeg skjuler den øverste header
      }}
    >
      <Tab.Screen name="Today" component={TodayStack} />
      <Tab.Screen name="Program" component={ProgramStack} />
      <Tab.Screen name="Activity" component={ActivityStack} />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: true,
          title: 'Profile',
          headerStyle: { backgroundColor: '#111' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          headerLeft: () => <ProfileHeaderButton />,
          headerRight: () => <SettingsHeaderButton />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function Layout() {
  return (
    // NavigationContainer er den ydre wrapper som hele navigationen lever inden i
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#111' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <RootStack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <RootStack.Screen name="Account" component={AccountScreen} options={{ title: 'Profile' }} />
        <RootStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}