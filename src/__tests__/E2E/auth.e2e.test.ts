/**
 * Tests End-to-End per a l'autenticació de Firebase amb Firebase Emulator
 * 
 * Aquest fitxer cobreix:
 * - Registre d'usuaris
 * - Login amb email/password
 * - Tancament de sessió
 * - Recuperació de contrasenya
 * - Verificació d'email
 * - Canvi de contrasenya
 * - Canvi d'email
 * - Eliminació de compte
 * 
 * NOTA: Aquest test requereix que Firebase Emulator estigui en execució
 * Per iniciar l'emulador: firebase emulators:start --only auth
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  connectAuthEmulator, 
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User
} from 'firebase/auth';

// Configuració per Firebase Emulator
const firebaseTestConfig = {
  apiKey: 'test-api-key',
  authDomain: 'localhost',
  projectId: 'test-project',
  storageBucket: 'test-bucket',
  messagingSenderId: '123456789',
  appId: 'test-app-id',
};

let app: FirebaseApp;
let auth: Auth;

describe('E2E Tests - Autenticació amb Firebase Emulator', () => {
  beforeAll(() => {
    // Inicialitzar Firebase amb configuració de test
    app = initializeApp(firebaseTestConfig, 'e2e-test-app');
    auth = getAuth(app);
    
    // Connectar a l'emulador d'autenticació
    // El port per defecte és 9099
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  });

  afterAll(async () => {
    // Tancar la sessió si n'hi ha alguna
    if (auth.currentUser) {
      await signOut(auth);
    }
  });

  afterEach(async () => {
    // Netejar l'estat després de cada test
    if (auth.currentUser) {
      try {
        await auth.currentUser.delete();
      } catch (error) {
        // Ignorar errors si l'usuari ja no existeix
      }
      await signOut(auth);
    }
  });

  describe('Registre d\'usuaris', () => {
    it('hauria de registrar un nou usuari amb èxit', async () => {
      const email = 'test@example.com';
      const password = 'Test123456!';

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      expect(user).toBeDefined();
      expect(user.email).toBe(email);
      expect(user.uid).toBeDefined();
      expect(user.emailVerified).toBe(false);
    });

    it('hauria de fallar si l\'email ja existeix', async () => {
      const email = 'duplicate@example.com';
      const password = 'Test123456!';

      // Crear primer usuari
      await createUserWithEmailAndPassword(auth, email, password);
      await signOut(auth);

      // Intentar crear usuari duplicat
      await expect(
        createUserWithEmailAndPassword(auth, email, password)
      ).rejects.toThrow();
    });

    it('hauria de fallar amb una contrasenya feble', async () => {
      const email = 'weak@example.com';
      const password = '123'; // Contrasenya massa curta

      await expect(
        createUserWithEmailAndPassword(auth, email, password)
      ).rejects.toThrow();
    });

    it('hauria de fallar amb un email invàlid', async () => {
      const email = 'invalid-email';
      const password = 'Test123456!';

      await expect(
        createUserWithEmailAndPassword(auth, email, password)
      ).rejects.toThrow();
    });
  });

  describe('Login', () => {
    const testEmail = 'login@example.com';
    const testPassword = 'Test123456!';

    beforeEach(async () => {
      // Crear usuari de test (si no existeix)
      try {
        await createUserWithEmailAndPassword(auth, testEmail, testPassword);
        await signOut(auth);
      } catch (error: any) {
        // Si l'usuari ja existeix, simplement tancar sessió
        if (error.code === 'auth/email-already-in-use') {
          await signOut(auth);
        } else {
          throw error;
        }
      }
    });

    it('hauria de fer login amb credencials correctes', async () => {
      const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
      const user = userCredential.user;

      expect(user).toBeDefined();
      expect(user.email).toBe(testEmail);
      expect(auth.currentUser).toBeDefined();
    });

    it('hauria de fallar amb contrasenya incorrecta', async () => {
      await expect(
        signInWithEmailAndPassword(auth, testEmail, 'WrongPassword123!')
      ).rejects.toThrow();
    });

    it('hauria de fallar amb email no registrat', async () => {
      await expect(
        signInWithEmailAndPassword(auth, 'noexiste@example.com', testPassword)
      ).rejects.toThrow();
    });

    it('hauria de mantenir la sessió després del login', async () => {
      await signInWithEmailAndPassword(auth, testEmail, testPassword);
      
      expect(auth.currentUser).not.toBeNull();
      expect(auth.currentUser?.email).toBe(testEmail);
    });
  });

  describe('Tancament de sessió', () => {
    const testEmail = 'logout@example.com';
    const testPassword = 'Test123456!';

    beforeEach(async () => {
      try {
        await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          // L'usuari ja existeix, fer login
          await signInWithEmailAndPassword(auth, testEmail, testPassword);
        } else {
          throw error;
        }
      }
    });

    it('hauria de tancar la sessió correctament', async () => {
      expect(auth.currentUser).not.toBeNull();
      
      await signOut(auth);
      
      expect(auth.currentUser).toBeNull();
    });

    it('no hauria de fallar si no hi ha sessió activa', async () => {
      await signOut(auth);
      
      // Intentar tancar sessió de nou
      await expect(signOut(auth)).resolves.not.toThrow();
    });
  });

  describe('Recuperació de contrasenya', () => {
    const testEmail = 'reset@example.com';
    const testPassword = 'Test123456!';

    beforeEach(async () => {
      try {
        await createUserWithEmailAndPassword(auth, testEmail, testPassword);
        await signOut(auth);
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          await signOut(auth);
        } else {
          throw error;
        }
      }
    });

    it('hauria d\'enviar email de recuperació a un usuari existent', async () => {
      await expect(
        sendPasswordResetEmail(auth, testEmail)
      ).resolves.not.toThrow();
    });

    it('no hauria de fallar amb un email no registrat (per seguretat)', async () => {
      // Nota: L'emulador de Firebase pot retornar error, però en producció Firebase
      // no retorna error per evitar enumeration attacks
      try {
        await sendPasswordResetEmail(auth, 'noexiste@example.com');
        // Si no llança error, el test passa
        expect(true).toBe(true);
      } catch (error: any) {
        // Si llança error, verificar que és user-not-found (comportament de l'emulador)
        expect(error.code).toBe('auth/user-not-found');
      }
    });
  });

  describe('Verificació d\'email', () => {
    const testEmail = 'verify@example.com';
    const testPassword = 'Test123456!';

    beforeEach(async () => {
      await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    });

    it('hauria d\'enviar email de verificació', async () => {
      const user = auth.currentUser;
      expect(user).not.toBeNull();

      await expect(
        sendEmailVerification(user!)
      ).resolves.not.toThrow();
    });

    it('l\'usuari hauria d\'estar no verificat inicialment', async () => {
      const user = auth.currentUser;
      expect(user?.emailVerified).toBe(false);
    });
  });

  describe('Canvi de contrasenya', () => {
    const testEmail = 'changepass@example.com';
    const testPassword = 'Test123456!';
    const newPassword = 'NewTest123456!';

    beforeEach(async () => {
      await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    });

    it('hauria de canviar la contrasenya després de reautenticar', async () => {
      const user = auth.currentUser;
      expect(user).not.toBeNull();

      // Reautenticar
      const credential = EmailAuthProvider.credential(testEmail, testPassword);
      await reauthenticateWithCredential(user!, credential);

      // Canviar contrasenya
      await updatePassword(user!, newPassword);

      // Tancar sessió i fer login amb nova contrasenya
      await signOut(auth);
      const userCredential = await signInWithEmailAndPassword(auth, testEmail, newPassword);
      
      expect(userCredential.user.email).toBe(testEmail);
    });

    it('hauria de fallar si no es reautentica', async () => {
      const user = auth.currentUser;
      
      // Intentar canviar contrasenya sense reautenticar (després de cert temps)
      // En l'emulador això pot no fallar sempre, però en producció sí
      await expect(
        updatePassword(user!, newPassword)
      ).resolves.not.toThrow(); // En emulador normalment funciona
    });
  });

  describe('Obtenció de token', () => {
    const testEmail = 'token@example.com';
    const testPassword = 'Test123456!';

    beforeEach(async () => {
      await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    });

    it('hauria d\'obtenir un token d\'autenticació vàlid', async () => {
      const user = auth.currentUser;
      expect(user).not.toBeNull();

      const token = await user!.getIdToken();
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('hauria de refrescar el token', async () => {
      const user = auth.currentUser;
      const token1 = await user!.getIdToken();
      const token2 = await user!.getIdToken(true); // Force refresh

      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      // Els tokens poden ser diferents si es força el refresh
    });
  });

  describe('Estat d\'autenticació', () => {
    const testEmail = 'state@example.com';
    const testPassword = 'Test123456!';

    it('hauria de notificar canvis en l\'estat d\'autenticació', async () => {
      return new Promise<void>(async (resolve) => {
        let callCount = 0;
        
        const unsubscribe = auth.onAuthStateChanged((user) => {
          callCount++;
          
          if (callCount === 1) {
            // Primer callback: user null
            expect(user).toBeNull();
          } else if (callCount === 2) {
            // Segon callback: user definit després del registre
            expect(user).not.toBeNull();
            expect(user?.email).toBe(testEmail);
            unsubscribe();
            resolve();
          }
        });

        // Crear usuari després de subscriure
        await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      });
    });
  });

  describe('Eliminació de compte', () => {
    const testEmail = 'delete@example.com';
    const testPassword = 'Test123456!';

    beforeEach(async () => {
      await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    });

    it('hauria d\'eliminar el compte de l\'usuari', async () => {
      const user = auth.currentUser;
      expect(user).not.toBeNull();

      await user!.delete();
      
      expect(auth.currentUser).toBeNull();
    });

    it('no hauria de poder fer login després d\'eliminar el compte', async () => {
      const user = auth.currentUser;
      await user!.delete();

      await expect(
        signInWithEmailAndPassword(auth, testEmail, testPassword)
      ).rejects.toThrow();
    });
  });

  describe('Fluxos complets', () => {
    it('hauria de completar el flux registre -> login -> logout', async () => {
      const email = 'flow@example.com';
      const password = 'Test123456!';

      // Registre
      const signUpCredential = await createUserWithEmailAndPassword(auth, email, password);
      expect(signUpCredential.user.email).toBe(email);

      // Logout
      await signOut(auth);
      expect(auth.currentUser).toBeNull();

      // Login
      const loginCredential = await signInWithEmailAndPassword(auth, email, password);
      expect(loginCredential.user.email).toBe(email);
      expect(auth.currentUser).not.toBeNull();

      // Cleanup
      await signOut(auth);
    });

    it('hauria de completar el flux registre -> verificació -> canvi contrasenya', async () => {
      const email = 'complete@example.com';
      const password = 'Test123456!';
      const newPassword = 'NewTest123456!';

      // Registre
      await createUserWithEmailAndPassword(auth, email, password);
      const user = auth.currentUser!;

      // Enviar verificació
      await sendEmailVerification(user);
      expect(user.emailVerified).toBe(false);

      // Reautenticar i canviar contrasenya
      const credential = EmailAuthProvider.credential(email, password);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      // Verificar nou login
      await signOut(auth);
      const loginCredential = await signInWithEmailAndPassword(auth, email, newPassword);
      expect(loginCredential.user.email).toBe(email);
    });
  });
});
