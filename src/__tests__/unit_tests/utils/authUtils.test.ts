/**
 * Tests unitaris per a authUtils
 *
 * Aquest fitxer cobreix:
 * - isUserAdmin
 * - getUserRole
 * - Gestió d'errors
 */

import { isUserAdmin, getUserRole } from '../../../utils/authUtils';
import { getAuth } from 'firebase/auth';

// Mock firebase/auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
}));

const mockGetAuth = getAuth as jest.Mock;

describe('authUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isUserAdmin', () => {
    it('hauria de retornar true si l\'usuari és admin', async () => {
      const mockUser = {
        getIdTokenResult: jest.fn().mockResolvedValue({
          claims: { role: 'admin' },
        }),
      };
      mockGetAuth.mockReturnValue({ currentUser: mockUser });

      const result = await isUserAdmin();

      expect(result).toBe(true);
      expect(mockUser.getIdTokenResult).toHaveBeenCalled();
    });

    it('hauria de retornar false si l\'usuari no és admin', async () => {
      const mockUser = {
        getIdTokenResult: jest.fn().mockResolvedValue({
          claims: { role: 'user' },
        }),
      };
      mockGetAuth.mockReturnValue({ currentUser: mockUser });

      const result = await isUserAdmin();

      expect(result).toBe(false);
    });

    it('hauria de retornar false si no hi ha usuari autenticat', async () => {
      mockGetAuth.mockReturnValue({ currentUser: null });

      const result = await isUserAdmin();

      expect(result).toBe(false);
    });

    it('hauria de retornar false si no hi ha claim de rol', async () => {
      const mockUser = {
        getIdTokenResult: jest.fn().mockResolvedValue({
          claims: {},
        }),
      };
      mockGetAuth.mockReturnValue({ currentUser: mockUser });

      const result = await isUserAdmin();

      expect(result).toBe(false);
    });

    it('hauria de retornar false si hi ha un error', async () => {
      const mockUser = {
        getIdTokenResult: jest.fn().mockRejectedValue(new Error('Token error')),
      };
      mockGetAuth.mockReturnValue({ currentUser: mockUser });

      const result = await isUserAdmin();

      expect(result).toBe(false);
    });
  });

  describe('getUserRole', () => {
    it('hauria de retornar el rol de l\'usuari', async () => {
      const mockUser = {
        getIdTokenResult: jest.fn().mockResolvedValue({
          claims: { role: 'admin' },
        }),
      };
      mockGetAuth.mockReturnValue({ currentUser: mockUser });

      const result = await getUserRole();

      expect(result).toBe('admin');
    });

    it('hauria de retornar null si no hi ha usuari', async () => {
      mockGetAuth.mockReturnValue({ currentUser: null });

      const result = await getUserRole();

      expect(result).toBeNull();
    });

    it('hauria de retornar null si no hi ha claim de rol', async () => {
      const mockUser = {
        getIdTokenResult: jest.fn().mockResolvedValue({
          claims: {},
        }),
      };
      mockGetAuth.mockReturnValue({ currentUser: mockUser });

      const result = await getUserRole();

      expect(result).toBeNull();
    });

    it('hauria de retornar null si hi ha un error', async () => {
      const mockUser = {
        getIdTokenResult: jest.fn().mockRejectedValue(new Error('Token error')),
      };
      mockGetAuth.mockReturnValue({ currentUser: mockUser });

      const result = await getUserRole();

      expect(result).toBeNull();
    });

    it('hauria de retornar el rol correcte per a usuari normal', async () => {
      const mockUser = {
        getIdTokenResult: jest.fn().mockResolvedValue({
          claims: { role: 'user' },
        }),
      };
      mockGetAuth.mockReturnValue({ currentUser: mockUser });

      const result = await getUserRole();

      expect(result).toBe('user');
    });
  });
});
