import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from '../hooks/useTranslation';

interface RightsDeclarationModalProps {
  visible: boolean;
  onAccept: () => void;
  onCancel: () => void;
}

/**
 * Declaració de drets abans de la primera pujada de cada sessió:
 * l'usuari declara que és l'autor (o té permís) i que té el consentiment de les persones
 * que hi surten. No hi ha processament facial (evita dades biomètriques, art. 9 RGPD).
 */
export function RightsDeclarationModal({ visible, onAccept, onCancel }: RightsDeclarationModalProps) {
  const { t } = useTranslation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (visible) setChecked(false);
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.box} testID="rights-declaration-modal">
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>{t('media.rights.title')}</Text>
            <Text style={styles.text}>{t('media.rights.intro')}</Text>
            <Text style={styles.bullet}>• {t('media.rights.authorship')}</Text>
            <Text style={styles.bullet}>• {t('media.rights.peopleConsent')}</Text>
            <Text style={styles.bullet}>• {t('media.rights.noIllegal')}</Text>
            <Text style={styles.note}>{t('media.rights.visibility')}</Text>

            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => setChecked((v) => !v)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              testID="rights-checkbox"
            >
              <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                {checked && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <Text style={styles.checkLabel}>{t('media.rights.checkbox')}</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.buttons}>
            <TouchableOpacity style={[styles.button, styles.cancel]} onPress={onCancel} testID="rights-cancel">
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.accept, !checked && styles.disabled]}
              onPress={onAccept}
              disabled={!checked}
              testID="rights-accept"
            >
              <Text style={styles.acceptText}>{t('media.rights.accept')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  box: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  content: { padding: 20 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 12 },
  text: { fontSize: 14, color: '#374151', marginBottom: 8 },
  bullet: { fontSize: 14, color: '#374151', marginBottom: 6, paddingLeft: 4 },
  note: { fontSize: 12, color: '#6B7280', marginTop: 8 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
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
  checkMark: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  checkLabel: { flex: 1, fontSize: 14, color: '#111827' },
  buttons: { flexDirection: 'row', padding: 16, gap: 12 },
  button: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancel: { backgroundColor: '#F3F4F6' },
  accept: { backgroundColor: '#FF6900' },
  disabled: { opacity: 0.5 },
  cancelText: { color: '#374151', fontWeight: '600' },
  acceptText: { color: '#FFFFFF', fontWeight: '600' },
});
