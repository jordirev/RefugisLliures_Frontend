/**
 * Tests unitaris per a models, mappers, DTOs i validacions d'Usuaris
 * 
 * Aquest fitxer cobreix:
 * - Models de dades (User)
 * - DTOs (UserDTO)
 * - Mappers (UserMapper)
 * - Validacions i conversions
 */

import { User } from '../../../models';
import { UserDTO } from '../../../services/dto/UserDTO';
import { mapUserFromDTO } from '../../../services/mappers/UserMapper';

describe('Models d\'Usuaris', () => {
  describe('User Model', () => {
    it('hauria de crear un usuari amb camps obligatoris', () => {
      const user: User = {
        uid: 'test-uid-123',
        username: 'testuser',
        language: 'ca',
        num_shared_experiences: null,
        num_renovated_refuges: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.uid).toBe('test-uid-123');
      expect(user.username).toBe('testuser');
      expect(user.language).toBe('ca');
    });

    it('hauria de crear un usuari complet amb tots els camps', () => {
      const user: User = {
        uid: 'uid-456',
        username: 'johndoe',
        avatar_metadata: { key: 'avatar-key', url: 'https://example.com/avatar.jpg', uploaded_at: '2023-01-01T00:00:00Z' },
        language: 'es',
        favourite_refuges: ['1', '2', '3', '4', '5'],
        visited_refuges: ['1', '2', '3'],
        uploaded_photos_keys: ['photo1', 'photo2'],
        num_shared_experiences: 10,
        num_renovated_refuges: 2,
        created_at: '2023-05-15T10:30:00Z',
      };

      expect(user.uid).toBe('uid-456');
      expect(user.avatar_metadata?.url).toBe('https://example.com/avatar.jpg');
      expect(user.favourite_refuges).toHaveLength(5);
      expect(user.visited_refuges).toHaveLength(3);
      expect(user.uploaded_photos_keys).toHaveLength(2);
      expect(user.num_shared_experiences).toBe(10);
      expect(user.num_renovated_refuges).toBe(2);
    });

    it('hauria de permetre avatar_metadata com undefined', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user1',
        avatar_metadata: undefined,
        language: 'ca',
        num_shared_experiences: null,
        num_renovated_refuges: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.avatar_metadata).toBeUndefined();
    });

    it('hauria de permetre arrays buits per refugis_favorits', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user1',
        language: 'ca',
        favourite_refuges: [],
        visited_refuges: [],
        num_shared_experiences: null,
        num_renovated_refuges: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.favourite_refuges).toHaveLength(0);
      expect(Array.isArray(user.favourite_refuges)).toBe(true);
    });

    it('hauria de permetre múltiples refugis favorits', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user1',
        language: 'ca',
        favourite_refuges: [1, 5, 10, 15, 20, 100],
        visited_refuges: [],
        num_shared_experiences: null,
        num_renovated_refuges: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.favourite_refuges).toHaveLength(6);
      expect(user.favourite_refuges).toContain(1);
      expect(user.favourite_refuges).toContain(100);
    });

    it('hauria de permetre múltiples refugis visitats', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user1',
        language: 'ca',
        favourite_refuges: [],
        visited_refuges: ['2', '4', '6', '8'],
        num_shared_experiences: null,
        num_renovated_refuges: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.visited_refuges).toHaveLength(4);
      expect(user.visited_refuges).toContain('2');
      expect(user.visited_refuges).toContain('8');
    });

    it('hauria de permetre múltiples fotos pujades', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user1',
        language: 'ca',
        uploaded_photos_keys: ['photo1', 'photo2', 'photo3'],
        num_shared_experiences: null,
        num_renovated_refuges: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.uploaded_photos_keys).toHaveLength(3);
      expect(user.uploaded_photos_keys).toContain('photo1');
    });

    it('hauria de permetre valors null per estadístiques', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user1',
        language: 'ca',
        num_shared_experiences: null,
        num_renovated_refuges: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.num_shared_experiences).toBeNull();
      expect(user.num_renovated_refuges).toBeNull();
    });

    it('hauria de permetre valors 0 per estadístiques', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user1',
        language: 'ca',
        num_shared_experiences: 0,
        num_renovated_refuges: 0,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.num_shared_experiences).toBe(0);
      expect(user.num_renovated_refuges).toBe(0);
    });

    it('hauria de validar idiomes suportats', () => {
      const idiomes = ['ca', 'es', 'en', 'fr'];

      idiomes.forEach(lang => {
        const user: User = {
          uid: 'uid-1',
          username: 'user1',
            language: lang,
          favourite_refuges: [],
          visited_refuges: [],
              num_shared_experiences: null,
          num_renovated_refuges: null,
          created_at: '2023-01-01T00:00:00Z',
        };

        expect(user.language).toBe(lang);
      });
    });

    it('hauria de mantenir el format ISO de created_at', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user1',
        language: 'ca',
        favourite_refuges: [],
        visited_refuges: [],
        num_shared_experiences: null,
        num_renovated_refuges: null,
        created_at: '2023-06-15T14:30:00.000Z',
      };

      expect(user.created_at).toBe('2023-06-15T14:30:00.000Z');
      // Verificar que és una data vàlida
      const date = new Date(user.created_at);
      expect(date).toBeInstanceOf(Date);
      expect(isNaN(date.getTime())).toBe(false);
    });
  });
});

