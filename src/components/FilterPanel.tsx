import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Filters } from '../types';
import XIcon from '../assets/icons/x.svg';
import FilterIcon from '../assets/icons/filters.svg';
import { BadgeType } from './BadgeType';
import { BadgeCondition } from './BadgeCondition';
import MultiSlider from '@ptomasroos/react-native-multi-slider';

const screenWidth = Dimensions.get('window').width;

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  maxAltitude?: number;
  maxPlaces?: number;
}

export function FilterPanel({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  maxAltitude = 3250,
  maxPlaces = 30,
}: FilterPanelProps) {
  const locationTypes = [
    { id: 'No guardat', label: 'No guardat' },
    { id: 'Orri', label: 'Orri' },
    { id: 'D\'emergencia', label: "D'emergencia" },
    { id: 'Ocupat estiu per pastor', label: 'Ocupat estiu per pastor' },
    { id: 'Tancat', label: 'Tancat' },
  ];

  const conditions = [
    { id: 'pobre', label: 'Pobre' },
    { id: 'normal', label: 'Normal' },
    { id: 'bé', label: 'Bé' },
  ];

  // Use a local copy of filters so changes are only emitted when the user
  // explicitly applies them.
  const [localFilters, setLocalFilters] = useState<Filters>(filters);

  // When the panel opens, reset local filters to the current props.filters
  useEffect(() => {
    if (isOpen) setLocalFilters(filters);
  }, [isOpen, filters]);

  const handleTypeChange = (typeId: string) => {
    const newTypes = localFilters.types.includes(typeId)
      ? localFilters.types.filter((t) => t !== typeId)
      : [...localFilters.types, typeId];

    setLocalFilters({ ...localFilters, types: newTypes });
  };

  const handleConditionChange = (conditionId: 'pobre' | 'normal' | 'bé') => {
    const newConditions = localFilters.condition.includes(conditionId)
      ? localFilters.condition.filter((c) => c !== conditionId)
      : [...localFilters.condition, conditionId];

    setLocalFilters({ ...localFilters, condition: newConditions });
  };

  const clearFilters = () => {
    const cleared: Filters = {
      types: [],
      altitude: [0, maxAltitude],
      places: [0, maxPlaces],
      condition: [],
    };

    // Helper: shallow compare arrays
    const arrEq = (a: any[], b: any[]) => {
      if (a === b) return true;
      if (!a || !b) return false;
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
      return true;
    };

    // Helper to check equality between Filters
    const filtersEq = (a: Filters, b: Filters) =>
      arrEq(a.types, b.types) &&
      arrEq(a.condition, b.condition) &&
      arrEq(a.altitude, b.altitude) &&
      arrEq(a.places, b.places);

    // If there are unsaved changes (localFilters != applied props.filters),
    // revert local UI to the applied filters and do NOT call the API.
    if (!filtersEq(localFilters, filters)) {
      setLocalFilters(filters);
      return;
    }

    // At this point localFilters equals applied filters. If applied filters are already cleared, do nothing.
    const alreadyCleared = filtersEq(filters, cleared);
    if (alreadyCleared) return;

    // Otherwise, clear and emit cleared filters so parent can fetch without filters.
    setLocalFilters(cleared);
    onFiltersChange(cleared);
    // Keep the panel open (do not call onClose) so the user can continue adjusting filters
  };

  const activeFiltersCount =
    localFilters.types.length +
    localFilters.condition.length +
    (localFilters.altitude[0] > 0 || localFilters.altitude[1] < maxAltitude ? 1 : 0) +
    (localFilters.places[0] > 0 || localFilters.places[1] < maxPlaces ? 1 : 0);

  const [isDragging, setIsDragging] = useState(false);

  const handleScrollBegin = () => setIsDragging(true);
  const handleScrollEnd = () => setIsDragging(false);
  const handleTouchStart = () => setIsDragging(true);

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
        onPress={() => {
          if (!isDragging) onClose();
        }}
      >
        <TouchableWithoutFeedback onPress={() => { /* prevent overlay press */ }}>
          <View
            style={styles.panel}
            // Using View instead of TouchableOpacity to avoid swallowing gestures
          >
          {/* Header - fixed above scroll content */}
          <View style={styles.headerFixed}>
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

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            decelerationRate="normal"
            scrollEventThrottle={16}
            onScrollBeginDrag={handleScrollBegin}
            onScrollEndDrag={handleScrollEnd}
            onMomentumScrollBegin={handleScrollBegin}
            onMomentumScrollEnd={handleScrollEnd}
            onTouchStart={handleTouchStart}
          >

            {/* Tipus d'ubicació */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tipus de refugi</Text>
              <View style={styles.optionsGrid}>
                <View style={styles.badgesRow}>
                  {locationTypes.map((type) => {
                    const selected = localFilters.types.includes(type.id);
                    return (
                      <TouchableOpacity
                        key={type.id}
                        style={[styles.badgeWrapper, selected ? styles.badgeSelectedWrapper : styles.badgeUnselectedWrapper]}
                        onPress={() => handleTypeChange(type.id)}
                        activeOpacity={0.8}
                      >
                        {/* When unselected, render BadgeType but force grey/transparent look via containerStyle */}
                        <BadgeType
                          type={type.label}
                          style={selected ? undefined : styles.badgeUnselected}
                          muted={!selected}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Altitud */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                Altitud: {localFilters.altitude[0]}m - {localFilters.altitude[1]}m
              </Text>
              <View style={styles.multiSliderContainer}>
                <View style={styles.staticUnselectedTrack} />
                <MultiSlider
                  values={[localFilters.altitude[0], localFilters.altitude[1]]}
                  min={0}
                  max={maxAltitude}
                  step={50}
                  onValuesChange={(values) => {
                    setLocalFilters({ ...localFilters, altitude: [values[0], values[1]] });
                  }}
                  selectedStyle={styles.selectedTrack}
                  unselectedStyle={{ backgroundColor: 'transparent' }}
                  markerStyle={styles.marker}
                  pressedMarkerStyle={styles.marker}
                  sliderLength={screenWidth - 70} // Adjust dynamically based on screen width
                  allowOverlap={false}
                  snapped={true}
                  minMarkerOverlapDistance={10}
                />
              </View>
            </View>

            {/* Capacitat */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                Capacitat: {localFilters.places[0]} - {localFilters.places[1]} places
              </Text>
              <View style={styles.multiSliderContainer}>
                <View style={styles.staticUnselectedTrack} />
                <MultiSlider
                  values={[localFilters.places[0], localFilters.places[1]]}
                  min={0}
                  max={maxPlaces}
                  step={1}
                  onValuesChange={(values) => {
                    setLocalFilters({ ...localFilters, places: [values[0], values[1]] });
                  }}
                  selectedStyle={styles.selectedTrack}
                  unselectedStyle={{ backgroundColor: 'transparent' }}
                  markerStyle={styles.marker}
                  pressedMarkerStyle={styles.marker}
                  sliderLength={screenWidth - 70} // Adjust dynamically based on screen width
                  allowOverlap={true}
                  snapped={true}
                />
              </View>
            </View>

            {/* Estat/Condició */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Estat</Text>
              <View style={styles.conditionsGrid}>
                <View style={styles.badgesRow}>
                  {conditions.map((condition) => {
                    const selected = localFilters.condition.includes(condition.id as any);
                    return (
                      <TouchableOpacity
                        key={condition.id}
                        style={[styles.badgeWrapper, selected ? styles.badgeSelectedWrapper : styles.badgeUnselectedWrapper]}
                        onPress={() => handleConditionChange(condition.id as any)}
                        activeOpacity={0.8}
                      >
                        <BadgeCondition
                          condition={condition.label}
                          style={selected ? undefined : styles.badgeUnselected}
                          muted={!selected}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
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
              onPress={() => {
                // Emit the selected filters to parent and then close
                onFiltersChange(localFilters);
                onClose();
              }}
            >
              <Text style={styles.applyButtonText}>Aplicar filtres</Text>
            </TouchableOpacity>
          </View>
  </View>
        </TouchableWithoutFeedback>
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
  },
  headerFixed: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: 'white',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    zIndex: 20,
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
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  badgeWrapper: {
    marginRight: 8,
    marginBottom: 8,
  },
  badgeSelectedWrapper: {
    // keep default
  },
  badgeUnselectedWrapper: {
    // keep default
  },
  badgeUnselected: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
    opacity: 0.7,
  },
});
