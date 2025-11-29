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
          colors: { background: '#FEE2E2', color: '#7A0B0B', borderColor: '#F87171' }
        };
      case 1: // normal
        return {
          key: 'refuge.condition.fair',
          colors: { background: '#e0ebffff', color: '#1a49a1ff', borderColor: '#2d70ecff' }
        };
      case 2: // bé
        return {
          key: 'refuge.condition.good',
          colors: { background: '#A2FFC8', color: '#007931', borderColor: '#30D270' }
        };
      case 3: // excel·lent
        return {
          key: 'refuge.condition.excellent',
          colors: { background: '#A2FFC8', color: '#007931', borderColor: '#30D270' }
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
