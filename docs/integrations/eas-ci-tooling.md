# Integració — Expo/EAS Build, GitHub Actions, SonarCloud, Codecov, emulador Firebase

> **[FET]** comprovat al codi · **[INFERÈNCIA]** deducció · **[NO VERIFICAT]** depèn de config externa.

## Expo
- Expo SDK ~57 (`expo` ~57.0.17), React Native 0.86.3, React 19.2.3, TypeScript ~6.0; nova arquitectura i edge-to-edge obligatòries (ja no hi ha `newArchEnabled`/`edgeToEdgeEnabled` a `app.config.js`; RN 0.86 inclou correccions d'edge-to-edge). Hermes v1 és el motor per defecte; la regressió de memòria de Hermes V1 de SDK 56 està **resolta** des d'`expo` ≥ 57.0.9 i la regressió d'arrencada en dev des d'`expo` ≥ 57.0.17 (no baixis d'aquestes versions). `expo/fetch` és el `fetch` global (no cal canviar `fetchWithLog` ni `MediaUploadService`). `expo-status-bar` és a `plugins`.
- `app.config.js`: nom "Refugis Lliures", `android.package` `com.refugislliures.app`, `ios.bundleIdentifier` `cat.refugislliures.app` (comentari: "Cambiar valor"), permisos d'ubicació i emmagatzematge, plugins `expo-location`, `@react-native-google-signin/google-signin`, `expo-video` (L28-98).
- La carpeta `android/` existeix en local però **no** està versionada (`git ls-files android` buit); no hi ha `ios/` **[FET]**.
- Des d'SDK 57 `npx expo prebuild` **neteja i regenera** `android/` per defecte (`--no-clean` per desactivar-ho). No afecta el repo (CNG: `android/` és al `.gitignore`), però qualsevol canvi manual local a `android/` es perd **[FET]**.
- Comandes: `npm start` (expo start), `npm run android` (`expo run:android`).
- Google Sign-In i `react-native-image-crop-picker` necessiten **build nativa** (dev client), no Expo Go **[FET pel codi de fallback]**.
- Passos per posar en marxa l'entorn: [guides/getting-started.md](../guides/getting-started.md).

## EAS (`eas.json`, `.eas/workflows/create-production-builds.yml`)
- Perfils: `development` (dev client, APK intern), `preview` (APK intern), `production` (app-bundle, store).
- Workflow EAS: build Android de producció a cada push a `main`.
- `GOOGLE_SERVICES_JSON_BASE64` (variable d'EAS) genera `google-services.json` a `app.config.js:9-26`. Les variables `FIREBASE_*` a EAS: **[NO VERIFICAT]**.

## GitHub Actions (`.github/workflows/main.yml`)
Push/PR a `main`, `develop`; Node 22: `npm ci` → `npm run test:coverage -- -u` → `npm run test:e2e` (emulador d'Auth) → Codecov (`coverage/lcov.info`) → SonarQube (`sonarcloud.io`).
- **`-u` actualitza els snapshots a CI** → els tests de snapshot **mai fallen** a CI **[FET]** (L33).

## SonarCloud (`sonar-project.properties`)
`projectKey=jordirev_RefugisLliures_Frontend`, `sources=src`, `tests=src/__tests__`; exclou del coverage dto, models, índexs, `mockData.ts`, `firebase.ts`, locales, `App.js`, `index.js`.

## Tests (Jest)
- `metro.config.js`: `babelTransformerPath` = `react-native-svg-transformer/expo` (l'entrada genèrica trencava el bundling de Metro a SDK 55) **[FET]**.
- `jest.config.js`: preset `@react-native/jest-preset` (paquet separat des de RN 0.85; fixat a `0.86.3`, la mateixa versió que `react-native`, sinó `npm install` falla amb ERESOLVE), `testEnvironment: 'node'`, mapeja `@env` → `__mocks__/env.js`, `expo-constants` → mock; `forceExit: true`.
- `jest.setup.js`: mocks d'AsyncStorage, BackHandler, native-stack, etc.
- Integració amb **MSW**: `src/__tests__/integration/setup/mswServer.ts`, `mswHandlers.ts`, `firebaseMocks.ts`, `testUtils.tsx`.
- E2E: `jest.config.e2e.js` + `firebase emulators:exec --only auth` (`package.json` script `test:e2e`), `src/__tests__/E2E/auth.e2e.test.ts`.
- Scripts: `npm test` (unit+integració amb coverage i després E2E), `npm run test:unit`, `test:integration`, `test:coverage`, `test:watch`.
- Estructura duplicada: `src/__tests__/services/` i `src/__tests__/unit_tests/services/` (també `hooks/` i `mappers/`) contenen tests del mateix codi **[FET]**.
