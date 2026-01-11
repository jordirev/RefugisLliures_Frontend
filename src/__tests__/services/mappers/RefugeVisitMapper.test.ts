/**
 * Tests for RefugeVisitMapper functions
 */

import {
  mapRefugeVisitFromDTO,
  mapRefugeVisitsFromDTO,
} from '../../../services/mappers/RefugeVisitMapper';
import { RefugeVisitListItemDTO } from '../../../services/dto/RefugeVisitDTO';

describe('RefugeVisitMapper', () => {
  describe('mapRefugeVisitFromDTO', () => {
    const validVisitDTO: RefugeVisitListItemDTO = {
      date: '2024-01-15',
      refuge_id: 'refuge-1',
      total_visitors: 25,
      is_visitor: true,
      num_visitors: 3,
    };

    it('should convert a complete visit DTO to RefugeVisit model', () => {
      const result = mapRefugeVisitFromDTO(validVisitDTO);

      expect(result.date).toBe('2024-01-15');
      expect(result.refuge_id).toBe('refuge-1');
      expect(result.total_visitors).toBe(25);
      expect(result.is_visitor).toBe(true);
      expect(result.num_visitors).toBe(3);
    });

    it('should handle visit where user is not a visitor', () => {
      const visitNotVisitor: RefugeVisitListItemDTO = {
        ...validVisitDTO,
        is_visitor: false,
        num_visitors: 0,
      };

      const result = mapRefugeVisitFromDTO(visitNotVisitor);

      expect(result.is_visitor).toBe(false);
      expect(result.num_visitors).toBe(0);
    });

    it('should handle visit with zero total visitors', () => {
      const visitNoVisitors: RefugeVisitListItemDTO = {
        ...validVisitDTO,
        total_visitors: 0,
        is_visitor: false,
        num_visitors: 0,
      };

      const result = mapRefugeVisitFromDTO(visitNoVisitors);

      expect(result.total_visitors).toBe(0);
    });

    it('should handle large number of visitors', () => {
      const visitManyVisitors: RefugeVisitListItemDTO = {
        ...validVisitDTO,
        total_visitors: 500,
        num_visitors: 10,
      };

      const result = mapRefugeVisitFromDTO(visitManyVisitors);

      expect(result.total_visitors).toBe(500);
      expect(result.num_visitors).toBe(10);
    });
  });

  describe('mapRefugeVisitsFromDTO', () => {
    it('should convert array of visit DTOs', () => {
      const visits: RefugeVisitListItemDTO[] = [
        {
          date: '2024-01-15',
          refuge_id: 'refuge-1',
          total_visitors: 25,
          is_visitor: true,
          num_visitors: 3,
        },
        {
          date: '2024-01-16',
          refuge_id: 'refuge-1',
          total_visitors: 30,
          is_visitor: false,
          num_visitors: 0,
        },
        {
          date: '2024-01-17',
          refuge_id: 'refuge-1',
          total_visitors: 15,
          is_visitor: true,
          num_visitors: 2,
        },
      ];

      const result = mapRefugeVisitsFromDTO(visits);

      expect(result).toHaveLength(3);
      expect(result[0].date).toBe('2024-01-15');
      expect(result[1].date).toBe('2024-01-16');
      expect(result[2].date).toBe('2024-01-17');
    });

    it('should return empty array for empty input', () => {
      const result = mapRefugeVisitsFromDTO([]);
      expect(result).toEqual([]);
    });

    it('should handle single item array', () => {
      const visits: RefugeVisitListItemDTO[] = [
        {
          date: '2024-01-15',
          refuge_id: 'refuge-1',
          total_visitors: 25,
          is_visitor: true,
          num_visitors: 3,
        },
      ];

      const result = mapRefugeVisitsFromDTO(visits);

      expect(result).toHaveLength(1);
      expect(result[0].refuge_id).toBe('refuge-1');
    });
  });
});
