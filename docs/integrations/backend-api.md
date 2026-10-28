# Integració — Backend REST (RefugisLliures_Backend)

> **[FET]** comprovat al codi · **[INFERÈNCIA]** deducció · **[NO VERIFICAT]** depèn de config externa.
> Aquest document descriu el costat frontend. El contracte detallat de cada endpoint és a la documentació del backend (`Backend/RefugisLliures_Backend/docs/`). La integració completa es documentarà al nivell `TFG/`.

## URL base
`https://refugislliures-backend.onrender.com/api`, **hard-coded** com a constant `API_BASE_URL` a cada servei **[FET]**:
`src/services/UsersService.ts:6`, `MediaUploadService.ts`, `MediaModerationService.ts`, `RenovationService.ts:4`, `RefugeVisitService.ts:19`, `RefugisService.ts:6`, `ExperienceService.ts:10`, `DoubtsService.ts:4`, `RefugeMediaService.ts:8`, `RefugeProposalsService.ts:15` i `MapCacheService.ts:43`. No hi ha variable d'entorn ni manera d'apuntar a un backend local sense editar codi. `__mocks__/env.js` defineix `API_URL`, però el codi no el llegeix.

## Client HTTP (`src/services/apiClient.ts`)
| Funció | Comportament |
|---|---|
| `apiClient(input, {skipAuth, skipRetry, ...})` | afegeix `Authorization: Bearer <idToken>`; en 401 refresca el token i reintenta un cop (L36-79) |
| `apiGet`, `apiDelete` | sense body |
| `apiPost`, `apiPatch`, `apiPut` | `Content-Type: application/json` + `JSON.stringify(body)` (L115-155) |
| `getDefaultHeaders` | helper de capçaleres |

