/**
 * Tests unitaris per RenovationService
 * 
 * Cobreix:
 * - getAllRenovations
 * - getRenovationById
 * - getRenovationsByRefugeId
 * - getRenovationsByUser
 * - createRenovation
 * - updateRenovation
 * - deleteRenovation
 * - joinRenovation
 * - leaveRenovation
 */

import { RenovationService } from '../../../services/RenovationService';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../../services/apiClient';

// Mock apiClient
jest.mock('../../../services/apiClient', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPatch: jest.fn(),
  apiDelete: jest.fn(),
}));

describe('RenovationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllRenovations', () => {
    it('hauria de retornar totes les renovacions', async () => {
      const mockRenovations = [
        {
          id: 'renovation-1',
          refuge_id: 'refuge-123',
          ini_date: '2025-07-15',
          fin_date: '2025-07-20',
          description: 'Renovació del sostre',
          group_link: 'https://chat.whatsapp.com/abc',
          creator_uid: 'user-123',
          participants_uids: ['user-123'],
        },
      ];

      (apiGet as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockRenovations),
      });

      const result = await RenovationService.getAllRenovations();

      expect(apiGet).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/renovations/'
      );
      expect(result).toEqual(mockRenovations);
    });

    it('hauria de llançar error per errors de servidor', async () => {
      (apiGet as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(RenovationService.getAllRenovations()).rejects.toThrow(
        "No s'han pogut carregar les renovations"
      );
    });
  });

  describe('getRenovationById', () => {
    it('hauria de retornar una renovació per ID', async () => {
      const mockRenovation = {
        id: 'renovation-123',
        refuge_id: 'refuge-456',
        ini_date: '2025-08-01',
        fin_date: '2025-08-05',
        description: 'Neteja general',
        group_link: 'https://t.me/neteja',
        creator_uid: 'user-abc',
        participants_uids: ['user-abc', 'user-def'],
      };

      (apiGet as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockRenovation),
      });

      const result = await RenovationService.getRenovationById('renovation-123');

      expect(apiGet).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/renovations/renovation-123/'
      );
      expect(result).toEqual(mockRenovation);
    });

    it('hauria de retornar null quan no existeix', async () => {
      (apiGet as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await RenovationService.getRenovationById('inexistent');

      expect(result).toBeNull();
    });

    it('hauria de retornar null per errors generals', async () => {
      (apiGet as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server Error',
      });

      const result = await RenovationService.getRenovationById('renovation-123');

      expect(result).toBeNull();
    });
  });

  describe('getRenovationsByRefugeId', () => {
    it('hauria de retornar les renovacions d\'un refugi', async () => {
      const mockRenovations = [
        {
          id: 'renovation-1',
          refuge_id: 'refuge-123',
          ini_date: '2025-07-15',
          fin_date: '2025-07-20',
          description: 'Primera renovació',
          group_link: 'https://link1.com',
          creator_uid: 'user-1',
          participants_uids: [],
        },
        {
          id: 'renovation-2',
          refuge_id: 'refuge-123',
          ini_date: '2025-08-01',
          fin_date: '2025-08-05',
          description: 'Segona renovació',
          group_link: 'https://link2.com',
          creator_uid: 'user-2',
          participants_uids: [],
        },
      ];

      (apiGet as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockRenovations),
      });

      const result = await RenovationService.getRenovationsByRefugeId('refuge-123');

      expect(apiGet).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/refuges/refuge-123/renovations/'
      );
      expect(result).toEqual(mockRenovations);
    });
  });

  describe('createRenovation', () => {
    it('hauria de crear una renovació correctament', async () => {
      const newRenovation = {
        refuge_id: 'refuge-123',
        ini_date: '2025-09-01',
        fin_date: '2025-09-05',
        description: 'Nova renovació',
        group_link: 'https://chat.whatsapp.com/new',
      };

      const mockResponse = {
        id: 'renovation-new',
        ...newRenovation,
        creator_uid: 'user-123',
        participants_uids: ['user-123'],
      };

      (apiPost as jest.Mock).mockResolvedValue({
        ok: true,
        status: 201,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await RenovationService.createRenovation(newRenovation);

      expect(apiPost).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/renovations/',
        newRenovation
      );
      expect(result).toEqual(mockResponse);
    });

    it('hauria de llançar error per dates solapades', async () => {
      (apiPost as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          error: 'Ja existeix una renovació per aquestes dates',
        }),
      });

      await expect(
        RenovationService.createRenovation({
          refuge_id: 'refuge-123',
          ini_date: '2025-07-15',
          fin_date: '2025-07-20',
          description: 'Conflicte',
          group_link: 'https://link.com',
        })
      ).rejects.toThrow('Ja existeix una renovació per aquestes dates');
    });
  });

  describe('updateRenovation', () => {
    it('hauria d\'actualitzar una renovació correctament', async () => {
      const updateData = {
        description: 'Descripció actualitzada',
      };

      const mockResponse = {
        id: 'renovation-123',
        refuge_id: 'refuge-456',
        ini_date: '2025-08-01',
        fin_date: '2025-08-05',
        description: 'Descripció actualitzada',
        group_link: 'https://link.com',
        creator_uid: 'user-abc',
        participants_uids: ['user-abc'],
      };

      (apiPatch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await RenovationService.updateRenovation('renovation-123', updateData);

      expect(apiPatch).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/renovations/renovation-123/?id=renovation-123',
        updateData
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteRenovation', () => {
    it('hauria d\'eliminar una renovació correctament', async () => {
      (apiDelete as jest.Mock).mockResolvedValue({
        ok: true,
        status: 204,
      });

      await expect(
        RenovationService.deleteRenovation('renovation-123')
      ).resolves.toBeUndefined();

      expect(apiDelete).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/renovations/renovation-123/?id=renovation-123'
      );
    });

    it('hauria de llançar error per falta de permisos', async () => {
      (apiDelete as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        json: jest.fn().mockResolvedValue({
          error: 'Només el creador pot eliminar aquesta renovation',
        }),
      });

      await expect(RenovationService.deleteRenovation('renovation-123')).rejects.toThrow(
        'Només el creador pot eliminar aquesta renovation'
      );
    });
  });

  describe('joinRenovation', () => {
    it('hauria de permetre unir-se a una renovació', async () => {
      const mockResponse = {
        id: 'renovation-123',
        participants_uids: ['user-abc', 'user-new'],
      };

      (apiPost as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await RenovationService.joinRenovation('renovation-123');

      expect(apiPost).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/renovations/renovation-123/participants/',
        {}
      );
      expect(result).toEqual(mockResponse);
    });

    it('hauria de llançar error si ja és participant', async () => {
      (apiPost as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          error: "L'usuari ja és participant d'aquesta renovació",
        }),
      });

      await expect(RenovationService.joinRenovation('renovation-123')).rejects.toThrow(
        "L'usuari ja és participant d'aquesta renovació"
      );
    });
  });

  describe('removeParticipant', () => {
    it('hauria de permetre eliminar un participant', async () => {
      const mockResponse = {
        id: 'renovation-123',
        participants_uids: ['user-abc'],
      };

      (apiDelete as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await RenovationService.removeParticipant('renovation-123', 'user-to-remove');

      expect(apiDelete).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/renovations/renovation-123/participants/user-to-remove/'
      );
      expect(result).toEqual(mockResponse);
    });

    it('hauria de llançar error si no té permisos', async () => {
      (apiDelete as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        json: jest.fn().mockResolvedValue({
          error: 'No tens permisos per eliminar aquest participant',
        }),
      });

      await expect(RenovationService.removeParticipant('renovation-123', 'user-xyz')).rejects.toThrow(
        'No tens permís per eliminar aquest participant'
      );
    });
  });
});
