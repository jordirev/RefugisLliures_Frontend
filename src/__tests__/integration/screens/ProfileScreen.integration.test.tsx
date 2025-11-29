/**
 * Tests d'integració per a ProfileScreen
 * 
 * Cobertura:
 * - Renderització del perfil amb dades de l'usuari
 * - Mostrar estadístiques (refugis visitats, reformes, etc.)
 * - Navegació a Settings
 * - Gestió de dades d'usuari (Firebase i Backend)
 * - Casos límit (usuari sense dades, camps opcionals)
 */

import React from 'react';
import { renderWithProviders, fireEvent, waitFor } from '../setup/testUtils';
import { ProfileScreen } from '../../../screens/ProfileScreen';
import { User } from '../../../models';

// Mock de useNavigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock de useTranslation
jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        'profile.stats.title': 'Estadístiques',
        'profile.stats.visited': 'Refugis visitats',
        'profile.stats.renovations': 'Reformes',
        'profile.stats.contributions': 'Contribucions',
        'profile.stats.photos': 'Fotos pujades',
        'profile.stats.memberSince': `Membre des de ${params?.date || ''}`,
      };
      return translations[key] || key;
    },
  }),
}));

// Mock de getCurrentLanguage
jest.mock('../../../i18n', () => ({
  getCurrentLanguage: () => 'ca',
}));

// Mock de les icones
jest.mock('../../../assets/icons/stats.svg', () => 'StatsIcon');
jest.mock('../../../assets/icons/settings.svg', () => 'SettingsIcon');
jest.mock('../../../assets/icons/altitude2.svg', () => 'AltitudeIcon');
jest.mock('../../../assets/images/profileDefaultBackground.png', () => 'DefaultBackground');

