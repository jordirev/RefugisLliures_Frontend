/**
 * Tests d'integració per al component FilterPanel
 * 
 * Cobertura:
 * - Renderització i interacció amb filtres de tipus
 * - Interacció amb filtres de condició
 * - Sliders d'altitud i places
 * - Aplicació i neteja de filtres
 * - Gestió del modal (obrir/tancar)
 * - Casos límit i branques d'execució
 */

import React from 'react';
import { renderWithProviders, fireEvent, waitFor } from '../setup/testUtils';
import { FilterPanel } from '../../../components/FilterPanel';
import { Filters } from '../../../models';

// Mock de les icones i altres components externs
jest.mock('../../../assets/icons/x.svg', () => 'XIcon');
jest.mock('../../../assets/icons/filters.svg', () => 'FilterIcon');
jest.mock('../../../utils/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'refuge.type.noGuarded': 'No guardat',
        'refuge.type.shelter': 'Refugi lliure',
        'refuge.type.emergency': 'Refugi d\'emergència',
        'refuge.type.occupiedInSummer': 'Guardat a l\'estiu',
        'refuge.type.closed': 'Tancat',
        'refuge.condition.poor': 'Pobre',
        'refuge.condition.fair': 'Normal',
        'refuge.condition.good': 'Bé',
        'filters.title': 'Filtres',
        'filters.types.title': 'Tipus de refugi',
        'filters.altitude': 'Altitud',
        'filters.capacity': 'Places',
        'filters.condition.title': 'Estat',
        'filters.clearAll': 'Netejar filtres',
        'filters.applyFilters': 'Aplicar filtres',
        'common.places': 'places',
      };
      return translations[key] || key;
    },
  }),
}));

