/**
 * Tests for UserMapper functions
 */

import {
  mapAvatarMetadataFromDTO,
  mapUserFromDTO,
} from '../../../services/mappers/UserMapper';
import { UserDTO } from '../../../services/dto/UserDTO';

describe('UserMapper', () => {
  describe('mapAvatarMetadataFromDTO', () => {
    it('should convert avatar metadata DTO correctly', () => {
      const avatarDTO = {
        key: 'avatars/user-123.jpg',
        url: 'https://example.com/avatars/user-123.jpg',
        uploaded_at: '2024-01-15T10:00:00Z',
      };

      const result = mapAvatarMetadataFromDTO(avatarDTO);

      expect(result).toEqual({
        key: 'avatars/user-123.jpg',
        url: 'https://example.com/avatars/user-123.jpg',
        uploaded_at: '2024-01-15T10:00:00Z',
      });
    });

    it('should return undefined for undefined input', () => {
      const result = mapAvatarMetadataFromDTO(undefined);
      expect(result).toBeUndefined();
    });

    it('should return undefined for null input', () => {
      const result = mapAvatarMetadataFromDTO(null);
      expect(result).toBeUndefined();
    });
  });

  describe('mapUserFromDTO', () => {
    const validUserDTO: UserDTO = {
      uid: 'user-123',
      username: 'testuser',
      avatar_metadata: {
        key: 'avatars/user-123.jpg',
        url: 'https://example.com/avatars/user-123.jpg',
        uploaded_at: '2024-01-15T10:00:00Z',
      },
      language: 'ca',
      favourite_refuges: ['refuge-1', 'refuge-2'],
      visited_refuges: ['refuge-3'],
      uploaded_photos_keys: ['photo-1', 'photo-2'],
      num_shared_experiences: 5,
      num_renovated_refuges: 2,
      created_at: '2024-01-01T00:00:00Z',
    };

    it('should convert a complete user DTO to User model', () => {
      const result = mapUserFromDTO(validUserDTO);

      expect(result.uid).toBe('user-123');
      expect(result.username).toBe('testuser');
      expect(result.language).toBe('ca');
      expect(result.favourite_refuges).toEqual(['refuge-1', 'refuge-2']);
      expect(result.visited_refuges).toEqual(['refuge-3']);
      expect(result.uploaded_photos_keys).toEqual(['photo-1', 'photo-2']);
      expect(result.num_shared_experiences).toBe(5);
      expect(result.num_renovated_refuges).toBe(2);
      expect(result.created_at).toBe('2024-01-01T00:00:00Z');
    });

    it('should handle user without avatar_metadata', () => {
      const userWithoutAvatar: UserDTO = {
        ...validUserDTO,
        avatar_metadata: undefined,
      };

      const result = mapUserFromDTO(userWithoutAvatar);

      expect(result.avatar_metadata).toBeNull();
    });

    it('should handle user with empty arrays', () => {
      const userWithEmptyArrays: UserDTO = {
        ...validUserDTO,
        favourite_refuges: [],
        visited_refuges: [],
        uploaded_photos_keys: [],
      };

      const result = mapUserFromDTO(userWithEmptyArrays);

      expect(result.favourite_refuges).toEqual([]);
      expect(result.visited_refuges).toEqual([]);
      expect(result.uploaded_photos_keys).toEqual([]);
    });

    it('should handle user with undefined arrays (fallback to empty)', () => {
      const userWithUndefinedArrays: any = {
        uid: 'user-123',
        username: 'testuser',
        language: 'ca',
        created_at: '2024-01-01T00:00:00Z',
        // Arrays are undefined
      };

      const result = mapUserFromDTO(userWithUndefinedArrays);

      expect(result.favourite_refuges).toEqual([]);
      expect(result.visited_refuges).toEqual([]);
      expect(result.uploaded_photos_keys).toEqual([]);
    });

    it('should handle null num_shared_experiences and num_renovated_refuges', () => {
      const userWithNullCounts: UserDTO = {
        ...validUserDTO,
        num_shared_experiences: null as any,
        num_renovated_refuges: null as any,
      };

      const result = mapUserFromDTO(userWithNullCounts);

      expect(result.num_shared_experiences).toBeNull();
      expect(result.num_renovated_refuges).toBeNull();
    });

    it('should handle user with zero counts', () => {
      const userWithZeroCounts: UserDTO = {
        ...validUserDTO,
        num_shared_experiences: 0,
        num_renovated_refuges: 0,
      };

      const result = mapUserFromDTO(userWithZeroCounts);

      expect(result.num_shared_experiences).toBe(0);
      expect(result.num_renovated_refuges).toBe(0);
    });
  });
});
