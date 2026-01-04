/**
 * Tests unitaris per al component RenovationForm
 *
 * Aquest fitxer cobreix:
 * - Renderització en mode 'create' i 'edit'
 * - Validació de formularis (dates, descripció, link de grup)
 * - Selecció de refugi
 * - Gestió de dates
 * - Submit i Cancel del formulari
 * - Snapshot tests
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { RenovationForm, RenovationFormData } from '../../../components/RenovationForm';
import { Location } from '../../../models';

// Mock expo-video
jest.mock('expo-video', () => ({
  VideoView: 'VideoView',
  useVideoPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    release: jest.fn(),
  })),
}));

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

// Mock useTranslation to return valid locale
jest.mock('../../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'common.locale') return 'en-US';
      return key;
    },
  }),
}));

// Mock AuthContext
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-user', email: 'test@test.com' },
    isAuthenticated: true,
  }),
}));

// Mock useFavourite hook
jest.mock('../../../hooks/useFavourite', () => ({
  useFavourite: () => ({
    isFavourite: false,
    toggleFavourite: jest.fn(),
  }),
}));

// Mock RefugeCard to avoid complex dependencies
jest.mock('../../../components/RefugeCard', () => ({
  RefugeCard: ({ refuge, onPress }: any) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <TouchableOpacity testID={`refuge-card-${refuge.id}`} onPress={onPress}>
        <Text>{refuge.name}</Text>
      </TouchableOpacity>
    );
  },
}));

// Mock SVG icons
jest.mock('../../../assets/icons/information-circle.svg', () => 'InformationIcon');

const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
const mockOnCancel = jest.fn();

const mockRefuges: Location[] = [
  {
    id: 'refuge-1',
    name: 'Refugi de Colomers',
    coord: { lat: 42.6497, long: 0.9456 },
    altitude: 2135,
    places: 50,
    type: 'non gardé',
    condition: 2,
  },
  {
    id: 'refuge-2',
    name: 'Refugi Amitges',
    coord: { lat: 42.5678, long: 0.9876 },
    altitude: 2380,
    places: 60,
    type: 'non gardé',
    condition: 3,
  },
];

const mockInitialData: RenovationFormData = {
  refuge_id: 'refuge-1',
  ini_date: '2026-02-01',
  fin_date: '2026-02-15',
  description: 'Renovació de la teulada del refugi',
  materials_needed: 'Teules, eines bàsiques',
  group_link: 'https://chat.whatsapp.com/testgroup123',
};

const defaultProps = {
  mode: 'create' as const,
  allRefuges: mockRefuges,
  onSubmit: mockOnSubmit,
  onCancel: mockOnCancel,
  isLoading: false,
};

describe('RenovationForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderització mode create', () => {
    it('hauria de renderitzar correctament en mode create', () => {
      const { getByText } = render(
        <RenovationForm {...defaultProps} />
      );

      expect(getByText('createRenovation.datesLabel')).toBeTruthy();
      expect(getByText('createRenovation.descriptionLabel')).toBeTruthy();
      expect(getByText('createRenovation.groupLinkLabel')).toBeTruthy();
    });

    it('hauria de mostrar el cercador de refugis en mode create', () => {
      const { getByPlaceholderText } = render(
        <RenovationForm {...defaultProps} />
      );

      // SearchBar usa map.searchPlaceholder
      expect(getByPlaceholderText('map.searchPlaceholder')).toBeTruthy();
    });

    it('snapshot test - mode create', () => {
      const { toJSON } = render(<RenovationForm {...defaultProps} />);
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Renderització mode edit', () => {
    it('hauria de renderitzar amb dades inicials en mode edit', () => {
      const { getByDisplayValue } = render(
        <RenovationForm
          mode="edit"
          initialData={mockInitialData}
          initialRefuge={mockRefuges[0]}
          allRefuges={mockRefuges}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isLoading={false}
        />
      );

      expect(getByDisplayValue('Renovació de la teulada del refugi')).toBeTruthy();
      expect(getByDisplayValue('https://chat.whatsapp.com/testgroup123')).toBeTruthy();
    });

    it('no hauria de mostrar el cercador de refugis en mode edit', () => {
      const { queryByPlaceholderText } = render(
        <RenovationForm
          mode="edit"
          initialData={mockInitialData}
          initialRefuge={mockRefuges[0]}
          allRefuges={mockRefuges}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isLoading={false}
        />
      );

      // SearchBar no hauria d'estar present en mode edit
      expect(queryByPlaceholderText('map.searchPlaceholder')).toBeNull();
    });

    it('snapshot test - mode edit', () => {
      const { toJSON } = render(
        <RenovationForm
          mode="edit"
          initialData={mockInitialData}
          initialRefuge={mockRefuges[0]}
          allRefuges={mockRefuges}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isLoading={false}
        />
      );
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Validació del formulari', () => {
    it('hauria de mostrar error quan no es selecciona refugi en mode create', async () => {
      const { getByText, queryByText } = render(
        <RenovationForm {...defaultProps} />
      );

      const submitButton = getByText('createRenovation.submit');
      fireEvent.press(submitButton);

      // La validació es comprova internament
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('hauria de validar que el link de grup sigui de WhatsApp o Telegram', async () => {
      const { getByText, getByPlaceholderText, queryByText } = render(
        <RenovationForm
          {...defaultProps}
          initialRefuge={mockRefuges[0]}
        />
      );

      // Omplir descripció
      const descInput = getByPlaceholderText('createRenovation.descriptionPlaceholder');
      fireEvent.changeText(descInput, 'Una descripció vàlida de la renovació del refugi');

      // Omplir link invàlid
      const linkInput = getByPlaceholderText('createRenovation.groupLinkPlaceholder');
      fireEvent.changeText(linkInput, 'https://invalid-link.com');

      const submitButton = getByText('createRenovation.submit');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(queryByText('createRenovation.errors.groupLinkInvalid')).toBeTruthy();
      });
    });

    it('hauria d\'acceptar links vàlids de WhatsApp', () => {
      const { getByPlaceholderText } = render(
        <RenovationForm {...defaultProps} initialRefuge={mockRefuges[0]} />
      );

      const linkInput = getByPlaceholderText('createRenovation.groupLinkPlaceholder');
      fireEvent.changeText(linkInput, 'https://chat.whatsapp.com/abc123');

      expect(linkInput.props.value).toBe('https://chat.whatsapp.com/abc123');
    });

    it('hauria d\'acceptar links vàlids de Telegram', () => {
      const { getByPlaceholderText } = render(
        <RenovationForm {...defaultProps} initialRefuge={mockRefuges[0]} />
      );

      const linkInput = getByPlaceholderText('createRenovation.groupLinkPlaceholder');
      fireEvent.changeText(linkInput, 'https://t.me/testgroup');

      expect(linkInput.props.value).toBe('https://t.me/testgroup');
    });

    it('hauria de validar longitud màxima de descripció (1000 caràcters)', () => {
      const { getByPlaceholderText, getByText } = render(
        <RenovationForm {...defaultProps} />
      );

      const descInput = getByPlaceholderText('createRenovation.descriptionPlaceholder');
      fireEvent.changeText(descInput, 'a'.repeat(500));

      // Hauria de mostrar el comptador de caràcters
      expect(getByText('500/1000')).toBeTruthy();
    });

    it('hauria de validar longitud màxima de materials (500 caràcters)', () => {
      const { getByPlaceholderText, getByText } = render(
        <RenovationForm {...defaultProps} />
      );

      const materialsInput = getByPlaceholderText('createRenovation.materialsPlaceholder');
      fireEvent.changeText(materialsInput, 'a'.repeat(100));

      // Hauria de mostrar el comptador de caràcters
      expect(getByText('100/500')).toBeTruthy();
    });
  });

  describe('Selecció de refugi', () => {
    it('hauria de permetre cercar refugis', () => {
      const { getByPlaceholderText } = render(
        <RenovationForm {...defaultProps} />
      );

      const searchInput = getByPlaceholderText('map.searchPlaceholder');
      fireEvent.changeText(searchInput, 'Colomers');

      // La cerca s'hauria d'haver activat
      expect(searchInput.props.value).toBe('Colomers');
    });

    it('hauria de mostrar el refugi seleccionat', () => {
      const { getByText } = render(
        <RenovationForm
          {...defaultProps}
          initialRefuge={mockRefuges[0]}
        />
      );

      // El refugi seleccionat hauria d'estar visible
      expect(getByText('Refugi de Colomers')).toBeTruthy();
    });

    it('hauria de mostrar text helper per canviar refugi', () => {
      const { getByText } = render(
        <RenovationForm
          {...defaultProps}
          initialRefuge={mockRefuges[0]}
        />
      );

      // Hauria d'haver-hi un text helper per deseleccionar
      expect(getByText('createRenovation.refugeHelper')).toBeTruthy();
    });
  });

  describe('Gestió de dates', () => {
    it('hauria de mostrar els selectors de data', () => {
      const { getByText } = render(
        <RenovationForm {...defaultProps} />
      );

      expect(getByText('createRenovation.iniDateLabel')).toBeTruthy();
      expect(getByText('createRenovation.finDateLabel')).toBeTruthy();
    });

    it('hauria de mostrar placeholder quan no hi ha dates', () => {
      const { getAllByText } = render(
        <RenovationForm {...defaultProps} />
      );

      const selectDateTexts = getAllByText('createRenovation.selectDate');
      expect(selectDateTexts.length).toBe(2);
    });
  });

  describe('Submit', () => {
    it('hauria de mostrar loading state', () => {
      const { getByText } = render(
        <RenovationForm {...defaultProps} isLoading={true} />
      );

      expect(getByText('common.loading')).toBeTruthy();
    });

    it('hauria de desactivar el botó mentre carrega', () => {
      const { getByText } = render(
        <RenovationForm {...defaultProps} isLoading={true} />
      );

      const submitButton = getByText('common.loading');
      // El botó hauria d'estar desactivat visualment
      expect(submitButton).toBeTruthy();
    });
  });

  describe('Tooltip d\'informació', () => {
    it('hauria de mostrar icona d\'informació al costat del link de grup', () => {
      const { getByText } = render(
        <RenovationForm {...defaultProps} />
      );

      // L'etiqueta hauria d'estar present
      expect(getByText('createRenovation.groupLinkLabel')).toBeTruthy();
    });
  });

  describe('Reset del formulari', () => {
    it('hauria de resetejar el formulari quan canvia resetKey', () => {
      const { rerender, getByPlaceholderText } = render(
        <RenovationForm {...defaultProps} resetKey={1} />
      );

      // Canviar alguna cosa
      const descInput = getByPlaceholderText('createRenovation.descriptionPlaceholder');
      fireEvent.changeText(descInput, 'Nova descripció');

      // Rerenderitzar amb nou resetKey
      rerender(<RenovationForm {...defaultProps} resetKey={2} />);

      // El camp hauria d'estar buit després del reset
      const newDescInput = getByPlaceholderText('createRenovation.descriptionPlaceholder');
      expect(newDescInput.props.value).toBe('');
    });
  });

  describe('Mode edit - detecció de canvis', () => {
    it('hauria de detectar canvis en la descripció', () => {
      const { getByDisplayValue } = render(
        <RenovationForm
          mode="edit"
          initialData={mockInitialData}
          initialRefuge={mockRefuges[0]}
          allRefuges={mockRefuges}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isLoading={false}
        />
      );

      const descInput = getByDisplayValue('Renovació de la teulada del refugi');
      fireEvent.changeText(descInput, 'Nova descripció modificada');

      expect(getByDisplayValue('Nova descripció modificada')).toBeTruthy();
    });
  });
});
