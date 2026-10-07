# Guia — Configurar Firebase Auth per al frontend

> Consolida i actualitza les antigues `README/SETUP_CHECKLIST.md`, `README/FIREBASE_SETUP_FIX.md`, `README/AUTH_QUICK_START.md` i la part de configuració de `README/AUTHENTICATION_README.md` (octubre 2026).
> Com funciona l'auth al codi: [integrations/firebase-auth-google.md](../integrations/firebase-auth-google.md) i fluxos [01](../flows/01-signup.md) / [02](../flows/02-login-logout-session.md).
> **Mai** posis valors reals a la documentació ni al repo; aquí només hi ha noms de variables.

## 1. Projecte a Firebase Console
1. [Firebase Console](https://console.firebase.google.com/) → *Add project* (o tria l'existent; ha de ser el mateix projecte que usa el backend per verificar tokens).
2. *Project settings* (engranatge) → *General* → *Your apps* → icona web `</>` → registra una app web.
3. Copia l'objecte `firebaseConfig` (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`, `measurementId`).
4. Al mateix apartat, afegeix també l'app **Android** amb el package `com.refugislliures.app` (`app.config.js`) si encara no hi és; la necessitaràs per a `google-services.json` i per a Google Sign-In.

## 2. Habilitar l'autenticació
1. *Authentication* → *Get started*.
2. *Sign-in method* → habilita **Email/Password** (i **Google**, vegeu [google-signin-setup.md](google-signin-setup.md)).
3. Opcional: *Authentication → Templates* per personalitzar els correus de verificació, reset de contrasenya i canvi d'email (l'app fa servir els tres: `sendEmailVerification`, `sendPasswordResetEmail`, `verifyBeforeUpdateEmail`).

## 3. Fitxer `.env`
```bash
cp .env.example .env
```
Omple totes les variables de `.env.example`:

| Variable | Origen (Firebase Console) |
|---|---|
| `FIREBASE_API_KEY` | `apiKey` |
| `FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `FIREBASE_PROJECT_ID` | `projectId` |
| `FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `FIREBASE_APP_ID` | `appId` |
| `FIREBASE_MEASUREMENT_ID` | `measurementId` |
| `FIREBASE_WEB_CLIENT_ID` | Client web OAuth (vegeu [google-signin-setup.md](google-signin-setup.md)) |

Regles: sense cometes ni espais al voltant del valor; `.env` ja és al `.gitignore` i cada desenvolupador té el seu.

Com es llegeixen (detall a [integrations/firebase-auth-google.md](../integrations/firebase-auth-google.md#configuració-només-noms)):
- Les `FIREBASE_*` de config arriben a l'app via `app.config.js` → `expo.extra` → `Constants.expoConfig.extra` (cal regenerar la build nativa en canviar-les).
- `FIREBASE_WEB_CLIENT_ID` es llegeix amb `@env` (react-native-dotenv) en temps de bundle (cal `npx expo start -c`).

## 4. Fitxers natius
- **Android**: `google-services.json` (descarregat de *Project settings → Your apps → Android*) a l'arrel del projecte en local. A EAS es genera des de la variable `GOOGLE_SERVICES_JSON_BASE64` (`app.config.js:9-26`). Està al `.gitignore`.
- **iOS**: `GoogleService-Info.plist` es referencia a `app.config.js` però no hi ha suport iOS mantingut.

## 5. Arrencar i verificar
```bash
npx expo start -c          # neteja la cache després de tocar .env
npm run android            # si has canviat variables FIREBASE_* o google-services.json
```
`AuthProvider` ja embolcalla l'app a `App.js`; no cal integrar res més.

### Verificació manual
**Registre**
- [ ] Wizard de SignUp: idioma → nom d'usuari (2-20) → email vàlid → contrasenya (≥8, minúscula, majúscula, dígit i un de `!@#$%^&*`) → confirmació.
- [ ] Missatge d'èxit i retorn al Login; arriba el correu de verificació (mira spam).
- [ ] L'usuari apareix a *Authentication → Users* i al backend (`POST /api/users/` als logs de Metro).

**Login**
- [ ] Amb email no verificat: alerta amb opció de reenviar la verificació i es tanca la sessió.
- [ ] Amb email verificat: entra a l'app (tabs) i es carrega el perfil del backend.

**Recuperar contrasenya**
- [ ] Login → "Has oblidat la contrasenya?" → arriba el correu → la nova contrasenya funciona.

**Backend**
- [ ] Les peticions porten `Authorization: Bearer <idToken>` (ho fa `apiClient`) i el backend les accepta.

## 6. Solució de problemes
| Error | Causa probable | Solució |
|---|---|---|
| `Missing App configuration value: "projectId"` / `projectId is undefined` | `.env` absent, incomplet o build nativa antiga | Revisa `.env`, `npx expo start -c` i, si cal, `npm run android` |
| `auth/configuration-not-found` | Proveïdor no habilitat o config d'un altre projecte | Habilita Email/Password; revisa `FIREBASE_PROJECT_ID` |
| `auth/invalid-api-key` | API key mal copiada | Torna-la a copiar, sense espais ni cometes |
| `auth/email-already-in-use` | Email ja registrat (la UI ho mostra com a error genèric de registre) | Fes login o recupera la contrasenya |
| No arriba el correu de verificació | Spam, email erroni o quotes de Firebase | Revisa spam i reenvia des del Login |
| `Network request failed` | Sense connexió | L'app ofereix el mode offline des del Login |
| `Cannot find module '@env'` (editor) | TS no veu el mòdul | `src/types/env.d.ts` ja existeix: reinicia el TS Server |
| 401 persistents del backend | Projecte Firebase diferent entre front i back | Fes servir el mateix projecte; `apiClient` ja refresca el token un cop en 401 |

## 7. Emulador d'Auth (tests E2E)
`firebase.json` configura l'emulador d'Auth (port 9099, UI 4000). `npm run test:e2e` l'arrenca amb `firebase emulators:exec`; `npm run test:e2e:ui` l'obre per inspeccionar. Vegeu [integrations/eas-ci-tooling.md](../integrations/eas-ci-tooling.md#tests-jest).

## Referències
[Firebase Auth](https://firebase.google.com/docs/auth) · [Verificar ID tokens](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
