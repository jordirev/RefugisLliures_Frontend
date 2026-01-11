/**
 * Tests for RefugiMapper functions
 */

import {
  mapCoordFromDTO,
  mapCoordToDTO,
  mapInfoCompFromDTO,
  mapInfoCompToDTO,
  mapRefugiFromDTO,
  mapPartialRefugiToDTO,
  mapperUserRefugiInfoDTO,
  mapperUserRefugiInfoResponseDTO,
  mapImageMetadataFromDTO,
} from '../../../services/mappers/RefugiMapper';

describe('RefugiMapper', () => {
  describe('mapCoordFromDTO', () => {
    it('should convert CoordDTO to Coord', () => {
      const result = mapCoordFromDTO({ long: 1.5, lat: 42.5 });
      expect(result).toEqual({ long: 1.5, lat: 42.5 });
    });
  });

  describe('mapCoordToDTO', () => {
    it('should convert Coord to CoordDTO', () => {
      const result = mapCoordToDTO({ long: 1.5, lat: 42.5 });
      expect(result).toEqual({ long: 1.5, lat: 42.5 });
    });
  });

  describe('mapInfoCompFromDTO', () => {
    it('should return undefined for undefined input', () => {
      const result = mapInfoCompFromDTO(undefined);
      expect(result).toBeUndefined();
    });

    it('should convert all info_comp fields from 1/0 to boolean', () => {
      const input = {
        manque_un_mur: 1,
        cheminee: 0,
        poele: 1,
        couvertures: 0,
        latrines: 1,
        bois: 0,
        eau: 1,
        matelas: 0,
        couchage: 1,
        bas_flancs: 0,
        lits: 1,
        mezzanine_etage: 0,
      };

      const result = mapInfoCompFromDTO(input);

      expect(result).toEqual({
        manque_un_mur: true,
        cheminee: false,
        poele: true,
        couvertures: false,
        latrines: true,
        bois: false,
        eau: true,
        matelas: false,
        couchage: true,
        bas_flancs: false,
        lits: true,
        mezzanine_etage: false,
      });
    });
  });

  describe('mapInfoCompToDTO', () => {
    it('should return undefined for undefined input', () => {
      const result = mapInfoCompToDTO(undefined);
      expect(result).toBeUndefined();
    });

    it('should convert all info_comp fields from boolean to 1/0', () => {
      const input = {
        manque_un_mur: true,
        cheminee: false,
        poele: true,
        couvertures: false,
        latrines: true,
        bois: false,
        eau: true,
        matelas: false,
        couchage: true,
        bas_flancs: false,
        lits: true,
        mezzanine_etage: false,
      };

      const result = mapInfoCompToDTO(input);

      expect(result).toEqual({
        manque_un_mur: 1,
        cheminee: 0,
        poele: 1,
        couvertures: 0,
        latrines: 1,
        bois: 0,
        eau: 1,
        matelas: 0,
        couchage: 1,
        bas_flancs: 0,
        lits: 1,
        mezzanine_etage: 0,
      });
    });
  });

  describe('mapImageMetadataFromDTO', () => {
    it('should convert ImageMetadataDTO to ImageMetadata', () => {
      const input = {
        key: 'image-key-123',
        url: 'https://example.com/image.jpg',
        uploaded_at: '2024-01-15T10:00:00Z',
        creator_uid: 'user-123',
        experience_id: 'exp-1',
      };

      const result = mapImageMetadataFromDTO(input);

      expect(result).toEqual({
        key: 'image-key-123',
        url: 'https://example.com/image.jpg',
        uploaded_at: '2024-01-15T10:00:00Z',
        creator_uid: 'user-123',
        experience_id: 'exp-1',
      });
    });
  });

  describe('mapRefugiFromDTO', () => {
    const validDTO = {
      id: 'refuge-1',
      name: 'Test Refuge',
      surname: 'The Test',
      coord: { long: 1.5, lat: 42.5 },
      altitude: 2000,
      places: 20,
      description: 'A test refuge',
      links: ['https://example.com'],
      type: 1,
      modified_at: '2024-01-15T10:00:00Z',
      region: 'Catalunya',
      departement: 'Lleida',
      condition: 2,
      visitors: 100,
    };

    it('should convert a complete RefugiDTO to Location', () => {
      const result = mapRefugiFromDTO(validDTO);

      expect(result.id).toBe('refuge-1');
      expect(result.name).toBe('Test Refuge');
      expect(result.surname).toBe('The Test');
      expect(result.coord).toEqual({ long: 1.5, lat: 42.5 });
      expect(result.altitude).toBe(2000);
      expect(result.places).toBe(20);
    });

    it('should handle missing coord by using default values', () => {
      const dtoWithoutCoord = { ...validDTO, coord: undefined };
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = mapRefugiFromDTO(dtoWithoutCoord as any);

      expect(result.coord).toEqual({ lat: 0, long: 0 });
      consoleSpy.mockRestore();
    });

    it('should handle images_metadata', () => {
      const dtoWithImages = {
        ...validDTO,
        images_metadata: [
          {
            key: 'image-1',
            url: 'https://example.com/image1.jpg',
            uploaded_at: '2024-01-15T10:00:00Z',
            creator_uid: 'user-123',
          },
        ],
      };

      const result = mapRefugiFromDTO(dtoWithImages);

      expect(result.images_metadata).toHaveLength(1);
      expect(result.images_metadata?.[0].key).toBe('image-1');
    });

    it('should determine condition based on info_comp amenities', () => {
      const dtoWithInfoComp = {
        ...validDTO,
        condition: undefined,
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

      const result = mapRefugiFromDTO(dtoWithInfoComp);

      // 10 amenities >= 8, so condition should be 3
      expect(result.condition).toBe(3);
    });

    it('should set condition to 0 if missing a wall', () => {
      const dtoWithMissingWall = {
        ...validDTO,
        condition: undefined,
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

      const result = mapRefugiFromDTO(dtoWithMissingWall);

      expect(result.condition).toBe(0);
    });
  });

  describe('mapPartialRefugiToDTO', () => {
    it('should throw error if name is missing on create', () => {
      expect(() => {
        mapPartialRefugiToDTO({ coord: { long: 1, lat: 42 } }, 'create');
      }).toThrow('Name and coordinate data is mandatory');
    });

    it('should throw error if coord is missing on create', () => {
      expect(() => {
        mapPartialRefugiToDTO({ name: 'Test' }, 'create');
      }).toThrow('Name and coordinate data is mandatory');
    });

    it('should convert partial location to DTO for update', () => {
      const partial = {
        name: 'Updated Name',
        description: 'Updated description',
        altitude: 2500,
      };

      const result = mapPartialRefugiToDTO(partial, 'update');

      expect(result.name).toBe('Updated Name');
      expect(result.description).toBe('Updated description');
      expect(result.altitude).toBe(2500);
    });

    it('should handle null surname', () => {
      const partial = {
        name: 'Test',
        surname: null,
        coord: { long: 1, lat: 42 },
      };

      const result = mapPartialRefugiToDTO(partial, 'create');

      expect(result.surname).toBeNull();
    });
  });

  describe('mapperUserRefugiInfoDTO', () => {
    it('should convert UserRefugiInfoDTO to Location', () => {
      const input = {
        id: 'refuge-1',
        name: 'Test Refuge',
        coord: { long: 1.5, lat: 42.5 },
        places: 20,
        region: 'Catalunya',
      };

      const result = mapperUserRefugiInfoDTO(input);

      expect(result.id).toBe('refuge-1');
      expect(result.name).toBe('Test Refuge');
      expect(result.coord).toEqual({ long: 1.5, lat: 42.5 });
      expect(result.places).toBe(20);
      expect(result.region).toBe('Catalunya');
    });

    it('should throw error if coord is missing', () => {
      const input = {
        id: 'refuge-1',
        name: 'Test Refuge',
        coord: undefined,
      };

      expect(() => {
        mapperUserRefugiInfoDTO(input as any);
      }).toThrow('Missing coordinate data');
    });

    it('should handle images_metadata', () => {
      const input = {
        id: 'refuge-1',
        name: 'Test Refuge',
        coord: { long: 1.5, lat: 42.5 },
        images_metadata: [
          {
            key: 'image-1',
            url: 'https://example.com/image.jpg',
            uploaded_at: '2024-01-15T10:00:00Z',
            creator_uid: 'user-123',
          },
        ],
      };

      const result = mapperUserRefugiInfoDTO(input);

      expect(result.images_metadata).toHaveLength(1);
    });
  });

  describe('mapperUserRefugiInfoResponseDTO', () => {
    it('should convert array of UserRefugiInfoDTO to Location[]', () => {
      const input = [
        {
          id: 'refuge-1',
          name: 'Test Refuge 1',
          coord: { long: 1.5, lat: 42.5 },
        },
        {
          id: 'refuge-2',
          name: 'Test Refuge 2',
          coord: { long: 2.0, lat: 43.0 },
        },
      ];

      const result = mapperUserRefugiInfoResponseDTO(input);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('refuge-1');
      expect(result[1].id).toBe('refuge-2');
    });

    it('should return empty array for empty input', () => {
      const result = mapperUserRefugiInfoResponseDTO([]);
      expect(result).toEqual([]);
    });
  });
});
