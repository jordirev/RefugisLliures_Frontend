import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '../hooks/useTranslation';

interface DeleteRefugePopUpProps {
  visible: boolean;
  refugeName: string;
  onCancel: () => void;
  onConfirm: (comment: string) => void;
}

export function DeleteRefugePopUp({
  visible,
  refugeName,
  onCancel,
  onConfirm,
}: DeleteRefugePopUpProps) {
  const { t } = useTranslation();
  const [comment, setComment] = useState('');

  const isCommentValid = comment.trim().length >= 100;

  const handleConfirm = () => {
    if (!isCommentValid) return;
    onConfirm(comment.trim());
    setComment(''); // Reset comment after confirmation
  };

  const handleCancel = () => {
    setComment(''); // Reset comment on cancel
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
            <Text style={styles.title}>{t('deleteRefuge.title')}</Text>

            {/* Warning message */}
            <Text style={styles.warningText}>
              {t('deleteRefuge.warning', { name: refugeName })}
            </Text>

            {/* Comment input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('deleteRefuge.commentLabel')}</Text>
              <TextInput
                style={styles.textInput}
                value={comment}
                onChangeText={(text) => {
                  if (text.length <= 3000) {
                    setComment(text);
                  }
                }}
                placeholder={t('deleteRefuge.commentPlaceholder')}
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={3000}
              />
              <Text style={[
                styles.charCounter,
                comment.length < 100 && styles.charCounterWarning,
              ]}>
                {comment.length}/3000 {comment.length < 100 && t('deleteRefuge.minChars', { min: 100 })}
              </Text>
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
                disabled={!isCommentValid}
                style={{ flex: 1, opacity: isCommentValid ? 1 : 0.5 }}
              >
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.confirmButton}
                >
                  <Text style={styles.confirmButtonText}>
                    {t('deleteRefuge.confirm')}
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCounter: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
    textAlign: 'right',
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
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  charCounterWarning: {
    color: '#EF4444',
    fontWeight: '600',
  },
});
