/**
 * Tests unitaris per a models, mappers, DTOs i validacions de Refugis Lliures
 * 
 * Aquest fitxer cobreix:
 * - Models de dades (Location, Coord, Filters)
 * - DTOs (RefugiDTO, CoordDTO, InfoCompDTO, etc.)
 * - Mappers (RefugiMapper, CoordMapper)
 * - Validacions i conversions
 */

import { Location, Coord, Filters } from '../../../models';
import {
  RefugiDTO,
  CoordDTO,
  InfoCompDTO,
  RefugisResponseDTO,
  RefugiSimpleDTO,
  RefugisSimpleResponseDTO,
} from '../../../services/dto/RefugiDTO';
import {
  mapCoordFromDTO,
  mapRefugiFromDTO,
  mapRefugisFromDTO,
} from '../../../services/mappers/RefugiMapper';

describe('Models de Refugis', () => {
  describe('Coord Model', () => {
    it('hauria de crear una coordenada vàlida', () => {
      const coord: Coord = {
        long: 1.5,
        lat: 42.5,
      };

      expect(coord.long).toBe(1.5);
      expect(coord.lat).toBe(42.5);
    });

    it('hauria de permetre coordenades negatives', () => {
      const coord: Coord = {
        long: -1.5,
        lat: -42.5,
      };

      expect(coord.long).toBe(-1.5);
      expect(coord.lat).toBe(-42.5);
    });

    it('hauria de permetre coordenades zero', () => {
      const coord: Coord = {
        long: 0,
        lat: 0,
      };

      expect(coord.long).toBe(0);
      expect(coord.lat).toBe(0);
    });
  });

  describe('Location Model', () => {
    it('hauria de crear una ubicació amb camps obligatoris', () => {
      const location: Location = {
        name: 'Refugi Test',
        coord: { long: 1.5, lat: 42.5 },
      };

      expect(location.name).toBe('Refugi Test');
      expect(location.coord).toEqual({ long: 1.5, lat: 42.5 });
    });

    it('hauria de crear una ubicació completa amb tots els camps', () => {
      const location: Location = {
        id: "1",
        name: 'Refugi Test',
        surname: 'Refugi de Muntanya',
        coord: { long: 1.5, lat: 42.5 },
        altitude: 2000,
        places: 20,
        description: 'Un refugi de test',
        links: ['https://example.com'],
        type: "0",
        modified_at: '2023-01-01T00:00:00Z',
        region: 'Pirineus',
        departement: 'Lleida',
        condition: 'bé',
        imageUrl: 'https://example.com/image.jpg',
      };

      expect(location.id).toBe("1");
      expect(location.surname).toBe('Refugi de Muntanya');
      expect(location.altitude).toBe(2000);
      expect(location.places).toBe(20);
      expect(location.type).toBe("0");
      expect(location.condition).toBe('bé');
    });

    it('hauria de permetre camps opcionals com a undefined', () => {
      const location: Location = {
        name: 'Refugi Test',
        coord: { long: 1.5, lat: 42.5 },
        surname: undefined,
        altitude: null,
        places: null,
      };

      expect(location.surname).toBeUndefined();
      expect(location.altitude).toBeNull();
      expect(location.places).toBeNull();
    });

    it('hauria de validar els tipus de refugi (0-5)', () => {
      const types = [0, 1, 2, 3, 4, 5];
      
      types.forEach(type => {
        const location: Location = {
          name: 'Test',
          coord: { long: 1, lat: 42 },
          type,
        };
        expect(location.type).toBe(type);
      });
    });

    it('hauria de validar les condicions del refugi', () => {
      const conditions: Array<'pobre' | 'normal' | 'bé' | 'excel·lent'> = [
        'pobre',
        'normal',
        'bé',
        'excel·lent',
      ];

      conditions.forEach(condition => {
        const location: Location = {
          name: 'Test',
          coord: { long: 1, lat: 42 },
          condition,
        };
        expect(location.condition).toBe(condition);
      });
    });

    it('hauria de permetre un array de links', () => {
      const location: Location = {
        name: 'Test',
        coord: { long: 1, lat: 42 },
        links: [
          'https://example1.com',
          'https://example2.com',
          'https://example3.com',
        ],
      };

      expect(location.links).toHaveLength(3);
      expect(location.links![0]).toBe('https://example1.com');
    });
  });

  describe('Filters Model', () => {
    it('hauria de crear filtres amb tots els camps', () => {
      const filters: Filters = {
        types: ["0", "1", "2"],
        altitude: [1000, 3000],
        places: [10, 50],
        condition: ['normal', 'bé'],
      };

      expect(filters.types).toEqual(["0", "1", "2"]);
      expect(filters.altitude).toEqual([1000, 3000]);
      expect(filters.places).toEqual([10, 50]);
      expect(filters.condition).toEqual(['normal', 'bé']);
    });

    it('hauria de permetre un array de tipus buit', () => {
      const filters: Filters = {
        types: [],
        altitude: [0, 5000],
        places: [0, 100],
        condition: [],
      };

      expect(filters.types).toHaveLength(0);
      expect(filters.condition).toHaveLength(0);
    });

    it('hauria de permetre rangs d\'altitud amplis', () => {
      const filters: Filters = {
        types: [0],
        altitude: [0, 4000],
        places: [1, 100],
        condition: ['pobre'],
      };

      expect(filters.altitude[0]).toBe(0);
      expect(filters.altitude[1]).toBe(4000);
    });
  });
});

