# Flux 11 — Experiències

> **[FET]** comprovat al codi · **[INFERÈNCIA]** deducció · **[NO VERIFICAT]** depèn de config externa.

## Peces
| Capa | Fitxer |
|---|---|
| Pantalla | `src/screens/ExperiencesScreen.tsx` (overlay des d'`AppNavigator.tsx:326-338`) |
| Element | `src/components/UserExperience.tsx` (edició inline) |
| Preview | `src/screens/RefugeDetailScreen.tsx:999-1042` |
| Hooks | `src/hooks/useExperiencesQuery.ts` (clau `queryKeys.refugeExperiences(id)`) · selecció de fitxers amb `useMediaUpload().pickMedia` |
| Servei | `src/services/ExperienceService.ts` |
| Mapper | `src/services/mappers/ExperienceMapper.ts:8-19` |

Endpoints, formes de resposta, errors per status i ús dels hooks: [reference/experience-service.md](../reference/experience-service.md).

## Diagrama

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuari
    participant ES as ExperiencesScreen
    participant MU as useMediaUpload.pickMedia
    participant H as useCreateExperience
    participant S as ExperienceService
    participant M as MediaUploadService
    participant BE as Backend
    participant Q as QueryClient

    ES->>S: GET /api/experiences/?refuge_id= (useExperiences)
    U->>ES: tria fotos/vídeos
    ES->>MU: drets (1 cop/sessió) → picker → llista blanca → compressió (MIME real)
    U->>ES: escriu comentari (≤2000) i envia
    ES->>H: mutate({refuge_id, comment, condition, files: PreparedMediaFile[]})
    H->>S: POST /api/experiences/ JSON {refuge_id, comment, condition}
    BE-->>S: {experience}
    H->>M: uploadFiles({target:'experience', refugeId, experienceId, files})
    M->>BE: upload-intents → PUT R2 → confirm
    H->>Q: afegeix l'experiència (amb els MediaItem pujats) · invalida refugi, refugeMedia, experiències, llista i usuari
    alt failed / uploadError
        ES-->>U: avís amb els motius (l'experiència ja existeix)
    end
    U->>ES: editar (només creador) → PATCH JSON {comment, condition} + intents dels fitxers nous
    U->>ES: eliminar → DELETE /api/experiences/{id}/ → treu de cache + invalida
```

## Gotchas i bugs
- El botó d'editar/eliminar només es mostra si `backendUser.uid === creator_uid`; amb la feature `images` el backend comprova la propietat (403 / `not_owner` als intents) **[NO VERIFICAT des del frontend]**.
- ~~MIME forçat i `MediaTypeOptions.All`~~ **Resolt**: la selecció passa per `useMediaUpload.pickMedia` (MIME real, WebP després de comprimir).
- Si el PATCH no retorna `experience`, no se substitueix a la cache (però amb fitxers sí que s'invalida); el PATCH es fa sempre (porta `condition`, que l'app envia sempre) **[FET]**.
- `condition` (0-3, estat del refugi) és **obligatori en crear**: `ExperiencesScreen` mostra `ExperienceConditionPicker` i desactiva l'enviament fins triar-ne un; en editar, `UserExperience` el precarrega i no deixa confirmar si l'experiència antiga no en té. El servei valida l'enter 0-3 abans de la petició **[FET]**.
- En crear, el `comment` no pot ser buit (el backend respon 400): l'enviament queda desactivat sense comentari, també si hi ha fotos, amb l'avís `experiences.commentRequired` **[FET]**.
- 403 `user_blocked` / `age_not_confirmed` al POST/PATCH: `ApiError` amb `code` i alerta via `getContentErrorMessage` (igual que visites, reformes i dubtes) **[FET]**.
- `UserExperience.formatDate` només entén ISO/`yyyy-mm-dd` i si no mostra 'Sense data' (63-90); el DTO diu `DD/MM/YYYY` (`src/services/dto/ExperienceDTO.ts:11`) **[FET]**; format real del backend: **[NO VERIFICAT des del frontend]**.
- `refuge_id` sense codificar a la query (`ExperienceService.ts:49`) **[FET]**.
- ~~`alert()` global i clau `refuge.gallery.permissionDenied`~~ **Resolt**: `UserExperience` rep `onPickMedia` del pare.
- ~~`deleteMediaMutation` sense ús~~ **Resolt** (eliminat).
- Si la creació va bé però la pujada falla (p. ex. `user_blocked`), l'experiència queda creada sense fotos i es retorna `uploadError` **[FET]**.
