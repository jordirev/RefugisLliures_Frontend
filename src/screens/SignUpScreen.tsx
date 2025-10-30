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
import i18n from '../i18n';
import ArrowLeftIcon from '../assets/icons/arrow-left.svg';

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
  const { t } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const [step, setStep] = useState<'language' | 'form'>('language');
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectLanguage = (lang: Language) => {
    setSelectedLanguage(lang);
    i18n.changeLanguage(lang);
    setStep('form');
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

    if (password.length < 6) {
      Alert.alert(t('common.error'), t('signup.errors.shortPassword'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('signup.errors.passwordMismatch'));
      return;
    }

    setIsLoading(true);
    
    try {
      // TODO: Implementar registre real amb el backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
    } catch (error) {
      Alert.alert(t('common.error'), t('signup.errors.registrationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back action on multiple platforms:
  // - Android / Windows: BackHandler hardware button
  // - Web: browser back (popstate)
  useEffect(() => {
    const onBackPress = () => {
      if (step === 'form') {
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

          {/* Botó per tornar a seleccionar idioma */}
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={() => {
                onBackToLogin();
            }}
          >
            <ArrowLeftIcon width={24} height={24} color="#FFFFFF" />
          </TouchableOpacity>

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
            <Text style={styles.title}>{t('signup.title')}</Text>
            <Text style={styles.subtitle}>{t('signup.subtitle')}</Text>
          </LinearGradient>

          {/* Botó per tornar a seleccionar idioma */}
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={() => {
              setStep('language');
              setSelectedLanguage(null);
            }}
          >
            <ArrowLeftIcon width={24} height={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Formulari de registre */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={t('signup.usernamePlaceholder')}
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={t('signup.emailPlaceholder')}
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
                placeholder={t('signup.passwordPlaceholder')}
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={t('signup.confirmPasswordPlaceholder')}
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!isLoading}
              />
            </View>

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
    marginBottom: 40,
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
    marginBottom: 20,
  },
  backToLoginButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  backToLoginText: {
    color: '#FF8904',
    fontSize: 16,
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
});
