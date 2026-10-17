import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from '../hooks/useTranslation';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { CustomAlert } from '../components/CustomAlert';
import { useReportMedia } from '../hooks/useMediaModerationQuery';
import { MediaReportReason } from '../models';
import {
  MEDIA_REPORT_REASON_GROUPS,
  MEDIA_REPORT_DETAILS_MAX,
  validateMediaReport,
} from '../utils/mediaReportReasons';
import { REPORTS_CONTACT_EMAIL } from '../config/legal';

import BackIcon from '../assets/icons/arrow-left.svg';

export type ReportMediaRouteParams = {
  refugeId: string;
  mediaKey: string;
};

/**
 * Pantalla de denúncia d'un mitjà (notificació i retirada, DSA art. 16).
 * S'hi arriba des del menú ⋮ del visor de fotos (ruta de pila `ReportMedia`).
 */
export function ReportMediaScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { alertVisible, alertConfig, showAlert, hideAlert } = useCustomAlert();
  const reportMutation = useReportMedia();

  const { refugeId, mediaKey } = (route?.params || {}) as Partial<ReportMediaRouteParams>;

  const [reason, setReason] = useState<MediaReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [goodFaith, setGoodFaith] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const HEADER_HEIGHT = 96;

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleSubmit = () => {
    const error = validateMediaReport({ reason, details, goodFaith });
    setValidationError(error);
    if (error || !reason) return;

    if (!refugeId || !mediaKey) {
      showAlert(t('common.error'), t('media.report.errors.generic'));
      return;
    }

    reportMutation.mutate(
      { refugeId, mediaKey, reason, details: details.trim() || undefined },
      {
        onSuccess: () => {
          showAlert(
            t('media.report.successTitle'),
            t('media.report.successMessage', { email: REPORTS_CONTACT_EMAIL }),
            [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
          );
        },
        onError: (err: any) => {
          const code = err?.code;
          let key = 'media.report.errors.generic';
          if (code === 'own_media') key = 'media.report.errors.ownMedia';
          else if (code === 'already_reported') key = 'media.report.errors.alreadyReported';
          else if (code === 'user_blocked') key = 'media.errors.userBlocked';
          else if (code === 'age_not_confirmed') key = 'media.errors.ageNotConfirmed';
          else if (code === 'not_found') key = 'media.report.errors.notFound';
          showAlert(t('common.error'), t(key));
        },
      }
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.headerFixed}>
        <SafeAreaView edges={['top']} style={styles.safeArea} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack} testID="report-back">
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.title}>{t('media.report.title')}</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingTop: HEADER_HEIGHT + 16, paddingBottom: Math.max(insets.bottom, 16) + 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Text style={styles.intro}>{t('media.report.intro')}</Text>

            {MEDIA_REPORT_REASON_GROUPS.map((group) => (
              <View key={group.id} style={styles.group}>
                <Text style={styles.groupTitle}>{t(`media.report.groups.${group.id}`)}</Text>
                {group.reasons.map((r) => {
                  const selected = reason === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[styles.reasonRow, selected && styles.reasonRowSelected]}
                      onPress={() => {
                        setReason(r);
                        setValidationError(null);
                      }}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      testID={`report-reason-${r}`}
                    >
                      <View style={[styles.radio, selected && styles.radioSelected]}>
                        {selected && <View style={styles.radioDot} />}
                      </View>
                      <Text style={styles.reasonText}>{t(`media.report.reasons.${r}`)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            <Text style={styles.label}>
              {reason === 'other' ? t('media.report.detailsRequiredLabel') : t('media.report.detailsLabel')}
            </Text>
            <TextInput
              style={styles.detailsInput}
              value={details}
              onChangeText={setDetails}
              multiline
              maxLength={MEDIA_REPORT_DETAILS_MAX}
              placeholder={t('media.report.detailsPlaceholder')}
              placeholderTextColor="#9CA3AF"
              testID="report-details"
            />
            <Text style={styles.counter}>
              {details.length} / {MEDIA_REPORT_DETAILS_MAX}
            </Text>

            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => {
                setGoodFaith((v) => !v);
                setValidationError(null);
              }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: goodFaith }}
              testID="report-good-faith"
            >
              <View style={[styles.checkbox, goodFaith && styles.checkboxChecked]}>
                {goodFaith && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <Text style={styles.checkLabel}>{t('media.report.goodFaith')}</Text>
            </TouchableOpacity>

            {validationError && (
              <Text style={styles.error} testID="report-validation-error">
                {t(validationError)}
              </Text>
            )}

            <TouchableOpacity
              style={[styles.submit, reportMutation.isPending && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={reportMutation.isPending}
              testID="report-submit"
            >
              {reportMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitText}>{t('media.report.submit')}</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.footnote}>{t('media.report.footnote', { email: REPORTS_CONTACT_EMAIL })}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {alertConfig && (
        <CustomAlert
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onDismiss={hideAlert}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  headerFixed: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: '#fff' },
  safeArea: { backgroundColor: '#fff' },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1.2,
    borderBottomColor: '#e3e4e5ff',
    flexDirection: 'row',
    gap: 24,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', marginLeft: -8 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827', flexShrink: 1 },
  content: { paddingHorizontal: 20 },
  intro: { fontSize: 14, color: '#374151', marginBottom: 16 },
  group: { marginBottom: 12 },
  groupTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', marginBottom: 6 },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 6,
  },
  reasonRowSelected: { borderColor: '#FF6900', backgroundColor: '#FFF7ED' },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: { borderColor: '#FF6900' },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF6900' },
  reasonText: { flex: 1, fontSize: 14, color: '#111827' },
  label: { fontSize: 14, fontWeight: '600', color: '#111827', marginTop: 12, marginBottom: 6 },
  detailsInput: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#111827',
  },
  counter: { alignSelf: 'flex-end', fontSize: 12, color: '#6B7280', marginTop: 4 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 16 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FF6900',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: '#FF6900' },
  checkMark: { color: '#FFFFFF', fontWeight: '700' },
  checkLabel: { flex: 1, fontSize: 13, color: '#374151' },
  error: { color: '#DC2626', marginTop: 12, fontSize: 13 },
  submit: {
    marginTop: 20,
    backgroundColor: '#FF6900',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  footnote: { fontSize: 12, color: '#6B7280', marginTop: 16 },
});
