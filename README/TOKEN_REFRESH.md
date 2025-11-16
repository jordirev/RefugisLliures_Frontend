# Sistema de Refresc Automàtic de Tokens

**Data d'implementació:** 5 de novembre de 2025  
**Branca:** `feature/users`

## Problema Identificat

Abans d'aquesta implementació, l'aplicació no gestionava automàticament els tokens JWT expirats. Això provocava els següents problemes:

### Escenari Problemàtic

1. **Usuari autenticat** - Un usuari fa login correctament i obté un token JWT de Firebase
2. **Token expira** - Després d'una hora (vida del token de Firebase), el token deixa d'estar vàlid
3. **Crida API falla** - L'usuari intenta fer una acció (actualitzar perfil, gestionar favorits, etc.)
4. **Error 401 Unauthorized** - El backend rebutja la petició perquè el token és expirat
5. **Experiència d'usuari negativa** - L'usuari veu un error i ha de tornar a fer login manualment

### Impacte

- **Experiència d'usuari interrompuda**: Sessions que s'acaben sense avís previ
- **Pèrdua de dades**: Si l'usuari estava enmig d'una operació (p.ex. editar el perfil)
- **Confusió**: L'usuari no entén per què "de sobte" no pot fer accions
- **Frustració**: Haver de fer login constantment si la sessió és llarga

## Solució Implementada

S'ha creat un **client HTTP intel·ligent** (`apiClient.ts`) que detecta automàticament tokens expirats i els refresca sense intervenció de l'usuari.

### Components Creats

#### 1. **Nou Servei: `apiClient.ts`**

Ubicació: `src/services/apiClient.ts`

Aquest servei proporciona:

- **Funcions helpers per HTTP**: `apiGet`, `apiPost`, `apiPatch`, `apiPut`, `apiDelete`
- **Gestió automàtica de tokens**: Afegeix automàticament el token JWT a cada petició
- **Interceptor de respostes 401**: Detecta quan un token ha expirat
- **Refresc automàtic**: Obté un nou token de Firebase
- **Retry automàtic**: Reintenta la petició original amb el nou token
- **Logging detallat**: Registra tots els passos per facilitar el debugging

### Flux de Funcionament

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Usuari fa una acció (p.ex. actualitzar perfil)              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. apiClient obté el token actual de Firebase                   │
│    i l'afegeix al header Authorization: Bearer <token>          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Crida API al backend amb el token                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                ┌────────────┴───────────┐
                │                        │
                ▼                        ▼
    ┌──────────────────┐      ┌──────────────────┐
    │  Resposta OK     │      │  Error 401       │
    │  (Token vàlid)   │      │  (Token expirat) │
    └────────┬─────────┘      └────────┬─────────┘
             │                         │
             │                         ▼
             │            ┌──────────────────────────────┐
             │            │ 4. apiClient detecta el 401   │
             │            │    i intenta refrescar token  │
             │            └────────┬─────────────────────┘
             │                     │
             │                     ▼
             │            ┌──────────────────────────────┐
             │            │ 5. Crida Firebase per obtenir│
             │            │    nou token (forceRefresh)   │
             │            └────────┬─────────────────────┘
             │                     │
             │                     ▼
             │            ┌──────────────────────────────┐
             │            │ 6. Reintenta petició amb     │
             │            │    el nou token              │
             │            └────────┬─────────────────────┘
             │                     │
             └─────────────────────┘
                         │
                         ▼
              ┌──────────────────┐
              │ 7. Retorna        │
              │    resultat       │
              └──────────────────┘
```

### Exemple de Codi

#### Abans (Gestió manual):

```typescript
static async updateUser(uid: string, updateData: UserUpdateData, authToken?: string): Promise<User | null> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Afegir token manualment
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetchWithLog(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(updateData),
    });
    
    // Si falla amb 401, l'usuari ha de fer login manualment
    if (!response.ok) {
      return null; // ❌ Gestió deficient d'errors
    }
    
    return mapUserFromDTO(await response.json());
  } catch (err) {
    return null;
  }
}
```

#### Després (Gestió automàtica):

```typescript
static async updateUser(uid: string, updateData: UserUpdateData, authToken?: string): Promise<User | null> {
  try {
    // ✅ apiPatch gestiona automàticament:
    //    - Afegir token
    //    - Detectar 401
    //    - Refrescar token
    //    - Reintentar petició
    const response = await apiPatch(url, updateData);
    
    if (!response.ok) {
      return null;
    }
    
    return mapUserFromDTO(await response.json());
  } catch (err) {
    return null;
  }
}
```

## Canvis Realitzats

### Arxius Creats

1. **`src/services/apiClient.ts`** - Nou servei amb tota la lògica de gestió de tokens

### Arxius Modificats

1. **`src/services/UsersService.ts`**
   - Importa `apiGet`, `apiPost`, `apiPatch`, `apiDelete` en lloc de `fetchWithLog`
   - Simplifica `createUser()` - Ara usa `apiPost`
   - Simplifica `getUserByUid()` - Ara usa `apiGet`
   - Simplifica `updateUser()` - Ara usa `apiPatch`
   - Simplifica `deleteUser()` - Ara usa `apiDelete`
   - **Benefici**: Totes les operacions d'usuari ara tenen refresc automàtic

2. **`src/services/RefugisService.ts`**
   - Importa `apiGet` en lloc de `fetchWithLog`
   - Actualitza `getRefugiById()` - Ara usa `apiGet` amb `skipAuth: true`
   - Actualitza `getRefugis()` - Ara usa `apiGet` amb `skipAuth: true`
   - **Nota**: Els refugis són públics, però usen el client per consistència i logging

### Funcionalitats del Client API

#### Opcions Disponibles

```typescript
interface ApiClientOptions {
  skipAuth?: boolean;  // No afegir token d'autenticació
  skipRetry?: boolean; // No reintentar en cas de 401
}
```

#### Funcions Helpers

```typescript
// GET request
apiGet(url, options?)

