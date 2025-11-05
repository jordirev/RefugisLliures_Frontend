# Inici de Sessió amb Google - Guia Ràpida

## ✅ Què s'ha fet

He implementat el sistema d'autenticació amb Google a la teva aplicació. Els canvis inclouen:

### Codi actualitzat
- ✅ Nou mètode `loginWithGoogle()` a `AuthService`
- ✅ Integració al `AuthContext`
- ✅ Botó de Google funcional al `LoginScreen`
- ✅ Traduccions afegides (CA, ES, EN, FR)
- ✅ Paquets instal·lats: `@react-native-google-signin/google-signin`

### Fitxers modificats
- `src/services/firebase.ts`
- `src/services/AuthService.ts`
- `src/contexts/AuthContext.tsx`
- `src/screens/LoginScreen.tsx`
- `src/types/env.d.ts`
- `src/i18n/locales/*.json`
- `app.json`

## 🔧 Passos de configuració necessaris

### 1️⃣ Afegir el Web Client ID al fitxer .env

Crea un fitxer `.env` a l'arrel del projecte (si no el tens) amb:

```env
FIREBASE_WEB_CLIENT_ID=el-teu-web-client-id.apps.googleusercontent.com
```

**Com obtenir-lo:**
1. Ves a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona el teu projecte
3. Configuració del projecte > General
4. A "Les teves apps", troba l'app web
5. Copia el **Web Client ID**

### 2️⃣ Activar Google Sign-In a Firebase

1. Firebase Console > Authentication > Sign-in method
2. Habilita el proveïdor **Google**
3. Configura el nom públic i el correu d'assistència
4. Desa

### 3️⃣ Configurar Android (si desenvolupes per Android)

1. Obté l'empremta SHA-1:
   ```powershell
   keytool -keystore $HOME\.android\debug.keystore -list -v -alias androiddebugkey
   ```
   (Contrasenya: `android`)

2. Afegeix-la a Firebase:
   - Firebase Console > Configuració del projecte
   - A la secció Android app, afegeix l'empremta SHA-1

3. Descarrega `google-services.json` i col·loca'l a l'arrel del projecte

### 4️⃣ Recompilar l'app

```powershell
npx expo start --clear
```

Després pots executar en Android/iOS amb:
```powershell
npx expo run:android
# o
npx expo run:ios
```

## 📖 Documentació completa

Per a més detalls, consulta: `README/GOOGLE_LOGIN_SETUP.md`

## 🧪 Com provar-ho

1. Inicia l'app
2. A la pantalla de Login, prem "Continuar amb Google"
3. Selecciona un compte de Google
4. L'app hauria de fer login automàticament

## ⚠️ Notes importants

- Els usuaris de Google **NO necessiten verificar el correu** (Google ja ho fa)
- Si és un usuari nou, es crea automàticament al backend
- El nom d'usuari es pren del nom de Google
- L'idioma per defecte és el català (es pot canviar després)

## 🐛 Problemes comuns

**Error "Developer Error"**: Verifica que el SHA-1 és correcte i espera uns minuts.

**Error "No web client ID"**: Assegura't que has afegit la variable al `.env` i reinicia Metro amb `--clear`.

**L'app no es compila**: Verifica que has afegit el plugin a `app.json` (ja està fet).

---

✨ Ara la teva app suporta login amb Google!