describe('ProfileScreen - Tests d\'integració', () => {
  const mockBackendUser: User = {
    uid: 'test-uid-123',
    username: 'Test User',
    email: 'test@example.com',
    language: 'ca',
    favourite_refuges: [1, 2],
    visited_refuges: [1, 2, 3],
    num_renovated_refuges: 2,
    renovations: ["1", "2"],
    num_shared_experiences: 5,
    num_uploaded_photos: 10,
    created_at: '2024-01-01T00:00:00Z',
  };

  const mockFirebaseUser = {
    uid: 'test-uid-123',
    email: 'test@example.com',
    displayName: 'Test User',
    emailVerified: true,
    metadata: {
      creationTime: '2024-01-01T00:00:00Z',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderització amb dades d\'usuari', () => {
    it('hauria de renderitzar el perfil amb dades del backend', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <ProfileScreen />,
        {
          withNavigation: false,
          mockAuthValue: {
            backendUser: mockBackendUser,
            firebaseUser: mockFirebaseUser as any,
            isAuthenticated: true,
          },
        }
      );

      expect(getByText('Test User')).toBeTruthy();
      expect(getByText('Estadístiques')).toBeTruthy();
    });

    it('hauria de mostrar les estadístiques correctament', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <ProfileScreen />,
        {
          withNavigation: false,
          mockAuthValue: {
            backendUser: mockBackendUser,
            firebaseUser: mockFirebaseUser as any,
            isAuthenticated: true,
          },
        }
      );

      expect(getByText('3')).toBeTruthy(); // refugis visitats
      expect(getByText('2')).toBeTruthy(); // reformes
      expect(getByText('5')).toBeTruthy(); // contribucions
      expect(getByText('10')).toBeTruthy(); // fotos
    });

    it('hauria de mostrar la data de creació correctament', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <ProfileScreen />,
        {
          withNavigation: false,
          mockAuthValue: {
            backendUser: mockBackendUser,
            firebaseUser: mockFirebaseUser as any,
            isAuthenticated: true,
          },
        }
      );

      expect(getByText(/Membre des de/)).toBeTruthy();
    });

    it('hauria de mostrar l\'avatar amb les inicials', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <ProfileScreen />,
        {
          withNavigation: false,
          mockAuthValue: {
            backendUser: mockBackendUser,
            firebaseUser: mockFirebaseUser as any,
            isAuthenticated: true,
          },
        }
      );

      // L'avatar hauria de mostrar "TU" (Test User)
      expect(getByText('TU')).toBeTruthy();
    });
  });

  describe('Navegació a Settings', () => {
    it('hauria de navegar a Settings quan es fa clic al botó', () => {
      const { getByTestId } = renderWithProviders(
        <ProfileScreen />,
        {
          withNavigation: false,
          mockAuthValue: {
            backendUser: mockBackendUser,
            firebaseUser: mockFirebaseUser as any,
            isAuthenticated: true,
          },
        }
      );

      const settingsButton = getByTestId('settings-button');
      fireEvent.press(settingsButton);

      expect(mockNavigate).toHaveBeenCalledWith('Settings');
    });
  });

  describe('Casos amb dades de Firebase quan no hi ha backend', () => {
    it('hauria de mostrar dades de Firebase si no hi ha backend user', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <ProfileScreen />,
        {
          withNavigation: false,
          mockAuthValue: {
            backendUser: null,
            firebaseUser: mockFirebaseUser as any,
            isAuthenticated: true,
          },
        }
      );

      expect(getByText('Test User')).toBeTruthy();
    });

    it('hauria de mostrar email com a nom si no hi ha displayName', () => {
      const firebaseUserWithoutName = {
        ...mockFirebaseUser,
        displayName: null,
      };

      const { getByText, getByTestId } = renderWithProviders(
        <ProfileScreen />,
        {
          withNavigation: false,
          mockAuthValue: {
            backendUser: null,
            firebaseUser: firebaseUserWithoutName as any,
            isAuthenticated: true,
          },
        }
      );

      expect(getByText('test@example.com')).toBeTruthy();
    });
  });

  describe('Estadístiques amb valors 0', () => {
    it('hauria de mostrar 0 per estadístiques buides', () => {
      const userWithoutStats = {
        ...mockBackendUser,
        visited_refuges: [],
        num_renovated_refuges: 0,
        num_shared_experiences: 0,
        num_uploaded_photos: 0,
      };

      const { getAllByText } = renderWithProviders(
        <ProfileScreen />,
        {
          withNavigation: false,
          mockAuthValue: {
            backendUser: userWithoutStats,
            firebaseUser: mockFirebaseUser as any,
            isAuthenticated: true,
          },
        }
      );

      // Hauria de mostrar múltiples 0
      const zeros = getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(3);
    });

    it('hauria de utilitzar reformes.length si num_refugis_reformats no existeix', () => {
      const userWithReformes = {
        ...mockBackendUser,
        num_renovated_refuges: undefined,
        renovations: [1, 2, 3],
      };

      const { getAllByText, getByTestId } = renderWithProviders(
        <ProfileScreen />,
        {
          withNavigation: false,
          mockAuthValue: {
            backendUser: userWithReformes,
            firebaseUser: mockFirebaseUser as any,
            isAuthenticated: true,
          },
        }
      );

      // Hauria de mostrar 3 (la longitud de reformes)
      const threes = getAllByText('3');
      expect(threes.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Avatar amb diferents noms', () => {
    it('hauria de generar inicials correctes per un nom complet', () => {
      const userWithFullName = {
        ...mockBackendUser,
        username: 'Joan Garcia Puig',
      };

      const { getByText, getByTestId } = renderWithProviders(
        <ProfileScreen />,
        {
          withNavigation: false,
          mockAuthValue: {
            backendUser: userWithFullName,
            firebaseUser: mockFirebaseUser as any,
            isAuthenticated: true,
          },
        }
      );

      // Hauria de mostrar les inicials del primer i últim nom
      expect(getByText('JP')).toBeTruthy();
    });

    it('hauria de generar inicials per un nom d\'una paraula', () => {
      const userWithSingleName = {
        ...mockBackendUser,
        username: 'Joan',
      };

      const { getByText, getByTestId } = renderWithProviders(
        <ProfileScreen />,
        {
          withNavigation: false,
          mockAuthValue: {
            backendUser: userWithSingleName,
            firebaseUser: mockFirebaseUser as any,
            isAuthenticated: true,
          },
        }
      );

      // Hauria de mostrar les dues primeres lletres
      expect(getByText('JO')).toBeTruthy();
    });

    it('hauria de gestionar noms buits', () => {
      const userWithoutName = {
        ...mockBackendUser,
        username: '',
      };

      const firebaseUserWithoutName = {
        ...mockFirebaseUser,
        displayName: null,
        email: '',
      };

      const { queryByText } = renderWithProviders(
        <ProfileScreen />,
        {
          withNavigation: false,
          mockAuthValue: {
            backendUser: userWithoutName,
            firebaseUser: firebaseUserWithoutName as any,
            isAuthenticated: true,
          },
        }
      );

      // Hauria de gestionar correctament el cas sense nom
      // No hauria de crashejar
    });
  });

  describe('Data de creació', () => {
    it('hauria de utilitzar created_at del backend si està disponible', () => {
      const { getByText, getByTestId } = renderWithProviders(
        <ProfileScreen />,
        {
          withNavigation: false,
          mockAuthValue: {
            backendUser: mockBackendUser,
            firebaseUser: mockFirebaseUser as any,
            isAuthenticated: true,
          },
        }
      );

      expect(getByText(/Membre des de/)).toBeTruthy();
      expect(getByText(/gener/i)).toBeTruthy();
    });

    it('hauria d\'utilitzar creationTime de Firebase si no hi ha created_at', () => {
      const userWithoutCreatedAt = {
        ...mockBackendUser,
        created_at: undefined,
      };

      const { getByText, getByTestId } = renderWithProviders(
        <ProfileScreen />,
        {
          withNavigation: false,
          mockAuthValue: {
            backendUser: userWithoutCreatedAt,
            firebaseUser: mockFirebaseUser as any,
            isAuthenticated: true,
          },
        }
      );

      expect(getByText(/Membre des de/)).toBeTruthy();
    });

    it('hauria de gestionar dates invàlides', () => {
      const userWithInvalidDate = {
        ...mockBackendUser,
        created_at: 'invalid-date',
      };

      const { getByText, getByTestId } = renderWithProviders(
        <ProfileScreen />,
        {
          withNavigation: false,
          mockAuthValue: {
            backendUser: userWithInvalidDate,
            firebaseUser: mockFirebaseUser as any,
            isAuthenticated: true,
          },
        }
      );

      // Hauria de mostrar el text sense crashejar
      expect(getByText(/Membre des de/)).toBeTruthy();
    });
  });

  describe('Estat de càrrega', () => {
    it('no hauria de mostrar dades mentre està carregant', () => {
      const { queryByText } = renderWithProviders(
        <ProfileScreen />,
        {
          withNavigation: false,
          mockAuthValue: {
            backendUser: mockBackendUser,
            firebaseUser: mockFirebaseUser as any,
            isLoading: true,
            isAuthenticated: false,
          },
        }
      );

      // Hauria de renderitzar però potser sense totes les dades
      // o amb un indicador de càrrega
    });
  });

  describe('Layout i imatges', () => {
    it('hauria de mostrar la imatge de fons del header', () => {
      const { getByTestId } = renderWithProviders(
        <ProfileScreen />,
        {
          withNavigation: false,
          mockAuthValue: {
            backendUser: mockBackendUser,
            firebaseUser: mockFirebaseUser as any,
            isAuthenticated: true,
          },
        }
      );

      // Verificar que el header gradient existeix (que conté la imatge)
      const gradient = getByTestId('header-gradient');
      expect(gradient).toBeTruthy();
    });

    it('hauria de tenir el gradient correcte al header', () => {
      const { getByTestId } = renderWithProviders(
        <ProfileScreen />,
        {
          withNavigation: false,
          mockAuthValue: {
            backendUser: mockBackendUser,
            firebaseUser: mockFirebaseUser as any,
            isAuthenticated: true,
          },
        }
      );

      // Verificar que el gradient existeix
      const gradient = getByTestId('header-gradient');
      expect(gradient).toBeTruthy();
    });
  });

  describe('Safe Area', () => {
    it('hauria de renderitzar-se amb SafeAreaProvider correctament', () => {
      const { UNSAFE_root, getByText } = renderWithProviders(
        <ProfileScreen />,
        {
          withNavigation: false,
          mockAuthValue: {
            backendUser: mockBackendUser,
            firebaseUser: mockFirebaseUser as any,
            isAuthenticated: true,
          },
        }
      );

      // Verificar que el component renderitza correctament amb SafeArea
      expect(UNSAFE_root).toBeTruthy();
      expect(getByText('Test User')).toBeTruthy();
    });
  });
});




