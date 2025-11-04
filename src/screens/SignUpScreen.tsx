import React, { useState, useEffect } from 'react';
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
import { useWindowDimensions } from 'react-native';
import { BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../utils/useTranslation';
import { useAuth } from '../contexts/AuthContext';
import i18n from '../i18n';
import ArrowLeftIcon from '../assets/icons/arrow-left.svg';
import { AuthService } from '../services/AuthService';
import VisibleIcon from '../assets/icons/visible.svg';
import VisibleOffIcon from '../assets/icons/visibleOff2.svg';

// Logo provisional
const AppLogo = require('../assets/images/profileDefaultBackground.png');

// Configuració de banderes: imatges reals a `src/assets/images`
const flags = {
  ca: { image: require('../assets/images/catalunyaFlag.png'), name: 'Català' },
  es: { image: require('../assets/images/spainFlag.webp'), name: 'Español' },
  fr: { image: require('../assets/images/franceFlag.webp'), name: 'Français' },
  en: { image: require('../assets/images/ukflag.webp'), name: 'English' }
};

interface SignUpScreenProps {
  onSignUpSuccess: () => void;
  onBackToLogin: () => void;
}

type Language = 'ca' | 'es' | 'en' | 'fr';

export function SignUpScreen({ onSignUpSuccess, onBackToLogin }: SignUpScreenProps) {
  const { signup } = useAuth();
  const { t } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const [step, setStep] = useState<'language' | 'username' | 'email' | 'password' | 'confirmPassword' | 'register'>('language');
  const [previousStep, setPreviousStep] = useState<'language' | 'username' | 'email' | 'password' | 'confirmPassword' | 'register'>('username');
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrorsState, setPasswordErrors] = useState<string[]>([]);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSelectLanguage = (lang: Language) => {
    setSelectedLanguage(lang);
    i18n.changeLanguage(lang);
    setStep(previousStep); // previousStep == username by default
  };

  // Calculate flag sizes so they occupy the same space while respecting
  // the horizontal padding of the container. Use the golden ratio to
  // determine height from the computed width for an aesthetic rectangle.
  const flagCount = Object.keys(flags).length;
  const containerPaddingHorizontal = 40; // should match styles.flagsContainer.paddingHorizontal
  const gapBetweenFlags = 0; // visual gap between flags
  const phi = (1 + Math.sqrt(5)) / 2; // golden ratio ~1.618
  const availableWidth = Math.max(0, windowWidth - containerPaddingHorizontal * 2 - gapBetweenFlags * (flagCount - 1));
  const computedFlagWidth = Math.floor(availableWidth / flagCount);
  const computedFlagHeight = Math.max(1, Math.round(computedFlagWidth / phi));
  // Scale flags up a bit while keeping them responsive. Limit to 90% of window
  // width so they don't overflow on narrow screens.
  // Slightly reduce the scaling factor because the previous value was too large
  const scaledFlagWidth = Math.min(Math.floor(computedFlagWidth * 1.12), Math.floor(windowWidth * 0.9));
  const scaledFlagHeight = Math.max(1, Math.round(scaledFlagWidth / phi));

  // Gestiona el text de l'username i mostra/oculta el camp de email
  const handleSetUsername = (text: string) => {
    setUsername(text);
    // Si l'usuari escriu algun caràcter (no només espais) mostrem el email
    if (text && text.trim().length > 0) {
      if(step === "username"){
        setStep('email')
        setPreviousStep('email');
      }
    }
  };
  
  // Gestiona el text de l'email i mostra/oculta el camp de contrasenya
  const handleSetEmail = (text: string) => {
    setEmail(text);
    // Si l'usuari escriu algun caràcter (no només espais) mostrem el password
    if (text && text.trim().length > 0) {
      // initialize password errors so empty password shows all rules immediately
      setPasswordErrors(verifyPasswordStrength(password));
      if(step === "email"){
        setStep('password');
        setPreviousStep('password');
      }
    }
  };

  // Gestiona el text de la contrasenya i mostra/oculta el camp de confirmació
  const handleSetPassword = (text: string) => {
    setPassword(text);
    // Recalculate inline password errors and clear any confirm-password error
    const passwordErrors = verifyPasswordStrength(text);
    setPasswordErrors(passwordErrors);
    setConfirmPasswordError(null);

    // Si l'usuari escriu algun caràcter (no només espais) mostrem el confirmPassword
    if (text && text.trim().length > 0) {
      if (passwordErrors.length > 0) {
        setStep('password');
      } else {
        // We're about to move to the confirm-password step — clear any previous
        // value in the confirmPassword field so the user must re-enter it for
        // the new password.
        setConfirmPassword('');
        setStep('confirmPassword');
        setPreviousStep('confirmPassword');
      }
    }
  };

  // Gestiona el text de la confirmació de la contrasenya
  const handleSetConfirmPassword = (text: string) => {
    setConfirmPassword(text);
    // Si l'usuari escriu algun caràcter (no només espais) mostrem el boto de registre
    if (text && text.trim().length > 0) {
      if (text === password) {
        setConfirmPasswordError(null);
        setStep('register');
        setPreviousStep('register');
      } else {
        setConfirmPasswordError(t('signup.errors.passwordMismatch'));
        setStep('confirmPassword');
        setPreviousStep('confirmPassword');
      }
    } else {
      setConfirmPasswordError(null);
      setStep('confirmPassword');
      setPreviousStep('confirmPassword');
    }
  };

  const verifyPasswordStrength = (password: string) => {
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

  const handleSignUp = async () => {
    // Validació bàsica
    if (!username.trim()) {
      Alert.alert(t('common.error'), t('signup.errors.emptyUsername'));
      return;
    }

    if (!email.trim()) {
      Alert.alert(t('common.error'), t('signup.errors.emptyEmail'));
      return;
    }

    // Validació bàsica d'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t('common.error'), t('signup.errors.invalidEmail'));
      return;
    }

    if (!password.trim()) {
      Alert.alert(t('common.error'), t('signup.errors.emptyPassword'));
      return;
    }

    if (!selectedLanguage) {
      Alert.alert(t('common.error'), 'Si us plau, selecciona un idioma');
      return;
    }

    setIsLoading(true);
    
    try {
      // Registre amb el context (que utilitza AuthService internament)
      await signup(
        email.trim(),
        password,
        username.trim(),
        selectedLanguage
      );
      
      Alert.alert(
        t('common.success'), 
        t('signup.successMessage'),
        [
          {
            text: t('common.close'),
            onPress: onSignUpSuccess
          }
        ]
      );
    } catch (error: any) {
      console.error('Error durant el registre:', error);
      
      // Obtenir missatge d'error traduït
      const errorCode = error?.code || 'unknown';
      const errorMessageKey = AuthService.getErrorMessageKey(errorCode);
      const errorMessage = t(errorMessageKey) || t('signup.errors.registrationFailed');
      
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back action on multiple platforms:
  // - Android / Windows: BackHandler hardware button
  // - Web: browser back (popstate)
  useEffect(() => {
    const onBackPress = () => {
      if (step === 'username') {
        // Si estem al formulari, tornem a la selecció d'idioma
        setStep('language');
        setSelectedLanguage(null);
        return true;
      } else if (step === 'language') {
        // Si estem a la selecció d'idioma, tornem al login
        if (onBackToLogin) {
          onBackToLogin();
        }
        return true;
      }
      return false;
    };

    if (Platform.OS === 'web') {
      const handler = () => {
        // When browser back is pressed, navigate back to Login
        onBackPress();
      };
      window.addEventListener('popstate', handler);
      return () => window.removeEventListener('popstate', handler);
    }

    // Fallback for native platforms (Android, Windows)
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [step, onBackToLogin]);

  // Pantalla de selecció d'idioma
  if (step === 'language') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.languageContainer}>
          <LinearGradient
            colors={["#FF8904", "#F54900"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.languageHeader}
          >
            <Image 
              source={AppLogo} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.languageTitle}>
              {t('signup.selectLanguage')}
            </Text>
          </LinearGradient>

          <View style={styles.flagsContainer}>
            <TouchableOpacity 
              style={[styles.flagButton, { width: scaledFlagWidth }]}
              onPress={() => handleSelectLanguage('ca')}
            >
              <Image source={flags.ca.image} style={[styles.flagImage, { width: Math.round(scaledFlagWidth * 0.92), height: scaledFlagHeight }]} resizeMode="cover" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.flagButton, { width: scaledFlagWidth }]}
              onPress={() => handleSelectLanguage('es')}
            >
              <Image source={flags.es.image} style={[styles.flagImage, { width: Math.round(scaledFlagWidth * 0.92), height: scaledFlagHeight }]} resizeMode="cover" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.flagButton, { width: scaledFlagWidth }]}
              onPress={() => handleSelectLanguage('fr')}
            >
              <Image source={flags.fr.image} style={[styles.flagImage, { width: Math.round(scaledFlagWidth * 0.92), height: scaledFlagHeight }]} resizeMode="cover" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.flagButton, { width: scaledFlagWidth }]}
              onPress={() => handleSelectLanguage('en')}
            >
              <Image source={flags.en.image} style={[styles.flagImage, { width: Math.round(scaledFlagWidth * 0.92), height: scaledFlagHeight }]} resizeMode="cover" />
            </TouchableOpacity>

            {/* Enllaç per tornar al login */}
            <TouchableOpacity 
              style={styles.backToLoginContainer}
              onPress={onBackToLogin}
            >
              <Text style={styles.alreadyAccountText}>
                {t('signup.alreadyHaveAccount')}
              </Text>
              <Text style={styles.loginLinkText}>
                {t('signup.loginLink')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Formulari de registre
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent,
            // Add bottom padding when on password steps so inline errors
            // aren't occluded by the keyboard and there's some breathing room.
            (step === 'password' || step === 'confirmPassword' || step === 'register') ? { paddingBottom: 140 } : {}
          ]}
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
            <Text style={styles.title}>{t('signup.title')}</Text>
            <Text style={styles.subtitle}>{t('signup.subtitle')}</Text>
          </LinearGradient>

          {/* Formulari de registre */}
          <View style={styles.formContainer}>
            {(step === "username" || step === "email" || step === "password" || step === "confirmPassword" || step === "register") && (
              <>
                {/* Botó per tornar a la selecció d'idioma */}
                <TouchableOpacity
                  style={styles.inlineBackButton}
                  onPress={() => {
                  setStep('language');
                  setSelectedLanguage(null);
                  }}
                  accessibilityLabel={t('signup.backToLanguage') || 'Back to language'}
                >
                  <ArrowLeftIcon width={20} height={20} color="#FF8904" />
                  <Text style={styles.backToLoginText}>{t('signup.backToLanguage')}</Text>
                </TouchableOpacity>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder={t('signup.usernamePlaceholder')}
                    placeholderTextColor="#999"
                    value={username}
                    onChangeText={handleSetUsername}
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                </View>
              </>
            )}

            {(step === "email" || step === "password" || step === "confirmPassword" || step === "register") && (
              <>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder={t('signup.emailPlaceholder')}
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={handleSetEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!isLoading}
                  />
                </View>
              </>
            )}

            {(step === "password" || step === "confirmPassword" || step === "register") && (
              <>
                <View style={styles.inputContainer}>
                  <View style={styles.inputWithIcon}>
                    <TextInput
                      style={[styles.input, styles.inputWithIconPadding]}
                      placeholder={t('signup.passwordPlaceholder')}
                      placeholderTextColor="#999"
                      value={password}
                      onChangeText={handleSetPassword}
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
                  {/* Inline password errors (grey) */}
                  {passwordErrorsState.length > 0 && (
                    <View style={{ marginTop: 8 }}>
                      <Text style={styles.errorText}>{t('signup.errors.passwordMustHave')}</Text>
                      {passwordErrorsState.map((err, idx) => (
                        <Text key={idx} style={styles.errorText}>{err}</Text>
                      ))}
                    </View>
                  )}
                </View>
              </>
            )}

            {(step === "confirmPassword" || step === "register") && (
              <>
                <View style={styles.inputContainer}>
                  <View style={styles.inputWithIcon}>
                    <TextInput
                      style={[styles.input, styles.inputWithIconPadding]}
                      placeholder={t('signup.confirmPasswordPlaceholder')}
                      placeholderTextColor="#999"
                      value={confirmPassword}
                      onChangeText={handleSetConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(prev => !prev)}
                      style={styles.iconButton}
                      accessibilityLabel={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? (
                        <VisibleOffIcon width={22} height={22} />
                      ) : (
                        <VisibleIcon width={22} height={22} />                    
                      )}
                    </TouchableOpacity>
                  </View>
                  {confirmPasswordError ? (
                    <Text style={[styles.errorText, { marginTop: 8 }]}>{confirmPasswordError}</Text>
                  ) : null}
                </View>
              </>
            )}

            {step === "register" && (
              <>
                {/* Botó de registre */}
                <TouchableOpacity
                  style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]}
                  onPress={handleSignUp}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={["#FF8904", "#F54900"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.signUpButtonGradient}
                  >
                    <Text style={styles.signUpButtonText}>
                      {isLoading ? t('common.loading') : t('signup.signUpButton')}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {/* Enllaç per tornar al login */}
            <TouchableOpacity 
              style={styles.backToLoginContainer}
              onPress={onBackToLogin}
            >
              <Text style={styles.alreadyAccountText}>
                {t('signup.alreadyHaveAccount')}
              </Text>
              <Text style={styles.loginLinkText}>
                {t('signup.loginLink')}
              </Text>
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
  languageContainer: {
    flex: 1,
  },
  languageHeader: {
    paddingTop: 60,
    paddingBottom: 50,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  languageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  flagsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    flexDirection: 'column',
    gap: 36,
    marginBottom: 20,
    marginTop: 40,
  },
  flagButton: {
    borderRadius: 12,
    paddingVertical: 0,
    paddingHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagImage: {
    // width/height provided dynamically to keep same proportions
    borderRadius: 8,
  },
  flagName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerBackButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  inlineBackButton: {
    alignSelf: 'flex-start',
    width: '100%',
    height: 40,
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    gap: 4,
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
    paddingTop: 20,
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
  signUpButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 24,
  },
  signUpButtonDisabled: {
    opacity: 0.7,
  },
  signUpButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backToLoginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  backToLoginButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  backToLoginText: {
    color: '#FF8904',
    fontSize: 14,
    fontWeight: '600',
  },
  alreadyAccountText: {
    color: '#6b7280',
    fontSize: 14,
  },
  loginLinkText: {
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
  errorText: {
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 18,
  },
});
