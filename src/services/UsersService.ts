import { User } from '../models';
import { UserDTO } from './dto';
import { mapUserFromDTO } from './mappers';
import { fetchWithLog } from './fetchWithLog';

const API_BASE_URL = 'https://refugislliures-backend.onrender.com/api';

/**
 * Interfície per a les dades de creació d'un usuari
 */
export interface UserCreateData {
  username: string;
  email: string;
  idioma: string;
  avatar?: string;
}

/**
 * Interfície per a les dades d'actualització d'un usuari
 */
export interface UserUpdateData {
  username?: string;
  email?: string;
  avatar?: string;
  idioma?: string;
  refugis_favorits?: number[];
  refugis_visitats?: number[];
  reformes?: string[];
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
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Afegir token d'autenticació si està disponible
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetchWithLog(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(userData),
      });
      
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
      const headers: Record<string, string> = {};
      
      // Afegir token d'autenticació si està disponible
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetchWithLog(url, {
        headers: Object.keys(headers).length > 0 ? headers : undefined,
      });
      
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
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Afegir token d'autenticació si està disponible
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetchWithLog(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updateData),
      });
      
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
      const headers: Record<string, string> = {};
      
      // Afegir token d'autenticació si està disponible
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetchWithLog(url, {
        method: 'DELETE',
        headers: Object.keys(headers).length > 0 ? headers : undefined,
      });
      
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
}
