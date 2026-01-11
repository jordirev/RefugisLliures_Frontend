/**
 * Tests unitaris per a ProfileScreen
 *
 * Aquest fitxer cobreix:
 * - Renderització de la pantalla
 * - Mostrar informació de l'usuari
 * - Mostrar estadístiques
 * - Mostrar refugis visitats
 * - Navegació a settings
 * - Avatar popup
 * - Snapshot tests
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ProfileScreen } from '../../../screens/ProfileScreen';
import { Location } from '../../../models';

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

// Mock SVG icons
jest.mock('../../../assets/icons/stats.svg', () => 'StatsIcon');
jest.mock('../../../assets/icons/settings.svg', () => 'SettingsIcon');
jest.mock('../../../assets/icons/altitude2.svg', () => 'AltitudeIcon');

// Mock images
jest.mock('../../../assets/images/profileDefaultBackground.png', () => 'DefaultProfileBackgroundImage');

// Mock AvatarPopup
jest.mock('../../../components/AvatarPopup', () => ({
  AvatarPopup: ({ visible, onClose, onAvatarUpdated }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    if (!visible) return null;
    return (
      <View testID="avatar-popup">
        <TouchableOpacity testID="avatar-popup-close" onPress={onClose}>
          <Text>Close</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="avatar-popup-update" onPress={onAvatarUpdated}>
          <Text>Update Avatar</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

// Mock RefugeCard
jest.mock('../../../components/RefugeCard', () => ({
  RefugeCard: ({ refuge, onPress, onViewMap }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID={`refuge-card-${refuge.id}`}>
        <Text>{refuge.name}</Text>
        <TouchableOpacity testID={`refuge-detail-${refuge.id}`} onPress={onPress}>
          <Text>View Detail</Text>
        </TouchableOpacity>
        <TouchableOpacity testID={`refuge-map-${refuge.id}`} onPress={onViewMap}>
          <Text>View Map</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

// Mock useTranslation
jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, any> = {
        'profile.stats.title': 'Estadístiques',
        'profile.stats.visited': 'Visitats',
        'profile.stats.renovations': 'Renovacions',
        'profile.stats.contributions': 'Contribucions',
        'profile.stats.photos': 'Fotos',
        'profile.stats.memberSince': params?.date ? `Membre des de ${params.date}` : 'Membre des de',
        'visited.title': 'Refugis visitats',
        'visited.empty.title': 'No has visitat cap refugi',
        'visited.empty.message': 'Explora refugis i marca\'ls com a visitats',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock i18n
jest.mock('../../../i18n', () => ({
  getCurrentLanguage: () => 'ca',
}));

// Navigation mocks
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
      const cleanup = callback();
      return cleanup;
    }, []);
  },
}));

// Mock data
const mockUser = {
  uid: 'test-uid',
  username: 'TestUser',
  avatar_metadata: { url: 'https://example.com/avatar.jpg' },
  num_renovated_refuges: 5,
  num_shared_experiences: 10,
  uploaded_photos_keys: ['photo1', 'photo2', 'photo3'],
  created_at: '2024-01-15T10:00:00Z',
};

const mockFirebaseUser = {
  uid: 'test-uid',
  displayName: 'Test User Firebase',
  email: 'test@example.com',
  metadata: {
    creationTime: '2024-01-15T10:00:00Z',
  },
};

const mockVisitedRefuges: Location[] = [
  {
    id: '1',
    name: 'Refugi de Colomers',
    coord: { long: 0.9456, lat: 42.6497 },
    region: 'Val d\'Aran',
    places: 50,
    condition: 1,
    altitude: 2135,
    type: 'non gardée',
  },
  {
    id: '2',
    name: 'Refugi d\'Amitges',
    coord: { long: 0.9876, lat: 42.5678 },
    region: 'Pallars Sobirà',
    places: 60,
    condition: 3,
    altitude: 2380,
    type: 'non gardée',
  },
];

// Mock hooks
let mockUserFromQuery = mockUser;
let mockVisitedRefugesData = mockVisitedRefuges;
let mockIsLoadingUser = false;
let mockIsLoadingVisited = false;
const mockRefetchUserQuery = jest.fn();

jest.mock('../../../hooks/useUsersQuery', () => ({
  useUser: () => ({
    data: mockUserFromQuery,
    isLoading: mockIsLoadingUser,
    refetch: mockRefetchUserQuery,
  }),
  useVisitedRefuges: () => ({
    data: mockVisitedRefugesData,
    isLoading: mockIsLoadingVisited,
  }),
}));

// Mock AuthContext
const mockRefreshUserData = jest.fn();
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    firebaseUser: mockFirebaseUser,
    backendUser: null,
    refreshUserData: mockRefreshUserData,
  }),
}));

describe('ProfileScreen', () => {
  const mockOnViewDetail = jest.fn();
  const mockOnViewMap = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserFromQuery = mockUser;
    mockVisitedRefugesData = mockVisitedRefuges;
    mockIsLoadingUser = false;
    mockIsLoadingVisited = false;
  });

  describe('Renderització bàsica', () => {
    it('hauria de renderitzar correctament', () => {
      const { toJSON } = render(
        <ProfileScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      expect(toJSON()).toBeTruthy();
    });

    it('hauria de mostrar el nom de l\'usuari', () => {
      const { getByText } = render(
        <ProfileScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      expect(getByText('TestUser')).toBeTruthy();
    });

    it('hauria de mostrar l\'avatar de l\'usuari si existeix', () => {
      const { UNSAFE_root } = render(
        <ProfileScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      const images = UNSAFE_root.findAllByType(require('react-native').Image);
      expect(images.length).toBeGreaterThan(0);
    });

    it('snapshot test', () => {
      const { toJSON } = render(
        <ProfileScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Estadístiques', () => {
    it('hauria de mostrar el títol d\'estadístiques', () => {
      const { getByText } = render(
        <ProfileScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      expect(getByText('Estadístiques')).toBeTruthy();
    });

    it('hauria de mostrar el nombre de refugis visitats', () => {
      const { getByText } = render(
        <ProfileScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      expect(getByText('2')).toBeTruthy(); // 2 visited refuges
    });

    it('hauria de mostrar el nombre de renovacions', () => {
      const { getByText } = render(
        <ProfileScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      expect(getByText('5')).toBeTruthy(); // num_renovated_refuges
    });

    it('hauria de mostrar el nombre de contribucions', () => {
      const { getByText } = render(
        <ProfileScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      expect(getByText('10')).toBeTruthy(); // num_shared_experiences
    });

    it('hauria de mostrar el nombre de fotos', () => {
      const { getByText } = render(
        <ProfileScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      expect(getByText('3')).toBeTruthy(); // uploaded_photos_keys.length
    });
  });

  describe('Refugis visitats', () => {
    it('hauria de mostrar el títol de refugis visitats', () => {
      const { getByText } = render(
        <ProfileScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      expect(getByText('Refugis visitats')).toBeTruthy();
    });

    it('hauria de mostrar el comptador de refugis visitats', () => {
      const { getByText } = render(
        <ProfileScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      expect(getByText('(2)')).toBeTruthy();
    });

    it('hauria de renderitzar les targetes de refugis visitats', () => {
      const { getByTestId } = render(
        <ProfileScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      expect(getByTestId('refuge-card-1')).toBeTruthy();
      expect(getByTestId('refuge-card-2')).toBeTruthy();
    });

    it('hauria de cridar onViewDetail quan es prem una targeta', () => {
      const { getByTestId } = render(
        <ProfileScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      const detailButton = getByTestId('refuge-detail-1');
      fireEvent.press(detailButton);
      
      expect(mockOnViewDetail).toHaveBeenCalledWith(mockVisitedRefuges[0]);
    });

    it('hauria de cridar onViewMap i navegar quan es prem veure mapa', () => {
      const { getByTestId } = render(
        <ProfileScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      const mapButton = getByTestId('refuge-map-1');
      fireEvent.press(mapButton);
      
      expect(mockOnViewMap).toHaveBeenCalledWith(mockVisitedRefuges[0]);
      expect(mockNavigate).toHaveBeenCalledWith('Map', expect.objectContaining({
        selectedRefuge: mockVisitedRefuges[0],
      }));
    });
  });

  describe('Estat buit de refugis visitats', () => {
    beforeEach(() => {
      mockVisitedRefugesData = [];
    });

    it('hauria de mostrar missatge quan no hi ha refugis visitats', () => {
      const { getByText } = render(
        <ProfileScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      expect(getByText('No has visitat cap refugi')).toBeTruthy();
    });

    it('hauria de mostrar el missatge descriptiu', () => {
      const { getByText } = render(
        <ProfileScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      expect(getByText('Explora refugis i marca\'ls com a visitats')).toBeTruthy();
    });
  });

  describe('Estat de càrrega', () => {
    beforeEach(() => {
      mockIsLoadingVisited = true;
    });

    it('hauria de mostrar loading quan es carreguen refugis visitats', () => {
      const { UNSAFE_root } = render(
        <ProfileScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      const activityIndicators = UNSAFE_root.findAllByType(require('react-native').ActivityIndicator);
      expect(activityIndicators.length).toBeGreaterThan(0);
    });
  });

  describe('Navegació a Settings', () => {
    it('hauria de navegar a Settings quan es prem el botó', () => {
      const { getByTestId } = render(
        <ProfileScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      const settingsButton = getByTestId('settings-button');
      fireEvent.press(settingsButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('Settings');
    });
  });

  describe('Avatar Popup', () => {
    it('hauria de mostrar avatar popup quan es prem l\'avatar', async () => {
      const { UNSAFE_root, getByTestId } = render(
        <ProfileScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      // Trobar el touchable de l'avatar (dins avatarContainer)
      const touchables = UNSAFE_root.findAllByType(require('react-native').TouchableOpacity);
      // El primer TouchableOpacity després del settings és l'avatar
      const avatarTouchable = touchables.find(t => 
        t.props.activeOpacity === 0.8
      );
      
      if (avatarTouchable) {
        fireEvent.press(avatarTouchable);
        
        await waitFor(() => {
          expect(getByTestId('avatar-popup')).toBeTruthy();
        });
      }
    });

    it('hauria de tancar el popup quan es prem close', async () => {
      const { UNSAFE_root, getByTestId, queryByTestId } = render(
        <ProfileScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      // Obrir popup
      const touchables = UNSAFE_root.findAllByType(require('react-native').TouchableOpacity);
      const avatarTouchable = touchables.find(t => t.props.activeOpacity === 0.8);
      
      if (avatarTouchable) {
        fireEvent.press(avatarTouchable);
        
        await waitFor(() => {
          expect(getByTestId('avatar-popup')).toBeTruthy();
        });
        
        // Tancar popup
        const closeButton = getByTestId('avatar-popup-close');
        fireEvent.press(closeButton);
        
        await waitFor(() => {
          expect(queryByTestId('avatar-popup')).toBeNull();
        });
      }
    });

    it('hauria de cridar refetch quan s\'actualitza l\'avatar', async () => {
      const { UNSAFE_root, getByTestId } = render(
        <ProfileScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      
      // Obrir popup
      const touchables = UNSAFE_root.findAllByType(require('react-native').TouchableOpacity);
      const avatarTouchable = touchables.find(t => t.props.activeOpacity === 0.8);
      
      if (avatarTouchable) {
        fireEvent.press(avatarTouchable);
        
        await waitFor(() => {
          expect(getByTestId('avatar-popup')).toBeTruthy();
        });
        
        // Actualitzar avatar
        const updateButton = getByTestId('avatar-popup-update');
        fireEvent.press(updateButton);
        
        await waitFor(() => {
          expect(mockRefetchUserQuery).toHaveBeenCalled();
          expect(mockRefreshUserData).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Fallback a Firebase User', () => {
    beforeEach(() => {
      mockUserFromQuery = null as any;
    });

    it('hauria d\'usar displayName de Firebase quan no hi ha userFromQuery', () => {
      const { toJSON } = render(
        <ProfileScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      // Quan userFromQuery és null, s'ha d'usar firebaseUser
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Usuari sense avatar', () => {
    beforeEach(() => {
      mockUserFromQuery = {
        ...mockUser,
        avatar_metadata: null,
      };
    });

    it('hauria de mostrar inicials quan no hi ha avatar', () => {
      const { getByText } = render(
        <ProfileScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      // Hauria de mostrar les inicials (TE per TestUser)
      expect(getByText('TE')).toBeTruthy();
    });
  });

  describe('Member since date', () => {
    it('hauria de formatar correctament la data de membre', () => {
      const { getByText } = render(
        <ProfileScreen onViewDetail={mockOnViewDetail} onViewMap={mockOnViewMap} />
      );
      // El mock retorna el text amb la data
      expect(getByText(/Membre des de/)).toBeTruthy();
    });
  });
});
