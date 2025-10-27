import React from 'react';
import { ViewStyle } from 'react-native';
import { Badge } from './Badge';

interface Props {
  type?: number;
  style?: ViewStyle;
  neutral?: boolean;
  // when true, render text in muted (grey) color while keeping background/border
  muted?: boolean;
}

export const BadgeType: React.FC<Props> = ({ type, style, neutral = false, muted = false }) => {
  // Map type number to translation key and display text
  const getTypeInfo = (typeNum: number | undefined): { key: string; color: { background: string; color: string; borderColor: string } } => {
    switch (typeNum) {
      case 0: // noGuarded
        return {
          key: 'refuge.type.noGuarded',
          color: { background: '#D1FAE5', color: '#065F46', borderColor: '#34D399' }
        };
      case 1: // occupiedInSummer
        return {
          key: 'refuge.type.occupiedInSummer',
          color: { background: '#DBEAFE', color: '#1E40AF', borderColor: '#60A5FA' }
        };
      case 2: // closed
        return {
          key: 'refuge.type.closed',
          color: { background: '#FEE2E2', color: '#7A0B0B', borderColor: '#F87171' }
        };
      case 3: // shelter
        return {
          key: 'refuge.type.shelter',
          color: { background: '#F3F4F6', color: '#374151', borderColor: '#9CA3AF' }
        };
      case 4: // emergency
        return {
          key: 'refuge.type.emergency',
          color: { background: '#FEF3C7', color: '#92400E', borderColor: '#F59E42' }
        };
      case 5: // unknown
      default:
        return {
          key: 'refuge.type.unknown',
          color: { background: '#E5E7EB', color: '#6B7280', borderColor: '#9CA3AF' }
        };
    }
  };

  const typeInfo = getTypeInfo(type);
  
  // Import useTranslation
  const { useTranslation } = require('../utils/useTranslation');
  const { t } = useTranslation();
  
  const displayText = t(typeInfo.key);

  // If neutral is requested, force grey-ish colors and slightly reduced opacity
  if (neutral) {
    const neutralBg = '#F3F4F6';
    const neutralColor = '#6B7280';
    const neutralBorder = '#D1D5DB';
    // merge provided style with opacity
    const containerStyle = Object.assign({}, (style as any) || {}, { opacity: 0.7 });
    return <Badge text={displayText} background={neutralBg} color={neutralColor} borderColor={neutralBorder} containerStyle={containerStyle} />;
  }

  // If caller requested muted text (e.g., unselected in FilterPanel), pass a grey textColor
  if (muted) {
    return <Badge text={displayText} background={typeInfo.color.background} color={typeInfo.color.color} borderColor={typeInfo.color.borderColor} containerStyle={style} textColor={'#6B7280'} />;
  }

  return <Badge text={displayText} background={typeInfo.color.background} color={typeInfo.color.color} borderColor={typeInfo.color.borderColor} containerStyle={style} />;
};
