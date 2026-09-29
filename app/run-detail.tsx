import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { VictoryChart, VictoryLine, VictoryAxis, VictoryArea } from 'victory-native';
import { useHistoryStore } from '../store/historyStore';
import { formatDurationMs, speedToPaceMinutes } from '../utils/calculations';

export type ActivityStackParamList = {
  ActivityList: undefined;
  RunDetail: { runId: string };
};

type NavigationProp = NativeStackNavigationProp<ActivityStackParamList, 'RunDetail'>;

export default function RunDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<ActivityStackParamList, 'RunDetail'>>();
  const { runId } = route.params;
  const { runs, removeRun } = useHistoryStore();
  const run = runs.find(r => r.id === runId);

  if (!run) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Run not found</Text>
      </View>
    );
  }

  const distanceKm = (run.distanceMeters / 1000).toFixed(2);
  const date = new Date(run.startTime).toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const paceData = run.coordinates
    .filter(c => c.speed && c.speed > 0)
    .map((c, i) => ({
      x: i,
      y: speedToPaceMinutes(c.speed!),
    }));

  const altitudeData = run.coordinates
    .filter(c => c.altitude !== null)
    .map((c, i) => ({
      x: i,
      y: c.altitude!,
    }));

  const handleDelete = () => {
    Alert.alert(
      'Delete run',
      'Are you sure you want to delete this run?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeRun(runId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.date}>{date}</Text>

      <View style={styles.statsRow}>
        <View style={styles.statBlock}>
          <Text style={styles.statLabel}>Distance</Text>
          <Text style={styles.statValue}>{distanceKm} km</Text>
        </View>
        <View style={styles.statBlock}>
          <Text style={styles.statLabel}>Time</Text>
          <Text style={styles.statValue}>{formatDurationMs(run.durationMs)}</Text>
        </View>
      </View>

      {paceData.length > 1 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Pace (min/km)</Text>
          <VictoryChart height={200} padding={{ top: 10, bottom: 40, left: 50, right: 20 }}>
            <VictoryAxis
              tickFormat={() => ''}
              style={{ axis: { stroke: '#444' } }}
            />
            <VictoryAxis
              dependentAxis
              invertAxis
              style={{
                axis: { stroke: '#444' },
                tickLabels: { fill: '#888', fontSize: 10 },
                grid: { stroke: '#222' },
              }}
            />
            <VictoryLine
              data={paceData}
              style={{ data: { stroke: '#00C853', strokeWidth: 2 } }}
              interpolation="monotoneX"
            />
          </VictoryChart>
        </View>
      )}

      {altitudeData.length > 1 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Elevation (m)</Text>
          <VictoryChart height={200} padding={{ top: 10, bottom: 40, left: 50, right: 20 }}>
            <VictoryAxis
              tickFormat={() => ''}
              style={{ axis: { stroke: '#444' } }}
            />
            <VictoryAxis
              dependentAxis
              style={{
                axis: { stroke: '#444' },
                tickLabels: { fill: '#888', fontSize: 10 },
                grid: { stroke: '#222' },
              }}
            />
            <VictoryArea
              data={altitudeData}
              style={{
                data: {
                  stroke: '#FF9800',
                  strokeWidth: 2,
                  fill: '#FF9800',
                  fillOpacity: 0.2,
                },
              }}
              interpolation="monotoneX"
            />
          </VictoryChart>
        </View>
      )}

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteText}>Delete run</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  content: { padding: 24, paddingBottom: 48 },
  date: { color: '#888', fontSize: 16, marginBottom: 24, textTransform: 'capitalize' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 32 },
  statBlock: { flex: 1, backgroundColor: '#1c1c1c', borderRadius: 12, padding: 16 },
  statLabel: { color: '#888', fontSize: 14, marginBottom: 8 },
  statValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  chartContainer: { backgroundColor: '#1c1c1c', borderRadius: 12, padding: 16, marginBottom: 16 },
  chartTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  deleteButton: {
    backgroundColor: '#F44336',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  deleteText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  errorText: { color: '#888', fontSize: 16, textAlign: 'center', marginTop: 100 },
});