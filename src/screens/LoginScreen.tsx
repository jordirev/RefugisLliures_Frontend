import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from 'react-native';
import validator from 'validator';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import NetInfo from '@react-native-community/netinfo';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../contexts/AuthContext';
import { AuthService } from '../services/AuthService';
import VisibleIcon from '../assets/icons/visible.svg';
import VisibleOffIcon from '../assets/icons/visibleOff2.svg';
import GoogleLogoIcon from '../assets/icons/googleLogo.png';
import { CustomAlert } from '../components/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

// Logo provisional - utilitzarem el logo default del perfil temporalment
// TODO: Canviar per el logo definitiu de l'app
const AppLogo = require('../assets/images/logo.png');
 
interface LoginScreenProps {
  onNavigateToSignUp?: () => void;
}

export function LoginScreen({ onNavigateToSignUp }: LoginScreenProps) {
  const { t } = useTranslation();
  const { login, loginWithGoogle, enterOfflineMode } = useAuth();
  const { alertVisible, alertConfig, showAlert, hideAlert } = useCustomAlert();
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const passwordInputRef = useRef<any>(null);
  
  // Verificar si Google Sign In està disponible
  const isGoogleSignInAvailable = AuthService.isGoogleSignInAvailable();

  // Gestiona el text de l'email i mostra/oculta el camp de contrasenya
  const handleSetEmail = (text: string) => {
    setEmail(text);
    // Clear inline email error while the user edits the field
    if (emailError) setEmailError(null);
    // No auto-advance: user must press "Continue" to show password field
  };

  const handleSetPassword = (text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError(null);
  };

  const handleLogin = async () => {
    // Validació bàsica
    if (!email.trim()) {
      setEmailError(t('login.errors.emptyEmail') || 'Email buit');
      return;
    }

    // Validate email format and show inline error (no alert) if invalid
    if (!validator.isEmail(email)) {
      setEmailError(t('login.errors.invalidEmail') || 'Email no vàlid');
      return;
    }

    if (!password.trim()) {
      setPasswordError(t('login.errors.emptyPassword') || 'Contrasenya buida');
      return;
    }

    setIsLoading(true);
    
    try {
      // Comprovar connexió abans d'intentar el login
      const netState = await NetInfo.fetch();
      
      // Si no hi ha connexió, oferir mode offline
      if (!netState.isConnected) {
        setIsLoading(false);
        showAlert(
          'Sense connexió',
          'No hi ha connexió a Internet. Vols entrar en mode offline? Podràs veure els mapes descarregats però les funcionalitats estaran limitades.',
          [
            { text: 'Cancel·lar', style: 'cancel' },
            { 
              text: 'Mode Offline', 
              onPress: () => {
                enterOfflineMode();
              },
              style: 'default'
            }
          ]
        );
        return;
      }

      // Login amb el context (que utilitza AuthService internament)
      await login(email.trim(), password);
      
      // Comprovar si l'email està verificat
      const currentUser = AuthService.getCurrentUser();
      if (currentUser && !currentUser.emailVerified) {
        showAlert(
          t('auth.emailNotVerified'),
          t('auth.checkEmailVerification'),
          [
            // Primer el botó de tancar (a l'esquerra), després el de reenviar
            {
              text: t('common.close'),
              style: 'cancel',
              onPress: () => {
                (async () => {
                  // Tancar sessió si l'usuari tanca l'alert
                  await AuthService.logout();
                })();
              }
            },
            {
              text: t('auth.resendVerificationEmail'),
              onPress: () => {
                (async () => {
                  try {
                    await AuthService.resendVerificationEmail();
                    showAlert(t('common.success'), t('auth.verificationEmailResent'));
                  } catch (error) {
                    console.error('Error reenviant email:', error);
                    showAlert(t('common.error'), t('auth.errors.generic'));
                  }
                  // Tancar sessió després de reenviar el correu
                  await AuthService.logout();
                })();
              }
            }
          ]
        );
        return;
      }
      
      // L'AuthProvider gestionarà automàticament la navegació
    } catch (error: any) {
      console.error('Error durant el login:', error);

      // Obtenir el codi d'error
      const errorCode = error?.code || 'unknown';

      // Comprovar si és un error de xarxa
      const isNetworkError = 
        errorCode === 'auth/network-request-failed' || 
        error?.message?.toLowerCase().includes('network') ||
        error?.message?.toLowerCase().includes('connection');

      if (isNetworkError) {
        // Si és error de xarxa, oferir mode offline
        showAlert(
          'Error de connexió',
          'No s\'ha pogut connectar amb el servidor. Vols entrar en mode offline? Podràs veure els mapes descarregats però les funcionalitats estaran limitades.',
          [
            { text: 'Cancel·lar', style: 'cancel' },
            { 
              text: 'Mode Offline', 
              onPress: () => {
                enterOfflineMode();
              },
              style: 'default'
            }
          ]
        );
      } else if (errorCode === 'auth/invalid-credential') {
        // Si les credencials són incorrectes (error específic d'autenticació),
        // mostrem el missatge inline (vermell) sota el camp de contrasenya en lloc d'una alerta.
        const errorMessage = t('login.errors.invalidCredentials') || 'Credencials no vàlides';
        setPasswordError(errorMessage);
        // focus al camp de password perquè l'usuari pugui corregir-lo
        try {
          passwordInputRef.current?.focus();
        } catch (e) {
          /* ignore focus errors */
        }
      } else {
        // Per la resta d'errors utilitzem el mapeig existent i una fallback genèrica
        const errorMessageKey = AuthService.getErrorMessageKey(errorCode);
        const errorMessage = t(errorMessageKey) || t('auth.errors.generic') || t('login.errors.invalidCredentials');
        showAlert(t('common.error'), errorMessage);
      }
    } finally {
      // No esborrem els errors inline aquí perquè volem que l'error de contrasenya
      // segueixi mostrat sota el camp fins que l'usuari comenci a editar-lo.
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    // Validate email then reveal password field
    if (!email.trim()) {
      // show inline error, don't use alert
      setEmailError(t('login.errors.emptyEmail') || 'Email buit');
      return;
    }

    // Validate format
    if (!validator.isEmail(email)) {
      setEmailError(t('login.errors.invalidEmail') || 'Email no vàlid');
      return;
    }

    setEmailError(null);
    setStep('password');
    // Focus password input after it appears
    setTimeout(() => {
      try {
        passwordInputRef.current?.focus();
      } catch (e) {
        /* ignore focus errors */
      }
    }, 150);
  };

  const handleGoogleLogin = async () => {
    if (!isGoogleSignInAvailable) {
      showAlert(
        t('common.info') || 'Informació',
        'Google Sign In no està disponible en Expo Go. Utilitza un build natiu per activar aquesta funcionalitat.'
      );
      return;
    }
    
    setIsLoading(true);
    try {
      await loginWithGoogle();
      // L'AuthProvider gestionarà automàticament la navegació
    } catch (error: any) {
      console.error('Error durant el login amb Google:', error);
      
      // Si l'usuari cancel·la, no mostrem error
      if (error.message === 'LOGIN_CANCELLED') {
        console.log('Login amb Google cancel·lat per l\'usuari');
        return;
      }

      // Per altres errors, mostrem un missatge genèric
      showAlert(
        t('common.error'),
        t('auth.errors.googleLoginFailed') || 'Error durant l\'autenticació amb Google'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    // Validar que hi ha un email introduït
    if (!email.trim()) {
      showAlert(
        t('common.error'), 
        t('login.errors.emptyEmail')
      );
      return;
    }

    // Confirmar abans d'enviar
    showAlert(
      t('auth.passwordResetTitle'),
      `${t('auth.passwordResetMessage')}\n\n${email}`,
      [
        {
          text: t('common.cancel'),
          style: 'cancel'
        },
        {
          text: t('auth.sendResetEmail'),
          onPress: () => {
            (async () => {
              try {
                await AuthService.resetPassword(email.trim());
                showAlert(
                  t('common.success'), 
                  t('auth.passwordResetEmailSent'),
                  [
                    {
                      text: t('common.ok'),
                      onPress: () => console.log('Email de recuperació enviat correctament')
                    }
                  ]
                );
              } catch (error: any) {
                console.error('Error enviant email de recuperació:', error);
                const errorCode = error?.code || 'unknown';
                const errorMessageKey = AuthService.getErrorMessageKey(errorCode);
                const errorMessage = t(errorMessageKey) || t('auth.errors.generic');
                showAlert(t('common.error'), errorMessage);
              }
            })();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header amb gradient */}
          <LinearGradient
            colors={["#FF8904", "#F54900"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <Image 
              source={AppLogo} 
              width={120}
              height={120}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>{t('login.title')}</Text>
            <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
          </LinearGradient>

          {/* Formulari de login */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <TextInput
                testID="email-input"
                style={styles.input}
                placeholder={t('login.emailPlaceholder')}
                placeholderTextColor="#999"
                value={email}
                onChangeText={handleSetEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isLoading}
                returnKeyType={step === 'password' ? 'next' : 'done'}
              />
            </View>
            {emailError ? (
              <Text style={styles.emailErrorText}>{emailError}</Text>
            ) : null}

            {/* Mostrem el camp de password i 'forgot password' només quan l'email està omplert */}
            {step === 'password' && (
              <>
                <View style={styles.inputContainer}>
                  <View style={styles.inputWithIcon}>
                    <TextInput
                      testID="password-input"
                      style={[styles.input, styles.inputWithIconPadding]}
                      placeholder={t('login.passwordPlaceholder')}
                      placeholderTextColor="#999"
                      value={password}
                      onChangeText={handleSetPassword}
                      ref={passwordInputRef}
                      secureTextEntry={!showPassword}
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      testID="toggle-password-visibility"
                      onPress={() => setShowPassword(prev => !prev)}
                      style={styles.iconButton}
                      accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <VisibleOffIcon width={22} height={22} />
                      ) : (
                        <VisibleIcon width={22} height={22} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
                {passwordError ? (
                  <Text style={styles.emailErrorText}>{passwordError}</Text>
                ) : null}

                <TouchableOpacity 
                  testID="forgot-password-button"
                  onPress={handleForgotPassword}
                  style={styles.forgotPasswordContainer}
                >
                  <Text style={styles.forgotPasswordText}>
                    {t('login.forgotPassword')}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {step === 'email' ? (
              (() => {
                const continueDisabled = isLoading || !email.trim();
                return (
                  <TouchableOpacity
                    testID="continue-button"
                    style={[styles.loginButton, continueDisabled && styles.loginButtonDisabled]}
                    onPress={handleContinue}
                    disabled={continueDisabled}
                  >
                    {continueDisabled ? (
                      <View style={styles.loginButtonGradientDisabled}>
                        <Text style={[styles.loginButtonText, { color: '#707070ff' }]}>
                          {isLoading ? t('common.loading') : t('login.continue')}
                        </Text>
                      </View>
                    ) : (
                      <LinearGradient
                        colors={["#FF8904", "#F54900"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.loginButtonGradient}
                      >
                        <Text style={styles.loginButtonText}>
                          {isLoading ? t('common.loading') : t('login.continue')}
                        </Text>
                      </LinearGradient>
                    )}
                  </TouchableOpacity>
                );
              })()
            ) : (
              <>
                {/* Botó d'iniciar sessió */}
                <TouchableOpacity
                  testID="login-button"
                  style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={["#FF8904", "#F54900"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.loginButtonGradient}
                  >
                    <Text style={styles.loginButtonText}>
                      {isLoading ? t('common.loading') : t('login.loginButton')}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
              )}
              {/* Separador */}
              <View style={styles.separatorContainer}>
                <View style={styles.separatorLine} />
                <Text style={styles.separatorText}>{t('login.orContinueWith')}</Text>
                <View style={styles.separatorLine} />
              </View>

              {/* Botó de Google */}
              <TouchableOpacity
                testID="google-login-button"
                style={styles.googleButton}
                onPress={handleGoogleLogin}
                disabled={isLoading}
              >
                <View style={styles.googleButtonContent}>
                  <Image 
                    source={GoogleLogoIcon} 
                    style={styles.googleIcon} 
                    resizeMode="contain"
                  />
                  <Text style={styles.googleButtonText}>
                    {t('login.googleButton')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Enllaç per crear compte */}
              {onNavigateToSignUp && (
                <TouchableOpacity 
                  testID="signup-link"
                  style={styles.signUpContainer}
                  onPress={onNavigateToSignUp}
                >
                  <Text style={styles.noAccountText}>
                    {t('login.noAccount')}
                  </Text>
                  <Text style={styles.signUpLinkText}>
                    {t('login.signUpLink')}
                  </Text>
                </TouchableOpacity>
              )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 10,
    paddingBottom: 50,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 40,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    color: '#1f2937',
  },
  emailErrorText: {
    color: '#dc2626',
    fontSize: 13,
    marginBottom: 8,
    marginTop: -8,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: 4,
  },
  forgotPasswordText: {
    color: '#FF8904',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 30,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonGradientDisabled: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dadadaff',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#6b7280',
  },
  separatorText: {
    marginHorizontal: 16,
    color: '#6b7280',
    fontSize: 14,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    height: 22,
    width: 22,
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 12,
    color: '#4285F4',
  },
  googleButtonText: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '600',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  noAccountText: {
    color: '#6b7280',
    fontSize: 14,
  },
  signUpLinkText: {
    color: '#FF8904',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  inputWithIcon: {
    position: 'relative',
    width: '100%',
  },
  inputWithIconPadding: {
    paddingRight: 48,
  },
  iconButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
});
