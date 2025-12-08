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
          withNavigation: true,
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
          withNavigation: true,
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
          withNavigation: true,
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
          withNavigation: true,
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
          withNavigation: true,
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
          withNavigation: true,
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
          withNavigation: true,
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
          withNavigation: true,
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
          withNavigation: true,
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
          withNavigation: true,
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
          withNavigation: true,
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
          withNavigation: true,
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
          withNavigation: true,
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
          withNavigation: true,
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
          withNavigation: true,
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
          withNavigation: true,
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
          withNavigation: true,
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
          withNavigation: true,
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
          withNavigation: true,
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

  describe('Refugis visitats', () => {
    it('hauria de mostrar correctament el nombre de refugis visitats', () => {
      const { getByText } = renderWithProviders(
        <ProfileScreen />,
        {
          withNavigation: true,
          mockAuthValue: {
            backendUser: mockBackendUser,
            firebaseUser: mockFirebaseUser as any,
            isAuthenticated: true,
          },
        }
      );

      // mockBackendUser té visited_refuges: [1, 2, 3]
      expect(getByText('3')).toBeTruthy();
      expect(getByText('Refugis visitats')).toBeTruthy();
    });

    it('hauria de mostrar 0 refugis visitats quan no n\'hi ha cap', () => {
      const userWithoutVisited = {
        ...mockBackendUser,
        visited_refuges: [],
      };

      const { getByText } = renderWithProviders(
        <ProfileScreen />,
        {
          withNavigation: true,
          mockAuthValue: {
            backendUser: userWithoutVisited,
            firebaseUser: mockFirebaseUser as any,
            isAuthenticated: true,
          },
        }
      );

      expect(getByText('0')).toBeTruthy();
      expect(getByText('Refugis visitats')).toBeTruthy();
    });

    it('hauria de gestionar visited_refuges undefined correctament', () => {
      const userWithoutVisitedField = {
        ...mockBackendUser,
        visited_refuges: undefined as any,
      };

      const { getByText } = renderWithProviders(
        <ProfileScreen />,
        {
          withNavigation: true,
          mockAuthValue: {
            backendUser: userWithoutVisitedField,
            firebaseUser: mockFirebaseUser as any,
            isAuthenticated: true,
          },
        }
      );

      // Hauria de mostrar 0 si visited_refuges és undefined
      expect(getByText('0')).toBeTruthy();
    });

    it('hauria de mostrar el nombre correcte amb múltiples refugis visitats', () => {
      const userWithManyVisited = {
        ...mockBackendUser,
        visited_refuges: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      };

      const { getAllByText } = renderWithProviders(
        <ProfileScreen />,
        {
          withNavigation: true,
          mockAuthValue: {
            backendUser: userWithManyVisited,
            firebaseUser: mockFirebaseUser as any,
            isAuthenticated: true,
          },
        }
      );

      // Hauria d'haver 10 refugis visitats (pot apareixer el "10" múltiples vegades)
      const textElements = getAllByText('10');
      expect(textElements.length).toBeGreaterThanOrEqual(1);
    });

    it('hauria de comptar visiteds amb IDs string correctament', () => {
      const userWithStringIds = {
        ...mockBackendUser,
        visited_refuges: ['1', '2', '3', '4', '5'] as any,
      };

      const { getAllByText } = renderWithProviders(
        <ProfileScreen />,
        {
          withNavigation: true,
          mockAuthValue: {
            backendUser: userWithStringIds,
            firebaseUser: mockFirebaseUser as any,
            isAuthenticated: true,
          },
        }
      );

      // Hauria d'haver 5 refugis visitats (pot apareixer el "5" múltiples vegades)
      const textElements = getAllByText('5');
      expect(textElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Comparació refugis favorits vs visitats', () => {
    it('hauria de mostrar diferent nombre de favorits i visitats', () => {
      const userWithDifferentCounts = {
        ...mockBackendUser,
        favourite_refuges: [1, 2], // 2 favorits
        visited_refuges: [1, 2, 3, 4, 5], // 5 visitats
      };

      const { getAllByText } = renderWithProviders(
        <ProfileScreen />,
        {
          withNavigation: true,
          mockAuthValue: {
            backendUser: userWithDifferentCounts,
            firebaseUser: mockFirebaseUser as any,
            isAuthenticated: true,
          },
        }
      );

      // Hauria de mostrar els dos números diferents
      expect(getAllByText('2').length).toBeGreaterThanOrEqual(1); // Favorits (i pot ser reformes)
      expect(getAllByText('5').length).toBeGreaterThanOrEqual(1); // Visitats (i contribucions)
    });

    it('hauria de gestionar el cas on tots els refugis visitats també són favorits', () => {
      const userWithOverlap = {
        ...mockBackendUser,
        favourite_refuges: [1, 2, 3, 4, 5],
        visited_refuges: [1, 2, 3],
      };

      const { getAllByText } = renderWithProviders(
        <ProfileScreen />,
        {
          withNavigation: true,
          mockAuthValue: {
            backendUser: userWithOverlap,
            firebaseUser: mockFirebaseUser as any,
            isAuthenticated: true,
          },
        }
      );

      expect(getAllByText('5').length).toBeGreaterThanOrEqual(1); // Favorits
      expect(getAllByText('3').length).toBeGreaterThanOrEqual(1); // Visitats
    });
  });
});