describe('DTOs de Refugis', () => {
  describe('CoordDTO', () => {
    it('hauria de crear una CoordDTO vàlida', () => {
      const coordDTO: CoordDTO = {
        long: 1.5,
        lat: 42.5,
      };

      expect(coordDTO.long).toBe(1.5);
      expect(coordDTO.lat).toBe(42.5);
    });

    it('hauria de suportar coordenades amb molta precisió', () => {
      const coordDTO: CoordDTO = {
        long: 1.123456789,
        lat: 42.987654321,
      };

      expect(coordDTO.long).toBeCloseTo(1.123456789);
      expect(coordDTO.lat).toBeCloseTo(42.987654321);
    });
  });

  describe('InfoCompDTO', () => {
    it('hauria de crear un InfoCompDTO amb tots els camps', () => {
      const infoComp: InfoCompDTO = {
        manque_un_mur: 0,
        cheminee: 1,
        poele: 1,
        couvertures: 1,
        latrines: 1,
        bois: 1,
        eau: 1,
        matelas: 1,
        couchage: 1,
        bas_flancs: 1,
        lits: 1,
        mezzanine_etage: 1,
      };

      expect(infoComp.cheminee).toBe(1);
      expect(infoComp.manque_un_mur).toBe(0);
      expect(infoComp.eau).toBe(1);
    });

    it('hauria de permetre valors 0 (no disponible)', () => {
      const infoComp: InfoCompDTO = {
        manque_un_mur: 1,
        cheminee: 0,
        poele: 0,
        couvertures: 0,
        latrines: 0,
        bois: 0,
        eau: 0,
        matelas: 0,
        couchage: 0,
        bas_flancs: 0,
        lits: 0,
        mezzanine_etage: 0,
      };

      expect(infoComp.cheminee).toBe(0);
      expect(infoComp.manque_un_mur).toBe(1);
    });
  });

  describe('RefugiDTO', () => {
    it('hauria de crear un RefugiDTO amb camps obligatoris', () => {
      const refugiDTO: RefugiDTO = {
        id: '1',
        name: 'Refugi Test',
        coord: { long: 1.5, lat: 42.5 },
      };

      expect(refugiDTO.id).toBe('1');
      expect(refugiDTO.name).toBe('Refugi Test');
      expect(refugiDTO.coord).toEqual({ long: 1.5, lat: 42.5 });
    });

    it('hauria de crear un RefugiDTO complet amb tots els camps', () => {
      const refugiDTO: RefugiDTO = {
        id: '123',
        name: 'Refugi de Muntanya',
        surname: 'Refugi històric',
        coord: { long: 1.5, lat: 42.5 },
        altitude: 2500,
        places: 30,
        info_comp: {
          manque_un_mur: 0,
          cheminee: 1,
          poele: 1,
          couvertures: 1,
          latrines: 1,
          bois: 1,
          eau: 1,
          matelas: 1,
          couchage: 1,
          bas_flancs: 1,
          lits: 1,
          mezzanine_etage: 1,
        },
        description: 'Un refugi excel·lent',
        links: ['https://example.com'],
        type: 'cabane ouverte',
        modified_at: '2023-01-01T00:00:00Z',
        region: 'Pirineus',
        departement: 'Lleida',
        condition: 'excel·lent',
        images_urls: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
      };

      expect(refugiDTO.id).toBe('123');
      expect(refugiDTO.altitude).toBe(2500);
      expect(refugiDTO.info_comp?.cheminee).toBe(1);
      expect(refugiDTO.images_urls).toHaveLength(2);
    });

    it('hauria de permetre camps opcionals com a undefined o null', () => {
      const refugiDTO: RefugiDTO = {
        id: '1',
        name: 'Test',
        coord: { long: 1, lat: 42 },
        surname: null,
        altitude: null,
        places: null,
        info_comp: undefined,
        description: undefined,
        links: undefined,
        type: undefined,
        modified_at: null,
        region: null,
        departement: null,
        condition: null,
        images_urls: undefined,
      };

      expect(refugiDTO.surname).toBeNull();
      expect(refugiDTO.altitude).toBeNull();
      expect(refugiDTO.info_comp).toBeUndefined();
    });
  });

  describe('RefugisResponseDTO', () => {
    it('hauria de crear una resposta paginada', () => {
      const response: RefugisResponseDTO = {
        count: 100,
        results: [
          {
            id: '1',
            name: 'Refugi 1',
            coord: { long: 1, lat: 42 },
          },
          {
            id: '2',
            name: 'Refugi 2',
            coord: { long: 1.5, lat: 42.5 },
          },
        ],
      };

      expect(response.count).toBe(100);
      expect(response.results).toHaveLength(2);
    });

    it('hauria de permetre una resposta buida', () => {
      const response: RefugisResponseDTO = {
        count: 0,
        results: [],
      };

      expect(response.count).toBe(0);
      expect(response.results).toHaveLength(0);
    });
  });

  describe('RefugiSimpleDTO', () => {
    it('hauria de crear un RefugiSimpleDTO amb geohash', () => {
      const refugiSimple: RefugiSimpleDTO = {
        id: '1',
        name: 'Refugi Simple',
        coord: { long: 1.5, lat: 42.5 },
        geohash: 'sp3e',
      };

      expect(refugiSimple.id).toBe('1');
      expect(refugiSimple.geohash).toBe('sp3e');
    });

    it('hauria de permetre surname opcional', () => {
      const refugiSimple: RefugiSimpleDTO = {
        id: '1',
        name: 'Refugi',
        surname: 'Històric',
        coord: { long: 1, lat: 42 },
        geohash: 'abc',
      };

      expect(refugiSimple.surname).toBe('Històric');
    });
  });

  describe('RefugisSimpleResponseDTO', () => {
    it('hauria de crear una resposta amb refugis simplificats', () => {
      const response: RefugisSimpleResponseDTO = {
        count: 50,
        results: [
          {
            id: '1',
            name: 'Refugi 1',
            coord: { long: 1, lat: 42 },
            geohash: 'sp3e',
          },
        ],
      };

      expect(response.count).toBe(50);
      expect(response.results[0].geohash).toBe('sp3e');
    });
  });
});

