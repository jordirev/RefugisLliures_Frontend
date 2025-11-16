# 🔄 Fluxes del Sistema d'Autenticació

Aquest document mostra els diferents fluxes del sistema d'autenticació.

## 📊 Flux de Registre (SignUp)

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUX DE REGISTRE                              │
└─────────────────────────────────────────────────────────────────┘

1. Usuari accedeix a SignUpScreen
   │
   ├─> Selecciona idioma (ca/es/en/fr)
   │
   └─> Omple formulari:
       ├─> Nom d'usuari
       ├─> Email
       ├─> Contrasenya
       └─> Confirmar contrasenya

2. Validació al frontend
   │
   ├─> Email vàlid?
   ├─> Contrasenya >= 6 caràcters?
   └─> Contrasenyes coincideixen?
   │
   │ [SI] Continua
   │ [NO] Mostra error traduït
   │
   v

3. AuthService.signUp()
   │
   ├─> 3.1 Firebase.createUserWithEmailAndPassword()
   │   │
   │   ├─> [ÈXIT] Usuari creat a Firebase
   │   │   │
   │   │   └─> 3.2 Firebase.updateProfile()
   │   │       └─> Afegir displayName (username)
   │   │
   │   └─> [ERROR] Retorna error (email en ús, etc.)
   │       └─> Mostra error traduït
   │
   v

4. Firebase.sendEmailVerification()
   │
   └─> Envia email de verificació
       └─> Usuari rep email

5. Firebase.getIdToken()
   │
   └─> Obté token JWT

6. UsersService.createUser()
   │
   ├─> POST /api/users/
   │   └─> Headers: Authorization: Bearer <token>
   │       └─> Body: { username, email, idioma }
   │
   ├─> [ÈXIT] Usuari creat al backend
   │   │
   │   └─> Mostra missatge d'èxit
   │       └─> Redirigeix a LoginScreen
   │
   └─> [ERROR] Falla la creació
       │
       └─> 7. Firebase.deleteUser()
           └─> Reverteix creació a Firebase
           └─> Mostra error
```

## 🔐 Flux de Login

```
┌─────────────────────────────────────────────────────────────────┐
│                      FLUX DE LOGIN                               │
└─────────────────────────────────────────────────────────────────┘

1. Usuari accedeix a LoginScreen
   │
   └─> Omple formulari:
       ├─> Email
       └─> Contrasenya

2. Validació al frontend
   │
   ├─> Email no buit?
   └─> Contrasenya no buida?
   │
   │ [SI] Continua
   │ [NO] Mostra error
   │
   v

3. AuthService.login()
   │
   └─> Firebase.signInWithEmailAndPassword()
       │
       ├─> [ÈXIT] Usuari autenticat
       │   │
       │   └─> 4. Comprovar emailVerified
       │       │
       │       ├─> [NO VERIFICAT]
       │       │   │
       │       │   ├─> Mostra alerta
       │       │   ├─> Opció: Reenviar email
       │       │   │   └─> Firebase.sendEmailVerification()
       │       │   │
       │       │   └─> Firebase.signOut()
       │       │       └─> Tanca sessió
       │       │
       │       └─> [VERIFICAT]
       │           │
       │           └─> 5. Firebase.getIdToken()
       │               │
       │               └─> 6. AuthContext actualitza estat
       │                   │
       │                   ├─> firebaseUser = user
       │                   ├─> authToken = token
       │                   ├─> isAuthenticated = true
       │                   │
       │                   └─> 7. UsersService.getUserByUid()
       │                       │
       │                       ├─> GET /api/users/{uid}/
       │                       │   └─> Headers: Authorization: Bearer <token>
       │                       │
       │                       └─> backendUser = userData
       │                           │
       │                           └─> Redirigeix a MainApp
       │
       └─> [ERROR] Credencials incorrectes
           └─> Mostra error traduït
```

## 🔄 Flux de Recuperació de Contrasenya

```
┌─────────────────────────────────────────────────────────────────┐
│               FLUX DE RECUPERACIÓ DE CONTRASENYA                 │
└─────────────────────────────────────────────────────────────────┘

1. Usuari a LoginScreen
   │
   └─> Clic a "Has oblidat la contrasenya?"

2. Mostra diàleg (Alert.prompt)
   │
   └─> Introdueix email

3. AuthService.resetPassword(email)
   │
   └─> Firebase.sendPasswordResetEmail(email)
       │
       ├─> [ÈXIT] Email enviat
       │   │
       │   └─> Mostra confirmació
       │       └─> Usuari comprova safata d'entrada
       │           │
       │           └─> 4. Clic a l'enllaç a l'email
       │               │
       │               └─> Firebase obre pàgina per restablir
       │                   │
       │                   └─> Usuari introdueix nova contrasenya
       │                       │
       │                       └─> Firebase actualitza contrasenya
       │                           │
       │                           └─> 5. Torna a LoginScreen
       │                               └─> Inicia sessió amb nova contrasenya
       │
       └─> [ERROR] Email no trobat / error de xarxa
           └─> Mostra error traduït
```

## 🔄 Flux del Context d'Autenticació

```
┌─────────────────────────────────────────────────────────────────┐
│                   FLUX DEL AuthContext                           │
└─────────────────────────────────────────────────────────────────┘

