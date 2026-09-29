import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';

export default function ProfileScreen() {
  const { audioCoachEnabled, setAudioCoachEnabled } = useSettingsStore();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      <Text style={styles.sectionTitle}>Audio Coach</Text>

      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.rowLabel}>Enable audio coach</Text>
          <Text style={styles.rowSubLabel}>Announces km and pace during your run</Text>
        </View>
        <Switch
          value={audioCoachEnabled}
          onValueChange={setAudioCoachEnabled}
          trackColor={{ false: '#333', true: '#00C853' }}
          thumbColor='#fff'
        />
      </View>

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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1c1c1c',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  rowText: {
    flex: 1,
    marginRight: 16,
  },
  rowLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 4,
  },
  rowSubLabel: {
    color: '#888',
    fontSize: 13,
  },
});