describe('DTOs d\'Usuaris', () => {
  describe('UserDTO', () => {
    it('hauria de crear un UserDTO amb camps obligatoris', () => {
      const userDTO: UserDTO = {
        uid: 'test-uid',
        username: 'testuser',
        language: 'ca',
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(userDTO.uid).toBe('test-uid');
      expect(userDTO.username).toBe('testuser');
      expect(userDTO.language).toBe('ca');
      expect(userDTO.created_at).toBe('2023-01-01T00:00:00Z');
    });

    it('hauria de crear un UserDTO complet amb tots els camps', () => {
      const userDTO: UserDTO = {
        uid: 'uid-123',
        username: 'johndoe',
        language: 'ES',
        favourite_refuges: ['1', '2', '3'],
        visited_refuges: ['1'],
        renovations: ['ref-1'],
        uploaded_photos_keys: ['photo-1', 'photo-2'],
        num_shared_experiences: 5,
        num_renovated_refuges: 1,
        created_at: '2023-05-01T00:00:00Z',
      };

      expect(userDTO.favourite_refuges).toHaveLength(3);
      expect(userDTO.uploaded_photos_keys).toHaveLength(2);
      expect(userDTO.renovations).toHaveLength(1);
    });

    it('hauria de permetre camps opcionals com a null', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        language: 'ca',
        avatar_metadata: null,
        favourite_refuges: null,
        visited_refuges: null,
        renovations: null,
        uploaded_photos_keys: null,
        num_shared_experiences: null,
        num_renovated_refuges: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(userDTO.avatar_metadata).toBeNull();
      expect(userDTO.favourite_refuges).toBeNull();
      expect(userDTO.visited_refuges).toBeNull();
      expect(userDTO.renovations).toBeNull();
      expect(userDTO.uploaded_photos_keys).toBeNull();
    });

    it('hauria de permetre camps opcionals com a undefined', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        language: 'ca',
        avatar_metadata: undefined,
        favourite_refuges: undefined,
        visited_refuges: undefined,
        renovations: undefined,
        uploaded_photos_keys: undefined,
        num_shared_experiences: undefined,
        num_renovated_refuges: undefined,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(userDTO.avatar_metadata).toBeUndefined();
      expect(userDTO.favourite_refuges).toBeUndefined();
      expect(userDTO.renovations).toBeUndefined();
    });

    it('hauria de gestionar arrays buits', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        language: 'ca',
        favourite_refuges: [],
        visited_refuges: [],
        renovations: [],
        uploaded_photos_keys: [],
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(userDTO.favourite_refuges).toHaveLength(0);
      expect(userDTO.visited_refuges).toHaveLength(0);
      expect(userDTO.renovations).toHaveLength(0);
      expect(userDTO.uploaded_photos_keys).toHaveLength(0);
    });

    it('hauria de permetre idioma en majúscules', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        language: 'CA',
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(userDTO.language).toBe('CA');
    });

    it('hauria de permetre idioma en minúscules', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        language: 'ca',
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(userDTO.language).toBe('ca');
    });
  });
});

