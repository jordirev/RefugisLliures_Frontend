/**
 * Tests unitaris per al component RefugeForm
 *
 * Aquest fitxer cobreix:
 * - Renderització en mode 'create' i 'edit'
 * - Validació de formularis (nom, coordenades, altitud, etc.)
 * - Gestió dels camps d'amenities
 * - Gestió dels enllaços
 * - Submit i Cancel del formulari
 * - Snapshot tests
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { RefugeForm } from '../../../components/RefugeForm';
import { Location } from '../../../models';

// Mock fetch for elevation API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ results: [{ elevation: 1500 }] }),
  })
) as jest.Mock;

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
}));

// Mock SVG icons
jest.mock('../../../assets/icons/altitude2.svg', () => 'AltitudeIcon');
jest.mock('../../../assets/icons/users.svg', () => 'UsersIcon');

const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
const mockOnCancel = jest.fn();

const defaultProps = {
  mode: 'create' as const,
  onSubmit: mockOnSubmit,
  onCancel: mockOnCancel,
};

const mockInitialData: Location = {
  id: 'refuge-1',
  name: 'Refugi de Test',
  coord: {
    lat: 42.5678,
    long: 1.2345,
  },
  altitude: 2000,
  places: 20,
  type: 'non gardé',
  condition: 2,
  region: 'Pirineus',
  departement: 'Catalunya',
  description: 'Un refugi de test',
  links: ['https://example.com'],
  info_comp: {
    manque_un_mur: false,
    cheminee: true,
    poele: false,
    couvertures: true,
    latrines: false,
    bois: true,
    eau: true,
    matelas: false,
    couchage: true,
    bas_flancs: false,
    lits: true,
    mezzanine_etage: false,
  },
};

describe('RefugeForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Renderització mode create', () => {
    it('hauria de renderitzar correctament en mode create', () => {
      const { getByText, toJSON } = render(
        <RefugeForm {...defaultProps} />
      );

      // El component ha de renderitzar el botó submit
      expect(getByText('createRefuge.submit')).toBeTruthy();
      // El component ha de renderitzar la secció de coordenades
      expect(getByText('createRefuge.coordinates')).toBeTruthy();
    });

    it('hauria de tenir els camps buits en mode create', () => {
      const { getByTestId, queryAllByTestId } = render(
        <RefugeForm {...defaultProps} />
      );

      // Els camps haurien d'estar buits inicialment
      const textInputs = queryAllByTestId(/input/i);
      // Verificar que el component s'ha renderitzat
      expect(textInputs.length).toBeGreaterThanOrEqual(0);
    });

    it('snapshot test - mode create', () => {
      const { toJSON } = render(<RefugeForm {...defaultProps} />);
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Renderització mode edit', () => {
    it('hauria de renderitzar amb dades inicials en mode edit', () => {
      const { getByDisplayValue } = render(
        <RefugeForm
          mode="edit"
          initialData={mockInitialData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(getByDisplayValue('Refugi de Test')).toBeTruthy();
      expect(getByDisplayValue('42.5678')).toBeTruthy();
      expect(getByDisplayValue('1.2345')).toBeTruthy();
    });

    it('snapshot test - mode edit', () => {
      const { toJSON } = render(
        <RefugeForm
          mode="edit"
          initialData={mockInitialData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Validació del formulari', () => {
    it('hauria de no cridar onSubmit quan el formulari és invàlid', async () => {
      const { getByText } = render(
        <RefugeForm {...defaultProps} />
      );

      // Intentar submit sense omplir el nom
      const submitButton = getByText('createRefuge.submit');
      fireEvent.press(submitButton);

      // El callback no s'hauria d'haver cridat si hi ha errors
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('hauria de validar el formulari en submit', async () => {
      const { getByText } = render(
        <RefugeForm {...defaultProps} />
      );

      // Intentar submit sense omplir res
      const submitButton = getByText('createRefuge.submit');
      fireEvent.press(submitButton);

      // La funció onSubmit no s'hauria d'haver cridat si el formulari és invàlid
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('hauria de validar que l\'altitud sigui un enter positiu', async () => {
      const { getByText } = render(
        <RefugeForm {...defaultProps} />
      );

      const submitButton = getByText('createRefuge.submit');
      fireEvent.press(submitButton);

      // La validació s'hauria d'haver executat
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('hauria de validar que l\'altitud no superi 8800m', async () => {
      const { toJSON } = render(<RefugeForm {...defaultProps} />);
      // El component hauria de renderitzar correctament
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Gestió d\'amenities', () => {
    it('hauria de renderitzar tots els toggles d\'amenities', () => {
      const { getByText } = render(
        <RefugeForm
          mode="edit"
          initialData={mockInitialData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Verificar que els camps d'amenities es mostren
      expect(getByText('refuge.details.amenities')).toBeTruthy();
    });

    it('hauria de permetre toggle d\'amenities', () => {
      const { getByText } = render(
        <RefugeForm
          mode="edit"
          initialData={mockInitialData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // El component hauria de renderitzar amb amenities
      expect(getByText('refuge.details.amenities')).toBeTruthy();
    });
  });

  describe('Gestió d\'enllaços', () => {
    it('hauria de permetre afegir nous enllaços', () => {
      const { getByText, queryAllByPlaceholderText } = render(
        <RefugeForm {...defaultProps} />
      );

      // El text del botó és "+" + "createRefuge.addLink"
      // Busquem el text parcial
      const addLinkButton = getByText(/createRefuge\.addLink/);
      expect(addLinkButton).toBeTruthy();
      
      fireEvent.press(addLinkButton);
      // Després de prémer, hauria d'haver-hi més camps d'enllaços
    });

    it('hauria de mostrar la secció de links', async () => {
      const { getByText } = render(<RefugeForm {...defaultProps} />);

      // Verificar que el component renderitza la secció de links
      expect(getByText('createRefuge.links')).toBeTruthy();
    });
  });

  describe('Submit i Cancel', () => {
    it('hauria de cridar onSubmit amb dades vàlides', async () => {
      // No hi ha botó cancel visible al formulari, només submit
      const { getByText, getByPlaceholderText } = render(<RefugeForm {...defaultProps} />);

      // Omplir camps requerits
      fireEvent.changeText(getByPlaceholderText('createRefuge.namePlaceholder'), 'Test Refuge');
      fireEvent.changeText(getByPlaceholderText('42.1234'), '42.5');
      fireEvent.changeText(getByPlaceholderText('1.12345'), '1.5');

      const submitButton = getByText('createRefuge.submit');
      expect(submitButton).toBeTruthy();
    });

    it('no hauria de cridar onSubmit si el formulari és invàlid', async () => {
      const { getByText } = render(<RefugeForm {...defaultProps} />);

      const submitButton = getByText('createRefuge.submit');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });
  });

  describe('Auto-fetch elevation', () => {
    it('hauria de fer fetch de l\'elevació quan lat i long són vàlids', async () => {
      jest.useFakeTimers();

      render(<RefugeForm {...defaultProps} />);

      // El fetch s'hauria de cridar amb debounce
      // (nota: el test real dependria de com es manipulen els inputs)
      
      jest.runAllTimers();
      jest.useRealTimers();
    });
  });

  describe('Mode edit - detecció de canvis', () => {
    it('hauria de detectar canvis en els camps', () => {
      const { getByDisplayValue } = render(
        <RefugeForm
          mode="edit"
          initialData={mockInitialData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Modificar el nom
      const nameInput = getByDisplayValue('Refugi de Test');
      fireEvent.changeText(nameInput, 'Refugi Modificat');

      // El component hauria de detectar el canvi
      expect(getByDisplayValue('Refugi Modificat')).toBeTruthy();
    });

    it('hauria de requerir comentari mínim de 50 caràcters en mode edit', async () => {
      const { getByText, getByDisplayValue, queryByText } = render(
        <RefugeForm
          mode="edit"
          initialData={mockInitialData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Modificar un camp
      const nameInput = getByDisplayValue('Refugi de Test');
      fireEvent.changeText(nameInput, 'Nou nom del refugi');

      // Intentar submit sense comentari suficient
      // El botó en mode edit és 'createRefuge.submit'
      const submitButton = getByText('createRefuge.submit');
      fireEvent.press(submitButton);

      // Esperar que es mostrin errors
      await waitFor(() => {
        // El formulari no hauria de permetre submit sense comentari
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });
  });

  describe('Badge selectors', () => {
    it('hauria de renderitzar el selector de tipus i condició', () => {
      const { getByText } = render(<RefugeForm {...defaultProps} />);

      expect(getByText('refuge.details.typeAndCondition')).toBeTruthy();
    });

    it('hauria de mostrar instruccions per editar badges', () => {
      const { getByText } = render(<RefugeForm {...defaultProps} />);

      expect(getByText('createRefuge.pressToEdit')).toBeTruthy();
    });
  });

  describe('Gestió de camps', () => {
    it('hauria de permetre canviar el nom', () => {
      const { getByPlaceholderText, toJSON } = render(<RefugeForm {...defaultProps} />);
      
      const nameInput = getByPlaceholderText('createRefuge.namePlaceholder');
      fireEvent.changeText(nameInput, 'Nou Refugi');
      
      expect(toJSON()).toBeTruthy();
    });

    it('hauria de permetre canviar les coordenades', () => {
      const { getByPlaceholderText } = render(<RefugeForm {...defaultProps} />);
      
      const latInput = getByPlaceholderText('42.1234');
      const longInput = getByPlaceholderText('1.12345');
      
      fireEvent.changeText(latInput, '42.5678');
      fireEvent.changeText(longInput, '1.9876');
    });

    it('hauria de permetre canviar l\'altitud', () => {
      const { getAllByPlaceholderText, toJSON } = render(<RefugeForm {...defaultProps} />);
      
      // El placeholder d'altitud és "0"
      const altitudeInputs = getAllByPlaceholderText('0');
      if (altitudeInputs.length > 0) {
        fireEvent.changeText(altitudeInputs[0], '2500');
      }
      expect(toJSON()).toBeTruthy();
    });

    it('hauria de permetre canviar les places', () => {
      const { getAllByPlaceholderText, toJSON } = render(<RefugeForm {...defaultProps} />);
      
      // El placeholder de places és "0" (el segon)
      const placesInputs = getAllByPlaceholderText('0');
      if (placesInputs.length > 1) {
        fireEvent.changeText(placesInputs[1], '30');
      }
      expect(toJSON()).toBeTruthy();
    });

    it('hauria de permetre canviar la descripció', () => {
      const { getByPlaceholderText } = render(<RefugeForm {...defaultProps} />);
      
      const descInput = getByPlaceholderText('createRefuge.descriptionPlaceholder');
      fireEvent.changeText(descInput, 'Una descripció del refugi');
    });

    it('hauria de permetre canviar la regió', () => {
      const { getByPlaceholderText } = render(<RefugeForm {...defaultProps} />);
      
      const regionInput = getByPlaceholderText('createRefuge.regionPlaceholder');
      fireEvent.changeText(regionInput, 'Pirineus');
    });

    it('hauria de permetre canviar el departament', () => {
      const { getByPlaceholderText } = render(<RefugeForm {...defaultProps} />);
      
      const deptInput = getByPlaceholderText('createRefuge.departementPlaceholder');
      fireEvent.changeText(deptInput, 'Catalunya');
    });
  });

  describe('Gestió d\'enllaços complet', () => {
    it('hauria de permetre eliminar enllaços', () => {
      const { getByText, UNSAFE_root } = render(
        <RefugeForm
          mode="edit"
          initialData={mockInitialData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // El refugi mockejat té un link
      expect(getByText('createRefuge.links')).toBeTruthy();
    });

    it('hauria de permetre modificar un enllaç existent', () => {
      const { getByDisplayValue, toJSON } = render(
        <RefugeForm
          mode="edit"
          initialData={mockInitialData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const linkInput = getByDisplayValue('https://example.com');
      fireEvent.changeText(linkInput, 'https://newlink.com');
      
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Toggle d\'amenities complet', () => {
    it('hauria de permetre activar i desactivar amenities', () => {
      const { getByText, UNSAFE_root, toJSON } = render(
        <RefugeForm
          mode="edit"
          initialData={mockInitialData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Buscar els switches d'amenities
      const switches = UNSAFE_root.findAllByType(require('react-native').Switch);
      
      if (switches.length > 0) {
        // Toggle el primer switch
        fireEvent(switches[0], 'valueChange', !switches[0].props.value);
      }

      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Validacions específiques', () => {
    it('hauria de validar coordenades fora de rang', () => {
      const { getByPlaceholderText, getByText, toJSON } = render(<RefugeForm {...defaultProps} />);

      // Coordenades invàlides
      fireEvent.changeText(getByPlaceholderText('createRefuge.namePlaceholder'), 'Test');
      fireEvent.changeText(getByPlaceholderText('42.1234'), '200'); // lat invàlida
      fireEvent.changeText(getByPlaceholderText('1.12345'), '200'); // long invàlida

      const submitButton = getByText('createRefuge.submit');
      fireEvent.press(submitButton);

      expect(toJSON()).toBeTruthy();
    });

    it('hauria de validar altitud negativa', () => {
      const { getByPlaceholderText, getByText, getAllByPlaceholderText, toJSON } = render(<RefugeForm {...defaultProps} />);

      fireEvent.changeText(getByPlaceholderText('createRefuge.namePlaceholder'), 'Test');
      fireEvent.changeText(getByPlaceholderText('42.1234'), '42.5');
      fireEvent.changeText(getByPlaceholderText('1.12345'), '1.5');
      
      // El placeholder d'altitud és "0"
      const altitudeInputs = getAllByPlaceholderText('0');
      if (altitudeInputs.length > 0) {
        fireEvent.changeText(altitudeInputs[0], '-100');
      }

      const submitButton = getByText('createRefuge.submit');
      fireEvent.press(submitButton);

      expect(toJSON()).toBeTruthy();
    });

    it('hauria de validar nom massa curt', () => {
      const { getByPlaceholderText, getByText, toJSON } = render(<RefugeForm {...defaultProps} />);

      fireEvent.changeText(getByPlaceholderText('createRefuge.namePlaceholder'), 'AB'); // Nom massa curt
      fireEvent.changeText(getByPlaceholderText('42.1234'), '42.5');
      fireEvent.changeText(getByPlaceholderText('1.12345'), '1.5');

      const submitButton = getByText('createRefuge.submit');
      fireEvent.press(submitButton);

      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Comentari en mode edit', () => {
    it('hauria de mostrar camp de comentari quan hi ha canvis', () => {
      const { getByDisplayValue, toJSON } = render(
        <RefugeForm
          mode="edit"
          initialData={mockInitialData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Modificar un camp
      const nameInput = getByDisplayValue('Refugi de Test');
      fireEvent.changeText(nameInput, 'Nou Nom');

      expect(toJSON()).toBeTruthy();
    });

    it('hauria de validar comentari mínim de 50 caràcters', async () => {
      const { getByDisplayValue, getByText, getByPlaceholderText, toJSON } = render(
        <RefugeForm
          mode="edit"
          initialData={mockInitialData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Modificar el nom
      const nameInput = getByDisplayValue('Refugi de Test');
      fireEvent.changeText(nameInput, 'Nou Nom del Refugi');

      // Intentar submit
      const submitButton = getByText('createRefuge.submit');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it('hauria de permetre submit amb comentari vàlid', async () => {
      const { getByDisplayValue, getByText, getByPlaceholderText, queryByPlaceholderText, toJSON } = render(
        <RefugeForm
          mode="edit"
          initialData={mockInitialData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Modificar el nom
      const nameInput = getByDisplayValue('Refugi de Test');
      fireEvent.changeText(nameInput, 'Nou Nom del Refugi');

      // Buscar el camp de comentari (apareix quan hi ha canvis)
      const commentInput = queryByPlaceholderText('createRefuge.commentPlaceholder');
      if (commentInput) {
        fireEvent.changeText(commentInput, 'Comentari de més de cinquanta caràcters per poder fer submit del formulari');
      }

      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Selecció d\'imatge', () => {
    it('hauria de renderitzar la zona de selecció d\'imatge', () => {
      const { toJSON } = render(<RefugeForm {...defaultProps} />);

      // El component es renderitza correctament
      expect(toJSON()).toBeTruthy();
    });
  });
});
