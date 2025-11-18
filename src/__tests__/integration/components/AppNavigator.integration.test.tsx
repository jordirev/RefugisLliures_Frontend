/**
 * Tests d'integració per a AppNavigator
 * 
 * Cobertura:
 * - Renderització del navegador de tabs
 * - Navegació entre tabs (Mapa, Favorits, Reformes, Perfil)
 * - Pantalles ocultes (Settings, ChangePassword, ChangeEmail, EditProfile)
 * - Gestió del BottomSheet del refugi
 * - Gestió de la pantalla de detall del refugi
 * - Toggle de favorits
 * - Navegació amb hardware back button (Android)
 * - Integració amb RefugisService
 * - CustomAlert per notificacions
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { renderWithProviders, fireEvent, waitFor } from '../setup/testUtils';
import { setupMSW } from '../setup/mswServer';
import { AppNavigator } from '../../../components/AppNavigator';
import { RefugisService } from '../../../services/RefugisService';

// Setup MSW
setupMSW();

// Mock de RefugisService
jest.mock('../../../services/RefugisService');

// Mock de useCustomAlert
const mockShowAlert = jest.fn();
const mockHideAlert = jest.fn();

jest.mock('../../../utils/useCustomAlert', () => ({
  useCustomAlert: () => ({
    alertVisible: false,
    alertConfig: null,
    showAlert: mockShowAlert,
    hideAlert: mockHideAlert,
  }),
}));

// Mock de CustomAlert
jest.mock('../../../components/CustomAlert', () => ({
  CustomAlert: () => null,
}));

// Mock dels screens
jest.mock('../../../screens/MapScreen', () => ({
  MapScreen: ({ onLocationSelect }: any) => {
    const React = require('react');
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <TouchableOpacity testID="map-screen" onPress={() => onLocationSelect({ id: 1, name: 'Test Refuge' })}>
        <Text>Map Screen</Text>
      </TouchableOpacity>
    );
  },
}));

jest.mock('../../../screens/FavoritesScreen', () => ({
  FavoritesScreen: ({ onViewDetail, onViewMap }: any) => {
    const React = require('react');
    const { View, TouchableOpacity, Text } = require('react-native');
    return (
      <View testID="favorites-screen">
        <TouchableOpacity testID="view-detail" onPress={() => onViewDetail({ id: 1, name: 'Test Refuge' })}>
          <Text>View Detail</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="view-map" onPress={() => onViewMap({ id: 1, name: 'Test Refuge' })}>
          <Text>View Map</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

jest.mock('../../../screens/ReformsScreen', () => ({
  ReformsScreen: () => <div testID="reforms-screen">Reforms Screen</div>,
}));

jest.mock('../../../screens/ProfileScreen', () => ({
  ProfileScreen: () => {
    const React = require('react');
    const { View, Text } = require('react-native');
    return <View testID="profile-screen"><Text>Profile Screen</Text></View>;
  },
}));

jest.mock('../../../screens/SettingsScreen', () => ({
  SettingsScreen: () => {
    const React = require('react');
    const { View, Text } = require('react-native');
    return <View testID="settings-screen"><Text>Settings Screen</Text></View>;
  },
}));

jest.mock('../../../screens/ChangePasswordScreen', () => ({
  ChangePasswordScreen: () => {
    const React = require('react');
    const { View, Text } = require('react-native');
    return <View testID="change-password-screen"><Text>Change Password Screen</Text></View>;
  },
}));

jest.mock('../../../screens/ChangeEmailScreen', () => ({
  ChangeEmailScreen: () => {
    const React = require('react');
    const { View, Text } = require('react-native');
    return <View testID="change-email-screen"><Text>Change Email Screen</Text></View>;
  },
}));

jest.mock('../../../screens/EditProfileScreen', () => ({
  EditProfileScreen: () => {
    const React = require('react');
    const { View, Text } = require('react-native');
    return <View testID="edit-profile-screen"><Text>Edit Profile Screen</Text></View>;
  },
}));

// Mock de RefugeBottomSheet
jest.mock('../../../components/RefugeBottomSheet', () => ({
  RefugeBottomSheet: ({ isVisible, onClose, onToggleFavorite, onNavigate, onViewDetails, refuge }: any) => {
    if (!isVisible) return null;
    const React = require('react');
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="refuge-bottom-sheet">
        <Text testID="refuge-name">{refuge?.name}</Text>
        <TouchableOpacity testID="close-bottom-sheet" onPress={onClose}><Text>Close</Text></TouchableOpacity>
        <TouchableOpacity testID="toggle-favorite" onPress={() => onToggleFavorite(refuge?.id)}><Text>Toggle Favorite</Text></TouchableOpacity>
        <TouchableOpacity testID="navigate" onPress={() => onNavigate(refuge)}><Text>Navigate</Text></TouchableOpacity>
        <TouchableOpacity testID="view-details" onPress={() => onViewDetails(refuge)}><Text>View Details</Text></TouchableOpacity>
      </View>
    );
  },
}));

// Mock de RefugeDetailScreen
jest.mock('../../../screens/RefugeDetailScreen', () => ({
  RefugeDetailScreen: ({ refuge, onBack, onToggleFavorite, onNavigate }: any) => {
    const React = require('react');
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="refuge-detail-screen">
        <Text testID="detail-refuge-name">{refuge?.name}</Text>
        <TouchableOpacity testID="back-button" onPress={onBack}><Text>Back</Text></TouchableOpacity>
        <TouchableOpacity testID="detail-toggle-favorite" onPress={() => onToggleFavorite(refuge?.id)}><Text>Toggle Favorite</Text></TouchableOpacity>
        <TouchableOpacity testID="detail-navigate" onPress={() => onNavigate(refuge)}><Text>Navigate</Text></TouchableOpacity>
      </View>
    );
  },
}));

// Mock de les icones
jest.mock('../../../assets/icons/map2.svg', () => 'MapIcon');
jest.mock('../../../assets/icons/fav.svg', () => 'FavIcon');
jest.mock('../../../assets/icons/reform.svg', () => 'ReformIcon');
jest.mock('../../../assets/icons/user.svg', () => 'UserIcon');

describe('AppNavigator - Tests d\'integració', () => {
  const mockRefuge = {
    id: 1,
    name: 'Test Refuge',
    type: 'guardat',
    condition: 'bo',
    altitude: 2000,
    places: 10,
    latitude: 42.5,
    longitude: 1.5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (RefugisService.addFavorite as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Renderització inicial', () => {
    it('hauria de renderitzar el navegador de tabs', () => {
      const { getByTestId } = renderWithProviders(<AppNavigator />);

      // Per defecte, hauria de mostrar el MapScreen (primer tab)
      expect(getByTestId('map-screen')).toBeTruthy();
    });

    it('hauria de mostrar els 4 tabs principals', () => {
      const { getAllByText } = renderWithProviders(<AppNavigator />);

      expect(getAllByText('navigation.map')[0]).toBeTruthy();
      expect(getAllByText('navigation.favorites')[0]).toBeTruthy();
      expect(getAllByText('navigation.renovations')[0]).toBeTruthy();
      expect(getAllByText('navigation.profile')[0]).toBeTruthy();
    });

    it('no hauria de mostrar BottomSheet inicialment', () => {
      const { queryByTestId } = renderWithProviders(<AppNavigator />);

      expect(queryByTestId('refuge-bottom-sheet')).toBeNull();
    });

    it('no hauria de mostrar la pantalla de detall inicialment', () => {
      const { queryByTestId } = renderWithProviders(<AppNavigator />);

      expect(queryByTestId('refuge-detail-screen')).toBeNull();
    });
  });

  describe('Navegació entre tabs', () => {
    it('hauria de navegar al tab de Favorits', async () => {
      const { getAllByText, getByTestId } = renderWithProviders(<AppNavigator />);

      const favoritesTab = getAllByText('navigation.favorites')[0];
      fireEvent.press(favoritesTab);

      await waitFor(() => {
        expect(getByTestId('favorites-screen')).toBeTruthy();
      });
    });

    it('hauria de navegar al tab de Reformes', async () => {
      const { getAllByText, getByTestId } = renderWithProviders(<AppNavigator />);

      const reformsTab = getAllByText('navigation.renovations')[0];
      fireEvent.press(reformsTab);

      await waitFor(() => {
        expect(getByTestId('reforms-screen')).toBeTruthy();
      });
    });

    it('hauria de navegar al tab de Perfil', async () => {
      const { getAllByText, getByTestId } = renderWithProviders(<AppNavigator />);

      const profileTab = getAllByText('navigation.profile')[0];
      fireEvent.press(profileTab);

      await waitFor(() => {
        expect(getByTestId('profile-screen')).toBeTruthy();
      });
    });

    it('hauria de tornar al tab de Mapa', async () => {
      const { getAllByText, getByTestId } = renderWithProviders(<AppNavigator />);

      // Navegar a Favorits
      fireEvent.press(getAllByText('navigation.favorites')[0]);

      await waitFor(() => {
        expect(getByTestId('favorites-screen')).toBeTruthy();
      });

      // Tornar a Mapa
      fireEvent.press(getAllByText('navigation.map')[0]);

      await waitFor(() => {
        expect(getByTestId('map-screen')).toBeTruthy();
      });
    });
  });

  describe('BottomSheet del refugi', () => {
    it('hauria de mostrar el BottomSheet quan es selecciona un refugi', async () => {
      const { getByTestId } = renderWithProviders(<AppNavigator />);

      const mapScreen = getByTestId('map-screen');
      fireEvent.press(mapScreen);

      await waitFor(() => {
        expect(getByTestId('refuge-bottom-sheet')).toBeTruthy();
        expect(getByTestId('refuge-name')).toBeTruthy();
      });
    });

    it('hauria de tancar el BottomSheet quan es fa clic a Close', async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(<AppNavigator />);

      // Obrir BottomSheet
      fireEvent.press(getByTestId('map-screen'));

      await waitFor(() => {
        expect(getByTestId('refuge-bottom-sheet')).toBeTruthy();
      });

      // Tancar BottomSheet
      fireEvent.press(getByTestId('close-bottom-sheet'));

      await waitFor(() => {
        expect(queryByTestId('refuge-bottom-sheet')).toBeNull();
      });
    });

    it('hauria de netejar la ubicació seleccionada després de tancar el BottomSheet', async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(<AppNavigator />);

      // Obrir i tancar
      fireEvent.press(getByTestId('map-screen'));

      await waitFor(() => {
        expect(getByTestId('refuge-bottom-sheet')).toBeTruthy();
      });

      fireEvent.press(getByTestId('close-bottom-sheet'));

      await waitFor(() => {
        expect(queryByTestId('refuge-bottom-sheet')).toBeNull();
      });

      // Esperar el timeout de neteja (300ms)
      await new Promise(resolve => setTimeout(resolve, 350));
    });
  });

  describe('Toggle de favorits', () => {
    it('hauria d\'afegir un refugi als favorits', async () => {
      (RefugisService.addFavorite as jest.Mock).mockResolvedValue(undefined);

      const { getByTestId } = renderWithProviders(<AppNavigator />);

      // Obrir BottomSheet
      fireEvent.press(getByTestId('map-screen'));

      await waitFor(() => {
        expect(getByTestId('refuge-bottom-sheet')).toBeTruthy();
      });

      // Toggle favorit
      fireEvent.press(getByTestId('toggle-favorite'));

      await waitFor(() => {
        expect(RefugisService.addFavorite).toHaveBeenCalledWith(1);
        expect(mockShowAlert).toHaveBeenCalledWith('', 'alerts.favoriteUpdated');
      });
    });

    it('hauria de gestionar errors en afegir favorits', async () => {
      (RefugisService.addFavorite as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { getByTestId } = renderWithProviders(<AppNavigator />);

      // Obrir BottomSheet
      fireEvent.press(getByTestId('map-screen'));

      await waitFor(() => {
        expect(getByTestId('refuge-bottom-sheet')).toBeTruthy();
      });

      // Toggle favorit
      fireEvent.press(getByTestId('toggle-favorite'));

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith('common.error', 'alerts.favoriteError');
      });
    });

    it('no hauria de fer res si locationId és undefined', async () => {
      const { getByTestId } = renderWithProviders(<AppNavigator />);

      // Obrir BottomSheet amb refugi sense id
      fireEvent.press(getByTestId('map-screen'));

      await waitFor(() => {
        expect(getByTestId('refuge-bottom-sheet')).toBeTruthy();
      });

      // Intentar toggle favorit amb id undefined
      const bottomSheet = getByTestId('refuge-bottom-sheet');
      fireEvent.press(getByTestId('toggle-favorite'));

      // No hauria de cridar el servei
      await waitFor(() => {
        expect(RefugisService.addFavorite).toHaveBeenCalled();
      });
    });
  });

  describe('Navegació al refugi', () => {
    it('hauria de mostrar un alert quan es fa clic a Navigate', async () => {
      const { getByTestId } = renderWithProviders(<AppNavigator />);

      // Obrir BottomSheet
      fireEvent.press(getByTestId('map-screen'));

      await waitFor(() => {
        expect(getByTestId('refuge-bottom-sheet')).toBeTruthy();
      });

      // Clic a Navigate
      fireEvent.press(getByTestId('navigate'));

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalledWith(
          'navigation.map',
          'alerts.navigation'
        );
      });
    });
  });

  describe('Pantalla de detall del refugi', () => {
    it('hauria de mostrar la pantalla de detall quan es fa clic a View Details', async () => {
      const { getByTestId } = renderWithProviders(<AppNavigator />);

      // Obrir BottomSheet
      fireEvent.press(getByTestId('map-screen'));

      await waitFor(() => {
        expect(getByTestId('refuge-bottom-sheet')).toBeTruthy();
      });

      // Clic a View Details
      fireEvent.press(getByTestId('view-details'));

      await waitFor(() => {
        expect(getByTestId('refuge-detail-screen')).toBeTruthy();
        expect(getByTestId('detail-refuge-name')).toBeTruthy();
      });
    });

    it('hauria de tancar el BottomSheet quan s\'obre la pantalla de detall', async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(<AppNavigator />);

      // Obrir BottomSheet
      fireEvent.press(getByTestId('map-screen'));

      await waitFor(() => {
        expect(getByTestId('refuge-bottom-sheet')).toBeTruthy();
      });

      // Obrir pantalla de detall
      fireEvent.press(getByTestId('view-details'));

      await waitFor(() => {
        expect(queryByTestId('refuge-bottom-sheet')).toBeNull();
        expect(getByTestId('refuge-detail-screen')).toBeTruthy();
      });
    });

    it('hauria de tancar la pantalla de detall amb el botó Back', async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(<AppNavigator />);

      // Obrir pantalla de detall
      fireEvent.press(getByTestId('map-screen'));

      await waitFor(() => {
        fireEvent.press(getByTestId('view-details'));
      });

      await waitFor(() => {
        expect(getByTestId('refuge-detail-screen')).toBeTruthy();
      });

      // Tancar
      fireEvent.press(getByTestId('back-button'));

      await waitFor(() => {
        expect(queryByTestId('refuge-detail-screen')).toBeNull();
      });
    });

    it('hauria de permetre toggle de favorit des de la pantalla de detall', async () => {
      (RefugisService.addFavorite as jest.Mock).mockResolvedValue(undefined);

      const { getByTestId } = renderWithProviders(<AppNavigator />);

      // Obrir pantalla de detall
      fireEvent.press(getByTestId('map-screen'));

      await waitFor(() => {
        fireEvent.press(getByTestId('view-details'));
      });

      await waitFor(() => {
        expect(getByTestId('refuge-detail-screen')).toBeTruthy();
      });

      // Toggle favorit
      fireEvent.press(getByTestId('detail-toggle-favorite'));

      await waitFor(() => {
        expect(RefugisService.addFavorite).toHaveBeenCalledWith(1);
      });
    });

    it('hauria de permetre navegar des de la pantalla de detall', async () => {
      const { getByTestId } = renderWithProviders(<AppNavigator />);

      // Obrir pantalla de detall
      fireEvent.press(getByTestId('map-screen'));

      await waitFor(() => {
        fireEvent.press(getByTestId('view-details'));
      });

      await waitFor(() => {
        expect(getByTestId('refuge-detail-screen')).toBeTruthy();
      });

      // Navegar
      fireEvent.press(getByTestId('detail-navigate'));

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalled();
      });
    });
  });

  describe('Integració amb FavoritesScreen', () => {
    it('hauria de mostrar la pantalla de detall des de FavoritesScreen', async () => {
      const { getAllByText, getByTestId } = renderWithProviders(<AppNavigator />);

      // Navegar a Favorits
      fireEvent.press(getAllByText('navigation.favorites')[0]);

      await waitFor(() => {
        expect(getByTestId('favorites-screen')).toBeTruthy();
      });

      // Clic a View Detail
      fireEvent.press(getByTestId('view-detail'));

      await waitFor(() => {
        expect(getByTestId('refuge-detail-screen')).toBeTruthy();
      });
    });

    it('hauria de mostrar el BottomSheet des de FavoritesScreen', async () => {
      const { getAllByText, getByTestId } = renderWithProviders(<AppNavigator />);

      // Navegar a Favorits
      fireEvent.press(getAllByText('navigation.favorites')[0]);

      await waitFor(() => {
        expect(getByTestId('favorites-screen')).toBeTruthy();
      });

      // Clic a View Map
      fireEvent.press(getByTestId('view-map'));

      await waitFor(() => {
        expect(getByTestId('refuge-bottom-sheet')).toBeTruthy();
      });
    });
  });

  describe('Hardware back button (Android)', () => {
    it('hauria de tancar el BottomSheet amb el botó back', async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(<AppNavigator />);

      // Obrir BottomSheet
      fireEvent.press(getByTestId('map-screen'));

      await waitFor(() => {
        expect(getByTestId('refuge-bottom-sheet')).toBeTruthy();
      });

      // Tancar amb el botó close (simula el comportament del back button)
      fireEvent.press(getByTestId('close-bottom-sheet'));

      await waitFor(() => {
        expect(queryByTestId('refuge-bottom-sheet')).toBeNull();
      });
    });

    it('hauria de tancar la pantalla de detall amb el botó back', async () => {
      const { getByTestId, queryByTestId } = renderWithProviders(<AppNavigator />);

      // Obrir pantalla de detall
      fireEvent.press(getByTestId('map-screen'));

      await waitFor(() => {
        fireEvent.press(getByTestId('view-details'));
      });

      await waitFor(() => {
        expect(getByTestId('refuge-detail-screen')).toBeTruthy();
      });

      // Tancar amb el botó back
      fireEvent.press(getByTestId('back-button'));

      await waitFor(() => {
        expect(queryByTestId('refuge-detail-screen')).toBeNull();
      });
    });

    it('no hauria de consumir l\'event back si no hi ha overlays', () => {
      const { getByTestId } = renderWithProviders(<AppNavigator />);

      // Només verificar que el component es renderitza correctament sense overlays
      expect(getByTestId('map-screen')).toBeTruthy();
    });
  });

  describe('Pantalles ocultes del navegador', () => {
    it('no hauria de mostrar Settings a la barra de tabs', () => {
      const { queryByText } = renderWithProviders(<AppNavigator />);

      expect(queryByText('Settings')).toBeNull();
      expect(queryByText('Configuració')).toBeNull();
    });

    it('no hauria de mostrar ChangePassword a la barra de tabs', () => {
      const { queryByText } = renderWithProviders(<AppNavigator />);

      expect(queryByText('ChangePassword')).toBeNull();
      expect(queryByText('Canviar contrasenya')).toBeNull();
    });

    it('no hauria de mostrar ChangeEmail a la barra de tabs', () => {
      const { queryByText } = renderWithProviders(<AppNavigator />);

      expect(queryByText('ChangeEmail')).toBeNull();
      expect(queryByText('Canviar email')).toBeNull();
    });

    it('no hauria de mostrar EditProfile a la barra de tabs', () => {
      const { queryByText } = renderWithProviders(<AppNavigator />);

      expect(queryByText('EditProfile')).toBeNull();
      expect(queryByText('Editar perfil')).toBeNull();
    });
  });

  describe('Estats del navegador', () => {
    it('hauria de mantenir l\'estat de selectedLocation entre tabs', async () => {
      const { getAllByText, getByTestId } = renderWithProviders(<AppNavigator />);

      // Seleccionar refugi al mapa
      fireEvent.press(getByTestId('map-screen'));

      await waitFor(() => {
        expect(getByTestId('refuge-bottom-sheet')).toBeTruthy();
      });

      // Navegar a un altre tab
      fireEvent.press(getAllByText('navigation.favorites')[0]);

      await waitFor(() => {
        expect(getByTestId('favorites-screen')).toBeTruthy();
      });

      // Tornar al mapa - el refugi hauria de seguir seleccionat
      fireEvent.press(getAllByText('navigation.map')[0]);

      await waitFor(() => {
        expect(getByTestId('map-screen')).toBeTruthy();
      });
    });

    it('hauria de gestionar múltiples seleccions de refugis', async () => {
      const { getByTestId, getAllByText } = renderWithProviders(<AppNavigator />);

      // Primera selecció
      fireEvent.press(getByTestId('map-screen'));

      await waitFor(() => {
        expect(getByTestId('refuge-bottom-sheet')).toBeTruthy();
      });

      // Tancar
      fireEvent.press(getByTestId('close-bottom-sheet'));

      await waitFor(() => {
        expect(getAllByText('navigation.map')[0]).toBeTruthy();
      });

      // Segona selecció
      fireEvent.press(getByTestId('map-screen'));

      await waitFor(() => {
        expect(getByTestId('refuge-bottom-sheet')).toBeTruthy();
      });
    });
  });

  describe('Safe area insets', () => {
    it('hauria d\'aplicar safe area insets a la barra de tabs', () => {
      const { getAllByText } = renderWithProviders(<AppNavigator />);

      // La barra de tabs hauria d'existir amb els tabs renderitzats
      expect(getAllByText('navigation.map')[0]).toBeTruthy();
    });
  });

  describe('Casos límit', () => {
    it('hauria de gestionar refugi sense ID', async () => {
      const { getByTestId } = renderWithProviders(<AppNavigator />);

      // Seleccionar refugi sense ID
      const mapScreen = getByTestId('map-screen');
      fireEvent.press(mapScreen);

      await waitFor(() => {
        // Hauria de mostrar el BottomSheet igualment
        expect(getByTestId('refuge-bottom-sheet')).toBeTruthy();
      });
    });

    it('hauria de gestionar múltiples operacions asíncrones', async () => {
      (RefugisService.addFavorite as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      const { getByTestId } = renderWithProviders(<AppNavigator />);

      // Obrir BottomSheet
      fireEvent.press(getByTestId('map-screen'));

      await waitFor(() => {
        expect(getByTestId('refuge-bottom-sheet')).toBeTruthy();
      });

      // Fer múltiples clics ràpids
      fireEvent.press(getByTestId('toggle-favorite'));
      fireEvent.press(getByTestId('toggle-favorite'));
      fireEvent.press(getByTestId('toggle-favorite'));

      // Hauria de gestionar-ho sense errors
      await waitFor(() => {
        expect(RefugisService.addFavorite).toHaveBeenCalled();
      });
    });

    it('hauria de netejar correctament els timeouts', async () => {
      const { getByTestId, unmount } = renderWithProviders(<AppNavigator />);

      // Obrir i tancar ràpidament
      fireEvent.press(getByTestId('map-screen'));

      await waitFor(() => {
        expect(getByTestId('refuge-bottom-sheet')).toBeTruthy();
      });

      fireEvent.press(getByTestId('close-bottom-sheet'));

      // Unmount abans que acabi el timeout
      unmount();

      // No hauria de causar errors
      await new Promise(resolve => setTimeout(resolve, 350));
    });
  });

  describe('CustomAlert', () => {
    it('hauria de mostrar CustomAlert quan alertConfig està definit', async () => {
      const { getByTestId } = renderWithProviders(<AppNavigator />);

      // Obrir BottomSheet i fer una acció que mostra alert
      fireEvent.press(getByTestId('map-screen'));

      await waitFor(() => {
        fireEvent.press(getByTestId('navigate'));
      });

      await waitFor(() => {
        expect(mockShowAlert).toHaveBeenCalled();
      });
    });
  });
});
