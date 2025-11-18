# Tests End-to-End (E2E)

Aquest directori conté els tests E2E de l'aplicació Refugis Lliures, utilitzant Firebase Emulator per provar l'autenticació de forma local.

## Requisits previs

1. **Firebase CLI**: Necessites tenir Firebase CLI instal·lat globalment:
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase Emulator**: Necessites tenir configurats els emuladors de Firebase al teu projecte.

## Configuració

### 1. Inicialitzar Firebase al projecte (si no s'ha fet)

```bash
firebase init emulators
```

Selecciona:
- Authentication Emulator
- Port: 9099 (per defecte)

### 2. Configuració del fitxer firebase.json

Assegura't que tens un fitxer `firebase.json` a l'arrel del projecte amb aquesta configuració:

```json
{
  "emulators": {
    "auth": {
      "port": 9099
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

## Executar els tests

### Opció 1: Executar manualment

1. **Iniciar Firebase Emulator** (en una terminal):
   ```bash
   firebase emulators:start --only auth
   ```

2. **Executar els tests E2E** (en una altra terminal):
   ```bash
   npm test -- __tests__/E2E
   ```

### Opció 2: Script automàtic (recomanat)

Pots afegir aquest script al teu `package.json`:

```json
{
  "scripts": {
    "test:e2e": "firebase emulators:exec --only auth 'npm test -- __tests__/E2E'",
    "test:e2e:ui": "firebase emulators:start --only auth"
  }
}
```

I després executar:
```bash
npm run test:e2e
```

## Estructura dels tests

### auth.e2e.test.ts

Tests complets d'autenticació que cobreixen:

- ✅ **Registre d'usuaris**
  - Registre amb èxit
  - Email duplicat
  - Contrasenya feble
  - Email invàlid

- ✅ **Login**
  - Credencials correctes
  - Contrasenya incorrecta
  - Email no registrat
  - Manteniment de sessió

- ✅ **Tancament de sessió**
  - Logout normal
  - Logout sense sessió activa

- ✅ **Recuperació de contrasenya**
  - Email de recuperació
  - Email no registrat

- ✅ **Verificació d'email**
  - Enviar email de verificació
  - Estat inicial no verificat

- ✅ **Canvi de contrasenya**
  - Canvi amb reautenticació
  - Login amb nova contrasenya

- ✅ **Obtenció de token**
  - Token vàlid
  - Refresh de token

- ✅ **Estat d'autenticació**
  - Observer de canvis d'estat

- ✅ **Eliminació de compte**
  - Eliminar compte
  - No poder fer login després

- ✅ **Fluxos complets**
  - Registre → Login → Logout
  - Registre → Verificació → Canvi contrasenya

## Notes importants

1. **Aïllament**: Cada test neteja l'estat després de l'execució per evitar interferències.

2. **Firebase Emulator**: Els tests utilitzen l'emulador local, NO afecten les dades reals de producció.

3. **Ports**: 
   - Emulator Auth: `http://localhost:9099`
   - Emulator UI: `http://localhost:4000`

4. **Debugging**: Pots accedir a la UI de l'emulador a `http://localhost:4000` per veure l'estat dels usuaris durant els tests.

5. **Timeout**: Si els tests fallen per timeout, comprova que l'emulador està en execució.

## Troubleshooting

### Error: "connect ECONNREFUSED ::1:9099"

**Solució**: L'emulador no està en execució. Inicia'l amb:
```bash
firebase emulators:start --only auth
```

### Error: "Failed to get document because the client is offline"

**Solució**: Aquest error és normal en tests E2E sense connexió a Firestore. Els tests d'auth no necessiten Firestore.

### Tests molt lents

**Solució**: Assegura't que no hi ha conflictes de ports. Pots canviar el port de l'emulador a `firebase.json`.

## Recursos

- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Firebase Auth Testing](https://firebase.google.com/docs/emulator-suite/connect_auth)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
