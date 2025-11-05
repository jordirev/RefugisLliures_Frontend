# Configuració del Login amb Google

## Què s'ha implementat

S'ha implementat l'inici de sessió amb Google a l'aplicació RefugisLliures. La implementació inclou:

1. **Dependències instal·lades:**
   - `@react-native-google-signin/google-signin`: Paquet per a l'autenticació amb Google a React Native
   - `expo-auth-session` i `expo-crypto`: Paquets d'Expo per gestionar l'autenticació

2. **Codi actualitzat:**
   - `firebase.ts`: Afegides les funcions de `signInWithCredential` i `GoogleAuthProvider`
   - `AuthService.ts`: Nou mètode `loginWithGoogle()` per gestionar l'autenticació
   - `AuthContext.tsx`: Afegit mètode `loginWithGoogle` al context
   - `LoginScreen.tsx`: Implementada la funcionalitat del botó de Google
   - Traduccions actualitzades (ca, es, en, fr)

## Configuració necessària

Per completar la integració, cal seguir aquests passos:

### 1. Obtenir el Web Client ID de Firebase

1. Ves a la [Consola de Firebase](https://console.firebase.google.com/)
2. Selecciona el teu projecte
3. Ves a **Configuració del projecte** (icona d'engranatge) > **General**
4. A la secció **Les teves apps**, troba l'app web o crea-ne una nova
5. Busca el **Web Client ID** (sembla això: `123456789-abc123.apps.googleusercontent.com`)

### 2. Configurar Google Cloud Console

1. Ves a la [Consola de Google Cloud](https://console.cloud.google.com/)
2. Selecciona el mateix projecte de Firebase
3. Ves a **APIs i serveis** > **Credencials**
4. Assegura't que tens un **Client ID d'OAuth 2.0** per a l'aplicació web
5. Si vols suport per Android:
   - Crea un nou **Client ID d'OAuth 2.0** per a **Android**
   - Proporciona:
     - **Nom del paquet**: `com.jordirev.refugislliures` (o el teu package name)
     - **Empremta digital del certificat SHA-1**: Obté-la executant:
       ```bash
       # Per a debug
       keytool -keystore ~/.android/debug.keystore -list -v -alias androiddebugkey
       # Contrasenya per defecte: android
       ```
6. Si vols suport per iOS:
   - Crea un nou **Client ID d'OAuth 2.0** per a **iOS**
   - Proporciona el **Bundle ID** de la teva app

### 3. Actualitzar el fitxer .env

Afegeix el Web Client ID al teu fitxer `.env`:

```env
FIREBASE_WEB_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
```

**Nota:** Reemplaça `123456789-abc123.apps.googleusercontent.com` amb el teu Web Client ID real.

### 4. Configurar app.json per a Expo

Afegeix la configuració de Google Sign In al fitxer `app.json`:

```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json",
      "package": "com.jordirev.refugislliures"
    },
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist",
      "bundleIdentifier": "com.jordirev.refugislliures"
    },
    "plugins": [
      "@react-native-google-signin/google-signin"
    ]
  }
}
```

### 5. Descarregar els fitxers de configuració

#### Android (google-services.json)

1. A la Consola de Firebase, ves a **Configuració del projecte**
2. A la secció **Les teves apps**, selecciona l'app Android (o crea-ne una)
3. Descarrega el fitxer `google-services.json`
4. Col·loca'l a l'arrel del projecte

#### iOS (GoogleService-Info.plist)

1. A la Consola de Firebase, ves a **Configuració del projecte**
2. A la secció **Les teves apps**, selecciona l'app iOS (o crea-ne una)
3. Descarrega el fitxer `GoogleService-Info.plist`
4. Col·loca'l a l'arrel del projecte

### 6. Activar Google Sign-In a Firebase

1. A la Consola de Firebase, ves a **Authentication** > **Sign-in method**
2. Activa el proveïdor **Google**
3. Configura:
   - **Nom públic del projecte**: El nom que veuran els usuaris
   - **Correu electrònic d'assistència**: Un correu de contacte
4. Desa els canvis

### 7. Compilar l'aplicació

Després de fer tots aquests canvis, cal recompilar l'app:

```bash
# Neteja la cache
npx expo start --clear

# Per Android
npx expo run:android

# Per iOS
npx expo run:ios
```

## Flux d'autenticació

1. L'usuari prem el botó "Continuar amb Google"
2. S'obre el selector de comptes de Google
3. L'usuari selecciona un compte i autoritza l'app
4. Es rep un token d'identificació (ID Token) de Google
5. Es crea una credencial de Firebase amb aquest token
6. S'autentica l'usuari a Firebase
7. Si és un usuari nou, es crea automàticament al backend amb:
   - Username: Nom de Google o la part abans de @ del correu
   - Email: El correu de Google
   - Idioma: Català per defecte

## Notes importants

- Els usuaris que es registren amb Google **no necessiten verificar el correu** perquè Google ja l'ha verificat
- La foto de perfil de Google es pot obtenir de `firebaseUser.photoURL`
- Si l'usuari cancel·la el procés, no es mostra cap error (comportament esperat)

## Verificació

Per verificar que tot funciona:

1. Prova a iniciar sessió amb un compte de Google
2. Verifica que l'usuari apareix a Firebase Authentication
3. Verifica que l'usuari es crea al backend (revisa els logs)
4. Comprova que la navegació funciona correctament després del login

## Resolució de problemes

### Error: "Developer Error" o "10"
- Verifica que el SHA-1 és correcte
- Assegura't que el package name coincideix
- Espera uns minuts després de canviar la configuració

### Error: "SIGN_IN_REQUIRED"
- Verifica que tens els fitxers `google-services.json` / `GoogleService-Info.plist`
- Recompila l'app després d'afegir-los

### Error: "No web client ID provided"
- Verifica que has afegit `FIREBASE_WEB_CLIENT_ID` al fitxer `.env`
- Reinicia Metro Bundler: `npx expo start --clear`

## Referències

- [Firebase Authentication](https://firebase.google.com/docs/auth/web/google-signin)
- [React Native Google Sign In](https://github.com/react-native-google-signin/google-signin)
- [Expo Google Sign In Guide](https://docs.expo.dev/guides/google-authentication/)
