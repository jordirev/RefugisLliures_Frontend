/**
 * Tests for ExperienceMapper functions
 */

import { mapExperienceFromDTO } from '../../../services/mappers/ExperienceMapper';
import { ExperienceDTO } from '../../../services/dto/ExperienceDTO';

// Mock the RefugiMapper dependency
jest.mock('../../../services/mappers/RefugiMapper', () => ({
  mapImageMetadataFromDTO: jest.fn((dto) => ({
    key: dto.key,
    url: dto.url,
    uploaded_at: dto.uploaded_at,
    width: dto.width,
    height: dto.height,
  })),
}));

describe('ExperienceMapper', () => {
  describe('mapExperienceFromDTO', () => {
    const validExperienceDTO: ExperienceDTO = {
      id: 'experience-1',
      refuge_id: 'refuge-1',
      creator_uid: 'user-123',
      modified_at: '2024-01-15T10:00:00Z',
      comment: 'Had an amazing time at this refuge!',
      images_metadata: [
        {
          key: 'experiences/img1.jpg',
          url: 'https://example.com/experiences/img1.jpg',
          uploaded_at: '2024-01-15T10:00:00Z',
          width: 1920,
          height: 1080,
        },
        {
          key: 'experiences/img2.jpg',
          url: 'https://example.com/experiences/img2.jpg',
          uploaded_at: '2024-01-15T10:05:00Z',
          width: 1920,
          height: 1080,
        },
      ],
    };

    it('should convert a complete experience DTO to Experience model', () => {
      const result = mapExperienceFromDTO(validExperienceDTO);

      expect(result.id).toBe('experience-1');
      expect(result.refuge_id).toBe('refuge-1');
      expect(result.creator_uid).toBe('user-123');
      expect(result.modified_at).toBe('2024-01-15T10:00:00Z');
      expect(result.comment).toBe('Had an amazing time at this refuge!');
      expect(result.images_metadata).toHaveLength(2);
    });

    it('should handle experience without images', () => {
      const experienceWithoutImages: ExperienceDTO = {
        ...validExperienceDTO,
        images_metadata: undefined,
      };

      const result = mapExperienceFromDTO(experienceWithoutImages);

      expect(result.images_metadata).toBeUndefined();
    });

    it('should handle experience with empty images array', () => {
      const experienceEmptyImages: ExperienceDTO = {
        ...validExperienceDTO,
        images_metadata: [],
      };

      const result = mapExperienceFromDTO(experienceEmptyImages);

      expect(result.images_metadata).toEqual([]);
    });

    it('should handle experience with single image', () => {
      const experienceSingleImage: ExperienceDTO = {
        ...validExperienceDTO,
        images_metadata: [
          {
            key: 'experiences/img1.jpg',
            url: 'https://example.com/experiences/img1.jpg',
            uploaded_at: '2024-01-15T10:00:00Z',
            width: 1920,
            height: 1080,
          },
        ],
      };

      const result = mapExperienceFromDTO(experienceSingleImage);

      expect(result.images_metadata).toHaveLength(1);
    });

    it('should handle experience with empty comment', () => {
      const experienceEmptyComment: ExperienceDTO = {
        ...validExperienceDTO,
        comment: '',
      };

      const result = mapExperienceFromDTO(experienceEmptyComment);

      expect(result.comment).toBe('');
    });

    it('should handle experience with long comment', () => {
      const longComment = 'A'.repeat(1000);
      const experienceLongComment: ExperienceDTO = {
        ...validExperienceDTO,
        comment: longComment,
      };

      const result = mapExperienceFromDTO(experienceLongComment);

      expect(result.comment).toBe(longComment);
      expect(result.comment.length).toBe(1000);
    });
  });
});
