# Guia de Deployment - Refugis Lliures

Aquesta guia explica com generar l'APK i l'AAB de l'aplicació Refugis Lliures utilitzant Expo Application Services (EAS).

## Prerequisits

Abans de començar, assegura't de tenir:
- Node.js instal·lat (versió 18 o superior)
- Un compte d'Expo (pots crear-ne un a https://expo.dev/signup)
- Git instal·lat
- Accés al projecte de Firebase

## 1. Instal·lació d'EAS CLI

Instal·la EAS CLI globalment al teu sistema:

```bash
npm install -g eas-cli
```

## 2. Configuració del Projecte

### 2.1. Verificar app.json

Assegura't que el fitxer `app.json` tingui la configuració correcta per Android:

```json
{
  "expo": {
    "name": "Refugis Lliures",
    "slug": "refugislliures-frontend",
    "version": "1.0.0",
    "android": {
      "package": "cat.refugislliures.app",
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ]
    }
  }
}
```

### 2.2. Configuració d'EAS (eas.json)

El fitxer `eas.json` ja està configurat amb tres perfils de build:

- **development**: Build de desenvolupament amb development client (APK)
- **preview**: Build de previsualització per testejar (APK)
- **production**: Build de producció per pujar a Google Play Store (AAB)

## 3. Autenticació amb Expo

Inicia sessió amb el teu compte d'Expo:

```bash
eas login
```

Segueix les instruccions i introdueix les teves credencials d'Expo.

## 4. Configurar el Projecte a EAS

Si és la primera vegada que fas un build, executa:

```bash
eas build:configure
```

Això configurarà automàticament el teu projecte per usar EAS Build.

## 5. Generar l'APK

### 5.1. APK de Desenvolupament

Per generar un APK per a proves internes amb development client:

```bash
eas build --platform android --profile development
```

### 5.2. APK de Previsualització

Per generar un APK independent per a proves (recomanat per distribuir a testers):

```bash
eas build --platform android --profile preview
```

### 5.3. AAB de Producció

Per generar un Android App Bundle per pujar a Google Play Store:

```bash
eas build --platform android --profile production
```

## 6. Procés de Build

Un cop executis la comanda de build:

1. EAS pujarà el codi al cloud
2. Es construirà l'aplicació als servidors d'Expo
3. Rebràs un enllaç per seguir el progrés del build
4. Quan acabi, podràs descarregar l'APK/AAB des del portal d'Expo o directament des del terminal

El build pot trigar entre 10-30 minuts depenent de la complexitat del projecte.

## 7. Descarregar l'APK/AAB

Després que el build acabi correctament:

### Opció 1: Des del terminal
El terminal et mostrarà un enllaç directe per descarregar el fitxer.

### Opció 2: Des del portal web
1. Ves a https://expo.dev
2. Accedeix al teu projecte
3. Ves a la secció "Builds"
4. Troba el build que acabes de generar
5. Descarrega l'APK o AAB

## 8. Instal·lar l'APK en un Dispositiu Android

### Mètode 1: Directament des del dispositiu
1. Descarrega l'APK al teu dispositiu Android
2. Obre el fitxer APK
3. Activa "Instal·lació d'aplicacions desconegudes" si et ho demana
4. Segueix les instruccions d'instal·lació

### Mètode 2: Via ADB
```bash
adb install path/to/your-app.apk
```

## 9. Pujar a Google Play Store

Per pujar l'aplicació a Google Play Store, necessites l'AAB de producció:

1. Genera l'AAB amb el perfil de producció:
```bash
eas build --platform android --profile production
```

2. Descarrega l'AAB generat

3. Ves a Google Play Console (https://play.google.com/console)

4. Crea una nova aplicació o selecciona l'existent

5. Ves a "Production" > "Create new release"

6. Puja l'AAB descarregat

7. Omple tota la informació requerida (descripció, captures de pantalla, etc.)

8. Envia per revisió

## 10. Builds Locals (Opcional)

Si vols fer builds locals en comptes d'usar el cloud d'EAS:

```bash
eas build --platform android --profile preview --local
```

**Nota**: Els builds locals requereixen:
- Android Studio i Android SDK configurats
- Més temps de configuració inicial
- Més recursos del teu ordinador

## 11. Variables d'Entorn

Si la teva aplicació utilitza variables d'entorn (per exemple, claus API de Firebase), assegura't de configurar-les a EAS:

```bash
eas secret:create --name VARIABLE_NAME --value "valor"
```

O pots afegir-les al fitxer `eas.json`:

```json
{
  "build": {
    "preview": {
      "env": {
        "VARIABLE_NAME": "valor"
      }
    }
  }
}
```

## 12. Actualitzar la Versió

Abans de cada nou build de producció, recorda actualitzar la versió a `app.json`:

```json
{
  "expo": {
    "version": "1.0.1",
    "android": {
      "versionCode": 2
    }
  }
}
```

- **version**: Versió visible per l'usuari (segueix Semantic Versioning)
- **versionCode**: Número intern de versió (ha de ser increment progressiu)

## 13. Solució de Problemes Comuns

### Error: No s'ha pogut autenticar
```bash
eas logout
eas login
```

### Error: El build falla per dependències
Assegura't que totes les dependències estiguin instal·lades:
```bash
npm install
```

### Error: Problemes amb Google Sign-In
Verifica que el `google-services.json` estigui configurat correctament i que les claus SHA-1 estiguin registrades a Firebase Console.

### Build massa lent
Els builds al cloud poden trigar. Considera usar el pla de pagament d'Expo per builds més ràpids o fes builds locals.

## 14. Recursos Addicionals

- [Documentació oficial d'EAS Build](https://docs.expo.dev/build/introduction/)
- [Configuració d'Android](https://docs.expo.dev/build-reference/android-builds/)
- [Guia de Google Play Store](https://docs.expo.dev/submit/android/)
- [Variables d'entorn a EAS](https://docs.expo.dev/build-reference/variables/)

## 15. Checklist Abans de Publicar

- [ ] Versió actualitzada a `app.json`
- [ ] Totes les proves passen correctament
- [ ] Variables d'entorn configurades
- [ ] Icona i splash screen configurats
- [ ] Permisos d'Android revisats
- [ ] Firebase configurat correctament
- [ ] Google Sign-In funcionant
- [ ] APK testat en diversos dispositius
- [ ] Descripció i captures de pantalla preparades per Google Play

## Comandes Ràpides de Referència

```bash
# Instal·lar EAS CLI
npm install -g eas-cli

# Login
eas login

# Build preview (APK)
eas build --platform android --profile preview

# Build production (AAB)
eas build --platform android --profile production

# Veure l'estat dels builds
eas build:list

# Configurar secrets
eas secret:create --name SECRET_NAME --value "value"

# Veure els secrets configurats
eas secret:list
```

---

**Nota**: Aquesta guia assumeix que ja tens configurat el projecte de Firebase i Google Sign-In. Si necessites ajuda amb aquests aspectes, consulta els altres fitxers README del projecte.
