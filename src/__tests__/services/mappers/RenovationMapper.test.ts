/**
 * Tests for RenovationMapper functions
 */

import { mapRenovationFromDTO } from '../../../services/mappers/RenovationMapper';
import { RenovationDTO } from '../../../services/dto/RenovationDTO';

describe('RenovationMapper', () => {
  describe('mapRenovationFromDTO', () => {
    const validRenovationDTO: RenovationDTO = {
      id: 'renovation-1',
      creator_uid: 'user-123',
      refuge_id: 'refuge-1',
      ini_date: '2024-06-01',
      fin_date: '2024-06-07',
      description: 'Roof repair and maintenance',
      materials_needed: 'Wood, nails, waterproof coating',
      group_link: 'https://chat.example.com/group123',
      participants_uids: ['user-123', 'user-456', 'user-789'],
    };

    it('should convert a complete renovation DTO to Renovation model', () => {
      const result = mapRenovationFromDTO(validRenovationDTO);

      expect(result.id).toBe('renovation-1');
      expect(result.creator_uid).toBe('user-123');
      expect(result.refuge_id).toBe('refuge-1');
      expect(result.ini_date).toBe('2024-06-01');
      expect(result.fin_date).toBe('2024-06-07');
      expect(result.description).toBe('Roof repair and maintenance');
      expect(result.materials_needed).toBe('Wood, nails, waterproof coating');
      expect(result.group_link).toBe('https://chat.example.com/group123');
      expect(result.participants_uids).toEqual(['user-123', 'user-456', 'user-789']);
    });

    it('should handle renovation with null materials_needed', () => {
      const renovationWithoutMaterials: RenovationDTO = {
        ...validRenovationDTO,
        materials_needed: null as any,
      };

      const result = mapRenovationFromDTO(renovationWithoutMaterials);

      expect(result.materials_needed).toBeNull();
    });

    it('should handle renovation with undefined materials_needed', () => {
      const renovationWithUndefinedMaterials: RenovationDTO = {
        ...validRenovationDTO,
        materials_needed: undefined as any,
      };

      const result = mapRenovationFromDTO(renovationWithUndefinedMaterials);

      expect(result.materials_needed).toBeNull();
    });

    it('should handle renovation with empty participants array', () => {
      const renovationNoParticipants: RenovationDTO = {
        ...validRenovationDTO,
        participants_uids: [],
      };

      const result = mapRenovationFromDTO(renovationNoParticipants);

      expect(result.participants_uids).toEqual([]);
    });

    it('should handle renovation with undefined participants (fallback to empty)', () => {
      const renovationUndefinedParticipants: any = {
        ...validRenovationDTO,
        participants_uids: undefined,
      };

      const result = mapRenovationFromDTO(renovationUndefinedParticipants);

      expect(result.participants_uids).toEqual([]);
    });

    it('should handle renovation with only creator as participant', () => {
      const renovationCreatorOnly: RenovationDTO = {
        ...validRenovationDTO,
        participants_uids: ['user-123'],
      };

      const result = mapRenovationFromDTO(renovationCreatorOnly);

      expect(result.participants_uids).toHaveLength(1);
      expect(result.participants_uids[0]).toBe('user-123');
    });

    it('should handle renovation without group_link', () => {
      const renovationNoGroupLink: RenovationDTO = {
        ...validRenovationDTO,
        group_link: '',
      };

      const result = mapRenovationFromDTO(renovationNoGroupLink);

      expect(result.group_link).toBe('');
    });
  });
});
