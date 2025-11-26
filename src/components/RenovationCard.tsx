import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking } from 'react-native';

// import svg icons here
import WhatsAppIcon from '../assets/icons/whatsapp.svg';
import RegionIcon from '../assets/icons/region.svg';
import CalendarIcon from '../assets/icons/calendar2.svg';


export interface Renovation {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  imageUrl: string;
  whatsappGroupUrl?: string;
}

interface RenovationCardProps {
  renovation: Renovation;
  isUserRenovation?: boolean;
  onViewOnMap?: () => void;
  onMoreInfo?: () => void;
  onJoin?: () => void;
}

export function RenovationCard({ 
  renovation, 
  isUserRenovation = false,
  onViewOnMap,
  onMoreInfo,
  onJoin 
}: RenovationCardProps) {

  const handleWhatsAppPress = () => {
    if (renovation.whatsappGroupUrl) {
      Linking.openURL(renovation.whatsappGroupUrl);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ca-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{renovation.title}</Text>
          
          <View style={styles.infoRow}>
            <RegionIcon width={16} height={16} style={styles.icon} />
            <Text style={styles.infoText}>{renovation.location}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <CalendarIcon width={16} height={16} style={styles.icon} />
            <Text style={styles.infoText}>{formatDate(renovation.date)}</Text>
          </View>
        </View>
        
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: renovation.imageUrl }} 
            style={styles.image}
            resizeMode="cover"
          />
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <Text style={styles.description}>{renovation.description}</Text>
        
        {isUserRenovation && renovation.whatsappGroupUrl && (
          <TouchableOpacity 
            style={styles.whatsappButton}
            onPress={handleWhatsAppPress}
          >
            <WhatsAppIcon width={16} height={16} style={styles.whatsappIcon} />
            <Text style={styles.whatsappText}>Uneix-te al grup de WhatsApp</Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.buttonOutline]}
            onPress={onViewOnMap}
          >
            <Text style={styles.buttonOutlineText}>Veure en el mapa</Text>
          </TouchableOpacity>
          
          {isUserRenovation ? (
            <TouchableOpacity 
              style={[styles.button, styles.buttonSecondary]}
              onPress={onMoreInfo}
            >
              <Text style={styles.buttonSecondaryText}>+ Informació</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.button, styles.buttonPrimary]}
              onPress={onJoin}
            >
              <Text style={styles.buttonPrimaryText}>Uneix-me</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 8,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Arimo',
    color: '#111827',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    fontSize: 14,
    marginRight: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
  },
  imageContainer: {
    width: 96,
    height: 96,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    padding: 16,
    paddingTop: 0,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
    marginTop: 16,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  whatsappIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  whatsappText: {
    fontSize: 14,
    color: '#16A34A',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOutline: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  buttonOutlineText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonSecondary: {
    backgroundColor: '#F3F4F6',
  },
  buttonSecondaryText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  buttonPrimary: {
    backgroundColor: '#F97316',
  },
  buttonPrimaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