Fotos, vídeos i avatar **ja no** es pugen en multipart: es fa amb URL PUT prefirmada (secció [Mitjans](#mitjans-moderació-i-edat-feature-images)). El PUT a R2 **no** passa per `apiClient` (no ha de portar `Authorization`). Els errors amb codi es normalitzen amb `src/services/apiErrors.ts` (`ApiError`, `extractApiErrorCode`).

`fetchWithLog` (`src/services/fetchWithLog.ts`) fa log de mètode, URL, status i temps; `index.js:4-17` substitueix `global.fetch` per aquest wrapper **també en producció** i el wrapper llegeix el cos de **totes** les respostes (`fetchWithLog.ts:33-45`) **[FET]**. Des d'SDK 56 (vigent a SDK 57) `expo/fetch` és el `fetch` global: `fetchWithLog` el captura via `__originalFetch` i `response.clone()` hi funciona; no s'ha fet opt-out **[INFERÈNCIA]**.

## Patró dels serveis [FET]
- Classes amb mètodes `static async` (p. ex. `RenovationService`, `src/services/RenovationService.ts:41`).
- El lloc del mapatge DTO→model és **mixt**: `RenovationService`, `ExperienceService` i `DoubtsService` retornen **DTOs** (`src/services/dto/*.ts`) i el mapatge a models (`src/models/index.ts`) el fan els **hooks** amb `src/services/mappers/*` (p. ex. `src/hooks/useRenovationsQuery.ts:18-19`, patró de referència); `RefugisService`, `UsersService`, `RefugeProposalsService` i `RefugeVisitService` mapegen dins el servei (p. ex. `RefugisService.ts:23,86`). Vegeu [architecture/design-patterns.md](../architecture/design-patterns.md).
- Gestió d'errors **inconsistent**:
  - `RenovationService`, `RefugeVisitService`, `DoubtsService`: llancen `Error` amb missatges en català (alguns perden l'status); els 403/404 del contracte nou llancen `ApiError` amb `code` (vegeu «Contracte de visites, reformes i dubtes»).
  - `UsersService`: retorna `null`/`false` en error (no llança) → les mutacions creuen que han anat bé.
  - `RenovationService.getRenovationById`: qualsevol error → `null`.

## Correspondència amb el backend (verificada pels fluxos)
| Domini | Endpoints usats | Notes |
|---|---|---|
| Usuaris | `POST /users/` (+ `birth_date`), `GET/PATCH/DELETE /users/{uid}/` (el `DELETE` esborra dades **i** el compte de Firebase; 204 = ok, 500 `{error, error_id}` = dades ja esborrades però compte Firebase viu o R2 caigut, idempotent: el client reintenta un cop i després mostra `delete_failed`; 401/403 → `delete_unauthorized`), `DELETE /users/{uid}/avatar/`, `PATCH /users/{uid}/age-confirmation/`, `GET /users/{uid}/moderation-notices/`, `.../favorite-refuges/`, `.../visited-refuges/` | `POST /users/` envia `email` de més; idioma en majúscules des de Settings |
| Visites | `GET /refuges/{id}/visits/`, `GET /users/{uid}/visits/`, `POST/PATCH/DELETE /refuges/{id}/visits/{date}/` | coincideix; `num_visitors` ≤ 100 i data `YYYY-MM-DD` estricta (vegeu més avall) |
| Renovations | `GET/POST /renovations/`, `GET/PATCH/DELETE /renovations/{id}/`, participants, `GET /refuges/{id}/renovations/` | `?id=` redundant a PATCH/DELETE; DELETE trencat des de la UI |
| Refugis, fotos, propostes, experiències, dubtes | vegeu fluxos 07-11 | |

## Mitjans, moderació i edat (feature `images`)
Contracte compartit amb el backend (`Backend/.../docs/flows/03-refuge-media-upload.md`). Handlers MSW de referència: `src/__tests__/integration/setup/mswHandlers.ts`.

| Endpoint | Cos / resposta | Client |
|---|---|---|
| `POST /api/media/upload-intents/` | `{target: "refuge"\|"experience"\|"avatar", refuge_id?, experience_id?, rights_confirmed: true, files: [{content_type, size}]}` (màx. 10) → `201 {uploads: [{upload_id, put_url, headers, expires_in: 600}]}`. Errors: 400 · 403 `age_not_confirmed` / `user_blocked` / `not_owner` · 404 | `MediaUploadService.createUploadIntents` |
| `PUT {put_url}` (R2) | cos binari, capçaleres retornades (`Content-Type`), **sense Bearer** | `MediaUploadService.putFile` (`expo-file-system/legacy` `createUploadTask`, amb progrés; fetch+Blob a web) |
| `POST /api/media/upload-intents/confirm/` | `{upload_ids}` → `200 {uploaded: MediaItem[], failed: [{upload_id, reason}]}`; `reason ∈ missing_object\|too_large\|invalid_type\|processing_error\|moderation_blocked` (el client hi afegeix `put_failed`) | `MediaUploadService.confirmUploads` |
| `POST /api/experiences/`, `PATCH /api/experiences/{id}/` | JSON sense fitxers (`{refuge_id, comment}` / `{comment}`); els fitxers van després per intents amb `target=experience` | `ExperienceService` |
| `POST /api/media/reports/` | `{refuge_id, media_key, reason, details?}` (`details` obligatori si `other`, ≤1000) → 201 · 403 (pròpia foto) · 409 (ja denunciada) | `MediaModerationService.reportMedia` |
| `GET /api/admin/media-reports/?status=pending\|resolved` | llista (array o `{results}`) | `MediaModerationService.getMediaReports` |
| `PATCH /api/admin/media-reports/{id}/` | `{action: dismiss\|remove\|remove_and_strike, statement}` | `MediaModerationService.resolveMediaReport` |
| `GET /api/users/{uid}/moderation-notices/` | llista d'avisos | `MediaModerationService.getModerationNotices` |
| `POST /api/users/` | + `birth_date` (YYYY-MM-DD) → 403 `underage` si < 16 | `UsersService.createUser` (llança `ApiError('underage')`) |
| `PATCH /api/users/{uid}/age-confirmation/` | `{birth_date}` → 200 / 403 `underage` | `UsersService.confirmAge` |

`MediaItem = {key, url, thumb_url, media_type, width, height, blurhash, creator_uid, uploaded_at, taken_at, experience_id}` → model `ImageMetadata` (àlies `MediaItem`); el mapper només afegeix els camps nous si hi són (fallback per a items antics). El GET d'usuari exposa `age_confirmed` (bool) → `User.age_confirmed`.

**Detalls confirmats pel backend** [FET a ambdós repos]:
- Errors amb codi: `{"error": "<code>", "code": "<code>", "message": "<text>"}` (es llegeix `code`, i `error` com a reserva; mai el text). Codis: `user_blocked`, `age_not_confirmed`, `not_owner`, `underage`, `own_media` (403), `already_reported` (409), `already_resolved` (409), `moderation_blocked` (403, avatar antic). Validació 400: `{"error": "Dades invàlides", "details": {...}}`.
- El PUT ha d'enviar exactament `headers["Content-Type"]` i un cos de la mida declarada (`size`): R2 signa `ContentType` i `ContentLength`. `image/jpg` es normalitza a `image/jpeg`.
- Avatar: exactament una imatge per intent. Confirm idempotent; `upload_id` desconegut o caducat → `failed` amb `missing_object`.
- `POST /media/reports/` → 201 `{id, refuge_id, media_key, reason, details, status, priority, created_at, media_hidden}`.
- `GET /admin/media-reports/` (per defecte `pending`) → `{count, reports: [{..., media: MediaItem & {status} | null}]}`.
- `PATCH /admin/media-reports/{id}/` → `statement` obligatori per a **totes** les accions (incl. `dismiss`, ≤2000) → `{report, resolved_report_ids, media_status, strikes, user_blocked}`; resol totes les denúncies pendents del mateix mitjà.
- Denúncies: `id` és un UUID opac; a l'admin `reporter_uid` pot ser `'system'`/`'unknown'`, `media_creator_uid` i `refuge_id` poden ser `null`. Denunciar un mitjà retirat/retingut → 404 `Media not found`; `PATCH` d'una denúncia inexistent → 404 (`not_found`), ja resolta → 409 `already_resolved` (la pantalla d'admin refresca la llista). `media_status` de la resolució pot ser `visible|removed|held` (CSAM).
- `GET /users/{uid}/moderation-notices/` → `{notices: [{id, uid, type, statement, created_at, refuge_id, media_key, reason, action, report_id, automated, strikes, redress}]}`.
- `PATCH /users/{uid}/age-confirmation/` → 200 amb l'usuari serialitzat (`age_confirmed: true`). `POST /users/` sense `birth_date` → `age_confirmed = false` (AgeGate).
- Els vídeos conserven el contenidor (clau final `.mp4/.mov/.webm`); `thumb_url` és un pòster WebP.
- Interpretació del client: qualsevol 403 de `POST /users/` o d'`age-confirmation` es tracta com `underage` [INFERÈNCIA].

## Contracte de visites, reformes i dubtes (PostgreSQL)

> **[FET]** implementat al frontend (branca `feature/contracte-visites-reformes-dubtes`) · **[NO VERIFICAT]** contra el backend en producció: el backend nou encara no hi és desplegat; el contracte ve de l'encàrrec, no s'ha provat contra un servidor real.

- **Escriptures de contingut** (visites: `POST`/`PATCH` `/refuges/{id}/visits/{date}/`; reformes: `POST /renovations/`, `PATCH /renovations/{id}/`, `POST /renovations/{id}/participants/`; dubtes: `POST /doubts/`, `POST /doubts/{id}/answers/`, `POST /doubts/{id}/answers/{aid}/`) poden respondre `403 {error, code, message}` amb `code = user_blocked` o `age_not_confirmed`. `GET` i `DELETE` no ho exigeixen. Els serveis llancen `ApiError` (`buildApiError` a `src/services/apiErrors.ts`); la UI tradueix per `code` amb `getContentErrorMessage` (`src/utils/apiErrorMessage.ts`, claus `contentErrors.*` a les 4 locales). Per a `age_not_confirmed` només es mostra el missatge (no s'obre l'AgeGate: això només passa quan `backendUser.age_confirmed === false`).
- **Reformes**: `group_link` només és al JSON per al creador, participants i admins (i s'omet a les reformes passades d'un creador esborrat, `creator_uid: 'unknown'`) → `RenovationDTO.group_link` i `Renovation.group_link` són opcionals. `expelled_uids` no es retorna mai (no és al DTO, al model ni al mapper). Unir-se estant expulsat → 403 (el servei el mapeja a `code: 'expelled'` quan el cos no porta un dels codis coneguts) [INFERÈNCIA: el codi exacte del backend per a «expulsat» no s'ha vist]. `group_link` ha de ser `http(s)://` de ≤ 2048 caràcters (si no, 400; validat al formulari). Reformes d'un sol dia (`ini_date == fin_date`) permeses. `POST /renovations/` amb refugi inexistent → 404 i `GET /refuges/{id}/renovations/` d'un refugi inexistent → 404 (abans `[]`); ambdós llancen `ApiError` amb `code: 'not_found'`. `GET /refuges/{id}/renovations/?active_only=true` filtra les actives; `getRenovationsByRefugeId(id, { activeOnly })` només l'envia si es demana (per defecte retorna totes, com fins ara).
- **Dubtes**: esborrar un dubte o una resposta d'algú altre (sense ser creador ni admin) → `403 {error:'not_owner', code:'not_owner', message}` (`ApiError.code = 'not_owner'`). Esborrar una resposta esborra **tot el subarbre**: `useDeleteAnswer` el treu de la cache i invalida `['doubts','refuge',id]`. `answers` ve sempre (`[]` si no n'hi ha).
- **Visites**: `num_visitors` ≤ 100 (si no, 400; validat al modal amb `MAX_NUM_VISITORS`, `src/utils/visitLimits.ts`). La data de la URL ha de ser estrictament `YYYY-MM-DD`: el modal ja la construeix així i el servei ho comprova abans de fer la petició.

## Gotchas
- El backend és a Render (pla amb *spin-down* **[INFERÈNCIA]**): la primera petició pot trigar segons; el listener d'auth només reintenta 3 × 1 s (`src/contexts/AuthContext.tsx:65-74`).
- `queryClient` té `staleTime` de 9 min justificat per "URLs presignades de 10 min" (`src/config/queryClient.ts:23`); el backend les genera amb 3600 s **[FET a ambdós repos]** — la justificació no quadra però el valor és segur.
