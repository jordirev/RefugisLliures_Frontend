/**
 * Tests unitaris per RefugisService
 * 
 * Aquest fitxer cobreix:
 * - getRefugiById: obtenir un refugi per ID
 * - getRefugis: obtenir refugis amb filtres
 * - getFavorites, addFavorite, removeFavorite (placeholders)
 * - Casos d'èxit i errors
 * - Gestió de respostes 404, 500, errors de xarxa
 * - Transformació de DTOs a models
 */

import { RefugisService } from '../../../services/RefugisService';
import * as apiClient from '../../../services/apiClient';
import { RefugiDTO, RefugisResponseDTO } from '../../../services/dto/RefugiDTO';
import { Location } from '../../../models';

// Mock de apiClient
jest.mock('../../../services/apiClient');

// Mock de mappers
jest.mock('../../../services/mappers/RefugiMapper', () => ({
  mapRefugisFromDTO: jest.fn((dtos: any[]) => {
    return dtos.map((dto: any) => ({
      id: dto.id,
      name: dto.name,
      coord: { long: dto.coord.long, lat: dto.coord.lat },
      altitude: dto.altitude,
      places: dto.places,
      region: dto.region,
    }));
  }),
}));

const mockApiGet = apiClient.apiGet as jest.MockedFunction<typeof apiClient.apiGet>;

