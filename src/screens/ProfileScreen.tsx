import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigation } from '@react-navigation/native';
import { getCurrentLanguage } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { RefugeCard } from '../components/RefugeCard';
import { RefugisService } from '../services/RefugisService';
import { Location } from '../models';

// Icones
import StatsIcon from '../assets/icons/stats.svg';
import SettingsIcon from '../assets/icons/settings.svg';
import AltitudeIcon from '../assets/icons/altitude2.svg';
const VisitedIcon = require('../assets/icons/visited2.png');

// Imatge de fons del header
import DefaultProfileBackgroundImage from '../assets/images/profileDefaultBackground.png';

interface ProfileScreenProps {
  onViewDetail: (refuge: Location) => void;
  onViewMap: (refuge: Location) => void;
}

export function ProfileScreen({ onViewDetail, onViewMap }: ProfileScreenProps) {
  const { t } = useTranslation();
  const currentLanguage = getCurrentLanguage();
  const navigation = useNavigation<any>();
  const { firebaseUser, backendUser, isLoading, refreshUserData, visitedRefuges } = useAuth();
  const insets = useSafeAreaInsets();

  // Recarregar les dades de l'usuari cada cop que es navega cap a la pantalla de perfil
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      
      const loadUserData = async () => {
        if (isActive) {
          await refreshUserData();
        }
      };
      
      loadUserData();
      
      return () => {
        isActive = false;
      };
    }, [])
  );

  // Navigation handlers
  const handleViewMap = async (refuge: Location) => {
    try {
      // Fetch full refuge details before navigating
      if (refuge.id) {
        const fullRefuge = await RefugisService.getRefugiById(String(refuge.id));
        if (fullRefuge) {
          // Call parent's onViewMap with full data to set selectedLocation in AppNavigator
          onViewMap(fullRefuge);
          // Navigate to Map tab using the navigator route name and pass the selected refuge
          navigation.navigate('Map', { selectedRefuge: fullRefuge });
        }
      }
    } catch (error) {
      console.error('Error loading refuge for map:', error);
      // Fallback to showing with current data and navigate to Map tab
      onViewMap(refuge);
      navigation.navigate('Map', { selectedRefuge: refuge });
    }
  };

  const handleViewDetail = async (refuge: Location) => {
    try {
      // Fetch full refuge details before showing detail
      if (refuge.id) {
        const fullRefuge = await RefugisService.getRefugiById(String(refuge.id));
        if (fullRefuge) {
          onViewDetail(fullRefuge);
        }
      }
    } catch (error) {
      console.error('Error loading refuge details:', error);
      // Fallback to showing with current data
      onViewDetail(refuge);
    }
  };
  
  // Empty component for visited refuges
  const EmptyVisitedComponent = () => (
    <View style={styles.emptyVisitedContainer}>
      <Image source={VisitedIcon} style={styles.emptyVisitedIcon} />
      <Text style={styles.emptyVisitedTitle}>{t('visited.empty.title')}</Text>
      <Text style={styles.emptyVisitedText}>{t('visited.empty.message')}</Text>
    </View>
  );
  
  
  return (
    <View style={styles.root}>
      {/* Fixed header */}
      <View style={styles.headerFixed}>
        <SafeAreaView edges={["top"]} style={styles.safeArea}></SafeAreaView>
      </View>
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { marginTop: insets.top }]}>
          {/* Background block with real horizontal gradient and image overlay */}
          <LinearGradient
            colors={["#FF8904", "#F54900"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerBackground}
            testID="header-gradient"
          >
            <Image
              source={DefaultProfileBackgroundImage}
              style={styles.headerImage}
              resizeMode="cover"
            />
            {/* settings button - larger touch area */}
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => navigation.navigate('Settings')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              testID="settings-button"
            >
              <SettingsIcon width={32} height={32} />
            </TouchableOpacity>
          </LinearGradient>

          {/* Avatar overlapping the background */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(() => {
                  const name = backendUser?.username || firebaseUser?.displayName || backendUser?.email || firebaseUser?.email || '';
                  const parts = name.trim().split(/\s+/);
                  if (parts.length === 0) return '';
                  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
                  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                })()}
              </Text>
            </View>
          </View>

          {/* Name and subtitle to the right of the avatar */}
          <View style={styles.nameBlock}>
            <Text style={styles.nameText}>
              {backendUser?.username || firebaseUser?.displayName || backendUser?.email || firebaseUser?.email || ''}
            </Text>
            <Text style={styles.subtitleText}>
              {(() => {
                // Prefer backendUser data if available, otherwise use Firebase creation time
                try {
                  const created = backendUser?.created_at ?? firebaseUser?.metadata?.creationTime;
                  if (created) {
                    const d = typeof created === 'number' ? new Date(created * 1000) : new Date(created);
                    if (!Number.isNaN(d.getTime())) {
                      return t('profile.stats.memberSince', { date: d.toLocaleDateString(currentLanguage, { month: 'long', year: 'numeric' }) });
                    }
                  }
                } catch (e) {
                  // ignore
                }
                return t('profile.stats.memberSince', { date: '' });
              })()}
            </Text>
          </View>
        </View>
        
        <View style={styles.content}>
          <View style={[styles.section, styles.sectionStatics]}>
            <View style={styles.sectionTitle}>
              <StatsIcon />
              <Text style={styles.title}>{t('profile.stats.title')}</Text>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{backendUser?.visited_refuges?.length ?? 0}</Text>
                  <Text style={styles.statLabel}>{t('profile.stats.visited')}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{backendUser?.num_renovated_refuges ?? 0}</Text>
                  <Text style={styles.statLabel}>{t('profile.stats.renovations')}</Text>
                </View>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{backendUser?.num_shared_experiences ?? 0}</Text>
                  <Text style={styles.statLabel}>{t('profile.stats.contributions')}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{backendUser?.num_uploaded_photos ?? 0}</Text>
                  <Text style={styles.statLabel}>{t('profile.stats.photos')}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.section, styles.sectionVisited]}>
            <View style={[styles.sectionTitle, { paddingLeft: 32, marginTop: 12 }]}>
              <AltitudeIcon width={20} height={20} />
              <Text style={styles.title}>{t('visited.title')}</Text>
              <Text style={styles.titleValue}>({visitedRefuges?.length ?? 0})</Text>
            </View>
            {visitedRefuges && visitedRefuges.length > 0 ? (
              <View style={styles.visitedList}>
                {visitedRefuges.map((refuge, index) => (
                  <RefugeCard
                    key={refuge.id ? String(refuge.id) : String(index)}
                    refuge={refuge}
                    onPress={() => handleViewDetail(refuge)}
                    onViewMap={() => handleViewMap(refuge)}
                  />
                ))}
              </View>
            ) : (
              <EmptyVisitedComponent />
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#ffffffff',
    paddingHorizontal: 6,
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffffff',
  },
  header: {
    // header acts as a relative container for absolute-positioned background and elements
    height: 140,
    position: 'relative',
    backgroundColor: 'transparent',
    marginBottom: 56,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF6900',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    color: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    padding: 16,
  },
  safeArea: {
    backgroundColor: '#fff',
  },
  /* Header decorative styles */
  headerBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 128,
    backgroundColor: '#FF8904',
    overflow: 'hidden',
  },
  headerImage: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    opacity: 0.2,
  },
  topRightBox: {
    position: 'absolute',
    right: 15,
    top: 16,
    width: 52,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topRightInner: {
    width: 30,
    height: 30,
    position: 'relative',
    overflow: 'hidden',
  },

  /* New: make settings button easier to press */
  settingsButton: {
    position: 'absolute',
    right: 15,
    top: 16,
    width: 52,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerRect: {
    position: 'absolute',
    left: 4,
    top: 3,
    width: 22,
    height: 25,
    borderWidth: 1.33,
    borderColor: '#fff',
    borderRadius: 2,
    outlineStyle: 'solid',
  },
  innerDot: {
    position: 'absolute',
    left: 11,
    top: 11,
    width: 7.5,
    height: 7.5,
    borderWidth: 1.33,
    borderColor: '#fff',
    borderRadius: 2,
  },
  avatarContainer: {
    position: 'absolute',
    left: 24,
    top: 96,
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    // white outline around avatar
    borderRadius: 32,
    borderWidth: 3.75,
    borderColor: '#fff',
    overflow: 'hidden',
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  nameBlock: {
    position: 'absolute',
    left: 103,
    top: 110,
    width: 230,
    flexDirection: 'column',
    gap: 4,
    marginTop: 32,
  },
  nameText: {
    color: '#0A0A0A',
    fontSize: 16,
    fontFamily: 'Arimo',
    fontWeight: '400',
    lineHeight: 24,
    textTransform: 'capitalize',
  },
  subtitleText: {
    color: '#5C6167',
    fontSize: 10,
    fontFamily: 'Arimo',
    fontWeight: '400',
    lineHeight: 20,
  },
  section: {
    marginBottom: 8,
    padding: 16,
    backgroundColor: '#fff',
  },
  sectionStatics: {
    borderRadius: 18,
    borderColor: '#e5e7eb',
    borderWidth: 1,
  },
  sectionVisited: {
    padding: 0,
    marginHorizontal: -20,
    marginRight: -32,
    marginLeft: -32,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 16,
    gap: 6
  },
  title: {
    color: '#0A0A0A',
    fontSize: 14,
    fontFamily: 'Arimo',
    fontWeight: '600',
    lineHeight: 24,
    flexWrap: 'wrap'
  },
  titleValue: {
    color: '#6A7282',
    fontSize: 13,
  },
  statsGrid: {
    flexDirection: 'column',
    gap: 10,
    alignItems: 'stretch',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'stretch',
  },
  statCard: {
    flex: 1,
    height: 100,
    backgroundColor: '#f9fafb',
    borderRadius: 17,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    color: '#FF6900',
    fontSize: 24,
    fontFamily: 'Arimo',
    fontWeight: '700',
    lineHeight: 32,
    flexWrap: 'wrap',
  },
  statLabel: {
    color: '#4A5565',
    fontSize: 13,
    fontFamily: 'Arimo',
    fontWeight: '400',
    lineHeight: 20,
    flexWrap: 'wrap',
    textAlign: 'center',
    alignSelf: 'stretch',
    flexShrink: 1,
  },
  visitedList: {
    width: '100%',
    paddingHorizontal: 16,
  },
  emptyVisitedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 48,
    minHeight: 200,
  },
  emptyVisitedIcon: {
    width: 48,
    height: 48,
    marginBottom: 16,
    opacity: 0.8,
  },
  emptyVisitedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyVisitedText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  menuSubtext: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  menuArrow: {
    fontSize: 24,
    color: '#9ca3af',
  },
});
