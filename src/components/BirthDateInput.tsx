import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTranslation } from '../hooks/useTranslation';

export interface BirthDateValue {
  day: string;
  month: string;
  year: string;
}

interface BirthDateInputProps {
  value: BirthDateValue;
  onChange: (value: BirthDateValue) => void;
  editable?: boolean;
  error?: string | null;
  testIDPrefix?: string;
}

/**
 * Entrada de data de naixement amb tres camps numèrics validats (DD / MM / AAAA).
 * Sense dependències natives de selector de dates.
 */
export function BirthDateInput({ value, onChange, editable = true, error, testIDPrefix = 'birthdate' }: BirthDateInputProps) {
  const { t } = useTranslation();
  const onlyDigits = (text: string, max: number) => text.replace(/[^0-9]/g, '').slice(0, max);

  return (
    <View>
      <Text style={styles.label}>{t('age.birthDateLabel')}</Text>
      <View style={styles.row}>
        <TextInput
          testID={`${testIDPrefix}-day`}
          style={[styles.input, styles.small]}
          placeholder={t('age.dayPlaceholder')}
          placeholderTextColor="#999"
          keyboardType="number-pad"
          maxLength={2}
          value={value.day}
          editable={editable}
          onChangeText={(text) => onChange({ ...value, day: onlyDigits(text, 2) })}
          accessibilityLabel={t('age.dayPlaceholder')}
        />
        <Text style={styles.separator}>/</Text>
        <TextInput
          testID={`${testIDPrefix}-month`}
          style={[styles.input, styles.small]}
          placeholder={t('age.monthPlaceholder')}
          placeholderTextColor="#999"
          keyboardType="number-pad"
          maxLength={2}
          value={value.month}
          editable={editable}
          onChangeText={(text) => onChange({ ...value, month: onlyDigits(text, 2) })}
          accessibilityLabel={t('age.monthPlaceholder')}
        />
        <Text style={styles.separator}>/</Text>
        <TextInput
          testID={`${testIDPrefix}-year`}
          style={[styles.input, styles.large]}
          placeholder={t('age.yearPlaceholder')}
          placeholderTextColor="#999"
          keyboardType="number-pad"
          maxLength={4}
          value={value.year}
          editable={editable}
          onChangeText={(text) => onChange({ ...value, year: onlyDigits(text, 4) })}
          accessibilityLabel={t('age.yearPlaceholder')}
        />
      </View>
      <Text style={styles.hint}>{t('age.birthDateHint')}</Text>
      {error ? (
        <Text style={styles.error} testID={`${testIDPrefix}-error`}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    textAlign: 'center',
  },
  small: { width: 64 },
  large: { width: 96 },
  separator: { marginHorizontal: 8, fontSize: 18, color: '#6B7280' },
  hint: { fontSize: 12, color: '#6B7280', marginTop: 6 },
  error: { fontSize: 13, color: 'red', marginTop: 6 },
});