describe('Mappers de Refugis', () => {
  describe('mapCoordFromDTO', () => {
    it('hauria de convertir CoordDTO a Coord correctament', () => {
      const coordDTO: CoordDTO = {
        long: 1.5,
        lat: 42.5,
      };

      const coord = mapCoordFromDTO(coordDTO);

      expect(coord.long).toBe(1.5);
      expect(coord.lat).toBe(42.5);
    });

    it('hauria de mantenir la precisió de les coordenades', () => {
      const coordDTO: CoordDTO = {
        long: 1.123456789,
        lat: 42.987654321,
      };

      const coord = mapCoordFromDTO(coordDTO);

      expect(coord.long).toBeCloseTo(1.123456789);
      expect(coord.lat).toBeCloseTo(42.987654321);
    });

    it('hauria de gestionar coordenades zero', () => {
      const coordDTO: CoordDTO = {
        long: 0,
        lat: 0,
      };

      const coord = mapCoordFromDTO(coordDTO);

      expect(coord.long).toBe(0);
      expect(coord.lat).toBe(0);
    });

    it('hauria de gestionar coordenades negatives', () => {
      const coordDTO: CoordDTO = {
        long: -1.5,
        lat: -42.5,
      };

      const coord = mapCoordFromDTO(coordDTO);

      expect(coord.long).toBe(-1.5);
      expect(coord.lat).toBe(-42.5);
    });
  });

  describe('mapRefugiFromDTO', () => {
    it('hauria de convertir un RefugiDTO mínim a Location', () => {
      const refugiDTO: RefugiDTO = {
        id: '123',
        name: 'Refugi Test',
        coord: { long: 1.5, lat: 42.5 },
      };

      const location = mapRefugiFromDTO(refugiDTO);

      expect(location.id).toBe('123');
      expect(location.name).toBe('Refugi Test');
      expect(location.coord).toEqual({ long: 1.5, lat: 42.5 });
    });

    it('hauria de convertir un RefugiDTO complet a Location', () => {
      const refugiDTO: RefugiDTO = {
        id: '456',
        name: 'Refugi Complet',
        surname: 'Refugi històric',
        coord: { long: 1.5, lat: 42.5 },
        altitude: 2000,
        places: 25,
        description: 'Descripció del refugi',
        links: ['https://example.com'],
        type: 'cabane ouverte',
        modified_at: '2023-01-01T00:00:00Z',
        region: 'Pirineus',
        departement: 'Lleida',
        condition: 2,
      };

      const location = mapRefugiFromDTO(refugiDTO);

      expect(location.id).toBe('456');
      expect(location.surname).toBe('Refugi històric');
      expect(location.altitude).toBe(2000);
      expect(location.places).toBe(25);
      expect(location.type).toBe('cabane ouverte');
      expect(location.region).toBe('Pirineus');
    });

    it('hauria de mantenir el tipus "cabane ouverte" tal qual', () => {
      const refugiDTO: RefugiDTO = {
        id: '1',
        name: 'Test',
        coord: { long: 1, lat: 42 },
        type: 'cabane ouverte',
      };

      const location = mapRefugiFromDTO(refugiDTO);
      expect(location.type).toBe('cabane ouverte');
    });

    it('hauria de mantenir el tipus "berger" tal qual', () => {
      const refugiDTO: RefugiDTO = {
        id: '1',
        name: 'Test',
        coord: { long: 1, lat: 42 },
        type: 'cabane ouverte mais ocupee par le berger l ete',
      };

      const location = mapRefugiFromDTO(refugiDTO);
      expect(location.type).toBe('cabane ouverte mais ocupee par le berger l ete');
    });

    it('hauria de mantenir el tipus "fermée" tal qual', () => {
      const refugiDTO: RefugiDTO = {
        id: '1',
        name: 'Test',
        coord: { long: 1, lat: 42 },
        type: 'cabane fermee',
      };

      const location = mapRefugiFromDTO(refugiDTO);
      expect(location.type).toBe('cabane fermee');
    });

    it('hauria de mantenir el tipus "Fermée" (majúscula) tal qual', () => {
      const refugiDTO: RefugiDTO = {
        id: '1',
        name: 'Test',
        coord: { long: 1, lat: 42 },
        type: 'Fermée',
      };

      const location = mapRefugiFromDTO(refugiDTO);
      expect(location.type).toBe('Fermée');
    });

    it('hauria de mantenir el tipus "orri" tal qual', () => {
      const refugiDTO: RefugiDTO = {
        id: '1',
        name: 'Test',
        coord: { long: 1, lat: 42 },
        type: 'orri toue abri en pierre',
      };

      const location = mapRefugiFromDTO(refugiDTO);
      expect(location.type).toBe('orri toue abri en pierre');
    });

    it('hauria de mantenir el tipus "emergence" tal qual', () => {
      const refugiDTO: RefugiDTO = {
        id: '1',
        name: 'Test',
        coord: { long: 1, lat: 42 },
        type: 'emergence',
      };

      const location = mapRefugiFromDTO(refugiDTO);
      expect(location.type).toBe('emergence');
    });

    it('hauria de mantenir tipus desconegut tal qual', () => {
      const refugiDTO: RefugiDTO = {
        id: '1',
        name: 'Test',
        coord: { long: 1, lat: 42 },
        type: 'tipus desconegut',
      };

      const location = mapRefugiFromDTO(refugiDTO);
      expect(location.type).toBe('tipus desconegut');
    });

    it('hauria de mantenir tipus undefined com undefined', () => {
      const refugiDTO: RefugiDTO = {
        id: '1',
        name: 'Test',
        coord: { long: 1, lat: 42 },
        type: undefined,
      };

      const location = mapRefugiFromDTO(refugiDTO);
      expect(location.type).toBeUndefined();
    });

    it('hauria de determinar condició 0 quan falta un mur', () => {
      const refugiDTO: RefugiDTO = {
        id: '1',
        name: 'Test',
        coord: { long: 1, lat: 42 },
        info_comp: {
          manque_un_mur: 1,
          cheminee: 1,
          poele: 1,
          couvertures: 1,
          latrines: 1,
          bois: 1,
          eau: 1,
          matelas: 1,
          couchage: 1,
          bas_flancs: 1,
          lits: 1,
          mezzanine_etage: 1,
        },
      };

      const location = mapRefugiFromDTO(refugiDTO);
      expect(location.condition).toBe(0);
    });

    it('hauria de determinar condició 3 amb 8+ comoditats', () => {
      const refugiDTO: RefugiDTO = {
        id: '1',
        name: 'Test',
        coord: { long: 1, lat: 42 },
        info_comp: {
          manque_un_mur: 0,
          cheminee: 1,
          poele: 1,
          couvertures: 1,
          latrines: 1,
          bois: 1,
          eau: 1,
          matelas: 1,
          couchage: 1,
          bas_flancs: 1,
          lits: 1,
          mezzanine_etage: 0,
        },
      };

      const location = mapRefugiFromDTO(refugiDTO);
      expect(location.condition).toBe(3);
    });

    it('hauria de determinar condició 2 amb 5-7 comoditats', () => {
      const refugiDTO: RefugiDTO = {
        id: '1',
        name: 'Test',
        coord: { long: 1, lat: 42 },
        info_comp: {
          manque_un_mur: 0,
          cheminee: 1,
          poele: 1,
          couvertures: 1,
          latrines: 1,
          bois: 1,
          eau: 1,
          matelas: 0,
          couchage: 0,
          bas_flancs: 0,
          lits: 0,
          mezzanine_etage: 0,
        },
      };

      const location = mapRefugiFromDTO(refugiDTO);
      expect(location.condition).toBe(2);
    });

    it('hauria de determinar condició 1 amb 3-4 comoditats', () => {
      const refugiDTO: RefugiDTO = {
        id: '1',
        name: 'Test',
        coord: { long: 1, lat: 42 },
        info_comp: {
          manque_un_mur: 0,
          cheminee: 1,
          poele: 1,
          couvertures: 1,
          latrines: 1,
          bois: 0,
          eau: 0,
          matelas: 0,
          couchage: 0,
          bas_flancs: 0,
          lits: 0,
          mezzanine_etage: 0,
        },
      };

      const location = mapRefugiFromDTO(refugiDTO);
      expect(location.condition).toBe(1);
    });

    it('hauria de determinar condició 0 amb menys de 3 comoditats', () => {
      const refugiDTO: RefugiDTO = {
        id: '1',
        name: 'Test',
        coord: { long: 1, lat: 42 },
        info_comp: {
          manque_un_mur: 0,
          cheminee: 1,
          poele: 1,
          couvertures: 0,
          latrines: 0,
          bois: 0,
          eau: 0,
          matelas: 0,
          couchage: 0,
          bas_flancs: 0,
          lits: 0,
          mezzanine_etage: 0,
        },
      };

      const location = mapRefugiFromDTO(refugiDTO);
      expect(location.condition).toBe(0);
    });

    it('hauria de retornar undefined quan no hi ha info_comp', () => {
      const refugiDTO: RefugiDTO = {
        id: '1',
        name: 'Test',
        coord: { long: 1, lat: 42 },
        info_comp: undefined,
      };

      const location = mapRefugiFromDTO(refugiDTO);
      expect(location.condition).toBeUndefined();
    });

    it('hauria de mantenir ID com a string', () => {
      const refugiDTO: RefugiDTO = {
        id: '9999',
        name: 'Test',
        coord: { long: 1, lat: 42 },
      };

      const location = mapRefugiFromDTO(refugiDTO);
      expect(location.id).toBe('9999');
      expect(typeof location.id).toBe('string');
    });

    it('hauria de mantenir IDs amb zeros al davant', () => {
      const refugiDTO: RefugiDTO = {
        id: '00123',
        name: 'Test',
        coord: { long: 1, lat: 42 },
      };

      const location = mapRefugiFromDTO(refugiDTO);
      expect(location.id).toBe('00123');
    });

    it('hauria de convertir surname null a undefined', () => {
      const refugiDTO: RefugiDTO = {
        id: '1',
        name: 'Test',
        coord: { long: 1, lat: 42 },
        surname: null,
      };

      const location = mapRefugiFromDTO(refugiDTO);
      expect(location.surname).toBeUndefined();
    });

    it('hauria de mantenir els links', () => {
      const refugiDTO: RefugiDTO = {
        id: '1',
        name: 'Test',
        coord: { long: 1, lat: 42 },
        links: ['https://link1.com', 'https://link2.com'],
      };

      const location = mapRefugiFromDTO(refugiDTO);
      expect(location.links).toEqual(['https://link1.com', 'https://link2.com']);
    });

    it('hauria de gestionar links undefined', () => {
      const refugiDTO: RefugiDTO = {
        id: '1',
        name: 'Test',
        coord: { long: 1, lat: 42 },
        links: undefined,
      };

      const location = mapRefugiFromDTO(refugiDTO);
      expect(location.links).toBeUndefined();
    });

    it('hauria de mantenir modified_at', () => {
      const refugiDTO: RefugiDTO = {
        id: '1',
        name: 'Test',
        coord: { long: 1, lat: 42 },
        modified_at: '2023-05-15T10:30:00Z',
      };

      const location = mapRefugiFromDTO(refugiDTO);
      expect(location.modified_at).toBe('2023-05-15T10:30:00Z');
    });

    it('hauria de gestionar modified_at null', () => {
      const refugiDTO: RefugiDTO = {
        id: '1',
        name: 'Test',
        coord: { long: 1, lat: 42 },
        modified_at: null,
      };

      const location = mapRefugiFromDTO(refugiDTO);
      expect(location.modified_at).toBeNull();
    });
  });

  describe('mapRefugisFromDTO', () => {
    it('hauria de convertir un array buit', () => {
      const refugisDTO: RefugiDTO[] = [];
      const locations = mapRefugisFromDTO(refugisDTO);

      expect(locations).toHaveLength(0);
      expect(Array.isArray(locations)).toBe(true);
    });

    it('hauria de convertir múltiples RefugiDTO a Location', () => {
      const refugisDTO: RefugiDTO[] = [
        {
          id: '1',
          name: 'Refugi 1',
          coord: { long: 1, lat: 42 },
        },
        {
          id: '2',
          name: 'Refugi 2',
          coord: { long: 1.5, lat: 42.5 },
        },
        {
          id: '3',
          name: 'Refugi 3',
          coord: { long: 2, lat: 43 },
        },
      ];

      const locations = mapRefugisFromDTO(refugisDTO);

      expect(locations).toHaveLength(3);
      expect(locations[0].id).toBe('1');
      expect(locations[1].id).toBe('2');
      expect(locations[2].id).toBe('3');
    });

    it('hauria de mantenir l\'ordre dels refugis', () => {
      const refugisDTO: RefugiDTO[] = [
        {
          id: '100',
          name: 'Z',
          coord: { long: 1, lat: 42 },
        },
        {
          id: '50',
          name: 'A',
          coord: { long: 1, lat: 42 },
        },
        {
          id: '75',
          name: 'M',
          coord: { long: 1, lat: 42 },
        },
      ];

      const locations = mapRefugisFromDTO(refugisDTO);

      expect(locations[0].id).toBe('100');
      expect(locations[1].id).toBe('50');
      expect(locations[2].id).toBe('75');
    });

    it('hauria de gestionar un array amb un sol element', () => {
      const refugisDTO: RefugiDTO[] = [
        {
          id: '1',
          name: 'Únic Refugi',
          coord: { long: 1, lat: 42 },
        },
      ];

      const locations = mapRefugisFromDTO(refugisDTO);

      expect(locations).toHaveLength(1);
      expect(locations[0].name).toBe('Únic Refugi');
    });

    it('hauria de processar correctament refugis amb diferents tipus', () => {
      const refugisDTO: RefugiDTO[] = [
        {
          id: '1',
          name: 'Refugi Obert',
          coord: { long: 1, lat: 42 },
          type: 'cabane ouverte',
        },
        {
          id: '2',
          name: 'Refugi Tancat',
          coord: { long: 1, lat: 42 },
          type: 'Fermée',
        },
        {
          id: '3',
          name: 'Refugi Desconegut',
          coord: { long: 1, lat: 42 },
          type: undefined,
        },
      ];

      const locations = mapRefugisFromDTO(refugisDTO);

      expect(locations[0].type).toBe('cabane ouverte');
      expect(locations[1].type).toBe('Fermée');
      expect(locations[2].type).toBeUndefined();
    });
  });
});

