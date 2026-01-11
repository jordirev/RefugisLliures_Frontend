import { fetchWithLog } from './fetchWithLog';
import { AuthService } from './AuthService';

/**
 * Client HTTP amb gestió automàtica de tokens expirats
 * 
 * Aquest servei intercepta les respostes HTTP i detecta errors 401 (Unauthorized).
 * Quan detecta un token expirat:
 * 1. Refresca automàticament el token amb Firebase
 * 2. Reintenta la petició original amb el nou token
 * 3. Retorna la resposta exitosa o l'error si el refresc falla
 * 
 * Això millora l'experiència d'usuari evitant que hagin de tornar a fer login
 * quan el seu token expira durant l'ús de l'aplicació.
 */

interface ApiClientOptions extends RequestInit {
  skipAuth?: boolean; // Si true, no afegeix el header Authorization
  skipRetry?: boolean; // Si true, no reintenta en cas de 401
}

/**
 * Realitza una petició HTTP amb gestió automàtica de tokens
 * 
 * @param input - URL o Request object
 * @param options - Opcions de la petició (headers, method, body, etc.)
 * @returns Promise amb la resposta HTTP
 * 
 * @example
 * ```typescript
 * const response = await apiClient('https://api.example.com/users', {
 *   method: 'GET'
 * });
 * ```
 */
export async function apiClient(
  input: RequestInfo,
  options: ApiClientOptions = {}
): Promise<Response> {
  const { skipAuth = false, skipRetry = false, ...fetchOptions } = options;

  // Afegir token d'autenticació si no s'ha de saltar
  if (!skipAuth) {
    const token = await AuthService.getAuthToken();
    if (token) {
      fetchOptions.headers = {
        ...fetchOptions.headers,
        'Authorization': `Bearer ${token}`
      };
    }
  }

  // Fer la petició inicial
  let response = await fetchWithLog(input, fetchOptions);

  // Si la resposta és 401 i no s'ha de saltar el retry, intentar refrescar el token
  if (response.status === 401 && !skipRetry) {
    try {
      // Refrescar el token
      const newToken = await AuthService.getAuthToken(true); // forceRefresh = true
      
      if (newToken) {
        // Actualitzar el header amb el nou token
        fetchOptions.headers = {
          ...fetchOptions.headers,
          'Authorization': `Bearer ${newToken}`
        };
        
        // Reintentar la petició amb el nou token
        response = await fetchWithLog(input, fetchOptions);
      }
    } catch (error) {
      console.error('[apiClient] Error refrescant token:', error);
      // Retornar la resposta 401 original si el refresc falla
    }
  }

  return response;
}

/**
 * Crea headers estàndard per peticions JSON
 * 
 * @param includeAuth - Si s'ha d'incloure el token d'autenticació
 * @returns Promise amb els headers configurats
 */
export async function getDefaultHeaders(includeAuth: boolean = true): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = await AuthService.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

/**
 * Helper per fer peticions GET amb gestió automàtica de tokens
 */
export async function apiGet(url: string, options: ApiClientOptions = {}): Promise<Response> {
  return apiClient(url, {
    ...options,
    method: 'GET'
  });
}

/**
 * Helper per fer peticions POST amb gestió automàtica de tokens
 */
export async function apiPost(url: string, body: any, options: ApiClientOptions = {}): Promise<Response> {
  return apiClient(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: JSON.stringify(body)
  });
}

/**
 * Helper per fer peticions PATCH amb gestió automàtica de tokens
 */
export async function apiPatch(url: string, body: any, options: ApiClientOptions = {}): Promise<Response> {
  return apiClient(url, {
    ...options,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: JSON.stringify(body)
  });
}

/**
 * Helper per fer peticions PUT amb gestió automàtica de tokens
 */
export async function apiPut(url: string, body: any, options: ApiClientOptions = {}): Promise<Response> {
  return apiClient(url, {
    ...options,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    body: JSON.stringify(body)
  });
}

/**
 * Helper per fer peticions DELETE amb gestió automàtica de tokens
 */
export async function apiDelete(url: string, options: ApiClientOptions = {}): Promise<Response> {
  return apiClient(url, {
    ...options,
    method: 'DELETE'
  });
}
