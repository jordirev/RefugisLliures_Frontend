import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from '../hooks/useTranslation';
import { BadgeCondition } from './BadgeCondition';
import { getConditionOptions } from './BadgeSelector';

interface ExperienceConditionPickerProps {
  /** Valor seleccionat (0-3) o undefined si encara no s'ha triat */
  value?: number;
  onChange: (value: number) => void;
  /** Mostra el missatge de validació (valor obligatori) quan no hi ha selecció */
  showRequiredHint?: boolean;
  disabled?: boolean;
}

/**
 * Selector de l'estat del refugi (0-3) per a les experiències.
 * És obligatori en crear una experiència, així que no hi ha cap valor per defecte.
 */
export const ExperienceConditionPicker: React.FC<ExperienceConditionPickerProps> = ({
  value,
  onChange,
  showRequiredHint = true,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const options = getConditionOptions();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('experiences.condition.label')}</Text>
      <View style={styles.optionsRow}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              testID={`experience-condition-${option.value}`}
              onPress={() => onChange(option.value)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={[styles.option, selected && styles.optionSelected]}
            >
              <BadgeCondition condition={option.value} neutral={value !== undefined && !selected} />
            </TouchableOpacity>
          );
        })}
      </View>
      {showRequiredHint && value === undefined && (
        <Text style={styles.requiredHint} testID="experience-condition-required">
          {t('experiences.condition.required')}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 6,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 1,
  },
  optionSelected: {
    borderColor: '#FF6900',
  },
  requiredHint: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
  },
});
