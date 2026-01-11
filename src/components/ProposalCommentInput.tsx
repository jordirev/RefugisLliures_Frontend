import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTranslation } from '../hooks/useTranslation';

type CommentMode = 'create' | 'edit' | 'delete';

interface CommentStrategy {
  isRequired: boolean;
  showMinWarning: boolean;
  getPlaceholder: (t: any) => string;
  getLabel?: (t: any) => string;
}

// Estratègia per a cada mode
const commentStrategies: Record<CommentMode, CommentStrategy> = {
  create: {
    isRequired: false,
    showMinWarning: false,
    getPlaceholder: (t) => t('createRefuge.adminCommentPlaceholder'),
  },
  edit: {
    isRequired: true,
    showMinWarning: true,
    getPlaceholder: (t) => t('editRefuge.adminCommentPlaceholder'),
  },
  delete: {
    isRequired: true,
    showMinWarning: true,
    getPlaceholder: (t) => t('deleteRefuge.commentPlaceholder'),
    getLabel: (t) => t('deleteRefuge.commentLabel'),
  },
};

interface ProposalCommentInputProps {
  mode: CommentMode;
  value: string;
  onChange: (value: string) => void;
  minChars: number;
  maxChars: number;
  error?: string;
  onClearError?: () => void;
  numberOfLines?: number;
  testID?: string;
}

export function ProposalCommentInput({
  mode,
  value,
  onChange,
  minChars,
  maxChars,
  error,
  onClearError,
  numberOfLines = 4,
  testID,
}: ProposalCommentInputProps) {
  const { t } = useTranslation();
  const strategy = commentStrategies[mode];

  const handleChangeText = (text: string) => {
    if (text.length <= maxChars) {
      onChange(text);
      if (error && onClearError) {
        onClearError();
      }
    }
  };

  const showWarning = strategy.showMinWarning && value.length < minChars;
  const placeholder = strategy.getPlaceholder(t);
  const label = strategy.getLabel?.(t);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.textInput, error && styles.textInputError]}
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={numberOfLines}
          textAlignVertical="top"
          maxLength={maxChars}
          testID={testID}
        />
        <Text style={[styles.charCounter, showWarning && styles.charCounterWarning]}>
          {value.length}/{maxChars}
          {showWarning && ` (${t('editRefuge.minChars', { min: minChars })})`}
        </Text>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    position: 'relative',
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    paddingBottom: 40,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 120,
  },
  textInputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  charCounter: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    fontSize: 12,
    color: '#9CA3AF',
    backgroundColor: 'transparent',
  },
  charCounterWarning: {
    color: '#EF4444',
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});
