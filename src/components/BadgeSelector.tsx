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
}

export const BadgeSelector: React.FC<BadgeSelectorProps> = ({
  type,
  value,
  onValueChange,
  style,
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const typeOptions = [
    { value: 'non gardé', label: 'refuge.type.noGuarded' },
    { value: 'cabane ouverte mais ocupee par le berger l ete', label: 'refuge.type.occupiedInSummer' },
    { value: 'fermée', label: 'refuge.type.closed' },
    { value: 'orri', label: 'refuge.type.shelter' },
    { value: 'emergence', label: 'refuge.type.emergency' },
  ];

  const conditionOptions = [
    { value: 0, label: 'refuge.condition.poor' },
    { value: 1, label: 'refuge.condition.fair' },
    { value: 2, label: 'refuge.condition.good' },
    { value: 3, label: 'refuge.condition.excellent' },
  ];

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  const handleSelect = (selectedValue: string | number) => {
    onValueChange(selectedValue);
    setExpanded(false);
  };

  const renderBadge = () => {
    if (type === 'type') {
      return (
        <TouchableOpacity onPress={handleToggle} activeOpacity={0.7}>
          <BadgeType type={value as string || undefined} />
        </TouchableOpacity>
      );
    } else {
      return (
        <TouchableOpacity onPress={handleToggle} activeOpacity={0.7}>
          <BadgeCondition condition={value as number || undefined} />
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
      {expanded && renderOptions()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    // No extra styling needed, BadgeType/BadgeCondition handle their own styling
  },
});
