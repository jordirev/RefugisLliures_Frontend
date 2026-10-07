# Recepta — Afegir un model nou (tipus de domini)

> Al frontend els models són **interfícies TypeScript** a `src/models/index.ts` (fitxer únic). Els DTOs (forma del backend) viuen a `src/services/dto/`; els mappers en converteixen.

## Passos
1. **DTO** — `src/services/dto/<Entitat>DTO.ts` amb els camps tal com els retorna el backend (snake_case, opcionals amb `?` i `| null` quan el backend pot enviar `null`). Exporta'l a `src/services/dto/index.ts`.
2. **Model** — afegeix `export interface <Entitat>` a `src/models/index.ts` (models existents: `Location` (refugi), `User`, `Renovation`, `RefugeProposal`, `RefugeVisit`, `Experience`, `Doubt`, `Answer`, `ImageMetadata`, `Filters`…). Convenció actual: es mantenen els noms snake_case del backend (p. ex. `creator_uid`, `ini_date`), excepte el refugi, que es diu `Location`.
3. **Mapper** — `src/services/mappers/<Entitat>Mapper.ts` amb `map<Entitat>FromDTO` (i `map<Entitat>ToDTO` si s'envia). Normalitza `null`/`undefined` (p. ex. `participants_uids || []`). Exporta'l a `src/services/mappers/index.ts`.
4. **Dates**: el backend envia strings ISO (`YYYY-MM-DD` o datetime ISO, zona Madrid). Mantén-les com a string al model i formata a la UI.
5. **Media**: les URLs de fotos són **presignades i caduquen** (1 h al backend): no les desis fora de la cache de React Query.
6. **Tests** — `src/__tests__/unit_tests/mappers/<Entitat>Mapper.test.ts`.
7. **Coverage**: `src/models/index.ts` i `src/services/dto/**` estan exclosos del coverage (`jest.config.js`, `sonar-project.properties`).

## Compte
- No reutilitzis `src/utils/mockData.ts` com a referència de tipus: no s'usa en producció i no coincideix amb `Location` **[FET]**.
- Si el backend afegeix un camp que la UI necessita, afegeix-lo **al DTO i al mapper**: el mapper actua de filtre.
