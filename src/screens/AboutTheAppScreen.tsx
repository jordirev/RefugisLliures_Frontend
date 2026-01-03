import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigation } from '@react-navigation/native';
import BackIcon from '../assets/icons/arrow-left.svg';

const AppLogo = require('../assets/images/logo.png');

export function AboutTheAppScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  
  const HEADER_HEIGHT = 96;
  const insets = useSafeAreaInsets();
  
  const handleGoBack = () => {
    navigation.navigate('Settings');
  };
  
  const handleLinkPress = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Failed to open URL:", err));
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
          <Text style={styles.title}>{t('aboutApp.title')}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT + 20, paddingBottom: Math.max(insets.bottom, 16) }}
        style={styles.container}
      >
        <View style={styles.content}>
          
          {/* Logo section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={["#FF8904", "#F54900"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              >
                <View style={styles.logoImageWrapper}>
                  <Image 
                    source={AppLogo} 
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.appName}>Refugis Lliures</Text>
              </LinearGradient>
            </View>
          </View>
          
          {/* App description section */}
          <View style={styles.section}>
            <Text style={styles.text}>{t('aboutApp.description.intro')}</Text>
            
            <Text style={styles.text}>{t('aboutApp.description.sources')}</Text>
            
            {/* Links container */}
            <View style={styles.linksContainer}>
              <TouchableOpacity onPress={() => handleLinkPress('https://www.pyrenees-refuges.com/')}>
                <Text style={styles.link}>• https://www.pyrenees-refuges.com/</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleLinkPress('https://www.refuges.info/')}>
                <Text style={styles.link}>• https://www.refuges.info/</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.text}>{t('aboutApp.description.userContributions')}</Text>
          </View>
          
          {/* Separator */}
          <View style={styles.separator} />
          
          {/* Creator section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('aboutApp.creator.title')}</Text>
            <Text style={styles.text}>{t('aboutApp.creator.greeting')}</Text>
            <Text style={styles.text}>{t('aboutApp.creator.description')}</Text>
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
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 150,
    height: 150,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 6,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  logoImageWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Arimo',
    textAlign: 'center',
    marginTop: -20,
    marginBottom: 20,
    letterSpacing: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'Arimo',
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Arimo',
    lineHeight: 24,
    marginBottom: 16,
  },
  linksContainer: {
    marginVertical: 8,
    marginBottom: 16,
  },
  link: {
    fontSize: 15,
    color: '#2563eb',
    fontFamily: 'Arimo',
    lineHeight: 28,
    textDecorationLine: 'underline',
  },
  separator: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 24,
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
