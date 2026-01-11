import { User, Location, AvatarMetadata } from '../models';
import { UserRefugiInfoResponseDTO, UserDTO } from './dto';
import { mapperUserRefugiInfoDTO, mapperUserRefugiInfoResponseDTO, mapUserFromDTO } from './mappers';
import { apiGet, apiPost, apiPatch, apiDelete, apiClient } from './apiClient';

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

  /**
   * Puja o actualitza l'avatar d'un usuari
   * PATCH /users/{uid}/avatar/
   * 
   * Formats acceptats: JPEG, JPG, PNG, WebP, HEIC, HEIF
   * 
   * @param uid - UID de l'usuari
   * @param file - Fitxer d'imatge de l'avatar (File object)
   * @returns Metadades de l'avatar pujat o null si hi ha error
   * @throws Error amb missatge descriptiu en cas d'error
   */
  static async uploadAvatar(uid: string, file: File): Promise<AvatarMetadata> {
    try {
      if (!file) {
        throw new Error('No s\'ha proporcionat cap fitxer');
      }

      const url = `${API_BASE_URL}/users/${uid}/avatar/`;
      
      // Crear FormData per enviar el fitxer
      const formData = new FormData();
      formData.append('file', file);

      // Fer la petició amb FormData (no afegir Content-Type, el navegador ho farà automàticament)
      const response = await apiClient(url, {
        method: 'PATCH',
        body: formData
        // No afegir headers Content-Type per deixar que el navegador estableixi el boundary correcte
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: `Error ${response.status}: ${response.statusText}` 
        }));
        
        if (response.status === 400) {
          throw new Error(errorData.error || 'Fitxer invàlid o format no acceptat');
        } else if (response.status === 401) {
          throw new Error('No estàs autenticat. Si us plau, inicia sessió.');
        } else if (response.status === 403) {
          throw new Error('No tens permisos per modificar aquest avatar. Només el mateix usuari pot fer-ho.');
        } else if (response.status === 404) {
          throw new Error('Usuari no trobat');
        } else if (response.status === 500) {
          throw new Error('Error del servidor. Si us plau, intenta-ho més tard.');
        }
        
        throw new Error(errorData.error || 'No s\'ha pogut pujar l\'avatar');
      }
      
      const avatarMetadata: AvatarMetadata = await response.json();
      return avatarMetadata;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      console.error('Error uploading avatar:', error);
      throw new Error('No s\'ha pogut pujar l\'avatar');
    }
  }

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
