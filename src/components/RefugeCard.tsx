import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Location } from '../types';

interface RefugeCardProps {
  refuge: Location;
  onPress?: () => void;
  onViewMap?: () => void;
}

const conditionColors = {
  'pobre': '#ef4444',
  'normal': '#3b82f6',
  'bé': '#22c55e',
  'excel·lent': '#eab308'
};

export function RefugeCard({ refuge, onPress, onViewMap }: RefugeCardProps) {
  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Imatge principal */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: refuge.imageUrl || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800' }}
          style={styles.image}
          resizeMode="cover"
        />
        
        {/* Estat en cantonada superior dreta */}
        {refuge.condition && (
          <View style={[styles.conditionBadge, { backgroundColor: conditionColors[refuge.condition] }]}>
            <Text style={styles.conditionText}>{refuge.condition}</Text>
          </View>
        )}
      </View>
      
      {/* Informació del refugi */}
      <View style={styles.infoContainer}>
        {/* Nom del refugi */}
        <Text style={styles.name} numberOfLines={1}>{refuge.name}</Text>
        
        {/* Regió i capacitat */}
        <View style={styles.detailsRow}>
          <Text style={styles.detailText}>{refuge.region || 'Pirineus'}</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.detailText}>👤 {refuge.capacity || 60}</Text>
        </View>
        
        {/* Botó veure mapa */}
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() => {
            onViewMap?.();
          }}
        >
          <Text style={styles.mapButtonText}>🗺️</Text>
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
    height: 200,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
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
  infoContainer: {
    padding: 12,
    position: 'relative',
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
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  separator: {
    fontSize: 12,
    color: '#9ca3af',
  },
  mapButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapButtonText: {
    fontSize: 20,
  },
});
