import { User, Location, AvatarMetadata } from '../models';
import { UserRefugiInfoResponseDTO, UserDTO } from './dto';
import { mapperUserRefugiInfoDTO, mapperUserRefugiInfoResponseDTO, mapUserFromDTO } from './mappers';
import { apiGet, apiPost, apiPatch, apiDelete, apiClient } from './apiClient';
import { ApiError, readJsonSafe } from './apiErrors';

const API_BASE_URL = 'https://refugislliures-backend.onrender.com/api';

/**
 * Interfície per a les dades de creació d'un usuari
 */
export interface UserCreateData {
  username: string;
  email: string;
  language: string;
  avatar?: string;
  /** Data de naixement (YYYY-MM-DD). El backend NO la desa: només age_confirmed_at */
  birth_date?: string;
}

/**
 * Interfície per a les dades d'actualització d'un usuari
 */
export interface UserUpdateData {
  username?: string;
  email?: string;
  avatar?: string;
  language?: string;
  favourite_refuges?: number[];
  visited_refuges?: number[];
  renovations?: string[];
}

/**
 * Servei per gestionar les crides relacionades amb usuaris
 */
export class UsersService {
  /**
   * Crea un nou usuari
   * POST /users/
   * 
   * @param userData - Dades de l'usuari a crear
   * @param authToken - Token d'autenticació de Firebase (opcional)
   * @returns L'usuari creat o null si hi ha error
   * @throws ApiError amb codi `underage` (403) si l'usuari té menys de 16 anys
   */
  static async createUser(userData: UserCreateData, authToken?: string): Promise<User | null> {
    try {
      const url = `${API_BASE_URL}/users/`;
      
      // Utilitzar apiPost que gestiona automàticament el refresc de tokens
      const response = await apiPost(url, userData);
      
      if (!response.ok) {
        const errorData = await readJsonSafe(response);
        console.error('Error creating user:', errorData);
        if (response.status === 403) {
          // L'únic 403 del registre és l'edat mínima (contracte: 403 underage)
          throw new ApiError('Edat inferior a la mínima', 'underage', 403, errorData);
        }
        return null;
      }
      
      const data: UserDTO = await response.json();
      return mapUserFromDTO(data);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      console.error('Error creating user:', err);
      return null;
    }
  }

  /**
   * Confirma l'edat mínima d'un usuari existent (usuaris antics i de Google).
   * PATCH /api/users/{uid}/age-confirmation/  {birth_date}
   * El backend desa només age_confirmed_at i age_threshold (minimització).
   *
   * @throws ApiError amb codi `underage` (403) o `unknown`
   */
  static async confirmAge(uid: string, birthDate: string): Promise<User | null> {
    const url = `${API_BASE_URL}/users/${encodeURIComponent(uid)}/age-confirmation/`;
    const response = await apiPatch(url, { birth_date: birthDate });
    if (response.ok) {
      // 200 → usuari serialitzat amb age_confirmed: true
      const user = await readJsonSafe(response);
      return user && typeof user === 'object' && user.uid ? mapUserFromDTO(user as UserDTO) : null;
    }
    const data = await readJsonSafe(response);
    if (response.status === 403) {
      throw new ApiError('Edat inferior a la mínima', 'underage', 403, data);
    }
    throw new ApiError(
      (data && (data.error || data.detail)) || 'No s\'ha pogut confirmar l\'edat',
      response.status === 400 ? 'validation' : 'unknown',
      response.status,
      data
    );
  }

