/**
 * Tests for UsersService
 */

import { UsersService } from '../../services/UsersService';
import { apiGet, apiPost, apiPatch, apiDelete, apiClient } from '../../services/apiClient';

// Mock apiClient
jest.mock('../../services/apiClient');

// Mock mappers
jest.mock('../../services/mappers', () => ({
  mapperUserRefugiInfoDTO: jest.fn((data) => ({
    id: data.id || data.refuge_id,
    name: data.name,
  })),
  mapperUserRefugiInfoResponseDTO: jest.fn((data) => 
    data.map((item: any) => ({
      id: item.id || item.refuge_id,
      name: item.name,
    }))
  ),
  mapUserFromDTO: jest.fn((data) => ({
    uid: data.uid,
    username: data.username,
    email: data.email,
  })),
}));

const mockedApiGet = apiGet as jest.MockedFunction<typeof apiGet>;
const mockedApiPost = apiPost as jest.MockedFunction<typeof apiPost>;
const mockedApiPatch = apiPatch as jest.MockedFunction<typeof apiPatch>;
const mockedApiDelete = apiDelete as jest.MockedFunction<typeof apiDelete>;
const mockedApiClient = apiClient as jest.MockedFunction<typeof apiClient>;

// Mock data
const mockUserDTO = {
  uid: 'user-123',
  username: 'TestUser',
  email: 'test@example.com',
  language: 'ca',
  avatar: null,
};

const mockRefugeDTO = {
  id: 'refuge-1',
  name: 'Test Refuge',
  image: 'https://example.com/image.jpg',
};

