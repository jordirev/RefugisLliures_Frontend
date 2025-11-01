import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  FirebaseUser
} from './firebase';

// Re-exportar el tipus FirebaseUser perquè estigui disponible per altres mòduls
export type { FirebaseUser };
import { UsersService, UserCreateData } from './UsersService';

export interface SignUpData {
  email: string;
  password: string;
  username: string;
  language: string;
}

export interface LoginData {
  email: string;
  password: string;
}

/**
 * Servei d'autenticació que integra Firebase Auth amb el backend
 */
export class AuthService {
  /**
   * Registra un nou usuari amb Firebase i el crea al backend
   * 
   * @param signUpData - Dades per registrar-se
   * @returns L'usuari de Firebase creat
   */
  static async signUp(signUpData: SignUpData): Promise<FirebaseUser> {
    try {
      // 1. Crear usuari a Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        signUpData.email,
        signUpData.password
      );

      const firebaseUser = userCredential.user;

      // 2. Actualitzar el perfil de Firebase amb el nom d'usuari
      await updateProfile(firebaseUser, {
        displayName: signUpData.username
      });

      // 3. Enviar email de verificació
      await sendEmailVerification(firebaseUser);
      console.log('Email de verificació enviat a:', signUpData.email);

      // 4. Obtenir el token d'autenticació
      const token = await firebaseUser.getIdToken();

      // 5. Crear l'usuari al backend
      const userData: UserCreateData = {
        username: signUpData.username,
        email: signUpData.email,
        idioma: signUpData.language,
      };

      const backendUser = await UsersService.createUser(userData, token);

      if (!backendUser) {
        // Si falla la creació al backend, eliminem l'usuari de Firebase
        await firebaseUser.delete();
        throw new Error('Error creant l\'usuari al backend');
      }

      console.log('Usuari creat correctament:', {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName
      });

      return firebaseUser;
    } catch (error: any) {
      console.error('Error durant el registre:', error);
      throw error;
    }
  }

  /**
   * Inicia sessió amb email i contrasenya
   * 
   * @param loginData - Dades per iniciar sessió
   * @returns L'usuari de Firebase autenticat
   */
  static async login(loginData: LoginData): Promise<FirebaseUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        loginData.email,
        loginData.password
      );

      const firebaseUser = userCredential.user;

      console.log('Usuari autenticat:', {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        emailVerified: firebaseUser.emailVerified
      });

      return firebaseUser;
    } catch (error: any) {
      console.error('Error durant el login:', error);
      throw error;
    }
  }

  /**
   * Tanca la sessió de l'usuari actual
   */
  static async logout(): Promise<void> {
    try {
      await signOut(auth);
      console.log('Sessió tancada correctament');
    } catch (error: any) {
      console.error('Error tancant sessió:', error);
      throw error;
    }
  }

  /**
   * Envia un email per recuperar la contrasenya
   * 
   * @param email - Email de l'usuari
   */
  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('Email de recuperació enviat a:', email);
    } catch (error: any) {
      console.error('Error enviant email de recuperació:', error);
      throw error;
    }
  }

  /**
   * Reenvia l'email de verificació a l'usuari actual
   */
  static async resendVerificationEmail(): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No hi ha cap usuari autenticat');
      }

      if (user.emailVerified) {
        throw new Error('L\'email ja està verificat');
      }

      await sendEmailVerification(user);
      console.log('Email de verificació reenviat a:', user.email);
    } catch (error: any) {
      console.error('Error reenviant email de verificació:', error);
      throw error;
    }
  }

  /**
   * Obté el token d'autenticació de l'usuari actual
   * 
   * @param forceRefresh - Si cal forçar la renovació del token
   * @returns El token d'autenticació o null si no hi ha usuari
   */
  static async getAuthToken(forceRefresh: boolean = false): Promise<string | null> {
    try {
      const user = auth.currentUser;
      if (!user) {
        return null;
      }

      const token = await user.getIdToken(forceRefresh);
      return token;
    } catch (error: any) {
      console.error('Error obtenint token d\'autenticació:', error);
      return null;
    }
  }

  /**
   * Obté l'usuari actual de Firebase
   * 
   * @returns L'usuari de Firebase o null si no hi ha sessió activa
   */
  static getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  /**
   * Subscriu a canvis en l'estat d'autenticació
   * 
   * @param callback - Funció que s'executarà quan canviï l'estat
   * @returns Funció per cancel·lar la subscripció
   */
  static onAuthStateChange(callback: (user: FirebaseUser | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Recarrega la informació de l'usuari actual (per verificar l'email)
   */
  static async reloadUser(): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No hi ha cap usuari autenticat');
      }

      await user.reload();
      console.log('Informació d\'usuari recarregada. Email verificat:', user.emailVerified);
    } catch (error: any) {
      console.error('Error recarregant informació d\'usuari:', error);
      throw error;
    }
  }

  /**
   * Elimina el compte de l'usuari actual
   * Elimina l'usuari tant del backend com de Firebase Auth
   */
  static async deleteAccount(): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No hi ha cap usuari autenticat');
      }

      // 1. Obtenir el token d'autenticació
      const token = await user.getIdToken();

      // 2. Eliminar l'usuari del backend primer
      const backendDeleted = await UsersService.deleteUser(user.uid, token);
      if (!backendDeleted) {
        console.warn('No s\'ha pogut eliminar l\'usuari del backend, continuant amb Firebase...');
      }

      // 3. Eliminar l'usuari de Firebase Auth
      // Firebase automàticament envia un email de confirmació de tancament de compte
      await user.delete();
      
      console.log('Compte eliminat correctament de Firebase i del backend');
    } catch (error: any) {
      console.error('Error eliminant compte:', error);
      throw error;
    }
  }

  /**
   * Obté missatges d'error traduïts segons el codi d'error de Firebase
   * 
   * @param errorCode - Codi d'error de Firebase
   * @returns Clau de traducció per l'error
   */
  static getErrorMessageKey(errorCode: string): string {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'auth.errors.emailInUse';
      case 'auth/invalid-email':
        return 'auth.errors.invalidEmail';
      case 'auth/operation-not-allowed':
        return 'auth.errors.operationNotAllowed';
      case 'auth/weak-password':
        return 'auth.errors.weakPassword';
      case 'auth/user-disabled':
        return 'auth.errors.userDisabled';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'auth.errors.invalidCredentials';
      case 'auth/too-many-requests':
        return 'auth.errors.tooManyRequests';
      case 'auth/network-request-failed':
        return 'auth.errors.networkError';
      default:
        return 'auth.errors.generic';
    }
  }
}
