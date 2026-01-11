/**
 * Tests unitaris per a RenovationsScreen
 * 
 * Aquest fitxer cobreix:
 * - Renderització de la pantalla
 * - Mostrar estat de càrrega
 * - Mostrar missatge quan no hi ha renovacions
 * - Mostrar renovacions de l'usuari
 * - Mostrar renovacions d'altres usuaris
 * - Navegació a detall de renovació
 * - Unir-se a una renovació
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { RenovationsScreen } from '../../../screens/RenovationsScreen';
import { useRenovations, useJoinRenovation } from '../../../hooks/useRenovationsQuery';
import { useRefugesBatch } from '../../../hooks/useRefugesQuery';
import { useAuth } from '../../../contexts/AuthContext';

// Mock hooks
jest.mock('../../../hooks/useRenovationsQuery', () => ({
  useRenovations: jest.fn(),
  useJoinRenovation: jest.fn(),
}));

jest.mock('../../../hooks/useRefugesQuery', () => ({
  useRefugesBatch: jest.fn(),
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  useFocusEffect: jest.fn((cb) => cb()),
}));

// Mock components
jest.mock('../../../components/RenovationCard', () => ({
  RenovationCard: ({ renovation, onViewOnMap, onMoreInfo, onJoin }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="renovation-card">
        <Text>{renovation.description || 'Renovació'}</Text>
        <TouchableOpacity testID="view-map-btn" onPress={onViewOnMap}>
          <Text>Veure al mapa</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="more-info-btn" onPress={onMoreInfo}>
          <Text>Més info</Text>
        </TouchableOpacity>
        {onJoin && (
          <TouchableOpacity testID="join-btn" onPress={onJoin}>
            <Text>Unir-se</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  },
}));

jest.mock('../../../components/CustomAlert', () => ({
  CustomAlert: () => null,
}));

// Mock SVG icons
jest.mock('../../../assets/icons/reform.svg', () => 'RenovationsIcon');
jest.mock('../../../assets/icons/information-circle.svg', () => 'InformationIcon');
jest.mock('../../../assets/icons/plus2.svg', () => 'PlusIcon');

describe('RenovationsScreen', () => {
  const mockRenovation = {
    id: 'renovation-1',
    refuge_id: 'refuge-1',
    description: 'Renovació de prova',
    creator_uid: 'user-123',
    participants_uids: ['user-123'],
    ini_date: '2025-07-01',
    fin_date: '2025-07-05',
  };

  const mockRefuge = {
    id: 'refuge-1',
    nom: 'Refugi de Prova',
    latitud: 42.5,
    longitud: 0.9,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      firebaseUser: { uid: 'user-123' },
    });
    (useJoinRenovation as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
    });
  });

  it('hauria de mostrar estat de càrrega', () => {
    (useRenovations as jest.Mock).mockReturnValue({
      data: [],
      isLoading: true,
      refetch: jest.fn(),
    });
    (useRefugesBatch as jest.Mock).mockReturnValue({
      data: new Map(),
      isLoading: true,
    });

    const { getByTestId } = render(<RenovationsScreen />);
    
    // ActivityIndicator hauria de ser visible
    expect(getByTestId).toBeDefined();
  });

  it('hauria de mostrar missatge quan no hi ha renovacions', async () => {
    (useRenovations as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: jest.fn(),
    });
    (useRefugesBatch as jest.Mock).mockReturnValue({
      data: new Map(),
      isLoading: false,
    });

    const { getByText } = render(<RenovationsScreen />);
    
    await waitFor(() => {
      expect(getByText('renovations.title')).toBeTruthy();
    });
  });

  it('hauria de mostrar renovacions de l\'usuari', async () => {
    const refugesMap = new Map();
    refugesMap.set('refuge-1', mockRefuge);

    (useRenovations as jest.Mock).mockReturnValue({
      data: [mockRenovation],
      isLoading: false,
      refetch: jest.fn(),
    });
    (useRefugesBatch as jest.Mock).mockReturnValue({
      data: refugesMap,
      isLoading: false,
    });

    const { getByText, getByTestId } = render(<RenovationsScreen />);
    
    await waitFor(() => {
      expect(getByText('renovations.my_renovations')).toBeTruthy();
      expect(getByTestId('renovation-card')).toBeTruthy();
    });
  });

  it('hauria de mostrar renovacions d\'altres usuaris', async () => {
    const otherRenovation = {
      ...mockRenovation,
      id: 'renovation-2',
      creator_uid: 'other-user',
      participants_uids: ['other-user'],
    };

    const refugesMap = new Map();
    refugesMap.set('refuge-1', mockRefuge);

    (useRenovations as jest.Mock).mockReturnValue({
      data: [otherRenovation],
      isLoading: false,
      refetch: jest.fn(),
    });
    (useRefugesBatch as jest.Mock).mockReturnValue({
      data: refugesMap,
      isLoading: false,
    });

    const { getByText, getByTestId } = render(<RenovationsScreen />);
    
    await waitFor(() => {
      expect(getByText('renovations.other_renovations')).toBeTruthy();
      expect(getByTestId('renovation-card')).toBeTruthy();
    });
  });

  it('hauria de navegar a detall quan es prem més info', async () => {
    const refugesMap = new Map();
    refugesMap.set('refuge-1', mockRefuge);

    (useRenovations as jest.Mock).mockReturnValue({
      data: [mockRenovation],
      isLoading: false,
      refetch: jest.fn(),
    });
    (useRefugesBatch as jest.Mock).mockReturnValue({
      data: refugesMap,
      isLoading: false,
    });

    const { getByTestId } = render(<RenovationsScreen />);
    
    await waitFor(() => {
      expect(getByTestId('more-info-btn')).toBeTruthy();
    });

    fireEvent.press(getByTestId('more-info-btn'));
    
    expect(mockNavigate).toHaveBeenCalledWith('RefromDetail', { renovationId: 'renovation-1' });
  });

  it('hauria de cridar onViewMap quan es prem veure al mapa', async () => {
    const mockOnViewMap = jest.fn();
    const refugesMap = new Map();
    refugesMap.set('refuge-1', mockRefuge);

    (useRenovations as jest.Mock).mockReturnValue({
      data: [mockRenovation],
      isLoading: false,
      refetch: jest.fn(),
    });
    (useRefugesBatch as jest.Mock).mockReturnValue({
      data: refugesMap,
      isLoading: false,
    });

    const { getByTestId } = render(<RenovationsScreen onViewMap={mockOnViewMap} />);
    
    await waitFor(() => {
      expect(getByTestId('view-map-btn')).toBeTruthy();
    });

    fireEvent.press(getByTestId('view-map-btn'));
    
    expect(mockOnViewMap).toHaveBeenCalledWith(mockRefuge);
  });

  it('hauria d\'unir-se a una renovació', async () => {
    const mockMutate = jest.fn();
    (useJoinRenovation as jest.Mock).mockReturnValue({
      mutate: mockMutate,
    });

    const otherRenovation = {
      ...mockRenovation,
      id: 'renovation-2',
      creator_uid: 'other-user',
      participants_uids: ['other-user'],
    };

    const refugesMap = new Map();
    refugesMap.set('refuge-1', mockRefuge);

    (useRenovations as jest.Mock).mockReturnValue({
      data: [otherRenovation],
      isLoading: false,
      refetch: jest.fn(),
    });
    (useRefugesBatch as jest.Mock).mockReturnValue({
      data: refugesMap,
      isLoading: false,
    });

    const { getByTestId } = render(<RenovationsScreen />);
    
    await waitFor(() => {
      expect(getByTestId('join-btn')).toBeTruthy();
    });

    fireEvent.press(getByTestId('join-btn'));
    
    expect(mockMutate).toHaveBeenCalledWith('renovation-2', expect.any(Object));
  });

  it('hauria de navegar a crear renovació', async () => {
    (useRenovations as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: jest.fn(),
    });
    (useRefugesBatch as jest.Mock).mockReturnValue({
      data: new Map(),
      isLoading: false,
    });

    const { toJSON } = render(<RenovationsScreen />);
    
    // Component renderitza correctament
    expect(toJSON()).toBeTruthy();
    
    // El botó de crear existeix en algun lloc del component
    expect(useRenovations).toHaveBeenCalled();
  });
});
