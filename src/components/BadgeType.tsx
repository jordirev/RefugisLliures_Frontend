import React from 'react';
import { ViewStyle } from 'react-native';
import { Badge } from './Badge';

interface Props {
  type?: string;
  style?: ViewStyle;
  neutral?: boolean;
  // when true, render text in muted (grey) color while keeping background/border
  muted?: boolean;
}

export const BadgeType: React.FC<Props> = ({ type, style, neutral = false, muted = false }) => {
  // Map type string to translation key and display text
  const getTypeInfo = (typeStr: string | undefined): { key: string; color: { background: string; color: string; borderColor: string } } => {
    switch (typeStr) {
      case "cabane ouverte mais ocupee par le berger l ete": // occupiedInSummer
        return {
          key: 'refuge.type.occupiedInSummer',
          color: { background: '#DBEAFE', color: '#1E40AF', borderColor: '#60A5FA' }
        };
      case "fermée": // closed
        return {
          key: 'refuge.type.closed',
          color: { background: '#FEE2E2', color: '#7A0B0B', borderColor: '#F87171' }
        };
      case "orri": // shelter
        return {
          key: 'refuge.type.shelter',
          color: { background: '#F3F4F6', color: '#374151', borderColor: '#9CA3AF' }
        };
      case "emergence": // emergency
        return {
          key: 'refuge.type.emergency',
          color: { background: '#FEF3C7', color: '#92400E', borderColor: '#F59E42' }
        };
      default: // including "non gardé" (noGuarded) and unknown types
        return {
          key: 'refuge.type.noGuarded',
          color: { background: '#D1FAE5', color: '#065F46', borderColor: '#34D399' }
        };
    }
  };

  const typeInfo = getTypeInfo(type);
  
  // Import useTranslation
  const { useTranslation } = require('../hooks/useTranslation');
  const { t } = useTranslation();
  
  const displayText = t(typeInfo.key);

  // If neutral is requested, force grey-ish colors and slightly reduced opacity
  if (neutral) {
    const neutralBg = '#F3F4F6';
    const neutralColor = '#6B7280';
    const neutralBorder = '#D1D5DB';
    // merge provided style with opacity
    const containerStyle = Object.assign({}, (style as any) || {}, { opacity: 0.7 });
    return <Badge text={displayText} background={neutralBg} color={neutralColor} borderColor={neutralBorder} containerStyle={containerStyle} testID="badge-container" />;
  }

  // If caller requested muted text (e.g., unselected in FilterPanel), pass a grey textColor
  if (muted) {
    return <Badge text={displayText} background={typeInfo.color.background} color={typeInfo.color.color} borderColor={typeInfo.color.borderColor} containerStyle={style} textColor={'#6B7280'} testID="badge-container" />;
  }

  return <Badge text={displayText} background={typeInfo.color.background} color={typeInfo.color.color} borderColor={typeInfo.color.borderColor} containerStyle={style} testID="badge-container" />;
};
