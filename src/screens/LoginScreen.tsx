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
import { AuthService } from '../services/AuthService';

// Logo provisional - utilitzarem el logo default del perfil temporalment
// TODO: Canviar per el logo definitiu de l'app
const AppLogo = require('../assets/images/profileDefaultBackground.png');

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onNavigateToSignUp?: () => void;
}

export function LoginScreen({ onLoginSuccess, onNavigateToSignUp }: LoginScreenProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      // Login amb Firebase Auth
      const user = await AuthService.login({
        email: email.trim(),
        password: password
      });
      
      // Comprovar si l'email està verificat
      if (!user.emailVerified) {
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
              }
            },
            {
              text: t('common.close'),
              style: 'cancel'
            }
          ]
        );
        // Tancar sessió si l'email no està verificat
        await AuthService.logout();
        return;
      }
      
      // Si tot és correcte, cridar onLoginSuccess
      onLoginSuccess();
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

  const handleForgotPassword = () => {
    // Recuperació de contrasenya
    Alert.prompt(
      t('auth.passwordResetTitle'),
      t('auth.passwordResetMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel'
        },
        {
          text: t('auth.sendResetEmail'),
          onPress: async (resetEmail) => {
            if (!resetEmail || !resetEmail.trim()) {
              Alert.alert(t('common.error'), t('login.errors.emptyEmail'));
              return;
            }
            
            try {
              await AuthService.resetPassword(resetEmail.trim());
              Alert.alert(t('common.success'), t('auth.passwordResetEmailSent'));
            } catch (error: any) {
              console.error('Error enviant email de recuperació:', error);
              const errorCode = error?.code || 'unknown';
              const errorMessageKey = AuthService.getErrorMessageKey(errorCode);
              const errorMessage = t(errorMessageKey) || t('auth.errors.generic');
              Alert.alert(t('common.error'), errorMessage);
            }
          }
        }
      ],
      'plain-text',
      email
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
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={t('login.passwordPlaceholder')}
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity 
              onPress={handleForgotPassword}
              style={styles.forgotPasswordContainer}
            >
              <Text style={styles.forgotPasswordText}>
                {t('login.forgotPassword')}
              </Text>
            </TouchableOpacity>

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
    marginTop: 2,
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
});
