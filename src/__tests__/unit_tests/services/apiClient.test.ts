/**
 * Tests unitaris per apiClient
 * 
 * Aquest fitxer cobreix:
 * - apiClient amb gestió automàtica de tokens
 * - Refresc automàtic de tokens en cas de 401
 * - Headers per defecte (getDefaultHeaders)
 * - Helpers HTTP (apiGet, apiPost, apiPatch, apiPut, apiDelete)
 * - Opcions skipAuth i skipRetry
 * - Escenaris d'error i límits
 * 
 * Escenaris d'èxit i límit per màxim coverage
 */

import { apiClient, getDefaultHeaders, apiGet, apiPost, apiPatch, apiPut, apiDelete } from '../../../services/apiClient';
import { AuthService } from '../../../services/AuthService';
import { fetchWithLog } from '../../../services/fetchWithLog';

// Mock de les dependències
jest.mock('../../../services/fetchWithLog');
jest.mock('../../../services/AuthService');

const mockedFetchWithLog = fetchWithLog as jest.MockedFunction<typeof fetchWithLog>;
const mockedAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe('apiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe('apiClient', () => {
    it('ha de fer una petició GET amb token d\'autenticació per defecte', async () => {
      // Arrange
      const mockToken = 'test-token-123';
      mockedAuthService.getAuthToken = jest.fn().mockResolvedValue(mockToken);
      
      const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      mockedFetchWithLog.mockResolvedValue(mockResponse);

      // Act
      const response = await apiClient('https://api.test.com/users');

      // Assert
      expect(mockedAuthService.getAuthToken).toHaveBeenCalledWith();
      expect(mockedFetchWithLog).toHaveBeenCalledWith(
        'https://api.test.com/users',
        expect.objectContaining({
          headers: {
            'Authorization': `Bearer ${mockToken}`
          }
        })
      );
      expect(response.status).toBe(200);
    });

    it('ha de fer una petició sense token si skipAuth és true', async () => {
      // Arrange
      const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
        status: 200
      });
      mockedFetchWithLog.mockResolvedValue(mockResponse);

      // Act
      await apiClient('https://api.test.com/public', { skipAuth: true });

      // Assert
      expect(mockedAuthService.getAuthToken).not.toHaveBeenCalled();
      expect(mockedFetchWithLog).toHaveBeenCalledWith(
        'https://api.test.com/public',
        expect.not.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.any(String)
          })
        })
      );
    });

    it('ha de fer una petició sense token si AuthService retorna null', async () => {
      // Arrange
      mockedAuthService.getAuthToken = jest.fn().mockResolvedValue(null);
      
      const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
        status: 200
      });
      mockedFetchWithLog.mockResolvedValue(mockResponse);

      // Act
      await apiClient('https://api.test.com/users');

      // Assert
      expect(mockedAuthService.getAuthToken).toHaveBeenCalled();
      expect(mockedFetchWithLog).toHaveBeenCalledWith(
        'https://api.test.com/users',
        expect.not.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.any(String)
          })
        })
      );
    });

    it('ha de refrescar el token i reintentar la petició quan rep 401', async () => {
      // Arrange
      const oldToken = 'old-token';
      const newToken = 'new-token-refreshed';
      
      mockedAuthService.getAuthToken = jest.fn()
        .mockResolvedValueOnce(oldToken)  // Primera crida - token antic
        .mockResolvedValueOnce(newToken); // Segona crida amb forceRefresh
      
      const response401 = new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        statusText: 'Unauthorized'
      });
      
      const response200 = new Response(JSON.stringify({ data: 'success' }), {
        status: 200,
        statusText: 'OK'
      });
      
      mockedFetchWithLog
        .mockResolvedValueOnce(response401)  // Primera petició retorna 401
        .mockResolvedValueOnce(response200); // Segona petició (retry) retorna 200

      // Act
      const response = await apiClient('https://api.test.com/protected');

      // Assert
      expect(mockedAuthService.getAuthToken).toHaveBeenCalledTimes(2);
      expect(mockedAuthService.getAuthToken).toHaveBeenNthCalledWith(1); // Primera sense forceRefresh
      expect(mockedAuthService.getAuthToken).toHaveBeenNthCalledWith(2, true); // Segona amb forceRefresh
      
      expect(mockedFetchWithLog).toHaveBeenCalledTimes(2);
      // Verificar que el nou token s'ha utilitzat en el retry
      expect(mockedFetchWithLog).toHaveBeenCalledWith('https://api.test.com/protected',
        expect.objectContaining({
          headers: { 'Authorization': `Bearer ${newToken}` }
        })
      );
      
      expect(response.status).toBe(200);
    });

    it('ha de retornar 401 si el refresc del token també falla amb 401', async () => {
      // Arrange
      const oldToken = 'old-token';
      const newToken = 'new-token-but-invalid';
      
      mockedAuthService.getAuthToken = jest.fn()
        .mockResolvedValueOnce(oldToken)
        .mockResolvedValueOnce(newToken);
      
      const response401First = new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401
      });
      
      const response401Second = new Response(JSON.stringify({ error: 'Still Unauthorized' }), {
        status: 401
      });
      
      mockedFetchWithLog
        .mockResolvedValueOnce(response401First)
        .mockResolvedValueOnce(response401Second);

      // Act
      const response = await apiClient('https://api.test.com/protected');

      // Assert
      expect(response.status).toBe(401);
      // Console.log removed for security - no retry status logging
    });

    it('ha de retornar 401 original si no pot obtenir un nou token', async () => {
      // Arrange
      const oldToken = 'old-token';
      
      mockedAuthService.getAuthToken = jest.fn()
        .mockResolvedValueOnce(oldToken)   // Token inicial
        .mockResolvedValueOnce(null);      // Refresc falla, retorna null
      
      const response401 = new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401
      });
      
      mockedFetchWithLog.mockResolvedValue(response401);

      // Act
      const response = await apiClient('https://api.test.com/protected');

      // Assert
      expect(response.status).toBe(401);
      // Console.error removed for security - no token logging
      expect(mockedFetchWithLog).toHaveBeenCalledTimes(1); // No retry perquè no hi ha nou token
    });

    it('ha de gestionar errors durant el refresc del token', async () => {
      // Arrange
      const oldToken = 'old-token';
      
      mockedAuthService.getAuthToken = jest.fn()
        .mockResolvedValueOnce(oldToken)
        .mockRejectedValueOnce(new Error('Network error during token refresh'));
      
      const response401 = new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401
      });
      
      mockedFetchWithLog.mockResolvedValue(response401);

      // Act
      const response = await apiClient('https://api.test.com/protected');

      // Assert
      expect(response.status).toBe(401);
      // Console.error removed for security - no token error logging
    });

    it('no ha de reintentar si skipRetry és true', async () => {
      // Arrange
      const mockToken = 'test-token';
      mockedAuthService.getAuthToken = jest.fn().mockResolvedValue(mockToken);
      
      const response401 = new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401
      });
      
      mockedFetchWithLog.mockResolvedValue(response401);

      // Act
      const response = await apiClient('https://api.test.com/protected', { skipRetry: true });

      // Assert
      expect(response.status).toBe(401);
      expect(mockedAuthService.getAuthToken).toHaveBeenCalledTimes(1); // Només la crida inicial
      expect(mockedFetchWithLog).toHaveBeenCalledTimes(1); // No retry
    });

    it('ha de preservar els headers existents quan afegeix el token', async () => {
      // Arrange
      const mockToken = 'test-token';
      mockedAuthService.getAuthToken = jest.fn().mockResolvedValue(mockToken);
      
      const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
        status: 200
      });
      mockedFetchWithLog.mockResolvedValue(mockResponse);

      const customHeaders = {
        'X-Custom-Header': 'custom-value',
        'Accept-Language': 'ca'
      };

      // Act
      await apiClient('https://api.test.com/users', { 
        headers: customHeaders 
      });

      // Assert
      expect(mockedFetchWithLog).toHaveBeenCalledWith(
        'https://api.test.com/users',
        expect.objectContaining({
          headers: {
            'X-Custom-Header': 'custom-value',
            'Accept-Language': 'ca',
            'Authorization': `Bearer ${mockToken}`
          }
        })
      );
    });

    it('ha de passar totes les opcions de fetch correctament', async () => {
      // Arrange
      const mockToken = 'test-token';
      mockedAuthService.getAuthToken = jest.fn().mockResolvedValue(mockToken);
      
      const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
        status: 200
      });
      mockedFetchWithLog.mockResolvedValue(mockResponse);

      // Act
      await apiClient('https://api.test.com/users', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
        credentials: 'include',
        mode: 'cors'
      });

      // Assert
      expect(mockedFetchWithLog).toHaveBeenCalledWith(
        'https://api.test.com/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Test' }),
          credentials: 'include',
          mode: 'cors',
          headers: {
            'Authorization': `Bearer ${mockToken}`
          }
        })
      );
    });
  });

  describe('getDefaultHeaders', () => {
    it('ha de retornar headers amb Content-Type i Authorization per defecte', async () => {
      // Arrange
      const mockToken = 'test-token-123';
      mockedAuthService.getAuthToken = jest.fn().mockResolvedValue(mockToken);

      // Act
      const headers = await getDefaultHeaders();

      // Assert
      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}`
      });
      expect(mockedAuthService.getAuthToken).toHaveBeenCalled();
    });

    it('ha de retornar headers sense Authorization si includeAuth és false', async () => {
      // Act
      const headers = await getDefaultHeaders(false);

      // Assert
      expect(headers).toEqual({
        'Content-Type': 'application/json'
      });
      expect(mockedAuthService.getAuthToken).not.toHaveBeenCalled();
    });

    it('ha de retornar headers sense Authorization si el token és null', async () => {
      // Arrange
      mockedAuthService.getAuthToken = jest.fn().mockResolvedValue(null);

      // Act
      const headers = await getDefaultHeaders(true);

      // Assert
      expect(headers).toEqual({
        'Content-Type': 'application/json'
      });
      expect(mockedAuthService.getAuthToken).toHaveBeenCalled();
    });
  });

  describe('apiGet', () => {
    it('ha de fer una petició GET correctament', async () => {
      // Arrange
      const mockToken = 'test-token';
      mockedAuthService.getAuthToken = jest.fn().mockResolvedValue(mockToken);
      
      const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
        status: 200
      });
      mockedFetchWithLog.mockResolvedValue(mockResponse);

      // Act
      const response = await apiGet('https://api.test.com/users');

      // Assert
      expect(mockedFetchWithLog).toHaveBeenCalledWith(
        'https://api.test.com/users',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${mockToken}`
          }
        })
      );
      expect(response.status).toBe(200);
    });

    it('ha de passar opcions addicionals correctament', async () => {
      // Arrange
      const mockToken = 'test-token';
      mockedAuthService.getAuthToken = jest.fn().mockResolvedValue(mockToken);
      
      const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
        status: 200
      });
      mockedFetchWithLog.mockResolvedValue(mockResponse);

      // Act
      await apiGet('https://api.test.com/users', {
        skipAuth: false,
        headers: { 'X-Custom': 'value' }
      });

      // Assert
      expect(mockedFetchWithLog).toHaveBeenCalledWith(
        'https://api.test.com/users',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${mockToken}`,
            'X-Custom': 'value'
          }
        })
      );
    });
  });

  describe('apiPost', () => {
    it('ha de fer una petició POST amb body JSON', async () => {
      // Arrange
      const mockToken = 'test-token';
      mockedAuthService.getAuthToken = jest.fn().mockResolvedValue(mockToken);
      
      const mockResponse = new Response(JSON.stringify({ id: 1 }), {
        status: 201
      });
      mockedFetchWithLog.mockResolvedValue(mockResponse);

      const body = { name: 'Test User', email: 'test@example.com' };

      // Act
      const response = await apiPost('https://api.test.com/users', body);

      // Assert
      expect(mockedFetchWithLog).toHaveBeenCalledWith(
        'https://api.test.com/users',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`
          },
          body: JSON.stringify(body)
        })
      );
      expect(response.status).toBe(201);
    });

    it('ha de preservar headers personalitzats', async () => {
      // Arrange
      const mockToken = 'test-token';
      mockedAuthService.getAuthToken = jest.fn().mockResolvedValue(mockToken);
      
      const mockResponse = new Response(JSON.stringify({ id: 1 }), {
        status: 201
      });
      mockedFetchWithLog.mockResolvedValue(mockResponse);

      // Act
      await apiPost('https://api.test.com/users', { name: 'Test' }, {
        headers: { 'X-Custom': 'value' }
      });

      // Assert
      expect(mockedFetchWithLog).toHaveBeenCalledWith(
        'https://api.test.com/users',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'X-Custom': 'value',
            'Authorization': `Bearer ${mockToken}`
          }
        })
      );
    });
  });

  describe('apiPatch', () => {
    it('ha de fer una petició PATCH amb body JSON', async () => {
      // Arrange
      const mockToken = 'test-token';
      mockedAuthService.getAuthToken = jest.fn().mockResolvedValue(mockToken);
      
      const mockResponse = new Response(JSON.stringify({ updated: true }), {
        status: 200
      });
      mockedFetchWithLog.mockResolvedValue(mockResponse);

      const body = { name: 'Updated Name' };

      // Act
      const response = await apiPatch('https://api.test.com/users/1', body);

      // Assert
      expect(mockedFetchWithLog).toHaveBeenCalledWith(
        'https://api.test.com/users/1',
        expect.objectContaining({
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`
          },
          body: JSON.stringify(body)
        })
      );
      expect(response.status).toBe(200);
    });
  });

  describe('apiPut', () => {
    it('ha de fer una petició PUT amb body JSON', async () => {
      // Arrange
      const mockToken = 'test-token';
      mockedAuthService.getAuthToken = jest.fn().mockResolvedValue(mockToken);
      
      const mockResponse = new Response(JSON.stringify({ replaced: true }), {
        status: 200
      });
      mockedFetchWithLog.mockResolvedValue(mockResponse);

      const body = { name: 'Replaced Name', email: 'new@example.com' };

      // Act
      const response = await apiPut('https://api.test.com/users/1', body);

      // Assert
      expect(mockedFetchWithLog).toHaveBeenCalledWith(
        'https://api.test.com/users/1',
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`
          },
          body: JSON.stringify(body)
        })
      );
      expect(response.status).toBe(200);
    });
  });

  describe('apiDelete', () => {
    it('ha de fer una petició DELETE', async () => {
      // Arrange
      const mockToken = 'test-token';
      mockedAuthService.getAuthToken = jest.fn().mockResolvedValue(mockToken);
      
      const mockResponse = new Response(null, {
        status: 204
      });
      mockedFetchWithLog.mockResolvedValue(mockResponse);

      // Act
      const response = await apiDelete('https://api.test.com/users/1');

      // Assert
      expect(mockedFetchWithLog).toHaveBeenCalledWith(
        'https://api.test.com/users/1',
        expect.objectContaining({
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${mockToken}`
          }
        })
      );
      expect(response.status).toBe(204);
    });

    it('ha de passar opcions addicionals correctament', async () => {
      // Arrange
      const mockToken = 'test-token';
      mockedAuthService.getAuthToken = jest.fn().mockResolvedValue(mockToken);
      
      const mockResponse = new Response(null, {
        status: 204
      });
      mockedFetchWithLog.mockResolvedValue(mockResponse);

      // Act
      await apiDelete('https://api.test.com/users/1', {
        headers: { 'X-Reason': 'cleanup' }
      });

      // Assert
      expect(mockedFetchWithLog).toHaveBeenCalledWith(
        'https://api.test.com/users/1',
        expect.objectContaining({
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${mockToken}`,
            'X-Reason': 'cleanup'
          }
        })
      );
    });
  });

  describe('Escenaris d\'error i límits', () => {
    it('ha de propagar errors de xarxa', async () => {
      // Arrange
      const mockToken = 'test-token';
      mockedAuthService.getAuthToken = jest.fn().mockResolvedValue(mockToken);
      
      const networkError = new Error('Network request failed');
      mockedFetchWithLog.mockRejectedValue(networkError);

      // Act & Assert
      await expect(apiGet('https://api.test.com/users')).rejects.toThrow('Network request failed');
    });

    it('ha de gestionar respostes amb diferents codis d\'estat', async () => {
      // Arrange
      const mockToken = 'test-token';
      mockedAuthService.getAuthToken = jest.fn().mockResolvedValue(mockToken);

      // Test 404
      const response404 = new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404
      });
      mockedFetchWithLog.mockResolvedValueOnce(response404);

      const result404 = await apiGet('https://api.test.com/users/999');
      expect(result404.status).toBe(404);

      // Test 500
      const response500 = new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500
      });
      mockedFetchWithLog.mockResolvedValueOnce(response500);

      const result500 = await apiGet('https://api.test.com/users');
      expect(result500.status).toBe(500);

      // Test 403
      const response403 = new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403
      });
      mockedFetchWithLog.mockResolvedValueOnce(response403);

      const result403 = await apiGet('https://api.test.com/admin');
      expect(result403.status).toBe(403);
    });

    it('ha de gestionar body buit en POST', async () => {
      // Arrange
      const mockToken = 'test-token';
      mockedAuthService.getAuthToken = jest.fn().mockResolvedValue(mockToken);
      
      const mockResponse = new Response(JSON.stringify({ created: true }), {
        status: 201
      });
      mockedFetchWithLog.mockResolvedValue(mockResponse);

      // Act
      await apiPost('https://api.test.com/items', {});

      // Assert
      expect(mockedFetchWithLog).toHaveBeenCalledWith(
        'https://api.test.com/items',
        expect.objectContaining({
          body: '{}'
        })
      );
    });

    it('ha de gestionar body amb objectes complexos', async () => {
      // Arrange
      const mockToken = 'test-token';
      mockedAuthService.getAuthToken = jest.fn().mockResolvedValue(mockToken);
      
      const mockResponse = new Response(JSON.stringify({ created: true }), {
        status: 201
      });
      mockedFetchWithLog.mockResolvedValue(mockResponse);

      const complexBody = {
        user: {
          name: 'Test',
          nested: {
            value: 123,
            array: [1, 2, 3]
          }
        },
        metadata: {
          tags: ['tag1', 'tag2']
        }
      };

      // Act
      await apiPost('https://api.test.com/complex', complexBody);

      // Assert
      expect(mockedFetchWithLog).toHaveBeenCalledWith(
        'https://api.test.com/complex',
        expect.objectContaining({
          body: JSON.stringify(complexBody)
        })
      );
    });
  });
});
