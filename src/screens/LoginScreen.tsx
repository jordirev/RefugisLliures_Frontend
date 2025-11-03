import React, { useState } from 'react';
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
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../utils/useTranslation';
import { useAuth } from '../contexts/AuthContext';
import { AuthService } from '../services/AuthService';
import VisibleIcon from '../assets/icons/visible.svg';
import VisibleOffIcon from '../assets/icons/visibleOff2.svg';

// Logo provisional - utilitzarem el logo default del perfil temporalment
// TODO: Canviar per el logo definitiu de l'app
const AppLogo = require('../assets/images/profileDefaultBackground.png');

interface LoginScreenProps {
  onNavigateToSignUp?: () => void;
}

export function LoginScreen({ onNavigateToSignUp }: LoginScreenProps) {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Gestiona el text de l'email i mostra/oculta el camp de contrasenya
  const handleSetEmail = (text: string) => {
    setEmail(text);
    // Si l'usuari escriu algun caràcter (no només espais) mostrem el password
    if (text && text.trim().length > 0) {
      setStep('password');
    } else {
      setStep('email');
    }
  };

  const handleLogin = async () => {
    // Validació bàsica
    if (!email.trim()) {
      Alert.alert(t('common.error'), t('login.errors.emptyEmail'));
      return;
    }
    
    if (!password.trim()) {
      Alert.alert(t('common.error'), t('login.errors.emptyPassword'));
      return;
    }

    setIsLoading(true);
    
    try {
      // Login amb el context (que utilitza AuthService internament)
      await login(email.trim(), password);
      
      // Comprovar si l'email està verificat
      const currentUser = AuthService.getCurrentUser();
      if (currentUser && !currentUser.emailVerified) {
        Alert.alert(
          t('auth.emailNotVerified'),
          t('auth.checkEmailVerification'),
          [
            {
              text: t('auth.resendVerificationEmail'),
              onPress: async () => {
                try {
                  await AuthService.resendVerificationEmail();
                  Alert.alert(t('common.success'), t('auth.verificationEmailResent'));
                } catch (error) {
                  console.error('Error reenviant email:', error);
                  Alert.alert(t('common.error'), t('auth.errors.generic'));
                }
                // Tancar sessió després de reenviar el correu
                await AuthService.logout();
              }
            },
            {
              text: t('common.close'),
              style: 'cancel',
              onPress: async () => {
                // Tancar sessió si l'usuari tanca l'alert
                await AuthService.logout();
              }
            }
          ]
        );
        return;
      }
      
      // L'AuthProvider gestionarà automàticament la navegació
    } catch (error: any) {
      console.error('Error durant el login:', error);
      
      // Obtenir missatge d'error traduït
      const errorCode = error?.code || 'unknown';
      const errorMessageKey = AuthService.getErrorMessageKey(errorCode);
      const errorMessage = t(errorMessageKey) || t('login.errors.invalidCredentials');
      
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // TODO: Implementar login amb Google
    Alert.alert('Google Login', 'Funcionalitat en desenvolupament');
  };

  const handleForgotPassword = async () => {
    // Validar que hi ha un email introduït
    if (!email.trim()) {
      Alert.alert(
        t('common.error'), 
        t('login.errors.emptyEmail')
      );
      return;
    }

    // Confirmar abans d'enviar
    Alert.alert(
      t('auth.passwordResetTitle'),
      `${t('auth.passwordResetMessage')}\n\n${email}`,
      [
        {
          text: t('common.cancel'),
          style: 'cancel'
        },
        {
          text: t('auth.sendResetEmail'),
          onPress: async () => {
            try {
              await AuthService.resetPassword(email.trim());
              Alert.alert(
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
              Alert.alert(t('common.error'), errorMessage);
            }
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

            {/* Mostrem el camp de password i 'forgot password' només quan l'email està omplert */}
            {step === 'password' && (
              <>
                <View style={styles.inputContainer}>
                  <View style={styles.inputWithIcon}>
                    <TextInput
                      style={[styles.input, styles.inputWithIconPadding]}
                      placeholder={t('login.passwordPlaceholder')}
                      placeholderTextColor="#999"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      editable={!isLoading}
                    />
                    <TouchableOpacity
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

                <TouchableOpacity 
                  onPress={handleForgotPassword}
                  style={styles.forgotPasswordContainer}
                >
                  <Text style={styles.forgotPasswordText}>
                    {t('login.forgotPassword')}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Botó d'iniciar sessió */}
            <TouchableOpacity
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

            {/* Separador */}
            <View style={styles.separatorContainer}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>{t('login.orContinueWith')}</Text>
              <View style={styles.separatorLine} />
            </View>

            {/* Botó de Google */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleLogin}
              disabled={isLoading}
            >
              <View style={styles.googleButtonContent}>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleButtonText}>
                  {t('login.googleButton')}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Enllaç per crear compte */}
            {onNavigateToSignUp && (
              <TouchableOpacity 
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
    backgroundColor: '#e5e7eb',
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
