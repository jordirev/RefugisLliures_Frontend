import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../hooks/useTranslation';
import { LanguageSelector } from '../components/LanguageSelector';
import { getCurrentLanguage, LANGUAGES } from '../i18n';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import i18n from '../i18n';
import { CustomAlert } from '../components/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

// Icon imports
import LogoutIcon from '../assets/icons/logout.svg';
import BackIcon from '../assets/icons/arrow-left.svg';

export function SettingsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { logout, deleteAccount, backendUser } = useAuth();
  const { alertVisible, alertConfig, showAlert, hideAlert } = useCustomAlert();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());
  // Fixed header height (used to pad the scrollable content)
  const HEADER_HEIGHT = 96;
  // Insets for adaptive safe area padding (bottom on devices with home indicator)
  const insets = useSafeAreaInsets();
  
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
    // Navigate to the Profile tab
    navigation.navigate('Profile');
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
          <Text style={styles.title}>{t('profile.settings.title')}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT, paddingBottom: Math.max(insets.bottom, 16) }}
        style={styles.container}
      >
        <View style={styles.content}>
        <View style={styles.section}>          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>{t('profile.settings.preferences')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>{t('profile.settings.notifications')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.menuText}>{t('profile.settings.editProfile')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => setShowLanguageSelector(true)}
          >
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>{t('profile.settings.language')}</Text>
              <Text style={styles.menuSubtext}>
                {LANGUAGES[currentLanguage]?.nativeName || 'Català'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('ChangeEmail')}
          >
            <Text style={styles.menuText}>{t('profile.settings.changeEmail')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <Text style={styles.menuText}>{t('profile.settings.changePassword')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>{t('profile.settings.help')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>{t('profile.settings.about')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              showAlert(
                t('profile.settings.deleteAccount.confirmTitle'),
                t('profile.settings.deleteAccount.confirmMessage'),
                [
                  { text: t('common.cancel'), style: 'cancel' },
                  { text: t('profile.settings.deleteAccount.title'), style: 'destructive', onPress: () => {
                      (async () => {
                        try {
                          await deleteAccount();
                        } catch (error) {
                          console.error('Error durant la eliminació del compte:', error);
                          showAlert(t('common.error'), t('auth.errors.generic'));
                        }
                      })();
                    }
                  }
                ]
              );
            }}
          >
            <Text style={[styles.menuText]}>{t('profile.settings.deleteAccount.title')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              showAlert(
                t('profile.settings.logout.confirmTitle'),
                t('profile.settings.logout.confirmMessage'),
                [
                  { text: t('common.cancel'), style: 'cancel' },
                  { text: t('profile.settings.logout.title'), onPress: () => {
                      (async () => {
                        try {
                          await logout();
                        } catch (error) {
                          console.error('Error durant el logout:', error);
                          showAlert(t('common.error'), t('auth.errors.generic'));
                        }
                      })();
                    }
                  }
                ]
              );
            }}
          >
            <LogoutIcon />
            <Text style={styles.menuText}>{t('profile.settings.logout.title')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <LanguageSelector
        visible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
      />
      
      {/* CustomAlert */}
      {alertConfig && (
        <CustomAlert
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onDismiss={hideAlert}
        />
      )}
    </ScrollView>
    {/* Bottom safe-area filler to ensure a visible (non-transparent) area behind home indicator */}
    {insets.bottom > 0 && (
      <View style={[styles.bottomSafeArea, { height: insets.bottom }]} />
    )}
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
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffffff',
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
  backButtonText: {
    fontSize: 40,
    color: '#111827',
    fontWeight: '300',
    lineHeight: 40,
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
    padding: 12,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 17,
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
    marginBottom: 12,
    gap: 16,
  },
  menuIcon: {
    fontSize: 24,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Arimo',
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
  bottomSafeArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 5,
  },
});
