import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useTranslation } from '../hooks/useTranslation';
import { BadgeType } from './BadgeType';
import { BadgeCondition } from './BadgeCondition';

interface BadgeSelectorProps {
  type: 'type' | 'condition';
  value?: string | number;
  onValueChange: (value: string | number) => void;
  style?: ViewStyle;
  expanded?: boolean;
  onToggle?: () => void;
  renderOptionsExternal?: boolean;
}

export const getTypeOptions = () => [
  { value: 'non gardé', label: 'refuge.type.noGuarded' },
  { value: 'cabane ouverte mais ocupee par le berger l ete', label: 'refuge.type.occupiedInSummer' },
  { value: 'fermée', label: 'refuge.type.closed' },
  { value: 'orri', label: 'refuge.type.shelter' },
  { value: 'emergence', label: 'refuge.type.emergency' },
];

export const getConditionOptions = () => [
  { value: 0, label: 'refuge.condition.poor' },
  { value: 1, label: 'refuge.condition.fair' },
  { value: 2, label: 'refuge.condition.good' },
  { value: 3, label: 'refuge.condition.excellent' },
];

export const BadgeSelector: React.FC<BadgeSelectorProps> = ({
  type,
  value,
  onValueChange,
  style,
  expanded: externalExpanded,
  onToggle: externalOnToggle,
  renderOptionsExternal = false,
}) => {
  const { t } = useTranslation();
  const [internalExpanded, setInternalExpanded] = useState(false);
  const expanded = externalExpanded !== undefined ? externalExpanded : internalExpanded;

  const typeOptions = getTypeOptions();
  const conditionOptions = getConditionOptions();

  const handleToggle = () => {
    if (externalOnToggle) {
      externalOnToggle();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  const handleSelect = (selectedValue: string | number) => {
    onValueChange(selectedValue);
    if (externalOnToggle) {
      externalOnToggle(); // Tanquem el selector
    } else {
      setInternalExpanded(false);
    }
  };

  const renderBadge = () => {
    if (type === 'type') {
      return (
        <TouchableOpacity onPress={handleToggle} activeOpacity={0.7}>
          <BadgeType type={typeof value === 'string' ? (value as string) : undefined} />
        </TouchableOpacity>
      );
    } else {
      return (
        <TouchableOpacity onPress={handleToggle} activeOpacity={0.7}>
          <BadgeCondition condition={typeof value === 'number' ? (value as number) : undefined} />
        </TouchableOpacity>
      );
    }
  };

  const renderOptions = () => {
    const options = type === 'type' ? typeOptions : conditionOptions;
    
    return (
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={String(option.value)}
            onPress={() => handleSelect(option.value)}
            activeOpacity={0.7}
            style={styles.optionButton}
          >
            {type === 'type' ? (
              <BadgeType type={option.value as string} />
            ) : (
              <BadgeCondition condition={option.value as number} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {renderBadge()}
      {expanded && !renderOptionsExternal && renderOptions()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // El badge es renderitza tal qual
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  optionButton: {
    // No extra styling needed, BadgeType/BadgeCondition handle their own styling
  },
});
