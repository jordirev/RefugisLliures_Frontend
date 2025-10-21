import React from 'react';
import { ViewStyle } from 'react-native';
import { Badge } from './Badge';

interface Props {
  type?: string;
  style?: ViewStyle;
}

export const BadgeType: React.FC<Props> = ({ type = 'Desconegut', style }) => {
  const t = (type || '').toLowerCase();

  const colors = ((): { background: string; color: string; borderColor: string } => {
    if (!t) return { background: '#E5E7EB', color: '#374151', borderColor: '#9CA3AF' };
    if (t.includes('no guardat') || t.includes('non gardé') || t.includes('ouverte')) {
      return { background: '#F3F4F6', color: '#374151', borderColor: '#9CA3AF' };
    }
    if (t.includes('tancat') || t.includes('Fermée') || t.includes('fermee')) {
      return { background: '#FEE2E2', color: '#7A0B0B', borderColor: '#F87171' };
    }
    if (t.includes('orri')) {
      return { background: '#DBEAFE', color: '#1E40AF', borderColor: '#60A5FA' };
    }
    if (t.includes("d'emergencia") || t.includes('emergencia')) {
      return { background: '#FEF3C7', color: '#92400E', borderColor: '#F59E42' };
    }
    if (t.includes('ocupat estiu per pastor') || t.includes('berger')) {
      return { background: '#D1FAE5', color: '#065F46', borderColor: '#34D399' };
    }
    return { background: '#E5E7EB', color: '#374151', borderColor: '#9CA3AF' };
  })();

  return <Badge text={type} background={colors.background} color={colors.color} borderColor={colors.borderColor} containerStyle={style} />;
};
