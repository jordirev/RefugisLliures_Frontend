# 🚀 Guia d'Inici Ràpid - Refugis Lliures

## ✅ Instal·lació Completada!

Les dependencies ja s'han instal·lat correctament.

## 📱 Com executar l'aplicació

### Opció 1: Utilitzar Expo Go (Recomanat per desenvolupament)

1. **Descarrega l'app Expo Go al teu mòbil:**
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Inicia el servidor de desenvolupament:**
   ```bash
   npm start
   ```

3. **Escaneja el codi QR:**
   - **iOS:** Utilitza l'app de Càmera i escaneja el codi QR
   - **Android:** Obre Expo Go i escaneja el codi QR

### Opció 2: Emulador/Simulador

#### iOS (només Mac)
```bash
npm run ios
```

#### Android
```bash
npm run android
```
*Nota: Necessites tenir Android Studio instal·lat amb un emulador configurat*

### Opció 3: Web (preview)
```bash
npm run web
```
*Nota: Algunes funcionalitats com el mapa poden no funcionar correctament al web*

## 🎯 Funcionalitats Implementades

### ✅ Completades
- ✅ Navegació amb Bottom Tabs (Mapa, Favorits, Reformes, Perfil)
- ✅ Visualització de refugis al mapa amb React Native Maps
- ✅ Targetes de refugis amb informació
- ✅ Sistema de favorits
- ✅ Cerca de refugis
- ✅ Bottom Sheet amb informació del refugi
- ✅ Llista de favorits
- ✅ 17 refugis dels Pirineus amb dades mock

### 🚧 En desenvolupament
- ⏳ Filtres avançats (tipus, elevació, dificultat)
- ⏳ Vista de detall completa del refugi
- ⏳ Integració amb GPS real
- ⏳ Compartir refugis
- ⏳ Persistència de favorits amb AsyncStorage
- ⏳ Secció de reformes funcional
- ⏳ Backend API

## 📂 Estructura del Projecte

```
RefugisLliures_Frontend/
├── App.js                          # Punt d'entrada amb navegació
├── src/
│   ├── components/                 # Components reutilitzables
│   │   ├── MapViewComponent.tsx   # Component del mapa
│   │   ├── RefugeCard.tsx         # Targeta de refugi
│   │   ├── RefugeBottomSheet.tsx  # Modal inferior
│   │   └── SearchBar.tsx          # Barra de cerca
│   ├── screens/                    # Pantalles
│   │   ├── MapScreen.tsx          # Pantalla del mapa
│   │   ├── FavoritesScreen.tsx    # Pantalla de favorits
│   │   ├── ReformsScreen.tsx      # Pantalla de reformes
│   │   └── ProfileScreen.tsx      # Pantalla de perfil
│   ├── types/                      # Tipus TypeScript
│   │   └── index.ts               # Definicions d'interfícies
│   └── utils/                      # Utilitats
│       └── mockData.ts            # Dades mock dels refugis
├── package.json
├── app.json                        # Configuració d'Expo
└── README_NATIVE.md               # Documentació
```

## 🔧 Scripts Disponibles

```bash
# Desenvolupament
npm start          # Inicia el servidor d'Expo

# Plataformes específiques
npm run android    # Executa en Android
npm run ios        # Executa en iOS (només Mac)
npm run web        # Executa al navegador

# Altres
npm install        # Instal·la dependencies (ja fet)
```

## 📱 Captura de Pantalles

### Pestanya Mapa
- Mapa interactiu amb marcadors de refugis
- Barra de cerca
- Botó de filtres
- Bottom sheet amb informació

### Pestanya Favorits
- Llista de refugis favorits
- Botó per veure al mapa
- Vista de detall

### Pestanya Reformes
- En construcció
- Placeholder amb informació futura

### Pestanya Perfil
- Estadístiques d'usuari
- Opcions de configuració
- Preferències

## 🐛 Solució de Problemes

### Error: "Command not found: expo"
```bash
npm install -g expo-cli
```

### Error al mapa: "Google Maps API key missing"
El mapa funcionarà igualment amb el proveïdor per defecte. Per millorar-lo:
1. Obtén una API key de Google Maps
2. Afegeix-la a `app.json` (iOS i Android)

### L'app no es connecta
- Assegura't que el mòbil i l'ordinador estan a la mateixa xarxa WiFi
- Desactiva VPN si n'utilitzes
- Intenta reiniciar el servidor amb `npm start`

### Error de dependències
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📚 Recursos

- [React Native Docs](https://reactnative.dev/)
- [Expo Docs](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)

## 🎨 Diferències amb la Versió Web

Aquest projecte ha estat adaptat des d'una versió web (React + Vite + Tailwind).

**Principals canvis:**
- ✅ Radix UI → Components natius
- ✅ Tailwind CSS → StyleSheet API
- ✅ React Router → React Navigation
- ✅ Imatge estàtica → React Native Maps
- ✅ HTML elements → React Native components

Consulta `MIGRATION_NOTES.md` per més detalls.

## 💡 Consells de Desenvolupament

1. **Hot Reload**: Els canvis es reflecteixen automàticament
2. **Logs**: Apareixen a la consola on has executat `npm start`
3. **Debugging**: Prem `m` per obrir el menú de desenvolupament al dispositiu
4. **Clear Cache**: Si hi ha problemes, executa `npm start --clear`

## 🎯 Pròxims Passos

1. **Testejar l'app** en el teu dispositiu
2. **Explorar** les diferents pantalles
3. **Afegir favorits** clicant al cor
4. **Provar la cerca** de refugis
5. **Fer clic als marcadors** del mapa

## 📝 Notes Importants

- Les dades dels refugis són **mock** (simulades)
- Els favorits **no es guarden** encara (es perden al tancar l'app)
- Algunes funcionalitats estan **en desenvolupament**
- El mapa utilitza coordenades **reals** dels Pirineus

## 🤝 Suport

Per qualsevol problema o dubte, revisa:
1. `README_NATIVE.md` - Documentació general
2. `MIGRATION_NOTES.md` - Notes tècniques de migració
3. Logs de la consola

---

**Versió:** 1.0.0  
**Data:** 16 Octubre 2025  
**Autor:** Jordi  
**Projecte:** TFG Refugis Lliures
