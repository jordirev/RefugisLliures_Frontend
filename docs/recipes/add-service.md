# Recepta — Afegir un servei nou (`src/services/`)

> Al frontend un "servei" és una classe estàtica que parla amb una API (backend, Firebase, tiles…) o amb emmagatzematge local. No té estat de React; l'estat va a hooks (React Query) o a context.

## Patrons existents [FET]
| Tipus | Exemple |
|---|---|
| Client del backend per domini | `src/services/RenovationService.ts`, `UsersService.ts`, `RefugisService.ts` |
| Auth / Firebase | `src/services/AuthService.ts` (+ `src/services/firebase.ts`) |
| Cache local / fitxers | `src/services/MapCacheService.ts` (tiles offline) |
| Infra HTTP | `src/services/apiClient.ts`, `src/services/fetchWithLog.ts` |

## Passos
1. **Fitxer** `src/services/<Nom>Service.ts` amb `export class <Nom>Service { static async ... }` i JSDoc en català (convenció dels existents).
2. **HTTP**: usa `apiClient`/`apiGet`/... (token + reintent 401). Per APIs externes sense auth, `apiClient(url, { skipAuth: true })` o `fetch` directe (com l'elevació a `src/components/RefugeForm.tsx:152`).
3. **Configuració**: per a valors per entorn, afegeix el nom a `.env.example` i decideix el mecanisme:
   - en temps de build/config nativa → `app.config.js` `extra` + `Constants.expoConfig.extra` (com Firebase);
   - en temps de bundle → `@env` (react-native-dotenv), com `FIREBASE_WEB_CLIENT_ID`.
   Afegeix-lo també a `__mocks__/env.js` o al mock d'`expo-constants` per als tests. Mai valors reals al repo.
4. **Errors**: llança `Error` (amb `status` si és HTTP). No retornis `null` per amagar errors.
5. **Mòduls natius opcionals**: si la llibreria no funciona a Expo Go, carrega-la amb `require` dins `try` i exposa un `isAvailable()` (patró de Google Sign-In, `src/services/AuthService.ts:25-31`).
6. **Estat**: exposa'l via hook React Query (`src/hooks/`) o, si és global de sessió, via `src/contexts/AuthContext.tsx`.
7. **Tests**: `src/__tests__/unit_tests/services/<Nom>Service.test.ts`; mocks globals a `jest.setup.js` / `__mocks__/`.
8. **Docs**: si és extern, crea `docs/integrations/<nom>.md` i actualitza `docs/ARCHITECTURE.md`.
