# Flux 3 — Perfil, avatar, configuració, idioma i esborrat de compte

> **[FET]** comprovat al codi · **[INFERÈNCIA]** deducció · **[NO VERIFICAT]** depèn de config externa.

## Pantalles i peces
| Funcionalitat | Entrada | Servei / Firebase |
|---|---|---|
| Veure perfil | `src/screens/ProfileScreen.tsx` (`useUser`, `useVisitedRefuges`, L40-41) | `GET /api/users/{uid}/`, `GET /api/users/{uid}/visited-refuges/` |
| Avatar | `src/components/AvatarPopup.tsx` + `useMediaUpload` (target `avatar`) | `POST /api/media/upload-intents/` → PUT R2 → `confirm`; `DELETE /api/users/{uid}/avatar/` |
| Confirmació d'edat | `src/screens/AgeGateScreen.tsx` (des d'`AppNavigator`) → `AuthContext.confirmAge` | `PATCH /api/users/{uid}/age-confirmation/` |
| Avisos de moderació | `src/components/ModerationNoticesCard.tsx` al perfil (`useModerationNotices`) | `GET /api/users/{uid}/moderation-notices/` |
| Gestió de denúncies (admin) | `SettingsScreen` → `MediaReportsScreen` | `GET/PATCH /api/admin/media-reports/` |
| Nom d'usuari | `src/screens/EditProfileScreen.tsx:51-91` → `AuthContext.updateUsername` (198-219) | `PATCH /api/users/{uid}/` |
| Email | `src/screens/ChangeEmailScreen.tsx:51-109` → `AuthService.changeEmail` (421-463) | Firebase `reauthenticateWithCredential` + `verifyBeforeUpdateEmail` |
| Contrasenya | `src/screens/ChangePasswordScreen.tsx:82-142` → `AuthService.changePassword` (392-411) | Firebase `reauthenticateWithCredential` + `updatePassword` |
| Idioma | `src/screens/SettingsScreen.tsx:91-101` → `src/components/LanguageSelector.tsx:23-61` | `changeLanguage` + `PATCH /api/users/{uid}/ {language}` |
| Esborrar compte | `src/screens/SettingsScreen.tsx:153-177` → `AuthService.deleteAccount` | `DELETE /api/users/{uid}/` (el backend esborra dades i compte de Firebase) + `signOut` local |

## Diagrama — pujar avatar

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuari
    participant AP as AvatarPopup
    participant H as useMediaUpload
    participant PK as Picker
    participant BE as Backend
    participant R2 as R2

    U->>AP: Canviar foto
    AP->>H: ensureRightsConfirmed (1 cop per sessió)
    alt build nativa
        AP->>PK: react-native-image-crop-picker (512x512, retall circular)
    else web / Expo Go
        H->>PK: expo-image-picker (només imatges)
    end
    AP->>H: pickAndUpload({target:'avatar', uid}, {imagesOnly, assets})
    H->>H: llista blanca (només imatges) + WebP ≤1024 px
    H->>BE: POST /api/media/upload-intents/ {target:'avatar'}
    H->>R2: PUT URL prefirmada
    H->>BE: POST .../confirm/
    H->>H: invalida ['users','detail',uid]
    AP->>AP: onAvatarUpdated + alerta d'èxit (o motiu de la fallada)
