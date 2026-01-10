import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import XIcon from '../assets/icons/x.svg';
import LayersIcon from '../assets/icons/layers.svg';
import { useTranslation } from '../hooks/useTranslation';

const MarkersImage = require('../assets/images/Markers.jpeg');
const ClustersImage = require('../assets/images/Clusters.jpeg');
const OpenStreetMapImage = require('../assets/images/OpenStreetMap.jpeg');
const OpenTopoMapImage = require('../assets/images/OpenTopoMap.jpeg');

export type RepresentationType = 'markers' | 'heatmap' | 'cluster';
export type MapLayerType = 'opentopomap' | 'openstreetmap';

interface LayerSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  representation: RepresentationType;
  mapLayer: MapLayerType;
  onRepresentationChange: (type: RepresentationType) => void;
  onMapLayerChange: (layer: MapLayerType) => void;
}

export function LayerSelector({
  isOpen,
  onClose,
  representation,
  mapLayer,
  onRepresentationChange,
  onMapLayerChange,
}: LayerSelectorProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  
  const [localRepresentation, setLocalRepresentation] = useState<RepresentationType>(representation);
  const [localMapLayer, setLocalMapLayer] = useState<MapLayerType>(mapLayer);
  const [isDragging, setIsDragging] = useState(false);

  // Reset local state when panel opens
  useEffect(() => {
    if (isOpen) {
      setLocalRepresentation(representation);
      setLocalMapLayer(mapLayer);
    }
  }, [isOpen, representation, mapLayer]);

  const handleScrollBegin = () => setIsDragging(true);
  const handleScrollEnd = () => setIsDragging(false);
  const handleTouchStart = () => setIsDragging(true);

  const representationOptions = [
    { id: 'markers' as RepresentationType, label: t('layers.representation.markers'), description: t('layers.representation.markersDesc'), image: MarkersImage },
    { id: 'heatmap' as RepresentationType, label: t('layers.representation.heatmap'), description: t('layers.representation.heatmapDesc'), image: OpenStreetMapImage },
    { id: 'cluster' as RepresentationType, label: t('layers.representation.cluster'), description: t('layers.representation.clusterDesc'), image: ClustersImage },
  ];

  const mapLayerOptions = [
    { id: 'opentopomap' as MapLayerType, label: 'OpenTopoMap', description: t('layers.mapLayer.opentopoDesc'), image: OpenTopoMapImage },
    { id: 'openstreetmap' as MapLayerType, label: 'OpenStreetMap', description: t('layers.mapLayer.openstreetDesc'), image: OpenStreetMapImage },
  ];

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
          <View style={styles.panel}>
            {/* Header - fixed above scroll content */}
            <View style={styles.headerFixed}>
              <View style={styles.headerLeft}>
                <LayersIcon width={20} height={20} color="#1E1E1E" />
                <Text style={styles.title}>{t('layers.title')}</Text>
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
              {/* Representació dels refugis */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {t('layers.representation.title')}
                </Text>
                <Text style={styles.sectionDescription}>
                  {t('layers.representation.subtitle')}
                </Text>
                <View style={styles.optionsRow}>
                  {representationOptions.map((option) => {
                    const selected = localRepresentation === option.id;
                    return (
                      <TouchableOpacity
                        key={option.id}
                        style={[styles.optionCardRow, selected && styles.optionCardRowSelected]}
                        onPress={() => setLocalRepresentation(option.id)}
                        activeOpacity={0.7}
                      >
                        <Image source={option.image} style={styles.optionImage} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Capes del mapa */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {t('layers.mapLayer.title')}
                </Text>
                <Text style={styles.sectionDescription}>
                  {t('layers.mapLayer.subtitle')}
                </Text>
                <View style={styles.optionsRow}>
                  {mapLayerOptions.map((option) => {
                    const selected = localMapLayer === option.id;
                    return (
                      <TouchableOpacity
                        key={option.id}
                        style={[styles.optionCardRow, selected && styles.optionCardRowSelected]}
                        onPress={() => setLocalMapLayer(option.id)}
                        activeOpacity={0.7}
                      >
                        <Image source={option.image} style={styles.optionImage} />
                        <Text style={[styles.optionLabelRow, selected && styles.optionLabelRowSelected]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Botons d'acció */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => {
                  onRepresentationChange(localRepresentation);
                  onMapLayerChange(localMapLayer);
                  onClose();
                }}
              >
                <Text style={styles.applyButtonText}>{t('common.apply')}</Text>
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
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  optionCardRow: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    gap: 8,
  },
  optionCardRowSelected: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FF6900',
  },
  optionCardVertical: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionCardVerticalSelected: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FF6900',
  },
  optionImage: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  optionImageVertical: {
    width: 80,
    height: 60,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  optionLabelRow: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  optionLabelRowSelected: {
    color: '#FF6900',
  },
  optionLabelVertical: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  optionLabelVerticalSelected: {
    color: '#FF6900',
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  optionCardSelected: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FF6900',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#FF6900',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6900',
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  optionLabelSelected: {
    color: '#FF6900',
  },
  optionDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    marginLeft: 32,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
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
