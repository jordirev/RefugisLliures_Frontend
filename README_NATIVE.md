# Refugis Lliures - Frontend React Native

Aplicació mòbil per a la gestió i visualització de refugis de muntanya als Pirineus.

## 📱 Característiques

- 🗺️ **Mapa interactiu** amb ubicacions de refugis
- ❤️ **Favorits** per guardar els refugis preferits
- 🔍 **Cerca i filtres** per trobar refugis fàcilment
- 📊 **Informació detallada** de cada refugi
- 🔧 **Reformes** (en desenvolupament)
- 👤 **Perfil d'usuari**

## 🚀 Instal·lació

### Prerequisits

- Node.js (v16 o superior)
- npm o yarn
- Expo CLI
- Expo Go app al teu dispositiu mòbil (opcional)

### Passos

1. **Instal·la les dependències:**

```bash
npm install
```

2. **Inicia l'aplicació:**

```bash
npm start
```

3. **Executa en un dispositiu o emulador:**

- **iOS:** Prem `i` o escaneja el codi QR amb l'app Expo Go
- **Android:** Prem `a` o escaneja el codi QR amb l'app Expo Go
- **Web:** Prem `w` per obrir en el navegador

## 📦 Dependències principals

- **React Native** - Framework principal
- **Expo** - Plataforma de desenvolupament
- **React Navigation** - Navegació entre pantalles
- **React Native Maps** - Mapes interactius
- **TypeScript** - Tipatge estàtic

## 🏗️ Estructura del projecte

```
RefugisLliures_Frontend/
├── App.js                 # Punt d'entrada principal
├── src/
│   ├── components/        # Components reutilitzables
│   │   ├── MapViewComponent.tsx
│   │   ├── RefugeCard.tsx
│   │   ├── RefugeBottomSheet.tsx
│   │   └── SearchBar.tsx
│   ├── screens/          # Pantalles de l'aplicació
│   │   ├── MapScreen.tsx
│   │   ├── FavoritesScreen.tsx
│   │   ├── ReformsScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── types/            # Definicions TypeScript
│   │   └── index.ts
│   └── utils/            # Utilitats i dades mock
│       └── mockData.ts
└── package.json
```

## 🎨 Tecnologies utilitzades

- **React Native 0.81.4**
- **Expo ~54.0**
- **React Navigation** per la navegació
- **React Native Maps** per els mapes
- **TypeScript** per tipatge

## 📝 Scripts disponibles

- `npm start` - Inicia el servidor de desenvolupament d'Expo
- `npm run android` - Executa l'app en Android
- `npm run ios` - Executa l'app en iOS
- `npm run web` - Executa l'app al navegador

## 🔄 Adaptació des de React Web

Aquest projecte ha estat adaptat des d'una versió web (React + Vite + Tailwind) a React Native:

### Canvis principals:

1. **Components UI**: 
   - Radix UI → Components natius de React Native
   - HTML divs → View, Text components
   - CSS/Tailwind → StyleSheet

2. **Navegació**:
   - React Router → React Navigation
   - Bottom tabs natiu

3. **Mapes**:
   - Imatge estàtica → React Native Maps real

4. **Gestos i interaccions**:
   - onClick → onPress
   - Hover states → activeOpacity

## 🚧 Funcionalitats en desenvolupament

- [ ] Filtres avançats
- [ ] Vista de detall completa del refugi
- [ ] Integració amb ubicació GPS real
- [ ] Offline mode
- [ ] Compartir refugis
- [ ] Sistema d'autenticació
- [ ] Backend API

## 📄 Llicència

Aquest projecte és privat.

## 👥 Autor

Jordi - TFG Refugis Lliures
