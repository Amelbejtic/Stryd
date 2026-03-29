import { StatusBar } from 'expo-status-bar';
import TrackingScreen from './app/tracking';

export default function App() {
  return (
    <>
      <TrackingScreen />
      <StatusBar style="auto" />
    </>
  );
}