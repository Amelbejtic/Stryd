import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { Segment } from '../types/workout';

interface SegmentBuilderProps {
  segments: Segment[];
  onChange: (segments: Segment[]) => void;
  mode: 'run' | 'interval'; // run = progressive, interval = reps med pause
}

// Standardværdier for nye segmenter baseret på mode
const DEFAULT_LABELS_RUN = ['Warm up', 'Main effort', 'Cool down'];
const DEFAULT_LABELS_INTERVAL = ['Rep 1', 'Rep 2', 'Rep 3', 'Rep 4'];

export function SegmentBuilder({ segments, onChange, mode }: SegmentBuilderProps) {

  const addSegment = () => {
    const label = mode === 'run'
      ? `Segment ${segments.length + 1}`
      : `Rep ${segments.length + 1}`;

    const newSegment: Segment = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      label,
      distanceMeters: mode === 'interval' ? 400 : 1000,
      targetPaceMinPerKm: 5.0,
      restSeconds: mode === 'interval' ? 90 : undefined,
    };
    onChange([...segments, newSegment]);
  };

  const updateSegment = (id: string, field: keyof Segment, value: any) => {
    onChange(segments.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeSegment = (id: string) => {
    if (segments.length <= 1) {
      Alert.alert('You need at least one segment.');
      return;
    }
    onChange(segments.filter(s => s.id !== id));
  };

  const moveSegment = (index: number, direction: 'up' | 'down') => {
    const newSegments = [...segments];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= segments.length) return;
    [newSegments[index], newSegments[targetIndex]] = [newSegments[targetIndex], newSegments[index]];
    onChange(newSegments);
  };

  // Beregn total distance
  const totalDistanceM = segments.reduce((sum, s) => sum + (s.distanceMeters ?? 0), 0);
  const totalDistanceKm = (totalDistanceM / 1000).toFixed(1);

  return (
    <View>
      <View style={styles.totalRow}>
        <Text style={styles.totalText}>Total: {totalDistanceKm} km · {segments.length} segments</Text>
      </View>

      {segments.map((segment, index) => (
        <View key={segment.id} style={styles.segmentCard}>
          {/* Header med label og slet-knap */}
          <View style={styles.segmentHeader}>
            <TextInput
              style={styles.labelInput}
              value={segment.label}
              onChangeText={(v) => updateSegment(segment.id, 'label', v)}
              placeholderTextColor="#555"
            />
            <View style={styles.segmentActions}>
              {index > 0 && (
                <TouchableOpacity onPress={() => moveSegment(index, 'up')}>
                  <Text style={styles.moveBtn}>↑</Text>
                </TouchableOpacity>
              )}
              {index < segments.length - 1 && (
                <TouchableOpacity onPress={() => moveSegment(index, 'down')}>
                  <Text style={styles.moveBtn}>↓</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => removeSegment(segment.id)}>
                <Text style={styles.deleteBtn}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Distance */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>
              {mode === 'interval' ? 'Distance (m)' : 'Distance (m)'}
            </Text>
            <TextInput
              style={styles.fieldInput}
              value={segment.distanceMeters?.toString() ?? ''}
              onChangeText={(v) => updateSegment(segment.id, 'distanceMeters', Number(v))}
              keyboardType="numeric"
              placeholder="e.g. 1000"
              placeholderTextColor="#555"
            />
          </View>

          {/* Pace */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Pace (min/km)</Text>
            <TextInput
              style={styles.fieldInput}
              value={segment.targetPaceMinPerKm?.toString() ?? ''}
              onChangeText={(v) => updateSegment(segment.id, 'targetPaceMinPerKm', Number(v))}
              keyboardType="numeric"
              placeholder="e.g. 5.5 = 5:30"
              placeholderTextColor="#555"
            />
          </View>

          {/* Pause — kun for interval mode */}
          {mode === 'interval' && (
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Rest after (sec)</Text>
              <TextInput
                style={styles.fieldInput}
                value={segment.restSeconds?.toString() ?? '0'}
                onChangeText={(v) => updateSegment(segment.id, 'restSeconds', Number(v))}
                keyboardType="numeric"
                placeholder="e.g. 90"
                placeholderTextColor="#555"
              />
            </View>
          )}
        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={addSegment}>
        <Text style={styles.addButtonText}>
          + Add {mode === 'interval' ? 'rep' : 'segment'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  totalRow: { marginBottom: 12 },
  totalText: { color: '#888', fontSize: 13 },
  segmentCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#00C853',
  },
  segmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  labelInput: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    paddingBottom: 4,
  },
  segmentActions: {
    flexDirection: 'row',
    gap: 10,
    marginLeft: 12,
  },
  moveBtn: { color: '#888', fontSize: 18 },
  deleteBtn: { color: '#F44336', fontSize: 16, fontWeight: 'bold' },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: { color: '#888', fontSize: 13, flex: 1 },
  fieldInput: {
    backgroundColor: '#333',
    color: '#fff',
    fontSize: 14,
    padding: 8,
    borderRadius: 8,
    width: 120,
    textAlign: 'right',
  },
  addButton: {
    backgroundColor: '#1c1c1c',
    borderWidth: 1,
    borderColor: '#333',
    borderStyle: 'dashed',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  addButtonText: { color: '#00C853', fontSize: 15 },
});