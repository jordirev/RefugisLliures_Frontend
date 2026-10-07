# Referència — `ExperienceService` i hooks d'experiències

> Migrat i actualitzat des de l'antiga `README/EXPERIENCE_SERVICE.md` (octubre 2026). Document fill de [flows/11-experiences.md](../flows/11-experiences.md), que conté el diagrama i els bugs.
> Llegenda: **[FET]** comprovat al codi · **[INFERÈNCIA]** deducció · **[NO VERIFICAT]** no confirmable des del frontend.

## Fitxers
```
src/services/ExperienceService.ts        crides a l'API (retorna DTOs)
src/services/dto/ExperienceDTO.ts        ExperienceDTO i respostes
src/services/mappers/ExperienceMapper.ts mapExperienceFromDTO
src/hooks/useExperiencesQuery.ts         hooks React Query (mapegen DTO → Experience)
src/models/index.ts                      interfície Experience
```

## Model
```ts
interface Experience {
  id: string;
  refuge_id: string;
  creator_uid: string;
  modified_at: string;            // el DTO diu "DD/MM/YYYY"; format real: [NO VERIFICAT], vegeu flows/11
  comment: string;
  images_metadata?: ImageMetadata[];
}
```

## Endpoints (tots amb Bearer via `apiClient`)
| Mètode del servei | Endpoint | Cos | Resposta |
|---|---|---|---|
| `getExperiencesByRefuge(refugeId)` | `GET /api/experiences/?refuge_id={id}` | — | `{ experiences: ExperienceDTO[] }` |
| `createExperience({refuge_id, comment, files?})` | `POST /api/experiences/` | multipart: `refuge_id`, `comment`, `files` (repetit) | `{ experience, uploaded_files?, failed_files?, message? }` |
| `updateExperience(id, {comment?, files?})` | `PATCH /api/experiences/{id}/` | multipart: `comment`, `files` (afegeix imatges) | `{ experience?, uploaded_files?, failed_files?, message? }` |
| `deleteExperience(id)` | `DELETE /api/experiences/{id}/` | — | `{ success, message }` |

- `uploaded_files` són les claus de media pujades; `failed_files`, els noms que han fallat; `message`, l'error parcial. Una experiència es pot crear encara que alguns fitxers fallin (la UI mostra `experiences.warnings.someFilesFailedToUpload`).
- **Eliminar una foto d'una experiència** no es fa amb aquests endpoints sinó amb el de media del refugi: `DELETE /api/refuges/{id}/media/{key}/` (`RefugeMediaService.deleteRefugeMedia`, vegeu [flows/09](../flows/09-refuge-photos-gallery.md)).
- Multipart: el servei construeix `FormData` i **no** fixa `Content-Type`.

## Errors (llança `Error` amb missatge en català) [FET]
| Operació | Status → missatge per defecte (si el backend no envia `error`) |
|---|---|
| Llistar | 400 "El refuge_id és requerit" · 404 "Refugi no trobat" · altres `Error {status}` · xarxa "No s'han pogut carregar les experiències" |
| Crear | 400 "Dades invàlides" · 401 "No autenticat" · 404 "Refugi no trobat" · xarxa "No s'ha pogut crear l'experiència" |
| Actualitzar | 400 · 401 · 403 "No tens permisos per editar aquesta experiència" · 404 "Experiència no trobada" · xarxa "No s'ha pogut actualitzar l'experiència" |
| Eliminar | 401 · 403 "No tens permisos per eliminar aquesta experiència" · 404 |

El frontend gestiona el 403, però segons els docs del backend aquest **no comprova la propietat**; l'única protecció és visual (vegeu [flows/11](../flows/11-experiences.md#gotchas-i-bugs)).

## Hooks (`src/hooks/useExperiencesQuery.ts`)
Clau de llista: `['experiences', 'refuge', refugeId]` (fora del registre `queryKeys`).

| Hook | Ús | Efecte a la cache en `onSuccess` |
|---|---|---|
| `useExperiences(refugeId)` | `const { data, isLoading, error } = useExperiences(id)` | — |
| `useCreateExperience()` | `mutateAsync({ refuge_id, comment, files })` | afegeix la nova al principi de la llista; si hi ha fitxers invalida `['refuges','detail',id]`, `['refugeMedia',id]`, `['refuges','list']`; sempre invalida `['users','detail']` |
| `useUpdateExperience()` | `mutateAsync({ experienceId, refugeId, request: { comment, files } })` | substitueix l'experiència a la llista (si la resposta no porta `experience`, no fa res); **només si hi ha fitxers** invalida refugi, media, llista de refugis i `['users','detail']` |
| `useDeleteExperience()` | `mutateAsync({ experienceId, refugeId })` | la treu de la llista; invalida refugi, media, llista de refugis i usuari |

No són optimistic updates: escriuen a la cache després de la resposta.

```tsx
const { data: experiences } = useExperiences(refugeId);
const create = useCreateExperience();

const onSubmit = async (comment: string, files: File[]) => {
  const result = await create.mutateAsync({ refuge_id: refugeId, comment, files });
  if (result.failed_files?.length) showAlert(t('experiences.warnings.someFilesFailedToUpload'));
};
```
