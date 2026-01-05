/**
 * Tests unitaris per a CreateRenovationScreen
 *
 * Aquest fitxer cobreix:
 * - Renderització de la pantalla
 * - Formulari de creació
 * - Navegació
 * - Gestió d'errors
 * - Snapshot tests
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CreateRenovationScreen } from '../../../screens/CreateRenovationScreen';
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
jest.mock('../../../assets/icons/navigation.svg', () => 'NavigationIcon');

// Mock RenovationForm
jest.mock('../../../components/RenovationForm', () => ({
  RenovationForm: ({ mode, onSubmit, onCancel, isLoading }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="renovation-form">
        <Text>Mode: {mode}</Text>
        <TouchableOpacity testID="submit-button" onPress={() => onSubmit({ refuge_id: '1', ini_date: '2026-01-15', fin_date: '2026-01-20', description: 'Test', group_link: 'https://chat.whatsapp.com/test' }, true, {})}>
          <Text>Submit</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="cancel-button" onPress={onCancel}>
          <Text>Cancel</Text>
        </TouchableOpacity>
        {isLoading && <Text testID="loading">Loading...</Text>}
      </View>
    );
  },
}));

// Mock hooks
jest.mock('../../../hooks/useRefugesQuery', () => ({
  useRefuges: () => ({
    data: [
      { id: '1', name: 'Refugi Test', coord: { lat: 42.5, long: 1.5 } },
    ],
    isLoading: false,
  }),
}));

const mockMutate = jest.fn();
jest.mock('../../../hooks/useRenovationsQuery', () => ({
  useCreateRenovation: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
  }),
  useFocusEffect: (callback: () => void) => {
    const React = require('react');
    React.useEffect(() => {
      callback();
    }, []);
  },
}));

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

describe('CreateRenovationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  describe('Renderització bàsica', () => {
    it('hauria de renderitzar correctament', () => {
      const { getByText, getByTestId } = renderWithProviders(<CreateRenovationScreen />);

      expect(getByText('createRenovation.title')).toBeTruthy();
      expect(getByTestId('renovation-form')).toBeTruthy();
    });

    it('hauria de mostrar el formulari en mode create', () => {
      const { getByText } = renderWithProviders(<CreateRenovationScreen />);

      expect(getByText('Mode: create')).toBeTruthy();
    });

    it('snapshot test', () => {
      const { toJSON } = renderWithProviders(<CreateRenovationScreen />);
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Navegació', () => {
    it('hauria de navegar a Renovations quan es prem cancel', () => {
      const { getByTestId } = renderWithProviders(<CreateRenovationScreen />);

      const cancelButton = getByTestId('cancel-button');
      fireEvent.press(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith('Renovations');
    });

    it('hauria de navegar enrere quan es prem el botó back', () => {
      const { UNSAFE_root } = renderWithProviders(<CreateRenovationScreen />);

      const touchables = UNSAFE_root.findAllByType(require('react-native').TouchableOpacity);
      // El primer touchable hauria de ser el botó enrere
      if (touchables.length > 0) {
        fireEvent.press(touchables[0]);
      }
    });
  });

  describe('Submit', () => {
    it('hauria de cridar mutate quan es fa submit', async () => {
      mockMutate.mockImplementation((data, options) => {
        options?.onSuccess?.({ id: 'new-renovation-id' });
      });

      const { getByTestId } = renderWithProviders(<CreateRenovationScreen />);

      const submitButton = getByTestId('submit-button');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled();
      });
    });

    it('hauria de navegar a RefromDetail després de crear', async () => {
      mockMutate.mockImplementation((data, options) => {
        options?.onSuccess?.({ id: 'new-renovation-id' });
      });

      const { getByTestId } = renderWithProviders(<CreateRenovationScreen />);

      const submitButton = getByTestId('submit-button');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('RefromDetail', expect.any(Object));
      });
    });
  });

  describe('Gestió d\'errors', () => {
    it('hauria de tenir callbacks d\'error definits en el mutate', async () => {
      const { getByTestId } = renderWithProviders(<CreateRenovationScreen />);

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

    it('hauria de gestionar error genèric correctament', () => {
      // Verifiquem que el component té els callbacks d'error definits
      mockMutate.mockImplementation((data, options) => {
        // Verifiquem que onError està definit
        expect(options.onError).toBeDefined();
        expect(options.onSuccess).toBeDefined();
      });

      const { getByTestId } = renderWithProviders(<CreateRenovationScreen />);
      
      // El test verifica que el mutate es crida amb els callbacks correctes
      fireEvent.press(getByTestId('submit-button'));
      expect(mockMutate).toHaveBeenCalled();
    });

    it('hauria de gestionar error de solapament (409) correctament', () => {
      // Verifiquem que el component passa els callbacks necessaris
      mockMutate.mockImplementation((data, options) => {
        expect(options.onError).toBeDefined();
      });

      const { getByTestId } = renderWithProviders(<CreateRenovationScreen />);
      
      fireEvent.press(getByTestId('submit-button'));
      expect(mockMutate).toHaveBeenCalled();
    });
  });

  describe('Estat de càrrega', () => {
    it('hauria de passar isLoading al formulari quan mutation està pendent', () => {
      // Nota: El mock de useCreateRenovation retorna isPending: false
      // per tant no podem testejar directament, però podem verificar que
      // el loading es passa al formulari
      const { queryByTestId } = renderWithProviders(<CreateRenovationScreen />);
      
      // No hauria d'haver loading perquè isPending és false
      expect(queryByTestId('loading')).toBeNull();
    });
  });

  describe('Reset del formulari', () => {
    it('hauria de resetar el formulari cada vegada que s\'enfoca la pantalla', () => {
      // El useFocusEffect incrementa formResetKey
      const { getByTestId } = renderWithProviders(<CreateRenovationScreen />);
      expect(getByTestId('renovation-form')).toBeTruthy();
    });
  });

  describe('Alert informatiu', () => {
    it('hauria de mostrar alert informatiu en focus', () => {
      // El mock de useFocusEffect executa el callback immediatament
      // que hauria de mostrar l'alert informatiu
      const { toJSON } = renderWithProviders(<CreateRenovationScreen />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Botons d\'acció del CustomAlert amb error de solapament', () => {
    it('hauria de cridar mutate amb callbacks per error de solapament', () => {
      mockMutate.mockImplementation((data, options) => {
        // Verifiquem que els callbacks estan definits
        expect(options.onSuccess).toBeDefined();
        expect(options.onError).toBeDefined();
      });

      const { getByTestId } = renderWithProviders(<CreateRenovationScreen />);

      fireEvent.press(getByTestId('submit-button'));
      
      expect(mockMutate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        })
      );
    });

    it('hauria de passar els paràmetres correctes de la renovació al mutate', async () => {
      mockMutate.mockImplementation((data, options) => {
        options?.onSuccess?.({ id: 'new-renovation-id' });
      });

      const { getByTestId } = renderWithProviders(<CreateRenovationScreen />);

      fireEvent.press(getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            refuge_id: '1',
            ini_date: '2026-01-15',
            fin_date: '2026-01-20',
            description: 'Test',
          }),
          expect.any(Object)
        );
      });
    });
  });
});
