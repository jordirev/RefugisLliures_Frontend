/**
 * Tests unitaris per fetchWithLog
 * 
 * Aquest fitxer cobreix:
 * - Logging de peticions HTTP (logApi)
 * - Wrapper de fetch amb logging automàtic (fetchWithLog)
 * - Gestió d'errors i timeouts
 * - Serialització de bodies de petició
 * - Logging de respostes (status, duration, errors)
 * - Gestió de global.__originalFetch
 * 
 * Escenaris d'èxit i límit per màxim coverage
 */

import { fetchWithLog, logApi } from '../../../services/fetchWithLog';

describe('fetchWithLog', () => {
  let originalFetch: typeof global.fetch;
  let consoleLogSpy: jest.SpyInstance;
  let dateNowSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    originalFetch = global.fetch;
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    dateNowSpy = jest.spyOn(Date, 'now');
    
    // Mock Date.now per tenir temps consistent
    let timeCounter = 1000;
    dateNowSpy.mockImplementation(() => {
      const current = timeCounter;
      timeCounter += 100; // Cada crida afegeix 100ms
      return current;
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    consoleLogSpy.mockRestore();
    dateNowSpy.mockRestore();
  });

  describe('logApi', () => {
    it('ha de fer log d\'una petició bàsica', () => {
      // Act
      logApi('GET', 'https://api.test.com/users');

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[API\] .+ GET https:\/\/api\.test\.com\/users/)
      );
    });

    it('ha de fer log amb informació extra com a string', () => {
      // Act
      logApi('POST', 'https://api.test.com/users', 'body={"name":"test"}');

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[API\] .+ POST https:\/\/api\.test\.com\/users body={"name":"test"}/)
      );
    });

    it('ha de fer log amb informació extra com a objecte', () => {
      // Act
      logApi('GET', 'https://api.test.com/users', { status: 200, duration: 150 });

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[API\] .+ GET https:\/\/api\.test\.com\/users {"status":200,"duration":150}/)
      );
    });

    it('ha de gestionar errors de serialització d\'informació extra', () => {
      // Arrange
      const circular: any = {};
      circular.self = circular; // Objecte circular

      // Act
      logApi('GET', 'https://api.test.com/users', circular);

      // Assert - No hauria de crashejar, simplement ignora l'extra
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[API\] .+ GET https:\/\/api\.test\.com\/users/)
      );
    });

    it('ha d\'incloure timestamp ISO en el log', () => {
      // Act
      logApi('GET', 'https://api.test.com/users');

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[API\] \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z GET/)
      );
    });

    it('ha de convertir el mètode a majúscules', () => {
      // Act
      logApi('get', 'https://api.test.com/users');

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/GET https:\/\/api\.test\.com\/users/)
      );
    });
  });

  describe('fetchWithLog - Peticions exitoses', () => {
    it('ha de fer fetch i fer log de petició i resposta exitosa', async () => {
      // Arrange
      const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' }
      });

      const mockFetch = jest.fn().mockResolvedValue(mockResponse);
      (global as any).__originalFetch = mockFetch;

      // Act
      const response = await fetchWithLog('https://api.test.com/users');

      // Assert
      expect(mockFetch).toHaveBeenCalledWith('https://api.test.com/users', undefined);
      expect(response.status).toBe(200);
      
      // Hauria de fer log de la petició i la resposta
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/GET https:\/\/api\.test\.com\/users$/)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/GET https:\/\/api\.test\.com\/users status=200 OK timeMs=100/)
      );
    });

    it('ha de fer log amb el mètode correcte quan s\'especifica', async () => {
      // Arrange
      const mockResponse = new Response(JSON.stringify({ created: true }), {
        status: 201,
        statusText: 'Created'
      });

      const mockFetch = jest.fn().mockResolvedValue(mockResponse);
      (global as any).__originalFetch = mockFetch;

      // Act
      await fetchWithLog('https://api.test.com/users', { method: 'POST' });

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/POST https:\/\/api\.test\.com\/users$/)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/POST https:\/\/api\.test\.com\/users status=201 Created/)
      );
    });

    // Tests for body logging removed - body logging was disabled for security reasons
    // to prevent sensitive data (JWT tokens, credentials) from being exposed in logs

    it('ha de mesurar el temps de la petició', async () => {
      // Arrange
      const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
        status: 200,
        statusText: 'OK'
      });

      const mockFetch = jest.fn().mockResolvedValue(mockResponse);
      (global as any).__originalFetch = mockFetch;

      // Act
      await fetchWithLog('https://api.test.com/users');

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/timeMs=100/)
      );
    });

    it('ha de gestionar respostes sense statusText', async () => {
      // Arrange
      const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
        status: 200,
        statusText: ''
      });

      const mockFetch = jest.fn().mockResolvedValue(mockResponse);
      (global as any).__originalFetch = mockFetch;

      // Act
      await fetchWithLog('https://api.test.com/users');

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/status=200 timeMs=100/)
      );
    });

    it('ha de funcionar amb Request object en lloc de string', async () => {
      // Arrange
      const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
        status: 200
      });

      const mockFetch = jest.fn().mockResolvedValue(mockResponse);
      (global as any).__originalFetch = mockFetch;

      const request = new Request('https://api.test.com/users', {
        method: 'GET'
      });

      // Act
      await fetchWithLog(request);

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/GET https:\/\/api\.test\.com\/users/)
      );
    });
  });

  describe('fetchWithLog - Respostes amb error', () => {
    it('ha de fer log del body d\'error quan la resposta no és ok', async () => {
      // Arrange
      const errorBody = JSON.stringify({ error: 'User not found' });
      const mockResponse = new Response(errorBody, {
        status: 404,
        statusText: 'Not Found'
      });

      const mockFetch = jest.fn().mockResolvedValue(mockResponse);
      (global as any).__originalFetch = mockFetch;

      // Act
      await fetchWithLog('https://api.test.com/users/999');

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/status=404 Not Found.*error=.*User not found/)
      );
    });

    it('ha de truncar bodies d\'error llargs', async () => {
      // Arrange
      const longError = 'A'.repeat(400);
      const mockResponse = new Response(longError, {
        status: 500,
        statusText: 'Internal Server Error'
      });

      const mockFetch = jest.fn().mockResolvedValue(mockResponse);
      (global as any).__originalFetch = mockFetch;

      // Act
      await fetchWithLog('https://api.test.com/users');

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/error="A{300}\.\.\./)
      );
    });

    it('ha de gestionar errors de lectura del body', async () => {
      // Arrange
      const mockResponse = {
        status: 500,
        statusText: 'Internal Server Error',
        ok: false,
        clone: jest.fn().mockReturnValue({
          text: jest.fn().mockRejectedValue(new Error('Cannot read body'))
        })
      };

      const mockFetch = jest.fn().mockResolvedValue(mockResponse);
      (global as any).__originalFetch = mockFetch;

      // Act
      const response = await fetchWithLog('https://api.test.com/users');

      // Assert
      expect(response.status).toBe(500);
      // Hauria de fer log sense el body d'error
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/status=500 Internal Server Error timeMs=100$/)
      );
    });

    it('ha de gestionar respostes sense clone()', async () => {
      // Arrange
      const mockResponse = {
        status: 500,
        statusText: 'Internal Server Error',
        ok: false,
        clone: undefined,
        text: jest.fn().mockResolvedValue('Error text')
      };

      const mockFetch = jest.fn().mockResolvedValue(mockResponse);
      (global as any).__originalFetch = mockFetch;

      // Act
      await fetchWithLog('https://api.test.com/users');

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/status=500 Internal Server Error/)
      );
    });

    it('ha de netejar salts de línia en els errors', async () => {
      // Arrange
      const errorWithNewlines = 'Error:\nLine 1\nLine 2\nLine 3';
      const mockResponse = new Response(errorWithNewlines, {
        status: 400,
        statusText: 'Bad Request'
      });

      const mockFetch = jest.fn().mockResolvedValue(mockResponse);
      (global as any).__originalFetch = mockFetch;

      // Act
      await fetchWithLog('https://api.test.com/users');

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/error="Error: Line 1 Line 2 Line 3"/)
      );
    });
  });

  describe('fetchWithLog - Errors de xarxa', () => {
    it('ha de gestionar errors de xarxa i fer log', async () => {
      // Arrange
      const networkError = new Error('Network request failed');
      const mockFetch = jest.fn().mockRejectedValue(networkError);
      (global as any).__originalFetch = mockFetch;

      // Act & Assert
      await expect(fetchWithLog('https://api.test.com/users')).rejects.toThrow('Network request failed');
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/GET https:\/\/api\.test\.com\/users ERROR timeMs=100 message="Network request failed"/)
      );
    });

    it('ha de gestionar errors sense missatge', async () => {
      // Arrange
      const error = { toString: () => 'Unknown error' };
      const mockFetch = jest.fn().mockRejectedValue(error);
      (global as any).__originalFetch = mockFetch;

      // Act & Assert
      await expect(fetchWithLog('https://api.test.com/users')).rejects.toEqual(error);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/ERROR.*message="Unknown error"/)
      );
    });

    it('ha de gestionar timeouts', async () => {
      // Arrange
      const timeoutError = new Error('Request timeout');
      const mockFetch = jest.fn().mockRejectedValue(timeoutError);
      (global as any).__originalFetch = mockFetch;

      // Act & Assert
      await expect(fetchWithLog('https://api.test.com/users')).rejects.toThrow('Request timeout');
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/ERROR.*message="Request timeout"/)
      );
    });
  });

  describe('fetchWithLog - Gestió de global fetch', () => {
    it('ha d\'utilitzar __originalFetch si està disponible', async () => {
      // Arrange
      const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
        status: 200
      });

      const mockOriginalFetch = jest.fn().mockResolvedValue(mockResponse);
      const mockGlobalFetch = jest.fn();
      
      (global as any).__originalFetch = mockOriginalFetch;
      global.fetch = mockGlobalFetch;

      // Act
      await fetchWithLog('https://api.test.com/users');

      // Assert
      expect(mockOriginalFetch).toHaveBeenCalled();
      expect(mockGlobalFetch).not.toHaveBeenCalled();
    });

    it('ha d\'utilitzar global.fetch si __originalFetch no està disponible', async () => {
      // Arrange
      const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
        status: 200
      });

      const mockGlobalFetch = jest.fn().mockResolvedValue(mockResponse);
      
      delete (global as any).__originalFetch;
      global.fetch = mockGlobalFetch;

      // Act
      await fetchWithLog('https://api.test.com/users');

      // Assert
      expect(mockGlobalFetch).toHaveBeenCalled();
    });

    it('no ha d\'utilitzar __originalFetch si és igual a fetchWithLog (evitar recursió)', async () => {
      // Arrange
      const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
        status: 200
      });

      const mockGlobalFetch = jest.fn().mockResolvedValue(mockResponse);
      
      (global as any).__originalFetch = fetchWithLog; // Igual a si mateix
      global.fetch = mockGlobalFetch;

      // Act
      await fetchWithLog('https://api.test.com/users');

      // Assert
      expect(mockGlobalFetch).toHaveBeenCalled();
    });

    it('ha de passar els paràmetres correctament a la implementació de fetch', async () => {
      // Arrange
      const mockResponse = new Response(JSON.stringify({ created: true }), {
        status: 201
      });

      const mockFetch = jest.fn().mockResolvedValue(mockResponse);
      (global as any).__originalFetch = mockFetch;

      const init: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token'
        },
        body: JSON.stringify({ name: 'Test' })
      };

      // Act
      await fetchWithLog('https://api.test.com/users', init);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/users',
        init
      );
    });
  });

  describe('fetchWithLog - Escenaris límit', () => {
    it('ha de gestionar URLs molt llargues', async () => {
      // Arrange
      const longUrl = 'https://api.test.com/users?param=' + 'a'.repeat(1000);
      const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
        status: 200
      });

      const mockFetch = jest.fn().mockResolvedValue(mockResponse);
      (global as any).__originalFetch = mockFetch;

      // Act
      await fetchWithLog(longUrl);

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(longUrl)
      );
    });

    it('ha de gestionar diferents mètodes HTTP', async () => {
      // Arrange
      const mockResponse = new Response(null, { status: 204 });
      const mockFetch = jest.fn().mockResolvedValue(mockResponse);
      (global as any).__originalFetch = mockFetch;

      const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];

      // Act & Assert
      for (const method of methods) {
        await fetchWithLog('https://api.test.com/users', { method });
        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringMatching(new RegExp(method))
        );
      }
    });

    // Test for body logging removed - body logging was disabled for security reasons

    it('ha de gestionar respostes sense body', async () => {
      // Arrange
      const mockResponse = new Response(null, {
        status: 204,
        statusText: 'No Content'
      });

      const mockFetch = jest.fn().mockResolvedValue(mockResponse);
      (global as any).__originalFetch = mockFetch;

      // Act
      await fetchWithLog('https://api.test.com/users/1', { method: 'DELETE' });

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/status=204 No Content timeMs=100$/)
      );
    });

    it('ha de gestionar peticions amb credentials i mode', async () => {
      // Arrange
      const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
        status: 200
      });

      const mockFetch = jest.fn().mockResolvedValue(mockResponse);
      (global as any).__originalFetch = mockFetch;

      // Act
      await fetchWithLog('https://api.test.com/users', {
        method: 'GET',
        credentials: 'include',
        mode: 'cors'
      });

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/users',
        expect.objectContaining({
          credentials: 'include',
          mode: 'cors'
        })
      );
    });

    it('ha de gestionar múltiples peticions simultànies', async () => {
      // Arrange
      const mockResponse1 = new Response(JSON.stringify({ id: 1 }), { status: 200 });
      const mockResponse2 = new Response(JSON.stringify({ id: 2 }), { status: 200 });
      const mockResponse3 = new Response(JSON.stringify({ id: 3 }), { status: 200 });

      const mockFetch = jest.fn()
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2)
        .mockResolvedValueOnce(mockResponse3);

      (global as any).__originalFetch = mockFetch;

      // Act
      const promises = [
        fetchWithLog('https://api.test.com/users/1'),
        fetchWithLog('https://api.test.com/users/2'),
        fetchWithLog('https://api.test.com/users/3')
      ];

      await Promise.all(promises);

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(consoleLogSpy).toHaveBeenCalledTimes(6); // 3 request logs + 3 response logs
    });
  });
});
