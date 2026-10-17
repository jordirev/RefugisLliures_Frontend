# Integració — APIs externes menors i capacitats del dispositiu

> **[FET]** comprovat al codi · **[INFERÈNCIA]** deducció · **[NO VERIFICAT]** depèn de config externa.

## Serveis web externs
| Servei | Ús | On |
|---|---|---|
| Open-Elevation (`https://api.open-elevation.com/api/v1/lookup`) | Autocompletar l'altitud al formulari de refugi a partir de lat/long, amb `fetch` directe | `src/components/RefugeForm.tsx:152-153` |
| Windy | Enllaç extern de meteo | `src/screens/RefugeDetailScreen.tsx:517-518` |
| Wikiloc | Enllaç de rutes | `src/screens/RefugeDetailScreen.tsx:527-528` |
| Unsplash | Imatge de reserva hard-coded | `RefugeDetailScreen.tsx:764`, `RefugeBottomSheet.tsx:67`, `RefugeCard.tsx:48`, `RefugeForm.tsx:583`, `RenovationCard.tsx:72` |
| WhatsApp / Telegram | Enllaços de grup de renovations (validats per regex) | `src/components/RenovationForm.tsx:165-169`, `src/screens/RenovationDetailScreen.tsx:101-114` |
| pyrenees-refuges.com, refuges.info | Fonts de dades citades | `src/screens/AboutTheAppScreen.tsx:77-81` |

Cap d'aquests serveis requereix clau **[FET]**. Disponibilitat i límits d'Open-Elevation: **[NO VERIFICAT]**.

## Capacitats natives
| Capacitat | Llibreria | On |
|---|---|---|
| Ubicació | `expo-location` (permís foreground) | `src/components/MapViewComponent.tsx:67-112`; plugin a `app.config.js:76-81` |
| Galeria (fotos/vídeos) | `expo-image-picker` | `RefugeDetailScreen.tsx:542-599`, `QuickActionsMenu.tsx:165-225`, `ExperiencesScreen.tsx:138-172` |
| Avatar amb retall | `react-native-image-crop-picker` (no a Expo Go) | `src/components/AvatarPopup.tsx:138-170` |
| Fitxers GPX/KML | `expo-file-system` (SAF a Android) i `expo-sharing` (iOS) | `RefugeDetailScreen.tsx:298-412` |
| Connectivitat | `@react-native-community/netinfo` | `App.js:22-34`, `src/screens/LoginScreen.tsx:89` |
| Emmagatzematge local | `@react-native-async-storage/async-storage` | idioma (`src/i18n/index.ts:22,56`), cache de mapes |
| Vídeo | `expo-video` | plugin a `app.config.js:83` |

Dependències declarades sense ús a `src/`: `expo-image-manipulator`, `expo-auth-session` **[FET]**. Hi ha un mock `__mocks__/@react-native-clipboard/clipboard.js` però el paquet no és a `package.json` ni s'usa a `src/` **[FET]**.
