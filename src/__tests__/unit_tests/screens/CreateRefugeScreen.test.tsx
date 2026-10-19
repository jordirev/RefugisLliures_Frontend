/**
 * Tests unitaris per a CreateRefugeScreen
 *
 * Aquest fitxer cobreix:
 * - Renderització de la pantalla
 * - Formulari de creació
 * - Navegació
 * - Submit amb proposta
 * - Snapshot tests
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CreateRefugeScreen } from '../../../screens/CreateRefugeScreen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { findAllByType } from '../../testHelpers/findByType';

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
  RefugeForm: ({ mode, onSubmit, onCancel }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="refuge-form">
        <Text>Mode: {mode}</Text>
        <TouchableOpacity 
          testID="submit-button" 
          onPress={() => onSubmit({ name: 'Test', coord: { lat: 42.5, long: 1.5 } }, 'Comment')}
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
  useCreateRefugeProposal: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    goBack: mockGoBack,
    navigate: jest.fn(),
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = async (component: React.ReactElement) => {
  return await render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('CreateRefugeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  describe('Renderització bàsica', () => {
    it('hauria de renderitzar correctament', async () => {
      const { getByText, getByTestId } = await renderWithProviders(<CreateRefugeScreen />);

      expect(getByText('createRefuge.title')).toBeTruthy();
      expect(getByTestId('refuge-form')).toBeTruthy();
    });

    it('hauria de mostrar el formulari en mode create', async () => {
      const { getByText } = await renderWithProviders(<CreateRefugeScreen />);

      expect(getByText('Mode: create')).toBeTruthy();
    });

    it('snapshot test', async () => {
      const { toJSON } = await renderWithProviders(<CreateRefugeScreen />);
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Navegació', () => {
    it('hauria de tornar enrere quan es prem cancel', async () => {
      const { getByTestId } = await renderWithProviders(<CreateRefugeScreen />);

      const cancelButton = getByTestId('cancel-button');
      await fireEvent.press(cancelButton);

      expect(mockGoBack).toHaveBeenCalled();
    });

    it('hauria de tornar enrere quan es prem el botó back', async () => {
      const { container } = await renderWithProviders(<CreateRefugeScreen />);

      const touchables = findAllByType(container, require('react-native').TouchableOpacity);
      if (touchables.length > 0) {
        await fireEvent.press(touchables[0]);
        expect(mockGoBack).toHaveBeenCalled();
      }
    });
  });

  describe('Submit', () => {
    it('hauria de cridar mutate quan es fa submit', async () => {
      mockMutate.mockImplementation((data, options) => {
        options?.onSuccess?.();
      });

      const { getByTestId } = await renderWithProviders(<CreateRefugeScreen />);

      const submitButton = getByTestId('submit-button');
      await fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: expect.any(Object),
            comment: 'Comment',
          }),
          expect.any(Object)
        );
      });
    });

    it('hauria de tenir callback onError definit', async () => {
      const { getByTestId } = await renderWithProviders(<CreateRefugeScreen />);

      const submitButton = getByTestId('submit-button');
      await fireEvent.press(submitButton);

      // Verificar que mutate s'ha cridat amb callbacks
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
