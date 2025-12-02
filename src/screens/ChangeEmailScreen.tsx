import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, BackHandler, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../hooks/useTranslation';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { CustomAlert } from '../components/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';
import validator from 'validator';
import BackIcon from '../assets/icons/arrow-left.svg';
import VisibleIcon from '../assets/icons/visible.svg';
import VisibleOffIcon from '../assets/icons/visibleOff2.svg';

export function ChangeEmailScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { firebaseUser, changeEmail } = useAuth();
  const { alertVisible, alertConfig, showAlert, hideAlert } = useCustomAlert();
  
  const [password, setPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const HEADER_HEIGHT = 96;
  const insets = useSafeAreaInsets();
  
  const currentEmail = firebaseUser?.email || '';
  


  const handleNewEmailChange = (text: string) => {
    setNewEmail(text);
    
    if (text.trim() === '') {
      setEmailError(null);
    } else if (!validator.isEmail(text)) {
      setEmailError(t('signup.errors.invalidEmail'));
    } else if (text.toLowerCase() === currentEmail.toLowerCase()) {
      setEmailError(t('changeEmail.errors.sameEmail'));
    } else {
      setEmailError(null);
    }
  };
  
  const handleChangeEmail = async () => {
    // Validations
    if (!password.trim()) {
      setPasswordError(t('changeEmail.errors.emptyPassword'));
      return;
    }
    
    if (!newEmail.trim()) {
      setEmailError(t('signup.errors.emptyEmail'));
      return;
    }
    
    if (!validator.isEmail(newEmail)) {
      setEmailError(t('signup.errors.invalidEmail'));
      return;
    }
    
    if (newEmail.toLowerCase() === currentEmail.toLowerCase()) {
      setEmailError(t('changeEmail.errors.sameEmail'));
      return;
    }
    
    setIsLoading(true);
    
    try {
      await changeEmail(password, newEmail);
      
      showAlert(
        t('common.success'),
        t('changeEmail.emailSentMessage'),
        [
          {
            text: t('common.close'),
            onPress: () => {
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Error canviant correu electrònic:', error);
      
      if (error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
        setPasswordError(t('changeEmail.errors.wrongPassword'));
      } else if (error?.code === 'auth/email-already-in-use') {
        setEmailError(t('auth.errors.emailInUse'));
      } else if (error?.code === 'auth/invalid-email') {
        setEmailError(t('auth.errors.invalidEmail'));
      } else if (error?.code === 'auth/requires-recent-login') {
        showAlert(t('common.error'), t('changeEmail.errors.requiresRecentLogin'));
      } else if (error?.message === 'BACKEND_UPDATE_FAILED') {
        setEmailError(t('changeEmail.errors.backendError'));
      } else {
        showAlert(t('common.error'), t('changeEmail.errors.generic'));
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoBack = () => {
    // Clear all fields when going back
    setPassword('');
    setNewEmail('');
    setPasswordError(null);
    setEmailError(null);
    navigation.navigate('Settings');
  };

  // Handle Android hardware back button
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      setPassword('');
      setNewEmail('');
      setPasswordError(null);
      setEmailError(null);
      navigation.navigate('Settings');
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [navigation]);
  
  const isFormValid = 
    password.trim() !== '' &&
    newEmail.trim() !== '' &&
    !passwordError &&
    !emailError &&
    validator.isEmail(newEmail) &&
    newEmail.toLowerCase() !== currentEmail.toLowerCase();
  
  return (
    <View style={styles.root}>
      {/* Fixed header */}
      <View style={styles.headerFixed}>
        <SafeAreaView edges={["top"]} style={styles.safeArea} />
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleGoBack}
            testID="back-button"
          >
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.title}>{t('changeEmail.title')}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT, paddingBottom: Math.max(insets.bottom, 16) }}
        style={styles.container}
      >
        <View style={styles.content}>
          <Text style={styles.description}>{t('changeEmail.description')}</Text>
          
          {/* Current Email (Read-only) */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('changeEmail.currentEmail')}</Text>
            <TextInput
              style={[styles.input, styles.inputReadOnly]}
              value={currentEmail}
              editable={false}
              selectTextOnFocus={false}
            />
          </View>
          
          {/* New Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('changeEmail.newEmail')}</Text>
            <TextInput
              testID="new-email-input"
              style={[styles.input, emailError && styles.inputError]}
              value={newEmail}
              onChangeText={handleNewEmailChange}
              placeholder={t('changeEmail.newEmailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            {emailError && (
              <Text style={styles.errorText}>{emailError}</Text>
            )}
          </View>
          
          {/* Password for confirmation */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('changeEmail.password')}</Text>
            <View style={styles.passwordInputWrapper}>
              <TextInput
                testID="password-input"
                style={[styles.input, passwordError && styles.inputError]}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setPasswordError(null);
                }}
                placeholder={t('changeEmail.passwordPlaceholder')}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity
                testID="toggle-password-visibility"
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <VisibleOffIcon /> : <VisibleIcon />}
              </TouchableOpacity>
            </View>
            {passwordError && (
              <Text style={styles.errorText}>{passwordError}</Text>
            )}
            <Text style={styles.helperText}>{t('changeEmail.passwordHelper')}</Text>
          </View>
          
          {/* Submit Button */}
          <TouchableOpacity
            testID="submit-button"
            style={[styles.submitButton, (!isFormValid || isLoading) && styles.submitButtonDisabled]}
            onPress={handleChangeEmail}
            disabled={!isFormValid || isLoading}
          >
            {(!isFormValid || isLoading) ? (
              <View style={styles.buttonContent}>
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.gradientDisabledFill} />
                )}
                {!isLoading && <Text style={styles.submitButtonTextDisabled}>{t('changeEmail.submit')}</Text>}
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
                <Text style={styles.submitButtonText}>{t('changeEmail.submit')}</Text>
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
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    fontFamily: 'Arimo',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    fontFamily: 'Arimo',
  },
  passwordInputWrapper: {
    position: 'relative',
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
  },
  inputReadOnly: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
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
  buttonContent: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  gradientFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
  },
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
