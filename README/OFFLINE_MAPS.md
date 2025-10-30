# 📱 Mapes Offline - Sistema de Cache de Tiles

## ✅ Problema Resolt

S'ha solucionat l'error de `react-native-fs` substituint-lo per `expo-file-system`, que és compatible amb Expo.

### Error Original:
```
TypeError: Cannot read property 'RNFSFileTypeRegular' of null
```

### Solució:
- ❌ Remogut: `react-native-fs` 
- ✅ Afegit: `expo-file-system`

---

## 🚀 Com Utilitzar els Mapes Offline

### 1. **Accedir al Gestor Offline**
- Obre l'app i ves a la pestanya "Mapa"
- Prem la icona de **capes** (📋) a la part inferior dreta
- S'obrirà el "Gestor de Mapes Offline"

### 2. **Descarregar Mapes**
- Prem "📱 Descarregar Mapes dels Pirineus"
- Confirma la descàrrega (pot trigar 5-15 minuts)
- Veuràs una barra de progrés amb percentatge
- Quan acabi, el mapa mostrarà "📱 Offline Ready"

### 3. **Utilitzar Offline**
- Desactiva WiFi/dades mòbils
- L'app continuarà funcionant normalment
- Els tiles es carreguen des de l'emmagatzematge local

---

## 🔧 Especificacions Tècniques

### **MapCacheService**
- **Descarrega tiles** dels Pirineus dels nivells de zoom 8-14
- **Guarda tiles localment** utilitzant expo-file-system (compatible amb Expo)
- **Gestiona metadata** amb AsyncStorage
- **Cache híbrid**: utilitza tiles locals si existeixen, sinó online
2. OfflineMapManager
    Interface completa per gestionar descàrregues
    Progress bar amb percentatge i estadístiques
    Informació del cache (mida, estat, última actualització)
    Botons per descarregar i eliminar mapes
3. Integració amb el Mapa
    Detecció automàtica si hi ha cache disponible
    Indicador visual (📱 Offline Ready vs 🌐 Online Only)
    Botó d'accés des del mapa (icona de capes)
🎯 Com Funciona
    Primera vegada: L'usuari veu "🌐 Online Only"
    Prem la icona de capes → S'obre OfflineMapManager
    Prem "Descarregar Mapes" → Comença la descàrrega
    Progress bar mostra l'estat en temps real
    Quan acaba: El mapa mostra "📱 Offline Ready"
📱 Beneficis
    Ús offline complet dels Pirineus
    Descàrrega intel·ligent per lots (no sobrecàrrega)
    Fallback automàtic si un tile local falla
    Gestió d'espai (pots eliminar cache quan vulguis)
    Informació transparent de mida i estat
💾 Especificacions Tècniques
    Àrea: Pirineus (42°N-43°N, -2°W-2.5°E)
    Zoom levels: 8-14 (des de vista general a detall)
    Mida aprox: 50-150 MB depenent de la densitat
    Format: Tiles PNG d'OpenTopoMap
    Emmagatzematge: Documents directory del dispositiu