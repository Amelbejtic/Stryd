import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Account og Settings ligger i rod-stacken uden for faneskiftet
// React Navigation "bobler" navigate() op til den nærmeste navigator der kender ruten
export function ProfileHeaderButton() {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => (navigation as any).navigate('Account')}
    >
      <Text style={styles.icon}>👤</Text>
    </TouchableOpacity>
  );
}

export function SettingsHeaderButton() {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => (navigation as any).navigate('Settings')}
    >
      <Text style={styles.icon}>⚙️</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  icon: {
    fontSize: 20,
  },
});