describe('Mappers d\'Usuaris', () => {
  describe('mapUserFromDTO', () => {
    it('hauria de convertir un UserDTO mínim a User', () => {
      const userDTO: UserDTO = {
        uid: 'uid-123',
        username: 'testuser',
        language: 'ca',
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.uid).toBe('uid-123');
      expect(user.username).toBe('testuser');
      expect(user.language).toBe('ca');
      expect(user.created_at).toBe('2023-01-01T00:00:00Z');
    });

    it('hauria de convertir un UserDTO complet a User', () => {
      const userDTO: UserDTO = {
        uid: 'uid-456',
        username: 'johndoe',
        avatar_metadata: { key: 'avatar-key', url: 'https://example.com/avatar.jpg', uploaded_at: '2023-01-01T00:00:00Z' },
        language: 'ES',
        favourite_refuges: ['1', '2', '3', '4', '5'],
        visited_refuges: ['1', '2', '3'],
        uploaded_photos_keys: ['photo1', 'photo2'],
        num_shared_experiences: 15,
        num_renovated_refuges: 3,
        created_at: '2023-05-15T10:30:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.uid).toBe('uid-456');
      expect(user.username).toBe('johndoe');
      expect(user.avatar_metadata?.url).toBe('https://example.com/avatar.jpg');
      expect(user.language).toBe('ES');
      expect(user.favourite_refuges).toEqual(['1', '2', '3', '4', '5']);
      expect(user.visited_refuges).toEqual(['1', '2', '3']);
      expect(user.uploaded_photos_keys).toEqual(['photo1', 'photo2']);
      expect(user.num_shared_experiences).toBe(15);
      expect(user.num_renovated_refuges).toBe(3);
      expect(user.created_at).toBe('2023-05-15T10:30:00Z');
    });

    it('hauria de convertir avatar_metadata null a null', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        avatar_metadata: null,
        language: 'ca',
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.avatar_metadata).toBeNull();
    });

    it('hauria de mantenir avatar_metadata quan és un objecte vàlid', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        avatar_metadata: { key: 'avatar-key', url: 'https://example.com/avatar.jpg', uploaded_at: '2023-01-01T00:00:00Z' },
        language: 'ca',
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.avatar_metadata?.url).toBe('https://example.com/avatar.jpg');
    });

    it('hauria de convertir refugis_favorits null a array buit', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        language: 'ca',
        favourite_refuges: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.favourite_refuges).toEqual([]);
      expect(Array.isArray(user.favourite_refuges)).toBe(true);
    });

    it('hauria de convertir refugis_favorits undefined a array buit', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        language: 'ca',
        favourite_refuges: undefined,
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.favourite_refuges).toEqual([]);
    });

    it('hauria de mantenir refugis_favorits quan és un array', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        language: 'ca',
        favourite_refuges: [1, 5, 10],
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.favourite_refuges).toEqual([1, 5, 10]);
    });

    it('hauria de convertir refugis_visitats null a array buit', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        language: 'ca',
        visited_refuges: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.visited_refuges).toEqual([]);
    });

    it('hauria de convertir refugis_visitats undefined a array buit', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        language: 'ca',
        visited_refuges: undefined,
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.visited_refuges).toEqual([]);
    });

    it('hauria de mantenir refugis_visitats quan és un array', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        language: 'ca',
        visited_refuges: ['2', '4', '6', '8'],
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.visited_refuges).toEqual(['2', '4', '6', '8']);
    });

    it('hauria de convertir uploaded_photos_keys null a array buit', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        language: 'ca',
        uploaded_photos_keys: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.uploaded_photos_keys).toEqual([]);
    });

    it('hauria de convertir uploaded_photos_keys undefined a array buit', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        language: 'ca',
        uploaded_photos_keys: undefined,
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.uploaded_photos_keys).toEqual([]);
    });

    it('hauria de mantenir uploaded_photos_keys quan és un array', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        language: 'ca',
        uploaded_photos_keys: ['photo1', 'photo2', 'photo3'],
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.uploaded_photos_keys).toEqual(['photo1', 'photo2', 'photo3']);
    });

    it('hauria de mantenir num_shared_experiences null', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        language: 'ca',
        num_shared_experiences: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.num_shared_experiences).toBeNull();
    });

    it('hauria de mantenir num_shared_experiences quan és 0', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        language: 'ca',
        num_shared_experiences: 0,
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.num_shared_experiences).toBe(0);
    });

    it('hauria de mantenir num_shared_experiences quan és un número positiu', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        language: 'ca',
        num_shared_experiences: 25,
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.num_shared_experiences).toBe(25);
    });

    it('hauria de convertir num_shared_experiences undefined a null', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        language: 'ca',
        num_shared_experiences: undefined,
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.num_shared_experiences).toBeNull();
    });

    it('hauria de mantenir num_renovated_refuges correctament', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        language: 'ca',
        num_renovated_refuges: 10,
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.num_renovated_refuges).toBe(10);
    });

    it('hauria de mantenir num_refugis_reformats correctament', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        language: 'ca',
        num_renovated_refuges: 5,
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.num_renovated_refuges).toBe(5);
    });

    it('hauria de mantenir el created_at sense modificacions', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        language: 'ca',
        created_at: '2023-06-20T15:45:30.123Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.created_at).toBe('2023-06-20T15:45:30.123Z');
    });

    it('hauria de gestionar dades amb arrays buits', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        language: 'ca',
        favourite_refuges: [],
        visited_refuges: [],
        uploaded_photos_keys: [],
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.favourite_refuges).toHaveLength(0);
      expect(user.visited_refuges).toHaveLength(0);
      expect(user.uploaded_photos_keys).toHaveLength(0);
    });

    it('hauria de gestionar arrays amb múltiples elements', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        language: 'ca',
        favourite_refuges: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
        visited_refuges: ['1', '2', '3', '4', '5'],
        uploaded_photos_keys: ['p1', 'p2', 'p3', 'p4', 'p5'],
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.favourite_refuges).toHaveLength(10);
      expect(user.visited_refuges).toHaveLength(5);
      expect(user.uploaded_photos_keys).toHaveLength(5);
    });
  });
});

