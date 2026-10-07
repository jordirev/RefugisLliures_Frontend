# Integració — Firebase Auth (JS SDK) i Google Sign-In

> **[FET]** comprovat al codi · **[INFERÈNCIA]** deducció · **[NO VERIFICAT]** depèn de config externa.

## Què fa
Registre, login (email i Google), verificació d'email, reset i canvi de contrasenya, canvi d'email, esborrat de compte i emissió d'**ID tokens** que s'envien al backend com a `Authorization: Bearer`.

## Fitxers
| Fitxer | Rol |
|---|---|
| `src/services/firebase.ts` | `initializeApp` + `getAuth`; reexporta funcions de `firebase/auth` |
| `src/services/AuthService.ts` | Totes les operacions d'auth (classe estàtica) |
| `src/contexts/AuthContext.tsx` | Estat global (`firebaseUser`, `backendUser`, ids preferits/visitats, mode offline) i listener `onAuthStateChanged` |
| `src/utils/authUtils.ts` | `isUserAdmin()` — claim `role === 'admin'` |
| `src/types/auth.types.ts` | Tipus |
| `app.config.js:86-93` | Injecta la config Firebase a `expo.extra` des de `process.env` |
| `babel.config.js` | `react-native-dotenv` → mòdul `@env` (llegeix `.env`) |

Guies de configuració pas a pas: [guides/firebase-setup.md](../guides/firebase-setup.md) i [guides/google-signin-setup.md](../guides/google-signin-setup.md).

## API exposada
**`AuthService`** (`src/services/AuthService.ts`, mètodes `static`): `signUp`, `login`, `loginWithGoogle`, `logout`, `resetPassword`, `resendVerificationEmail`, `getAuthToken(forceRefresh)`, `getCurrentUser`, `onAuthStateChange`, `reloadUser`, `deleteAccount`, `changePassword`, `changeEmail`, `getErrorMessageKey(code)` (codi de Firebase → clau `auth.errors.*`), `isGoogleSignInAvailable`.

**`useAuth()`** (`src/contexts/AuthContext.tsx:10-34`):
| Grup | Camps |
|---|---|
| Estat | `firebaseUser`, `backendUser`, `isLoading`, `isAuthenticated` (usuari + email verificat), `isOfflineMode`, `authToken` (no l'usa `apiClient`), `favouriteRefugeIds`, `visitedRefugeIds` |
| Accions d'auth | `login`, `loginWithGoogle`, `signup`, `logout`, `deleteAccount`, `changePassword`, `changeEmail`, `updateUsername` |
| Refresc | `refreshToken` (força `getIdToken(true)`), `reloadUser` (Firebase + backend + idioma), `refreshUserData` (només backend) |
| Altres | `setFavouriteRefugeIds`, `setVisitedRefugeIds`, `enterOfflineMode`, `exitOfflineMode` |

Errors a la UI: `t(AuthService.getErrorMessageKey(error.code))` amb `useCustomAlert`.

## Configuració (només noms)
Variables a `.env.example` (i `.env` local, ignorat per git a `.gitignore:42`): `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`, `FIREBASE_MEASUREMENT_ID`, `FIREBASE_WEB_CLIENT_ID`.

Hi ha **dos mecanismes** de lectura **[FET]**:
1. `app.config.js` → `Constants.expoConfig.extra.firebase*` per a la config de Firebase (`src/services/firebase.ts:39-47`). Els imports d'`@env` del mateix fitxer (L26-34) no s'usen.
2. `@env` (react-native-dotenv, `safe:false`, `allowUndefined:true`) per a `FIREBASE_WEB_CLIENT_ID` (`src/services/AuthService.ts:32`).

Fitxers natius: `google-services.json` (Android) es genera a `app.config.js:9-26` des de `GOOGLE_SERVICES_JSON_BASE64` (variable d'EAS) i està a `.gitignore:50`; `GoogleService-Info.plist` (iOS) es referencia a `app.config.js:52` però no és al repo **[FET]**.

## Google Sign-In
- Llibreria nativa `@react-native-google-signin/google-signin`, carregada amb `require` dins `try` (`AuthService.ts:25-31`): no funciona a Expo Go (`GOOGLE_SIGNIN_NOT_AVAILABLE`).
- `GoogleSignin.configure({webClientId: FIREBASE_WEB_CLIENT_ID})` → `signIn()` → `GoogleAuthProvider.credential(idToken)` → `signInWithCredential` (`AuthService.ts:134-203`).
- `expo-auth-session` és a `package.json` però **no s'usa** a `src/` **[FET]**.

## Tokens
- `AuthService.getAuthToken(force)` = `auth.currentUser.getIdToken(force)` (`AuthService.ts:261-275`).
- `apiClient` el demana a cada petició i reintenta un cop amb refresc forçat en 401 (`src/services/apiClient.ts:43-76`). Opcions `skipAuth` (no afegeix token, p. ex. APIs públiques) i `skipRetry` (no reintenta).
- Motivació: els ID tokens de Firebase caduquen en 1 h; sense el reintent, una sessió llarga acabava en 401 i l'usuari havia de tornar a fer login. Els tokens només viuen en memòria.
- Límits: no pot recuperar-se si la sessió de Firebase ha caducat del tot, el compte està revocat/desactivat o no hi ha xarxa; en aquests casos el servei rep el 401 original. No hi ha refresc proactiu, ni cua per a 401 simultanis (cada petició refresca per separat), ni backoff, ni `onIdTokenChanged` **[FET]**.

## Gotchas
- Sense persistència React Native (`initializeAuth` + `getReactNativePersistence(AsyncStorage)` absent) **[FET]** → sessió en memòria **[INFERÈNCIA]**.
- `FIREBASE_WEB_CLIENT_ID` es llegeix de `.env` en temps de bundle; a EAS, `.env` no és al repo → cal que l'entorn d'EAS el proporcioni **[NO VERIFICAT]**.
- Emulador d'Auth per a E2E: `firebase.json` (port 9099, UI 4000) **[FET]**.
- Vegeu també els fluxos [01](../flows/01-signup.md), [02](../flows/02-login-logout-session.md), [03](../flows/03-profile-settings-account.md).
