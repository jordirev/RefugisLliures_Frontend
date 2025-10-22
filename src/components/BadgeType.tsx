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

export const BadgeType: React.FC<Props> = ({ type = 'Desconegut', style, neutral = false, muted = false }) => {
  const t = (type || '').toLowerCase();

  const colors = ((): { background: string; color: string; borderColor: string } => {
    if (!t) return { background: '#E5E7EB', color: '#374151', borderColor: '#9CA3AF' };
    
    if (t.includes('orri')) {
      return { background: '#F3F4F6', color: '#374151', borderColor: '#9CA3AF' };
    }
    if (t.includes('tancat') || t.includes('Fermée') || t.includes('fermee')) {
      return { background: '#FEE2E2', color: '#7A0B0B', borderColor: '#F87171' };
    }
    if (t.includes('ocupat estiu per pastor') || t.includes('berger')) {
      return { background: '#DBEAFE', color: '#1E40AF', borderColor: '#60A5FA' };
    }
    if (t.includes("d'emergencia") || t.includes('emergencia')) {
      return { background: '#FEF3C7', color: '#92400E', borderColor: '#F59E42' };
    }
    if (t.includes('no guardat') || t.includes('non gardé') || t.includes('ouverte')) {
    
      return { background: '#D1FAE5', color: '#065F46', borderColor: '#34D399' };
    }
    return { background: '#E5E7EB', color: '#374151', borderColor: '#9CA3AF' };
  })();

  // If neutral is requested, force grey-ish colors and slightly reduced opacity
  if (neutral) {
    const neutralBg = '#F3F4F6';
    const neutralColor = '#6B7280';
    const neutralBorder = '#D1D5DB';
    // merge provided style with opacity
    const containerStyle = Object.assign({}, (style as any) || {}, { opacity: 0.7 });
    return <Badge text={type} background={neutralBg} color={neutralColor} borderColor={neutralBorder} containerStyle={containerStyle} />;
  }

  // If caller requested muted text (e.g., unselected in FilterPanel), pass a grey textColor
  if (muted) {
    return <Badge text={type} background={colors.background} color={colors.color} borderColor={colors.borderColor} containerStyle={style} textColor={'#6B7280'} />;
  }

  return <Badge text={type} background={colors.background} color={colors.color} borderColor={colors.borderColor} containerStyle={style} />;
};
