import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, BackHandler, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../utils/useTranslation';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { CustomAlert } from '../components/CustomAlert';
import { useCustomAlert } from '../utils/useCustomAlert';
import BackIcon from '../assets/icons/arrow-left.svg';
import VisibleIcon from '../assets/icons/visible.svg';
import VisibleOffIcon from '../assets/icons/visibleOff2.svg';

export function EditProfileScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { alertVisible, alertConfig, showAlert, hideAlert } = useCustomAlert();
  const { updateUsername, firebaseUser, backendUser } = useAuth();
  
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  
  const HEADER_HEIGHT = 96;
  const insets = useSafeAreaInsets();

  const validateUsername = (name: string) => {
    return name.length >= 2 && name.length <= 20;
  }
  
  const handleNewUsername = (text: string) => {
    setUsername(text);
    validateUsername(text);

    if (text.trim() === '') {
      setUsernameError(null);
    } else if (!validateUsername(text)) {
      setUsernameError(t('editProfile.errors.invalidUsername'));
    } else {
      setUsernameError(null);
    }
  };
  
  const handleChangeUsername = async () => {
    // Validations
    if (!username.trim()) {
      setUsernameError(t('editProfile.errors.emptyUsername'));
      return;
    }
    
    if (!validateUsername(username)) {
      setUsernameError(t('editProfile.errors.invalidUsername'));
      return;
    }
    
    setIsLoading(true);
    
    try {
      await updateUsername(username);
    } catch (error: any) {
      console.error('Error actualitzant nom d\'usuari:', error);
      
      showAlert(
        t('common.error'),
        error.message || t('editProfile.errors.generic'),
        [
          {
            text: t('common.close'),
            onPress: hideAlert
          }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoBack = () => {
    // Clear all fields when going back
    setUsername('');
    setUsernameError(null);
    navigation.navigate('Settings');
  };

  // Ensure any removal (including Android hardware back) leads to Settings
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (Platform.OS === 'android') {
        e.preventDefault();
        // clear fields and go to Settings
        setUsername('');
        setUsernameError(null);
        navigation.navigate('Settings');
      }
    });

    return unsubscribe;
  }, [navigation]);
  
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      handleGoBack();
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, []);

  // Populate username with current value from backend or firebase when available
  useEffect(() => {
    // Try several common property names in case backend shape differs
    const backendNameCandidates = [
      (backendUser as any)?.username,
      (backendUser as any)?.userName,
      (backendUser as any)?.name,
      (backendUser as any)?.displayName,
      (backendUser as any)?.nom,
      (backendUser as any)?.nombre
    ];

    const backendName = backendNameCandidates.find(v => typeof v === 'string' && v.trim() !== '') || undefined;
    const current = backendName || firebaseUser?.displayName || '';

    // Debug: log values to help troubleshoot why username might not appear
    // Remove this log once we confirm the correct property name
    // eslint-disable-next-line no-console
    console.log('EditProfileScreen: backendUser keys ->', Object.keys(backendUser || {}));
    // eslint-disable-next-line no-console
    console.log('EditProfileScreen: resolved username ->', current);

    setUsername(current);
    setUsernameError(null);
  }, [backendUser, firebaseUser]);
  
  const isFormValid = 
    username.trim() !== '' &&
    !usernameError &&
    validateUsername(username);
  
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
          <Text style={styles.title}>{t('editProfile.title')}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT, paddingBottom: Math.max(insets.bottom, 16) }}
        style={styles.container}
      >
        <View style={styles.content}>

          {/* New Username */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('editProfile.usernamePlaceholder')}</Text>
            <TextInput
              style={[styles.input, usernameError && styles.inputError]}
              value={username}
              onChangeText={handleNewUsername}
              placeholder={t('editProfile.usernamePlaceholder')}
              keyboardType="default"
              autoCapitalize="sentences"
              autoCorrect={false}
              editable={!isLoading}
            />
            {usernameError && (
              <Text style={styles.errorText}>{usernameError}</Text>
            )}
          </View>
          
          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, (!isFormValid || isLoading) && styles.submitButtonDisabled]}
            onPress={handleChangeUsername}
            disabled={!isFormValid || isLoading}
          >
            {(!isFormValid || isLoading) ? (
              <View style={styles.buttonContent}>
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.gradientDisabledFill} />
                )}
                {!isLoading && <Text style={styles.submitButtonTextDisabled}>{t('editProfile.saveButton')}</Text>}
                {isLoading && <Text style={styles.submitButtonText} />}
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <LinearGradient
                  colors={["#FF8904", "#F54900"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientFill}
                />
                <Text style={styles.submitButtonText}>{t('editProfile.saveButton')}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      
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
  inputContainer: {
    marginBottom: 8,
    marginTop: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    fontFamily: 'Arimo',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Arimo',
    color: '#111827',
    textTransform: 'capitalize',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
    fontFamily: 'Arimo',
  },
  helperText: {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 4,
    fontFamily: 'Arimo',
  },
  submitButton: {
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  /* wrapper content inside the TouchableOpacity */
  buttonContent: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  /* gradient background that fills the button */
  gradientFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
  },
  /* disabled background fill (flat color) */
  gradientDisabledFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    backgroundColor: '#dadadaff',
  },
  submitButtonTextDisabled: {
    color: '#707070ff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Arimo',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Arimo',
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
