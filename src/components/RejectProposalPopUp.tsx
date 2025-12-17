import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../hooks/useTranslation';
import { ProposalCommentInput } from './ProposalCommentInput';

interface RejectProposalPopUpProps {
  visible: boolean;
  proposalId: string;
  refugeName: string;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

export function RejectProposalPopUp({
  visible,
  proposalId,
  refugeName,
  onCancel,
  onConfirm,
}: RejectProposalPopUpProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');

  const isReasonValid = reason.trim().length >= 50;

  const handleConfirm = () => {
    if (!isReasonValid) return;
    onConfirm(reason.trim());
    setReason(''); // Reset reason after confirmation
  };

  const handleCancel = () => {
    setReason(''); // Reset reason on cancel
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleCancel}
        />
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <Text style={styles.title}>{t('proposals.rejectModal.title')}</Text>

            {/* Warning message */}
            <Text style={styles.warningText}>
              {t('proposals.rejectModal.warning', { name: refugeName })}
            </Text>

            {/* Reason input */}
            <View style={styles.inputContainer}>
              <ProposalCommentInput
                mode="delete"
                value={reason}
                onChange={setReason}
                minChars={50}
                maxChars={3000}
                numberOfLines={6}
              />
            </View>

            {/* Buttons */}
            <View style={styles.buttonsContainer}>
              {/* Cancel button */}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>

              {/* Confirm button */}
              <TouchableOpacity 
                onPress={handleConfirm} 
                activeOpacity={0.8}
                disabled={!isReasonValid}
                style={{ flex: 2, opacity: isReasonValid ? 1 : 0.5 }}
              >
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.confirmButton}
                >
                  <Text style={styles.confirmButtonText}>
                    {t('proposals.rejectModal.confirm')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: '80%',
  },
  scrollContent: {
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 15,
    color: '#4B5563',
    marginBottom: 20,
    lineHeight: 22,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 24,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
