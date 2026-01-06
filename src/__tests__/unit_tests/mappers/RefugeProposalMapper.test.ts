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

    it('hauria de mapejar snapshot amb coord i name complets', () => {
      const proposalDTO: RefugeProposalDTO = {
        id: 'proposal-6',
        refuge_id: 'refuge-full',
        refuge_snapshot: {
          id: 'refuge-full',
          name: 'Refugi Complet',
          coord: { lat: 42.5, lon: 1.5 },
          altitude: 2000,
          places: 50,
          massif: 'Pirineus',
          departement: 'Lleida',
          type: 'non gardé',
          etat: 2,
          geojsonId: 'geo-456',
          modified_at: '2025-01-01T00:00:00Z',
          images_metadata: [],
        },
        action: 'update',
        payload: { altitude: 2100 },
        comment: null,
        status: 'pending',
        creator_uid: 'user-xyz',
        created_at: '2025-06-22T12:00:00Z',
        reviewer_uid: null,
        reviewed_at: null,
        rejection_reason: null,
      };

      const result = mapRefugeProposalFromDTO(proposalDTO);

      expect(result.refuge_snapshot).not.toBeNull();
      expect(result.refuge_snapshot.name).toBe('Refugi Complet');
    });

    it('hauria de gestionar error en el mapeig', () => {
      // Crear un DTO que pugui causar un error
      const invalidDTO = {
        id: 'proposal-error',
        refuge_id: null,
        refuge_snapshot: null,
        action: 'create',
        payload: null,
        comment: null,
        status: 'pending',
        creator_uid: 'user-err',
        created_at: '2025-06-23T00:00:00Z',
        reviewer_uid: null,
        reviewed_at: null,
        rejection_reason: null,
      } as RefugeProposalDTO;

      // El mapeig hauria de funcionar sense errors
      const result = mapRefugeProposalFromDTO(invalidDTO);
      expect(result.id).toBe('proposal-error');
    });

    it('hauria de gestionar snapshot sense name però amb coord', () => {
      const proposalDTO: RefugeProposalDTO = {
        id: 'proposal-7',
        refuge_id: 'refuge-noname',
        refuge_snapshot: {
          coord: { lat: 42.5, lon: 1.5 },
          // sense name
        } as any,
        action: 'update',
        payload: { places: 25 },
        comment: null,
        status: 'pending',
        creator_uid: 'user-noname',
        created_at: '2025-06-24T00:00:00Z',
        reviewer_uid: null,
        reviewed_at: null,
        rejection_reason: null,
      };

      const result = mapRefugeProposalFromDTO(proposalDTO);

      // Hauria de retornar el snapshot parcial
      expect(result.refuge_snapshot).toBeTruthy();
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

  describe('Gestió d\'errors', () => {
    it('hauria de gestionar error en mapSnapshotFromDTO i retornar el dto original', () => {
      // Mockem mapRefugiFromDTO per que llenci un error
      const RefugiMapper = require('../../../services/mappers/RefugiMapper');
      const originalMapRefugiFromDTO = RefugiMapper.mapRefugiFromDTO;
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      RefugiMapper.mapRefugiFromDTO = jest.fn(() => {
        throw new Error('Error de mapeig de refugi');
      });

      const proposalDTO: RefugeProposalDTO = {
        id: 'proposal-error-snapshot',
        refuge_id: 'refuge-error',
        refuge_snapshot: {
          id: 'refuge-error',
          name: 'Refugi amb Error',
          coord: { lat: 42.5, lon: 1.5 }, // Té coord i name, per tant cridarà mapRefugiFromDTO
          altitude: 2000,
          places: 50,
          massif: 'Pirineus',
          departement: 'Lleida',
          type: 'non gardé',
          etat: 2,
          geojsonId: 'geo-789',
          modified_at: '2025-01-01T00:00:00Z',
          images_metadata: [],
        },
        action: 'update',
        payload: { altitude: 2100 },
        comment: null,
        status: 'pending',
        creator_uid: 'user-error',
        created_at: '2025-06-25T00:00:00Z',
        reviewer_uid: null,
        reviewed_at: null,
        rejection_reason: null,
      };

      const result = mapRefugeProposalFromDTO(proposalDTO);

      // Hauria de retornar el dto original quan hi ha error
      expect(result.refuge_snapshot).toBeTruthy();
      expect(consoleSpy).toHaveBeenCalledWith(
        '[RefugeProposalMapper] Error mapping snapshot:',
        expect.any(Error)
      );

      // Restaurar
      RefugiMapper.mapRefugiFromDTO = originalMapRefugiFromDTO;
      consoleSpy.mockRestore();
    });

    it('hauria de llençar error quan el mapeig principal falla', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Creem un DTO amb un proxy que falli quan s'accedeix a propietats
      const handler = {
        get(target: any, prop: string) {
          if (prop === 'id') {
            // Primer accés retorna el valor normal
            return 'proposal-proxy';
          }
          // En el segon accés (durant l'assignació), llancem error
          if (prop === 'refuge_id') {
            throw new Error('Error accedint a refuge_id');
          }
          return target[prop];
        }
      };
      
      const baseDTO = {
        id: 'proposal-proxy',
        refuge_id: 'refuge-proxy',
        refuge_snapshot: null,
        action: 'create',
        payload: {},
        comment: null,
        status: 'pending',
        creator_uid: 'user-proxy',
        created_at: '2025-06-26T00:00:00Z',
        reviewer_uid: null,
        reviewed_at: null,
        rejection_reason: null,
      };
      
      const faultyDTO = new Proxy(baseDTO, handler) as unknown as RefugeProposalDTO;

      expect(() => mapRefugeProposalFromDTO(faultyDTO)).toThrow('Error accedint a refuge_id');
      
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
