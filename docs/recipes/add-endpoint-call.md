# Recepta — Consumir un endpoint nou del backend

> Patró real del domini renovations. Exemple fil conductor fictici: `GET /api/renovations/{id}/summary/` (**no existeix**).
> Cadena: **Service (DTO)** → **Mapper** → **Hook React Query (Model)** → **Pantalla/Component**.

## 1. DTO — `src/services/dto/<Domini>DTO.ts`
Interfície amb la forma **exacta** del JSON del backend (snake_case), p. ex. `src/services/dto/RenovationDTO.ts`. Exporta-la també a `src/services/dto/index.ts`.
```ts
export interface RenovationSummaryDTO { id: string; participants_count: number; }
```

## 2. Servei — `src/services/<Domini>Service.ts`
Mètode `static async` a la classe existent (`src/services/RenovationService.ts:41`):
```ts
static async getRenovationSummary(id: string): Promise<RenovationSummaryDTO> {
  const url = `${API_BASE_URL}/renovations/${id}/summary/`;
  const response = await apiGet(url);          // afegeix el Bearer i reintenta en 401
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error(body.error || `Error ${response.status}`);
    (error as any).status = response.status;
    throw error;                                // LLANÇA: no retornis null
  }
  return response.json();
}
```
Regles:
- Usa `apiGet/apiPost/apiPatch/apiDelete` de `src/services/apiClient.ts`, **no** `fetch` directe.
- **Llança** en errors (conserva `status`): retornar `null`/`false` fa que `onError` de les mutacions no s'executi (bug real a `src/services/UsersService.ts`). Vegeu [GOTCHAS](../GOTCHAS.md).
- No afegeixis `?id=` redundants (com `RenovationService.ts:168,209`).
- Multipart: construeix `FormData` i **no** fixis `Content-Type` (com l'avatar, `UsersService.ts:369-417`).
- No posis textos d'usuari al servei: retorna codis/estats i tradueix a la UI amb `t(...)`.
- `API_BASE_URL` avui està duplicat a cada servei; si en crees un de nou, reutilitza el mateix valor (idealment centralitzar-lo, vegeu [TECH_DEBT](../TECH_DEBT.md)).

## 3. Mapper — `src/services/mappers/<Domini>Mapper.ts`
Funció pura `mapXFromDTO(dto): X` (p. ex. `src/services/mappers/RenovationMapper.ts:11-22`). Exporta-la a `src/services/mappers/index.ts`. No descartis camps que la UI pugui necessitar (el mapper de renovations perd `expelled_uids`).

## 4. Model — `src/models/index.ts`
Afegeix la interfície del model de frontend (vegeu [add-model.md](add-model.md)).

## 5. Hook — `src/hooks/use<Domini>Query.ts`
```ts
export function useRenovationSummary(id?: string) {
  return useQuery({
    queryKey: ['renovations', 'summary', id],      // idealment afegit a queryKeys
    queryFn: async () => mapRenovationSummaryFromDTO(await RenovationService.getRenovationSummary(id!)),
    enabled: !!id,
  });
}
```
- Defaults globals a `src/config/queryClient.ts` (staleTime 9 min, retry 2, mutacions retry 0).
- Afegeix la clau al registre `queryKeys` (`src/config/queryClient.ts:39-67`) i fes-la servir; avui molts hooks usen arrays literals.
- Mutacions: a `onSuccess` invalida **totes** les claus afectades, incloses les d'usuari si el backend canvia comptadors (`['users','detail']`). Si fas optimistic update, implementa `onMutate`/`onError` amb snapshot com `src/hooks/useUsersQuery.ts:56-121`.
- Crida `mutate` amb **exactament** el tipus d'argument que espera `mutationFn` (bug de `useDeleteRenovation`).
- No facis `.sort()` in-place sobre arrays que vénen de la cache; copia abans.
- Exporta el hook a `src/hooks/index.ts` amb **export amb nom** (`export *` no reexporta `default`).

## 6. UI
- Consumeix el hook; mostra estats `isLoading`/`isError`; errors amb `useCustomAlert` + `t('...')`.
- No cridis `showAlert` de manera síncrona dins l'`onPress` d'un altre alert: `CustomAlert` el tanca just després (`src/components/CustomAlert.tsx:35-42`).
- Textos nous a **les quatre** locales `src/i18n/locales/{ca,es,en,fr}.json`.

## 7. Tests
- Servei: `src/__tests__/unit_tests/services/` amb `fetch`/`apiClient` mockejat, o integració amb MSW afegint el handler a `src/__tests__/integration/setup/mswHandlers.ts`.
- Mapper: `src/__tests__/unit_tests/mappers/`.
- Hook: `src/__tests__/unit_tests/hooks/` amb `QueryClientProvider` de prova.
- Executa `npm run test:unit` / `npx jest <path>`.