1. App.js
   │
   └─> <AuthProvider>
       │
       └─> useEffect() al muntar
           │
           └─> Firebase.onAuthStateChanged()
               │
               └─> Subscripció activa
                   │
                   ├─> [CANVI D'ESTAT]
                   │   │
                   │   ├─> user !== null
                   │   │   │
                   │   │   ├─> 2. setFirebaseUser(user)
                   │   │   │
                   │   │   ├─> 3. user.getIdToken()
                   │   │   │   └─> setAuthToken(token)
                   │   │   │
                   │   │   └─> 4. UsersService.getUserByUid(uid, token)
                   │   │       │
                   │   │       └─> setBackendUser(userData)
                   │   │           │
                   │   │           └─> setIsLoading(false)
                   │   │
                   │   └─> user === null
                   │       │
                   │       ├─> setFirebaseUser(null)
                   │       ├─> setAuthToken(null)
                   │       ├─> setBackendUser(null)
                   │       └─> setIsLoading(false)
                   │
                   └─> Components reben actualitzacions
                       │
                       └─> useAuth() retorna nou estat
```

## 🔄 Flux de Renovació de Token

```
┌─────────────────────────────────────────────────────────────────┐
│                  FLUX DE RENOVACIÓ DE TOKEN                      │
└─────────────────────────────────────────────────────────────────┘

1. Component necessita fer crida al backend
   │
   └─> const { authToken } = useAuth()

2. Fa crida a backend
   │
   └─> fetch('/api/endpoint', {
       headers: { Authorization: `Bearer ${authToken}` }
     })

3. Backend comprova token
   │
   ├─> [TOKEN VÀLID]
   │   └─> Processa petició
   │       └─> Retorna resposta
   │
   └─> [TOKEN CADUCAT / INVÀLID]
       │
       └─> 4. Backend retorna 401 Unauthorized
           │
           └─> 5. Frontend captura error
               │
               └─> const { refreshToken } = useAuth()
                   │
                   └─> 6. refreshToken()
                       │
                       └─> Firebase.getIdToken(forceRefresh: true)
                           │
                           ├─> [ÈXIT] Nou token obtingut
                           │   │
                           │   └─> setAuthToken(newToken)
                           │       │
                           │       └─> 7. Repeteix crida original
                           │           └─> Amb nou token
                           │
                           └─> [ERROR] No es pot renovar
                               │
                               └─> logout()
                                   └─> Redirigeix a LoginScreen
```

## 📊 Flux de Tancar Sessió

```
┌─────────────────────────────────────────────────────────────────┐
│                   FLUX DE TANCAR SESSIÓ                          │
└─────────────────────────────────────────────────────────────────┘

1. Usuari fa clic a "Tancar sessió"
   │
   └─> const { logout } = useAuth()
       │
       └─> logout()

2. AuthService.logout()
   │
   └─> Firebase.signOut()
       │
       └─> Firebase elimina sessió

3. Firebase.onAuthStateChanged()
   │
   └─> Detecta user = null
       │
       └─> AuthContext actualitza estat
           │
           ├─> setFirebaseUser(null)
           ├─> setBackendUser(null)
           ├─> setAuthToken(null)
           └─> setIsAuthenticated(false)

4. Components reben actualització
   │
   └─> Redirigeix a LoginScreen
```

## 🔄 Diagrama de Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA DE COMPONENTS                    │
└─────────────────────────────────────────────────────────────────┘

App.js
  │
  └─> <AuthProvider>
      │
      ├─> [Context Global]
      │   ├─> firebaseUser
      │   ├─> backendUser
      │   ├─> authToken
      │   ├─> isAuthenticated
      │   └─> Funcions (login, logout, etc.)
      │
      └─> MainComponent
          │
          ├─> isAuthenticated?
          │   │
          │   ├─> [NO] LoginScreen
          │   │   ├─> Formulari login
          │   │   ├─> Link a SignUpScreen
          │   │   └─> Recuperació contrasenya
          │   │
          │   └─> [SI] MainApp
          │       │
          │       ├─> MapScreen
          │       ├─> FavoritesScreen
          │       ├─> ProfileScreen
          │       │   └─> Usa authToken per actualitzar
          │       └─> SettingsScreen
          │
          └─> SignUpScreen
              ├─> Selecció idioma
              ├─> Formulari registre
              └─> Link a LoginScreen
```

## 🔐 Flux de Seguretat

```
┌─────────────────────────────────────────────────────────────────┐
│                      FLUX DE SEGURETAT                           │
└─────────────────────────────────────────────────────────────────┘

Usuari                Firebase Auth          Backend
  │                        │                    │
  ├─ Login ──────────────> │                    │
  │                        │                    │
  │ <─── Token JWT ────────┤                    │
  │                        │                    │
  ├─ Crida API ────────────┼─────────────────> │
  │   (Bearer Token)       │                    │
  │                        │                    ├─ Verifica token
  │                        │                    │  (Firebase Admin SDK)
  │                        │                    │
  │                        │                    ├─ [VÀLID]
  │ <───── Resposta ───────┼────────────────────┤
  │                        │                    │
  │                        │                    └─ [INVÀLID]
  │ <───── 401 ────────────┼────────────────────┤
  │                        │                    │
  ├─ Renovar token ──────> │                    │
  │                        │                    │
  │ <─── Nou token ────────┤                    │
  │                        │                    │
  └─ Retry crida ──────────┼─────────────────> │
```

---

Aquest document proporciona una visió completa de tots els fluxes del sistema d'autenticació implementat.
