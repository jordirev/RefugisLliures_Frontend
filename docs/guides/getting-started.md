# Guia — Posada en marxa de l'entorn de desenvolupament

> Consolida i actualitza les antigues `README/README.md`, `README/START_HERE.md` i `README/README_NATIVE.md` (octubre 2026).
> Configuració prèvia necessària: [firebase-setup.md](firebase-setup.md) (obligatori) i [google-signin-setup.md](google-signin-setup.md) (per al login amb Google).

## 1. Prerequisits
- Node.js 20 (és la versió de CI, `.github/workflows/main.yml`) i npm.
- Android Studio amb un emulador o un dispositiu Android amb depuració USB. No hi ha carpeta `ios/` ni configuració d'iOS mantinguda.
- Java JDK (per a `keytool` i la build nativa d'Android).
- Opcional: `firebase-tools` per als tests E2E (emulador d'Auth).

## 2. Instal·lació
```bash
git clone https://github.com/jordirev/RefugisLliures_Frontend.git
cd RefugisLliures_Frontend
npm install
cp .env.example .env      # i omple'l: vegeu firebase-setup.md
```

## 3. Executar l'app
| Opció | Comanda | Quan |
|---|---|---|
| Build nativa d'Android (dev client) | `npm run android` (`expo run:android`) | **Recomanada.** Necessària per a Google Sign-In i el retall d'avatar (`react-native-image-crop-picker`). |
| Servidor Metro | `npm start` (`expo start`) | Un cop instal·lada la build de desenvolupament; prem `a` per obrir-la a Android. |
| Expo Go | `npm start` i escanejar el QR | Només per a proves ràpides: **no** funcionen Google Sign-In ni el retall d'avatar (el codi mostra un avís). |
| Web | `npm run web` | No suportat de manera fiable (mapa en WebView, mòduls natius). |

Perfils d'EAS (`eas.json`): `development` (dev client, APK intern), `preview` (APK intern), `production` (app-bundle). Vegeu [integrations/eas-ci-tooling.md](../integrations/eas-ci-tooling.md).

> L'app sempre parla amb el backend de producció a Render (URL fixa a cada servei, vegeu [integrations/backend-api.md](../integrations/backend-api.md)). La primera petició pot trigar uns segons si el servidor estava aturat.

## 4. Scripts útils
```bash
npm start                  # expo start
npm run android            # expo run:android (build nativa)
npm run web                # expo start --web
npm test                   # unit + integració amb coverage, i després E2E
npm run test:unit          # jest __tests__/unit_tests
npm run test:integration   # jest __tests__/integration (MSW)
npm run test:coverage      # unit + integració amb coverage
npm run test:watch
npm run test:e2e           # emulador Firebase Auth
npm run test:e2e:ui        # arrenca l'emulador d'Auth amb UI
```

## 5. Consells de desenvolupament
- Hot reload automàtic en desar; els logs surten a la consola de Metro (totes les peticions HTTP es registren via `fetchWithLog`).
- Menú de desenvolupament al dispositiu: sacseja'l o prem `m` a la consola de Metro.
- Després de canviar `.env` o `babel.config.js`, reinicia Metro **netejant la cache**: `npx expo start -c` (equivalent a `npm start -- --clear`).
- Les variables de `.env` que llegeix `app.config.js` (Firebase) només s'apliquen en regenerar la build nativa (`npm run android`).

## 6. Solució de problemes
| Símptoma | Solució |
|---|---|
| El dispositiu no connecta amb Metro | Mateixa xarxa Wi-Fi que l'ordinador, sense VPN; reinicia `npm start`. Amb USB: `adb reverse tcp:8081 tcp:8081`. |
| Errors estranys de dependències | `rm -rf node_modules package-lock.json && npm install` (o `npm ci` si no vols canviar el lock). |
| Canvis de `.env` que no s'apliquen | `npx expo start -c`; si afecten Firebase, torna a fer `npm run android`. |
| `Missing App configuration value: "projectId"` o `auth/invalid-api-key` | `.env` absent o incomplet: [firebase-setup.md §6](firebase-setup.md#6-solució-de-problemes). |
| El login amb Google diu que no està disponible | Estàs a Expo Go: cal la build nativa ([google-signin-setup.md](google-signin-setup.md)). |
| `Cannot find module '@env'` a l'editor | Ja hi ha `src/types/env.d.ts`; reinicia el servidor de TypeScript de VS Code. |

## 7. Recursos
[Expo](https://docs.expo.dev/) · [React Native](https://reactnative.dev/) · [React Navigation](https://reactnavigation.org/) · [TanStack Query](https://tanstack.com/query/latest)
