# Implementació d'Autenticació amb Firebase

Aquest document explica la implementació del sistema d'autenticació integrant Firebase Auth amb el backend de Refugis Lliures.

## 📋 Funcionalitats Implementades

### 1. Registre d'Usuaris (Sign Up)
- ✅ Creació d'usuari amb Firebase Auth
- ✅ Actualització del perfil amb nom d'usuari
- ✅ Enviament automàtic d'email de verificació
- ✅ Creació de l'usuari al backend amb token d'autenticació
- ✅ Reversió si falla la creació al backend (elimina l'usuari de Firebase)

### 2. Inici de Sessió (Login)
- ✅ Autenticació amb Firebase Auth
- ✅ Verificació de l'estat del correu electrònic
- ✅ Opció per reenviar email de verificació
- ✅ Obtenció del token JWT per autenticar amb el backend

### 3. Recuperació de Contrasenya
- ✅ Enviament d'email per restablir contrasenya
- ✅ Gestió d'errors amb missatges traduïts

### 4. Gestió de Tokens
- ✅ Obtenció automàtica del token en iniciar sessió
- ✅ Renovació del token quan sigui necessari
- ✅ Enviament del token com a Bearer token als endpoints del backend

### 5. Context d'Autenticació
- ✅ Context React per gestionar l'estat global d'autenticació
- ✅ Subscripció automàtica als canvis d'estat de Firebase
- ✅ Sincronització entre Firebase i backend
- ✅ Actualització automàtica del token

## 🗂️ Estructura de Fitxers

```
src/
├── services/
│   ├── firebase.ts              # Configuració i exports de Firebase
│   ├── AuthService.ts           # Servei d'autenticació amb Firebase
│   └── UsersService.ts          # Actualitzat amb suport per tokens
├── contexts/
│   └── AuthContext.tsx          # Context d'autenticació global
├── screens/
│   ├── LoginScreen.tsx          # Pantalla de login actualitzada
│   └── SignUpScreen.tsx         # Pantalla de registre actualitzada
└── i18n/
    └── locales/
        ├── ca.json              # Traduccions en català
        ├── es.json              # Traduccions en espanyol
        ├── en.json              # Traduccions en anglès
        └── fr.json              # Traduccions en francès
```

## 🔧 Configuració

### 1. Variables d'Entorn

Crea un fitxer `.env` a l'arrel del projecte amb la configuració de Firebase:

```bash
FIREBASE_API_KEY=your_api_key_here
FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_app_id
FIREBASE_MEASUREMENT_ID=your_measurement_id
```

**Important:** Pots trobar aquests valors a la consola de Firebase:
1. Ves a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona el teu projecte
3. Ves a Project Settings > General
4. Desplaça't fins a "Your apps" i selecciona la teva web app
5. Copia la configuració

### 2. Habilitar Autenticació a Firebase

1. A la consola de Firebase, ves a **Authentication**
2. A la pestanya **Sign-in method**, habilita:
   - **Email/Password**
3. Configura les plantilles d'email a **Templates**:
   - Email verification
   - Password reset

### 3. Integrar el Context d'Autenticació

Envolta la teva aplicació amb el `AuthProvider`:

```tsx
import { AuthProvider } from './src/contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      {/* El teu component principal */}
    </AuthProvider>
  );
}
```

## 💻 Ús

### Utilitzar el Context d'Autenticació

```tsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { 
    firebaseUser,      // Usuari de Firebase
    backendUser,       // Usuari del backend
    authToken,         // Token JWT
    isAuthenticated,   // Si l'usuari està autenticat i verificat
    isLoading,         // Si s'està carregant l'estat
    login,             // Funció per iniciar sessió
    signup,            // Funció per registrar-se
    logout,            // Funció per tancar sessió
    refreshToken,      // Funció per renovar el token
    reloadUser         // Funció per recarregar dades de l'usuari
  } = useAuth();

  // Exemple: Comprovar si està autenticat
  if (isLoading) {
    return <Text>Carregant...</Text>;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <MainApp />;
}
```

### Fer Crides al Backend amb Token

El `UsersService` i altres serveis que facin crides al backend ja estan actualitzats per acceptar el token:

```tsx
import { useAuth } from '../contexts/AuthContext';
import { UsersService } from '../services/UsersService';

function MyComponent() {
  const { firebaseUser, authToken } = useAuth();

  const updateUserProfile = async () => {
    if (!firebaseUser || !authToken) return;

    const updatedUser = await UsersService.updateUser(
      firebaseUser.uid,
      {
        username: 'NouNom',
        idioma: 'ca'
      },
      authToken  // Token enviat com a header Authorization: Bearer <token>
    );
  };
}
```

### Gestionar Errors d'Autenticació

Tots els errors de Firebase tenen traduccions associades:

```tsx
try {
  await login(email, password);
} catch (error: any) {
  const errorCode = error?.code || 'unknown';
  const errorMessageKey = AuthService.getErrorMessageKey(errorCode);
  const errorMessage = t(errorMessageKey);
  Alert.alert(t('common.error'), errorMessage);
}
```

## 🔐 Seguretat

### Tokens JWT

- Els tokens JWT s'obtenen automàticament de Firebase Auth
- S'envien com a `Authorization: Bearer <token>` headers
- Es renoven automàticament quan caduquen
- No s'emmagatzemen en localStorage (es mantenen a la memòria)

### Verificació d'Email

- Els usuaris no poden iniciar sessió sense verificar el seu email
- Es pot reenviar l'email de verificació des de la pantalla de login
- La sessió es tanca automàticament si l'email no està verificat

### Recuperació de Contrasenya

- Firebase gestiona l'enviament d'emails de recuperació
- Els enllaços de recuperació caduquen automàticament
- Es poden personalitzar les plantilles d'email a la consola de Firebase

## 📱 Fluxe d'Usuari

### Registre

1. L'usuari selecciona l'idioma
2. Omple el formulari (nom d'usuari, email, contrasenya)
3. Es crea l'usuari a Firebase Auth
4. S'envia un email de verificació
5. Es crea l'usuari al backend amb el token JWT
6. Es mostra un missatge d'èxit

### Login

1. L'usuari introdueix email i contrasenya
2. Firebase Auth valida les credencials
3. Es comprova si l'email està verificat
4. Si no està verificat, es mostra opció per reenviar l'email
5. Si està verificat, s'obté el token JWT
6. Es carreguen les dades de l'usuari des del backend
7. L'usuari accedeix a l'aplicació

### Recuperar Contrasenya

1. L'usuari fa clic a "Has oblidat la contrasenya?"
2. Introdueix el seu email
3. Firebase envia un email amb enllaç de recuperació
4. L'usuari segueix l'enllaç i defineix una nova contrasenya
5. Pot iniciar sessió amb la nova contrasenya

## 🧪 Proves

### Provar el Registre

```bash
# Utilitza un email real per provar la verificació
email: test@example.com
username: TestUser
password: Test123!
```

### Provar el Login

```bash
# Assegura't que l'email està verificat
email: test@example.com
password: Test123!
```

### Provar la Recuperació de Contrasenya

```bash
# Introdueix un email existent
email: test@example.com
# Comprova la safata d'entrada per l'email de recuperació
```

## 🐛 Errors Comuns

### "Firebase: Error (auth/configuration-not-found)"
- **Solució:** Comprova que les variables d'entorn al `.env` són correctes

### "Firebase: Error (auth/invalid-api-key)"
- **Solució:** Verifica que l'API key és vàlida a la consola de Firebase

### "Network request failed"
- **Solució:** Comprova la connexió a internet i que Firebase està habilitat

### "Email already in use"
- **Solució:** L'email ja està registrat. Prova amb un altre o recupera la contrasenya

### "Token expired"
- **Solució:** Crida `refreshToken()` del context per obtenir un token nou

## 📚 Referències

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [React Native Firebase](https://rnfirebase.io/)
- [Firebase Console](https://console.firebase.google.com/)

## 🤝 Contribuir

Si trobes algun problema o tens suggeriments, si us plau:
1. Crea un issue al repositori
2. Proposa canvis via Pull Request
3. Documenta els canvis realitzats

---

**Nota:** Aquest sistema d'autenticació està integrat amb el backend de Refugis Lliures i requereix que el backend estigui configurat per acceptar tokens JWT de Firebase.
