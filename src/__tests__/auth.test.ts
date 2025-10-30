/**
 * Tests per al sistema d'autenticació
 * 
 * NOTA: Aquests són exemples de tests que es podrien implementar.
 * Per executar-los, necessites configurar Jest i les llibreries de testing.
 */

// import { AuthService } from '../services/AuthService';
// import { UsersService } from '../services/UsersService';

/**
 * Tests per AuthService
 */
describe('AuthService', () => {
  describe('signUp', () => {
    it('hauria de crear un usuari correctament', async () => {
      // TODO: Implementar test
      // const user = await AuthService.signUp({
      //   email: 'test@example.com',
      //   password: 'Test123!',
      //   username: 'TestUser',
      //   language: 'ca'
      // });
      // expect(user).toBeDefined();
      // expect(user.email).toBe('test@example.com');
    });

    it('hauria de llançar un error si l\'email ja existeix', async () => {
      // TODO: Implementar test
      // await expect(
      //   AuthService.signUp({
      //     email: 'existing@example.com',
      //     password: 'Test123!',
      //     username: 'TestUser',
      //     language: 'ca'
      //   })
      // ).rejects.toThrow();
    });

    it('hauria de llançar un error si la contrasenya és massa curta', async () => {
      // TODO: Implementar test
    });

    it('hauria d\'enviar un email de verificació', async () => {
      // TODO: Implementar test
    });

    it('hauria de crear l\'usuari al backend', async () => {
      // TODO: Implementar test
    });

    it('hauria de revertir la creació de Firebase si falla el backend', async () => {
      // TODO: Implementar test
    });
  });

  describe('login', () => {
    it('hauria d\'autenticar un usuari correctament', async () => {
      // TODO: Implementar test
      // const user = await AuthService.login({
      //   email: 'test@example.com',
      //   password: 'Test123!'
      // });
      // expect(user).toBeDefined();
      // expect(user.email).toBe('test@example.com');
    });

    it('hauria de llançar un error amb credencials incorrectes', async () => {
      // TODO: Implementar test
    });

    it('hauria d\'obtenir el token JWT', async () => {
      // TODO: Implementar test
    });
  });

  describe('logout', () => {
    it('hauria de tancar la sessió correctament', async () => {
      // TODO: Implementar test
      // await AuthService.logout();
      // const currentUser = AuthService.getCurrentUser();
      // expect(currentUser).toBeNull();
    });
  });

  describe('resetPassword', () => {
    it('hauria d\'enviar un email de recuperació', async () => {
      // TODO: Implementar test
      // await AuthService.resetPassword('test@example.com');
      // Comprovar que s'ha enviat l'email
    });

    it('hauria de llançar un error si l\'email no existeix', async () => {
      // TODO: Implementar test
    });
  });

  describe('resendVerificationEmail', () => {
    it('hauria de reenviar l\'email de verificació', async () => {
      // TODO: Implementar test
    });

    it('hauria de llançar un error si no hi ha usuari autenticat', async () => {
      // TODO: Implementar test
    });

    it('hauria de llançar un error si l\'email ja està verificat', async () => {
      // TODO: Implementar test
    });
  });

  describe('getAuthToken', () => {
    it('hauria d\'obtenir el token d\'autenticació', async () => {
      // TODO: Implementar test
    });

    it('hauria de renovar el token si està caducat', async () => {
      // TODO: Implementar test
    });

    it('hauria de retornar null si no hi ha usuari autenticat', async () => {
      // TODO: Implementar test
      // const token = await AuthService.getAuthToken();
      // expect(token).toBeNull();
    });
  });

  describe('getErrorMessageKey', () => {
    it('hauria de retornar la clau de traducció correcta per cada error', () => {
      // TODO: Implementar test
      // expect(AuthService.getErrorMessageKey('auth/email-already-in-use'))
      //   .toBe('auth.errors.emailInUse');
      // expect(AuthService.getErrorMessageKey('auth/invalid-email'))
      //   .toBe('auth.errors.invalidEmail');
    });

    it('hauria de retornar la clau genèrica per errors desconeguts', () => {
      // TODO: Implementar test
      // expect(AuthService.getErrorMessageKey('unknown-error'))
      //   .toBe('auth.errors.generic');
    });
  });
});

/**
 * Tests per UsersService amb autenticació
 */
describe('UsersService', () => {
  describe('createUser', () => {
    it('hauria de crear un usuari al backend amb token', async () => {
      // TODO: Implementar test
    });

    it('hauria d\'enviar el token com a header Authorization', async () => {
      // TODO: Implementar test
    });

    it('hauria de funcionar sense token (per compatibilitat)', async () => {
      // TODO: Implementar test
    });
  });

  describe('getUserByUid', () => {
    it('hauria d\'obtenir un usuari per UID amb token', async () => {
      // TODO: Implementar test
    });

    it('hauria d\'enviar el token com a header Authorization', async () => {
      // TODO: Implementar test
    });
  });

  describe('updateUser', () => {
    it('hauria d\'actualitzar un usuari amb token', async () => {
      // TODO: Implementar test
    });

    it('hauria d\'enviar el token com a header Authorization', async () => {
      // TODO: Implementar test
    });
  });

  describe('deleteUser', () => {
    it('hauria d\'eliminar un usuari amb token', async () => {
      // TODO: Implementar test
    });

    it('hauria d\'enviar el token com a header Authorization', async () => {
      // TODO: Implementar test
    });
  });
});

/**
 * Tests per AuthContext
 */
describe('AuthContext', () => {
  it('hauria de proporcionar l\'estat d\'autenticació', () => {
    // TODO: Implementar test
  });

  it('hauria d\'actualitzar l\'estat quan l\'usuari inicia sessió', async () => {
    // TODO: Implementar test
  });

  it('hauria d\'actualitzar l\'estat quan l\'usuari tanca sessió', async () => {
    // TODO: Implementar test
  });

  it('hauria d\'obtenir el token automàticament', async () => {
    // TODO: Implementar test
  });

  it('hauria de carregar les dades de l\'usuari del backend', async () => {
    // TODO: Implementar test
  });

  it('hauria de renovar el token quan sigui necessari', async () => {
    // TODO: Implementar test
  });
});

/**
 * Tests d'integració
 */
describe('Integration Tests', () => {
  it('hauria de completar el flux de registre complet', async () => {
    // TODO: Implementar test
    // 1. Registrar usuari a Firebase
    // 2. Enviar email de verificació
    // 3. Crear usuari al backend
    // 4. Verificar que tot s'ha creat correctament
  });

  it('hauria de completar el flux de login complet', async () => {
    // TODO: Implementar test
    // 1. Iniciar sessió amb Firebase
    // 2. Obtenir token JWT
    // 3. Carregar dades de l'usuari des del backend
    // 4. Verificar que tot funciona correctament
  });

  it('hauria de gestionar errors de manera consistent', async () => {
    // TODO: Implementar test
  });
});

/**
 * Instruccions per executar els tests:
 * 
 * 1. Instal·lar dependències:
 *    npm install --save-dev jest @testing-library/react-native @testing-library/jest-native
 * 
 * 2. Configurar Jest al package.json:
 *    "jest": {
 *      "preset": "react-native",
 *      "transformIgnorePatterns": [
 *        "node_modules/(?!(react-native|@react-native|expo|@expo|firebase)/)"
 *      ]
 *    }
 * 
 * 3. Executar els tests:
 *    npm test
 * 
 * NOTA: Necessitaràs configurar mocks per Firebase i els serveis del backend.
 */

export {};
