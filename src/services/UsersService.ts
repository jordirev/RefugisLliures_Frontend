import { User } from '../models';
import { UserDTO } from './dto';
import { mapUserFromDTO } from './mappers';
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
   * Afegeix un refugi al preferits de l'usuari
   * POST /users/
   * 
   * @param uid - UID de l'usuari
   * @param refuge_id - ID del refugi a afegir als preferits
   * @param authToken - Token d'autenticació de Firebase (opcional)
   * @returns Un llistat amb els refugis preferits o null si hi ha error
   */
  static async addRefugeFavourite(uid: string, refuge_id: string, authToken?: string): Promise<User | null> {
    try {
      const url = `${API_BASE_URL}/users/${uid}/favourites/`;
      
      // Utilitzar apiPost que gestiona automàticament el refresc de tokens
      const response = await apiPost(url, { refuge_id });
      
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
}
