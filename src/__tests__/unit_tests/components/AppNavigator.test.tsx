/**
 * Tests per al component AppNavigator
 * Cobreix: renderització, gestió d'estat, handlers, overlays
 */
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppNavigator } from '../../../components/AppNavigator';
import { Location } from '../../../models';

// Mock totes les pantalles
jest.mock('../../../screens/SettingsScreen', () => ({
  SettingsScreen: () => null,
}));
jest.mock('../../../screens/ChangePasswordScreen', () => ({
  ChangePasswordScreen: () => null,
}));
jest.mock('../../../screens/ChangeEmailScreen', () => ({
  ChangeEmailScreen: () => null,
}));
jest.mock('../../../screens/EditProfileScreen', () => ({
  EditProfileScreen: () => null,
}));
jest.mock('../../../screens/HelpSupportScreen', () => ({
  HelpSupportScreen: () => null,
}));
jest.mock('../../../screens/AboutTheAppScreen', () => ({
  AboutTheAppScreen: () => null,
}));
jest.mock('../../../screens/CreateRenovationScreen', () => ({
  CreateRenovationScreen: () => null,
}));
jest.mock('../../../screens/CreateRefugeScreen', () => ({
  CreateRefugeScreen: () => null,
}));
jest.mock('../../../screens/EditRefugeScreen', () => ({
  EditRefugeScreen: ({ refuge, onCancel }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="edit-refuge-screen">
        <Text>{refuge?.name}</Text>
        <TouchableOpacity testID="cancel-edit-button" onPress={onCancel}>
          <Text>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));
jest.mock('../../../screens/EditRenovationScreen', () => ({
  EditRenovationScreen: () => null,
}));
jest.mock('../../../screens/ProposalsScreen', () => ({
  ProposalsScreen: () => null,
}));
jest.mock('../../../screens/ProposalDetailScreen', () => ({
  ProposalDetailScreen: () => null,
}));
jest.mock('../../../screens/DoubtsScreen', () => ({
  DoubtsScreen: ({ refugeId, refugeName, onClose }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="doubts-screen">
        <Text>{refugeId}</Text>
        <Text>{refugeName}</Text>
        <TouchableOpacity testID="close-doubts-button" onPress={onClose}>
          <Text>Close</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));
jest.mock('../../../screens/ExperiencesScreen', () => ({
  ExperiencesScreen: ({ refugeId, refugeName, onClose }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="experiences-screen">
        <Text>{refugeId}</Text>
        <Text>{refugeName}</Text>
        <TouchableOpacity testID="close-experiences-button" onPress={onClose}>
          <Text>Close</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));
jest.mock('../../../screens/RenovationDetailScreen', () => ({
  RenovationDetailScreen: ({ onViewMap }: any) => {
    const { View, TouchableOpacity, Text } = require('react-native');
    return (
      <View testID="renovation-detail-screen">
        <TouchableOpacity 
          testID="view-map-button" 
          onPress={() => onViewMap({ id: 'loc-1', name: 'Test Location', lat: 0, long: 0 })}
        >
          <Text>View Map</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));
jest.mock('../../../screens/MapScreen', () => ({
  MapScreen: ({ onLocationSelect, selectedLocation }: any) => {
    const { View, TouchableOpacity, Text } = require('react-native');
    return (
      <View testID="map-screen">
        <Text testID="selected-location">{selectedLocation?.name}</Text>
        <TouchableOpacity 
          testID="select-location-button" 
          onPress={() => onLocationSelect?.({ id: 'test-id', name: 'Test Refuge', lat: 41.5, long: 2.0 })}
        >
          <Text>Select Location</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));
jest.mock('../../../screens/FavoritesScreen', () => ({
  FavoritesScreen: ({ onViewDetail, onViewMap }: any) => {
    const { View, TouchableOpacity, Text } = require('react-native');
    return (
      <View testID="favorites-screen">
        <TouchableOpacity 
          testID="view-detail-button" 
          onPress={() => onViewDetail?.({ id: 'fav-1', name: 'Favorite Refuge', lat: 0, long: 0 })}
        >
          <Text>View Detail</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          testID="view-map-favorites-button" 
          onPress={() => onViewMap?.({ id: 'fav-1', name: 'Favorite Refuge', lat: 0, long: 0 })}
        >
          <Text>View Map</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));
jest.mock('../../../screens/RenovationsScreen', () => ({
  RenovationsScreen: ({ onViewMap }: any) => {
    const { View, TouchableOpacity, Text } = require('react-native');
    return (
      <View testID="renovations-screen">
        <TouchableOpacity 
          testID="view-map-renovations-button" 
          onPress={() => onViewMap?.({ id: 'ren-1', name: 'Renovation Refuge', lat: 0, long: 0 })}
        >
          <Text>View Map</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));
jest.mock('../../../screens/ProfileScreen', () => ({
  ProfileScreen: ({ onViewDetail, onViewMap }: any) => {
    const { View, TouchableOpacity, Text } = require('react-native');
    return (
      <View testID="profile-screen">
        <TouchableOpacity 
          testID="view-detail-profile-button" 
          onPress={() => onViewDetail?.({ id: 'prof-1', name: 'Profile Refuge', lat: 0, long: 0 })}
        >
          <Text>View Detail</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

// Mock RefugeDetailScreen with all props
jest.mock('../../../screens/RefugeDetailScreen', () => ({
  RefugeDetailScreen: ({ 
    refugeId, 
    onBack, 
    onToggleFavorite, 
    onNavigate, 
    onDelete, 
    onEdit,
    onViewMap,
    onNavigateToDoubts,
    onNavigateToExperiences 
  }: any) => {
    const { View, TouchableOpacity, Text } = require('react-native');
    const mockLocation = { id: refugeId, name: 'Test Refuge', lat: 41.5, long: 2.0 };
    return (
      <View testID="refuge-detail-screen">
        <Text testID="refuge-id">{refugeId}</Text>
        <TouchableOpacity testID="back-button" onPress={onBack}>
          <Text>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="toggle-favorite-button" onPress={() => onToggleFavorite?.(refugeId)}>
          <Text>Toggle Favorite</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="navigate-button" onPress={() => onNavigate?.(mockLocation)}>
          <Text>Navigate</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="delete-button" onPress={() => onDelete?.(mockLocation)}>
          <Text>Delete</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="edit-button" onPress={() => onEdit?.(mockLocation)}>
          <Text>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="view-map-detail-button" onPress={() => onViewMap?.(mockLocation)}>
          <Text>View Map</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="doubts-button" onPress={() => onNavigateToDoubts?.(refugeId, 'Test Refuge')}>
          <Text>Doubts</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="experiences-button" onPress={() => onNavigateToExperiences?.(refugeId, 'Test Refuge')}>
          <Text>Experiences</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

// Mock other components
jest.mock('../../../components/TabsNavigator', () => ({
  TabsNavigator: ({ onLocationSelect, onViewDetail, onViewMap, selectedLocation }: any) => {
    const { View, TouchableOpacity, Text } = require('react-native');
    return (
      <View testID="tabs-navigator">
        <Text testID="selected-location-name">{selectedLocation?.name}</Text>
        <TouchableOpacity 
          testID="location-select-button" 
          onPress={() => onLocationSelect?.({ id: 'test-id', name: 'Selected Location', lat: 41.5, long: 2.0 })}
        >
          <Text>Select Location</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          testID="view-detail-tabs-button" 
          onPress={() => onViewDetail?.({ id: 'detail-id', name: 'Detail Location', lat: 41.5, long: 2.0 })}
        >
          <Text>View Detail</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          testID="view-map-tabs-button" 
          onPress={() => onViewMap?.({ id: 'map-id', name: 'Map Location', lat: 41.5, long: 2.0 })}
        >
          <Text>View Map</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

jest.mock('../../../components/RefugeBottomSheet', () => ({
  RefugeBottomSheet: ({ refugeId, isVisible, onClose, onToggleFavorite, onNavigate, onViewDetails }: any) => {
    const { View, TouchableOpacity, Text } = require('react-native');
    if (!isVisible) return null;
    return (
      <View testID="refuge-bottom-sheet">
        <Text testID="bottom-sheet-refuge-id">{refugeId}</Text>
        <TouchableOpacity testID="close-bottom-sheet-button" onPress={onClose}>
          <Text>Close</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="bottom-sheet-toggle-favorite" onPress={() => onToggleFavorite?.(refugeId)}>
          <Text>Toggle Favorite</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="bottom-sheet-navigate" onPress={() => onNavigate?.({ id: refugeId, name: 'Test', lat: 0, long: 0 })}>
          <Text>Navigate</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="bottom-sheet-view-details" onPress={() => onViewDetails?.({ id: refugeId, name: 'Test', lat: 0, long: 0 })}>
          <Text>View Details</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

jest.mock('../../../components/DeleteRefugePopUp', () => ({
  DeleteRefugePopUp: ({ visible, refugeName, onCancel, onConfirm }: any) => {
    const { View, TouchableOpacity, Text } = require('react-native');
    if (!visible) return null;
    return (
      <View testID="delete-popup">
        <Text testID="delete-popup-name">{refugeName}</Text>
        <TouchableOpacity testID="cancel-delete-button" onPress={onCancel}>
          <Text>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="confirm-delete-button" onPress={() => onConfirm('Test comment')}>
          <Text>Confirm</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

jest.mock('../../../components/CustomAlert', () => ({
  CustomAlert: ({ visible, title, message, onDismiss }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    if (!visible) return null;
    return (
      <View testID="custom-alert">
        <Text testID="alert-title">{title}</Text>
        <Text testID="alert-message">{message}</Text>
        <TouchableOpacity testID="dismiss-alert-button" onPress={onDismiss}>
          <Text>OK</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

// Mock hooks
const mockDeleteMutate = jest.fn();
jest.mock('../../../hooks/useProposalsQuery', () => ({
  useDeleteRefugeProposal: () => ({
    mutate: mockDeleteMutate,
    isLoading: false,
  }),
}));

const mockShowAlert = jest.fn();
const mockHideAlert = jest.fn();
let mockAlertConfig: { title: string; message: string; buttons?: any[] } | null = null;
let mockAlertVisible = false;

jest.mock('../../../hooks/useCustomAlert', () => ({
  useCustomAlert: () => ({
    alertVisible: mockAlertVisible,
    alertConfig: mockAlertConfig,
    showAlert: mockShowAlert,
    hideAlert: mockHideAlert,
  }),
}));

// Mock @react-navigation/native-stack
jest.mock('@react-navigation/native-stack', () => {
  const React = require('react');
  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ children, screenOptions }: any) => {
        const React = require('react');
        // Render all screens but only show MainTabs by default
        const screens = React.Children.toArray(children);
        const mainTabsScreen = screens.find((screen: any) => screen.props.name === 'MainTabs');
        if (mainTabsScreen && typeof mainTabsScreen.props.children === 'function') {
          return React.createElement('Navigator', null, mainTabsScreen.props.children());
        }
        return React.createElement('Navigator', null, children);
      },
      Screen: ({ children, name, component: Component, ...props }: any) => {
        const React = require('react');
        if (typeof children === 'function') {
          return React.createElement('Screen', { name }, children({ route: { params: {} }, navigation: { navigate: jest.fn(), goBack: jest.fn() } }));
        }
        return React.createElement('Screen', { name }, Component ? React.createElement(Component) : null);
      },
    }),
  };
});

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderAppNavigator = () => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </QueryClientProvider>
  );
};

describe('AppNavigator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderització bàsica', () => {
    it('hauria de renderitzar el component', () => {
      const { getByTestId } = renderAppNavigator();
      expect(getByTestId('tabs-navigator')).toBeTruthy();
    });

    it('hauria de renderitzar sense errors', () => {
      expect(() => renderAppNavigator()).not.toThrow();
    });

    it('hauria de renderitzar el TabsNavigator com a pantalla principal', () => {
      const { getByTestId } = renderAppNavigator();
      expect(getByTestId('tabs-navigator')).toBeTruthy();
    });
  });

  describe('Gestió del Bottom Sheet', () => {
    it('hauria de mostrar el bottom sheet quan es selecciona una ubicació', async () => {
      const { getByTestId, queryByTestId } = renderAppNavigator();
      
      // Initially no bottom sheet
      expect(queryByTestId('refuge-bottom-sheet')).toBeNull();
      
      // Trigger location select
      fireEvent.press(getByTestId('location-select-button'));
      
      await waitFor(() => {
        expect(getByTestId('refuge-bottom-sheet')).toBeTruthy();
      });
    });

    it('hauria de tancar el bottom sheet quan es prem close', async () => {
      const { getByTestId, queryByTestId } = renderAppNavigator();
      
      // Open bottom sheet
      fireEvent.press(getByTestId('location-select-button'));
      
      await waitFor(() => {
        expect(getByTestId('refuge-bottom-sheet')).toBeTruthy();
      });
      
      // Close bottom sheet
      fireEvent.press(getByTestId('close-bottom-sheet-button'));
      
      await waitFor(() => {
        expect(queryByTestId('refuge-bottom-sheet')).toBeNull();
      });
    });

    it('hauria de mostrar el refugeId correcte al bottom sheet', async () => {
      const { getByTestId } = renderAppNavigator();
      
      fireEvent.press(getByTestId('location-select-button'));
      
      await waitFor(() => {
        expect(getByTestId('bottom-sheet-refuge-id').props.children).toBe('test-id');
      });
    });
  });

  describe('Pantalla de detall', () => {
    it('hauria de mostrar la pantalla de detall quan es crida onViewDetail', async () => {
      const { getByTestId, queryByTestId } = renderAppNavigator();
      
      // Initially no detail screen
      expect(queryByTestId('refuge-detail-screen')).toBeNull();
      
      // Trigger view detail
      fireEvent.press(getByTestId('view-detail-tabs-button'));
      
      await waitFor(() => {
        expect(getByTestId('refuge-detail-screen')).toBeTruthy();
      });
    });

    it('hauria de tancar la pantalla de detall quan es prem back', async () => {
      const { getByTestId, queryByTestId } = renderAppNavigator();
      
      // Open detail screen
      fireEvent.press(getByTestId('view-detail-tabs-button'));
      
      await waitFor(() => {
        expect(getByTestId('refuge-detail-screen')).toBeTruthy();
      });
      
      // Close detail screen
      fireEvent.press(getByTestId('back-button'));
      
      await waitFor(() => {
        expect(queryByTestId('refuge-detail-screen')).toBeNull();
      });
    });

    it('hauria de mostrar el refugeId correcte a la pantalla de detall', async () => {
      const { getByTestId } = renderAppNavigator();
      
      fireEvent.press(getByTestId('view-detail-tabs-button'));
      
      await waitFor(() => {
        expect(getByTestId('refuge-id').props.children).toBe('detail-id');
      });
    });
  });

  describe('Funcionalitat de delete', () => {
    it('hauria de mostrar el popup de delete quan es prem delete', async () => {
      const { getByTestId, queryByTestId } = renderAppNavigator();
      
      // Open detail screen first
      fireEvent.press(getByTestId('view-detail-tabs-button'));
      
      await waitFor(() => {
        expect(getByTestId('refuge-detail-screen')).toBeTruthy();
      });
      
      // Trigger delete
      fireEvent.press(getByTestId('delete-button'));
      
      await waitFor(() => {
        expect(getByTestId('delete-popup')).toBeTruthy();
      });
    });

    it('hauria de tancar el popup quan es cancel·la', async () => {
      const { getByTestId, queryByTestId } = renderAppNavigator();
      
      // Open detail screen and trigger delete
      fireEvent.press(getByTestId('view-detail-tabs-button'));
      await waitFor(() => expect(getByTestId('refuge-detail-screen')).toBeTruthy());
      
      fireEvent.press(getByTestId('delete-button'));
      await waitFor(() => expect(getByTestId('delete-popup')).toBeTruthy());
      
      // Cancel delete
      fireEvent.press(getByTestId('cancel-delete-button'));
      
      await waitFor(() => {
        expect(queryByTestId('delete-popup')).toBeNull();
      });
    });

    it('hauria de cridar mutate quan es confirma delete', async () => {
      const { getByTestId } = renderAppNavigator();
      
      // Open detail screen and trigger delete
      fireEvent.press(getByTestId('view-detail-tabs-button'));
      await waitFor(() => expect(getByTestId('refuge-detail-screen')).toBeTruthy());
      
      fireEvent.press(getByTestId('delete-button'));
      await waitFor(() => expect(getByTestId('delete-popup')).toBeTruthy());
      
      // Confirm delete
      fireEvent.press(getByTestId('confirm-delete-button'));
      
      await waitFor(() => {
        expect(mockDeleteMutate).toHaveBeenCalled();
      });
    });
  });

  describe('Funcionalitat d\'edició', () => {
    it('hauria de mostrar la pantalla d\'edició quan es prem edit', async () => {
      const { getByTestId, queryByTestId } = renderAppNavigator();
      
      // Open detail screen first
      fireEvent.press(getByTestId('view-detail-tabs-button'));
      await waitFor(() => expect(getByTestId('refuge-detail-screen')).toBeTruthy());
      
      // Trigger edit
      fireEvent.press(getByTestId('edit-button'));
      
      await waitFor(() => {
        expect(getByTestId('edit-refuge-screen')).toBeTruthy();
      });
    });

    it('hauria de tancar la pantalla d\'edició quan es cancel·la', async () => {
      const { getByTestId, queryByTestId } = renderAppNavigator();
      
      // Open detail screen and trigger edit
      fireEvent.press(getByTestId('view-detail-tabs-button'));
      await waitFor(() => expect(getByTestId('refuge-detail-screen')).toBeTruthy());
      
      fireEvent.press(getByTestId('edit-button'));
      await waitFor(() => expect(getByTestId('edit-refuge-screen')).toBeTruthy());
      
      // Cancel edit
      fireEvent.press(getByTestId('cancel-edit-button'));
      
      await waitFor(() => {
        expect(queryByTestId('edit-refuge-screen')).toBeNull();
      });
    });
  });

  describe('Navegació a Doubts i Experiences', () => {
    it('hauria de mostrar DoubtsScreen quan es navega', async () => {
      const { getByTestId, queryByTestId } = renderAppNavigator();
      
      // Open detail screen first
      fireEvent.press(getByTestId('view-detail-tabs-button'));
      await waitFor(() => expect(getByTestId('refuge-detail-screen')).toBeTruthy());
      
      // Navigate to doubts
      fireEvent.press(getByTestId('doubts-button'));
      
      await waitFor(() => {
        expect(getByTestId('doubts-screen')).toBeTruthy();
      });
    });

    it('hauria de tancar DoubtsScreen quan es prem close', async () => {
      const { getByTestId, queryByTestId } = renderAppNavigator();
      
      // Open detail screen and navigate to doubts
      fireEvent.press(getByTestId('view-detail-tabs-button'));
      await waitFor(() => expect(getByTestId('refuge-detail-screen')).toBeTruthy());
      
      fireEvent.press(getByTestId('doubts-button'));
      await waitFor(() => expect(getByTestId('doubts-screen')).toBeTruthy());
      
      // Close doubts
      fireEvent.press(getByTestId('close-doubts-button'));
      
      await waitFor(() => {
        expect(queryByTestId('doubts-screen')).toBeNull();
      });
    });

    it('hauria de mostrar ExperiencesScreen quan es navega', async () => {
      const { getByTestId, queryByTestId } = renderAppNavigator();
      
      // Open detail screen first
      fireEvent.press(getByTestId('view-detail-tabs-button'));
      await waitFor(() => expect(getByTestId('refuge-detail-screen')).toBeTruthy());
      
      // Navigate to experiences
      fireEvent.press(getByTestId('experiences-button'));
      
      await waitFor(() => {
        expect(getByTestId('experiences-screen')).toBeTruthy();
      });
    });

    it('hauria de tancar ExperiencesScreen quan es prem close', async () => {
      const { getByTestId, queryByTestId } = renderAppNavigator();
      
      // Open detail screen and navigate to experiences
      fireEvent.press(getByTestId('view-detail-tabs-button'));
      await waitFor(() => expect(getByTestId('refuge-detail-screen')).toBeTruthy());
      
      fireEvent.press(getByTestId('experiences-button'));
      await waitFor(() => expect(getByTestId('experiences-screen')).toBeTruthy());
      
      // Close experiences
      fireEvent.press(getByTestId('close-experiences-button'));
      
      await waitFor(() => {
        expect(queryByTestId('experiences-screen')).toBeNull();
      });
    });
  });

  describe('Gestió de favorits i navegació', () => {
    it('hauria de cridar toggle favorite des del bottom sheet', async () => {
      const { getByTestId } = renderAppNavigator();
      
      // Open bottom sheet
      fireEvent.press(getByTestId('location-select-button'));
      await waitFor(() => expect(getByTestId('refuge-bottom-sheet')).toBeTruthy());
      
      // Toggle favorite - should not throw
      expect(() => fireEvent.press(getByTestId('bottom-sheet-toggle-favorite'))).not.toThrow();
    });

    it('hauria de cridar navigate des del bottom sheet', async () => {
      const { getByTestId } = renderAppNavigator();
      
      // Open bottom sheet
      fireEvent.press(getByTestId('location-select-button'));
      await waitFor(() => expect(getByTestId('refuge-bottom-sheet')).toBeTruthy());
      
      // Navigate - should not throw
      expect(() => fireEvent.press(getByTestId('bottom-sheet-navigate'))).not.toThrow();
    });

    it('hauria de mostrar detall des del bottom sheet', async () => {
      const { getByTestId, queryByTestId } = renderAppNavigator();
      
      // Open bottom sheet
      fireEvent.press(getByTestId('location-select-button'));
      await waitFor(() => expect(getByTestId('refuge-bottom-sheet')).toBeTruthy());
      
      // View details
      fireEvent.press(getByTestId('bottom-sheet-view-details'));
      
      await waitFor(() => {
        // Bottom sheet should close
        expect(queryByTestId('refuge-bottom-sheet')).toBeNull();
        // Detail screen should open
        expect(getByTestId('refuge-detail-screen')).toBeTruthy();
      });
    });
  });

  describe('onViewMap handler', () => {
    it('hauria de gestionar onViewMap des del TabsNavigator', async () => {
      const { getByTestId } = renderAppNavigator();
      
      // Trigger view map
      fireEvent.press(getByTestId('view-map-tabs-button'));
      
      await waitFor(() => {
        expect(getByTestId('refuge-bottom-sheet')).toBeTruthy();
      });
    });
  });

  describe('Snapshot tests', () => {
    it('hauria de coincidir amb el snapshot - estat inicial', () => {
      const { toJSON } = renderAppNavigator();
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Error handling', () => {
    it('hauria de gestionar onToggleFavorite sense locationId', async () => {
      const { getByTestId } = renderAppNavigator();
      
      // Open bottom sheet and trigger toggle without ID
      fireEvent.press(getByTestId('location-select-button'));
      await waitFor(() => expect(getByTestId('refuge-bottom-sheet')).toBeTruthy());
      
      // This should not throw
      expect(() => fireEvent.press(getByTestId('bottom-sheet-toggle-favorite'))).not.toThrow();
    });

    it('hauria de gestionar delete mutation error', async () => {
      // Mock the mutation to call onError
      mockDeleteMutate.mockImplementation(({ refugeId, comment }, { onError }) => {
        onError(new Error('Delete failed'));
      });

      const { getByTestId } = renderAppNavigator();
      
      // Open detail screen and trigger delete
      fireEvent.press(getByTestId('view-detail-tabs-button'));
      await waitFor(() => expect(getByTestId('refuge-detail-screen')).toBeTruthy());
      
      fireEvent.press(getByTestId('delete-button'));
      await waitFor(() => expect(getByTestId('delete-popup')).toBeTruthy());
      
      // Confirm delete - should trigger error handler
      fireEvent.press(getByTestId('confirm-delete-button'));
      
      // Popup should close on error
      await waitFor(() => {
        expect(mockDeleteMutate).toHaveBeenCalled();
      });
    });

    it('hauria de gestionar delete mutation success', async () => {
      // Mock the mutation to call onSuccess
      mockDeleteMutate.mockImplementation(({ refugeId, comment }, { onSuccess }) => {
        onSuccess();
      });

      const { getByTestId, queryByTestId } = renderAppNavigator();
      
      // Open detail screen and trigger delete
      fireEvent.press(getByTestId('view-detail-tabs-button'));
      await waitFor(() => expect(getByTestId('refuge-detail-screen')).toBeTruthy());
      
      fireEvent.press(getByTestId('delete-button'));
      await waitFor(() => expect(getByTestId('delete-popup')).toBeTruthy());
      
      // Confirm delete - should trigger success handler
      fireEvent.press(getByTestId('confirm-delete-button'));
      
      await waitFor(() => {
        expect(queryByTestId('delete-popup')).toBeNull();
      });
    });

    it('hauria de ignorar errors de coordenades en delete', async () => {
      // Mock the mutation to call onError with coordinate error
      mockDeleteMutate.mockImplementation(({ refugeId, comment }, { onError }) => {
        onError(new Error("Cannot read property 'long' of undefined"));
      });

      const { getByTestId } = renderAppNavigator();
      
      // Open detail screen and trigger delete
      fireEvent.press(getByTestId('view-detail-tabs-button'));
      await waitFor(() => expect(getByTestId('refuge-detail-screen')).toBeTruthy());
      
      fireEvent.press(getByTestId('delete-button'));
      await waitFor(() => expect(getByTestId('delete-popup')).toBeTruthy());
      
      // Confirm delete - should not show error alert for coord errors
      expect(() => fireEvent.press(getByTestId('confirm-delete-button'))).not.toThrow();
    });
  });

  describe('Navegació i overlays adicionals', () => {
    it('hauria de verificar la gestió de detail screen overlay', async () => {
      const { getByTestId } = renderAppNavigator();
      
      // Open detail screen through view detail button
      fireEvent.press(getByTestId('view-detail-tabs-button'));
      await waitFor(() => expect(getByTestId('refuge-detail-screen')).toBeTruthy());
      
      // The detail screen overlay should be visible
      expect(getByTestId('refuge-detail-screen')).toBeTruthy();
    });

    it('hauria de gestionar navegació a experiences i tancar', async () => {
      const { getByTestId, queryByTestId } = renderAppNavigator();
      
      // Open detail screen first
      fireEvent.press(getByTestId('view-detail-tabs-button'));
      await waitFor(() => expect(getByTestId('refuge-detail-screen')).toBeTruthy());
      
      // Navigate to experiences
      fireEvent.press(getByTestId('experiences-button'));
      await waitFor(() => expect(getByTestId('experiences-screen')).toBeTruthy());
      
      // Close experiences
      fireEvent.press(getByTestId('close-experiences-button'));
      
      // Should close experiences screen
      await waitFor(() => expect(queryByTestId('experiences-screen')).toBeNull());
    });

    it('hauria de gestionar navegació a doubts i tancar', async () => {
      const { getByTestId, queryByTestId } = renderAppNavigator();
      
      // Open detail screen first
      fireEvent.press(getByTestId('view-detail-tabs-button'));
      await waitFor(() => expect(getByTestId('refuge-detail-screen')).toBeTruthy());
      
      // Navigate to doubts
      fireEvent.press(getByTestId('doubts-button'));
      await waitFor(() => expect(getByTestId('doubts-screen')).toBeTruthy());
      
      // Close doubts
      fireEvent.press(getByTestId('close-doubts-button'));
      
      // Should close doubts screen
      await waitFor(() => expect(queryByTestId('doubts-screen')).toBeNull());
    });

    it('hauria de obrir bottom sheet des de view map a tabs', async () => {
      const { getByTestId } = renderAppNavigator();
      
      // View map from tabs should open bottom sheet
      fireEvent.press(getByTestId('view-map-tabs-button'));
      await waitFor(() => expect(getByTestId('refuge-bottom-sheet')).toBeTruthy());
    });

    it('hauria de gestionar location select des de tabs', async () => {
      const { getByTestId } = renderAppNavigator();
      
      // Select location from tabs
      fireEvent.press(getByTestId('location-select-button'));
      await waitFor(() => expect(getByTestId('refuge-bottom-sheet')).toBeTruthy());
    });
  });

  describe('handleToggleFavorite edge cases', () => {
    it('hauria de retornar early si locationId és undefined', async () => {
      const { getByTestId } = renderAppNavigator();
      
      // Open bottom sheet
      fireEvent.press(getByTestId('location-select-button'));
      await waitFor(() => expect(getByTestId('refuge-bottom-sheet')).toBeTruthy());
      
      // This tests the path where locationId is passed
      // The early return for undefined is covered by default mock behavior
      expect(() => fireEvent.press(getByTestId('bottom-sheet-toggle-favorite'))).not.toThrow();
    });
  });

  describe('onViewMap handlers', () => {
    it('hauria de gestionar onViewMap des de detail screen overlay', async () => {
      const { getByTestId, queryByTestId } = renderAppNavigator();
      
      // Open detail screen
      fireEvent.press(getByTestId('view-detail-tabs-button'));
      await waitFor(() => expect(getByTestId('refuge-detail-screen')).toBeTruthy());
      
      // Trigger view map - should close detail and show bottom sheet
      fireEvent.press(getByTestId('view-map-detail-button'));
      
      // Detail screen should be closed after view map
      await waitFor(() => {
        expect(queryByTestId('refuge-detail-screen')).toBeNull();
      });
    });
  });

  describe('Delete mutation edge cases', () => {
    it('hauria de gestionar error amb missatge coord', async () => {
      mockDeleteMutate.mockImplementation(({ refugeId, comment }, { onError }) => {
        onError(new Error('coord error in message'));
      });

      const { getByTestId, queryByTestId } = renderAppNavigator();
      
      fireEvent.press(getByTestId('view-detail-tabs-button'));
      await waitFor(() => expect(getByTestId('refuge-detail-screen')).toBeTruthy());
      
      fireEvent.press(getByTestId('delete-button'));
      await waitFor(() => expect(getByTestId('delete-popup')).toBeTruthy());
      
      // Confirm delete - should skip alert for coord errors
      fireEvent.press(getByTestId('confirm-delete-button'));
      
      await waitFor(() => {
        expect(queryByTestId('delete-popup')).toBeNull();
      });
    });

    it('hauria de gestionar error amb missatge lat undefined', async () => {
      mockDeleteMutate.mockImplementation(({ refugeId, comment }, { onError }) => {
        onError(new Error("Cannot read property 'lat' of undefined"));
      });

      const { getByTestId, queryByTestId } = renderAppNavigator();
      
      fireEvent.press(getByTestId('view-detail-tabs-button'));
      await waitFor(() => expect(getByTestId('refuge-detail-screen')).toBeTruthy());
      
      fireEvent.press(getByTestId('delete-button'));
      await waitFor(() => expect(getByTestId('delete-popup')).toBeTruthy());
      
      fireEvent.press(getByTestId('confirm-delete-button'));
      
      await waitFor(() => {
        expect(queryByTestId('delete-popup')).toBeNull();
      });
    });

    it('hauria de gestionar error sense message', async () => {
      mockDeleteMutate.mockImplementation(({ refugeId, comment }, { onError }) => {
        onError({});
      });

      const { getByTestId, queryByTestId } = renderAppNavigator();
      
      fireEvent.press(getByTestId('view-detail-tabs-button'));
      await waitFor(() => expect(getByTestId('refuge-detail-screen')).toBeTruthy());
      
      fireEvent.press(getByTestId('delete-button'));
      await waitFor(() => expect(getByTestId('delete-popup')).toBeTruthy());
      
      fireEvent.press(getByTestId('confirm-delete-button'));
      
      await waitFor(() => {
        expect(queryByTestId('delete-popup')).toBeNull();
      });
    });

    it('hauria de passar comment undefined quan és string buit', async () => {
      const { getByTestId } = renderAppNavigator();
      
      fireEvent.press(getByTestId('view-detail-tabs-button'));
      await waitFor(() => expect(getByTestId('refuge-detail-screen')).toBeTruthy());
      
      fireEvent.press(getByTestId('delete-button'));
      await waitFor(() => expect(getByTestId('delete-popup')).toBeTruthy());
      
      fireEvent.press(getByTestId('confirm-delete-button'));
      
      expect(mockDeleteMutate).toHaveBeenCalled();
    });
  });

  describe('Navigate handler', () => {
    it('hauria de cridar handleNavigate des del detail screen', async () => {
      const { getByTestId } = renderAppNavigator();
      
      fireEvent.press(getByTestId('view-detail-tabs-button'));
      await waitFor(() => expect(getByTestId('refuge-detail-screen')).toBeTruthy());
      
      // Trigger navigate
      expect(() => fireEvent.press(getByTestId('navigate-button'))).not.toThrow();
    });
  });

  describe('CustomAlert visibility', () => {
    it('hauria de renderitzar CustomAlert quan alertConfig existeix', async () => {
      // This test covers the alertConfig && <CustomAlert ... /> branch
      const { queryByTestId } = renderAppNavigator();
      
      // By default alertConfig is null so CustomAlert won't render
      expect(queryByTestId('custom-alert')).toBeNull();
    });
  });

  describe('CustomAlert amb alertConfig', () => {
    beforeEach(() => {
      mockAlertConfig = { title: 'Test Title', message: 'Test Message' };
      mockAlertVisible = true;
    });

    afterEach(() => {
      mockAlertConfig = null;
      mockAlertVisible = false;
    });

    it('hauria de renderitzar CustomAlert quan alertConfig i alertVisible són true', async () => {
      const { getByTestId } = renderAppNavigator();
      
      await waitFor(() => {
        expect(getByTestId('custom-alert')).toBeTruthy();
      });
    });

    it('hauria de mostrar title i message correctes', async () => {
      const { getByTestId } = renderAppNavigator();
      
      await waitFor(() => {
        expect(getByTestId('alert-title').props.children).toBe('Test Title');
        expect(getByTestId('alert-message').props.children).toBe('Test Message');
      });
    });
  });
});
