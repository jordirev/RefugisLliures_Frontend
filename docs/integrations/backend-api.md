# Integració — Backend REST (RefugisLliures_Backend)

> **[FET]** comprovat al codi · **[INFERÈNCIA]** deducció · **[NO VERIFICAT]** depèn de config externa.
> Aquest document descriu el costat frontend. El contracte detallat de cada endpoint és a la documentació del backend (`Backend/RefugisLliures_Backend/docs/`). La integració completa es documentarà al nivell `TFG/`.

## URL base
`https://refugislliures-backend.onrender.com/api`, **hard-coded** com a constant `API_BASE_URL` a cada servei **[FET]**:
`src/services/UsersService.ts:6`, `RenovationService.ts:4`, `RefugeVisitService.ts:19`, `RefugisService.ts:6`, `ExperienceService.ts:10`, `DoubtsService.ts:4`, `RefugeMediaService.ts:8`, `RefugeProposalsService.ts:15` i `MapCacheService.ts:43`. No hi ha variable d'entorn ni manera d'apuntar a un backend local sense editar codi. `__mocks__/env.js` defineix `API_URL`, però el codi no el llegeix.

## Client HTTP (`src/services/apiClient.ts`)
| Funció | Comportament |
|---|---|
| `apiClient(input, {skipAuth, skipRetry, ...})` | afegeix `Authorization: Bearer <idToken>`; en 401 refresca el token i reintenta un cop (L36-79) |
| `apiGet`, `apiDelete` | sense body |
| `apiPost`, `apiPatch`, `apiPut` | `Content-Type: application/json` + `JSON.stringify(body)` (L115-155) |
| `getDefaultHeaders` | helper de capçaleres |

Per a multipart (fotos, avatar, experiències) els serveis passen `FormData` directament a `apiClient` sense fixar `Content-Type` **[FET per avatar, `UsersService.ts:369-417`]**.

`fetchWithLog` (`src/services/fetchWithLog.ts`) fa log de mètode, URL, status i temps; `index.js:4-17` substitueix `global.fetch` per aquest wrapper **també en producció** i el wrapper llegeix el cos de **totes** les respostes (`fetchWithLog.ts:33-45`) **[FET]**.

## Patró dels serveis [FET]
- Classes amb mètodes `static async` (p. ex. `RenovationService`, `src/services/RenovationService.ts:41`).
- El lloc del mapatge DTO→model és **mixt**: `RenovationService`, `ExperienceService` i `DoubtsService` retornen **DTOs** (`src/services/dto/*.ts`) i el mapatge a models (`src/models/index.ts`) el fan els **hooks** amb `src/services/mappers/*` (p. ex. `src/hooks/useRenovationsQuery.ts:18-19`, patró de referència); `RefugisService`, `UsersService`, `RefugeProposalsService` i `RefugeVisitService` mapegen dins el servei (p. ex. `RefugisService.ts:23,86`). Vegeu [architecture/design-patterns.md](../architecture/design-patterns.md).
- Gestió d'errors **inconsistent**:
  - `RenovationService`, `RefugeVisitService`: llancen `Error` amb missatges en català (alguns perden l'status).
  - `UsersService`: retorna `null`/`false` en error (no llança) → les mutacions creuen que han anat bé.
  - `RenovationService.getRenovationById`: qualsevol error → `null`.

## Correspondència amb el backend (verificada pels fluxos)
| Domini | Endpoints usats | Notes |
|---|---|---|
| Usuaris | `POST /users/`, `GET/PATCH/DELETE /users/{uid}/`, `PATCH/DELETE /users/{uid}/avatar/`, `.../favorite-refuges/`, `.../visited-refuges/` | `POST /users/` envia `email` de més; idioma en majúscules des de Settings |
| Visites | `GET /refuges/{id}/visits/`, `GET /users/{uid}/visits/`, `POST/PATCH/DELETE /refuges/{id}/visits/{date}/` | coincideix |
| Renovations | `GET/POST /renovations/`, `GET/PATCH/DELETE /renovations/{id}/`, participants, `GET /refuges/{id}/renovations/` | `?id=` redundant a PATCH/DELETE; DELETE trencat des de la UI |
| Refugis, fotos, propostes, experiències, dubtes | vegeu fluxos 07-11 | |

## Gotchas
- El backend és a Render (pla amb *spin-down* **[INFERÈNCIA]**): la primera petició pot trigar segons; el listener d'auth només reintenta 3 × 1 s (`src/contexts/AuthContext.tsx:65-74`).
- `queryClient` té `staleTime` de 9 min justificat per "URLs presignades de 10 min" (`src/config/queryClient.ts:23`); el backend les genera amb 3600 s **[FET a ambdós repos]** — la justificació no quadra però el valor és segur.
