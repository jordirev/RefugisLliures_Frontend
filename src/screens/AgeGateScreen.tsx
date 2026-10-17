import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../contexts/AuthContext';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { CustomAlert } from '../components/CustomAlert';
import { BirthDateInput, BirthDateValue } from '../components/BirthDateInput';
import { buildBirthDate, isUnderMinAge, MIN_AGE } from '../utils/ageUtils';

/**
 * Pantalla bloquejant de confirmació d'edat.
 * AppNavigator la mostra en lloc de l'app quan `backendUser.age_confirmed === false`
 * (usuaris anteriors a la feature i usuaris de Google, que no passen pel wizard de registre).
 * Envia la data de naixement a PATCH /api/users/{uid}/age-confirmation/; el backend només
 * desa la confirmació (no la data). Amb < 16 anys: missatge i tancament de sessió.
 */
export function AgeGateScreen() {
  const { t } = useTranslation();
  const { confirmAge, logout } = useAuth();
  const { alertVisible, alertConfig, showAlert, hideAlert } = useCustomAlert();
  const [birthDate, setBirthDate] = useState<BirthDateValue>({ day: '', month: '', year: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleUnderage = () => {
    showAlert(t('age.underageTitle'), t('age.underageMessage', { age: MIN_AGE }), [
      {
        text: t('common.ok'),
        onPress: () => {
          logout().catch((e) => console.error('Error tancant la sessió:', e));
        },
      },
    ]);
  };

  const handleSubmit = async () => {
    const iso = buildBirthDate(birthDate.day, birthDate.month, birthDate.year);
    if (!iso) {
      setError(t('age.invalidDate'));
      return;
    }
    setError(null);

    if (isUnderMinAge(iso)) {
      handleUnderage();
      return;
    }

    setSubmitting(true);
    try {
      await confirmAge(iso);
    } catch (err: any) {
      if (err?.code === 'underage') {
        handleUnderage();
      } else {
        showAlert(t('common.error'), t('age.confirmError'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t('age.gateTitle')}</Text>
        <Text style={styles.text}>{t('age.gateMessage', { age: MIN_AGE })}</Text>

        <View style={styles.inputBlock}>
          <BirthDateInput value={birthDate} onChange={setBirthDate} editable={!submitting} error={error} testIDPrefix="agegate" />
        </View>

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          testID="agegate-submit"
        >
          {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>{t('common.confirm')}</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logout}
          onPress={() => logout().catch((e) => console.error('Error tancant la sessió:', e))}
          testID="agegate-logout"
        >
          <Text style={styles.logoutText}>{t('age.logout')}</Text>
        </TouchableOpacity>

        <Text style={styles.privacy}>{t('age.privacyNote')}</Text>
      </ScrollView>

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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 24, paddingTop: 48 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 12 },
  text: { fontSize: 15, color: '#374151', marginBottom: 24 },
  inputBlock: { marginBottom: 24 },
  button: { backgroundColor: '#FF6900', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  logout: { marginTop: 16, alignItems: 'center', paddingVertical: 10 },
  logoutText: { color: '#6B7280', fontSize: 14, textDecorationLine: 'underline' },
  privacy: { marginTop: 24, fontSize: 12, color: '#6B7280' },
});