describe('RefugisService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRefugiById', () => {
    const mockRefugiDTO: RefugiDTO = {
      id: 1,
      name: 'Refugi Test',
      coord: { long: 1.5, lat: 42.5 },
      altitude: 2500,
      places: 30,
      region: 'Pirineus',
      type: 'cabane ouverte',
    };

    it('hauria de retornar un refugi quan la petició té èxit', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockRefugiDTO),
      } as unknown as Response;

      mockApiGet.mockResolvedValue(mockResponse);

      const result = await RefugisService.getRefugiById(1);

      expect(mockApiGet).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/refugis/1/',
        { skipAuth: true }
      );
      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
      expect(result?.name).toBe('Refugi Test');
    });

    it('hauria de retornar null quan la resposta no és ok', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      } as Response;

      mockApiGet.mockResolvedValue(mockResponse);

      const result = await RefugisService.getRefugiById(999);

      expect(result).toBeNull();
    });

    it('hauria de retornar null quan la resposta és 500', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
      } as Response;

      mockApiGet.mockResolvedValue(mockResponse);

      const result = await RefugisService.getRefugiById(1);

      expect(result).toBeNull();
    });

    it('hauria de gestionar errors de xarxa', async () => {
      mockApiGet.mockRejectedValue(new Error('Network error'));

      const result = await RefugisService.getRefugiById(1);

      expect(result).toBeNull();
    });

    it('hauria de gestionar errors de timeout', async () => {
      mockApiGet.mockRejectedValue(new Error('Request timeout'));

      const result = await RefugisService.getRefugiById(1);

      expect(result).toBeNull();
    });

    it('hauria de cridar apiGet amb skipAuth: true', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockRefugiDTO),
      } as unknown as Response;

      mockApiGet.mockResolvedValue(mockResponse);

      await RefugisService.getRefugiById(1);

      expect(mockApiGet).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ skipAuth: true })
      );
    });

    it('hauria de gestionar resposta amb dades buides', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(null),
      } as unknown as Response;

      mockApiGet.mockResolvedValue(mockResponse);

      const result = await RefugisService.getRefugiById(1);

      expect(result).toBeNull();
    });
  });

  describe('getRefugis', () => {
    const mockRefugisResponse: RefugisResponseDTO = {
      count: 2,
      next: null,
      previous: null,
      results: [
        {
          id: 1,
          name: 'Refugi 1',
          coord: { long: 1.5, lat: 42.5 },
          altitude: 2500,
          places: 30,
          region: 'Pirineus',
          type: 'cabane ouverte',
        },
        {
          id: 2,
          name: 'Refugi 2',
          coord: { long: 1.6, lat: 42.6 },
          altitude: 2600,
          places: 20,
          region: 'Pallars',
          type: 'fermée',
        },
      ],
    };

    it('hauria de retornar una llista de refugis sense filtres', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockRefugisResponse),
      } as unknown as Response;

      mockApiGet.mockResolvedValue(mockResponse);

      const result = await RefugisService.getRefugis();

      expect(mockApiGet).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Refugi 1');
      expect(result[1].name).toBe('Refugi 2');
    });

    it('hauria de aplicar filtres d\'altitud', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockRefugisResponse),
      } as unknown as Response;

      mockApiGet.mockResolvedValue(mockResponse);

      await RefugisService.getRefugis({
        altitude_min: 2000,
        altitude_max: 3000,
      });

      expect(mockApiGet).toHaveBeenCalledWith(
        expect.stringContaining('altitude_min=2000'),
        expect.any(Object)
      );
      expect(mockApiGet).toHaveBeenCalledWith(
        expect.stringContaining('altitude_max=3000'),
        expect.any(Object)
      );
    });

    it('hauria de aplicar filtres de places', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockRefugisResponse),
      } as unknown as Response;

      mockApiGet.mockResolvedValue(mockResponse);

      await RefugisService.getRefugis({
        places_min: 10,
        places_max: 50,
      });

      expect(mockApiGet).toHaveBeenCalledWith(
        expect.stringContaining('places_min=10'),
        expect.any(Object)
      );
      expect(mockApiGet).toHaveBeenCalledWith(
        expect.stringContaining('places_max=50'),
        expect.any(Object)
      );
    });

    it('hauria de aplicar filtre de tipus', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockRefugisResponse),
      } as unknown as Response;

      mockApiGet.mockResolvedValue(mockResponse);

      await RefugisService.getRefugis({
        type: 'cabane ouverte',
      });

      expect(mockApiGet).toHaveBeenCalledWith(
        expect.stringContaining('type=cabane+ouverte'),
        expect.any(Object)
      );
    });

    it('hauria de aplicar filtre de condició', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockRefugisResponse),
      } as unknown as Response;

      mockApiGet.mockResolvedValue(mockResponse);

      await RefugisService.getRefugis({
        condition: 'bé',
      });

      expect(mockApiGet).toHaveBeenCalledWith(
        expect.stringContaining('condition=b%C3%A9'),
        expect.any(Object)
      );
    });

    it('hauria de aplicar filtre de cerca per nom', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockRefugisResponse),
      } as unknown as Response;

      mockApiGet.mockResolvedValue(mockResponse);

      await RefugisService.getRefugis({
        search: 'Refugi Test',
      });

      expect(mockApiGet).toHaveBeenCalledWith(
        expect.stringContaining('name=Refugi+Test'),
        expect.any(Object)
      );
    });

    it('hauria de prioritzar cerca sobre altres filtres', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockRefugisResponse),
      } as unknown as Response;

      mockApiGet.mockResolvedValue(mockResponse);

      await RefugisService.getRefugis({
        search: 'Test',
        altitude_min: 2000,
        type: 'cabane ouverte',
      });

      const callUrl = mockApiGet.mock.calls[0][0] as string;
      expect(callUrl).toContain('name=Test');
      expect(callUrl).not.toContain('altitude_min');
      expect(callUrl).not.toContain('type');
    });

    it('hauria de llançar error quan la resposta no és ok', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response;

      mockApiGet.mockResolvedValue(mockResponse);

      await expect(RefugisService.getRefugis()).rejects.toThrow(
        'No s\'han pogut carregar els refugis'
      );
    });

    it('hauria de gestionar errors de xarxa', async () => {
      mockApiGet.mockRejectedValue(new Error('Network error'));

      await expect(RefugisService.getRefugis()).rejects.toThrow(
        'No s\'han pogut carregar els refugis'
      );
    });

    it('hauria de retornar array buit quan results no és un array', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ results: null }),
      } as unknown as Response;

      mockApiGet.mockResolvedValue(mockResponse);

      const result = await RefugisService.getRefugis();

      expect(result).toEqual([]);
    });

    it('hauria de retornar array buit quan no hi ha results', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      } as unknown as Response;

      mockApiGet.mockResolvedValue(mockResponse);

      const result = await RefugisService.getRefugis();

      expect(result).toEqual([]);
    });

    it('hauria de retornar array buit quan la resposta és null', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(null),
      } as unknown as Response;

      mockApiGet.mockResolvedValue(mockResponse);

      const result = await RefugisService.getRefugis();

      expect(result).toEqual([]);
    });

    it('hauria de gestionar múltiples filtres simultàniament', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockRefugisResponse),
      } as unknown as Response;

      mockApiGet.mockResolvedValue(mockResponse);

      await RefugisService.getRefugis({
        altitude_min: 2000,
        altitude_max: 3000,
        places_min: 10,
        places_max: 50,
        type: 'cabane ouverte',
        condition: 'bé',
      });

      const callUrl = mockApiGet.mock.calls[0][0] as string;
      expect(callUrl).toContain('altitude_min=2000');
      expect(callUrl).toContain('altitude_max=3000');
      expect(callUrl).toContain('places_min=10');
      expect(callUrl).toContain('places_max=50');
      expect(callUrl).toContain('type=cabane+ouverte');
      expect(callUrl).toContain('condition=b%C3%A9');
    });

    it('hauria de gestionar altitud_min = 0', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockRefugisResponse),
      } as unknown as Response;

      mockApiGet.mockResolvedValue(mockResponse);

      await RefugisService.getRefugis({
        altitude_min: 0,
      });

      expect(mockApiGet).toHaveBeenCalledWith(
        expect.stringContaining('altitude_min=0'),
        expect.any(Object)
      );
    });

    it('hauria de cridar apiGet amb skipAuth: true', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockRefugisResponse),
      } as unknown as Response;

      mockApiGet.mockResolvedValue(mockResponse);

      await RefugisService.getRefugis();

      expect(mockApiGet).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ skipAuth: true })
      );
    });
  });

  describe('getFavorites', () => {
    it('hauria de retornar un array buit (placeholder)', async () => {
      const result = await RefugisService.getFavorites();

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('addFavorite', () => {
    it('hauria de completar sense errors (placeholder)', async () => {
      await expect(RefugisService.addFavorite(1)).resolves.toBeUndefined();
    });

    it('hauria de acceptar qualsevol ID de refugi', async () => {
      await expect(RefugisService.addFavorite(999)).resolves.toBeUndefined();
      await expect(RefugisService.addFavorite(0)).resolves.toBeUndefined();
      await expect(RefugisService.addFavorite(-1)).resolves.toBeUndefined();
    });
  });

  describe('removeFavorite', () => {
    it('hauria de completar sense errors (placeholder)', async () => {
      await expect(RefugisService.removeFavorite(1)).resolves.toBeUndefined();
    });

    it('hauria de acceptar qualsevol ID de refugi', async () => {
      await expect(RefugisService.removeFavorite(999)).resolves.toBeUndefined();
      await expect(RefugisService.removeFavorite(0)).resolves.toBeUndefined();
      await expect(RefugisService.removeFavorite(-1)).resolves.toBeUndefined();
    });
  });

  describe('Casos límit i edge cases', () => {
    it('hauria de gestionar IDs molt grans', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: 999999999,
          name: 'Refugi Gran ID',
          coord: { long: 1, lat: 42 },
        }),
      } as unknown as Response;

      mockApiGet.mockResolvedValue(mockResponse);

      const result = await RefugisService.getRefugiById(999999999);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(999999999);
    });

    it('hauria de gestionar IDs negatius', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      } as Response;

      mockApiGet.mockResolvedValue(mockResponse);

      const result = await RefugisService.getRefugiById(-1);

      expect(result).toBeNull();
    });

    it('hauria de gestionar filtres amb valors extrems', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ results: [] }),
      } as unknown as Response;

      mockApiGet.mockResolvedValue(mockResponse);

      const result = await RefugisService.getRefugis({
        altitude_min: -1000,
        altitude_max: 10000,
        places_min: 0,
        places_max: 999999,
      });

      expect(result).toEqual([]);
    });

    it('hauria de gestionar cerca amb caràcters especials', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ results: [] }),
      } as unknown as Response;

      mockApiGet.mockResolvedValue(mockResponse);

      await RefugisService.getRefugis({
        search: 'Refugi d\'Amitges & Co. <test>',
      });

      expect(mockApiGet).toHaveBeenCalled();
    });

    it('hauria de gestionar errors de JSON parse', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as Response;

      mockApiGet.mockResolvedValue(mockResponse);

      await expect(RefugisService.getRefugis()).rejects.toThrow();
    });
  });
});
