/**
 * Tests unitaris per RefugeVisitMapper
 * 
 * Cobreix:
 * - mapRefugeVisitFromDTO
 * - mapRefugeVisitsFromDTO
 */

import { mapRefugeVisitFromDTO, mapRefugeVisitsFromDTO } from '../../../services/mappers/RefugeVisitMapper';
import { RefugeVisitListItemDTO } from '../../../services/dto/RefugeVisitDTO';

describe('RefugeVisitMapper', () => {
  describe('mapRefugeVisitFromDTO', () => {
    it('hauria de mapejar correctament una visita', () => {
      const visitDTO: RefugeVisitListItemDTO = {
        date: '2025-06-15',
        refuge_id: 'refuge-123',
        total_visitors: 25,
        is_visitor: true,
        num_visitors: 3,
      };

      const result = mapRefugeVisitFromDTO(visitDTO);

      expect(result).toEqual({
        date: '2025-06-15',
        refuge_id: 'refuge-123',
        total_visitors: 25,
        is_visitor: true,
        num_visitors: 3,
      });
    });

    it('hauria de mapejar correctament una visita sense ser visitant', () => {
      const visitDTO: RefugeVisitListItemDTO = {
        date: '2025-07-20',
        refuge_id: 'refuge-456',
        total_visitors: 10,
        is_visitor: false,
        num_visitors: 0,
      };

      const result = mapRefugeVisitFromDTO(visitDTO);

      expect(result.is_visitor).toBe(false);
      expect(result.num_visitors).toBe(0);
      expect(result.total_visitors).toBe(10);
    });

    it('hauria de preservar tots els camps correctament', () => {
      const visitDTO: RefugeVisitListItemDTO = {
        date: '2025-12-25',
        refuge_id: 'refuge-nadal',
        total_visitors: 100,
        is_visitor: true,
        num_visitors: 5,
      };

      const result = mapRefugeVisitFromDTO(visitDTO);

      expect(result.date).toBe('2025-12-25');
      expect(result.refuge_id).toBe('refuge-nadal');
      expect(result.total_visitors).toBe(100);
      expect(result.is_visitor).toBe(true);
      expect(result.num_visitors).toBe(5);
    });
  });

  describe('mapRefugeVisitsFromDTO', () => {
    it('hauria de mapejar correctament un array de visites', () => {
      const visitsDTO: RefugeVisitListItemDTO[] = [
        {
          date: '2025-06-15',
          refuge_id: 'refuge-1',
          total_visitors: 20,
          is_visitor: true,
          num_visitors: 2,
        },
        {
          date: '2025-06-16',
          refuge_id: 'refuge-1',
          total_visitors: 15,
          is_visitor: false,
          num_visitors: 0,
        },
        {
          date: '2025-06-17',
          refuge_id: 'refuge-1',
          total_visitors: 30,
          is_visitor: true,
          num_visitors: 4,
        },
      ];

      const result = mapRefugeVisitsFromDTO(visitsDTO);

      expect(result).toHaveLength(3);
      expect(result[0].date).toBe('2025-06-15');
      expect(result[1].date).toBe('2025-06-16');
      expect(result[2].date).toBe('2025-06-17');
      expect(result[0].is_visitor).toBe(true);
      expect(result[1].is_visitor).toBe(false);
    });

    it('hauria de retornar array buit per array buit', () => {
      const result = mapRefugeVisitsFromDTO([]);

      expect(result).toEqual([]);
    });

    it('hauria de mapejar correctament un array amb un sol element', () => {
      const visitsDTO: RefugeVisitListItemDTO[] = [
        {
          date: '2025-08-01',
          refuge_id: 'refuge-single',
          total_visitors: 5,
          is_visitor: true,
          num_visitors: 1,
        },
      ];

      const result = mapRefugeVisitsFromDTO(visitsDTO);

      expect(result).toHaveLength(1);
      expect(result[0].refuge_id).toBe('refuge-single');
    });
  });
});
