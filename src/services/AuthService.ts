import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  updatePassword,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  verifyBeforeUpdateEmail,
  fetchSignInMethodsForEmail
} from './firebase';
import type { FirebaseUser } from './firebase';

// Re-exportar el tipus FirebaseUser perquè estigui disponible per altres mòduls
export type { FirebaseUser };
import { UsersService, UserCreateData } from './UsersService';
// Import condicional per Google Sign In - només disponible en builds natius
let GoogleSignin: any = null;
try {
  const googleSigninModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = googleSigninModule.GoogleSignin;
} catch (error) {
  console.warn('Google Sign In no disponible - executant en Expo Go o sense configuració nativa');
}
import { FIREBASE_WEB_CLIENT_ID } from '@env';

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
        language: signUpData.language,
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

      // 6. Tancar la sessió perquè l'usuari hagi de fer login després de verificar el correu
      await signOut(auth);
      console.log('Sessió tancada després del registre. L\'usuari haurà de fer login després de verificar el correu.');

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
   * Inicia sessió amb Google
   * Configura Google Sign In, obté les credencials i autentica amb Firebase
   * Si és un usuari nou, el crea al backend
   * 
   * @returns L'usuari de Firebase autenticat
   */
  static async loginWithGoogle(): Promise<FirebaseUser> {
    // Verificar si Google Sign In està disponible
    if (!GoogleSignin) {
      throw new Error('GOOGLE_SIGNIN_NOT_AVAILABLE');
    }
    
    try {
      // 1. Configurar Google Sign In
      GoogleSignin.configure({
        webClientId: FIREBASE_WEB_CLIENT_ID,
        offlineAccess: false,
      });

      // 2. Verificar disponibilitat de Google Play Services (només Android)
      await GoogleSignin.hasPlayServices();

      // 3. Fer sign in amb Google
      const userInfo = await GoogleSignin.signIn();
      
      // 4. Obtenir l'ID token
      const { idToken } = userInfo.data || {};
      
      if (!idToken) {
        throw new Error('No s\'ha pogut obtenir l\'ID token de Google');
      }

      // 5. Crear credencial de Firebase amb l'ID token de Google
      const googleCredential = GoogleAuthProvider.credential(idToken);

      // 6. Autenticar amb Firebase
      const userCredential = await signInWithCredential(auth, googleCredential);
      const firebaseUser = userCredential.user;

      console.log('Usuari autenticat amb Google:', {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL
      });

      // 7. Obtenir el token d'autenticació de Firebase
      const token = await firebaseUser.getIdToken();

      // 8. Verificar si l'usuari existeix al backend
      let backendUser = await UsersService.getUserByUid(firebaseUser.uid, token);

      // 9. Si no existeix, crear-lo al backend
      if (!backendUser) {
        console.log('Usuari nou de Google, creant al backend...');
        
        const userData: UserCreateData = {
          username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuari',
          email: firebaseUser.email || '',
          language: 'ca', // Idioma per defecte, es pot canviar després
        };

        backendUser = await UsersService.createUser(userData, token);

        if (!backendUser) {
          console.error('Error creant l\'usuari al backend');
          // No eliminem l'usuari de Firebase perquè pot ser que ja existís
          // només mostrem l'error
        }
      }

      return firebaseUser;
    } catch (error: any) {
      console.error('Error durant el login amb Google:', error);
      
      // Si l'usuari cancel·la el procés de login
      if (error.code === 'SIGN_IN_CANCELLED') {
        throw new Error('LOGIN_CANCELLED');
      }
      
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
   * Reenvia l'email de verificació a l'usuari
   * 
   * @param user - Usuari de Firebase opcional. Si no es proporciona, s'utilitzarà auth.currentUser
   */
  static async resendVerificationEmail(user?: FirebaseUser): Promise<void> {
    try {
      const targetUser = user || auth.currentUser;
      if (!targetUser) {
        throw new Error('No hi ha cap usuari autenticat');
      }

      if (targetUser.emailVerified) {
        throw new Error('L\'email ja està verificat');
      }

      await sendEmailVerification(targetUser);
      console.log('Email de verificació reenviat a:', targetUser.email);
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
      case 'GOOGLE_SIGNIN_NOT_AVAILABLE':
        return 'auth.errors.googleSigninNotAvailable';
      default:
        return 'auth.errors.generic';
    }
  }
  
  /**
   * Verifica si Google Sign In està disponible
   * 
   * @returns true si Google Sign In està disponible, false en cas contrari
   */
  static isGoogleSignInAvailable(): boolean {
    return GoogleSignin !== null;
  }

  /**
   * Canvia la contrasenya de l'usuari actual
   * Requereix reautenticació amb la contrasenya actual
   * 
   * @param currentPassword - Contrasenya actual
   * @param newPassword - Nova contrasenya
   */
  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('No hi ha cap usuari autenticat');
      }

      // 1. Reautenticar l'usuari amb la contrasenya actual
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // 2. Actualitzar la contrasenya
      await updatePassword(user, newPassword);

      console.log('Contrasenya actualitzada correctament');
    } catch (error: any) {
      console.error('Error canviant contrasenya:', error);
      throw error;
    }
  }

  /**
   * Inicia el procés de canvi de correu electrònic de l'usuari actual
   * Requereix reautenticació amb la contrasenya actual
   * Envia un email de verificació al correu actual amb un enllaç per confirmar el canvi
   * 
   * @param password - Contrasenya actual per reautenticar
   * @param newEmail - Nou correu electrònic
   */
  static async changeEmail(password: string, newEmail: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('No hi ha cap usuari autenticat');
      }

      const oldEmail = user.email;

      console.log('Iniciant canvi de correu de:', oldEmail, 'a:', newEmail);

      // 1. Comprovar si el nou email ja existeix
      try {
        const signInMethods = await fetchSignInMethodsForEmail(auth, newEmail);
        if (signInMethods && signInMethods.length > 0) {
          // L'email ja està en ús
          const error: any = new Error('EMAIL_ALREADY_IN_USE');
          error.code = 'auth/email-already-in-use';
          throw error;
        }
      } catch (error: any) {
        // Si l'error no és de xarxa, propagar-lo
        if (error.code === 'auth/email-already-in-use') {
          throw error;
        }
        // Si és un altre error (per exemple xarxa), continuar igualment
        console.log('No s\'ha pogut verificar si l\'email existeix, continuant...');
      }

      // 2. Reautenticar l'usuari amb la contrasenya actual
      const credential = EmailAuthProvider.credential(oldEmail, password);
      await reauthenticateWithCredential(user, credential);
      console.log('Usuari reautenticat correctament');

      // 3. Enviar email de verificació ABANS de canviar l'email
      // L'email només es canviarà quan l'usuari faci clic a l'enllaç de verificació
      await verifyBeforeUpdateEmail(user, newEmail);
      console.log('Email de verificació enviat. L\'email es canviarà quan l\'usuari verifiqui el nou correu:', newEmail);
    } catch (error: any) {
      console.error('Error iniciant canvi de correu electrònic:', error);
      throw error;
    }
  }
}
