import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Location } from '../types';

interface RefugeBottomSheetProps {
  refuge: Location;
  isVisible: boolean;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onNavigate: (refuge: Location) => void;
  onViewDetails: (refuge: Location) => void;
}

export function RefugeBottomSheet({ 
  refuge, 
  isVisible, 
  onClose, 
  onToggleFavorite,
  onNavigate,
  onViewDetails 
}: RefugeBottomSheetProps) {
  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity 
        style={styles.backdrop} 
        onPress={onClose}
        activeOpacity={1}
      />
      <View style={styles.sheet}>
        {/* Handle */}
        <View style={styles.handle} />

        <ScrollView style={styles.content}>
          {/* Imatge */}
          <Image
            source={{ uri: refuge.imageUrl || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800' }}
            style={styles.image}
            resizeMode="cover"
          />

          {/* Nom i elevació */}
          <Text style={styles.name}>{refuge.name}</Text>
          <Text style={styles.elevation}>📏 {refuge.elevation}m</Text>

          {/* Descripció */}
          {refuge.description && (
            <Text style={styles.description}>{refuge.description}</Text>
          )}

          {/* Detalls */}
          <View style={styles.details}>
            {refuge.difficulty && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Dificultat:</Text>
                <Text style={styles.detailValue}>{refuge.difficulty}</Text>
              </View>
            )}
            {refuge.distance && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Distància:</Text>
                <Text style={styles.detailValue}>{refuge.distance}</Text>
              </View>
            )}
            {refuge.capacity && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Capacitat:</Text>
                <Text style={styles.detailValue}>{refuge.capacity} places</Text>
              </View>
            )}
          </View>

          {/* Botons d'acció */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.button, styles.favoriteButton]}
              onPress={() => onToggleFavorite(refuge.id)}
            >
              <Text style={styles.buttonText}>
                {refuge.isFavorite ? '❤️' : '🤍'} Favorit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.navigateButton]}
              onPress={() => onNavigate(refuge)}
            >
              <Text style={styles.buttonText}>🧭 Navegar</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.button, styles.detailsButton]}
            onPress={() => onViewDetails(refuge)}
          >
            <Text style={[styles.buttonText, styles.detailsButtonText]}>
              Veure detalls complerts
            </Text>
          </TouchableOpacity>
        </ScrollView>
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
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  content: {
    padding: 24,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  elevation: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 16,
  },
  details: {
    marginBottom: 24,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    textTransform: 'capitalize',
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
    backgroundColor: '#fee2e2',
  },
  navigateButton: {
    backgroundColor: '#dbeafe',
  },
  detailsButton: {
    backgroundColor: '#f97316',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  detailsButtonText: {
    color: '#fff',
  },
});
