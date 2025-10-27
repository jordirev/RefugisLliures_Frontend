# 🌍 Guia d'Internacionalització (i18n)

Aquesta aplicació utilitza **react-i18next** per gestionar múltiples idiomes de manera eficient i escalable.

## Idiomes Suportats

- 🇨🇦 **Català** (ca) - Idioma per defecte
- 🇪🇸 **Español** (es)
- 🇬🇧 **English** (en)
- 🇫🇷 **Français** (fr)

## Estructura d'Arxius

```
src/
  i18n/
    locales/
      ca.json         # Traduccions en català
      es.json         # Traduccions en espanyol
      en.json         # Traduccions en anglès
      fr.json         # Traduccions en francès
    index.ts          # Configuració d'i18next
  utils/
    useTranslation.ts # Hook personalitzat
```

## Com Utilitzar Traduccions

### 1. En Components React

```tsx
import { useTranslation } from '../utils/useTranslation';

export function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <View>
      <Text>{t('common.search')}</Text>
      <Text>{t('favorites.title')}</Text>
    </View>
  );
}
```

### 2. Traduccions amb Variables

```tsx
// En el fitxer de traduccions:
// "alerts.navigation": "Navegant a {{name}}"

const { t } = useTranslation();
Alert.alert(t('alerts.navigation', { name: refuge.name }));
```

### 3. Plurals

```tsx
// En el fitxer de traduccions:
// "favorites.count": "{{count}} refugi"
// "favorites.count_plural": "{{count}} refugis"

const { t } = useTranslation();
<Text>{t('favorites.count', { count: favoriteCount })}</Text>
```

## Afegir Noves Traduccions

### Pas 1: Afegir Claus als Fitxers JSON

Afegeix la nova clau a **tots** els fitxers d'idioma (`ca.json`, `es.json`, `en.json`, `fr.json`):

**ca.json:**
```json
{
  "mySection": {
    "title": "El meu títol",
    "description": "La meva descripció"
  }
}
```

**es.json:**
```json
{
  "mySection": {
    "title": "Mi título",
    "description": "Mi descripción"
  }
}
```

**en.json:**
```json
{
  "mySection": {
    "title": "My title",
    "description": "My description"
  }
}
```

**fr.json:**
```json
{
  "mySection": {
    "title": "Mon titre",
    "description": "Ma description"
  }
}
```

### Pas 2: Usar al Component

```tsx
import { useTranslation } from '../utils/useTranslation';

export function MyNewScreen() {
  const { t } = useTranslation();
  
  return (
    <View>
      <Text>{t('mySection.title')}</Text>
      <Text>{t('mySection.description')}</Text>
    </View>
  );
}
```

## Canviar l'Idioma de l'Aplicació

L'usuari pot canviar l'idioma des de **Perfil > Idioma**. El canvi es guarda automàticament amb AsyncStorage i persisteix entre sessions.

### Programàticament:

```tsx
import { changeLanguage } from '../i18n';

// Canviar a espanyol
await changeLanguage('es');

// Canviar a anglès
await changeLanguage('en');
```

## Estructura de Claus Recomanada

Organitza les traduccions per seccions lògiques:

```json
{
  "common": {
    // Elements comuns (botons, missatges genèrics)
  },
  "navigation": {
    // Etiquetes de navegació
  },
  "map": {
    // Pantalla de mapa
  },
  "favorites": {
    // Pantalla de favorits
  },
  "profile": {
    // Pantalla de perfil
  },
  "refuge": {
    // Informació de refugis
  },
  "filters": {
    // Filtres
  },
  "alerts": {
    // Missatges d'alerta
  }
}
```

## Bones Pràctiques

1. **Sempre tradueix a tots els idiomes**: Mai deixis una clau sense traduir en algun idioma.

2. **Usa claus descriptives**: `profile.settings.language` és millor que `lang`.

3. **Agrupa per context**: Mantén les traduccions relacionades juntes.

4. **Prova amb tots els idiomes**: Canvia l'idioma de l'app i verifica que tot es mostra correctament.

5. **Variables amb noms clars**: Usa `{{name}}` en comptes de `{{x}}`.

6. **Gestiona els plurals**: Utilitza `_plural` per a formes plurals quan sigui necessari.

## Exemple Complet d'Implementació

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from '../utils/useTranslation';

export function ExampleScreen() {
  const { t } = useTranslation();
  const refugeCount = 5;
  
  const handlePress = () => {
    Alert.alert(
      t('common.success'),
      t('alerts.favoriteUpdated')
    );
  };
  
  return (
    <View>
      <Text>{t('favorites.title')}</Text>
      <Text>{t('favorites.count', { count: refugeCount })}</Text>
      
      <TouchableOpacity onPress={handlePress}>
        <Text>{t('common.save')}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

## Detecció Automàtica d'Idioma

L'aplicació detecta automàticament l'idioma del dispositiu en el primer ús:
- Si l'idioma del dispositiu està suportat → S'usa aquest idioma
- Si no està suportat → S'usa català per defecte

La preferència de l'usuari es guarda i té prioritat sobre l'idioma del sistema.

## Suport i Manteniment

- **Fitxers de traduccions**: `src/i18n/locales/`
- **Configuració**: `src/i18n/index.ts`
- **Hook personalitzat**: `src/utils/useTranslation.ts`
- **Selector d'idioma**: `src/components/LanguageSelector.tsx`

Per afegir un nou idioma:
1. Crea un nou fitxer `xx.json` a `src/i18n/locales/`
2. Afegeix l'idioma a `LANGUAGES` a `src/i18n/index.ts`
3. Importa i afegeix les traduccions a la configuració d'i18next

---

**Nota**: Aquesta implementació està preparada per escalar fàcilment amb més idiomes i traduccions futures.
