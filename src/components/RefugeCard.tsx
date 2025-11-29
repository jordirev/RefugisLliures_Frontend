import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Location } from '../models';
import { useTranslation } from '../hooks/useTranslation';
import useFavourite from '../hooks/useFavourite';

// Icon imports
import MapIcon from '../assets/icons/location-map.png';
import UserIcon from '../assets/icons/user.svg';
import FavouriteIcon from '../assets/icons/favRed.svg';
import FavouriteFilledIcon from '../assets/icons/favourite2.svg';

interface RefugeCardProps {
  refuge: Location;
  onPress?: () => void;
  onViewMap?: () => void;
  onToggleFavorite?: (id: string | undefined) => void;
}

export function RefugeCard({ refuge, onPress, onViewMap, onToggleFavorite }: RefugeCardProps) {
  const { t } = useTranslation();
  const { isFavourite, toggleFavourite, isProcessing } = useFavourite(refuge.id);
  
  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Imatge principal */}
      <View style={styles.imageContainer}>
        <Image
            testID="refuge-image"
            source={{ uri: refuge.imageUrl || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800' }}
            style={styles.image}
            resizeMode="cover"
          />
        {/* Botó de favorit en cantonada superior esquerra */}
        <TouchableOpacity
          testID="favorite-button"
          onPress={async () => {
            try {
              await toggleFavourite();
              if (onToggleFavorite) onToggleFavorite(refuge.id);
            } catch (err) {
              // already logged in hook
            }
          }}
          style={styles.favoriteButton}
          disabled={isProcessing}
          accessibilityState={{ disabled: isProcessing, selected: !!isFavourite }}
        >
          {isFavourite ? (
            <FavouriteFilledIcon width={24} height={24}  />
          ) : (
            <FavouriteIcon width={24} height={24} />
          )}
        </TouchableOpacity>
      </View>
      
      {/* Informació del refugi - floating panel */}
      <View style={styles.infoOverlay} pointerEvents="box-none">
        <View style={styles.infoContainer}>
          {/* Nom del refugi */}
          <Text style={styles.name} numberOfLines={1}>{refuge.name || refuge.surname || t('refuge.title')}</Text>
          
          {/* Regió i capacitat */}
          <View style={styles.detailsRow}>
            <Text style={styles.detailText} numberOfLines={2} ellipsizeMode="tail">{refuge.region || t('common.pyrenees')}</Text>
            <Text style={styles.separator}>•</Text>
            <View style={styles.placesContainer}>
              <UserIcon width={16} height={16} />
              <Text style={styles.placesText}> {refuge.places || '?'}</Text>
            </View>
          </View>
        </View>
        {/* Botó veure mapa */}
        <TouchableOpacity
          testID="map-button"
          style={styles.mapButton}
          onPress={() => {
            onViewMap?.();
          }}
        >
          <Image source={MapIcon} style={{ width: 16, height: 18 }} resizeMode="stretch" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    width: '100%',
    height: 216,
    position: 'relative',
    backgroundColor: '#f3f4f6',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conditionBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  conditionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  infoOverlay: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  infoContainer: {
    flex: 1,
    marginTop: 4,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 64,
  },
  placesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placesText: {
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 16,
  },
  detailText: {
    color: '#6b7280',
    fontSize: 13,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  separator: {
    marginHorizontal: 6,
    color: '#9ca3af',
    fontSize: 12,
  },
  mapButton: {
    position: 'absolute',
    right: 16,
    bottom: 12,
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  mapButtonText: {
    fontSize: 20,
  },
});