```

## Confirmació d'edat (AgeGateScreen)
- `AppNavigator` retorna `AgeGateScreen` en lloc de l'app si `backendUser.age_confirmed === false` (usuaris anteriors a la feature i de Google). Si el backend no envia el camp (`undefined`), no es bloqueja.
- Validació local (`buildBirthDate`, `isUnderMinAge`); `confirmAge(iso)` → `PATCH /api/users/{uid}/age-confirmation/ {birth_date}` → `age_confirmed = true` al context i invalidació de `['users','detail',uid]`.
- < 16 (local o `403 underage`): missatge `age.underageMessage` i `logout()`.

## Avisos de moderació
- `ModerationNoticesCard` (perfil) llegeix `GET /api/users/{uid}/moderation-notices/` (clau `['users', uid, 'moderationNotices']`) i mostra acció, motiu, declaració de motius, strikes i el correu per recórrer (placeholder a `src/config/legal.ts`). No es mostra si no n'hi ha.

## Diagrama — esborrar compte

El backend esborra **ell mateix** el compte de Firebase Auth dins `DELETE /users/{uid}/` (primer les dades, després el compte). El client **no** crida `user.delete()`.

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuari
    participant SS as SettingsScreen
    participant AS as AuthService
    participant US as UsersService
    participant BE as Backend
    participant FB as Firebase Auth

    U->>SS: Eliminar compte → confirma (+ contrasenya si és compte email)
    SS->>AS: deleteAccount(password?)
    AS->>FB: reauthenticate (contrasenya o selector de Google)
    AS->>FB: getIdToken()
    AS->>US: deleteUser(uid)
    US->>BE: DELETE /api/users/{uid}/
    BE->>BE: 1) esborra dades 2) esborra el compte de Firebase
    alt backend falla (500 {error, error_id}) o xarxa
        US-->>AS: false
        AS-->>SS: Error code='delete_failed' (no es toca res; es pot reintentar)
        SS->>U: alerta auth.errors.deleteFailed
    else 204
        BE-->>US: 204
        AS->>FB: logout(): GoogleSignin.signOut + signOut(auth) local
        FB-->>SS: listener user=null → LoginScreen
    end
```

- `UsersService.deleteUser` retorna `true` (2xx) o `false` (qualsevol error, inclòs 404/500 i excepcions de xarxa); `AuthService.deleteAccount` tradueix `false`/excepció a un error amb `code = 'delete_failed'` **[FET]**.
- `SettingsScreen.runDeleteAccount` fa `AuthService.getErrorMessageKey(error.code)` → `delete_failed` = `auth.errors.deleteFailed` (4 locales) **[FET]**.
- Si el backend va bé, el compte de Firebase ja no existeix: el `signOut(auth)` local només serveix per esborrar la sessió persistida. Si fallés, no es llança (el compte ja és esborrat) **[FET]**. `AuthContext.deleteAccount` fa a més `resetSessionRights()`, com el logout **[FET]**.
- La cache de React Query no es buida (igual que al logout, vegeu GOTCHAS) **[FET]**.
- Aquest comportament **requereix el backend amb U7 desplegat**: amb un backend antic el compte de Firebase quedaria viu **[INFERÈNCIA]**. El rollback del registre (`firebaseUser.delete()` a `signUp`) es manté perquè allà el backend no té dades **[FET]**.

## Gotchas i bugs
- **Esborrat de compte**: ja no hi ha estat a mitges al client; si el backend falla, no es toca res i es pot reintentar (abans: backend primer i `user.delete()` des del client podia deixar un compte d'Auth orfe) **[FET]**.
- **Idioma**: `UsersService.updateUser` retorna `null` en lloc de llançar → `onError` no s'executa; `onSuccess` fa `reloadUser`, que torna a llegir l'idioma **antic** del backend i reverteix la UI **[FET + INFERÈNCIA]** (`LanguageSelector.tsx:37-49`, `src/hooks/useUsersQuery.ts:376-381`).
- Idioma enviat en **majúscules** (`'CA'`, `LanguageSelector.tsx:35`) però en minúscules al registre i a Google (`AuthService.ts:82,180`); el lector fa `toLowerCase()` (`AuthContext.tsx:86`) **[FET]**. El backend valida `ca|es|en|fr` **[NO VERIFICAT si accepta majúscules]**.
- Canviar email **no** actualitza res al backend; la branca `BACKEND_UPDATE_FAILED` (`ChangeEmailScreen.tsx:101`) és codi mort **[FET]**.
- Canviar email/contrasenya s'ofereix també a usuaris de Google, però la reautenticació usa `EmailAuthProvider` **[FET]** → no pot funcionar **[INFERÈNCIA]**.
- `updateUsername` envia el valor sense `trim()` (`EditProfileScreen.tsx:73`) i no actualitza el `displayName` de Firebase **[FET]**.
- La pujada de l'avatar ara passa per `useMediaUpload` (invalida `['users','detail',uid]`); l'esborrat continua cridant `UsersService.deleteAvatar` directament amb callback de refetch **[FET]**.
- ~~Claus `profile.avatar.expoGo*`~~: ja no s'usen (a Expo Go l'avatar es tria amb `expo-image-picker`).