describe('Validacions i casos límit', () => {
  describe('Coordenades límit', () => {
    it('hauria de gestionar coordenades a l\'equador', () => {
      const coord: Coord = {
        long: 0,
        lat: 0,
      };

      expect(coord.long).toBe(0);
      expect(coord.lat).toBe(0);
    });

    it('hauria de gestionar coordenades als pols', () => {
      const coord: Coord = {
        long: 0,
        lat: 90,
      };

      expect(coord.lat).toBe(90);
    });

    it('hauria de gestionar coordenades a la línia de canvi de data', () => {
      const coord: Coord = {
        long: 180,
        lat: 0,
      };

      expect(coord.long).toBe(180);
    });
  });

  describe('Altituds límit', () => {
    it('hauria de gestionar altitud 0 (nivell del mar)', () => {
      const location: Location = {
        name: 'Test',
        coord: { long: 1, lat: 42 },
        altitude: 0,
      };

      expect(location.altitude).toBe(0);
    });

    it('hauria de gestionar altituds molt altes', () => {
      const location: Location = {
        name: 'Test',
        coord: { long: 1, lat: 42 },
        altitude: 8848, // Everest
      };

      expect(location.altitude).toBe(8848);
    });

    it('hauria de gestionar altituds negatives (sota el nivell del mar)', () => {
      const location: Location = {
        name: 'Test',
        coord: { long: 1, lat: 42 },
        altitude: -100,
      };

      expect(location.altitude).toBe(-100);
    });
  });

  describe('Capacitats límit', () => {
    it('hauria de gestionar capacitat mínima (1 plaça)', () => {
      const location: Location = {
        name: 'Test',
        coord: { long: 1, lat: 42 },
        places: 1,
      };

      expect(location.places).toBe(1);
    });

    it('hauria de gestionar capacitats molt grans', () => {
      const location: Location = {
        name: 'Test',
        coord: { long: 1, lat: 42 },
        places: 1000,
      };

      expect(location.places).toBe(1000);
    });

    it('hauria de gestionar capacitat 0', () => {
      const location: Location = {
        name: 'Test',
        coord: { long: 1, lat: 42 },
        places: 0,
      };

      expect(location.places).toBe(0);
    });
  });

  describe('Strings buides i especials', () => {
    it('hauria de gestionar noms buits', () => {
      const location: Location = {
        name: '',
        coord: { long: 1, lat: 42 },
      };

      expect(location.name).toBe('');
    });

    it('hauria de gestionar noms amb caràcters especials', () => {
      const location: Location = {
        name: 'Refugi d\'Amitges - Cap de Còrtes',
        coord: { long: 1, lat: 42 },
      };

      expect(location.name).toBe('Refugi d\'Amitges - Cap de Còrtes');
    });

    it('hauria de gestionar descripcions molt llargues', () => {
      const longDescription = 'A'.repeat(10000);
      const location: Location = {
        name: 'Test',
        coord: { long: 1, lat: 42 },
        description: longDescription,
      };

      expect(location.description).toHaveLength(10000);
    });

    it('hauria de gestionar URLs malformades en links', () => {
      const location: Location = {
        name: 'Test',
        coord: { long: 1, lat: 42 },
        links: ['not-a-valid-url', 'https://valid.com', ''],
      };

      expect(location.links).toHaveLength(3);
    });
  });

  describe('Casos de dades inconsistents', () => {
    it('hauria de processar refugi sense places però amb capacitat 0', () => {
      const location: Location = {
        name: 'Test',
        coord: { long: 1, lat: 42 },
        places: 0,
      };

      expect(location.places).toBe(0);
    });

    it('hauria de processar refugi amb tipus amb espais', () => {
      const refugiDTO: RefugiDTO = {
        id: '1',
        name: 'Test',
        coord: { long: 1, lat: 42 },
        type: '  FERMÉE  ', // amb espais
      };

      const location = mapRefugiFromDTO(refugiDTO);
      expect(location.type).toBe('  FERMÉE  '); // es manté tal qual
    });
  });
});
