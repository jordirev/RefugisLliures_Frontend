import React from 'react';
import { Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTranslation } from '../hooks/useTranslation';

interface FieldResetButtonProps {
  /** Només es mostra si el camp s'ha modificat respecte al valor original */
  visible: boolean;
  onPress: () => void;
  testID: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Botó petit per tornar un camp del formulari d'edició al valor original del refugi.
 */
export const FieldResetButton: React.FC<FieldResetButtonProps> = ({ visible, onPress, testID, style }) => {
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={t('editRefuge.restoreOriginal')}
      style={[styles.button, style]}
    >
      <Text style={styles.icon}>↺</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFEDD5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 14,
    lineHeight: 16,
    color: '#FF6900',
    fontWeight: '700',
  },
});
