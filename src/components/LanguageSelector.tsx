import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LANGUAGES, LanguageCode, getCurrentLanguage, changeLanguage } from '../i18n';
import { useTranslation } from '../utils/useTranslation';
import { useAuth } from '../contexts/AuthContext';
import { UsersService } from '../services/UsersService';
import { CustomAlert } from './CustomAlert';
import { useCustomAlert } from '../utils/useCustomAlert';

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
}

export function LanguageSelector({ visible, onClose }: LanguageSelectorProps) {
  const { t, i18n } = useTranslation();
  const { backendUser, authToken, reloadUser } = useAuth();
  const { alertVisible, alertConfig, showAlert, hideAlert } = useCustomAlert();
  const currentLanguage = getCurrentLanguage();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleLanguageSelect = async (languageCode: LanguageCode) => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      
      // Canviar l'idioma localment
      await changeLanguage(languageCode);
      
      // Si l'usuari està autenticat, actualitzar l'idioma al backend
      if (backendUser && authToken) {
        try {
          await UsersService.updateUser(
            backendUser.uid,
            { idioma: languageCode.toUpperCase() },
            authToken
          );
          // Recarregar l'usuari per assegurar-se que les dades són correctes
          await reloadUser();
        } catch (error) {
          console.error('Error actualitzant idioma al backend:', error);
          // Mostrar error però mantenir el canvi local
          showAlert(
            t('common.error'),
            t('profile.languageSelector.updateError') || 'Error actualitzant l\'idioma al servidor'
          );
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Error canviant idioma:', error);
      showAlert(t('common.error'), t('common.error'));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('profile.languageSelector.title')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.languageList}>
            {Object.entries(LANGUAGES).map(([code, { name, nativeName }]) => {
              const isSelected = currentLanguage === code;
              return (
                <TouchableOpacity
                  key={code}
                  style={[styles.languageItem, isSelected && styles.languageItemSelected]}
                  onPress={() => handleLanguageSelect(code as LanguageCode)}
                >
                  <View style={styles.languageInfo}>
                    <Text style={[styles.languageName, isSelected && styles.languageNameSelected]}>
                      {nativeName}
                    </Text>
                    <Text style={styles.languageCode}>{code.toUpperCase()}</Text>
                  </View>
                  {isSelected && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </TouchableOpacity>
      
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 20,
    color: '#6b7280',
  },
  languageList: {
    padding: 8,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  languageItemSelected: {
    backgroundColor: '#f3f4f6',
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  languageNameSelected: {
    color: '#f97316',
    fontWeight: '600',
  },
  languageCode: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  checkmark: {
    fontSize: 20,
    color: '#f97316',
    fontWeight: 'bold',
  },
});