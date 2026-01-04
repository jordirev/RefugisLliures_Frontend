/**
 * Tests unitaris per ExperienceMapper
 * 
 * Cobreix:
 * - mapExperienceFromDTO
 */

import { mapExperienceFromDTO } from '../../../services/mappers/ExperienceMapper';
import { ExperienceDTO } from '../../../services/dto/ExperienceDTO';

describe('ExperienceMapper', () => {
  describe('mapExperienceFromDTO', () => {
    it('hauria de mapejar correctament una experiència sense imatges', () => {
      const experienceDTO: ExperienceDTO = {
        id: 'exp-1',
        refuge_id: 'refuge-123',
        creator_uid: 'user-abc',
        modified_at: '2025-06-15T10:30:00Z',
        comment: 'Una experiència fantàstica al refugi!',
        images_metadata: undefined,
      };

      const result = mapExperienceFromDTO(experienceDTO);

      expect(result).toEqual({
        id: 'exp-1',
        refuge_id: 'refuge-123',
        creator_uid: 'user-abc',
        modified_at: '2025-06-15T10:30:00Z',
        comment: 'Una experiència fantàstica al refugi!',
        images_metadata: undefined,
      });
    });

    it('hauria de mapejar correctament una experiència amb imatges', () => {
      const experienceDTO: ExperienceDTO = {
        id: 'exp-2',
        refuge_id: 'refuge-456',
        creator_uid: 'user-def',
        modified_at: '2025-06-16T12:00:00Z',
        comment: 'Vistes increïbles!',
        images_metadata: [
          {
            url: 'https://example.com/image1.jpg',
            width: 1920,
            height: 1080,
          },
          {
            url: 'https://example.com/image2.jpg',
            width: 800,
            height: 600,
          },
        ],
      };

      const result = mapExperienceFromDTO(experienceDTO);

      expect(result.images_metadata).toHaveLength(2);
      expect(result.images_metadata![0].url).toBe('https://example.com/image1.jpg');
      expect(result.images_metadata![1].url).toBe('https://example.com/image2.jpg');
    });

    it('hauria de mapejar correctament una experiència amb array buit d\'imatges', () => {
      const experienceDTO: ExperienceDTO = {
        id: 'exp-3',
        refuge_id: 'refuge-789',
        creator_uid: 'user-ghi',
        modified_at: '2025-06-17T14:00:00Z',
        comment: 'Sense fotos però molt bé',
        images_metadata: [],
      };

      const result = mapExperienceFromDTO(experienceDTO);

      expect(result.images_metadata).toEqual([]);
    });

    it('hauria de preservar tots els camps correctament', () => {
      const experienceDTO: ExperienceDTO = {
        id: 'unique-id-123',
        refuge_id: 'refuge-unique',
        creator_uid: 'creator-uid-456',
        modified_at: '2025-12-25T00:00:00Z',
        comment: 'Comentari especial amb caràcters especials: àèéíòóú',
        images_metadata: [
          {
            url: 'https://storage.example.com/media/image.png',
            width: 3840,
            height: 2160,
          },
        ],
      };

      const result = mapExperienceFromDTO(experienceDTO);

      expect(result.id).toBe('unique-id-123');
      expect(result.refuge_id).toBe('refuge-unique');
      expect(result.creator_uid).toBe('creator-uid-456');
      expect(result.modified_at).toBe('2025-12-25T00:00:00Z');
      expect(result.comment).toBe('Comentari especial amb caràcters especials: àèéíòóú');
    });
  });
});
