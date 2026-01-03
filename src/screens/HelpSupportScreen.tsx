import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigation } from '@react-navigation/native';
import BackIcon from '../assets/icons/arrow-left.svg';
import NavigationIcon from '../assets/icons/navigation.svg';

export function HelpSupportScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  
  const HEADER_HEIGHT = 96;
  const insets = useSafeAreaInsets();
  
  const supportEmail = 'jordi.reverter.tuset@estudiantat.upc.edu';
  
  const handleGoBack = () => {
    navigation.navigate('Settings');
  };
  
  const handleEmailPress = () => {
    const subject = encodeURIComponent('Refugis Lliures - Suport');
    const mailtoUrl = `mailto:${supportEmail}?subject=${subject}`;
    Linking.openURL(mailtoUrl).catch(err => console.error('Error opening email client:', err));
  };
  
  return (
    <View style={styles.root}>
      {/* Fixed header */}
      <View style={styles.headerFixed}>
        <SafeAreaView edges={["top"]} style={styles.safeArea} />
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.title}>{t('helpSupport.title')}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT + 20, paddingBottom: Math.max(insets.bottom, 16) }}
        style={styles.container}
      >
        <View style={styles.content}>
          
          {/* Main content section */}
          <View style={styles.section}>
            <Text style={styles.text}>{t('helpSupport.intro')}</Text>
            
            {/* Email container with copy button */}
            <TouchableOpacity 
              style={styles.emailContainer}
              onPress={handleEmailPress}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={["#FF8904", "#F54900"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.emailGradient}
              >
                <Text style={styles.emailText}>{supportEmail}</Text>
                <NavigationIcon width={20} height={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
            
            <Text style={styles.text}>{t('helpSupport.beSpecific')}</Text>
          </View>
          
          {/* Warning section */}
          <View style={styles.warningContainer}>
            <Text style={styles.warningTitle}>{t('helpSupport.warning.title')}</Text>
            <Text style={styles.warningText}>{t('helpSupport.warning.message')}</Text>
          </View>
          
        </View>
      </ScrollView>
      
      {insets.bottom > 0 && (
        <View style={[styles.bottomSafeArea, { height: insets.bottom }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeArea: {
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1.2,
    borderBottomColor: '#e3e4e5ff',
    flexDirection: 'row',
    gap: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Arimo',
    color: '#111827',
    textAlign: 'left',
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  text: {
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Arimo',
    lineHeight: 24,
    marginBottom: 16,
  },
  emailContainer: {
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  emailGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  emailText: {
    flex: 1,
    fontSize: 13,
    color: '#fff',
    fontFamily: 'Arimo',
    fontWeight: '600',
  },
  warningContainer: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    borderRadius: 8,
    padding: 16,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dc2626',
    fontFamily: 'Arimo',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 15,
    color: '#991b1b',
    fontFamily: 'Arimo',
    lineHeight: 22,
  },
  bottomSafeArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 5,
  },
});
