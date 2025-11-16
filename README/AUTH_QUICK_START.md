# 🔐 Guia Ràpida d'Autenticació

## 📝 Resum

S'ha implementat un sistema complet d'autenticació que integra **Firebase Auth** amb el backend de **Refugis Lliures**. Inclou:

- ✅ Registre d'usuaris (SignUp)
- ✅ Inici de sessió (Login)
- ✅ Verificació de correu electrònic
- ✅ Recuperació de contrasenya
- ✅ Gestió de tokens JWT
- ✅ Context global d'autenticació

## 🚀 Començar Ràpidament

### 1. Configurar Firebase

```bash
# 1. Copia el fitxer d'exemple
cp .env.example .env

# 2. Edita .env amb les teves credencials de Firebase
# (Obtén-les de https://console.firebase.google.com/)
```

### 2. Habilitar Autenticació a Firebase Console

1. Ves a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona el teu projecte
3. **Authentication** → **Sign-in method**
4. Habilita **Email/Password**

### 3. Integrar a l'App

```tsx
// A App.js o el teu component principal
import { AuthProvider } from './src/contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <YourMainComponent />
    </AuthProvider>
  );
}
```

## 💡 Ús Bàsic

### En qualsevol component:

```tsx
import { useAuth } from './src/contexts/AuthContext';

function MyComponent() {
  const { 
    isAuthenticated,  // true si l'usuari està autenticat
    firebaseUser,     // Dades de Firebase
    backendUser,      // Dades del backend
    authToken,        // Token JWT
    logout            // Funció per tancar sessió
  } = useAuth();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <MainApp />;
}
```

## 📁 Fitxers Creats/Modificats

### Nous fitxers:
- `src/services/AuthService.ts` - Servei d'autenticació
- `src/contexts/AuthContext.tsx` - Context global
- `src/examples/AuthExamples.tsx` - Exemples d'ús
- `AUTHENTICATION_README.md` - Documentació completa

### Modificats:
- `src/services/firebase.ts` - Afegit suport per Auth
- `src/services/UsersService.ts` - Suport per tokens
- `src/screens/LoginScreen.tsx` - Implementat login real
- `src/screens/SignUpScreen.tsx` - Implementat registre real
- `src/i18n/locales/*.json` - Traduccions d'errors

## 🔍 Més Informació

Consulta `AUTHENTICATION_README.md` per:
- Documentació detallada
- Exemples complets
- Gestió d'errors
- Resolució de problemes
- Referències

## ⚠️ Important

1. **No commitegis el fitxer `.env`** amb les teves credencials
2. Afegeix `.env` al `.gitignore`
3. Verifica que Firebase està configurat correctament
4. El backend ha d'acceptar tokens JWT de Firebase

## 🐛 Problemes Comuns

**Error: "Firebase: Error (auth/configuration-not-found)"**
→ Comprova que el fitxer `.env` existeix i té valors vàlids

**Error: "Email already in use"**
→ L'email ja està registrat. Prova amb un altre o recupera la contrasenya

**Email no verificat**
→ Comprova la safata d'entrada (i spam) per l'email de verificació

---

Per més ajuda, consulta `AUTHENTICATION_README.md` o `src/examples/AuthExamples.tsx`
