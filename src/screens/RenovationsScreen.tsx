import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from '../hooks/useTranslation';
import { LinearGradient } from 'expo-linear-gradient';
import { RenovationCard } from '../components/RenovationCard';
import { Renovation, Location } from '../models';
import { RenovationService } from '../services/RenovationService';
import { RefugisService } from '../services/RefugisService';
import { mapRenovationFromDTO } from '../services/mappers/RenovationMapper';
import { useAuth } from '../contexts/AuthContext';

// import icons
import RenovationsIcon from '../assets/icons/reform.svg';
import InformationIcon from '../assets/icons/information-circle.svg';
import PlusIcon from '../assets/icons/plus2.svg';

interface RenovationsScreenProps {
  onViewMap?: (location: Location) => void;
}

export function RenovationsScreen({ onViewMap }: RenovationsScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { firebaseUser } = useAuth();
  
  const [renovations, setRenovations] = useState<Renovation[]>([]);
  const [refuges, setRefuges] = useState<Map<string, Location>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [myRenovations, setMyRenovations] = useState<Renovation[]>([]);
  const [otherRenovations, setOtherRenovations] = useState<Renovation[]>([]);

  // Refrescar la llista cada cop que la pantalla recupera el focus
  useFocusEffect(
    useCallback(() => {
      loadRenovations();
    }, [])
  );

  useEffect(() => {
    if (renovations.length > 0 && firebaseUser) {
      classifyRenovations();
    }
  }, [renovations, firebaseUser]);

  const loadRenovations = async () => {
    try {
      setIsLoading(true);
      const renovationsDTO = await RenovationService.getAllRenovations();
      const mappedRenovations = renovationsDTO.map(mapRenovationFromDTO);
      setRenovations(mappedRenovations);

      // Carregar informació dels refugis
      const refugeIds = [...new Set(mappedRenovations.map(r => r.refuge_id))];
      const refugesMap = new Map<string, Location>();
      
      await Promise.all(
        refugeIds.map(async (refugeId) => {
          const refuge = await RefugisService.getRefugiById(refugeId);
          if (refuge) {
            refugesMap.set(refugeId, refuge);
          }
        })
      );
      
      setRefuges(refugesMap);
    } catch (error) {
      console.error('Error loading renovations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const classifyRenovations = () => {
    if (!firebaseUser) return;
    
    const userUid = firebaseUser.uid;
    const mine: Renovation[] = [];
    const others: Renovation[] = [];

    renovations.forEach(renovation => {
      const isCreator = renovation.creator_uid === userUid;
      const isParticipant = renovation.participants_uids?.includes(userUid) || false;
      
      if (isCreator || isParticipant) {
        mine.push(renovation);
      } else {
        others.push(renovation);
      }
    });

    setMyRenovations(mine);
    setOtherRenovations(others);
  };

  const handleViewOnMap = (renovation: Renovation) => {
    const refuge = refuges.get(renovation.refuge_id);
    if (onViewMap && refuge) {
      onViewMap(refuge);
      return;
    }

    // Fallback: navigate to Map tab (best-effort)
    console.log('View on map (no handler):', renovation.id);
  };

  const handleMoreInfo = (renovation: Renovation) => {
    // TODO: Implementar veure participants
    console.log('More info:', renovation.id);
  };

  const handleJoin = (renovation: Renovation) => {
    // TODO: Implementar unir-se
    console.log('Join:', renovation.id);
  };

  const handleCreateNew = () => {
    navigation.navigate('CreateRenovation');
  };
  
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <RenovationsIcon width={20} height={20} style={styles.icon} />
            <Text style={styles.title}>Reformes i Millores</Text>
          </View>
          <TouchableOpacity style={styles.infoButton}>
            <InformationIcon width={24} height={24} style={styles.icon} />
          </TouchableOpacity>
        </View>
        
        {/* Les meves reformes */}
        {myRenovations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Les meves reformes</Text>
            {myRenovations.map((renovation) => {
              const refuge = refuges.get(renovation.refuge_id);
              return (
                <RenovationCard
                  key={renovation.id}
                  renovation={renovation}
                  refuge={refuge}
                  isUserRenovation={true}
                  onViewOnMap={() => handleViewOnMap(renovation)}
                  onMoreInfo={() => handleMoreInfo(renovation)}
                />
              );
            })}
          </View>
        )}

        {/* Separador */}
        {myRenovations.length > 0 && otherRenovations.length > 0 && (
          <View style={styles.separator} />
        )}

        {/* Altres reformes */}
        {otherRenovations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Altres reformes</Text>
            {otherRenovations.map((renovation) => {
              const refuge = refuges.get(renovation.refuge_id);
              return (
                <RenovationCard
                  key={renovation.id}
                  renovation={renovation}
                  refuge={refuge}
                  isUserRenovation={false}
                  onViewOnMap={() => handleViewOnMap(renovation)}
                  onJoin={() => handleJoin(renovation)}
                />
              );
            })}
          </View>
        )}

        {renovations.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No hi ha reformes disponibles</Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.create}
        onPress={handleCreateNew}
        activeOpacity={0.9}
      >
        <LinearGradient 
          colors={['#FF8904', '#F54900']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.createGradient}
        >
          <PlusIcon width={24} height={24} style={styles.plusIcon} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingTop: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  count: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoButton: {
    padding: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 24,
  },
  createSpacing: {
    height: 80,
  },
  create: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  plusIcon: {
    marginRight: 0,
  },
  createGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
