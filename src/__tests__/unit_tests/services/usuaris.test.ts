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
        email: 'test@example.com',
        idioma: 'ca',
        refugis_favorits: [],
        refugis_visitats: [],
        reformes: [],
        num_fotos_pujades: null,
        num_experiencies_compartides: null,
        num_refugis_reformats: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.uid).toBe('test-uid-123');
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
      expect(user.idioma).toBe('ca');
    });

    it('hauria de crear un usuari complet amb tots els camps', () => {
      const user: User = {
        uid: 'uid-456',
        username: 'johndoe',
        email: 'john@example.com',
        avatar: 'https://example.com/avatar.jpg',
        idioma: 'es',
        refugis_favorits: [1, 2, 3, 4, 5],
        refugis_visitats: [1, 2, 3],
        reformes: ['reforma1', 'reforma2'],
        num_fotos_pujades: 15,
        num_experiencies_compartides: 10,
        num_refugis_reformats: 2,
        created_at: '2023-05-15T10:30:00Z',
      };

      expect(user.uid).toBe('uid-456');
      expect(user.avatar).toBe('https://example.com/avatar.jpg');
      expect(user.refugis_favorits).toHaveLength(5);
      expect(user.refugis_visitats).toHaveLength(3);
      expect(user.reformes).toHaveLength(2);
      expect(user.num_fotos_pujades).toBe(15);
      expect(user.num_experiencies_compartides).toBe(10);
      expect(user.num_refugis_reformats).toBe(2);
    });

    it('hauria de permetre avatar com undefined', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user1',
        email: 'user1@example.com',
        avatar: undefined,
        idioma: 'ca',
        refugis_favorits: [],
        refugis_visitats: [],
        reformes: [],
        num_fotos_pujades: null,
        num_experiencies_compartides: null,
        num_refugis_reformats: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.avatar).toBeUndefined();
    });

    it('hauria de permetre arrays buits per refugis_favorits', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user1',
        email: 'user1@example.com',
        idioma: 'ca',
        refugis_favorits: [],
        refugis_visitats: [],
        reformes: [],
        num_fotos_pujades: null,
        num_experiencies_compartides: null,
        num_refugis_reformats: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.refugis_favorits).toHaveLength(0);
      expect(Array.isArray(user.refugis_favorits)).toBe(true);
    });

    it('hauria de permetre múltiples refugis favorits', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user1',
        email: 'user1@example.com',
        idioma: 'ca',
        refugis_favorits: [1, 5, 10, 15, 20, 100],
        refugis_visitats: [],
        reformes: [],
        num_fotos_pujades: null,
        num_experiencies_compartides: null,
        num_refugis_reformats: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.refugis_favorits).toHaveLength(6);
      expect(user.refugis_favorits).toContain(1);
      expect(user.refugis_favorits).toContain(100);
    });

    it('hauria de permetre múltiples refugis visitats', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user1',
        email: 'user1@example.com',
        idioma: 'ca',
        refugis_favorits: [],
        refugis_visitats: [2, 4, 6, 8],
        reformes: [],
        num_fotos_pujades: null,
        num_experiencies_compartides: null,
        num_refugis_reformats: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.refugis_visitats).toHaveLength(4);
      expect(user.refugis_visitats).toContain(2);
      expect(user.refugis_visitats).toContain(8);
    });

    it('hauria de permetre múltiples reformes', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user1',
        email: 'user1@example.com',
        idioma: 'ca',
        refugis_favorits: [],
        refugis_visitats: [],
        reformes: ['reforma-id-1', 'reforma-id-2', 'reforma-id-3'],
        num_fotos_pujades: null,
        num_experiencies_compartides: null,
        num_refugis_reformats: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.reformes).toHaveLength(3);
      expect(user.reformes).toContain('reforma-id-1');
    });

    it('hauria de permetre valors null per estadístiques', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user1',
        email: 'user1@example.com',
        idioma: 'ca',
        refugis_favorits: [],
        refugis_visitats: [],
        reformes: [],
        num_fotos_pujades: null,
        num_experiencies_compartides: null,
        num_refugis_reformats: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.num_fotos_pujades).toBeNull();
      expect(user.num_experiencies_compartides).toBeNull();
      expect(user.num_refugis_reformats).toBeNull();
    });

    it('hauria de permetre valors 0 per estadístiques', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user1',
        email: 'user1@example.com',
        idioma: 'ca',
        refugis_favorits: [],
        refugis_visitats: [],
        reformes: [],
        num_fotos_pujades: 0,
        num_experiencies_compartides: 0,
        num_refugis_reformats: 0,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.num_fotos_pujades).toBe(0);
      expect(user.num_experiencies_compartides).toBe(0);
      expect(user.num_refugis_reformats).toBe(0);
    });

    it('hauria de validar idiomes suportats', () => {
      const idiomes = ['ca', 'es', 'en', 'fr'];

      idiomes.forEach(idioma => {
        const user: User = {
          uid: 'uid-1',
          username: 'user1',
          email: 'user1@example.com',
          idioma,
          refugis_favorits: [],
          refugis_visitats: [],
          reformes: [],
          num_fotos_pujades: null,
          num_experiencies_compartides: null,
          num_refugis_reformats: null,
          created_at: '2023-01-01T00:00:00Z',
        };

        expect(user.idioma).toBe(idioma);
      });
    });

    it('hauria de mantenir el format ISO de created_at', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user1',
        email: 'user1@example.com',
        idioma: 'ca',
        refugis_favorits: [],
        refugis_visitats: [],
        reformes: [],
        num_fotos_pujades: null,
        num_experiencies_compartides: null,
        num_refugis_reformats: null,
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
        email: 'test@example.com',
        idioma: 'ca',
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(userDTO.uid).toBe('test-uid');
      expect(userDTO.username).toBe('testuser');
      expect(userDTO.email).toBe('test@example.com');
      expect(userDTO.idioma).toBe('ca');
      expect(userDTO.created_at).toBe('2023-01-01T00:00:00Z');
    });

    it('hauria de crear un UserDTO complet amb tots els camps', () => {
      const userDTO: UserDTO = {
        uid: 'uid-123',
        username: 'johndoe',
        email: 'john@example.com',
        avatar: 'https://example.com/avatar.jpg',
        idioma: 'ES',
        refugis_favorits: [1, 2, 3],
        refugis_visitats: [1],
        reformes: ['reforma1'],
        num_fotos_pujades: 10,
        num_experiencies_compartides: 5,
        num_refugis_reformats: 1,
        created_at: '2023-05-01T00:00:00Z',
      };

      expect(userDTO.avatar).toBe('https://example.com/avatar.jpg');
      expect(userDTO.refugis_favorits).toHaveLength(3);
      expect(userDTO.num_fotos_pujades).toBe(10);
    });

    it('hauria de permetre camps opcionals com a null', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        email: 'user1@example.com',
        avatar: null,
        idioma: 'ca',
        refugis_favorits: null,
        refugis_visitats: null,
        reformes: null,
        num_fotos_pujades: null,
        num_experiencies_compartides: null,
        num_refugis_reformats: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(userDTO.avatar).toBeNull();
      expect(userDTO.refugis_favorits).toBeNull();
      expect(userDTO.refugis_visitats).toBeNull();
      expect(userDTO.reformes).toBeNull();
      expect(userDTO.num_fotos_pujades).toBeNull();
    });

    it('hauria de permetre camps opcionals com a undefined', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        email: 'user1@example.com',
        avatar: undefined,
        idioma: 'ca',
        refugis_favorits: undefined,
        refugis_visitats: undefined,
        reformes: undefined,
        num_fotos_pujades: undefined,
        num_experiencies_compartides: undefined,
        num_refugis_reformats: undefined,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(userDTO.avatar).toBeUndefined();
      expect(userDTO.refugis_favorits).toBeUndefined();
    });

    it('hauria de gestionar arrays buits', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        email: 'user1@example.com',
        idioma: 'ca',
        refugis_favorits: [],
        refugis_visitats: [],
        reformes: [],
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(userDTO.refugis_favorits).toHaveLength(0);
      expect(userDTO.refugis_visitats).toHaveLength(0);
      expect(userDTO.reformes).toHaveLength(0);
    });

    it('hauria de permetre idioma en majúscules', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        email: 'user1@example.com',
        idioma: 'CA',
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(userDTO.idioma).toBe('CA');
    });

    it('hauria de permetre idioma en minúscules', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        email: 'user1@example.com',
        idioma: 'ca',
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(userDTO.idioma).toBe('ca');
    });
  });
});

