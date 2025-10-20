# Refactorització de l'Estructura de l'Aplicació

## Canvis Realitzats

### 1. **Component: `AppNavigator.tsx`**
- **Ubicació**: `src/components/AppNavigator.tsx`
- **Responsabilitats** (només globals):
  - Gestió de la navegació amb tabs
  - Gestió del `RefugeBottomSheet` (compartit entre pantalles)
  - Handlers globals: toggle favorits, navegació, visualització de detalls

### 2. **Screen: `MapScreen.tsx`**
- **Ubicació**: `src/screens/MapScreen.tsx`
- **Responsabilitats** (lògica pròpia):
  - Gestió de cerca de refugis (`searchQuery`)
  - Gestió de filtres (`filters`)
  - Càrrega de refugis del backend (`loadRefugis()`)
  - Filtrat local de refugis
  - Integració amb el servei `RefugisService`

### 3. **Screen: `FavoritesScreen.tsx`**
- **Ubicació**: `src/screens/FavoritesScreen.tsx`
- **Responsabilitats** (lògica pròpia):
  - Gestió de favorits (`favoriteIds`)
  - Càrrega de favorits del backend
  - Càrrega de tots els refugis per mostrar els favorits
  - Filtrat de refugis favorits

### 4. **Servei: `RefugisService.ts`**
- **Ubicació**: `src/services/RefugisService.ts`
- **Funcionalitats**:
  - `getRefugis(filters?)`: Obté refugis del backend amb filtres opcionals
  - `getFavorites()`: Obté els favorits de l'usuari (TODO: implementar quan el backend estigui llest)
  - `addFavorite(id)`: Afegeix un refugi als favorits (TODO)
  - `removeFavorite(id)`: Elimina un refugi dels favorits (TODO)

### 3. **App.js Simplificat**
- Ara només és el punt d'entrada de l'aplicació
- S'encarrega de configurar els providers globals (SafeAreaProvider, NavigationContainer)
- Delega tota la lògica a `AppNavigator`

### 4. **Tipus Actualitzats**
- **Location**: Actualitzat amb totes les propietats necessàries
  - Compatibilitat amb el backend: `altitude`, `places`, `condition`
  - Propietats addicionals: `isFavorite`, `imageUrl`, `distance`
  - Camps deprecated mantinguts per compatibilitat: `elevation`, `capacity`, `difficulty`

## API del Backend

### Endpoint: Obtenir Refugis
```
GET https://refugislliures-backend.onrender.com/api/refugis/
```

**Paràmetres de cerca (query params)**:
- `altitude_min`: Altitud mínima (número)
- `altitude_max`: Altitud màxima (número)
- `places_min`: Capacitat mínima (número)
- `places_max`: Capacitat màxima (número)
- `type`: Tipus de refugi (string)
- `condition`: Estat del refugi (string: "pobre" | "normal" | "bé" | "excel·lent")
- `search`: Cerca per text lliure (string)

**Exemple**:
```
GET https://refugislliures-backend.onrender.com/api/refugis/?altitude_min=1000&altitude_max=3000&places_min=10
```

## Estat de la Implementació

### ✅ Completat
- [x] Refactorització de `App.js`
- [x] Creació de `AppNavigator.tsx`
- [x] Creació de `RefugisService.ts`
- [x] Integració amb el backend per obtenir refugis amb filtres
- [x] Actualització dels tipus de dades

### 🚧 Pendent (TODO)
- [ ] Implementar crida al backend per obtenir favorits
- [ ] Implementar crida al backend per afegir/eliminar favorits
- [ ] Crear pantalla de filtres (FilterPanel component)
- [ ] Gestió d'errors més robusta (retry, cache, etc.)
- [ ] Indicadors de càrrega (loading states)
- [ ] Gestió d'autenticació si és necessària per favorits

## Estructura del Projecte

```
src/
├── components/
│   ├── AppNavigator.tsx          ← Nova: Gestió de navegació i estat
│   ├── RefugeBottomSheet.tsx     ← Actualitzat: Tipus corregits
│   └── ...
├── screens/
│   ├── MapScreen.tsx
│   ├── FavoritesScreen.tsx
│   ├── ReformsScreen.tsx
│   └── ProfileScreen.tsx
├── services/
│   ├── RefugisService.ts         ← Nou: Crides al backend
│   └── ...
└── types/
    └── index.ts                  ← Actualitzat: Propietats noves

App.js                            ← Simplificat: Només punt d'entrada
```

## Arquitectura i Flux de Dades

### Principi: Lògica al Component que la Utilitza

Cada component/screen gestiona la seva pròpia lògica i estat:

```
AppNavigator (Global)
├── selectedLocation (compartit)
├── showBottomSheet (compartit)
└── Handlers globals del BottomSheet

MapScreen (Local)
├── searchQuery
├── filters
├── locations (obtinguts del backend)
├── loadRefugis()
└── filteredLocations

FavoritesScreen (Local)
├── favoriteIds
├── locations (obtinguts del backend)
├── loadFavorites()
└── favoriteLocations
```

### Avantatges d'aquesta Arquitectura

1. **Encapsulació**: Cada component és autònom
2. **Reutilització**: Components independents són més fàcils de reutilitzar
3. **Mantenibilitat**: Més fàcil trobar i modificar codi
4. **Testing**: Components aïllats són més fàcils de testejar
5. **Performance**: Només es re-renderitza el component que canvia

### Flux de Dades

#### MapScreen
```
Usuario escriu cerca → MapScreen.searchQuery actualitzat 
→ filteredLocations recalculat → Mapa actualitzat
```

#### FavoritesScreen
```
Component munta → loadFavorites() 
→ Crida API → favoriteLocations actualitzat → Llista renderitzada
```

#### BottomSheet (Global)
```
User selecciona refugi → AppNavigator.selectedLocation actualitzat 
→ RefugeBottomSheet es mostra → Accions (favorit, navegació, etc.)
```

## Notes Importants

- Els favorits es gestionen localment fins que el backend tingui la funcionalitat
- La cerca es fa parcialment al backend (filtres principals) i parcialment al client (cerca de text)
- Es mantenen propietats deprecated (`elevation`, `capacity`) per compatibilitat amb codi antic
