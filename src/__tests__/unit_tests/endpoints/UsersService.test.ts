/**
 * Tests unitaris per UsersService
 * 
 * Aquest fitxer cobreix:
 * - createUser: crear un nou usuari
 * - getUserByUid: obtenir un usuari per UID
 * - updateUser: actualitzar dades d'usuari
 * - deleteUser: eliminar un usuari
 * - Casos d'èxit i errors
 * - Gestió de respostes 404, 500, errors de xarxa
 * - Transformació de DTOs a models
 */

import { UsersService, UserCreateData, UserUpdateData } from '../../../services/UsersService';
import * as apiClient from '../../../services/apiClient';
import { UserDTO } from '../../../services/dto';
import { User } from '../../../models';

// Mock de apiClient
jest.mock('../../../services/apiClient');

// Mock de mappers
jest.mock('../../../services/mappers/UserMapper', () => ({
  mapUserFromDTO: jest.fn((dto: UserDTO): User => ({
    uid: dto.uid,
    username: dto.username,
    email: dto.email,
    avatar: dto.avatar || undefined,
    language: dto.language,
    favourite_refuges: dto.favourite_refuges || [],
    visited_refuges: dto.visited_refuges || [],
    renovations: dto.renovations || [],
    num_uploaded_photos: dto.num_uploaded_photos ?? null,
    num_shared_experiences: dto.num_shared_experiences ?? null,
    num_renovated_refuges: dto.num_renovated_refuges ?? null,
    created_at: dto.created_at,
  })),
}));

const mockApiGet = apiClient.apiGet as jest.MockedFunction<typeof apiClient.apiGet>;
const mockApiPost = apiClient.apiPost as jest.MockedFunction<typeof apiClient.apiPost>;
const mockApiPatch = apiClient.apiPatch as jest.MockedFunction<typeof apiClient.apiPatch>;
const mockApiDelete = apiClient.apiDelete as jest.MockedFunction<typeof apiClient.apiDelete>;