// POST request amb body JSON
apiPost(url, body, options?)

// PATCH request amb body JSON
apiPatch(url, body, options?)

// PUT request amb body JSON
apiPut(url, body, options?)

// DELETE request
apiDelete(url, options?)

// Client genèric (tots els altres usen aquest internament)
apiClient(url, options?)
```

## Beneficis

### 1. **Experiència d'Usuari Millorada**
- ✅ Sessions més llargues sense interrupcions
- ✅ No cal tornar a fer login si el token expira
- ✅ Operacions completades amb èxit de forma transparent

### 2. **Codi Més Net i Mantenible**
- ✅ Eliminació de lògica repetitiva de gestió de tokens
- ✅ Serveis més simples i centrats en la lògica de negoci
- ✅ Gestió centralitzada d'errors d'autenticació

### 3. **Millor Seguretat**
- ✅ Tokens amb vida curta (més segurs)
- ✅ Renovació automàtica transparent
- ✅ Gestió consistent de l'autenticació

### 4. **Facilitat de Debug**
- ✅ Logging detallat de cada pas del procés
- ✅ Fàcil identificar problemes d'autenticació
- ✅ Traces clares quan es refresca un token

## Consideracions de Seguretat

### Tokens JWT i Firebase

- **Vida del token**: Firebase genera tokens amb validesa d'1 hora
- **Refresc transparent**: Firebase pot generar nous tokens automàticament
- **Sense exposició**: Els tokens mai es guarden en localStorage (només en memòria)
- **Revocació**: Si un usuari fa logout, el token és invalidat immediatament

### Límits del Sistema

El sistema **NO** pot refrescar el token en aquests casos:

1. **Sessió de Firebase expirada completament** - L'usuari ha d'autenticar-se de nou
2. **Credencials revocades** - El compte ha estat desactivat o eliminat
3. **Error de xarxa** - No hi ha connexió per refrescar el token

En aquests casos, l'usuari veurà l'error original i haurà de fer login manualment.

## Testing

### Com Provar el Sistema

1. **Escenari Normal**
   ```
   1. Fer login
   2. Usar l'aplicació normalment
   3. Comprovar que les peticions funcionen correctament
   ```

2. **Escenari Token Expirat** (Simulació)
   ```
   1. Fer login
   2. Esperar més d'1 hora (o forçar expiració en desenvolupament)
   3. Intentar actualitzar el perfil
   4. Observar als logs: "[apiClient] Token expirat detectat (401). Refrescant token..."
   5. Observar als logs: "[apiClient] Token refrescat correctament. Reintentant petició..."
   6. Comprovar que l'operació s'ha completat amb èxit
   ```

3. **Revisar Logs**
   ```
   - Buscar "[apiClient]" als logs del navegador o de l'app
   - Verificar que el flux de refresc funciona correctament
   ```

## Futur i Millores Possibles

### Millores Potencials

1. **Refresc Proactiu**
   - Refrescar el token abans que expiri (p.ex. als 50 minuts)
   - Evitar completament els errors 401

2. **Cua de Peticions**
   - Si múltiples peticions fallen simultàniament amb 401
   - Refrescar el token un sol cop i reintentar totes

3. **Exponential Backoff**
   - Si el refresc falla, reintentar amb intervals creixents
   - Millor gestió d'errors temporals de xarxa

4. **Notificacions a l'Usuari**
   - Mostrar un toast/snackbar quan s'està refrescant el token
   - Informar l'usuari de manera subtil

## Referències

- [Firebase Auth - ID Tokens](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [HTTP Status Codes - 401 Unauthorized](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401)

---

**Autor**: Sistema de Desenvolupament  
**Revisat**: Pendent  
**Estat**: ✅ Implementat i Funcional
