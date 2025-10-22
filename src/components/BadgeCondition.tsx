import React from 'react';
import { ViewStyle } from 'react-native';
import { Badge } from './Badge';

interface Props {
  condition?: string;
  style?: ViewStyle;
  neutral?: boolean;
}

export const BadgeCondition: React.FC<Props> = ({ condition = 'Desconegut', style, neutral = false }) => {
  const c = (condition || '').toLowerCase();

  const colors = ((): { background: string; color: string; borderColor: string } => {
    if (!c) return { background: '#E5E7EB', color: '#374151', borderColor: '#9CA3AF' };
    if (c.includes('bé') || c.includes('bo') || c.includes('good') || c.includes('ok')) {
      return { background: '#A2FFC8', color: '#007931', borderColor: '#30D270' };
    }
    if (c.includes('regular') || c.includes('normal')) {
      return { background: '#e0ebffff', color: '#1a49a1ff', borderColor: '#2d70ecff' };
    }
    if (c.includes('pobre')) {
      return { background: '#FEE2E2', color: '#7A0B0B', borderColor: '#F87171' };
    }
    if (c.includes('excel·lent')) {
      return { background: '#A2FFC8', color: '#007931', borderColor: '#30D270' };
    }
    return { background: '#E5E7EB', color: '#374151', borderColor: '#9CA3AF' };
  })();

  if (neutral) {
    const neutralBg = '#F3F4F6';
    const neutralColor = '#6B7280';
    const neutralBorder = '#D1D5DB';
    const containerStyle = Object.assign({}, (style as any) || {}, { opacity: 0.7 });
    return <Badge text={condition} background={neutralBg} color={neutralColor} borderColor={neutralBorder} containerStyle={containerStyle} />;
  }

  return <Badge text={condition} background={colors.background} color={colors.color} borderColor={colors.borderColor} containerStyle={style} />;
};
