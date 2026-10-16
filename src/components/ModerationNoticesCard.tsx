import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from '../hooks/useTranslation';
import { useModerationNotices } from '../hooks/useMediaModerationQuery';
import { REPORTS_CONTACT_EMAIL } from '../config/legal';

/**
 * Avisos de moderació de l'usuari (declaració de motius, art. 17 DSA).
 * Es mostra al perfil només si n'hi ha.
 */
export function ModerationNoticesCard({ uid }: { uid?: string }) {
  const { t } = useTranslation();
  const { data: notices = [] } = useModerationNotices(uid);

  if (!notices || notices.length === 0) return null;

  return (
    <View style={styles.card} testID="moderation-notices">
      <Text style={styles.title}>{t('media.notices.title')}</Text>
      {notices.map((notice) => (
        <View key={notice.id} style={styles.notice}>
          <Text style={styles.action}>
            {t(`media.notices.actions.${notice.action || 'other'}`, { defaultValue: notice.action || '' })}
            {notice.reason ? ` · ${t(`media.report.reasons.${notice.reason}`, { defaultValue: notice.reason })}` : ''}
          </Text>
          {!!notice.statement && <Text style={styles.statement}>{notice.statement}</Text>}
          {!!notice.redress && <Text style={styles.meta}>{notice.redress}</Text>}
          {notice.strikes != null && (
            <Text style={styles.meta}>{t('media.notices.strikes', { count: notice.strikes })}</Text>
          )}
          {!!notice.created_at && <Text style={styles.meta}>{new Date(notice.created_at).toLocaleDateString()}</Text>}
        </View>
      ))}
      <Text style={styles.appeal}>{t('media.notices.appeal', { email: REPORTS_CONTACT_EMAIL })}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  title: { fontSize: 15, fontWeight: '700', color: '#991B1B', marginBottom: 8 },
  notice: { marginBottom: 10 },
  action: { fontSize: 14, fontWeight: '600', color: '#111827' },
  statement: { fontSize: 13, color: '#374151', marginTop: 4 },
  meta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  appeal: { fontSize: 12, color: '#6B7280', marginTop: 4 },
});
