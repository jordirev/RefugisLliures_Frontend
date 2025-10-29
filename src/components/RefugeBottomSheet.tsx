import React from 'react';
import { BadgeCondition } from './BadgeCondition';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Location } from '../models';
import { BadgeType } from './BadgeType';
import { useTranslation } from '../utils/useTranslation';

import AltitudeIcon from '../assets/icons/altitude.svg';
import CapacityIcon from '../assets/icons/user.svg';
import RegionIcon from '../assets/icons/region.svg';
import FavouriteIcon from '../assets/icons/favourite2.svg';

// BadgeCondition component handles mapping condition -> colors

interface RefugeBottomSheetProps {
  refuge: Location;
  isVisible: boolean;
  onClose: () => void;
  onToggleFavorite: (id: number | undefined) => void;
  onNavigate: (refuge: Location) => void;
  onViewDetails: (refuge: Location) => void;
}

const SCREEN_WIDTH = Math.min(
  Math.max(
    require('react-native').Dimensions.get('window').width,
    375
  ),
  600
);

export function RefugeBottomSheet({ 
  refuge, 
  isVisible, 
  onClose, 
  onToggleFavorite,
  onNavigate,
  onViewDetails 
}: RefugeBottomSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity 
        style={styles.backdrop} 
        onPress={onClose}
        activeOpacity={1}
      />
      <View style={[styles.sheet, { paddingBottom: insets.bottom }]}> 
        {/* Handle */}
        <View style={styles.handle} />
          {/* Imatge del refugi */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: refuge.imageUrl || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800' }}
              style={styles.image}
              resizeMode="cover"
            />
          </View>
          <View style={styles.sheetInfo}>
            <View style={styles.namefavorite}>
              {/* Nom */}
              <Text style={styles.name}>{refuge.name}</Text>
              {/* Favorit */}
              <TouchableOpacity onPress={() => onToggleFavorite(refuge.id)} style={styles.favoriteButton}>
                <FavouriteIcon width={24} height={24} />
              </TouchableOpacity>
            </View>

            {/*Informació del refugi */}
            <View style={styles.info}>

              {/* Detalls */}
              <View style={styles.details}>
                {/* Type */}
                <View style={styles.detailItem}>
                  {/* pass numeric type (or undefined) to match BadgeType props */}
                  <BadgeType type={refuge.type} />
                </View>
                {/* Estat */}
                {refuge.condition && (
                  <View style={styles.detailItem}>
                    <BadgeCondition condition={refuge.condition} />
                  </View>
                )}
              </View>
              <View style={[styles.details, styles.detailsDetails]}>
                {/* Altitud */}
                {refuge.altitude && (
                    <View style={styles.detailItem}>
                    <AltitudeIcon width={16} height={16} color={'#6b7280'} />
                    <Text style={styles.detailValue}>{refuge.altitude} m</Text>
                    </View>
                )}
                {/* Places */}
                <View style={styles.detailItem}>
                  <CapacityIcon color={'#4A5565'} />
                  <Text style={styles.detailValue}>{refuge.places} </Text>
                </View>
                {/* Regió */}
                <View style={styles.detailItem}>
                  <RegionIcon width={16} height={16} color={'#6b7280'} />
                  <View style={styles.detailTextRegion}>
                    <Text style={styles.detailValue}> {refuge.region ? refuge.region : 'Unknown'}</Text>
                  </View>
                </View>
              </View>
          </View>
        {/* Accions */}
        </View>
        <TouchableOpacity 
          style={[styles.button, styles.detailsButton]}
          onPress={() => onViewDetails(refuge)}
        >
          <Text style={[styles.buttonText, styles.detailsButtonText]}>
            {t('refuge.actions.viewDetails')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    paddingHorizontal: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 10,
  },
  content: {
    padding: 24,
  },
  imageContainer: {
    height: 200,
    width: '100%',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  namefavorite: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    position: 'relative',
    paddingRight: 48, // leave space for the favorite button
    marginBottom: -8,
  },
  name: {
    color: '#0A0A0A', 
    fontSize: 16, 
    fontFamily: 'Arimo', 
    fontWeight: '600', 
    lineHeight: 24, 
    flexWrap: 'wrap',
    flex: 1,
    flexShrink: 1,
    paddingRight: 8,
  },
  elevation: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#717883',
    lineHeight: 24,
    marginBottom: 16,
  },
  details: {
    marginBottom: 8,
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
  },
  detailsDetails: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
  },
  detailTextRegion: {
    maxWidth: SCREEN_WIDTH - 200, // Adjust based on expected layout
  },  
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Arimo',
    fontWeight: '400',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    right: 0,
    top: -6,
    height: 36,
    width: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigateButton: {
    backgroundColor: '#dbeafe',
  },
  detailsButton: {
    backgroundColor: '#f97316',
    width: '100%',
    height: '100%',
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Arimo',
  },
  detailsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '400', 
    lineHeight: 20, 
    flexWrap: 'wrap',
  },
  info: {
    marginBottom: 8,
  },
  sheetInfo: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
});
