# Recepta — Afegir una pantalla nova

1. **Fitxer** `src/screens/<Nom>Screen.tsx`, component funcional amb `export function <Nom>Screen` (convenció de `LoginScreen`, `SignUpScreen`).
2. **Registre**:
   - Pantalla de pila → `<Stack.Screen name="<Nom>" component={...} />` a `src/components/AppNavigator.tsx:181-260`.
   - Pestanya → `<Tab.Screen>` a `src/components/TabsNavigator.tsx` (avui: Map, Favorites, Renovations, Profile).
   - Pantalles pre-login (Login/SignUp) **no** usen navigator: es trien per estat a `App.js:59-72`.
3. **Navegació**: no hi ha `ParamList` tipada; es fa servir `navigation.navigate('<Nom>', params)` amb `any`. Comprova el nom exacte de la ruta (existeix l'errata `RefromDetail` per al detall de renovation).
4. **Dades**: hooks de `src/hooks/` (React Query) i `useAuth()` per a usuari/sessió; no cridis serveis directament des de la pantalla si ja hi ha hook.
5. **Textos**: `const { t } = useTranslation()` (`src/hooks/useTranslation.ts`) i claus a les **quatre** locales.
6. **Alertes**: `useCustomAlert()` + `<CustomAlert />`, no `Alert.alert`.
7. **Mode offline**: si la pantalla és accessible sense login (`isOfflineMode`), no assumeixis `firebaseUser`/`backendUser`.
8. **Hooks dins render-props**: no posis `useEffect` dins la funció fill d'un `Tab.Screen` (patró fràgil a `src/components/TabsNavigator.tsx:70-84`); crea un component.
9. **Tests**: `src/__tests__/unit_tests/screens/<Nom>Screen.test.tsx` (snapshot + interacció) i, si cal, integració a `src/__tests__/integration/screens/` amb MSW. Recorda que CI fa `-u` i no detecta canvis de snapshot.
