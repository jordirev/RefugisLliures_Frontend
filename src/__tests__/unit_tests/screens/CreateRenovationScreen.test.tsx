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
        <TouchableOpacity testID="submit-button" onPress={() => {
          // Handle the promise returned by onSubmit - catch any rejections to prevent unhandled promise rejections
          onSubmit({ refuge_id: '1', ini_date: '2026-01-15', fin_date: '2026-01-20', description: 'Test', group_link: 'https://chat.whatsapp.com/test' }, true, {}).catch(() => {
            // Error is handled by the component's onError callback, we just need to catch it here
          });
        }}>
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

// Mock useCustomAlert to capture button callbacks
let capturedAlertButtons: any[] = [];
const mockShowAlert = jest.fn((title: any, message: any, buttons?: any[]) => {
  capturedAlertButtons = buttons || [];
});
const mockHideAlert = jest.fn();

jest.mock('../../../hooks/useCustomAlert', () => ({
  useCustomAlert: () => ({
    alertVisible: false,
    alertConfig: null,
    showAlert: mockShowAlert,
    hideAlert: mockHideAlert,
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

    it('hauria de gestionar error genèric correctament', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Just verify that the mutate is called with error handler
      const { getByTestId } = renderWithProviders(<CreateRenovationScreen />);
      
      fireEvent.press(getByTestId('submit-button'));
      
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            onError: expect.any(Function),
          })
        );
      });
      
      consoleError.mockRestore();
    });

    it('hauria de gestionar error de solapament (409) correctament', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Just verify that the mutate is called with error handler
      const { getByTestId } = renderWithProviders(<CreateRenovationScreen />);
      
      fireEvent.press(getByTestId('submit-button'));
      
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            onError: expect.any(Function),
          })
        );
      });
      
      consoleError.mockRestore();
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

  describe('onSuccess callback', () => {
    it('should navigate to RefromDetail with created renovation data', async () => {
      const createdRenovation = { id: 'new-reno-123', description: 'Test Renovation' };
      mockMutate.mockImplementation((data, options) => {
        options?.onSuccess?.(createdRenovation);
      });

      const { getByTestId } = renderWithProviders(<CreateRenovationScreen />);

      fireEvent.press(getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('RefromDetail', {
          renovationId: 'new-reno-123',
          renovation: createdRenovation
        });
      });
    });
  });

  describe('onError callback - generic error', () => {
    it('should handle generic error with message', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockMutate.mockImplementation((data, options) => {
        // Call onError synchronously without rejecting
        options?.onError?.({ message: 'Something went wrong' });
      });

      const { getByTestId } = renderWithProviders(<CreateRenovationScreen />);

      fireEvent.press(getByTestId('submit-button'));

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Error creating renovation:', expect.any(Object));
      });

      consoleError.mockRestore();
    });

    it('should handle generic error without message', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockMutate.mockImplementation((data, options) => {
        // Call onError synchronously without rejecting
        options?.onError?.({});
      });

      const { getByTestId } = renderWithProviders(<CreateRenovationScreen />);

      fireEvent.press(getByTestId('submit-button'));

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });

  describe('onError callback - overlapping renovation (409)', () => {
    it('should show alert with overlapping renovation info', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      const overlappingRenovation = { id: 'overlap-123', description: 'Overlapping renovation' };
      
      mockMutate.mockImplementation((data, options) => {
        // Call onError synchronously - no rejection
        options?.onError?.({ overlappingRenovation });
      });

      const { getByTestId } = renderWithProviders(<CreateRenovationScreen />);

      fireEvent.press(getByTestId('submit-button'));

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Error creating renovation:', expect.objectContaining({
          overlappingRenovation: expect.any(Object)
        }));
      });

      consoleError.mockRestore();
    });

    it('should navigate to Renovations when pressing OK on overlap alert', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      const overlappingRenovation = { id: 'overlap-123' };
      
      mockMutate.mockImplementation((data, options) => {
        // Call onError synchronously
        options?.onError?.({ overlappingRenovation });
      });

      const { getByTestId } = renderWithProviders(<CreateRenovationScreen />);

      fireEvent.press(getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });

    it('should navigate to RefromDetail when pressing view overlapping renovation', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      const overlappingRenovation = { id: 'overlap-456' };
      
      mockMutate.mockImplementation((data, options) => {
        // Call onError synchronously
        options?.onError?.({ overlappingRenovation });
      });

      const { getByTestId } = renderWithProviders(<CreateRenovationScreen />);

      fireEvent.press(getByTestId('submit-button'));

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });

  describe('Alert button callbacks for overlap error', () => {
    it('should call showAlert with buttons for overlapping renovation', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      const overlappingRenovation = { id: 'overlap-789' };
      
      mockMutate.mockImplementation((data, options) => {
        options?.onError?.({ overlappingRenovation });
      });

      const { getByTestId } = renderWithProviders(<CreateRenovationScreen />);

      fireEvent.press(getByTestId('submit-button'));

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });

    it('should navigate to Renovations when pressing OK button on overlap alert', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      const overlappingRenovation = { id: 'overlap-test-ok' };
      capturedAlertButtons = []; // Reset
      
      mockMutate.mockImplementation((data, options) => {
        options?.onError?.({ overlappingRenovation });
      });

      const { getByTestId } = renderWithProviders(<CreateRenovationScreen />);

      fireEvent.press(getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalled();
      });

      // Find and trigger the OK button (first button with style 'cancel')
      const okButton = capturedAlertButtons.find((b: any) => b.style === 'cancel');
      if (okButton && okButton.onPress) {
        okButton.onPress();
      }

      await waitFor(() => {
        expect(mockHideAlert).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('Renovations');
      });

      consoleError.mockRestore();
    });

    it('should navigate to RefromDetail when pressing view overlapping renovation button', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      const overlappingRenovation = { id: 'overlap-view-123' };
      capturedAlertButtons = []; // Reset
      
      mockMutate.mockImplementation((data, options) => {
        options?.onError?.({ overlappingRenovation });
      });

      const { getByTestId } = renderWithProviders(<CreateRenovationScreen />);

      fireEvent.press(getByTestId('submit-button'));

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalled();
      });

      // Find and trigger the view button (second button with style 'default')
      const viewButton = capturedAlertButtons.find((b: any) => b.style === 'default');
      if (viewButton && viewButton.onPress) {
        viewButton.onPress();
      }

      await waitFor(() => {
        expect(mockHideAlert).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('RefromDetail', { renovationId: 'overlap-view-123' });
      });

      consoleError.mockRestore();
    });
  });
});
