# Funcionalitat de Registre d'Usuaris (Sign Up)

## Descripció
S'ha implementat la funcionalitat completa de registre de nous usuaris amb selecció d'idioma.

## Característiques

### 1. Pantalla de Selecció d'Idioma
Quan un usuari vol crear un compte, primer ha de seleccionar el seu idioma preferit entre:
- 🏴 Català
- 🇪🇸 Español
- 🇫🇷 Français
- 🇬🇧 English

Els botons de selecció d'idioma són sense borde i mostren l'emoji de la bandera amb el nom de l'idioma.

### 2. Formulari de Registre
Després de seleccionar l'idioma, apareix un formulari amb els següents camps:
- **Nom d'usuari**: Camp per introduir el nom d'usuari desitjat
- **Correu electrònic**: Camp per l'email amb validació
- **Contrasenya**: Camp per la contrasenya (mínim 6 caràcters)
- **Confirmar contrasenya**: Camp per repetir la contrasenya

### 3. Validacions Implementades
- Camp de nom d'usuari no pot estar buit
- Camp d'email no pot estar buit i ha de ser un email vàlid
- Contrasenya ha de tenir almenys 6 caràcters
- Les dues contrasenyes han de coincidir
- Feedback visual d'errors amb Alert natiu

### 4. Navegació
- Des de LoginScreen: Text clicable "No tens compte? Registra't"
- Des de SignUpScreen: Es pot tornar a LoginScreen
- Després del registre exitós: Torna a LoginScreen amb missatge de confirmació

## Fitxers Modificats/Creats

### Nous fitxers:
- `src/screens/SignUpScreen.tsx` - Pantalla de registre
- `src/assets/images/flags/README.md` - Documentació sobre banderes
- `SIGNUP_README.md` - Aquest fitxer

### Fitxers modificats:
- `App.js` - Gestió de navegació entre Login i SignUp
- `src/screens/LoginScreen.tsx` - Afegit enllaç a SignUp
- `src/i18n/locales/ca.json` - Traduccions en català
- `src/i18n/locales/es.json` - Traduccions en espanyol
- `src/i18n/locales/en.json` - Traduccions en anglès
- `src/i18n/locales/fr.json` - Traduccions en francès

## Traduccions Afegides

Totes les traduccions s'han afegit als 4 idiomes (ca, es, en, fr):
- `signup.title` - "Crear compte" / "Create account", etc.
- `signup.subtitle` - "Registra't per començar"
- `signup.selectLanguage` - "Selecciona el teu idioma"
- `signup.usernamePlaceholder` - "Nom d'usuari"
- `signup.emailPlaceholder` - "Correu electrònic"
- `signup.passwordPlaceholder` - "Contrasenya"
- `signup.confirmPasswordPlaceholder` - "Confirmar contrasenya"
- `signup.signUpButton` - "Registrar-se"
- `signup.alreadyHaveAccount` - "Ja tens un compte?"
- `signup.loginLink` - "Inicia sessió"
- `signup.backToLogin` - "Tornar a l'inici de sessió"
- `signup.successMessage` - Missatge de confirmació
- `signup.errors.*` - Diversos missatges d'error

També s'han afegit a login:
- `login.noAccount` - "No tens compte?"
- `login.signUpLink` - "Registra't"

## Pendents (TODO)

### Backend Integration
El registre actual és només frontend. Cal implementar:
1. Crida a l'API del backend per registrar usuaris
2. Gestió de tokens d'autenticació
3. Emmagatzematge segur de credencials
4. Gestió d'errors específics del servidor (email ja existeix, etc.)

### Millores futures
1. **Banderes**: Substituir els emojis per imatges PNG reals
   - Les imatges haurien d'anar a: `src/assets/images/flags/`
   - Noms: `catalan.png`, `spanish.png`, `french.png`, `british.png`
   - Mida recomanada: 200x100px (ratio 2:1)

2. **Validacions addicionals**:
   - Verificar si el nom d'usuari ja existeix (temps real)
   - Verificar si l'email ja està registrat
   - Força de la contrasenya (indicador visual)
   - CAPTCHA per evitar spam

3. **UX Improvements**:
   - Afegir indicador de "mostrar/amagar contrasenya"
   - Animacions entre pantalles
   - Loading state durant el registre
   - Verificació d'email després del registre

4. **OAuth**:
   - Registre amb Google
   - Registre amb Apple
   - Registre amb Facebook

## Com provar-ho

1. Inicia l'app: `npx expo start`
2. A la pantalla de Login, fes clic a "No tens compte? Registra't"
3. Selecciona un idioma (català, espanyol, francès o anglès)
4. Omple el formulari de registre
5. Prova les validacions:
   - Deixa camps buits
   - Introdueix un email invàlid
   - Utilitza una contrasenya curta (<6 caràcters)
   - Fes que les contrasenyes no coincideixin
6. Registra't correctament
7. Veuràs un missatge de confirmació i tornaràs al Login

## Estil visual

L'estil segueix el mateix disseny que LoginScreen:
- Header amb gradient taronja (#FF8904 → #F54900)
- Logo de l'app
- Inputs amb bordes arrodonits
- Botons amb gradient
- Colors consistents amb la resta de l'app

## Notes tècniques

- **Framework**: React Native amb TypeScript
- **Navegació**: Controlada amb estats (useState) a App.js
- **Internacionalització**: i18next
- **Validacions**: Client-side amb feedback immediat
- **Platform**: Compatible amb iOS i Android
