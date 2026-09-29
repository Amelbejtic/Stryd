import { View, Text, StyleSheet } from 'react-native';

// Placeholder — bygges ud med stats og profiloplysninger senere
export default function AccountScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>👤</Text>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>Stats and profile info coming soon.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: '#888', fontSize: 14, textAlign: 'center' },
});
