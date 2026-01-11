/**
 * Tests unitaris per RenovationMapper
 * 
 * Cobreix:
 * - mapRenovationFromDTO
 */

import { mapRenovationFromDTO } from '../../../services/mappers/RenovationMapper';
import { RenovationDTO } from '../../../services/dto/RenovationDTO';

describe('RenovationMapper', () => {
  describe('mapRenovationFromDTO', () => {
    it('hauria de mapejar correctament una renovació completa', () => {
      const renovationDTO: RenovationDTO = {
        id: 'renovation-1',
        creator_uid: 'user-123',
        refuge_id: 'refuge-456',
        ini_date: '2025-07-15',
        fin_date: '2025-07-20',
        description: 'Renovació del sostre i millora de les instal·lacions',
        materials_needed: 'Fusta, teules, ciment',
        group_link: 'https://chat.whatsapp.com/abcd1234',
        participants_uids: ['user-123', 'user-456', 'user-789'],
      };

      const result = mapRenovationFromDTO(renovationDTO);

      expect(result).toEqual({
        id: 'renovation-1',
        creator_uid: 'user-123',
        refuge_id: 'refuge-456',
        ini_date: '2025-07-15',
        fin_date: '2025-07-20',
        description: 'Renovació del sostre i millora de les instal·lacions',
        materials_needed: 'Fusta, teules, ciment',
        group_link: 'https://chat.whatsapp.com/abcd1234',
        participants_uids: ['user-123', 'user-456', 'user-789'],
      });
    });

    it('hauria de convertir materials_needed undefined a null', () => {
      const renovationDTO: RenovationDTO = {
        id: 'renovation-2',
        creator_uid: 'user-abc',
        refuge_id: 'refuge-def',
        ini_date: '2025-08-01',
        fin_date: '2025-08-05',
        description: 'Neteja general',
        materials_needed: undefined,
        group_link: 'https://t.me/grup-neteja',
        participants_uids: ['user-abc'],
      };

      const result = mapRenovationFromDTO(renovationDTO);

      expect(result.materials_needed).toBeNull();
    });

    it('hauria de retornar array buit si participants_uids és undefined', () => {
      const renovationDTO: RenovationDTO = {
        id: 'renovation-3',
        creator_uid: 'user-xyz',
        refuge_id: 'refuge-ghi',
        ini_date: '2025-09-10',
        fin_date: '2025-09-12',
        description: 'Reparació de finestres',
        materials_needed: 'Vidre, silicona',
        group_link: 'https://chat.whatsapp.com/xyz',
        participants_uids: undefined,
      };

      const result = mapRenovationFromDTO(renovationDTO);

      expect(result.participants_uids).toEqual([]);
    });

    it('hauria de preservar tots els camps correctament', () => {
      const renovationDTO: RenovationDTO = {
        id: 'unique-renovation-id',
        creator_uid: 'creator-uid-unique',
        refuge_id: 'refuge-unique-id',
        ini_date: '2025-12-25',
        fin_date: '2025-12-31',
        description: 'Descripció amb caràcters especials: àèéíòóú ñ €',
        materials_needed: 'Materials especials',
        group_link: 'https://example.com/group',
        participants_uids: ['p1', 'p2', 'p3', 'p4', 'p5'],
      };

      const result = mapRenovationFromDTO(renovationDTO);

      expect(result.id).toBe('unique-renovation-id');
      expect(result.creator_uid).toBe('creator-uid-unique');
      expect(result.refuge_id).toBe('refuge-unique-id');
      expect(result.ini_date).toBe('2025-12-25');
      expect(result.fin_date).toBe('2025-12-31');
      expect(result.description).toBe('Descripció amb caràcters especials: àèéíòóú ñ €');
      expect(result.materials_needed).toBe('Materials especials');
      expect(result.group_link).toBe('https://example.com/group');
      expect(result.participants_uids).toHaveLength(5);
    });

    it('hauria de gestionar renovació amb array de participants buit', () => {
      const renovationDTO: RenovationDTO = {
        id: 'renovation-empty-participants',
        creator_uid: 'user-solo',
        refuge_id: 'refuge-solo',
        ini_date: '2025-10-01',
        fin_date: '2025-10-01',
        description: 'Jornada de voluntariat individual',
        materials_needed: null,
        group_link: 'https://solo.link',
        participants_uids: [],
      };

      const result = mapRenovationFromDTO(renovationDTO);

      expect(result.participants_uids).toEqual([]);
    });
  });
});
