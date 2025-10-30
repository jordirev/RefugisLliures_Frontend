# 🔥 Configuració de Firebase - Guia Pas a Pas

## ⚠️ ERROR ACTUAL
Si estàs veient l'error `Missing App configuration value: "projectId"`, és perquè el fitxer `.env` no està configurat correctament amb les credencials de Firebase.

## 📝 Solució Ràpida

### Pas 1: Obtenir les Credencials de Firebase

1. Ves a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona el teu projecte (o crea'n un de nou)
3. Fes clic a l'icona d'engranatge ⚙️ al costat de "Project Overview"
4. Selecciona **"Project settings"**
5. Desplaça't fins a la secció **"Your apps"**
6. Si ja tens una app web:
   - Fes clic a l'app web existent
   - Copia la configuració
7. Si NO tens una app web:
   - Fes clic al botó **"</>  Web"**
   - Dona-li un nom (ex: "RefugisLliures Web")
   - Fes clic a "Register app"
   - Copia la configuració que apareix

### Pas 2: Configurar el Fitxer .env

Obri el fitxer `.env` a l'arrel del projecte i substitueix els valors d'exemple amb els teus:

```env
FIREBASE_API_KEY=AIzaSy...  # El teu apiKey real
FIREBASE_AUTH_DOMAIN=refugislliures-xxxxx.firebaseapp.com
FIREBASE_PROJECT_ID=refugislliures-xxxxx
FIREBASE_STORAGE_BUCKET=refugislliures-xxxxx.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Exemple de configuració real:**
```javascript
// Això és el que veus a Firebase Console:
const firebaseConfig = {
  apiKey: "AIzaSyC-Xf5Q...",
  authDomain: "refugislliures-12345.firebaseapp.com",
  projectId: "refugislliures-12345",
  storageBucket: "refugislliures-12345.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456",
  measurementId: "G-ABC12DEF34"
};

// Això és el que poses al .env:
FIREBASE_API_KEY=AIzaSyC-Xf5Q...
FIREBASE_AUTH_DOMAIN=refugislliures-12345.firebaseapp.com
FIREBASE_PROJECT_ID=refugislliures-12345
FIREBASE_STORAGE_BUCKET=refugislliures-12345.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:web:abc123def456
FIREBASE_MEASUREMENT_ID=G-ABC12DEF34
```

### Pas 3: Habilitar Authentication

1. A Firebase Console, ves a **Authentication**
2. Fes clic a **"Get started"** si és la primera vegada
3. Ves a la pestanya **"Sign-in method"**
4. Habilita **"Email/Password"**:
   - Fes clic a "Email/Password"
   - Activa l'interruptor "Enable"
   - Fes clic a "Save"

### Pas 4: Reiniciar el Servidor

**IMPORTANT:** Després de modificar el fitxer `.env`, has de reiniciar el servidor:

```bash
# Atura el servidor actual (Ctrl+C)

# Neteja la cache
npx expo start -c

# O alternativament:
npm start -- --clear
```

## 🔍 Verificar la Configuració

Després de configurar, verifica que:

1. ✅ El fitxer `.env` existeix a l'arrel del projecte
2. ✅ Tots els valors de Firebase estan omplerts (sense "your-project-id")
3. ✅ Has reiniciat el servidor de desenvolupament
4. ✅ Authentication està habilitat a Firebase Console

## 🐛 Resolució de Problemes

### Error: "projectId is undefined"
**Causa:** El fitxer `.env` no existeix o no té el valor correcte
**Solució:** 
- Verifica que el fitxer `.env` està a l'arrel del projecte
- Comprova que `FIREBASE_PROJECT_ID` està definit
- Reinicia el servidor amb `npx expo start -c`

### Error: "auth/invalid-api-key"
**Causa:** L'API key no és correcta
**Solució:**
- Torna a copiar l'API key des de Firebase Console
- Assegura't que no hi ha espais al principi o final
- Verifica que no hi ha cometes al voltant del valor

### Els canvis al .env no s'apliquen
**Causa:** La cache no s'ha netejat
**Solució:**
```bash
# Atura el servidor (Ctrl+C)

# Neteja completament
npx expo start -c

# O elimina la cache manualment:
rm -rf node_modules/.cache
npx expo start
```

### Error: "Cannot find module '@env'"
**Causa:** TypeScript no reconeix el mòdul @env
**Solució:**
- El fitxer `src/types/env.d.ts` ja està creat
- Reinicia l'editor (VS Code)
- Reinicia el servidor TypeScript a VS Code (Cmd/Ctrl+Shift+P > "TypeScript: Restart TS Server")

## 📋 Checklist Final

Abans de continuar, verifica:

- [ ] He creat/modificat el fitxer `.env` a l'arrel del projecte
- [ ] He copiat TOTS els valors de Firebase Console
- [ ] No hi ha valors d'exemple com "your-project-id"
- [ ] He habilitat Email/Password a Firebase Authentication
- [ ] He reiniciat el servidor amb `npx expo start -c`
- [ ] L'aplicació ja no mostra l'error de "projectId"

## 🔐 Seguretat

**IMPORTANT:**
- ❌ NO commitegis el fitxer `.env` amb credencials reals
- ✅ El fitxer `.env` ja està al `.gitignore`
- ✅ Utilitza `.env.example` per compartir la plantilla
- ✅ Cada desenvolupador ha de tenir el seu propi `.env`

## 📚 Documentació Addicional

Per més informació sobre la configuració completa del sistema d'autenticació:
- `AUTH_QUICK_START.md` - Guia ràpida
- `AUTHENTICATION_README.md` - Documentació completa
- `SETUP_CHECKLIST.md` - Checklist complet

## ❓ Necessites Ajuda?

Si després de seguir aquests passos encara tens problemes:
1. Comprova que el projecte Firebase està actiu
2. Verifica que no hi ha quotes superades
3. Revisa els logs de Firebase Console
4. Comprova que tens permisos al projecte Firebase

---

**Última actualització:** Octubre 2025
