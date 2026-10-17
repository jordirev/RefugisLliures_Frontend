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
| `createExperience({refuge_id, comment})` | `POST /api/experiences/` | JSON `{refuge_id, comment}` (els `files` del request **no** s'envien) | `{ experience, message? }` |
| `updateExperience(id, {comment?})` | `PATCH /api/experiences/{id}/` | JSON `{comment}` | `{ experience?, message? }` |
| `deleteExperience(id)` | `DELETE /api/experiences/{id}/` | — | `{ success, message }` |

- Els fitxers (`PreparedMediaFile[]`, de `useMediaUpload().pickMedia`) els puja el **hook** després de crear l'experiència: `MediaUploadService.uploadFiles({target:'experience', refugeId, experienceId, files})` (intents → PUT R2 → confirm). El hook retorna `uploaded_files` (claus), `failed_files` (`[{upload_id, reason}]`) i `uploadError` (error global de pujada; l'experiència ja existeix).
- **Eliminar una foto d'una experiència** no es fa amb aquests endpoints sinó amb el de media del refugi: `DELETE /api/refuges/{id}/media/{key}/` (`RefugeMediaService.deleteRefugeMedia`, vegeu [flows/09](../flows/09-refuge-photos-gallery.md)).
- El backend ja no accepta multipart a `POST`/`PATCH /api/experiences/` (només JSON; els camins antics s'han retirat): els fitxers només van per `upload-intents`.

## Errors (llança `Error` amb missatge en català) [FET]
| Operació | Status → missatge per defecte (si el backend no envia `error`) |
|---|---|
| Llistar | 400 "El refuge_id és requerit" · 404 "Refugi no trobat" · altres `Error {status}` · xarxa "No s'han pogut carregar les experiències" |
| Crear | 400 "Dades invàlides" · 401 "No autenticat" · 404 "Refugi no trobat" · xarxa "No s'ha pogut crear l'experiència" |
| Actualitzar | 400 · 401 · 403 "No tens permisos per editar aquesta experiència" · 404 "Experiència no trobada" · xarxa "No s'ha pogut actualitzar l'experiència" |
| Eliminar | 401 · 403 "No tens permisos per eliminar aquesta experiència" · 404 |

El frontend gestiona el 403; amb la feature `images` el backend comprova la propietat a update/delete i als intents (`not_owner`).

## Hooks (`src/hooks/useExperiencesQuery.ts`)
Clau de llista: `queryKeys.refugeExperiences(refugeId)` = `['experiences', 'refuge', refugeId]`.

| Hook | Ús | Efecte a la cache en `onSuccess` |
|---|---|---|
| `useExperiences(refugeId)` | `const { data, isLoading, error } = useExperiences(id)` | — |
| `useCreateExperience()` | `mutateAsync({ refuge_id, comment, files })` | crea (JSON) i puja els fitxers; afegeix la nova al principi de la llista (amb els `MediaItem` pujats); si hi ha fitxers `invalidateMediaQueries` (refugi, refugeMedia, experiències, llista, usuari); si no, `['users','detail']` |
| `useUpdateExperience()` | `mutateAsync({ experienceId, refugeId, request: { comment, files } })` | PATCH només si hi ha comentari (o no hi ha fitxers); puja els fitxers amb `target=experience`; substitueix l'experiència si la resposta la porta; si hi ha fitxers `invalidateMediaQueries` |
| `useDeleteExperience()` | `mutateAsync({ experienceId, refugeId })` | la treu de la llista; invalida refugi, media, llista de refugis i usuari |

No són optimistic updates: escriuen a la cache després de la resposta.

```tsx
const { data: experiences } = useExperiences(refugeId);
const create = useCreateExperience();
const { pickMedia, rightsModalProps } = useMediaUpload({ showAlert }); // renderitza <RightsDeclarationModal {...rightsModalProps} />

const onPick = async () => setFiles((await pickMedia()) ?? []);
const onSubmit = async (comment: string) => {
  const result = await create.mutateAsync({ refuge_id: refugeId, comment, files });
  if (result.uploadError || result.failed_files.length) showAlert(t('common.warning'), t('experiences.warnings.someFilesFailedToUpload'));
};
```
