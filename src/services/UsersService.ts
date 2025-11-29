import { User, Location } from '../models';
import { UserRefugiInfoResponseDTO, UserDTO } from './dto';
import { mapperUserRefugiInfoResponseDTO, mapUserFromDTO } from './mappers';
import { apiGet, apiPost, apiPatch, apiDelete } from './apiClient';

const API_BASE_URL = 'https://refugislliures-backend.onrender.com/api';

/**
 * Interfície per a les dades de creació d'un usuari
 */
export interface UserCreateData {
  username: string;
  email: string;
  language: string;
  avatar?: string;
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
   */
  static async createUser(userData: UserCreateData, authToken?: string): Promise<User | null> {
    try {
      const url = `${API_BASE_URL}/users/`;
      
      // Utilitzar apiPost que gestiona automàticament el refresc de tokens
      const response = await apiPost(url, userData);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error creating user:', errorData);
        return null;
      }
      
      const data: UserDTO = await response.json();
      return mapUserFromDTO(data);
    } catch (err) {
      console.error('Error creating user:', err);
      return null;
    }
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
   * @returns Un llistat amb els refugis preferits actualitzats o null si hi ha error
   */
  static async addFavouriteRefuge(uid: string, refuge_id: string, authToken?: string): Promise<Location[] | null> {
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
      
      // Backend may return either a direct array or an object with {count, results: []}
      const items = Array.isArray(data) ? data : (data && Array.isArray(data.results) ? data.results : null);
      if (!items) {
        console.warn('Invalid add favourite refuge response');
        return [];
      }

      return mapperUserRefugiInfoResponseDTO(items);
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
   * @returns Un llistat amb els refugis preferits actualitzats o null si hi ha error
   */
  static async removeFavouriteRefuge(uid: string, refuge_id: string, authToken?: string): Promise<Location[] | null> {
    try {
      const url = `${API_BASE_URL}/users/${uid}/favorite-refuges/${refuge_id}/`;
      
      const response = await apiDelete(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error removing favourite refuge:', errorData);
        return null;
      }
      
      const data = await response.json();
      console.log('removeFavouriteRefuge response:', data);
      
      // Backend may return either a direct array or an object with {count, results: []}
      const items = Array.isArray(data) ? data : (data && Array.isArray(data.results) ? data.results : null);
      if (!items) {
        console.warn('Invalid remove favourite refuge response');
        return [];
      }

      return mapperUserRefugiInfoResponseDTO(items);
    } catch (err) {
      console.error('Error removing favourite refuge:', err);
      return null;
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
   * @returns Un llistat amb els refugis visitats actualitzats o null si hi ha error
   */
  static async addVisitedRefuge(uid: string, refuge_id: number, authToken?: string): Promise<Location[] | null> {
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
      
      // Backend may return either a direct array or an object with {count, results: []}
      const items = Array.isArray(data) ? data : (data && Array.isArray(data.results) ? data.results : null);
      if (!items) {
        console.warn('Invalid add visited refuge response');
        return [];
      }

      return mapperUserRefugiInfoResponseDTO(items);
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
   * @returns Un llistat amb els refugis visitats actualitzats o null si hi ha error
   */
  static async removeVisitedRefuge(uid: string, refuge_id: number, authToken?: string): Promise<Location[] | null> {
    try {
      const url = `${API_BASE_URL}/users/${uid}/visited-refuges/${refuge_id}/`;
      
      const response = await apiDelete(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error removing visited refuge:', errorData);
        return null;
      }
      
      const data = await response.json();
      console.log('removeVisitedRefuge response:', data);
      
      // Backend may return either a direct array or an object with {count, results: []}
      const items = Array.isArray(data) ? data : (data && Array.isArray(data.results) ? data.results : null);
      if (!items) {
        console.warn('Invalid remove visited refuge response');
        return [];
      }

      return mapperUserRefugiInfoResponseDTO(items);
    } catch (err) {
      console.error('Error removing visited refuge:', err);
      return null;
    }
  }
}
