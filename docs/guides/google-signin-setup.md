# Guia — Configurar el login amb Google

> Consolida i actualitza les antigues `README/GOOGLE_LOGIN_SETUP.md`, `README/GOOGLE_LOGIN_GUIA_RAPIDA.md` i `README/GOOGLE_LOGIN_RESUM.md` (octubre 2026).
> Prerequisit: [firebase-setup.md](firebase-setup.md). Implementació: [integrations/firebase-auth-google.md](../integrations/firebase-auth-google.md#google-sign-in) i [flows/02](../flows/02-login-logout-session.md).

**Correccions respecte a les guies antigues**: l'app **no** usa `expo-auth-session` ni `expo-crypto` (només `@react-native-google-signin/google-signin`); la configuració és a `app.config.js` (no hi ha `app.json`); el package Android és `com.refugislliures.app`; **no funciona a Expo Go**.

## 1. Activar el proveïdor Google
Firebase Console → *Authentication → Sign-in method* → **Google** → habilita, posa el nom públic i el correu d'assistència → desa. Això crea automàticament un client OAuth **web** a Google Cloud.

## 2. Obtenir el Web Client ID
- Firebase Console → *Authentication → Sign-in method → Google* → *Web SDK configuration* → **Web client ID**, o
- [Google Cloud Console](https://console.cloud.google.com/) (mateix projecte) → *APIs & Services → Credentials* → client OAuth 2.0 de tipus *Web application*.

Té la forma `<número>-<hash>.apps.googleusercontent.com`. Posa'l a `.env`:
```env
FIREBASE_WEB_CLIENT_ID=<web client id>
```
Es passa a `GoogleSignin.configure({ webClientId })` (`src/services/AuthService.ts:142-145`). Ha de ser el client **web**, no l'Android.

## 3. Empremtes SHA de l'app Android
Google només accepta el login si l'empremta del certificat que signa l'APK està registrada a l'app Android de Firebase (package `com.refugislliures.app`).

Keystore de debug (build local):
```bash
keytool -keystore ~/.android/debug.keystore -list -v -alias androiddebugkey   # contrasenya: android
```
```powershell
keytool -keystore $HOME\.android\debug.keystore -list -v -alias androiddebugkey
```
Builds d'EAS: `eas credentials` (o el panell d'Expo) mostra el SHA-1 del keystore que fa servir EAS. Si publiques a Play Store, afegeix també el SHA-1 de *App signing* de Play Console.

Afegeix cada SHA-1 a Firebase → *Project settings → Your apps → Android* i **torna a descarregar** `google-services.json` (o regenera `GOOGLE_SERVICES_JSON_BASE64` a EAS).

## 4. Configuració d'Expo (ja feta)
`app.config.js` ja inclou el plugin `@react-native-google-signin/google-signin`, `android.package` i `android.googleServicesFile`. No cal tocar res si el package no canvia.

## 5. Compilar i provar
```bash
npx expo start -c        # recull el nou FIREBASE_WEB_CLIENT_ID
npm run android          # build nativa; Expo Go no inclou el mòdul natiu
```
Prova: Login → "Continuar amb Google" → tria compte → entra a l'app.

Checklist:
- [ ] Un usuari nou es crea a Firebase *Authentication → Users* i al backend (`POST /api/users/`).
- [ ] Un usuari existent entra sense crear-se de nou.
- [ ] Cancel·lar el selector no mostra error (`SIGN_IN_CANCELLED` → `LOGIN_CANCELLED`).
- [ ] Logout i nou login funcionen.

## 6. Comportament esperat
- No cal verificar l'email: Google ja el dona per verificat.
- Usuari nou al backend amb `username` = `displayName` de Google, o la part abans de `@` del correu, o `'Usuari'`; `language: 'ca'` fix (es pot canviar a Settings). Si la creació al backend falla, només es registra al log (vegeu [TECH_DEBT M10](../TECH_DEBT.md)).
- La foto de Google és a `firebaseUser.photoURL`, però l'app no la fa servir com a avatar.
- El logout no fa `GoogleSignin.signOut()`: el selector pot recordar el darrer compte.

## 7. Solució de problemes
| Error | Causa | Solució |
|---|---|---|
| `DEVELOPER_ERROR` / codi `10` | SHA-1 no registrat, package diferent o Web Client ID incorrecte | Revisa §2 i §3; espera uns minuts després de canviar-ho; recompila |
| `GOOGLE_SIGNIN_NOT_AVAILABLE` | Expo Go o build sense el mòdul natiu | `npm run android` |
| "No s'ha pogut obtenir l'ID token de Google" | `webClientId` buit o de tipus Android | Revisa `FIREBASE_WEB_CLIENT_ID` i `npx expo start -c` |
| `SIGN_IN_REQUIRED` / Play Services | Emulador sense Google Play o `google-services.json` antic | Fes servir una imatge d'emulador amb Play Store; torna a descarregar el JSON i recompila |
| A EAS falla però en local funciona | Falta el SHA-1 d'EAS o `FIREBASE_WEB_CLIENT_ID` a l'entorn d'EAS | §3; defineix la variable a EAS (**[NO VERIFICAT]** com està configurat ara) |

## Referències
[Firebase — Google Sign-In](https://firebase.google.com/docs/auth/web/google-signin) · [react-native-google-signin](https://github.com/react-native-google-signin/google-signin) · [Expo — Google authentication](https://docs.expo.dev/guides/google-authentication/)