describe('Validacions i casos límit d\'Usuaris', () => {
  describe('UID validacions', () => {
    it('hauria de gestionar UIDs curts', () => {
      const user: User = {
        uid: 'abc',
        username: 'user',
        language: 'ca',
        favourite_refuges: [],
        visited_refuges: [],
        num_shared_experiences: null,
        num_renovated_refuges: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.uid).toBe('abc');
    });

    it('hauria de gestionar UIDs llargs', () => {
      const longUID = 'a'.repeat(100);
      const user: User = {
        uid: longUID,
        username: 'user',
        language: 'ca',
        favourite_refuges: [],
        visited_refuges: [],
        num_shared_experiences: null,
        num_renovated_refuges: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.uid).toHaveLength(100);
    });

    it('hauria de gestionar UIDs amb caràcters especials', () => {
      const user: User = {
        uid: 'uid-123-abc_xyz',
        username: 'user',
        language: 'ca',
        favourite_refuges: [],
        visited_refuges: [],
        num_shared_experiences: null,
        num_renovated_refuges: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.uid).toBe('uid-123-abc_xyz');
    });
  });

  describe('Username validacions', () => {
    it('hauria de gestionar usernames curts', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'ab',
        language: 'ca',
        favourite_refuges: [],
        visited_refuges: [],
        num_shared_experiences: null,
        num_renovated_refuges: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.username).toBe('ab');
    });

    it('hauria de gestionar usernames llargs', () => {
      const longUsername = 'a'.repeat(50);
      const user: User = {
        uid: 'uid-1',
        username: longUsername,
        language: 'ca',
        favourite_refuges: [],
        visited_refuges: [],
        num_shared_experiences: null,
        num_renovated_refuges: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.username).toHaveLength(50);
    });

    it('hauria de gestionar usernames amb caràcters especials', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user_name-123',
        language: 'ca',
        favourite_refuges: [],
        visited_refuges: [],
        num_shared_experiences: null,
        num_renovated_refuges: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.username).toBe('user_name-123');
    });

    it('hauria de gestionar usernames amb espais', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'User Name',
        language: 'ca',
        favourite_refuges: [],
        visited_refuges: [],
        num_shared_experiences: null,
        num_renovated_refuges: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.username).toBe('User Name');
    });
  });

  // Email no forma part del model User actual
  describe('Language validacions', () => {
    it('hauria de gestionar idiomes estàndard', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user',
        language: 'ca',
        num_shared_experiences: null,
        num_renovated_refuges: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.language).toBe('ca');
    });

    it('hauria de gestionar idioma anglès', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user',
        language: 'en',
        num_shared_experiences: null,
        num_renovated_refuges: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.language).toBe('en');
    });

    it('hauria de gestionar idioma espanyol', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user',
        language: 'es',
        num_shared_experiences: null,
        num_renovated_refuges: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.language).toBe('es');
    });

    it('hauria de gestionar idioma francès', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user',
        language: 'fr',
        num_shared_experiences: null,
        num_renovated_refuges: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.language).toBe('fr');
    });
  });

  describe('Estadístiques límit', () => {
    it('hauria de gestionar números molt grans per experiències compartides', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user',
        language: 'ca',
        num_shared_experiences: 999999,
        num_renovated_refuges: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.num_shared_experiences).toBe(999999);
    });

    it('hauria de gestionar 0 com a valor vàlid', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user',
        language: 'ca',
        num_shared_experiences: 0,
        num_renovated_refuges: 0,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.num_shared_experiences).toBe(0);
      expect(user.num_renovated_refuges).toBe(0);
    });
  });

  describe('Arrays límit', () => {
    it('hauria de gestionar arrays molt grans de refugis favorits', () => {
      const favorits = Array.from({ length: 1000 }, (_, i) => i + 1);
      const user: User = {
        uid: 'uid-1',
        username: 'user',
        language: 'ca',
        favourite_refuges: favorits,
        visited_refuges: [],
        num_shared_experiences: null,
        num_renovated_refuges: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.favourite_refuges).toHaveLength(1000);
      expect(user.favourite_refuges[0]).toBe(1);
      expect(user.favourite_refuges[999]).toBe(1000);
    });

    it('hauria de gestionar refugis favorits amb IDs duplicats', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user',
        language: 'ca',
        favourite_refuges: [1, 1, 2, 2, 3, 3],
        visited_refuges: [],
        num_shared_experiences: null,
        num_renovated_refuges: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.favourite_refuges).toHaveLength(6);
      expect(user.favourite_refuges.filter(id => id === 1)).toHaveLength(2);
    });

    it('hauria de gestionar IDs de refugi molt grans', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user',
        language: 'ca',
        favourite_refuges: [999999, 1000000, 1234567],
        visited_refuges: [],
        num_shared_experiences: null,
        num_renovated_refuges: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.favourite_refuges).toContain(999999);
      expect(user.favourite_refuges).toContain(1234567);
    });
  });

  describe('Created_at validacions', () => {
    it('hauria de gestionar dates antigues', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user',
        language: 'ca',
        favourite_refuges: [],
        visited_refuges: [],
        num_shared_experiences: null,
        num_renovated_refuges: null,
        created_at: '2000-01-01T00:00:00Z',
      };

      const date = new Date(user.created_at);
      expect(date.getFullYear()).toBe(2000);
    });

    it('hauria de gestionar dates recents', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user',
        language: 'ca',
        favourite_refuges: [],
        visited_refuges: [],
        num_shared_experiences: null,
        num_renovated_refuges: null,
        created_at: '2025-01-01T00:00:00Z',
      };

      const date = new Date(user.created_at);
      expect(date.getFullYear()).toBe(2025);
    });

    it('hauria de gestionar dates amb mil·lisegons', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user',
        language: 'ca',
        favourite_refuges: [],
        visited_refuges: [],
        num_shared_experiences: null,
        num_renovated_refuges: null,
        created_at: '2023-06-15T14:30:45.123Z',
      };

      expect(user.created_at).toContain('.123Z');
    });
  });
});
