# Flux 5 — Ocupació / visites planificades d'un refugi

> **[FET]** comprovat al codi · **[INFERÈNCIA]** deducció · **[NO VERIFICAT]** depèn de config externa.

## Peces
| Capa | Fitxer |
|---|---|
| Entrada | `src/screens/RefugeDetailScreen.tsx:844-850` (targeta de capacitat) → modal muntat a L1176-1182 |
| Modal | `src/components/RefugeOccupationModal.tsx` |
| Hooks | `src/hooks/useRefugeVisitsQuery.ts` (claus `['refugeVisits','refuge',id]`, `['refugeVisits','user',uid]`) |
| Servei | `src/services/RefugeVisitService.ts` |

## Diagrama

```mermaid
sequenceDiagram
    autonumber
    participant U as Usuari
    participant D as RefugeDetailScreen
    participant M as RefugeOccupationModal
    participant H as useRefugeVisits / mutacions
    participant S as RefugeVisitService
    participant BE as Backend

    U->>D: toca capacitat
    D->>M: visible = true
    M->>H: useRefugeVisits(refugeId, enabled: visible)
    H->>S: getRefugeVisits
    S->>BE: GET /api/refuges/{rid}/visits/ → {result:[...]}
    U->>M: tria dia (dies passats deshabilitats)
    alt ja hi és (is_visitor)
        U->>M: Editar / Eliminar
        M->>S: PATCH o DELETE /api/refuges/{rid}/visits/{YYYY-MM-DD}/
    else
        M-->>U: avís (disclaimer) → formulari num_visitors
        M->>S: POST /api/refuges/{rid}/visits/{YYYY-MM-DD}/ {num_visitors}
    end
    H->>H: setQueryData a la llista del refugi + invalida ['refugeVisits','user']
    M-->>U: avís placesExceeded si total_visitors > places
```

## Passos
- Calendari amb setmana començant en dilluns; dies passats deshabilitats comparant strings de data (`RefugeOccupationModal.tsx:67-82`).
- Crear (151-178), editar (181-215), eliminar (218-233). Errors via `error.message`.
- Hooks: create (46-85) i update (90-120) fan `setQueryData` + invalidació de visites d'usuari; delete (125-146) invalida.
- Servei: tots els endpoints (`RefugeVisitService.ts`) coincideixen amb el backend **[FET]**; llança missatges en català segons status.
- Contracte PostgreSQL (vegeu [backend-api](../integrations/backend-api.md#contracte-de-visites-reformes-i-dubtes-postgresql)):
  - `POST`/`PATCH` poden respondre `403` amb `code` `user_blocked` o `age_not_confirmed`: el servei llança `ApiError` i el modal mostra el missatge traduït (`getContentErrorMessage`, claus `contentErrors.*`) en lloc del text cru **[FET]**. `GET`/`DELETE` no ho exigeixen.
  - `num_visitors` ≤ 100: el modal ho valida (`refuge.occupation.numVisitorsTooMany`) abans d'enviar; el backend respon 400 per sobre **[FET]**.
  - La data de la URL és estrictament `YYYY-MM-DD`: el modal la construeix amb `padStart` i el servei rebutja qualsevol altre format sense fer la petició **[FET]**.
  - Sense test de modal per al límit de 100: els tests existents del modal depenen de dates fixes de gener de 2026 (ara passades) i no exerciten el formulari **[FET]**; el servei sí que té tests de data i 403.

## Gotchas i bugs
- `is_visitor`/`num_visitors` són per usuari però la clau de cache és per refugi; sense buidat de cache al logout, un altre usuari pot veure dades de l'anterior durant `gcTime` (15 min) **[INFERÈNCIA]**.
- `useUserVisits` (`useRefugeVisitsQuery.ts:32-41`) no s'usa enlloc **[FET]**.
- Claus fora del registre `queryKeys` **[FET]**.
- String en anglès hard-coded (`RefugeOccupationModal.tsx:186`) **[FET]**.
- En mode offline el modal fa una petició que acaba en 401 **[INFERÈNCIA]**.
