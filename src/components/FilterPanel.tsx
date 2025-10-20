import React, { useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Filters } from '../types';
import XIcon from '../assets/icons/x.svg';
import FilterIcon from '../assets/icons/filters.svg';
import MultiSlider from '@ptomasroos/react-native-multi-slider';

const screenWidth = Dimensions.get('window').width;

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  maxAltitude?: number;
  maxCapacity?: number;
}

export function FilterPanel({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  maxAltitude = 3250,
  maxCapacity = 30,
}: FilterPanelProps) {
  // Refs to track previous values and which marker is active during dragging
  const altitudePrevRef = useRef<number[]>(filters.altitude);
  const altitudeActiveRef = useRef<number | null>(null);

  const capacityPrevRef = useRef<number[]>(filters.capacity);
  const capacityActiveRef = useRef<number | null>(null);

  const handleAltitudeValuesChange = (values: number[]) => {
    const prev = altitudePrevRef.current;
    // determine active marker if not set
    if (altitudeActiveRef.current === null) {
      const diffs = values.map((v, i) => Math.abs(v - prev[i]));
      const idx = diffs[0] >= diffs[1] ? 0 : 1;
      altitudeActiveRef.current = idx;
    }
    const idx = altitudeActiveRef.current as number;
    const newAltitude = [...prev];
    newAltitude[idx] = values[idx];
    altitudePrevRef.current = newAltitude;
    onFiltersChange({ ...filters, altitude: [newAltitude[0], newAltitude[1]] });
  };

  const handleAltitudeValuesFinish = (values: number[]) => {
    altitudeActiveRef.current = null;
    altitudePrevRef.current = values;
  };

  const handleCapacityValuesChange = (values: number[]) => {
    const prev = capacityPrevRef.current;
    if (capacityActiveRef.current === null) {
      const diffs = values.map((v, i) => Math.abs(v - prev[i]));
      const idx = diffs[0] >= diffs[1] ? 0 : 1;
      capacityActiveRef.current = idx;
    }
    const idx = capacityActiveRef.current as number;
    const newCapacity = [...prev];
    newCapacity[idx] = values[idx];
    capacityPrevRef.current = newCapacity;
    onFiltersChange({ ...filters, capacity: [newCapacity[0], newCapacity[1]] });
  };

  const handleCapacityValuesFinish = (values: number[]) => {
    capacityActiveRef.current = null;
    capacityPrevRef.current = values;
  };
  const locationTypes = [
    { id: 'Cabanne aberta', label: 'No guardat' },
    { id: 'Orri', label: 'Orri' },
    { id: 'Fermée', label: 'Tancat' },
    { id: 'Berger', label: 'Ocupat estiu per pastor' },
    { id: 'Emergencia', label: 'D\'emergencia' },
  ];

  const conditions = [
    { id: 'pobre', label: 'Pobre', color: '#EF4444' },
    { id: 'normal', label: 'Normal', color: '#3B82F6' },
    { id: 'bé', label: 'Bé', color: '#10B981' },
  ];

  const handleTypeChange = (typeId: string) => {
    const newTypes = filters.types.includes(typeId)
      ? filters.types.filter((t) => t !== typeId)
      : [...filters.types, typeId];

    onFiltersChange({ ...filters, types: newTypes });
  };

  const handleConditionChange = (conditionId: 'pobre' | 'normal' | 'bé' | 'excel·lent') => {
    const newConditions = filters.condition.includes(conditionId)
      ? filters.condition.filter((c) => c !== conditionId)
      : [...filters.condition, conditionId];

    onFiltersChange({ ...filters, condition: newConditions });
  };

  const clearFilters = () => {
    onFiltersChange({
      types: [],
      altitude: [0, maxAltitude],
      capacity: [0, maxCapacity],
      condition: [],
    });
  };

  const activeFiltersCount =
    filters.types.length +
    filters.condition.length +
    (filters.altitude[0] > 0 || filters.altitude[1] < maxAltitude ? 1 : 0) +
    (filters.capacity[0] > 0 || filters.capacity[1] < maxCapacity ? 1 : 0);

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.panel}
          onPress={(e) => e.stopPropagation()}
        >
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <FilterIcon width={20} height={20} color="#1E1E1E" />
                <Text style={styles.title}>Filtres</Text>
                {activeFiltersCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{activeFiltersCount}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
              >
                <XIcon width={16} height={16} color="#0A0A0A" />
              </TouchableOpacity>
            </View>

            {/* Tipus d'ubicació */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tipus d'ubicació</Text>
              <View style={styles.optionsGrid}>
                {locationTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={styles.checkboxRow}
                    onPress={() => handleTypeChange(type.id)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        filters.types.includes(type.id) && styles.checkboxChecked,
                      ]}
                    >
                      {filters.types.includes(type.id) && (
                        <View style={styles.checkboxInner} />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Altitud */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Altitud: {filters.altitude[0]}m - {filters.altitude[1]}m
              </Text>
              <View style={styles.multiSliderContainer}>
                <View style={styles.staticUnselectedTrack} />
                <MultiSlider
                  values={[filters.altitude[0], filters.altitude[1]]}
                  min={0}
                  max={maxAltitude}
                  step={50}
                  onValuesChange={handleAltitudeValuesChange}
                  onValuesChangeFinish={handleAltitudeValuesFinish}
                  selectedStyle={styles.selectedTrack}
                  unselectedStyle={{ backgroundColor: 'transparent' }}
                  markerStyle={styles.marker}
                  pressedMarkerStyle={styles.marker}
                  sliderLength={screenWidth - 70} // Adjust dynamically based on screen width
                />
              </View>
            </View>

            {/* Capacitat */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Capacitat: {filters.capacity[0]} - {filters.capacity[1]} places
              </Text>
              <View style={styles.multiSliderContainer}>
                <View style={styles.staticUnselectedTrack} />
                <MultiSlider
                  values={[filters.capacity[0], filters.capacity[1]]}
                  min={0}
                  max={maxCapacity}
                  step={1}
                  onValuesChange={handleCapacityValuesChange}
                  onValuesChangeFinish={handleCapacityValuesFinish}
                  selectedStyle={styles.selectedTrack}
                  unselectedStyle={{ backgroundColor: 'transparent' }}
                  markerStyle={styles.marker}
                  pressedMarkerStyle={styles.marker}
                  sliderLength={screenWidth - 70} // Adjust dynamically based on screen width
                />
              </View>
            </View>

            {/* Estat/Condició */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Estat del refugi</Text>
              <View style={styles.conditionsGrid}>
                {conditions.map((condition) => (
                  <TouchableOpacity
                    key={condition.id}
                    style={styles.checkboxRow}
                    onPress={() => handleConditionChange(condition.id as any)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        filters.condition.includes(condition.id as any) &&
                          styles.checkboxChecked,
                      ]}
                    >
                      {filters.condition.includes(condition.id as any) && (
                        <View
                          style={[
                            styles.checkboxInner,
                            { backgroundColor: condition.color },
                          ]}
                        />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>{condition.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Botons d'acció */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearFilters}
            >
              <Text style={styles.clearButtonText}>Netejar tot</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={onClose}
            >
              <Text style={styles.applyButtonText}>Aplicar filtres</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: 'white',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 10,
  },
  scrollView: {
    paddingHorizontal: 24,
    paddingTop: 25,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A0A0A',
    lineHeight: 24,
  },
  badge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  optionsGrid: {
    gap: 12,
  },
  conditionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: '#FF6900',
    backgroundColor: '#FFF7ED',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: '#FF6900',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#1F2937',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  multiSliderContainer: {
    paddingVertical: 2,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTrack: {
    backgroundColor: '#FF6900',
    height: 20,
    position: 'relative',
  },
  staticUnselectedTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: '#D1D5DB',
    borderRadius: 10,
  },
  marker: {
    backgroundColor: '#FFFFFFFF',
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FF6900',
    marginTop: 20,
  },
  sliderContainer: {
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  rangeSliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  rangeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    width: 35,
  },
  singleRangeContainer: {
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FF6900',
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});
