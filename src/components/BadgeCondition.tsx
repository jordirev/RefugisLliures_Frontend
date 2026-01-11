import React from 'react';
import { ViewStyle } from 'react-native';
import { Badge } from './Badge';

interface Props {
  condition?: number;
  style?: ViewStyle;
  neutral?: boolean;
  // when true, render text in muted (grey) color while keeping background/border
  muted?: boolean;
}

export const BadgeCondition: React.FC<Props> = ({ condition, style, neutral = false, muted = false }) => {
  // Import useTranslation
  const { useTranslation } = require('../hooks/useTranslation');
  const { t } = useTranslation();

  const getConditionInfo = (condNum: number | undefined): { key: string; colors: { background: string; color: string; borderColor: string } } => {
    switch (condNum) {
      case 0: // pobre
        return {
          key: 'refuge.condition.poor',
          // pastel red
          colors: { background: '#FDE8E8', color: '#9B1F1F', borderColor: '#F4A6A6' }
        };
      case 1: // correcte
        return {
          key: 'refuge.condition.fair',
          // pastel blue
          colors: { background: '#EAF4FF', color: '#3A5B99', borderColor: '#A3C4FF' }
        };
      case 2: // bé
        return {
          key: 'refuge.condition.good',
          // pastel green
          colors: { background: '#E6F8EE', color: '#14532D', borderColor: '#7EE0B0'  }
        };
      case 3: // excel·lent
        return {
          key: 'refuge.condition.excellent',
          // pastel yellow/gold
          colors: { background: '#FFF6E0', color: '#8B4B18', borderColor: '#F7C67A' }
        };
      default:
        return {
          key: 'refuge.condition.unknown',
          colors: { background: '#E5E7EB', color: '#374151', borderColor: '#9CA3AF' }
        };
    }
  };

  const conditionInfo = getConditionInfo(condition);
  const displayText = t(conditionInfo.key);
  const colors = conditionInfo.colors;

  if (neutral) {
    const neutralBg = '#F3F4F6';
    const neutralColor = '#6B7280';
    const neutralBorder = '#D1D5DB';
    const containerStyle = Object.assign({}, (style as any) || {}, { opacity: 0.7 });
    return <Badge text={displayText} background={neutralBg} color={neutralColor} borderColor={neutralBorder} containerStyle={containerStyle} testID="badge-container" />;
  }

  if (muted) {
    return <Badge text={displayText} background={colors.background} color={colors.color} borderColor={colors.borderColor} containerStyle={style} textColor={'#6B7280'} testID="badge-container" />;
  }

  return <Badge text={displayText} background={colors.background} color={colors.color} borderColor={colors.borderColor} containerStyle={style} testID="badge-container" />;
};
