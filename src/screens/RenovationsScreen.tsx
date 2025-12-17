import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from '../hooks/useTranslation';
import { LinearGradient } from 'expo-linear-gradient';
import { RenovationCard } from '../components/RenovationCard';
import { CustomAlert } from '../components/CustomAlert';
import { Renovation, Location } from '../models';
import { useAuth } from '../contexts/AuthContext';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { useRenovations, useJoinRenovation } from '../hooks/useRenovationsQuery';
import { useRefugesBatch } from '../hooks/useRefugesQuery';

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
  const HEADER_HEIGHT = 96;
  const windowHeight = Dimensions.get('window').height;
  const navigation = useNavigation<any>();
  const { firebaseUser } = useAuth();
  const { alertVisible, alertConfig, showAlert, hideAlert } = useCustomAlert();
  
  const [joiningRenovationId, setJoiningRenovationId] = useState<string | null>(null);

  // Utilitzar React Query per carregar renovations
  const { data: renovations = [], isLoading: loadingRenovations, refetch } = useRenovations();
  
  // Obtenir IDs únics de refugis
  const refugeIds = useMemo(() => {
    return [...new Set(renovations.map(r => r.refuge_id))];
  }, [renovations]);
  
  // Carregar tots els refuges en batch
  const { data: refuges = new Map(), isLoading: loadingRefuges } = useRefugesBatch(refugeIds);
  
  // Mutation per unir-se a una renovation
  const joinMutation = useJoinRenovation();
  
  const isLoading = loadingRenovations || loadingRefuges;

  // Classificar renovations en "meves" i "altres"
  const { myRenovations, otherRenovations } = useMemo(() => {
    if (!firebaseUser || renovations.length === 0) {
      return { myRenovations: [], otherRenovations: [] };
    }
    
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
    
    return { myRenovations: mine, otherRenovations: others };
  }, [renovations, firebaseUser]);

  const handleViewOnMap = (renovation: Renovation) => {
    const refuge = refuges instanceof Map ? refuges.get(renovation.refuge_id) : null;
    if (onViewMap && refuge) {
      onViewMap(refuge);
      return;
    }

    // Fallback: navigate to Map tab (best-effort)
    console.log('View on map (no handler):', renovation.id);
  };

  const handleMoreInfo = (renovation: Renovation) => {
    navigation.navigate('RefromDetail', { renovationId: renovation.id });
  };

  const handleJoinRenovation = (renovation: Renovation) => {
    setJoiningRenovationId(renovation.id);
    joinMutation.mutate(renovation.id, {
      onError: (error: any) => {
        console.error('Error joining renovation:', error);
        showAlert(t('common.error'), error.message || t('renovations.errorJoining'));
        setJoiningRenovationId(null);
      },
      onSuccess: () => {
        setJoiningRenovationId(null);
      }
    });
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
    <View style={styles.root}>
      {/* Fixed header */}
      <View style={styles.headerFixed}>
        <SafeAreaView edges={["top"]} style={styles.safeArea}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <RenovationsIcon width={20} height={20} style={styles.icon} />
              <Text style={styles.title}>{t('renovations.title')}</Text>
            </View>
            <TouchableOpacity 
              style={styles.infoButton}
              onPress={() => showAlert(
                t('renovations.alerts.infoTitle'),
                t('renovations.alerts.infoMessage'),
                [{ text: t('common.close'), onPress: hideAlert }]
              )}
              activeOpacity={0.8}>
              <InformationIcon width={24} height={24} style={styles.icon} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: HEADER_HEIGHT, paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        
        {/* Les meves reformes */}
        {myRenovations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('renovations.my_renovations')}</Text>
            {myRenovations.map((renovation) => {
              const refuge = refuges instanceof Map ? refuges.get(renovation.refuge_id) : null;
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
            <Text style={styles.sectionTitle}>{t('renovations.other_renovations')}</Text>
            {otherRenovations.map((renovation) => {
              const refuge = refuges instanceof Map ? refuges.get(renovation.refuge_id) : null;
              return (
                <RenovationCard
                  key={renovation.id}
                  renovation={renovation}
                  refuge={refuge}
                  isUserRenovation={false}
                  onViewOnMap={() => handleViewOnMap(renovation)}
                  onMoreInfo={() => handleMoreInfo(renovation)}
                  onJoin={() => handleJoinRenovation(renovation) }
                  isJoining={joiningRenovationId === renovation.id}
                />
              );
            })}
          </View>
        )}

        {renovations.length === 0 && (
          (() => {
            const availableHeight = windowHeight - HEADER_HEIGHT - Math.max(insets.bottom, 16) - 2*insets.top;
            const minHeight = Math.max(availableHeight, 240);
            return (
              <View style={[styles.emptyState, { minHeight }]}>
                <RenovationsIcon width={56} height={56} fill='transparent' style={styles.emptyStateIcon} />
                <Text style={styles.emptyTitle}>{t('renovations.empty.title')}</Text>
                <Text style={styles.emptyText}>{t('renovations.empty.message')}</Text>
              </View>
            );
          })()
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

      <CustomAlert
        visible={alertVisible}
        title={alertConfig?.title}
        message={alertConfig?.message || ''}
        buttons={alertConfig?.buttons}
        onDismiss={hideAlert}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 6,
  },
  safeArea: {
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '400',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyStateIcon: {
    marginBottom: 12,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 16,
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
    color: '#101828', 
    fontSize: 16, 
    fontFamily: 'Arimo', 
    fontWeight: '400', 
    lineHeight: 24, 
    flexWrap: 'wrap',
    textAlign: 'center',
    alignItems: 'center',
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
    fontSize: 14,
    fontFamily: 'Arimo',
    fontWeight: '400',
    lineHeight: 24,
    color: '#717182',
    marginBottom: 16,
    marginLeft: 12,
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
