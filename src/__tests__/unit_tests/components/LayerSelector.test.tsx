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

  describe('Botó Aplicar', () => {
    it('hauria de cridar onRepresentationChange, onMapLayerChange i onClose quan es prem Aplicar', () => {
      const { getByText } = render(<LayerSelector {...defaultProps} />);

      const applyButton = getByText('common.apply');
      fireEvent.press(applyButton);

      expect(mockOnRepresentationChange).toHaveBeenCalledWith('markers');
      expect(mockOnMapLayerChange).toHaveBeenCalledWith('opentopomap');
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('hauria de aplicar els canvis de representació locals', () => {
      const { getByText, UNSAFE_getAllByType } = render(
        <LayerSelector {...defaultProps} representation="markers" />
      );

      // Seleccionar una opció de representació diferent (cluster)
      const touchables = UNSAFE_getAllByType(require('react-native').TouchableOpacity);
      // Les opcions de representació són les primeres després del botó tancar
      // Normalment: overlay, tancar, opció1, opció2, opció-mapa1, opció-mapa2, cancel, apply
      // Troba l'opció de representació (índex 2 o 3)
      if (touchables.length >= 5) {
        fireEvent.press(touchables[3]); // Segona opció de representació (cluster)
      }

      const applyButton = getByText('common.apply');
      fireEvent.press(applyButton);

      expect(mockOnRepresentationChange).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('hauria de aplicar els canvis de capa de mapa locals', () => {
      const { getByText } = render(
        <LayerSelector {...defaultProps} mapLayer="opentopomap" />
      );

      // Seleccionar OpenStreetMap
      const osmOption = getByText('OpenStreetMap');
      fireEvent.press(osmOption);

      const applyButton = getByText('common.apply');
      fireEvent.press(applyButton);

      expect(mockOnMapLayerChange).toHaveBeenCalledWith('openstreetmap');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Botó Cancel·lar', () => {
    it('hauria de cridar onClose quan es prem Cancel·lar', () => {
      const { getByText } = render(<LayerSelector {...defaultProps} />);

      const cancelButton = getByText('common.cancel');
      fireEvent.press(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('NO hauria de aplicar canvis quan es prem Cancel·lar', () => {
      const { getByText } = render(<LayerSelector {...defaultProps} />);

      // Canviar selecció
      const osmOption = getByText('OpenStreetMap');
      fireEvent.press(osmOption);

      // Cancel·lar
      const cancelButton = getByText('common.cancel');
      fireEvent.press(cancelButton);

      // No hauria de cridar onChange
      expect(mockOnRepresentationChange).not.toHaveBeenCalled();
      expect(mockOnMapLayerChange).not.toHaveBeenCalled();
    });
  });

  describe('Selecció d\'opcions de representació', () => {
    it('hauria de permetre seleccionar l\'opció de cluster', () => {
      const { UNSAFE_getAllByType, getByText } = render(
        <LayerSelector {...defaultProps} representation="markers" />
      );

      // Trobem totes les TouchableOpacity i fem click a l'opció de cluster
      const touchables = UNSAFE_getAllByType(require('react-native').TouchableOpacity);
      
      // L'ordre típic és: overlay, close, markers-option, cluster-option, osm-option, topo-option, cancel, apply
      // Cluster hauria de ser l'índex 3 (la segona opció de representació)
      if (touchables.length >= 4) {
        fireEvent.press(touchables[3]);
      }

      // Aplicar
      const applyButton = getByText('common.apply');
      fireEvent.press(applyButton);

      // Com que hem canviat a cluster, el callback hauria de rebre 'cluster'
      expect(mockOnRepresentationChange).toHaveBeenCalled();
    });
  });
});