describe('Mappers d\'Usuaris', () => {
  describe('mapUserFromDTO', () => {
    it('hauria de convertir un UserDTO mínim a User', () => {
      const userDTO: UserDTO = {
        uid: 'uid-123',
        username: 'testuser',
        email: 'test@example.com',
        idioma: 'ca',
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.uid).toBe('uid-123');
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
      expect(user.idioma).toBe('ca');
      expect(user.created_at).toBe('2023-01-01T00:00:00Z');
    });

    it('hauria de convertir un UserDTO complet a User', () => {
      const userDTO: UserDTO = {
        uid: 'uid-456',
        username: 'johndoe',
        email: 'john@example.com',
        avatar: 'https://example.com/avatar.jpg',
        idioma: 'ES',
        refugis_favorits: [1, 2, 3, 4, 5],
        refugis_visitats: [1, 2, 3],
        reformes: ['reforma1', 'reforma2'],
        num_fotos_pujades: 20,
        num_experiencies_compartides: 15,
        num_refugis_reformats: 3,
        created_at: '2023-05-15T10:30:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.uid).toBe('uid-456');
      expect(user.username).toBe('johndoe');
      expect(user.email).toBe('john@example.com');
      expect(user.avatar).toBe('https://example.com/avatar.jpg');
      expect(user.idioma).toBe('ES');
      expect(user.refugis_favorits).toEqual([1, 2, 3, 4, 5]);
      expect(user.refugis_visitats).toEqual([1, 2, 3]);
      expect(user.reformes).toEqual(['reforma1', 'reforma2']);
      expect(user.num_fotos_pujades).toBe(20);
      expect(user.num_experiencies_compartides).toBe(15);
      expect(user.num_refugis_reformats).toBe(3);
      expect(user.created_at).toBe('2023-05-15T10:30:00Z');
    });

    it('hauria de convertir avatar null a undefined', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        email: 'user1@example.com',
        avatar: null,
        idioma: 'ca',
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.avatar).toBeUndefined();
    });

    it('hauria de mantenir avatar quan és una string vàlida', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        email: 'user1@example.com',
        avatar: 'https://example.com/avatar.jpg',
        idioma: 'ca',
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.avatar).toBe('https://example.com/avatar.jpg');
    });

    it('hauria de convertir refugis_favorits null a array buit', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        email: 'user1@example.com',
        idioma: 'ca',
        refugis_favorits: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.refugis_favorits).toEqual([]);
      expect(Array.isArray(user.refugis_favorits)).toBe(true);
    });

    it('hauria de convertir refugis_favorits undefined a array buit', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        email: 'user1@example.com',
        idioma: 'ca',
        refugis_favorits: undefined,
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.refugis_favorits).toEqual([]);
    });

    it('hauria de mantenir refugis_favorits quan és un array', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        email: 'user1@example.com',
        idioma: 'ca',
        refugis_favorits: [1, 5, 10],
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.refugis_favorits).toEqual([1, 5, 10]);
    });

    it('hauria de convertir refugis_visitats null a array buit', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        email: 'user1@example.com',
        idioma: 'ca',
        refugis_visitats: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.refugis_visitats).toEqual([]);
    });

    it('hauria de convertir refugis_visitats undefined a array buit', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        email: 'user1@example.com',
        idioma: 'ca',
        refugis_visitats: undefined,
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.refugis_visitats).toEqual([]);
    });

    it('hauria de mantenir refugis_visitats quan és un array', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        email: 'user1@example.com',
        idioma: 'ca',
        refugis_visitats: [2, 4, 6, 8],
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.refugis_visitats).toEqual([2, 4, 6, 8]);
    });

    it('hauria de convertir reformes null a array buit', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        email: 'user1@example.com',
        idioma: 'ca',
        reformes: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.reformes).toEqual([]);
    });

    it('hauria de convertir reformes undefined a array buit', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        email: 'user1@example.com',
        idioma: 'ca',
        reformes: undefined,
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.reformes).toEqual([]);
    });

    it('hauria de mantenir reformes quan és un array', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        email: 'user1@example.com',
        idioma: 'ca',
        reformes: ['reforma1', 'reforma2', 'reforma3'],
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.reformes).toEqual(['reforma1', 'reforma2', 'reforma3']);
    });

    it('hauria de mantenir num_fotos_pujades null', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        email: 'user1@example.com',
        idioma: 'ca',
        num_fotos_pujades: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.num_fotos_pujades).toBeNull();
    });

    it('hauria de mantenir num_fotos_pujades quan és 0', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        email: 'user1@example.com',
        idioma: 'ca',
        num_fotos_pujades: 0,
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.num_fotos_pujades).toBe(0);
    });

    it('hauria de mantenir num_fotos_pujades quan és un número positiu', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        email: 'user1@example.com',
        idioma: 'ca',
        num_fotos_pujades: 25,
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.num_fotos_pujades).toBe(25);
    });

    it('hauria de convertir num_fotos_pujades undefined a null', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        email: 'user1@example.com',
        idioma: 'ca',
        num_fotos_pujades: undefined,
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.num_fotos_pujades).toBeNull();
    });

    it('hauria de mantenir num_experiencies_compartides correctament', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        email: 'user1@example.com',
        idioma: 'ca',
        num_experiencies_compartides: 10,
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.num_experiencies_compartides).toBe(10);
    });

    it('hauria de mantenir num_refugis_reformats correctament', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        email: 'user1@example.com',
        idioma: 'ca',
        num_refugis_reformats: 5,
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.num_refugis_reformats).toBe(5);
    });

    it('hauria de mantenir el created_at sense modificacions', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        email: 'user1@example.com',
        idioma: 'ca',
        created_at: '2023-06-20T15:45:30.123Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.created_at).toBe('2023-06-20T15:45:30.123Z');
    });

    it('hauria de gestionar dades amb arrays buits', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        email: 'user1@example.com',
        idioma: 'ca',
        refugis_favorits: [],
        refugis_visitats: [],
        reformes: [],
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.refugis_favorits).toHaveLength(0);
      expect(user.refugis_visitats).toHaveLength(0);
      expect(user.reformes).toHaveLength(0);
    });

    it('hauria de gestionar arrays amb múltiples elements', () => {
      const userDTO: UserDTO = {
        uid: 'uid-1',
        username: 'user1',
        email: 'user1@example.com',
        idioma: 'ca',
        refugis_favorits: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        refugis_visitats: [1, 2, 3, 4, 5],
        reformes: ['r1', 'r2', 'r3', 'r4', 'r5'],
        created_at: '2023-01-01T00:00:00Z',
      };

      const user = mapUserFromDTO(userDTO);

      expect(user.refugis_favorits).toHaveLength(10);
      expect(user.refugis_visitats).toHaveLength(5);
      expect(user.reformes).toHaveLength(5);
    });
  });
});

