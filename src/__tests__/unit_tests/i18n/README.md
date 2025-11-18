# Tests Unitaris del Mòdul i18n

Aquest directori conté els tests unitaris complets per al mòdul d'internacionalització (`src/i18n/index.ts`) de l'aplicació RefugisLliures.

## Fitxers

- **index.test.ts**: Suite completa de tests per al mòdul i18n

## Cobertura de Tests

Els tests cobreixen els següents aspectes del mòdul i18n:

### 1. Constant LANGUAGES (3 tests)
- ✅ Verifica que hi hagi 4 idiomes suportats (ca, es, en, fr)
- ✅ Valida que cada idioma tingui les propietats `name` i `nativeName`
- ✅ Comprova els noms correctes per cada idioma

### 2. Inicialització (6 tests)
- ✅ Verificació que i18next s'inicialitza correctament
- ✅ Validació del fallback a català
- ✅ Comprovació que tots els recursos de traducció es carreguen
- ✅ Verificació de compatibilityJSON v4
- ✅ Comprovació que escapeValue està desactivat
- ✅ Validació que useSuspense està desactivat

### 3. Detecció de l'idioma del dispositiu (2 tests)
- ✅ Detecció correcta de l'idioma en Android
- ✅ Validació que l'idioma inicial és vàlid

### 4. Detecció de l'idioma en iOS (3 tests)
- ✅ Verificació de la configuració iOS al mock
- ✅ Validació de AppleLocale
- ✅ Validació de AppleLanguages

### 5. Funció changeLanguage (8 tests)
- ✅ Canvi d'idioma correcte
- ✅ Persistència a AsyncStorage
- ✅ Canvi a cada idioma suportat (ca, es, en, fr)
- ✅ Gestió d'errors en desar a AsyncStorage
- ✅ Canvis múltiples d'idioma

### 6. Funció getCurrentLanguage (3 tests)
- ✅ Retorn de l'idioma actual
- ✅ Actualització després d'un canvi
- ✅ Validació del tipus retornat

### 7. Traduccions (8 tests)
- ✅ Traduccions correctes en català
- ✅ Traduccions correctes en espanyol
- ✅ Traduccions correctes en anglès
- ✅ Traduccions correctes en francès
- ✅ Gestió de claus inexistents
- ✅ Fallback a català
- ✅ Interpolació de variables
- ✅ Pluralització

### 8. Persistència d'idioma (4 tests)
- ✅ Crida a AsyncStorage.setItem en canviar idioma
- ✅ Gestió d'errors en desar
- ✅ Gestió d'AsyncStorage buit
- ✅ Persistència de múltiples canvis

### 9. Configuració de i18next (4 tests)
- ✅ Inicialització de react-i18next
- ✅ Namespace translation per defecte
- ✅ Configuració d'escapament HTML
- ✅ Accés directe a traduccions

### 10. Tipus TypeScript (2 tests)
- ✅ Validació del tipus LanguageCode
- ✅ ús de LanguageCode amb changeLanguage

### 11. Gestió d'errors global (2 tests)
- ✅ Gestió d'errors en AsyncStorage sense llançar excepcions
- ✅ Gestió d'errors en operacions d'AsyncStorage

### 12. Casos extrems i validació (4 tests)
- ✅ Manteniment de l'idioma després de múltiples operacions
- ✅ Treball amb tots els idiomes suportats
- ✅ Preservació de traduccions després de canvis
- ✅ Validació de codis d'idioma

## Executar els Tests

### Executar tots els tests del mòdul i18n
```bash
npm test -- src/__tests__/tests_unitaris/i18n/index.test.ts
```

### Executar amb cobertura
```bash
npm test -- src/__tests__/tests_unitaris/i18n/index.test.ts --coverage --collectCoverageFrom="src/i18n/index.ts"
```

### Executar en mode watch
```bash
npm test -- src/__tests__/tests_unitaris/i18n/index.test.ts --watch
```

## Resultats

✅ **49 tests en total**
✅ **Tots els tests passen**
✅ **Cobertura màxima de funcionalitats**

## Escenaris Coberts

### Escenaris d'Èxit
1. ✅ Inicialització correcta del mòdul
2. ✅ Detecció d'idioma del dispositiu (Android i iOS)
3. ✅ Canvi d'idioma entre els 4 idiomes suportats
4. ✅ Persistència d'idioma a AsyncStorage
5. ✅ Traduccions correctes en cada idioma
6. ✅ Interpolació i pluralització
7. ✅ Obtenció de l'idioma actual
8. ✅ Configuració correcta de i18next

### Escenaris d'Error
1. ✅ Error en desar a AsyncStorage (continua funcionant)
2. ✅ Error en llegir d'AsyncStorage (usa idioma del dispositiu)
3. ✅ Claus de traducció inexistents (mostra la clau)
4. ✅ AsyncStorage buit (usa idioma del dispositiu)

### Casos Extrems
1. ✅ Múltiples canvis d'idioma consecutius
2. ✅ Validació de tots els idiomes suportats
3. ✅ Preservació de traduccions entre canvis
4. ✅ Validació de tipus TypeScript

## Mocks Utilitzats

- **AsyncStorage**: Mock de `@react-native-async-storage/async-storage`
- **Platform**: Mock de `react-native` per Android/iOS
- **NativeModules**: Mock de mòduls natius (I18nManager, SettingsManager)

## Notes Importants

1. Els tests no fan reinicialització dinàmica del mòdul per compatibilitat amb Jest
2. S'utilitzen spies per verificar les crides a AsyncStorage
3. Els tests validen tant el comportament com els efectes secundaris
4. La cobertura inclou tots els camins crítics del codi
5. Els tests són independents i es poden executar en qualsevol ordre

## Manteniment

Quan s'actualitzi el mòdul `src/i18n/index.ts`:

1. Actualitzar els tests corresponents
2. Afegir nous tests per noves funcionalitats
3. Executar els tests per assegurar que tot funciona
4. Actualitzar aquesta documentació si cal

## Autoria

Tests creats per assegurar la màxima cobertura i qualitat del mòdul d'internacionalització de RefugisLliures.
