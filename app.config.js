import fs from 'fs';
import path from 'path';

// 1. Ruta a l'arrel del projecte (on Expo busca per defecte durant el prebuild)
const rootPath = path.resolve(__dirname, 'google-services.json');

// 2. Injecció del fitxer de Firebase des de la variable d'entorn d'EAS
if (process.env.GOOGLE_SERVICES_JSON_BASE64) {
  try {
    const decodedConfig = Buffer.from(process.env.GOOGLE_SERVICES_JSON_BASE64, 'base64').toString('utf-8');
    
    // Validem que el contingut sigui un JSON vàlid
    JSON.parse(decodedConfig); 

    // Escrivim el fitxer a l'arrel
    fs.writeFileSync(rootPath, decodedConfig);
    
    console.log("✅ google-services.json generat correctament a l'arrel per al prebuild.");
  } catch (e) {
    console.error("❌ ERROR: La variable GOOGLE_SERVICES_JSON_BASE64 no és un Base64/JSON vàlid.");
    console.error(e.message);
  }
} else {
  console.warn("⚠️ ADVERTÈNCIA: GOOGLE_SERVICES_JSON_BASE64 no detectada (ignora això si estàs en local sense .env).");
}

export default {
  expo: {
    name: "Refugis Lliures",
    slug: "refugis-lliures",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/logo.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    owner: "jordirevs-organization",
    
    splash: {
      image: "./assets/logo.png",
      resizeMode: "contain",
      backgroundColor: "#FF6000"
    },
    
    assetBundlePatterns: ["**/*"],
    
    ios: {
      supportsTablet: true,
      bundleIdentifier: "cat.refugislliures.app" // Cambiar valor. Abans s'ha de crear una IOs APP al firebase
    },
    
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/logo.png",
        backgroundColor: "#FF6000"
      },
      package: "com.refugislliures.app",
      // IMPORTANT: Expo farà servir aquest fitxer de l'arrel per generar la carpeta android/
      googleServicesFile: "./google-services.json",
      edgeToEdgeEnabled: true,
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ]
    },

    plugins: [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow Refugis Lliures to use your location."
        }
      ],
      "@react-native-google-signin/google-signin",
      "expo-video"
    ],

    extra: {
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
      firebaseMeasurementId: process.env.FIREBASE_MEASUREMENT_ID,
      eas: {
        projectId: "8cdbe180-a8dc-4b85-a1c7-e67a48860e0e"
      }
    }
  }
};