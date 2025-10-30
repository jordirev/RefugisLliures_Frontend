# Pantalla de Login - Documentació

## Descripció
S'ha implementat una pantalla de login que apareix a l'inici de l'aplicació. L'usuari ha d'iniciar sessió abans de poder accedir a la resta de pantalles i funcionalitats de l'app.

## Funcionalitats implementades

### 1. Pantalla de Login (`LoginScreen.tsx`)
- **Camp d'usuari/correu electrònic**: TextInput per introduir credencials
- **Camp de contrasenya**: TextInput amb ocultació de text (secureTextEntry)
- **Enllaç "Has oblidat la contrasenya?"**: Per recuperar la contrasenya (pendent implementar)
- **Botó d'iniciar sessió**: Amb gradient taronja (seguint l'estètica del projecte)
- **Botó de Google**: Per iniciar sessió amb Google (pendent implementar)
- **Logo de l'app**: Imatge provisional que es pot canviar fàcilment

### 2. Estètica
- Segueix l'estètica del projecte amb:
  - Gradients taronja (#FF8904 → #F54900)
  - Disseny modern amb inputs arrodonits
  - Espaiats i tipografia coherents amb la resta de l'app
  - Header amb gradient i logo centrat

### 3. Control d'autenticació
- L'`App.js` gestiona l'estat `isLoggedIn`
- Només es mostra l'`AppNavigator` (amb totes les pantalles i barra de cerca) quan l'usuari està autenticat
- Fins que no s'inicia sessió, només es veu la pantalla de login

### 4. Traduccions
S'han afegit traduccions en 4 idiomes (ca, es, en, fr) per:
- Títol i subtítol
- Placeholders dels camps
- Textos dels botons
- Missatges d'error

## Pendent d'implementar

### Backend
- [ ] Crida real a l'API d'autenticació
- [ ] Gestió de tokens (JWT, etc.)
- [ ] Persistència de sessió (AsyncStorage)
- [ ] Logout functionality

### Funcionalitats
- [ ] Recuperació de contrasenya (forgot password)
- [ ] Login amb Google OAuth
- [ ] Validació de format d'email
- [ ] Indicador de força de contrasenya
- [ ] Registre de nous usuaris

### Logo
- [ ] Substituir la imatge provisional per el logo definitiu de l'app
  - La imatge actual es troba a: `src/assets/images/profileDefaultBackground.png`
  - Per canviar-la, només cal actualitzar la importació a `LoginScreen.tsx` (línia 19)

## Com funciona actualment

De moment, el login accepta **qualsevol credencial** (mode desenvolupament). Quan es fan clic a "Iniciar sessió":
1. Es valida que els camps no estiguin buits
2. Es simula una petició (1 segon de delay)
3. S'accepta l'autenticació i es mostra l'`AppNavigator`

## Arxius modificats
- ✅ `src/screens/LoginScreen.tsx` (nou)
- ✅ `App.js` (modificat per gestionar autenticació)
- ✅ `src/i18n/locales/ca.json` (afegides traduccions)
- ✅ `src/i18n/locales/es.json` (afegides traduccions)
- ✅ `src/i18n/locales/en.json` (afegides traduccions)
- ✅ `src/i18n/locales/fr.json` (afegides traduccions)
- ✅ `src/assets/images/app-logo.svg` (logo provisional SVG)

## Notes
- El logo provisional utilitza la mateixa imatge que el perfil temporalment
- Quan tinguis el logo definitiu, només has de:
  1. Afegir-lo a `src/assets/images/` (per exemple, `app-logo.png`)
  2. Actualitzar la línia 19 de `LoginScreen.tsx` amb el nou import