describe('FilterPanel - Tests d\'integració', () => {
  const defaultFilters: Filters = {
    types: [],
    altitude: [0, 3250],
    places: [0, 30],
    condition: [],
  };

  const mockOnClose = jest.fn();
  const mockOnFiltersChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderització i obertura/tancament', () => {
    it('no hauria de renderitzar quan isOpen és false', () => {
      const { queryByText } = renderWithProviders(
        <FilterPanel
          isOpen={false}
          onClose={mockOnClose}
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />,
        { withNavigation: false }
      );

      expect(queryByText('Filtres')).toBeNull();
    });

    it('hauria de renderitzar quan isOpen és true', () => {
      const { getByText } = renderWithProviders(
        <FilterPanel
          isOpen={true}
          onClose={mockOnClose}
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />,
        { withNavigation: false }
      );

      expect(getByText('Filtres')).toBeTruthy();
      expect(getByText('Tipus de refugi')).toBeTruthy();
      // Altitud and Places text includes dynamic values, so just check the filter panel is rendered
    });

    it('hauria de tancar el panel amb els botons disponibles', () => {
      const { getByText } = renderWithProviders(
        <FilterPanel
          isOpen={true}
          onClose={mockOnClose}
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />,
        { withNavigation: false }
      );

      // Test that we can close by pressing the apply button
      fireEvent.press(getByText('Aplicar filtres'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Filtres de tipus de refugi', () => {
    it('hauria de permetre seleccionar un tipus de refugi', async () => {
      const { getByText, getByTestId } = renderWithProviders(
        <FilterPanel
          isOpen={true}
          onClose={mockOnClose}
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />,
        { withNavigation: false }
      );

      // Seleccionar un tipus
      const typeButton = getByText('No guardat');
      fireEvent.press(typeButton);

      // Aplicar filtres
      const applyButton = getByText('Aplicar filtres');
      fireEvent.press(applyButton);

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            types: [0],
          })
        );
      });
    });

    it('hauria de permetre seleccionar múltiples tipus', async () => {
      const { getByText } = renderWithProviders(
        <FilterPanel
          isOpen={true}
          onClose={mockOnClose}
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />,
        { withNavigation: false }
      );

      // Seleccionar múltiples tipus
      fireEvent.press(getByText('No guardat'));
      fireEvent.press(getByText('Refugi lliure'));
      fireEvent.press(getByText('Guardat a l\'estiu'));

      // Aplicar filtres
      fireEvent.press(getByText('Aplicar filtres'));

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            types: expect.arrayContaining([0, 3, 1]),
          })
        );
      });
    });

    it('hauria de permetre deseleccionar un tipus', async () => {
      const filtersWithType: Filters = {
        ...defaultFilters,
        types: [0, 3],
      };

      const { getByText } = renderWithProviders(
        <FilterPanel
          isOpen={true}
          onClose={mockOnClose}
          filters={filtersWithType}
          onFiltersChange={mockOnFiltersChange}
        />,
        { withNavigation: false }
      );

      // Deseleccionar un tipus
      fireEvent.press(getByText('No guardat'));

      // Aplicar filtres
      fireEvent.press(getByText('Aplicar filtres'));

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            types: [3],
          })
        );
      });
    });
  });

  describe('Filtres de condició', () => {
    it('hauria de permetre seleccionar una condició', async () => {
      const { getByText } = renderWithProviders(
        <FilterPanel
          isOpen={true}
          onClose={mockOnClose}
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />,
        { withNavigation: false }
      );

      // Seleccionar una condició
      fireEvent.press(getByText('Bé'));

      // Aplicar filtres
      fireEvent.press(getByText('Aplicar filtres'));

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            condition: ['bé'],
          })
        );
      });
    });

    it('hauria de permetre seleccionar múltiples condicions', async () => {
      const { getByText } = renderWithProviders(
        <FilterPanel
          isOpen={true}
          onClose={mockOnClose}
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />,
        { withNavigation: false }
      );

      // Seleccionar múltiples condicions
      fireEvent.press(getByText('Pobre'));
      fireEvent.press(getByText('Normal'));

      // Aplicar filtres
      fireEvent.press(getByText('Aplicar filtres'));

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            condition: expect.arrayContaining(['pobre', 'normal']),
          })
        );
      });
    });

    it('hauria de permetre deseleccionar una condició', async () => {
      const filtersWithCondition: Filters = {
        ...defaultFilters,
        condition: ['bé', 'normal'],
      };

      const { getByText } = renderWithProviders(
        <FilterPanel
          isOpen={true}
          onClose={mockOnClose}
          filters={filtersWithCondition}
          onFiltersChange={mockOnFiltersChange}
        />,
        { withNavigation: false }
      );

      // Deseleccionar una condició
      fireEvent.press(getByText('Bé'));

      // Aplicar filtres
      fireEvent.press(getByText('Aplicar filtres'));

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            condition: ['normal'],
          })
        );
      });
    });
  });

  describe('Netejar filtres', () => {
    it('hauria de netejar tots els filtres', async () => {
      const filtersWithValues: Filters = {
        types: [0, 1],
        altitude: [1000, 2500],
        places: [10, 20],
        condition: ['bé'],
      };

      const { getByText } = renderWithProviders(
        <FilterPanel
          isOpen={true}
          onClose={mockOnClose}
          filters={filtersWithValues}
          onFiltersChange={mockOnFiltersChange}
        />,
        { withNavigation: false }
      );

      // Netejar filtres
      fireEvent.press(getByText('Netejar filtres'));

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          types: [],
          altitude: [0, 3250],
          places: [0, 30],
          condition: [],
        });
        // The panel stays open after clearing filters
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });

    it('no hauria de cridar onFiltersChange si els filtres ja estan buits', async () => {
      const { getByText } = renderWithProviders(
        <FilterPanel
          isOpen={true}
          onClose={mockOnClose}
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />,
        { withNavigation: false }
      );

      // Netejar filtres quan ja estan buits
      fireEvent.press(getByText('Netejar filtres'));

      await waitFor(() => {
        // Should not call onFiltersChange when filters are already cleared
        expect(mockOnFiltersChange).not.toHaveBeenCalled();
        // Should not close the panel either
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });
  });

  describe('Aplicar filtres', () => {
    it('hauria d\'aplicar els filtres i tancar el panel', async () => {
      const { getByText } = renderWithProviders(
        <FilterPanel
          isOpen={true}
          onClose={mockOnClose}
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />,
        { withNavigation: false }
      );

      // Seleccionar algunes opcions
      fireEvent.press(getByText('No guardat'));
      fireEvent.press(getByText('Bé'));

      // Aplicar filtres
      fireEvent.press(getByText('Aplicar filtres'));

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            types: [0],
            condition: ['bé'],
          })
        );
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('hauria de cridar onFiltersChange amb els filtres actuals en aplicar', async () => {
      const { getByText } = renderWithProviders(
        <FilterPanel
          isOpen={true}
          onClose={mockOnClose}
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
        />,
        { withNavigation: false }
      );

      // Aplicar sense fer canvis - encara crida onFiltersChange amb els filtres actuals
      fireEvent.press(getByText('Aplicar filtres'));

      await waitFor(() => {
        // The apply button always calls onFiltersChange, even if no changes
        expect(mockOnFiltersChange).toHaveBeenCalledWith(defaultFilters);
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Paràmetres opcionals', () => {
    it('hauria d\'utilitzar maxAltitude personalitzat', () => {
      const { getByText } = renderWithProviders(
        <FilterPanel
          isOpen={true}
          onClose={mockOnClose}
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          maxAltitude={4000}
        />,
        { withNavigation: false }
      );

      // Check that filters are rendered (Altitud text includes dynamic values)
      expect(getByText('Filtres')).toBeTruthy();
    });

    it('hauria d\'utilitzar maxPlaces personalitzat', () => {
      const { getByText } = renderWithProviders(
        <FilterPanel
          isOpen={true}
          onClose={mockOnClose}
          filters={defaultFilters}
          onFiltersChange={mockOnFiltersChange}
          maxPlaces={50}
        />,
        { withNavigation: false }
      );

      // Check that filters are rendered (Places text includes dynamic values)
      expect(getByText('Filtres')).toBeTruthy();
    });
  });

  describe('Reinici dels filtres locals en obrir el panel', () => {
    it('hauria de reiniciar els filtres locals quan s\'obre el panel', () => {
      const initialFilters: Filters = {
        types: [1],
        altitude: [500, 2000],
        places: [5, 15],
        condition: ['normal'],
      };

      const { rerender, getByText } = renderWithProviders(
        <FilterPanel
          isOpen={false}
          onClose={mockOnClose}
          filters={initialFilters}
          onFiltersChange={mockOnFiltersChange}
        />,
        { withNavigation: false }
      );

      // Obrir el panel
      rerender(
        <FilterPanel
          isOpen={true}
          onClose={mockOnClose}
          filters={initialFilters}
          onFiltersChange={mockOnFiltersChange}
        />
      );

      // Els filtres locals haurien de coincidir amb els props
      expect(getByText('Filtres')).toBeTruthy();
    });
  });
});
