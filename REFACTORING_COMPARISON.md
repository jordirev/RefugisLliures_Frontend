# Refactorització: Abans vs Després

## ❌ ABANS (Arquitectura Centralitzada)

```
┌─────────────────────────────────────────────────┐
│              AppNavigator                       │
│  ┌───────────────────────────────────────────┐  │
│  │ • searchQuery                             │  │
│  │ • filters                                 │  │
│  │ • locations                               │  │
│  │ • favoriteIds                             │  │
│  │ • loadRefugis()                           │  │
│  │ • filteredLocations                       │  │
│  │ • favoriteLocations                       │  │
│  │ • handleSearchChange()                    │  │
│  │ • handleOpenFilters()                     │  │
│  │ • handleToggleFavorite()                  │  │
│  │ • selectedLocation                        │  │
│  │ • showBottomSheet                         │  │
│  └───────────────────────────────────────────┘  │
│               │                                  │
│      ┌────────┴────────┐                        │
│      ▼                 ▼                         │
│  MapScreen      FavoritesScreen                 │
│  (Només UI)     (Només UI)                      │
└─────────────────────────────────────────────────┘
```

**Problemes:**
- ❌ Tota la lògica en un sol lloc
- ❌ Props passing excessiu (prop drilling)
- ❌ Difícil de mantenir
- ❌ Re-renders innecessaris
- ❌ Components no reutilitzables

---

## ✅ DESPRÉS (Arquitectura Descentralitzada)

```
┌─────────────────────────────────────────────────┐
│              AppNavigator                       │
│  ┌───────────────────────────────────────────┐  │
│  │ NOMÉS ESTAT GLOBAL:                       │  │
│  │ • selectedLocation                        │  │
│  │ • showBottomSheet                         │  │
│  │ • handleToggleFavorite() (global)         │  │
│  │ • handleNavigate()                        │  │
│  │ • handleViewDetail()                      │  │
│  └───────────────────────────────────────────┘  │
│               │                                  │
│      ┌────────┴────────┐                        │
│      ▼                 ▼                         │
│  ┌─────────┐      ┌──────────────┐              │
│  │MapScreen│      │FavoritesScr..│              │
│  ├─────────┤      ├──────────────┤              │
│  │PROPI:   │      │PROPI:        │              │
│  │• search │      │• favoriteIds │              │
│  │• filters│      │• locations   │              │
│  │• locs   │      │• loadFavs()  │              │
│  │• load() │      │• favorites   │              │
│  └─────────┘      └──────────────┘              │
│      │                    │                      │
│      └────────┬───────────┘                      │
│               ▼                                  │
│       RefugisService.ts                         │
│       (Crides al Backend)                       │
└─────────────────────────────────────────────────┘
```

**Beneficis:**
- ✅ Lògica encapsulada al component que la usa
- ✅ Sense prop drilling
- ✅ Fàcil de mantenir i debugar
- ✅ Components reutilitzables
- ✅ Millor performance (re-renders locals)

---

## 📊 Comparativa de Props

### ABANS:
```tsx
// AppNavigator passava 6+ props a MapScreen
<MapScreen
  locations={locationsWithFavorites}      // ❌
  searchQuery={searchQuery}                // ❌
  onSearchChange={handleSearchChange}      // ❌
  onOpenFilters={handleOpenFilters}        // ❌
  onLocationSelect={handleShowRefugeBS}    // ✅
  selectedLocation={selectedLocation}      // ✅
/>

// AppNavigator passava 3 props a FavoritesScreen
<FavoritesScreen
  favorites={favoriteLocations}            // ❌
  onViewDetail={handleViewDetail}          // ✅
  onViewMap={handleShowRefugeBS}           // ✅
/>
```

### DESPRÉS:
```tsx
// AppNavigator només passa 2 props a MapScreen
<MapScreen
  onLocationSelect={handleShowRefugeBS}    // ✅ Global
  selectedLocation={selectedLocation}      // ✅ Global
/>

// AppNavigator només passa 2 props a FavoritesScreen
<FavoritesScreen
  onViewDetail={handleViewDetail}          // ✅ Global
  onViewMap={handleShowRefugeBS}           // ✅ Global
/>
```

**Reducció de props:** De 9 props → 4 props ✅

---

## 🔄 Flux de Dades

### Exemple: Cerca de Refugis

**ABANS:**
```
User escriu → AppNavigator.searchQuery actualitzat
→ AppNavigator.filteredLocations recalculat
→ Props passades a MapScreen
→ Props passades a SearchBar
→ Props passades a MapViewComponent
→ Mapa actualitzat
```

**DESPRÉS:**
```
User escriu → MapScreen.searchQuery actualitzat
→ MapScreen.filteredLocations recalculat
→ MapViewComponent actualitzat
```

**Reducció de re-renders:** Només MapScreen es re-renderitza, no tota l'app! 🚀

---

## 🎯 On Viuen les Dades Ara?

| Dada                | Abans          | Després        | Raó                          |
|---------------------|----------------|----------------|------------------------------|
| `searchQuery`       | AppNavigator   | MapScreen      | Només MapScreen ho usa       |
| `filters`           | AppNavigator   | MapScreen      | Només MapScreen ho usa       |
| `locations`         | AppNavigator   | Cada Screen    | Cada screen carrega les seves|
| `favoriteIds`       | AppNavigator   | FavoritesScr.  | Només FavoritesScreen ho usa |
| `selectedLocation`  | AppNavigator   | AppNavigator   | Compartit (BottomSheet)      |
| `showBottomSheet`   | AppNavigator   | AppNavigator   | Compartit (BottomSheet)      |

---

## 🚀 Crides al Backend

### MapScreen carrega refugis amb filtres:
```typescript
// A MapScreen.tsx
const loadRefugis = async () => {
  const data = await RefugisService.getRefugis({
    altitude_min: filters.altitude[0],
    altitude_max: filters.altitude[1],
    places_min: filters.capacity[0],
    places_max: filters.capacity[1],
    search: searchQuery || undefined,
  });
  setLocations(data);
};
```

### FavoritesScreen carrega els seus propis favorits:
```typescript
// A FavoritesScreen.tsx
const loadFavorites = async () => {
  const favorites = await RefugisService.getFavorites();
  const allLocations = await RefugisService.getRefugis();
  // Processa i mostra favorits
};
```

Cada screen és **autònom** i fa les seves pròpies crides! 🎯