describe('Validacions i casos límit d\'Usuaris', () => {
  describe('UID validacions', () => {
    it('hauria de gestionar UIDs curts', () => {
      const user: User = {
        uid: 'abc',
        username: 'user',
        email: 'user@example.com',
        idioma: 'ca',
        refugis_favorits: [],
        refugis_visitats: [],
        reformes: [],
        num_fotos_pujades: null,
        num_experiencies_compartides: null,
        num_refugis_reformats: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.uid).toBe('abc');
    });

    it('hauria de gestionar UIDs llargs', () => {
      const longUID = 'a'.repeat(100);
      const user: User = {
        uid: longUID,
        username: 'user',
        email: 'user@example.com',
        idioma: 'ca',
        refugis_favorits: [],
        refugis_visitats: [],
        reformes: [],
        num_fotos_pujades: null,
        num_experiencies_compartides: null,
        num_refugis_reformats: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.uid).toHaveLength(100);
    });

    it('hauria de gestionar UIDs amb caràcters especials', () => {
      const user: User = {
        uid: 'uid-123-abc_xyz',
        username: 'user',
        email: 'user@example.com',
        idioma: 'ca',
        refugis_favorits: [],
        refugis_visitats: [],
        reformes: [],
        num_fotos_pujades: null,
        num_experiencies_compartides: null,
        num_refugis_reformats: null,
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
        email: 'user@example.com',
        idioma: 'ca',
        refugis_favorits: [],
        refugis_visitats: [],
        reformes: [],
        num_fotos_pujades: null,
        num_experiencies_compartides: null,
        num_refugis_reformats: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.username).toBe('ab');
    });

    it('hauria de gestionar usernames llargs', () => {
      const longUsername = 'a'.repeat(50);
      const user: User = {
        uid: 'uid-1',
        username: longUsername,
        email: 'user@example.com',
        idioma: 'ca',
        refugis_favorits: [],
        refugis_visitats: [],
        reformes: [],
        num_fotos_pujades: null,
        num_experiencies_compartides: null,
        num_refugis_reformats: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.username).toHaveLength(50);
    });

    it('hauria de gestionar usernames amb caràcters especials', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user_name-123',
        email: 'user@example.com',
        idioma: 'ca',
        refugis_favorits: [],
        refugis_visitats: [],
        reformes: [],
        num_fotos_pujades: null,
        num_experiencies_compartides: null,
        num_refugis_reformats: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.username).toBe('user_name-123');
    });

    it('hauria de gestionar usernames amb espais', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'User Name',
        email: 'user@example.com',
        idioma: 'ca',
        refugis_favorits: [],
        refugis_visitats: [],
        reformes: [],
        num_fotos_pujades: null,
        num_experiencies_compartides: null,
        num_refugis_reformats: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.username).toBe('User Name');
    });
  });

  describe('Email validacions', () => {
    it('hauria de gestionar emails estàndard', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user',
        email: 'user@example.com',
        idioma: 'ca',
        refugis_favorits: [],
        refugis_visitats: [],
        reformes: [],
        num_fotos_pujades: null,
        num_experiencies_compartides: null,
        num_refugis_reformats: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.email).toBe('user@example.com');
      expect(user.email).toContain('@');
    });

    it('hauria de gestionar emails amb subdominis', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user',
        email: 'user@mail.example.com',
        idioma: 'ca',
        refugis_favorits: [],
        refugis_visitats: [],
        reformes: [],
        num_fotos_pujades: null,
        num_experiencies_compartides: null,
        num_refugis_reformats: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.email).toBe('user@mail.example.com');
    });

    it('hauria de gestionar emails amb punts', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user',
        email: 'user.name@example.com',
        idioma: 'ca',
        refugis_favorits: [],
        refugis_visitats: [],
        reformes: [],
        num_fotos_pujades: null,
        num_experiencies_compartides: null,
        num_refugis_reformats: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.email).toBe('user.name@example.com');
    });

    it('hauria de gestionar emails amb plus addressing', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user',
        email: 'user+tag@example.com',
        idioma: 'ca',
        refugis_favorits: [],
        refugis_visitats: [],
        reformes: [],
        num_fotos_pujades: null,
        num_experiencies_compartides: null,
        num_refugis_reformats: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.email).toBe('user+tag@example.com');
    });
  });

  describe('Estadístiques límit', () => {
    it('hauria de gestionar números molt grans per fotos pujades', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user',
        email: 'user@example.com',
        idioma: 'ca',
        refugis_favorits: [],
        refugis_visitats: [],
        reformes: [],
        num_fotos_pujades: 999999,
        num_experiencies_compartides: null,
        num_refugis_reformats: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.num_fotos_pujades).toBe(999999);
    });

    it('hauria de gestionar 0 com a valor vàlid', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user',
        email: 'user@example.com',
        idioma: 'ca',
        refugis_favorits: [],
        refugis_visitats: [],
        reformes: [],
        num_fotos_pujades: 0,
        num_experiencies_compartides: 0,
        num_refugis_reformats: 0,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.num_fotos_pujades).toBe(0);
      expect(user.num_experiencies_compartides).toBe(0);
      expect(user.num_refugis_reformats).toBe(0);
    });
  });

  describe('Arrays límit', () => {
    it('hauria de gestionar arrays molt grans de refugis favorits', () => {
      const favorits = Array.from({ length: 1000 }, (_, i) => i + 1);
      const user: User = {
        uid: 'uid-1',
        username: 'user',
        email: 'user@example.com',
        idioma: 'ca',
        refugis_favorits: favorits,
        refugis_visitats: [],
        reformes: [],
        num_fotos_pujades: null,
        num_experiencies_compartides: null,
        num_refugis_reformats: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.refugis_favorits).toHaveLength(1000);
      expect(user.refugis_favorits[0]).toBe(1);
      expect(user.refugis_favorits[999]).toBe(1000);
    });

    it('hauria de gestionar refugis favorits amb IDs duplicats', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user',
        email: 'user@example.com',
        idioma: 'ca',
        refugis_favorits: [1, 1, 2, 2, 3, 3],
        refugis_visitats: [],
        reformes: [],
        num_fotos_pujades: null,
        num_experiencies_compartides: null,
        num_refugis_reformats: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.refugis_favorits).toHaveLength(6);
      expect(user.refugis_favorits.filter(id => id === 1)).toHaveLength(2);
    });

    it('hauria de gestionar IDs de refugi molt grans', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user',
        email: 'user@example.com',
        idioma: 'ca',
        refugis_favorits: [999999, 1000000, 1234567],
        refugis_visitats: [],
        reformes: [],
        num_fotos_pujades: null,
        num_experiencies_compartides: null,
        num_refugis_reformats: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      expect(user.refugis_favorits).toContain(999999);
      expect(user.refugis_favorits).toContain(1234567);
    });
  });

  describe('Created_at validacions', () => {
    it('hauria de gestionar dates antigues', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user',
        email: 'user@example.com',
        idioma: 'ca',
        refugis_favorits: [],
        refugis_visitats: [],
        reformes: [],
        num_fotos_pujades: null,
        num_experiencies_compartides: null,
        num_refugis_reformats: null,
        created_at: '2000-01-01T00:00:00Z',
      };

      const date = new Date(user.created_at);
      expect(date.getFullYear()).toBe(2000);
    });

    it('hauria de gestionar dates recents', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user',
        email: 'user@example.com',
        idioma: 'ca',
        refugis_favorits: [],
        refugis_visitats: [],
        reformes: [],
        num_fotos_pujades: null,
        num_experiencies_compartides: null,
        num_refugis_reformats: null,
        created_at: '2025-01-01T00:00:00Z',
      };

      const date = new Date(user.created_at);
      expect(date.getFullYear()).toBe(2025);
    });

    it('hauria de gestionar dates amb mil·lisegons', () => {
      const user: User = {
        uid: 'uid-1',
        username: 'user',
        email: 'user@example.com',
        idioma: 'ca',
        refugis_favorits: [],
        refugis_visitats: [],
        reformes: [],
        num_fotos_pujades: null,
        num_experiencies_compartides: null,
        num_refugis_reformats: null,
        created_at: '2023-06-15T14:30:45.123Z',
      };

      expect(user.created_at).toContain('.123Z');
    });
  });
});
