// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { 
  getAuth,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  OAuthProvider,
  updatePassword,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  verifyBeforeUpdateEmail,
  fetchSignInMethodsForEmail
} from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";

// Importar variables d'entorn
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID
} from '@env';


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID
};

// Verificar que tenim els valors necessaris
if (!firebaseConfig.projectId || !firebaseConfig.apiKey || !firebaseConfig.appId) {
  console.error('Firebase configuration is missing required values!');
  console.error('Please check your .env file and ensure all required variables are set.');
  console.error('Required: FIREBASE_API_KEY, FIREBASE_PROJECT_ID, FIREBASE_APP_ID');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
// Note: For React Native, AsyncStorage persistence will be configured after initialization
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { 
  app, 
  auth,
  provider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  OAuthProvider,
  updatePassword,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  verifyBeforeUpdateEmail,
  fetchSignInMethodsForEmail,
  type FirebaseUser
};
