/**
 * Tests unitaris per RefugeProposalMapper
 * 
 * Cobreix:
 * - mapRefugeProposalFromDTO
 * - mapRefugeProposalsFromDTO
 */

import { mapRefugeProposalFromDTO, mapRefugeProposalsFromDTO } from '../../../services/mappers/RefugeProposalMapper';
import { RefugeProposalDTO } from '../../../services/dto/RefugeProposalDTO';

describe('RefugeProposalMapper', () => {
  describe('mapRefugeProposalFromDTO', () => {
    it('hauria de mapejar correctament una proposta de creació', () => {
      const proposalDTO: RefugeProposalDTO = {
        id: 'proposal-1',
        refuge_id: 'refuge-new',
        refuge_snapshot: null,
        action: 'create',
        payload: {
          name: 'Nou Refugi',
          coord: { lat: 42.5, lon: 1.5 },
        },
        comment: 'Proposta de nou refugi',
        status: 'pending',
        creator_uid: 'user-123',
        created_at: '2025-06-15T10:00:00Z',
        reviewer_uid: null,
        reviewed_at: null,
        rejection_reason: null,
      };

      const result = mapRefugeProposalFromDTO(proposalDTO);

      expect(result.id).toBe('proposal-1');
      expect(result.action).toBe('create');
      expect(result.status).toBe('pending');
      expect(result.refuge_snapshot).toBeNull();
      expect(result.payload.name).toBe('Nou Refugi');
    });

    it('hauria de mapejar correctament una proposta d\'actualització', () => {
      const proposalDTO: RefugeProposalDTO = {
        id: 'proposal-2',
        refuge_id: 'refuge-456',
        refuge_snapshot: {
          id: 'refuge-456',
          name: 'Refugi Original',
          coord: { lat: 42.6, lon: 0.9 },
          altitude: 2135,
          places: 50,
          massif: "Val d'Aran",
          departement: 'Lleida',
          type: 'non gardé',
          etat: 2,
          geojsonId: 'geo-123',
          modified_at: '2025-01-01T00:00:00Z',
          images_metadata: [],
        },
        action: 'update',
        payload: {
          altitude: 2200,
          places: 60,
        },
        comment: 'Actualització de capacitat',
        status: 'approved',
        creator_uid: 'user-456',
        created_at: '2025-06-16T12:00:00Z',
        reviewer_uid: 'admin-123',
        reviewed_at: '2025-06-17T09:00:00Z',
        rejection_reason: null,
      };

      const result = mapRefugeProposalFromDTO(proposalDTO);

      expect(result.action).toBe('update');
      expect(result.status).toBe('approved');
      expect(result.reviewer_uid).toBe('admin-123');
      expect(result.reviewed_at).toBe('2025-06-17T09:00:00Z');
      expect(result.refuge_snapshot).not.toBeNull();
    });

    it('hauria de mapejar correctament una proposta rebutjada', () => {
      const proposalDTO: RefugeProposalDTO = {
        id: 'proposal-3',
        refuge_id: 'refuge-789',
        refuge_snapshot: null,
        action: 'delete',
        payload: {},
        comment: 'Sol·licitud d\'eliminació',
        status: 'rejected',
        creator_uid: 'user-789',
        created_at: '2025-06-18T08:00:00Z',
        reviewer_uid: 'admin-456',
        reviewed_at: '2025-06-19T14:00:00Z',
        rejection_reason: 'El refugi encara està en ús i no es pot eliminar',
      };

      const result = mapRefugeProposalFromDTO(proposalDTO);

      expect(result.status).toBe('rejected');
      expect(result.rejection_reason).toBe('El refugi encara està en ús i no es pot eliminar');
    });

    it('hauria de preservar el payload com objecte raw', () => {
      const proposalDTO: RefugeProposalDTO = {
        id: 'proposal-4',
        refuge_id: 'refuge-test',
        refuge_snapshot: null,
        action: 'update',
        payload: {
          name: 'Nou nom',
          altitude: null, // Camp eliminat
          places: 30,
        },
        comment: null,
        status: 'pending',
        creator_uid: 'user-test',
        created_at: '2025-06-20T10:00:00Z',
        reviewer_uid: null,
        reviewed_at: null,
        rejection_reason: null,
      };

      const result = mapRefugeProposalFromDTO(proposalDTO);

      expect(result.payload).toEqual({
        name: 'Nou nom',
        altitude: null,
        places: 30,
      });
    });

    it('hauria de mapejar snapshot parcial sense coord complet', () => {
      const proposalDTO: RefugeProposalDTO = {
        id: 'proposal-5',
        refuge_id: 'refuge-partial',
        refuge_snapshot: {
          name: 'Refugi Parcial',
          // sense coord ni altres camps obligatoris
        } as any,
        action: 'update',
        payload: { places: 40 },
        comment: null,
        status: 'pending',
        creator_uid: 'user-abc',
        created_at: '2025-06-21T11:00:00Z',
        reviewer_uid: null,
        reviewed_at: null,
        rejection_reason: null,
      };

      const result = mapRefugeProposalFromDTO(proposalDTO);

      // Hauria de retornar el snapshot parcial tal qual
      expect(result.refuge_snapshot).toBeTruthy();
      expect(result.refuge_snapshot.name).toBe('Refugi Parcial');
    });
  });

  describe('mapRefugeProposalsFromDTO', () => {
    it('hauria de mapejar correctament un array de propostes', () => {
      const proposalsDTO: RefugeProposalDTO[] = [
        {
          id: 'proposal-a',
          refuge_id: 'refuge-1',
          refuge_snapshot: null,
          action: 'create',
          payload: { name: 'Refugi A' },
          comment: null,
          status: 'pending',
          creator_uid: 'user-1',
          created_at: '2025-06-01T00:00:00Z',
          reviewer_uid: null,
          reviewed_at: null,
          rejection_reason: null,
        },
        {
          id: 'proposal-b',
          refuge_id: 'refuge-2',
          refuge_snapshot: null,
          action: 'update',
          payload: { places: 50 },
          comment: 'Ampliació',
          status: 'approved',
          creator_uid: 'user-2',
          created_at: '2025-06-02T00:00:00Z',
          reviewer_uid: 'admin-1',
          reviewed_at: '2025-06-03T00:00:00Z',
          rejection_reason: null,
        },
      ];

      const result = mapRefugeProposalsFromDTO(proposalsDTO);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('proposal-a');
      expect(result[1].id).toBe('proposal-b');
      expect(result[0].action).toBe('create');
      expect(result[1].action).toBe('update');
    });

    it('hauria de retornar array buit per array buit', () => {
      const result = mapRefugeProposalsFromDTO([]);

      expect(result).toEqual([]);
    });
  });
});
