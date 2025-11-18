# Tests d'Integració - RefugisLliures Frontend

## Estructura

```
src/__tests__/integration/
├── setup/
│   ├── mswHandlers.ts       # Handlers de MSW per mockejar API calls
│   ├── mswServer.ts         # Configuració del servidor MSW
│   ├── firebaseMocks.ts     # Mocks de Firebase Auth
│   └── testUtils.tsx        # Utilitats per renderitzar amb providers
├── components/
│   ├── FilterPanel.integration.test.tsx
│   ├── MapViewComponent.integration.test.tsx
│   └── RefugeBottomSheet.integration.test.tsx
└── screens/
    ├── MapScreen.integration.test.tsx
    ├── LoginScreen.integration.test.tsx
    ├── ProfileScreen.integration.test.tsx
    └── FavoritesScreen.integration.test.tsx
```

## Eines Utilitzades

### React Native Testing Library
Utilitzat per renderitzar components i interactuar amb ells en els tests.

### MSW (Mock Service Worker)
Mockeja les crides HTTP al backend de manera realista, interceptant requests i retornant respostes mockejades.

### Firebase Mocks
Utilitats personalitzades per crear mocks de Firebase Auth amb comportament configurable.

## Configuració

### MSW Handlers (`mswHandlers.ts`)
Defineix els endpoints mockejats:
- `GET /refugis/` - Retorna refugis amb filtres opcionals
- `GET /refugis/:id/` - Retorna un refugi específic
- `GET /users/me/` - Retorna l'usuari actual
- `POST /users/` - Crea un nou usuari
- `GET /users/me/favorites/` - Retorna favorits
- `POST /users/me/favorites/:id/` - Afegeix favorit
- `DELETE /users/me/favorites/:id/` - Elimina favorit

### Test Utils (`testUtils.tsx`)
Proporciona:
- `renderWithProviders()` - Renderitza components amb NavigationContainer, SafeAreaProvider, etc.
- `createMockAuthContext()` - Crea un mock del context d'autenticació
- `createMockNavigation()` - Crea un mock de React Navigation
- `createMockRoute()` - Crea un mock de route params

### Firebase Mocks (`firebaseMocks.ts`)
Proporciona:
- `createMockFirebaseUser()` - Crea un usuari de Firebase mockat
- `createMockFirebaseAuth()` - Crea un objecte auth de Firebase mockat
- `mockFirebaseAuthModule()` - Mockeja tot el mòdul de Firebase Auth

## Executar els Tests

### Tots els tests d'integració
```bash
npm test -- src/__tests__/integration
```

### Tests de components
```bash
npm test -- src/__tests__/integration/components
```

### Tests de screens
```bash
npm test -- src/__tests__/integration/screens
```

### Test específic
```bash
npm test -- src/__tests__/integration/screens/LoginScreen.integration.test.tsx
```

### Amb coverage
```bash
npm test -- --coverage src/__tests__/integration
```

## Cobertura dels Tests

### Components (5 fitxers)
- **FilterPanel**: 18 escenaris (~320 línies) - Renderització, filtres de tipus, filtres de condició, sliders, aplicació i neteja de filtres
- **MapViewComponent**: 15 escenaris (~290 línies) - Renderització del mapa, botons de control, permisos d'ubicació, gestor offline
- **RefugeBottomSheet**: 22 escenaris (~390 línies) - Renderització, badges, imatge, interaccions, camps opcionals
- **AppNavigator**: 40+ escenaris (~750 línies) - Navegació entre tabs, BottomSheet, pantalla de detall, hardware back button, toggle favorits, integració completa
- **LeafletWebMap**: 35+ escenaris (~650 línies) - Renderització WebView, markers, selecció, ubicació d'usuari, cache de mapes, comunicació WebView-RN

### Screens (10 fitxers)
- **MapScreen**: 13 escenaris (~320 línies) - Càrrega de refugis, cerca, filtres, selecció d'ubicacions, integració entre components
- **LoginScreen**: 25+ escenaris (~480 línies) - Validació d'email i contrasenya, login amb email/password, login amb Google, recuperació de contrasenya, gestió d'errors
- **ProfileScreen**: 18 escenaris (~340 línies) - Renderització amb dades d'usuari, estadístiques, navegació, avatar, dates
- **FavoritesScreen**: 16 escenaris (~360 línies) - Càrrega de favorits, estat buit, interaccions, filtratge
- **SignUpScreen**: 35+ escenaris (~630 línies) - Selecció d'idioma, validació d'username/email/password, flux complet de registre, navegació entre steps
- **SettingsScreen**: 22 escenaris (~370 línies) - Navegació del menú, canvi d'idioma, logout amb confirmació, eliminació de compte
- **ChangeEmailScreen**: 26 escenaris (~420 línies) - Validació d'email, contrasenya actual, flux complet, gestió d'errors (email en ús, reautenticació)
- **ChangePasswordScreen**: 35+ escenaris (~550 línies) - Validació de força de contrasenya, confirmació, flux complet, gestió d'errors, visibilitat
- **EditProfileScreen**: 28 escenaris (~440 línies) - Càrrega d'username actual, validació (2-20 caràcters), flux complet, fonts de dades (backend/Firebase)
- **RefugeDetailScreen**: 30+ escenaris (~520 línies) - Renderització completa, badges, estadístiques, descripció expandible, descàrrega GPX/KML, diferents tipus de refugis