describe('UsersService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      mockedApiPost.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockUserDTO,
      } as Response);

      const userData = { username: 'TestUser', email: 'test@example.com', language: 'ca' };
      const result = await UsersService.createUser(userData);

      expect(result).toBeDefined();
      expect(mockedApiPost).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/users/',
        userData
      );
    });

    it('should return null on error', async () => {
      mockedApiPost.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid data' }),
      } as Response);

      const result = await UsersService.createUser({ username: '', email: '', language: '' });

      expect(result).toBeNull();
    });

    it('should return null on network error', async () => {
      mockedApiPost.mockRejectedValue(new Error('Network error'));

      const result = await UsersService.createUser({ username: 'Test', email: 'test@test.com', language: 'ca' });

      expect(result).toBeNull();
    });
  });

  describe('getUserByUid', () => {
    it('should fetch a user by UID', async () => {
      mockedApiGet.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockUserDTO,
      } as Response);

      const result = await UsersService.getUserByUid('user-123');

      expect(result).toBeDefined();
      expect(mockedApiGet).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/users/user-123/'
      );
    });

    it('should return null when user not found', async () => {
      mockedApiGet.mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      const result = await UsersService.getUserByUid('invalid');

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      mockedApiGet.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const result = await UsersService.getUserByUid('user-123');

      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update a user', async () => {
      mockedApiPatch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ ...mockUserDTO, username: 'UpdatedUser' }),
      } as Response);

      const result = await UsersService.updateUser('user-123', { username: 'UpdatedUser' });

      expect(result).toBeDefined();
      expect(mockedApiPatch).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/users/user-123/',
        { username: 'UpdatedUser' }
      );
    });

    it('should return null on error', async () => {
      mockedApiPatch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid data' }),
      } as Response);

      const result = await UsersService.updateUser('user-123', {});

      expect(result).toBeNull();
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      mockedApiDelete.mockResolvedValue({
        ok: true,
        status: 204,
      } as Response);

      const result = await UsersService.deleteUser('user-123');

      expect(result).toBe(true);
      expect(mockedApiDelete).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/users/user-123/'
      );
    });

    it('should return false when user not found', async () => {
      mockedApiDelete.mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      const result = await UsersService.deleteUser('invalid');

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockedApiDelete.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      } as Response);

      const result = await UsersService.deleteUser('user-123');

      expect(result).toBe(false);
    });
  });

  describe('getFavouriteRefuges', () => {
    it('should fetch favourite refuges', async () => {
      mockedApiGet.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ count: 1, results: [mockRefugeDTO] }),
      } as Response);

      const result = await UsersService.getFavouriteRefuges('user-123');

      expect(result).toBeDefined();
      expect(mockedApiGet).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/users/user-123/favorite-refuges/'
      );
    });

    it('should return empty array when no favourites', async () => {
      mockedApiGet.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ count: 0, results: [] }),
      } as Response);

      const result = await UsersService.getFavouriteRefuges('user-123');

      expect(result).toEqual([]);
    });

    it('should return empty array on invalid response', async () => {
      mockedApiGet.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);

      const result = await UsersService.getFavouriteRefuges('user-123');

      expect(result).toEqual([]);
    });

    it('should return null on error', async () => {
      mockedApiGet.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      } as Response);

      const result = await UsersService.getFavouriteRefuges('user-123');

      expect(result).toBeNull();
    });
  });

  describe('addFavouriteRefuge', () => {
    it('should add a favourite refuge', async () => {
      mockedApiPost.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockRefugeDTO,
      } as Response);

      const result = await UsersService.addFavouriteRefuge('user-123', 'refuge-1');

      expect(result).toBeDefined();
      expect(mockedApiPost).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/users/user-123/favorite-refuges/',
        { refuge_id: 'refuge-1' }
      );
    });

    it('should return null on error', async () => {
      mockedApiPost.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid refuge' }),
      } as Response);

      const result = await UsersService.addFavouriteRefuge('user-123', 'invalid');

      expect(result).toBeNull();
    });
  });

  describe('removeFavouriteRefuge', () => {
    it('should remove a favourite refuge', async () => {
      mockedApiDelete.mockResolvedValue({
        ok: true,
        status: 204,
      } as Response);

      const result = await UsersService.removeFavouriteRefuge('user-123', 'refuge-1');

      expect(result).toBe(true);
      expect(mockedApiDelete).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/users/user-123/favorite-refuges/refuge-1/'
      );
    });

    it('should return false on error', async () => {
      mockedApiDelete.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      } as Response);

      const result = await UsersService.removeFavouriteRefuge('user-123', 'invalid');

      expect(result).toBe(false);
    });
  });

  describe('getVisitedRefuges', () => {
    it('should fetch visited refuges', async () => {
      mockedApiGet.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ count: 1, results: [mockRefugeDTO] }),
      } as Response);

      const result = await UsersService.getVisitedRefuges('user-123');

      expect(result).toBeDefined();
      expect(mockedApiGet).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/users/user-123/visited-refuges/'
      );
    });

    it('should return empty array on invalid response', async () => {
      mockedApiGet.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);

      const result = await UsersService.getVisitedRefuges('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('addVisitedRefuge', () => {
    it('should add a visited refuge', async () => {
      mockedApiPost.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => mockRefugeDTO,
      } as Response);

      const result = await UsersService.addVisitedRefuge('user-123', 'refuge-1');

      expect(result).toBeDefined();
      expect(mockedApiPost).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/users/user-123/visited-refuges/',
        { refuge_id: 'refuge-1' }
      );
    });

    it('should return null on error', async () => {
      mockedApiPost.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid refuge' }),
      } as Response);

      const result = await UsersService.addVisitedRefuge('user-123', 'invalid');

      expect(result).toBeNull();
    });
  });

  describe('removeVisitedRefuge', () => {
    it('should remove a visited refuge', async () => {
      mockedApiDelete.mockResolvedValue({
        ok: true,
        status: 204,
      } as Response);

      const result = await UsersService.removeVisitedRefuge('user-123', 'refuge-1');

      expect(result).toBe(true);
      expect(mockedApiDelete).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/users/user-123/visited-refuges/refuge-1/'
      );
    });

    it('should return false on error', async () => {
      mockedApiDelete.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      } as Response);

      const result = await UsersService.removeVisitedRefuge('user-123', 'invalid');

      expect(result).toBe(false);
    });
  });

  describe('uploadAvatar', () => {
    it('should upload an avatar', async () => {
      const mockAvatarMetadata = {
        url: 'https://example.com/avatar.jpg',
        filename: 'avatar.jpg',
      };
      mockedApiClient.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockAvatarMetadata,
      } as Response);

      const mockFile = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });
      const result = await UsersService.uploadAvatar('user-123', mockFile);

      expect(result).toEqual(mockAvatarMetadata);
      expect(mockedApiClient).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/users/user-123/avatar/',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.any(FormData),
        })
      );
    });

    it('should throw error when no file provided', async () => {
      await expect(UsersService.uploadAvatar('user-123', null as any))
        .rejects.toThrow("No s'ha proporcionat cap fitxer");
    });

    it('should throw error on invalid file', async () => {
      mockedApiClient.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Fitxer invàlid' }),
      } as Response);

      const mockFile = new File(['test'], 'avatar.txt', { type: 'text/plain' });

      await expect(UsersService.uploadAvatar('user-123', mockFile))
        .rejects.toThrow('Fitxer invàlid');
    });

    it('should throw error when not authenticated', async () => {
      mockedApiClient.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({}),
      } as Response);

      const mockFile = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });

      await expect(UsersService.uploadAvatar('user-123', mockFile))
        .rejects.toThrow('No estàs autenticat');
    });

    it('should throw error when not authorized', async () => {
      mockedApiClient.mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({}),
      } as Response);

      const mockFile = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });

      await expect(UsersService.uploadAvatar('user-123', mockFile))
        .rejects.toThrow('No tens permisos per modificar aquest avatar');
    });

    it('should throw error when user not found', async () => {
      mockedApiClient.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({}),
      } as Response);

      const mockFile = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });

      await expect(UsersService.uploadAvatar('invalid', mockFile))
        .rejects.toThrow('Usuari no trobat');
    });
  });

  describe('deleteAvatar', () => {
    it('should delete an avatar', async () => {
      mockedApiDelete.mockResolvedValue({
        ok: true,
        status: 204,
      } as Response);

      const result = await UsersService.deleteAvatar('user-123');

      expect(result).toBe(true);
      expect(mockedApiDelete).toHaveBeenCalledWith(
        'https://refugislliures-backend.onrender.com/api/users/user-123/avatar/'
      );
    });

    it('should throw error when not authenticated', async () => {
      mockedApiDelete.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({}),
      } as Response);

      await expect(UsersService.deleteAvatar('user-123'))
        .rejects.toThrow('No estàs autenticat');
    });

    it('should throw error when not authorized', async () => {
      mockedApiDelete.mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({}),
      } as Response);

      await expect(UsersService.deleteAvatar('user-123'))
        .rejects.toThrow('No tens permisos per eliminar aquest avatar');
    });

    it('should throw error when avatar not found', async () => {
      mockedApiDelete.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({}),
      } as Response);

      await expect(UsersService.deleteAvatar('user-123'))
        .rejects.toThrow('Avatar no trobat');
    });

    it('should throw error on server error', async () => {
      mockedApiDelete.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      } as Response);

      await expect(UsersService.deleteAvatar('user-123'))
        .rejects.toThrow('Error del servidor');
    });
  });
});