describe('UsersService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const mockUserCreateData: UserCreateData = {
      username: 'testuser',
      email: 'test@example.com',
      language: 'CA',
    };

    const mockUserDTO: UserDTO = {
      uid: 'user123',
      username: 'testuser',
      email: 'test@example.com',
      language: 'CA',
      created_at: '2024-01-01T00:00:00Z',
    };

    it('hauria de crear un usuari correctament', async () => {
      const mockResponse = {
        ok: true,
        status: 201,
        json: jest.fn().mockResolvedValue(mockUserDTO),
      } as unknown as Response;

      mockApiPost.mockResolvedValue(mockResponse);

      const result = await UsersService.createUser(mockUserCreateData);

      expect(mockApiPost).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/users/',
        mockUserCreateData
      );
      expect(result).not.toBeNull();
      expect(result?.uid).toBe('user123');
      expect(result?.username).toBe('testuser');
      expect(result?.email).toBe('test@example.com');
    });

    it('hauria de crear un usuari amb avatar opcional', async () => {
      const userDataWithAvatar: UserCreateData = {
        ...mockUserCreateData,
        avatar: 'https://example.com/avatar.jpg',
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          ...mockUserDTO,
          avatar: 'https://example.com/avatar.jpg',
        }),
      } as unknown as Response;

      mockApiPost.mockResolvedValue(mockResponse);

      const result = await UsersService.createUser(userDataWithAvatar);

      expect(result).not.toBeNull();
      expect(result?.avatar).toBe('https://example.com/avatar.jpg');
    });

    it('hauria de retornar null quan la resposta no és ok', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({ error: 'Bad request' }),
      } as unknown as Response;

      mockApiPost.mockResolvedValue(mockResponse);

      const result = await UsersService.createUser(mockUserCreateData);

      expect(result).toBeNull();
    });

    it('hauria de gestionar errors de validació (400)', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          username: ['Aquest camp és obligatori'],
        }),
      } as unknown as Response;

      mockApiPost.mockResolvedValue(mockResponse);

      const result = await UsersService.createUser(mockUserCreateData);

      expect(result).toBeNull();
    });

    it('hauria de gestionar errors de conflicte (409)', async () => {
      const mockResponse = {
        ok: false,
        status: 409,
        json: jest.fn().mockResolvedValue({
          error: 'User already exists',
        }),
      } as unknown as Response;

      mockApiPost.mockResolvedValue(mockResponse);

      const result = await UsersService.createUser(mockUserCreateData);

      expect(result).toBeNull();
    });

    it('hauria de gestionar errors del servidor (500)', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({ error: 'Internal server error' }),
      } as unknown as Response;

      mockApiPost.mockResolvedValue(mockResponse);

      const result = await UsersService.createUser(mockUserCreateData);

      expect(result).toBeNull();
    });

    it('hauria de gestionar errors de xarxa', async () => {
      mockApiPost.mockRejectedValue(new Error('Network error'));

      const result = await UsersService.createUser(mockUserCreateData);

      expect(result).toBeNull();
    });

    it('hauria de passar el token d\'autenticació si es proporciona', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockUserDTO),
      } as unknown as Response;

      mockApiPost.mockResolvedValue(mockResponse);

      await UsersService.createUser(mockUserCreateData, 'test-token');

      expect(mockApiPost).toHaveBeenCalledWith(
        expect.any(String),
        mockUserCreateData
      );
    });
  });

  describe('getUserByUid', () => {
    const mockUserDTO: UserDTO = {
      uid: 'user123',
      username: 'testuser',
      email: 'test@example.com',
      language: 'CA',
      favourite_refuges: [1, 2, 3],
      visited_refuges: [1],
      created_at: '2024-01-01T00:00:00Z',
    };

    it('hauria d\'obtenir un usuari per UID correctament', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockUserDTO),
      } as unknown as Response;

      mockApiGet.mockResolvedValue(mockResponse);

      const result = await UsersService.getUserByUid('user123');

      expect(mockApiGet).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/users/user123/'
      );
      expect(result).not.toBeNull();
      expect(result?.uid).toBe('user123');
      expect(result?.username).toBe('testuser');
    });

    it('hauria de retornar null quan l\'usuari no existeix (404)', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      } as Response;

      mockApiGet.mockResolvedValue(mockResponse);

      const result = await UsersService.getUserByUid('nonexistent');

      expect(result).toBeNull();
    });

    it('hauria de retornar null quan la resposta no és ok', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response;

      mockApiGet.mockResolvedValue(mockResponse);

      const result = await UsersService.getUserByUid('user123');

      expect(result).toBeNull();
    });

    it('hauria de gestionar errors de xarxa', async () => {
      mockApiGet.mockRejectedValue(new Error('Network error'));

      const result = await UsersService.getUserByUid('user123');

      expect(result).toBeNull();
    });

    it('hauria de gestionar errors d\'autenticació (401)', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
      } as Response;

      mockApiGet.mockResolvedValue(mockResponse);

      const result = await UsersService.getUserByUid('user123');

      expect(result).toBeNull();
    });

    it('hauria de gestionar UID amb caràcters especials', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockUserDTO),
      } as unknown as Response;

      mockApiGet.mockResolvedValue(mockResponse);

      await UsersService.getUserByUid('user-123-abc_XYZ');

      expect(mockApiGet).toHaveBeenCalledWith(
        expect.stringContaining('user-123-abc_XYZ')
      );
    });

    it('hauria de passar el token d\'autenticació si es proporciona', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockUserDTO),
      } as unknown as Response;

      mockApiGet.mockResolvedValue(mockResponse);

      await UsersService.getUserByUid('user123', 'test-token');

      expect(mockApiGet).toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    const mockUpdateData: UserUpdateData = {
      username: 'newusername',
    };

    const mockUpdatedUserDTO: UserDTO = {
      uid: 'user123',
      username: 'newusername',
      email: 'test@example.com',
      language: 'CA',
      created_at: '2024-01-01T00:00:00Z',
    };

    it('hauria d\'actualitzar un usuari correctament', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockUpdatedUserDTO),
      } as unknown as Response;

      mockApiPatch.mockResolvedValue(mockResponse);

      const result = await UsersService.updateUser('user123', mockUpdateData);

      expect(mockApiPatch).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/users/user123/',
        mockUpdateData
      );
      expect(result).not.toBeNull();
      expect(result?.username).toBe('newusername');
    });

    it('hauria d\'actualitzar múltiples camps alhora', async () => {
      const multiUpdateData: UserUpdateData = {
        username: 'newusername',
        email: 'newemail@example.com',
        language: 'ES',
        avatar: 'https://example.com/new-avatar.jpg',
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          ...mockUpdatedUserDTO,
          ...multiUpdateData,
        }),
      } as unknown as Response;

      mockApiPatch.mockResolvedValue(mockResponse);

      const result = await UsersService.updateUser('user123', multiUpdateData);

      expect(result).not.toBeNull();
      expect(result?.username).toBe('newusername');
      expect(result?.email).toBe('newemail@example.com');
      expect(result?.language).toBe('ES');
    });

    it('hauria d\'actualitzar refugis favorits', async () => {
      const updateData: UserUpdateData = {
        favourite_refuges: [1, 2, 3, 4],
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          ...mockUpdatedUserDTO,
          favourite_refuges: [1, 2, 3, 4],
        }),
      } as unknown as Response;

      mockApiPatch.mockResolvedValue(mockResponse);

      const result = await UsersService.updateUser('user123', updateData);

      expect(result).not.toBeNull();
      expect(result?.favourite_refuges).toEqual([1, 2, 3, 4]);
    });

    it('hauria d\'actualitzar refugis visitats', async () => {
      const updateData: UserUpdateData = {
        visited_refuges: [1, 2],
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          ...mockUpdatedUserDTO,
          visited_refuges: [1, 2],
        }),
      } as unknown as Response;

      mockApiPatch.mockResolvedValue(mockResponse);

      const result = await UsersService.updateUser('user123', updateData);

      expect(result).not.toBeNull();
      expect(result?.visited_refuges).toEqual([1, 2]);
    });

    it('hauria d\'actualitzar reformes', async () => {
      const updateData: UserUpdateData = {
        renovations: ['reforma1', 'reforma2'],
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          ...mockUpdatedUserDTO,
          renovations: ['reforma1', 'reforma2'],
        }),
      } as unknown as Response;

      mockApiPatch.mockResolvedValue(mockResponse);

      const result = await UsersService.updateUser('user123', updateData);

      expect(result).not.toBeNull();
      expect(result?.renovations).toEqual(['reforma1', 'reforma2']);
    });

    it('hauria de retornar null quan la resposta no és ok', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({ error: 'Bad request' }),
      } as unknown as Response;

      mockApiPatch.mockResolvedValue(mockResponse);

      const result = await UsersService.updateUser('user123', mockUpdateData);

      expect(result).toBeNull();
    });

    it('hauria de gestionar errors de validació (400)', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          username: ['Username already taken'],
        }),
      } as unknown as Response;

      mockApiPatch.mockResolvedValue(mockResponse);

      const result = await UsersService.updateUser('user123', mockUpdateData);

      expect(result).toBeNull();
    });

    it('hauria de gestionar errors quan l\'usuari no existeix (404)', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({ error: 'User not found' }),
      } as unknown as Response;

      mockApiPatch.mockResolvedValue(mockResponse);

      const result = await UsersService.updateUser('nonexistent', mockUpdateData);

      expect(result).toBeNull();
    });

    it('hauria de gestionar errors del servidor (500)', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({ error: 'Internal server error' }),
      } as unknown as Response;

      mockApiPatch.mockResolvedValue(mockResponse);

      const result = await UsersService.updateUser('user123', mockUpdateData);

      expect(result).toBeNull();
    });

    it('hauria de gestionar errors de xarxa', async () => {
      mockApiPatch.mockRejectedValue(new Error('Network error'));

      const result = await UsersService.updateUser('user123', mockUpdateData);

      expect(result).toBeNull();
    });

    it('hauria de passar el token d\'autenticació si es proporciona', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockUpdatedUserDTO),
      } as unknown as Response;

      mockApiPatch.mockResolvedValue(mockResponse);

      await UsersService.updateUser('user123', mockUpdateData, 'test-token');

      expect(mockApiPatch).toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('hauria d\'eliminar un usuari correctament', async () => {
      const mockResponse = {
        ok: true,
        status: 204,
      } as Response;

      mockApiDelete.mockResolvedValue(mockResponse);

      const result = await UsersService.deleteUser('user123');

      expect(mockApiDelete).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/users/user123/'
      );
      expect(result).toBe(true);
    });

    it('hauria de retornar false quan l\'usuari no existeix (404)', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      } as Response;

      mockApiDelete.mockResolvedValue(mockResponse);

      const result = await UsersService.deleteUser('nonexistent');

      expect(result).toBe(false);
    });

    it('hauria de retornar false quan la resposta no és ok', async () => {
      const mockResponse = {
        ok: false,
        status: 403,
        json: jest.fn().mockResolvedValue({ error: 'Forbidden' }),
      } as unknown as Response;

      mockApiDelete.mockResolvedValue(mockResponse);

      const result = await UsersService.deleteUser('user123');

      expect(result).toBe(false);
    });

    it('hauria de gestionar errors d\'autenticació (401)', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ error: 'Unauthorized' }),
      } as unknown as Response;

      mockApiDelete.mockResolvedValue(mockResponse);

      const result = await UsersService.deleteUser('user123');

      expect(result).toBe(false);
    });

    it('hauria de gestionar errors del servidor (500)', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({ error: 'Internal server error' }),
      } as unknown as Response;

      mockApiDelete.mockResolvedValue(mockResponse);

      const result = await UsersService.deleteUser('user123');

      expect(result).toBe(false);
    });

    it('hauria de gestionar errors de xarxa', async () => {
      mockApiDelete.mockRejectedValue(new Error('Network error'));

      const result = await UsersService.deleteUser('user123');

      expect(result).toBe(false);
    });

    it('hauria de passar el token d\'autenticació si es proporciona', async () => {
      const mockResponse = {
        ok: true,
        status: 204,
      } as Response;

      mockApiDelete.mockResolvedValue(mockResponse);

      await UsersService.deleteUser('user123', 'test-token');

      expect(mockApiDelete).toHaveBeenCalled();
    });
  });

  describe('Casos límit i edge cases', () => {
    it('hauria de gestionar UID molt llarg', async () => {
      const longUid = 'a'.repeat(1000);
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          uid: longUid,
          username: 'test',
          email: 'test@example.com',
          language: 'CA',
          created_at: '2024-01-01T00:00:00Z',
        }),
      } as unknown as Response;

      mockApiGet.mockResolvedValue(mockResponse);

      const result = await UsersService.getUserByUid(longUid);

      expect(result).not.toBeNull();
      expect(result?.uid).toBe(longUid);
    });

    it('hauria de gestionar username buit en actualització', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          username: ['Aquest camp no pot estar buit'],
        }),
      } as unknown as Response;

      mockApiPatch.mockResolvedValue(mockResponse);

      const result = await UsersService.updateUser('user123', { username: '' });

      expect(result).toBeNull();
    });

    it('hauria de gestionar arrays buits en actualització', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          uid: 'user123',
          username: 'test',
          email: 'test@example.com',
          language: 'CA',
          favourite_refuges: [],
          visited_refuges: [],
          renovations: [],
          created_at: '2024-01-01T00:00:00Z',
        }),
      } as unknown as Response;

      mockApiPatch.mockResolvedValue(mockResponse);

      const result = await UsersService.updateUser('user123', {
        favourite_refuges: [],
        visited_refuges: [],
        renovations: [],
      });

      expect(result).not.toBeNull();
      expect(result?.favourite_refuges).toEqual([]);
      expect(result?.visited_refuges).toEqual([]);
      expect(result?.renovations).toEqual([]);
    });

    it('hauria de gestionar email invàlid en creació', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          email: ['Enter a valid email address'],
        }),
      } as unknown as Response;

      mockApiPost.mockResolvedValue(mockResponse);

      const result = await UsersService.createUser({
        username: 'test',
        email: 'invalid-email',
        language: 'CA',
      });

      expect(result).toBeNull();
    });

    it('hauria de gestionar idioma invàlid', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          language: ['Invalid language code'],
        }),
      } as unknown as Response;

      mockApiPost.mockResolvedValue(mockResponse);

      const result = await UsersService.createUser({
        username: 'test',
        email: 'test@example.com',
        language: 'INVALID',
      });

      expect(result).toBeNull();
    });

    it('hauria de gestionar timeout en peticions', async () => {
      mockApiGet.mockRejectedValue(new Error('Request timeout'));

      const result = await UsersService.getUserByUid('user123');

      expect(result).toBeNull();
    });

    it('hauria de gestionar errors de JSON parse', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as unknown as Response;

      mockApiGet.mockResolvedValue(mockResponse);

      const result = await UsersService.getUserByUid('user123');

      expect(result).toBeNull();
    });
  });
});