**Total**: 19 fitxers | 7000+ línies de tests | 335+ escenaris

## Escenaris Coberts

### Escenaris d'Èxit
- ✅ Login i signup correctes amb credencials vàlides
- ✅ Càrrega i visualització de refugis des del backend
- ✅ Aplicació de filtres i cerca
- ✅ Navegació entre pantalles i tabs
- ✅ Càrrega de favorits i estadístiques
- ✅ Actualització de perfil (username, email, contrasenya)
- ✅ Selecció d'idioma i configuració
- ✅ Descàrrega de fitxers GPX/KML
- ✅ Gestió de favorits (afegir/eliminar)
- ✅ Navegació amb hardware back button (Android)
- ✅ Integració completa del navegador amb BottomSheet i pantalla de detall

### Casos Límit
- ✅ Camps buits i validació d'inputs
- ✅ Arrays buits i dades no disponibles
- ✅ Valors undefined i null
- ✅ Errors de xarxa
- ✅ Permisos denegats
- ✅ Usuaris sense dades de backend
- ✅ Contrasenyes dèbils i no coincidents
- ✅ Emails ja en ús
- ✅ Usernames massa curts/llargs (2-20 caràcters)
- ✅ Descripcions llargues amb expand/collapse
- ✅ Refugis amb dades mínimes vs completes
- ✅ Coordenades extremes i molts refugis al mapa
- ✅ Errors en parsejar missatges WebView

### Branques d'Execució
- ✅ Condicions if-else en validacions
- ✅ Try-catch en operacions asíncrones
- ✅ Renderització condicional (isVisible, showPassword, expanded, etc.)
- ✅ Diferents estats de càrrega
- ✅ Múltiples providers d'autenticació (email, Google)
- ✅ Errors específics de Firebase (auth/wrong-password, auth/email-already-in-use, etc.)
- ✅ Diferents tipus i condicions de refugis
- ✅ Cache de mapes disponible vs no disponible
- ✅ Actualització dinàmica vs estàtica de markers
- ✅ Múltiples fluxos de navegació (MapScreen → BottomSheet → DetailScreen)
- ✅ Navegació condicional (step by step en signup)

## Bones Pràctiques Aplicades

1. **Aïllament de Tests**: Cada test és independent i no depèn de l'estat d'altres tests
2. **Mocks Realistes**: MSW proporciona mocks d'API realistes que imiten el comportament real
3. **Async/Await**: Ús de `waitFor` per gestionar operacions asíncrones
4. **Cleanup**: `beforeEach` i `afterEach` per netejar mocks entre tests
5. **Descriptive Names**: Noms de tests descriptius que expliquen què fan
6. **Test Organization**: Tests organitzats en `describe` blocks per categoria
7. **Edge Cases**: Tests específics per casos límit i errors
8. **Branch Coverage**: Tests que cobreixen totes les branques d'execució (if/else, try/catch)

## Afegir Nous Tests

Per afegir un nou test d'integració:

1. Crea un fitxer `*.integration.test.tsx` a la carpeta adequada
2. Importa `renderWithProviders` i altres utilitats de `testUtils`
3. Mockeja els components fills si és necessari
4. Usa `setupMSW()` si necessites mockejar crides API
5. Escriu tests que cobreixin:
   - Renderització bàsica
   - Interaccions d'usuari
   - Casos d'èxit
   - Casos d'error
   - Casos límit
   - Branques d'execució

## Exemple de Test

```typescript
import { renderWithProviders, fireEvent, waitFor } from '../setup/testUtils';
import { setupMSW } from '../setup/mswServer';
import { MyScreen } from '../../../screens/MyScreen';

setupMSW();

describe('MyScreen - Tests d\'integració', () => {
  it('hauria de carregar i mostrar dades', async () => {
    const { getByText } = renderWithProviders(<MyScreen />);
    
    await waitFor(() => {
      expect(getByText('Expected Text')).toBeTruthy();
    });
  });
  
  it('hauria de gestionar errors', async () => {
    // Mock error response
    const { getByText } = renderWithProviders(<MyScreen />);
    
    await waitFor(() => {
      expect(getByText('Error Message')).toBeTruthy();
    });
  });
});
```

## Troubleshooting

### Tests que fallen amb timeout
- Assegura't d'usar `await waitFor()` per operacions asíncrones
- Verifica que els mocks estan configurats correctament

### Mocks no funcionen
- Revisa que `jest.mock()` està abans de les imports
- Verifica que el path del mock és correcte

### MSW no intercepta requests
- Assegura't que `setupMSW()` està cridat al principi del fitxer de test
- Verifica que les URLs dels handlers coincideixin amb les del codi

### Context providers no disponibles
- Usa `renderWithProviders()` en lloc de `render()`
- Proporciona `mockAuthValue` si necessites dades d'autenticació

## Notes Addicionals

- Els tests d'integració són més lents que els unitaris però proporcionen més confiança
- MSW permet testejar el flux complet sense necessitat d'un backend real
- Els mocks de Firebase permeten testejar autenticació sense configuració complexa
- Sempre netejar els mocks després de cada test per evitar interferències

## Recursos

- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [MSW Documentation](https://mswjs.io/)
- [Jest Documentation](https://jestjs.io/)
