import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, BackHandler, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '../utils/useTranslation';
import { LanguageSelector } from '../components/LanguageSelector';
import { getCurrentLanguage, LANGUAGES } from '../i18n';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import i18n from '../i18n';

// Icon imports
import LogoutIcon from '../assets/icons/logout.svg';

export function SettingsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { logout, deleteAccount, backendUser } = useAuth();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());
  
  // Actualitzar l'idioma mostrat quan canvia l'idioma de i18n
  useEffect(() => {
    const updateLanguage = () => {
      setCurrentLanguage(getCurrentLanguage());
    };
    
    // Listener per als canvis d'idioma
    i18n.on('languageChanged', updateLanguage);
    
    // Actualitzar inicialment
    updateLanguage();
    
    return () => {
      i18n.off('languageChanged', updateLanguage);
    };
  }, []);
  
  const handleGoBack = () => {
    // Navigate to the Profile tab instead of just going back
    navigation.navigate(t('navigation.profile'));
  };
  
  // Handle Android hardware back button
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      handleGoBack();
      return true; // Prevent default behavior
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [handleGoBack]);
  
  return (
    <ScrollView style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}></SafeAreaView>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t('profile.settings.title')}</Text>
        </View>
      <SafeAreaView />

      <View style={styles.content}>
        <View style={styles.section}>          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>⚙️</Text>
            <Text style={styles.menuText}>{t('profile.settings.preferences')}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>🔔</Text>
            <Text style={styles.menuText}>{t('profile.settings.notifications')}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => setShowLanguageSelector(true)}
          >
            <Text style={styles.menuIcon}>🌍</Text>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>{t('profile.settings.language')}</Text>
              <Text style={styles.menuSubtext}>
                {LANGUAGES[currentLanguage]?.nativeName || 'Català'}
              </Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>❓</Text>
            <Text style={styles.menuText}>{t('profile.settings.help')}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuIcon}>ℹ️</Text>
            <Text style={styles.menuText}>{t('profile.settings.about')}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              Alert.alert(
                t('profile.settings.logout.confirmTitle'),
                t('profile.settings.logout.confirmMessage'),
                [
                  { text: t('common.cancel'), style: 'cancel' },
                  { text: t('profile.settings.logout.title'), onPress: async () => {
                      try {
                        await logout();
                      } catch (error) {
                        console.error('Error durant el logout:', error);
                        Alert.alert(t('common.error'), t('auth.errors.generic'));
                      }
                    }
                  }
                ]
              );
            }}
          >
            <LogoutIcon />
            <Text style={styles.menuText}>{t('profile.settings.logout.title')}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              Alert.alert(
                t('profile.settings.deleteAccount.confirmTitle'),
                t('profile.settings.deleteAccount.confirmMessage'),
                [
                  { text: t('common.cancel'), style: 'cancel' },
                  { text: t('profile.settings.deleteAccount.title'), style: 'destructive', onPress: async () => {
                      try {
                        await deleteAccount();
                      } catch (error) {
                        console.error('Error durant la eliminació del compte:', error);
                        Alert.alert(t('common.error'), t('auth.errors.generic'));
                      }
                    }
                  }
                ]
              );
            }}
          >
            <Text style={styles.menuIcon}>🗑️</Text>
            <Text style={styles.menuText}>{t('profile.settings.deleteAccount.title')}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>

      <LanguageSelector
        visible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  safeArea: {
    backgroundColor: '#fff',
  },
  header: {
    padding: 32,
    backgroundColor: '#fff',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  backButtonText: {
    fontSize: 40,
    color: '#111827',
    fontWeight: '300',
    lineHeight: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'left',
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    //marginTop: ,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f97316',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
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
