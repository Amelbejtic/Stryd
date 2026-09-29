import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { VictoryBar, VictoryChart, VictoryAxis } from 'victory-native';
import { useHistoryStore } from '../store/historyStore';
import { formatDurationMs, getWeeklyKm } from '../utils/calculations';
import { CompletedRun } from '../types/workout';
import { ActivityStackParamList } from './run-detail';

type ActivityNavigationProp = NativeStackNavigationProp<ActivityStackParamList, 'ActivityList'>;

export default function ActivityScreen() {
  const { runs } = useHistoryStore();
  const navigation = useNavigation<ActivityNavigationProp>();

  const weeklyData = getWeeklyKm(runs);

  const renderRun = ({ item }: { item: CompletedRun }) => {
    const distanceKm = (item.distanceMeters / 1000).toFixed(2);
    // Engelsk dato-format
    const date = new Date(item.startTime).toLocaleDateString('en-GB');

    return (
      <TouchableOpacity
        style={styles.runItem}
        onPress={() => navigation.navigate('RunDetail', { runId: item.id })}
      >
        <Text style={styles.date}>{date}</Text>
        <View style={styles.statsRow}>
          <Text style={styles.stat}>{distanceKm} km</Text>
          <Text style={styles.stat}>{formatDurationMs(item.durationMs)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Km per week</Text>
      {weeklyData.length === 0 ? (
        <Text style={styles.noDataText}>No data yet</Text>
      ) : (
        <VictoryChart height={200} padding={{ top: 10, bottom: 40, left: 50, right: 20 }}>
          <VictoryAxis
            style={{
              axis: { stroke: '#444' },
              tickLabels: { fill: '#888', fontSize: 10 },
            }}
          />
          <VictoryAxis
            dependentAxis
            style={{
              axis: { stroke: '#444' },
              tickLabels: { fill: '#888', fontSize: 10 },
              grid: { stroke: '#222' },
            }}
          />
          <VictoryBar
            data={weeklyData}
            style={{ data: { fill: '#00C853' } }}
            cornerRadius={{ top: 4 }}
          />
        </VictoryChart>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {runs.length === 0 ? (
        <Text style={styles.emptyText}>No runs yet</Text>
      ) : (
        <FlatList
          data={runs}
          keyExtractor={(item) => item.id}
          renderItem={renderRun}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  list: { padding: 16 },
  emptyText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  chartContainer: {
    backgroundColor: '#1c1c1c',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noDataText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 40,
  },
  runItem: {
    backgroundColor: '#1c1c1c',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  date: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});