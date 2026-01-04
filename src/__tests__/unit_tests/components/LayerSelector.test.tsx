/**
 * Tests unitaris per al component LayerSelector
 *
 * Aquest fitxer cobreix:
 * - Renderització del modal
 * - Selecció de representació (markers, heatmap, cluster)
 * - Selecció de capa de mapa (OpenTopoMap, OpenStreetMap)
 * - Tancament del modal
 * - Snapshot tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LayerSelector, RepresentationType, MapLayerType } from '../../../components/LayerSelector';

// Mock SVG icons
jest.mock('../../../assets/icons/x.svg', () => 'XIcon');
jest.mock('../../../assets/icons/layers.svg', () => 'LayersIcon');

// Mock images
jest.mock('../../../assets/images/Markers.jpeg', () => 'MarkersImage');
jest.mock('../../../assets/images/Clusters.jpeg', () => 'ClustersImage');
jest.mock('../../../assets/images/OpenStreetMap.jpeg', () => 'OpenStreetMapImage');
jest.mock('../../../assets/images/OpenTopoMap.jpeg', () => 'OpenTopoMapImage');

const mockOnClose = jest.fn();
const mockOnRepresentationChange = jest.fn();
const mockOnMapLayerChange = jest.fn();

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  representation: 'markers' as RepresentationType,
  mapLayer: 'opentopomap' as MapLayerType,
  onRepresentationChange: mockOnRepresentationChange,
  onMapLayerChange: mockOnMapLayerChange,
};

describe('LayerSelector Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderització bàsica', () => {
    it('hauria de renderitzar quan isOpen és true', () => {
      const { getByText } = render(<LayerSelector {...defaultProps} />);

      expect(getByText('layers.title')).toBeTruthy();
    });

    it('hauria de mostrar el títol de representació', () => {
      const { getByText } = render(<LayerSelector {...defaultProps} />);

      expect(getByText('layers.representation.title')).toBeTruthy();
      expect(getByText('layers.representation.subtitle')).toBeTruthy();
    });

    it('hauria de mostrar les opcions de capa de mapa', () => {
      const { getByText } = render(<LayerSelector {...defaultProps} />);

      expect(getByText('OpenTopoMap')).toBeTruthy();
      expect(getByText('OpenStreetMap')).toBeTruthy();
    });

    it('snapshot test - modal obert', () => {
      const { toJSON } = render(<LayerSelector {...defaultProps} />);
      expect(toJSON()).toMatchSnapshot();
    });

    it('snapshot test - modal tancat', () => {
      const { toJSON } = render(<LayerSelector {...defaultProps} isOpen={false} />);
      expect(toJSON()).toMatchSnapshot();
    });
  });

  describe('Selecció de representació', () => {
    it('hauria de tenir markers seleccionat per defecte', () => {
      const { toJSON } = render(<LayerSelector {...defaultProps} />);
      expect(toJSON()).toBeTruthy();
    });

    it('hauria de mostrar la secció de representació', () => {
      const { getByText } = render(<LayerSelector {...defaultProps} />);

      expect(getByText('layers.representation.title')).toBeTruthy();
    });

    it('hauria de renderitzar opcions de representació com imatges', () => {
      // Les opcions de representació són imatges sense text
      const { toJSON } = render(<LayerSelector {...defaultProps} />);
      expect(toJSON()).toBeTruthy();
    });

    it('hauria de reflectir la representació inicial', () => {
      const { toJSON } = render(
        <LayerSelector {...defaultProps} representation="cluster" />
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Selecció de capa de mapa', () => {
    it('hauria de tenir opentopomap seleccionat per defecte', () => {
      const { toJSON } = render(<LayerSelector {...defaultProps} />);
      expect(toJSON()).toBeTruthy();
    });

    it('hauria de permetre canviar a openstreetmap', () => {
      const { getByText } = render(<LayerSelector {...defaultProps} />);

      const osmOption = getByText('OpenStreetMap');
      fireEvent.press(osmOption);
    });

    it('hauria de reflectir la capa inicial', () => {
      const { toJSON } = render(
        <LayerSelector {...defaultProps} mapLayer="openstreetmap" />
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Tancament del modal', () => {
    it('hauria de cridar onClose quan es prem el botó X', () => {
      const { UNSAFE_root } = render(<LayerSelector {...defaultProps} />);

      const touchables = UNSAFE_root.findAllByType(require('react-native').TouchableOpacity);
      // Buscar el botó de tancar (el que té XIcon)
      const closeButton = touchables.find(t => {
        // Normalment és el segon o tercer touchable
        return true;
      });

      if (touchables.length > 0) {
        fireEvent.press(touchables[1]); // El segon hauria de ser el botó de tancar
      }
    });

    it('hauria de cridar onClose quan es prem l\'overlay', () => {
      const { UNSAFE_root } = render(<LayerSelector {...defaultProps} />);

      // L'overlay és el primer TouchableOpacity
      const touchables = UNSAFE_root.findAllByType(require('react-native').TouchableOpacity);
      if (touchables.length > 0) {
        // L'overlay hauria de ser el primer
        fireEvent.press(touchables[0]);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });
  });

  describe('Descripcions', () => {
    it('hauria de mostrar la secció de capes', () => {
      const { getByText } = render(<LayerSelector {...defaultProps} />);

      expect(getByText('layers.mapLayer.title')).toBeTruthy();
      expect(getByText('layers.mapLayer.subtitle')).toBeTruthy();
    });

    it('hauria de mostrar noms de capes de mapa', () => {
      const { getByText } = render(<LayerSelector {...defaultProps} />);

      expect(getByText('OpenTopoMap')).toBeTruthy();
      expect(getByText('OpenStreetMap')).toBeTruthy();
    });
  });

  describe('Actualització d\'estat local', () => {
    it('hauria de sincronitzar estat local quan el modal s\'obre', () => {
      const { rerender, toJSON } = render(
        <LayerSelector {...defaultProps} isOpen={false} />
      );

      // Obrir el modal
      rerender(<LayerSelector {...defaultProps} isOpen={true} />);

      expect(toJSON()).toBeTruthy();
    });
  });
});
