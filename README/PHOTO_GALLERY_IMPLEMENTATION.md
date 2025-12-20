# Implementació de la Galeria de Fotos dels Refugis

## Descripció General

S'ha implementat un sistema complet de galeria de fotos per als refugis amb les següents funcionalitats:

### 1. Visualització de Fotos a RefugeDetailScreen

**Característiques:**
- Carrusel d'imatges que mostra les **3 primeres fotografies** del refugi
- **4a pantalla amb botons** sobre una imatge de fons amb overlay semitransparent:
  - "Veure més fotografies" - Obre la galeria completa
  - "Afegir fotografia" - Permet pujar noves fotos
- **Indicadors de paginació (dots)** a la part inferior centrats de la imatge:
  - 4 punts que indiquen la posició actual
  - El punt actiu té un color més destacat i és més gran
- **Swipe horitzontal** per navegar entre imatges
- La imatge ocupa **tot l'ample de la pantalla** sense padding blanc
- Les imatges estan **enganxades al SafeArea top**

**Implementació:**
- Component: `RefugeDetailScreen.tsx`
- ScrollView horitzontal amb `pagingEnabled`
- Indicadors dinàmics segons l'índex actual
- Gestió d'estats per controlar la imatge visible

### 2. PhotoViewerModal - Visualització de Fotos a Pantalla Completa

**Característiques:**
- **Popup amb fons negre semitransparent** (95% opacitat)
- Fotografia ocupant tot l'ample de la pantalla
- **Botó de tancament** (X blanca) a la cantonada superior dreta
- **Metadata de la fotografia** a la part inferior:
  - Avatar i nom del creador (obtingut via `UsersService`)
  - Data de pujada de la fotografia (format: "dd MMM yyyy")
  - Presentat dins d'una pastilla negra semitransparent
- **Botó d'eliminació** (icona basura) només visible si l'usuari és el creador:
  - Dins d'un cercle negre semitransparent
  - Mostra diàleg de confirmació abans d'eliminar
  - Crida a `RefugeMediaService.deleteRefugeMedia()`
- **Swipe entre fotos** - Es pot desplaçar horitzontalment per veure altres fotos
- **Indicadors de pàgina** a la part inferior per saber quina foto s'està veient

**Implementació:**
- Component: `PhotoViewerModal.tsx`
- Utilitza `useAuth()` per verificar si l'usuari és el creador
- Utilitza `useQuery` de React Query per obtenir info del creador
- ScrollView horitzontal amb `pagingEnabled` per swipe

### 3. GalleryScreen - Galeria Completa de Fotos

**Característiques:**
- **Header fix** amb:
  - Fletxa per tornar enrere (estils consistents amb Edit Profile)
  - Títol: "Galeria de fotos del refugi"
- **Grid de fotos** en format quadrat (3 columnes)
- **Scroll vertical** per veure totes les fotos
- **Al clicar una foto** s'obre el `PhotoViewerModal` amb:
  - La foto seleccionada
  - Possibilitat de fer swipe per veure les altres

**Implementació:**
- Component: `GalleryScreen.tsx`
- Grid amb `flexWrap` per disposició automàtica
- Integració amb `PhotoViewerModal`

### 4. Funcionalitat de Pujada de Fotos

**Característiques:**
- **Sol·licitud de permisos** via `expo-image-picker`:
  - Accés a fotografies i vídeos
  - Opcions: Limitat, Permetre-ho tot, Denegar
- **Selecció múltiple** de fotos/vídeos
- **Indicador de càrrega** mentre es pugen les fotos
- **Conversió de assets a File objects** per a la pujada
- **Crida al servei** `RefugeMediaService.uploadRefugeMedia()`
- **Actualització automàtica** de les dades del refugi després de pujar

**Implementació:**
- Funció: `handleUploadPhotos()` a `RefugeDetailScreen.tsx`
- Utilitza `ImagePicker.requestMediaLibraryPermissionsAsync()`
- Utilitza `ImagePicker.launchImageLibraryAsync()` amb `allowsMultipleSelection: true`
- Refetch automàtic de dades del refugi després de pujar

### 5. RefugeMediaService - Servei de Gestió de Mitjans

El servei ja existia però ara s'utilitza activament:

**Mètodes utilitzats:**
- `getRefugeMedia(refugeId)` - Obtenir llista de mitjans
- `uploadRefugeMedia(refugeId, files[])` - Pujar múltiples fitxers
- `deleteRefugeMedia(refugeId, mediaKey)` - Eliminar un mitjà específic

## Flux d'Usuari

1. **Visualització inicial:**
   - L'usuari veu les 3 primeres fotos en format carrusel
   - Pot fer swipe per navegar entre elles
   - Veu indicadors (dots) a la part inferior

2. **4a pantalla (Botons):**
   - Al fer swipe a la 4a posició, veu 2 botons sobre la imatge de fons
   - Pot triar entre veure més fotos o afegir-ne de noves

3. **Visualització de foto individual:**
   - Al clicar una foto s'obre a pantalla completa
   - Pot fer swipe per veure altres fotos
   - Veu info del creador i data de pujada
   - Si és el creador, pot eliminar la foto

4. **Galeria completa:**
   - Al clicar "Veure més fotografies" s'obre un grid amb totes les fotos
   - Pot scrollar verticalment per veure-les totes
   - Al clicar una foto s'obre el visualitzador

5. **Pujada de fotos:**
   - Al clicar "Afegir fotografia" es demanen permisos
   - Pot seleccionar múltiples fotos/vídeos
   - S'actualitza automàticament el refugi amb les noves fotos

## Tecnologies Utilitzades

- **React Native** - Framework base
- **expo-image-picker** - Selecció de fotos/vídeos
- **@tanstack/react-query** - Gestió d'estats del servidor i cache
- **React Context (AuthContext)** - Autenticació i usuari actual
- **UsersService** - Obtenció de dades dels usuaris (avatar, nom)
- **RefugeMediaService** - Gestió de mitjans dels refugis

## Components Nous Creats

1. **PhotoViewerModal.tsx** - Modal per visualitzar fotos a pantalla completa
2. **GalleryScreen.tsx** - Pantalla amb grid de totes les fotos

## Modificacions a Components Existents

1. **RefugeDetailScreen.tsx**:
   - Afegit carrusel d'imatges amb dots
   - Afegida gestió de galeria i pujada de fotos
   - Integració amb PhotoViewerModal i GalleryScreen

## Notes d'Implementació

### Gestió de Permisos
Els permisos de galeria es demanen just abans de necessitar-los (quan l'usuari clica "Afegir fotografia"), seguint les bones pràctiques d'UX.

### Optimització de Càrrega
Només es carreguen les 3 primeres fotos inicialment per millorar el rendiment. La resta es carreguen sota demanda quan l'usuari obre la galeria completa.

### Verificació de Propietat
S'utilitza el `firebaseUser.uid` del context d'autenticació per comparar amb el `creator_uid` de cada foto i determinar si l'usuari pot eliminar-la.

### Gestió d'Errors
Tots els errors es capturen i es mostren a l'usuari mitjançant alerts personalitzats (`CustomAlert`).

## Possibles Millores Futures

1. **Lazy loading** per a la galeria completa
2. **Comprimir imatges** abans de pujar-les
3. **Preview de vídeos** (actualment només es gestionen com a imatges)
4. **Zoom** a les fotos en el visualitzador
5. **Compartir fotos** a xarxes socials
6. **Reordenar fotos** (drag & drop)
7. **Editar metadata** de les fotos (descripció, localització)
8. **Mode offline** per visualitzar fotos descarregades