  /**
   * Obté un usuari per UID
   * GET /users/{uid}/
   * 
   * @param uid - UID de l'usuari
   * @param authToken - Token d'autenticació de Firebase (opcional)
   * @returns L'usuari o null si no es troba
   */
  static async getUserByUid(uid: string, authToken?: string): Promise<User | null> {
    try {
      const url = `${API_BASE_URL}/users/${uid}/`;
      
      // Utilitzar apiGet que gestiona automàticament el refresc de tokens
      const response = await apiGet(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log(`User with uid ${uid} not found`);
        } else {
          console.error(`Error fetching user ${uid}:`, response.statusText);
        }
        return null;
      }
      
      const data: UserDTO = await response.json();
      return mapUserFromDTO(data);
    } catch (err) {
      console.error(`Error fetching user ${uid}:`, err);
      return null;
    }
  }

  /**
   * Actualitza les dades d'un usuari
   * PUT /users/{uid}/
   * 
   * @param uid - UID de l'usuari
   * @param updateData - Dades a actualitzar
   * @param authToken - Token d'autenticació de Firebase (opcional)
   * @returns L'usuari actualitzat o null si hi ha error
   */
  static async updateUser(uid: string, updateData: UserUpdateData, authToken?: string): Promise<User | null> {
    try {
      const url = `${API_BASE_URL}/users/${uid}/`;
      
      // Utilitzar apiPatch que gestiona automàticament el refresc de tokens
      const response = await apiPatch(url, updateData);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Error updating user ${uid}:`, errorData);
        return null;
      }
      
      const data: UserDTO = await response.json();
      return mapUserFromDTO(data);
    } catch (err) {
      console.error(`Error updating user ${uid}:`, err);
      return null;
    }
  }

  /**
   * Elimina un usuari
   * DELETE /users/{uid}/
   * 
   * @param uid - UID de l'usuari
   * @param authToken - Token d'autenticació de Firebase (opcional)
   * @returns true si s'ha eliminat correctament, false altrament
   */
  static async deleteUser(uid: string, authToken?: string): Promise<boolean> {
    try {
      const url = `${API_BASE_URL}/users/${uid}/`;
      
      // Utilitzar apiDelete que gestiona automàticament el refresc de tokens
      const response = await apiDelete(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.error(`User with uid ${uid} not found`);
        } else {
          const errorData = await response.json();
          console.error(`Error deleting user ${uid}:`, errorData);
        }
        return false;
      }
      
      return true;
    } catch (err) {
      console.error(`Error deleting user ${uid}:`, err);
      return false;
    }
  }

  /**
   * Obté la informació dels refugis preferits de l'usuari
   * GET /users/{uid}/favorite-refuges/
   * 
   * @param uid - UID de l'usuari
   * @param authToken - Token d'autenticació de Firebase (opcional)
   * @returns Un llistat amb els refugis preferits o null si hi ha error
   */
  static async getFavouriteRefuges(uid: string, authToken?: string): Promise<Location[] | null> {
    try {
      const url = `${API_BASE_URL}/users/${uid}/favorite-refuges/`;
      
      const response = await apiGet(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error fetching favourite refuges:', errorData);
        return null;
      }
      
      const data = await response.json();
      console.log('getFavouriteRefuges response:', data);
      
      // Backend returns {count, results: []}
      if (!data || !data.results || !Array.isArray(data.results)) {
        console.warn('Invalid favourite refuges response');
        return [];
      }
      
      return mapperUserRefugiInfoResponseDTO(data.results);
    } catch (err) {
      console.error('Error fetching favourite refuges:', err);
      return null;
    }
  }

  /**
   * Afegeix un refugi als preferits de l'usuari
   * POST /users/{uid}/favorite-refuges/
   * 
   * @param uid - UID de l'usuari
   * @param refuge_id - ID del refugi a afegir als preferits
   * @param authToken - Token d'autenticació de Firebase (opcional)
   * @returns El refugi afegit o null si hi ha error
   */
  static async addFavouriteRefuge(uid: string, refuge_id: string, authToken?: string): Promise<Location | null> {
    try {
      const url = `${API_BASE_URL}/users/${uid}/favorite-refuges/`;
      
      const response = await apiPost(url, { refuge_id });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error adding favourite refuge:', errorData);
        return null;
      }
      
      const data = await response.json();
      console.log('addFavouriteRefuge response:', data);
      
      if (!data) {
        console.warn('Invalid add favourite refuge response');
        return null;
      }

      return mapperUserRefugiInfoDTO(data);
    } catch (err) {
      console.error('Error adding favourite refuge:', err);
      return null;
    }
  }

  /**
   * Elimina un refugi dels preferits de l'usuari
   * DELETE /users/{uid}/favorite-refuges/{refuge_id}/
   * 
   * @param uid - UID de l'usuari
   * @param refuge_id - ID del refugi a eliminar dels preferits
   * @param authToken - Token d'autenticació de Firebase (opcional)
   * @returns true si s'ha eliminat correctament, false altrament
   */
  static async removeFavouriteRefuge(uid: string, refuge_id: string, authToken?: string): Promise<boolean> {
    try {
      const url = `${API_BASE_URL}/users/${uid}/favorite-refuges/${refuge_id}/`;
      
      const response = await apiDelete(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error removing favourite refuge:', errorData);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error removing favourite refuge:', err);
      return false;
    }
  }

  /**
   * Obté la informació dels refugis visitats de l'usuari
   * GET /users/{uid}/visited-refuges/
   * 
   * @param uid - UID de l'usuari
   * @param authToken - Token d'autenticació de Firebase (opcional)
   * @returns Un llistat amb els refugis visitats o null si hi ha error
   */
  static async getVisitedRefuges(uid: string, authToken?: string): Promise<Location[] | null> {
    try {
      const url = `${API_BASE_URL}/users/${uid}/visited-refuges/`;
      
      const response = await apiGet(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error fetching visited refuges:', errorData);
        return null;
      }
      
      const data = await response.json();
      console.log('getVisitedRefuges response:', data);
      
      // Backend returns {count, results: []}
      if (!data || !data.results || !Array.isArray(data.results)) {
        console.warn('Invalid visited refuges response');
        return [];
      }
      
      return mapperUserRefugiInfoResponseDTO(data.results);
    } catch (err) {
      console.error('Error fetching visited refuges:', err);
      return null;
    }
  }

  /**
   * Afegeix un refugi als visitats de l'usuari
   * POST /users/{uid}/visited-refuges/
   * 
   * @param uid - UID de l'usuari
   * @param refuge_id - ID del refugi a afegir als visitats
   * @param authToken - Token d'autenticació de Firebase (opcional)
   * @returns El refugi afegit o null si hi ha error
   */
  static async addVisitedRefuge(uid: string, refuge_id: string, authToken?: string): Promise<Location | null> {
    try {
      const url = `${API_BASE_URL}/users/${uid}/visited-refuges/`;
      
      const response = await apiPost(url, { refuge_id });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error adding visited refuge:', errorData);
        return null;
      }
      
      const data = await response.json();
      console.log('addVisitedRefuge response:', data);
      
      if (!data) {
        console.warn('Invalid add visited refuge response');
        return null;
      }

      return mapperUserRefugiInfoDTO(data);
    } catch (err) {
      console.error('Error adding visited refuge:', err);
      return null;
    }
  }

  /**
   * Elimina un refugi dels visitats de l'usuari
   * DELETE /users/{uid}/visited-refuges/{refuge_id}/
   * 
   * @param uid - UID de l'usuari
   * @param refuge_id - ID del refugi a eliminar dels visitats
   * @param authToken - Token d'autenticació de Firebase (opcional)
   * @returns true si s'ha eliminat correctament o false si hi ha error
   */
  static async removeVisitedRefuge(uid: string, refuge_id: string, authToken?: string): Promise<boolean> {
    try {
      const url = `${API_BASE_URL}/users/${uid}/visited-refuges/${refuge_id}/`;
      
      const response = await apiDelete(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error removing visited refuge:', errorData);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error removing visited refuge:', err);
      return false;
    }
  }

  // La pujada de l'avatar es fa amb URL PUT prefirmada (MediaUploadService,
  // target=avatar) des de useMediaUpload; l'antic PATCH multipart /avatar/ ja no s'usa.

  /**
   * Elimina l'avatar d'un usuari
   * DELETE /users/{uid}/avatar/
   * 
   * @param uid - UID de l'usuari
   * @returns true si s'ha eliminat correctament
   * @throws Error amb missatge descriptiu en cas d'error
   */
  static async deleteAvatar(uid: string): Promise<boolean> {
    try {
      const url = `${API_BASE_URL}/users/${uid}/avatar/`;
      
      const response = await apiDelete(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: `Error ${response.status}: ${response.statusText}` 
        }));
        
        if (response.status === 401) {
          throw new Error('No estàs autenticat. Si us plau, inicia sessió.');
        } else if (response.status === 403) {
          throw new Error('No tens permisos per eliminar aquest avatar. Només el mateix usuari pot fer-ho.');
        } else if (response.status === 404) {
          throw new Error('Avatar no trobat o l\'usuari no té cap avatar');
        } else if (response.status === 500) {
          throw new Error('Error del servidor. Si us plau, intenta-ho més tard.');
        }
        
        throw new Error(errorData.error || 'No s\'ha pogut eliminar l\'avatar');
      }
      
      return true;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      console.error('Error deleting avatar:', error);
      throw new Error('No s\'ha pogut eliminar l\'avatar');
    }
  }
}
