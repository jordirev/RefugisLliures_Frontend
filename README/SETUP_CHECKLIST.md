# ✅ Checklist de Configuració d'Autenticació

Segueix aquests passos per configurar completament el sistema d'autenticació:

## 📋 Passos de Configuració

### 1. Firebase Console
- [ ] Crear projecte a [Firebase Console](https://console.firebase.google.com/)
  - [ ] Clic a "Add project" o "Afegir projecte"
  - [ ] Seguir els passos de creació
  - [ ] Habilitar Google Analytics (opcional)

- [ ] Afegir aplicació web al projecte
  - [ ] Project Settings > General
  - [ ] Scroll down to "Your apps"
  - [ ] Clic a l'icona web (</>)
  - [ ] Registrar l'app amb un nom

- [ ] Copiar la configuració de Firebase
  - [ ] Guardar els valors:
    ```
    apiKey
    authDomain
    projectId
    storageBucket
    messagingSenderId
    appId
    measurementId
    ```

### 2. Habilitar Autenticació
- [ ] Anar a **Authentication** al menú lateral
- [ ] Clic a "Get started" si és la primera vegada
- [ ] Anar a la pestanya **Sign-in method**
- [ ] Habilitar **Email/Password**
  - [ ] Clic a "Email/Password"
  - [ ] Activar l'interruptor "Enable"
  - [ ] Guardar

### 3. Configurar Plantilles d'Email
- [ ] Anar a **Authentication > Templates**
- [ ] Personalitzar plantilles (opcional):
  - [ ] Email address verification
  - [ ] Password reset
  - [ ] Email address change

### 4. Configurar Variables d'Entorn
- [ ] Crear fitxer `.env` a l'arrel del projecte
  ```bash
  cp .env.example .env
  ```
- [ ] Editar `.env` amb els valors de Firebase:
  ```env
  FIREBASE_API_KEY=<el teu apiKey>
  FIREBASE_AUTH_DOMAIN=<el teu authDomain>
  FIREBASE_PROJECT_ID=<el teu projectId>
  FIREBASE_STORAGE_BUCKET=<el teu storageBucket>
  FIREBASE_MESSAGING_SENDER_ID=<el teu messagingSenderId>
  FIREBASE_APP_ID=<el teu appId>
  FIREBASE_MEASUREMENT_ID=<el teu measurementId>
  ```

### 5. Configurar .gitignore
- [ ] Verificar que `.env` està al `.gitignore`:
  ```
  # Environment variables
  .env
  .env.local
  ```

### 6. Integrar a l'Aplicació
- [ ] Obrir `App.js` o el component principal
- [ ] Importar `AuthProvider`:
  ```tsx
  import { AuthProvider } from './src/contexts/AuthContext';
  ```
- [ ] Envolta l'aplicació amb el provider:
  ```tsx
  function App() {
    return (
      <AuthProvider>
        {/* El teu component principal */}
      </AuthProvider>
    );
  }
  ```

### 7. Provar la Implementació

#### Registre
- [ ] Executar l'aplicació
- [ ] Anar a la pantalla de registre
- [ ] Seleccionar idioma
- [ ] Omplir el formulari:
  - [ ] Nom d'usuari
  - [ ] Email (utilitzar un email real)
  - [ ] Contrasenya (mínim 6 caràcters)
  - [ ] Confirmar contrasenya
- [ ] Clic a "Registrar-se"
- [ ] Verificar que es mostra el missatge d'èxit
- [ ] Comprovar la safata d'entrada per l'email de verificació
- [ ] Clic a l'enllaç de verificació

#### Login
- [ ] Anar a la pantalla de login
- [ ] Introduir email i contrasenya
- [ ] Clic a "Iniciar sessió"
- [ ] Si l'email no està verificat:
  - [ ] Verificar que es mostra el missatge
  - [ ] Provar l'opció "Reenviar email de verificació"
- [ ] Si l'email està verificat:
  - [ ] Verificar que s'inicia sessió correctament

#### Recuperació de Contrasenya
- [ ] Anar a la pantalla de login
- [ ] Clic a "Has oblidat la contrasenya?"
- [ ] Introduir email
- [ ] Clic a "Enviar correu"
- [ ] Comprovar la safata d'entrada
- [ ] Seguir l'enllaç i establir nova contrasenya
- [ ] Iniciar sessió amb la nova contrasenya

### 8. Verificar Backend
- [ ] El backend ha d'acceptar tokens JWT de Firebase
- [ ] Verificar que els endpoints funcionen amb el token:
  ```typescript
  Authorization: Bearer <token>
  ```
- [ ] Provar crear/obtenir/actualitzar usuaris amb token

### 9. Consola de Firebase (Verificació)
- [ ] Anar a **Authentication > Users**
- [ ] Verificar que es creen els usuaris correctament
- [ ] Comprovar que l'estat de verificació és correcte

### 10. Documentació
- [ ] Llegir `AUTHENTICATION_README.md` per més detalls
- [ ] Consultar `AUTH_QUICK_START.md` per guia ràpida
- [ ] Revisar `src/examples/AuthExamples.tsx` per exemples

## 🐛 Resolució de Problemes

### "Firebase: Error (auth/configuration-not-found)"
- [ ] Verificar que `.env` existeix i té valors correctes
- [ ] Reiniciar el servidor de desenvolupament
- [ ] Verificar que les variables tenen els noms correctes

### "Firebase: Error (auth/invalid-api-key)"
- [ ] Verificar que l'API key és correcta
- [ ] Copiar de nou des de Firebase Console
- [ ] Reiniciar l'aplicació

### No arriba l'email de verificació
- [ ] Comprovar la safata de spam
- [ ] Verificar que l'email és correcte
- [ ] Provar reenviar l'email
- [ ] Comprovar la configuració SMTP a Firebase Console

### "Email already in use"
- [ ] L'email ja està registrat
- [ ] Utilitzar un altre email
- [ ] O recuperar la contrasenya

### Token expirat
- [ ] El backend pot estar rebutjant tokens caducats
- [ ] Implementar renovació automàtica de tokens
- [ ] Verificar la configuració del backend

### Errors de xarxa
- [ ] Verificar connexió a internet
- [ ] Comprovar que Firebase no està bloquejat
- [ ] Verificar configuració de CORS si és web

## 📱 Plataformes

### Web
- [ ] Provar al navegador
- [ ] Verificar que funcionen les alerts
- [ ] Comprovar localStorage (si s'utilitza)

### iOS
- [ ] Configurar iOS a Firebase Console
- [ ] Provar a simulator/dispositiu
- [ ] Verificar permisos

### Android
- [ ] Configurar Android a Firebase Console
- [ ] Afegir google-services.json
- [ ] Provar a emulador/dispositiu
- [ ] Verificar permisos

## ✅ Verificació Final

- [ ] Els usuaris es creen correctament a Firebase
- [ ] Els usuaris es creen correctament al backend
- [ ] Els tokens s'obtenen i s'envien correctament
- [ ] La verificació d'email funciona
- [ ] La recuperació de contrasenya funciona
- [ ] Els errors es mostren traduïts correctament
- [ ] El context d'autenticació funciona correctament
- [ ] Les pantalles naveguen correctament

## 🎉 Completat!

Si has marcat tots els checkboxes, el sistema d'autenticació està configurat i funcionant correctament!

Per a més informació:
- Consulta `AUTHENTICATION_README.md`
- Revisa `IMPLEMENTATION_SUMMARY.md`
- Mira els exemples a `src/examples/AuthExamples.tsx`
