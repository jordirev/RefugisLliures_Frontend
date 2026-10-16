import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from '../hooks/useTranslation';
import { useCustomAlert } from '../hooks/useCustomAlert';
import { CustomAlert } from '../components/CustomAlert';
import { MediaImage, isVideoMedia } from '../components/MediaImage';
import { useMediaReports, useResolveMediaReport } from '../hooks/useMediaModerationQuery';
import { MediaReport, MediaReportAction } from '../models';

import BackIcon from '../assets/icons/arrow-left.svg';

type StatusFilter = 'pending' | 'resolved';

const ACTIONS: MediaReportAction[] = ['dismiss', 'remove', 'remove_and_strike'];

/**
 * Pantalla d'admin per revisar denúncies de mitjans.
 * S'hi arriba des de Configuració (només admins), igual que la gestió de propostes.
 * El backend és qui autoritza (IsAdmin); aquí només es mostra.
 */
export function MediaReportsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { alertVisible, alertConfig, showAlert, hideAlert } = useCustomAlert();
  const [status, setStatus] = useState<StatusFilter>('pending');
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<MediaReportAction | null>(null);
  const [statement, setStatement] = useState('');

  const { data: reports = [], isLoading, isError, refetch, isRefetching } = useMediaReports(status);
  const resolveMutation = useResolveMediaReport();

  const HEADER_HEIGHT = 96;

  const resetPanel = () => {
    setActiveReportId(null);
    setSelectedAction(null);
    setStatement('');
  };

  const handleSubmitAction = (report: MediaReport) => {
    if (!selectedAction) return;
    if (!statement.trim()) {
      showAlert(t('common.error'), t('media.admin.statementRequired'));
      return;
    }
    resolveMutation.mutate(
      {
        reportId: report.id,
        action: selectedAction,
        statement: statement.trim(),
        refugeId: report.refuge_id,
        creatorUid: report.media_creator_uid,
      },
      {
        onSuccess: () => {
          resetPanel();
          showAlert(t('common.success'), t('media.admin.resolved'));
        },
        onError: () => {
          showAlert(t('common.error'), t('media.admin.resolveError'));
        },
      }
    );
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
  };

  const renderReport = (report: MediaReport) => {
    const isActive = activeReportId === report.id;
    return (
      <View key={report.id} style={styles.card} testID={`media-report-${report.id}`}>
        <View style={styles.cardRow}>
          {report.media ? (
            <View>
              <MediaImage media={report.media} variant="thumb" style={styles.preview} />
              {isVideoMedia(report.media) && <Text style={styles.videoBadge}>▶</Text>}
            </View>
          ) : (
            <View style={[styles.preview, styles.previewPlaceholder]}>
              <Text style={styles.previewPlaceholderText}>?</Text>
            </View>
          )}
          <View style={styles.cardInfo}>
            <Text style={styles.reason}>{t(`media.report.reasons.${report.reason}`, { defaultValue: report.reason })}</Text>
            {!!report.priority && <Text style={styles.priority}>{t('media.admin.priority', { priority: report.priority })}</Text>}
            {report.reports_count != null && (
              <Text style={styles.meta}>{t('media.admin.reportsCount', { count: report.reports_count })}</Text>
            )}
            <Text style={styles.meta}>{formatDate(report.created_at)}</Text>
            <Text style={styles.metaSmall} numberOfLines={1}>
              {report.media_key}
            </Text>
          </View>
        </View>

        {!!report.details && <Text style={styles.details}>{report.details}</Text>}

        {status === 'resolved' && (
          <View style={styles.resolution}>
            {!!report.resolution_action && (
              <Text style={styles.meta}>
                {t('media.admin.resolutionAction')}: {t(`media.admin.actions.${report.resolution_action}`, { defaultValue: report.resolution_action })}
              </Text>
            )}
            {!!report.statement && <Text style={styles.details}>{report.statement}</Text>}
          </View>
        )}

        {status === 'pending' && (
          <View style={styles.actionsRow}>
            {ACTIONS.map((action) => {
              const selected = isActive && selectedAction === action;
              return (
                <TouchableOpacity
                  key={action}
                  style={[styles.actionChip, action !== 'dismiss' && styles.actionChipDanger, selected && styles.actionChipSelected]}
                  onPress={() => {
                    setActiveReportId(report.id);
                    setSelectedAction(action);
                  }}
                  testID={`media-report-${report.id}-action-${action}`}
                >
                  <Text style={[styles.actionChipText, selected && styles.actionChipTextSelected]}>
                    {t(`media.admin.actions.${action}`)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {status === 'pending' && isActive && selectedAction && (
          <View style={styles.panel}>
            <Text style={styles.label}>{t('media.admin.statementLabel')}</Text>
            <TextInput
              style={styles.statementInput}
              value={statement}
              onChangeText={setStatement}
              multiline
              maxLength={2000}
              placeholder={t('media.admin.statementPlaceholder')}
              placeholderTextColor="#9CA3AF"
              testID="media-report-statement"
            />
            <View style={styles.panelButtons}>
              <TouchableOpacity style={[styles.panelButton, styles.panelCancel]} onPress={resetPanel}>
                <Text style={styles.panelCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.panelButton, styles.panelConfirm, (!statement.trim() || resolveMutation.isPending) && styles.disabled]}
                onPress={() => handleSubmitAction(report)}
                disabled={!statement.trim() || resolveMutation.isPending}
                testID="media-report-confirm"
              >
                {resolveMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.panelConfirmText}>{t('common.confirm')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.headerFixed}>
        <SafeAreaView edges={['top']} style={styles.safeArea} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.title}>{t('media.admin.title')}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT + 12, paddingBottom: Math.max(insets.bottom, 16) + 16 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
      >
        <View style={styles.tabs}>
          {(['pending', 'resolved'] as StatusFilter[]).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.tab, status === s && styles.tabActive]}
              onPress={() => {
                setStatus(s);
                resetPanel();
              }}
              testID={`media-reports-tab-${s}`}
            >
              <Text style={[styles.tabText, status === s && styles.tabTextActive]}>{t(`media.admin.status.${s}`)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.list}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#FF6900" style={{ marginTop: 40 }} />
          ) : isError ? (
            <Text style={styles.empty}>{t('media.admin.loadError')}</Text>
          ) : reports.length === 0 ? (
            <Text style={styles.empty}>{t('media.admin.empty')}</Text>
          ) : (
            reports.map(renderReport)
          )}
        </View>
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
  tabs: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center' },
  tabActive: { backgroundColor: '#FF6900' },
  tabText: { color: '#374151', fontWeight: '600' },
  tabTextActive: { color: '#FFFFFF' },
  list: { paddingHorizontal: 16 },
  empty: { textAlign: 'center', color: '#6B7280', marginTop: 40 },
  card: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, marginBottom: 12 },
  cardRow: { flexDirection: 'row' },
  preview: { width: 88, height: 88, borderRadius: 8, backgroundColor: '#E5E7EB' },
  previewPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  previewPlaceholderText: { color: '#6B7280', fontSize: 24 },
  videoBadge: { position: 'absolute', bottom: 4, left: 6, color: '#FFFFFF', fontSize: 16 },
  cardInfo: { flex: 1, marginLeft: 12 },
  reason: { fontSize: 15, fontWeight: '700', color: '#111827' },
  priority: { fontSize: 12, color: '#DC2626', fontWeight: '700', marginTop: 2 },
  meta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  metaSmall: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  details: { fontSize: 13, color: '#374151', marginTop: 8 },
  resolution: { marginTop: 8 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  actionChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: '#D1D5DB' },
  actionChipDanger: { borderColor: '#FCA5A5' },
  actionChipSelected: { backgroundColor: '#FF6900', borderColor: '#FF6900' },
  actionChipText: { fontSize: 13, color: '#111827' },
  actionChipTextSelected: { color: '#FFFFFF' },
  panel: { marginTop: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 6 },
  statementInput: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    textAlignVertical: 'top',
    color: '#111827',
  },
  panelButtons: { flexDirection: 'row', gap: 8, marginTop: 10 },
  panelButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  panelCancel: { backgroundColor: '#F3F4F6' },
  panelCancelText: { color: '#374151', fontWeight: '600' },
  panelConfirm: { backgroundColor: '#FF6900' },
  panelConfirmText: { color: '#FFFFFF', fontWeight: '700' },
  disabled: { opacity: 0.5 },
});
