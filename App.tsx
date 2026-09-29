// Jeg importerer min navigationsstruktur fra app-mappen
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Layout from './app/_layout';

// App er entry-point-komponenten — den renderer bare navigationen
export default function App() {
  return (
    <SafeAreaProvider>
      <Layout />
    </SafeAreaProvider>
  );
}