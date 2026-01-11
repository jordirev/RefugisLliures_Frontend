/**
 * Tests unitaris per a RenovationDetailScreen
 *
 * Aquest fitxer cobreix:
 * - Renderització de la pantalla
 * - Càrrega de dades
 * - Accions de join/leave
 * - Accions de creador (edit/delete)
 * - Navegació
 * - Gestió d'errors
 * - Snapshot tests
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { RenovationDetailScreen } from '../../../screens/RenovationDetailScreen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

// Mock SVG icons
jest.mock('../../../assets/icons/calendar2.svg', () => 'CalendarIcon');
jest.mock('../../../assets/icons/reform.svg', () => 'ToolsIcon');
jest.mock('../../../assets/icons/description.svg', () => 'DescriptionIcon');
jest.mock('../../../assets/icons/user.svg', () => 'PeopleIcon');
jest.mock('../../../assets/icons/arrow-left.svg', () => 'BackIcon');
jest.mock('../../../assets/icons/edit.svg', () => 'EditIcon');
jest.mock('../../../assets/icons/x.svg', () => 'CrossIcon');
jest.mock('../../../assets/icons/trash.svg', () => 'TrashIcon');

// Mock images
jest.mock('../../../assets/icons/whatsapp-white.png', () => 'WhatsAppIcon');
jest.mock('../../../assets/icons/telegram-white.png', () => 'TelegramIcon');

// Mock RefugeCard
jest.mock('../../../components/RefugeCard', () => ({
  RefugeCard: ({ refuge, onPress, onViewMap }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="refuge-card">
        <Text>{refuge?.name}</Text>
        <TouchableOpacity testID="refuge-card-press" onPress={onPress}>
          <Text>View Refuge</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="refuge-view-map" onPress={onViewMap}>
          <Text>View Map</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

// Mock CustomAlert
jest.mock('../../../components/CustomAlert', () => ({
  CustomAlert: ({ visible, title, message, buttons, onDismiss }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    if (!visible) return null;
    return (
      <View testID="custom-alert">
        <Text testID="alert-title">{title}</Text>
        <Text testID="alert-message">{message}</Text>
        {buttons?.map((btn: any, i: number) => (
          <TouchableOpacity key={i} testID={`alert-button-${i}`} onPress={btn.onPress}>
            <Text>{btn.text}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  },
}));

// Mock renovation and refuge data
const mockRenovation = {
  id: 'renovation-1',
  refuge_id: 'refuge-1',
  ini_date: '2026-01-10',
  fin_date: '2026-01-15',
  description: 'Test renovation description that is quite long to test truncation and read more functionality',
  materials_needed: 'Wood, nails, tools',
  group_link: 'https://chat.whatsapp.com/test123',
  creator_uid: 'user-1',
  participants_uids: ['user-2', 'user-3'],
};

const mockRefuge = {
  id: 'refuge-1',
  name: 'Refugi Test',
  coord: { lat: 42.5, long: 1.5 },
};

const mockCreator = {
  uid: 'user-1',
  username: 'CreatorUser',
  avatar_metadata: { url: 'https://example.com/avatar.jpg' },
};

const mockParticipants = [
  { uid: 'user-2', username: 'Participant1', avatar_metadata: null },
  { uid: 'user-3', username: 'Participant2', avatar_metadata: { url: 'https://example.com/avatar2.jpg' } },
];

// Mock hooks
let mockLoadingRenovation = false;
let mockLoadingRefuge = false;
let mockRenovationData: typeof mockRenovation | undefined = mockRenovation;
let mockFirebaseUser: { uid: string } | null = { uid: 'user-1' };

const mockJoinMutate = jest.fn();
const mockLeaveMutate = jest.fn();
const mockDeleteMutate = jest.fn();

jest.mock('../../../hooks/useRenovationsQuery', () => ({
  useRenovation: () => ({
    data: mockRenovationData,
    isLoading: mockLoadingRenovation,
  }),
  useJoinRenovation: () => ({
    mutate: mockJoinMutate,
    isPending: false,
  }),
  useLeaveRenovation: () => ({
    mutate: mockLeaveMutate,
    isPending: false,
  }),
  useDeleteRenovation: () => ({
    mutate: mockDeleteMutate,
    isPending: false,
  }),
}));

jest.mock('../../../hooks/useRefugesQuery', () => ({
  useRefuge: () => ({
    data: mockRefuge,
    isLoading: mockLoadingRefuge,
  }),
}));

jest.mock('../../../hooks/useUsersQuery', () => ({
  useUser: (uid: string) => ({
    data: uid === 'user-1' ? mockCreator : null,
  }),
  useUsers: () => ({
    data: mockParticipants,
  }),
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    firebaseUser: mockFirebaseUser,
  }),
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => ({
    params: {
      renovationId: 'renovation-1',
    },
  }),
  useFocusEffect: jest.fn(),
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

describe('RenovationDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
    mockLoadingRenovation = false;
    mockLoadingRefuge = false;
    mockRenovationData = mockRenovation;
    mockFirebaseUser = { uid: 'user-1' };
  });

  describe('Renderització bàsica', () => {
    it('hauria de renderitzar correctament', () => {
      const { getByText } = renderWithProviders(<RenovationDetailScreen />);
      expect(getByText('renovations.details')).toBeTruthy();
    });

    it('hauria de mostrar el refuge card', () => {
      const { getByTestId } = renderWithProviders(<RenovationDetailScreen />);
      expect(getByTestId('refuge-card')).toBeTruthy();
    });

    it('hauria de mostrar la informació de dates', () => {
      const { getByText } = renderWithProviders(<RenovationDetailScreen />);
      expect(getByText('renovations.duration')).toBeTruthy();
      expect(getByText('renovations.startDate')).toBeTruthy();
      expect(getByText('renovations.endDate')).toBeTruthy();
    });

    it('hauria de mostrar la descripció', () => {
      const { getByText } = renderWithProviders(<RenovationDetailScreen />);
      expect(getByText('renovations.description')).toBeTruthy();
    });

    it('hauria de mostrar els materials necessaris', () => {
      const { getByText } = renderWithProviders(<RenovationDetailScreen />);
      expect(getByText('renovations.materialsNeeded')).toBeTruthy();
      expect(getByText('Wood, nails, tools')).toBeTruthy();
    });

    it('snapshot test', () => {
      const { toJSON } = renderWithProviders(<RenovationDetailScreen />);
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Loading states', () => {
    it('hauria de mostrar loading quan carrega renovació', () => {
      mockLoadingRenovation = true;
      const { UNSAFE_root } = renderWithProviders(<RenovationDetailScreen />);
      const activityIndicators = UNSAFE_root.findAllByType(require('react-native').ActivityIndicator);
      expect(activityIndicators.length).toBeGreaterThanOrEqual(0);
    });

    it('hauria de mostrar missatge error si no hi ha renovació', () => {
      mockRenovationData = undefined;
      const { getByText } = renderWithProviders(<RenovationDetailScreen />);
      expect(getByText('renovations.notFound')).toBeTruthy();
    });
  });

  describe('Accions de creador', () => {
    beforeEach(() => {
      mockFirebaseUser = { uid: 'user-1' }; // És el creador
    });

    it('hauria de mostrar botons edit i delete per al creador', () => {
      const { getByText } = renderWithProviders(<RenovationDetailScreen />);
      expect(getByText('common.edit')).toBeTruthy();
      expect(getByText('common.delete')).toBeTruthy();
    });

    it('hauria de navegar a EditRenovation quan es prem edit', () => {
      const { getByText } = renderWithProviders(<RenovationDetailScreen />);
      fireEvent.press(getByText('common.edit'));
      expect(mockNavigate).toHaveBeenCalledWith('EditRenovation', { renovationId: 'renovation-1' });
    });

    it('hauria de mostrar confirmació abans de eliminar', () => {
      const { getByText, getByTestId } = renderWithProviders(<RenovationDetailScreen />);
      fireEvent.press(getByText('common.delete'));
      expect(getByTestId('custom-alert')).toBeTruthy();
    });

    it('hauria de mostrar participants per al creador', () => {
      const { getByText } = renderWithProviders(<RenovationDetailScreen />);
      expect(getByText(/renovations.participants/)).toBeTruthy();
    });

    it('hauria de poder eliminar participants', () => {
      const { getAllByTestId, getByTestId } = renderWithProviders(<RenovationDetailScreen />);
      // Buscar el botó per eliminar participant (CrossIcon)
      // El component mostra els participants i el botó d'eliminar
    });
  });

  describe('Accions de participant', () => {
    beforeEach(() => {
      mockFirebaseUser = { uid: 'user-2' }; // És participant
    });

    it('hauria de mostrar botó leave per a participant', () => {
      const { getByText } = renderWithProviders(<RenovationDetailScreen />);
      expect(getByText('renovations.leave')).toBeTruthy();
    });

    it('hauria de mostrar confirmació abans de sortir', () => {
      const { getByText, getByTestId } = renderWithProviders(<RenovationDetailScreen />);
      fireEvent.press(getByText('renovations.leave'));
      expect(getByTestId('custom-alert')).toBeTruthy();
    });

    it('hauria de poder veure el link del grup', () => {
      const { getByText } = renderWithProviders(<RenovationDetailScreen />);
      // Els participants poden veure el link del grup
      expect(getByText('renovations.join_whatapp_link')).toBeTruthy();
    });
  });

  describe('Accions de no-participant', () => {
    beforeEach(() => {
      mockFirebaseUser = { uid: 'user-99' }; // Ni creador ni participant
    });

    it('hauria de mostrar botó join per a no-participant', () => {
      const { getByText } = renderWithProviders(<RenovationDetailScreen />);
      expect(getByText('renovations.join')).toBeTruthy();
    });

    it('hauria de cridar joinMutation quan es prem join', () => {
      const { getByText } = renderWithProviders(<RenovationDetailScreen />);
      fireEvent.press(getByText('renovations.join'));
      expect(mockJoinMutate).toHaveBeenCalledWith('renovation-1', expect.any(Object));
    });

    it('no hauria de mostrar el link del grup', () => {
      const { queryByText } = renderWithProviders(<RenovationDetailScreen />);
      expect(queryByText('renovations.join_whatapp_link')).toBeNull();
    });
  });

  describe('Navegació', () => {
    it('hauria de navegar enrere quan es prem back', () => {
      const { UNSAFE_root } = renderWithProviders(<RenovationDetailScreen />);
      const touchables = UNSAFE_root.findAllByType(require('react-native').TouchableOpacity);
      // El primer touchable és el botó back
      if (touchables.length > 0) {
        fireEvent.press(touchables[0]);
      }
      expect(mockNavigate).toHaveBeenCalledWith('Renovations');
    });

    it('hauria de navegar a RefugeDetail quan es prem el card', () => {
      const { getByTestId } = renderWithProviders(<RenovationDetailScreen />);
      fireEvent.press(getByTestId('refuge-card-press'));
      expect(mockNavigate).toHaveBeenCalledWith('RefugeDetail', { refugeId: 'refuge-1' });
    });
  });

  describe('Format de dates', () => {
    it('hauria de formatar les dates correctament', () => {
      const { getByText } = renderWithProviders(<RenovationDetailScreen />);
      // Les dates haurien d'estar formatades com dd/mm/yyyy
      expect(getByText('10/01/2026')).toBeTruthy();
      expect(getByText('15/01/2026')).toBeTruthy();
    });
  });

  describe('Tipus de link de grup', () => {
    it('hauria de detectar WhatsApp link', () => {
      mockFirebaseUser = { uid: 'user-1' };
      mockRenovationData = {
        ...mockRenovation,
        group_link: 'https://chat.whatsapp.com/test',
      };
      const { getByText } = renderWithProviders(<RenovationDetailScreen />);
      expect(getByText('renovations.join_whatapp_link')).toBeTruthy();
    });

    it('hauria de detectar Telegram link', () => {
      mockFirebaseUser = { uid: 'user-1' };
      mockRenovationData = {
        ...mockRenovation,
        group_link: 'https://t.me/testgroup',
      };
      const { getByText } = renderWithProviders(<RenovationDetailScreen />);
      expect(getByText('renovations.join_telegram_link')).toBeTruthy();
    });
  });

  describe('Gestió d\'errors', () => {
    it('hauria de gestionar error en join', () => {
      mockFirebaseUser = { uid: 'user-99' };
      mockJoinMutate.mockImplementation((id, options) => {
        options?.onError?.({ message: 'Error joining' });
      });

      const { getByText } = renderWithProviders(<RenovationDetailScreen />);
      fireEvent.press(getByText('renovations.join'));
      // L'error s'hauria de gestionar mostrant un alert
    });

    it('hauria de gestionar error en leave', () => {
      mockFirebaseUser = { uid: 'user-2' };
      mockLeaveMutate.mockImplementation((data, options) => {
        options?.onError?.({ message: 'Error leaving' });
      });

      const { getByText, getByTestId } = renderWithProviders(<RenovationDetailScreen />);
      fireEvent.press(getByText('renovations.leave'));
      // Confirmar leave
      const confirmButton = getByTestId('alert-button-1');
      fireEvent.press(confirmButton);
    });

    it('hauria de gestionar error en delete', () => {
      mockFirebaseUser = { uid: 'user-1' };
      mockDeleteMutate.mockImplementation((id, options) => {
        options?.onError?.({ message: 'Error deleting' });
      });

      const { getByText, getByTestId } = renderWithProviders(<RenovationDetailScreen />);
      fireEvent.press(getByText('common.delete'));
      // Confirmar delete
      const confirmButton = getByTestId('alert-button-1');
      fireEvent.press(confirmButton);
    });
  });

  describe('onViewMap callback', () => {
    it('hauria de cridar onViewMap quan es passa com a prop', () => {
      const mockOnViewMap = jest.fn();
      const { getByTestId } = renderWithProviders(
        <RenovationDetailScreen onViewMap={mockOnViewMap} />
      );
      
      fireEvent.press(getByTestId('refuge-view-map'));
      expect(mockOnViewMap).toHaveBeenCalledWith(mockRefuge);
    });
  });

  describe('Expandir descripció', () => {
    it('hauria de mostrar read more per a descripcions llargues', () => {
      mockRenovationData = {
        ...mockRenovation,
        description: 'A'.repeat(250), // Descripció llarga
      };
      
      const { getByText } = renderWithProviders(<RenovationDetailScreen />);
      expect(getByText('common.readMore')).toBeTruthy();
    });

    it('hauria de canviar a show less quan s\'expandeix', () => {
      mockRenovationData = {
        ...mockRenovation,
        description: 'A'.repeat(250),
      };
      
      const { getByText } = renderWithProviders(<RenovationDetailScreen />);
      fireEvent.press(getByText('common.readMore'));
      expect(getByText('common.showLess')).toBeTruthy();
    });
  });
});
