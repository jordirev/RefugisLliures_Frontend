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

export function ChangePasswordScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { changePassword } = useAuth();
  const { alertVisible, alertConfig, showAlert, hideAlert } = useCustomAlert();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null);
  const [passwordRequirements, setPasswordRequirements] = useState<string[]>([]);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  
  const HEADER_HEIGHT = 96;
  const insets = useSafeAreaInsets();
  
  const verifyPasswordStrength = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push(t('signup.errors.shortPassword'));
    }
    if (!/[a-z]/.test(password)) {
      errors.push(t('signup.errors.minusPassword'));
    }
    if (!/[A-Z]/.test(password)) {
      errors.push(t('signup.errors.upperPassword'));
    }
    if (!/[0-9]/.test(password)) {
      errors.push(t('signup.errors.numberPassword'));
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push(t('signup.errors.specialCharPassword'));
    }
    return errors;
  };
  
  const handleNewPasswordChange = (text: string) => {
    setNewPassword(text);
    const requirements = verifyPasswordStrength(text);
    setPasswordRequirements(requirements);
    
    // Reverify if confirm password is filled
    if (confirmPassword) {
      if (confirmPassword !== text) {
        setConfirmPasswordError(t('signup.errors.passwordMismatch'));
      } else {
        setConfirmPasswordError(null);
      }
    }
  };
  
  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    
    if (text && text !== newPassword) {
      setConfirmPasswordError(t('signup.errors.passwordMismatch'));
    } else {
      setConfirmPasswordError(null);
    }
  };
  
  const handleChangePassword = async () => {
    // Validations
    if (!currentPassword.trim()) {
      setCurrentPasswordError(t('changePassword.errors.emptyCurrentPassword'));
      return;
    }
    
    if (!newPassword.trim()) {
      showAlert(t('common.error'), t('signup.errors.emptyPassword'));
      return;
    }
    
    const requirements = verifyPasswordStrength(newPassword);
    if (requirements.length > 0) {
      // Don't show alert, error already displayed in requirements
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setConfirmPasswordError(t('signup.errors.passwordMismatch'));
      return;
    }
    
    if (currentPassword === newPassword) {
      showAlert(t('common.error'), t('changePassword.errors.samePassword'));
      return;
    }
    
    setIsLoading(true);
    
    try {
      await changePassword(currentPassword, newPassword);
      
      showAlert(
        t('common.success'),
        t('changePassword.successMessage'),
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
      console.error('Error canviant contrasenya:', error);
      
      if (error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
        setCurrentPasswordError(t('changePassword.errors.wrongPassword'));
      } else if (error?.code === 'auth/weak-password') {
        showAlert(t('common.error'), t('auth.errors.weakPassword'));
      } else if (error?.code === 'auth/requires-recent-login') {
        showAlert(t('common.error'), t('changePassword.errors.requiresRecentLogin'));
      } else {
        showAlert(t('common.error'), t('changePassword.errors.generic'));
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoBack = () => {
    // Clear all fields when going back
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setCurrentPasswordError(null);
    setPasswordRequirements([]);
    setConfirmPasswordError(null);
    navigation.navigate('Settings');
  };

  // Ensure any removal (including Android hardware back) leads to Settings
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (Platform.OS === 'android') {
        e.preventDefault();
        // clear fields and go to Settings
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setCurrentPasswordError(null);
        setPasswordRequirements([]);
        setConfirmPasswordError(null);
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
  
  const isFormValid = 
    currentPassword.trim() !== '' &&
    newPassword.trim() !== '' &&
    confirmPassword.trim() !== '' &&
    passwordRequirements.length === 0 &&
    newPassword === confirmPassword &&
    !currentPasswordError &&
    !confirmPasswordError;
  
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
          <Text style={styles.title}>{t('changePassword.title')}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT, paddingBottom: Math.max(insets.bottom, 16) }}
        style={styles.container}
      >
        <View style={styles.content}>
          <Text style={styles.description}>{t('changePassword.description')}</Text>
          
          {/* Current Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('changePassword.currentPassword')}</Text>
            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={[styles.input, currentPasswordError && styles.inputError]}
                value={currentPassword}
                onChangeText={(text) => {
                  setCurrentPassword(text);
                  setCurrentPasswordError(null);
                }}
                placeholder={t('changePassword.currentPasswordPlaceholder')}
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <VisibleOffIcon /> : <VisibleIcon />}
              </TouchableOpacity>
            </View>
            {currentPasswordError && (
              <Text style={styles.errorText}>{currentPasswordError}</Text>
            )}
          </View>
          
          {/* New Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('changePassword.newPassword')}</Text>
            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={[styles.input, passwordRequirements.length > 0 && newPassword.length > 0 && styles.inputError]}
                value={newPassword}
                onChangeText={handleNewPasswordChange}
                placeholder={t('changePassword.newPasswordPlaceholder')}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <VisibleOffIcon /> : <VisibleIcon />}
              </TouchableOpacity>
            </View>
            {passwordRequirements.length > 0 && newPassword.length > 0 && (
              <View style={styles.requirementsContainer}>
                <Text style={styles.requirementsTitle}>{t('signup.errors.passwordMustHave')}</Text>
                {passwordRequirements.map((req, index) => (
                  <Text key={index} style={styles.requirementText}>{req}</Text>
                ))}
              </View>
            )}
          </View>
          
          {/* Confirm New Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('changePassword.confirmNewPassword')}</Text>
            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={[styles.input, confirmPasswordError && styles.inputError]}
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                placeholder={t('changePassword.confirmNewPasswordPlaceholder')}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <VisibleOffIcon /> : <VisibleIcon />}
              </TouchableOpacity>
            </View>
            {confirmPasswordError && (
              <Text style={styles.errorText}>{confirmPasswordError}</Text>
            )}
          </View>
          
          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, (!isFormValid || isLoading) && styles.submitButtonDisabled]}
            onPress={handleChangePassword}
            disabled={!isFormValid || isLoading}
          >
            {(!isFormValid || isLoading) ? (
              <View style={styles.submitButtonGradientDisabled}>
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonTextDisabled}>{t('changePassword.submit')}</Text>
                )}
              </View>
            ) : (
              <LinearGradient
                colors={["#FF8904", "#F54900"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitButtonGradient}
              >
                <Text style={styles.submitButtonText}>{t('changePassword.submit')}</Text>
              </LinearGradient>
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
  requirementsContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  requirementsTitle: {
    fontSize: 14,
    color: '#991b1b',
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Arimo',
  },
  requirementText: {
    fontSize: 13,
    color: '#dc2626',
    fontFamily: 'Arimo',
  },
  submitButton: {
    backgroundColor: '#f97316',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  submitButtonGradientDisabled: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dadadaff',
    borderRadius: 8,
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
