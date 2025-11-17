import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../utils/useTranslation';
import { useNavigation } from '@react-navigation/native';
import { getCurrentLanguage } from '../i18n';
import { useAuth } from '../contexts/AuthContext';

// Icones
import StatsIcon from '../assets/icons/stats.svg';
import SettingsIcon from '../assets/icons/settings.svg';
import AltitudeIcon from '../assets/icons/altitude2.svg';

// Imatge de fons del header
import DefaultProfileBackgroundImage from '../assets/images/profileDefaultBackground.png';

export function ProfileScreen() {
  const { t } = useTranslation();
  const currentLanguage = getCurrentLanguage();
  const navigation = useNavigation<any>();
  const { firebaseUser, backendUser, isLoading } = useAuth();
  
  return (
    <ScrollView style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.header}>
          {/* Background block with real horizontal gradient and image overlay */}
          <LinearGradient
            colors={["#FF8904", "#F54900"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerBackground}
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
      </SafeAreaView>
      
      <View style={styles.content}>
        <View style={[styles.section, styles.sectionStatics]}>
          <View style={styles.sectionTitle}>
            <StatsIcon />
            <Text style={styles.title}>{t('profile.stats.title')}</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{backendUser?.refugis_visitats?.length ?? 0}</Text>
                <Text style={styles.statLabel}>{t('profile.stats.visited')}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{backendUser?.num_refugis_reformats ?? backendUser?.reformes?.length ?? 0}</Text>
                <Text style={styles.statLabel}>{t('profile.stats.renovations')}</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{backendUser?.num_experiencies_compartides ?? 0}</Text>
                <Text style={styles.statLabel}>{t('profile.stats.contributions')}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{backendUser?.num_fotos_pujades ?? 0}</Text>
                <Text style={styles.statLabel}>{t('profile.stats.photos')}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <AltitudeIcon width={20} height={20} />
            <Text style={styles.title}>{t('profile.stats.visited')}</Text>
            <Text style={styles.titleValue}>({backendUser?.refugis_visitats?.length ?? 0})</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    borderRadius: 12,
    borderColor: '#e5e7eb',
    borderWidth: 1,
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
    borderRadius: 12,
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
