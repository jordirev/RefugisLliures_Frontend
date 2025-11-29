/**
 * Script per obtenir el token d'autenticació d'un usuari
 * 
 * Ús: node getToken.js <email> <password>
 * Exemple: node getToken.js usuari@example.com password123
 */

const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
require('dotenv').config();

// Configuració de Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Inicialitzar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function getToken(email, password) {
  try {
    console.log('Autenticant usuari...');
    
    // Autenticar l'usuari
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Obtenir el token
    const token = await user.getIdToken();
    
    console.log('\n✅ Autenticació exitosa!');
    console.log('\n📧 Email:', user.email);
    console.log('🆔 UID:', user.uid);
    console.log('\n🔑 TOKEN:');
    console.log('─────────────────────────────────────────────────');
    console.log(token);
    console.log('─────────────────────────────────────────────────');
    
    // També mostrar informació útil per usar el token
    console.log('\n📋 Per utilitzar en requests HTTP:');
    console.log(`Authorization: Bearer ${token}`);
    
    console.log('\n💡 Nota: Aquest token és vàlid durant 1 hora.');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code) {
      console.error('Codi d\'error:', error.code);
    }
    process.exit(1);
  }
}

// Obtenir arguments de la línia de comandes
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('❌ Cal proporcionar email i password');
  console.log('\nÚs: node getToken.js <email> <password>');
  console.log('Exemple: node getToken.js usuari@example.com password123');
  process.exit(1);
}

// Executar
getToken(email, password);
