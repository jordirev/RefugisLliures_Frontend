# Tests d'Autenticació - Refugis Lliures

## Resum dels Tests Creats

### ✅ Tests Unitaris (`src/__tests__/unit_tests/services/auth.test.ts`)

**46 tests** que cobreixen el 100% de les funcionalitats d'`AuthService`:

- **signUp**: Registre amb èxit, errors Firebase, errors backend, verificació email
- **login**: Login correcte, credencials incorrectes, usuari inexistent  
- **loginWithGoogle**: Usuari existent/nou, cancel·lació, errors tokens
- **logout**: Tancament correcte i errors
- **resetPassword**: Recuperació de contrasenya
- **resendVerificationEmail**: Reenviar verificació amb diferents escenaris
- **getAuthToken**: Obtenir tokens, refresh, errors
- **getCurrentUser**: Usuari actual o null
- **onAuthStateChange**: Subscripció a canvis
- **reloadUser**: Recarregar dades d'usuari
- **deleteAccount**: Eliminar compte amb èxit i errors
- **changePassword**: Canviar contrasenya amb reautenticació
- **changeEmail**: Canviar email amb verificació
- **getErrorMessageKey**: Traducció de tots els errors
- **isGoogleSignInAvailable**: Disponibilitat de Google Sign In

### ✅ Tests E2E (`src/__tests__/E2E/auth.e2e.test.ts`)

Tests end-to-end amb **Firebase Emulator** que cobreixen fluxos complets:

- Registre d'usuaris (èxit, errors de validació)
- Login (credencials correctes/incorrectes)
- Tancament de sessió
- Recuperació de contrasenya
- Verificació d'email
- Canvi de contrasenya amb reautenticació
- Obtenció i refresh de tokens
- Observadors d'estat d'autenticació
- Eliminació de compte
- Fluxos complets de registre → login → logout

## Executar els Tests

### Tests Unitaris (no requereixen configuració extra)

```bash
# Tots els tests unitaris
npm run test:unit

# Només tests d'autenticació
npm test -- __tests__/unit_tests/services/auth.test.ts

# Amb coverage
npm test -- __tests__/unit_tests/services/auth.test.ts --coverage
```

### Tests E2E (requereixen Firebase Emulator)

#### 1. Instal·lar Firebase CLI (només cal fer-ho una vegada)

```bash
npm install -g firebase-tools
```

Verifica la instal·lació:
```bash
firebase --version
```

#### 2. Inicialitzar Firebase (si no s'ha fet)

```bash
firebase login
firebase init emulators
```

Selecciona:
- ✅ Authentication Emulator
- Port: 9099 (per defecte)
- ✅ Emulator UI
- Port: 4000 (per defecte)

#### 3. Executar els tests E2E

**Opció A: Emulador automàtic** (recomanat)
```bash
npm run test:e2e
```
Aquest script inicia l'emulador, executa els tests i el tanca automàticament.

**Opció B: Emulador manual** (per debugging)

Terminal 1 - Iniciar emulador:
```bash
npm run test:e2e:ui
# o
firebase emulators:start --only auth
```

Terminal 2 - Executar tests:
```bash
npm test -- __tests__/E2E
```

#### 4. Accedir a la UI de l'emulador

Mentre l'emulador està executant-se, pots veure l'estat dels usuaris a:
```
http://localhost:4000
```

## Estructura de Fitxers

```
src/__tests__/
├── E2E/
│   ├── auth.e2e.test.ts          # Tests E2E d'autenticació
│   └── README.md                  # Documentació E2E
└── unit_tests/
    └── services/
        ├── auth.test.ts           # Tests unitaris d'autenticació
        ├── refugis.test.ts        # Tests de refugis (pre-existent)
        └── usuaris.test.ts        # Tests d'usuaris (pre-existent)
```

## Coverage

Els tests unitaris d'autenticació tenen un **coverage molt alt**:

- ✅ Tots els mètodes públics testats
- ✅ Escenaris d'èxit
- ✅ Gestió d'errors
- ✅ Edge cases
- ✅ Validacions
- ✅ Fluxos complets

Per veure el coverage detallat:
```bash
npm run test:coverage
```

Després obre: `coverage/lcov-report/index.html`

## Troubleshooting

### Error: "firebase: command not found"

**Solució**: Instal·la Firebase CLI globalment:
```bash
npm install -g firebase-tools
```

### Error: "connect ECONNREFUSED ::1:9099"

**Solució**: L'emulador no està en execució. Inicia'l amb:
```bash
firebase emulators:start --only auth
```

### Tests E2E molt lents

**Solució**: Assegura't que no hi ha conflictes de ports. Pots canviar el port a `firebase.json`:
```json
{
  "emulators": {
    "auth": {
      "port": 9099
    }
  }
}
```

### Els mocks de Google Sign In no funcionen

**Solució**: Els mocks estan configurats correctament. Si tens problemes, assegura't que:
1. Els tests s'executen amb Jest
2. El mock de `@react-native-google-signin/google-signin` es defineix abans d'importar `AuthService`

## Scripts npm disponibles

```json
{
  "test": "jest",                           // Tots els tests
  "test:watch": "jest --watch",             // Mode watch
  "test:coverage": "jest --coverage",       // Amb coverage
  "test:unit": "jest __tests__/unit_tests",  // Només unitaris
  "test:e2e": "firebase emulators:exec --only auth \"npm test -- __tests__/E2E\"",  // E2E automàtic
  "test:e2e:ui": "firebase emulators:start --only auth"  // Emulador amb UI
}
```

## Notes Importants

1. **Aïllament**: Cada test neteja l'estat després de l'execució
2. **Firebase Emulator**: Els tests E2E NO afecten les dades reals de producció
3. **Mocks**: Els tests unitaris usen mocks complets de Firebase i serveis
4. **Logs**: Els console.log són del codi real, no dels tests (pots silenciar-los si vols)

## Recursos

- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
