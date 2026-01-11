/**
 * Tests unitaris per a EditRefugeScreen
 *
 * Aquest fitxer cobreix:
 * - Renderització de la pantalla
 * - Formulari d'edició amb dades inicials
 * - Navegació
 * - Submit amb proposta d'actualització
 * - Snapshot tests
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { EditRefugeScreen } from '../../../screens/EditRefugeScreen';
import { Location } from '../../../models';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

// Mock SVG icons
jest.mock('../../../assets/icons/arrow-left.svg', () => 'BackIcon');

// Mock RefugeForm
jest.mock('../../../components/RefugeForm', () => ({
  RefugeForm: ({ mode, initialData, onSubmit, onCancel }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="refuge-form">
        <Text>Mode: {mode}</Text>
        <Text>Initial: {initialData?.name || 'none'}</Text>
        <TouchableOpacity 
          testID="submit-button" 
          onPress={() => onSubmit({ altitude: 2500 }, 'Comentari de l\'edició amb més de cinquanta caràcters per complir la validació')}
        >
          <Text>Submit</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="cancel-button" onPress={onCancel}>
          <Text>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

// Mock useProposalsQuery
const mockMutate = jest.fn();
jest.mock('../../../hooks/useProposalsQuery', () => ({
  useUpdateRefugeProposal: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
const mockCanGoBack = jest.fn().mockReturnValue(true);

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    goBack: mockGoBack,
    navigate: mockNavigate,
    canGoBack: mockCanGoBack,
  }),
  useRoute: () => ({
    params: {
      refuge: {
        id: 'refuge-route',
        name: 'Refugi Route',
        coord: { lat: 42.5, long: 1.5 },
      },
    },
  }),
}));

const mockRefuge: Location = {
  id: 'refuge-1',
  name: 'Test Refuge',
  coord: { lat: 42.5678, long: 1.2345 },
  altitude: 2000,
  places: 20,
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('EditRefugeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  describe('Renderització bàsica', () => {
    it('hauria de renderitzar correctament amb refuge prop', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <EditRefugeScreen refuge={mockRefuge} />
      );

      expect(getByText('editRefuge.title')).toBeTruthy();
      expect(getByTestId('refuge-form')).toBeTruthy();
    });

    it('hauria de mostrar el formulari en mode edit', () => {
      const { getByText } = renderWithProviders(
        <EditRefugeScreen refuge={mockRefuge} />
      );

      expect(getByText('Mode: edit')).toBeTruthy();
    });

    it('hauria de mostrar les dades inicials del refugi', () => {
      const { getByText } = renderWithProviders(
        <EditRefugeScreen refuge={mockRefuge} />
      );

      expect(getByText('Initial: Test Refuge')).toBeTruthy();
    });

    it('hauria d\'usar el refugi del route si no es proporciona prop', () => {
      const { getByText } = renderWithProviders(<EditRefugeScreen />);

      expect(getByText('Initial: Refugi Route')).toBeTruthy();
    });

    it('snapshot test', () => {
      const { toJSON } = renderWithProviders(
        <EditRefugeScreen refuge={mockRefuge} />
      );
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Navegació', () => {
    it('hauria de cridar onCancel prop quan es proporciona', () => {
      const mockOnCancel = jest.fn();
      const { getByTestId } = renderWithProviders(
        <EditRefugeScreen refuge={mockRefuge} onCancel={mockOnCancel} />
      );

      const cancelButton = getByTestId('cancel-button');
      fireEvent.press(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('hauria de tornar enrere quan no hi ha onCancel prop', () => {
      const { getByTestId } = renderWithProviders(
        <EditRefugeScreen refuge={mockRefuge} />
      );

      const cancelButton = getByTestId('cancel-button');
      fireEvent.press(cancelButton);

      expect(mockGoBack).toHaveBeenCalled();
    });

    it('hauria de navegar a RefugeDetails si no pot tornar enrere', () => {
      mockCanGoBack.mockReturnValueOnce(false);

      const { getByTestId } = renderWithProviders(
        <EditRefugeScreen refuge={mockRefuge} />
      );

      const cancelButton = getByTestId('cancel-button');
      fireEvent.press(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith('RefugeDetails', { refugeId: 'refuge-1' });
    });
  });

  describe('Submit', () => {
    it('hauria de cridar mutate amb les dades correctes', async () => {
      mockMutate.mockImplementation((data, options) => {
        options?.onSuccess?.();
      });

      const { getByTestId } = renderWithProviders(
        <EditRefugeScreen refuge={mockRefuge} />
      );

      const submitButton = getByTestId('submit-button');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            refugeId: 'refuge-1',
            payload: expect.any(Object),
            comment: expect.any(String),
          }),
          expect.any(Object)
        );
      });
    });

    it('hauria de tenir callback onError definit', async () => {
      const { getByTestId } = renderWithProviders(
        <EditRefugeScreen refuge={mockRefuge} />
      );

      const submitButton = getByTestId('submit-button');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            onSuccess: expect.any(Function),
            onError: expect.any(Function),
          })
        );
      });
    });
  });
});
