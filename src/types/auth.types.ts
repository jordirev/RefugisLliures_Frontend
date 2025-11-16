/**
 * Tipus i interfícies per al sistema d'autenticació
 */

import type { FirebaseUser } from '../services/AuthService';

/**
 * Estat d'autenticació de l'aplicació
 */
export interface AuthState {
  /** Usuari de Firebase Auth */
  firebaseUser: FirebaseUser | null;
  /** Indica si l'usuari està autenticat i verificat */
  isAuthenticated: boolean;
  /** Token JWT per autenticar amb el backend */
  authToken: string | null;
  /** Indica si s'està carregant l'estat d'autenticació */
  isLoading: boolean;
}

/**
 * Dades per registrar un nou usuari
 */
export interface SignUpData {
  email: string;
  password: string;
  username: string;
  language: 'ca' | 'es' | 'en' | 'fr';
}

/**
 * Dades per iniciar sessió
 */
export interface LoginData {
  email: string;
  password: string;
}

/**
 * Codis d'error de Firebase Auth
 */
export type FirebaseAuthErrorCode =
  | 'auth/email-already-in-use'
  | 'auth/invalid-email'
  | 'auth/operation-not-allowed'
  | 'auth/weak-password'
  | 'auth/user-disabled'
  | 'auth/user-not-found'
  | 'auth/wrong-password'
  | 'auth/too-many-requests'
  | 'auth/network-request-failed'
  | 'auth/popup-closed-by-user'
  | 'auth/cancelled-popup-request'
  | 'auth/internal-error';

/**
 * Error d'autenticació de Firebase
 */
export interface FirebaseAuthError extends Error {
  code: FirebaseAuthErrorCode | string;
  message: string;
}

/**
 * Opcions per a la renovació de token
 */
export interface TokenRefreshOptions {
  /** Si cal forçar la renovació encara que el token no hagi caducat */
  force?: boolean;
}

/**
 * Resposta d'autenticació exitosa
 */
export interface AuthSuccessResponse {
  user: FirebaseUser;
  token: string;
}

/**
 * Hook d'autenticació
 */
export interface UseAuthReturn extends AuthState {
  /** Funció per iniciar sessió */
  login: (email: string, password: string) => Promise<void>;
  /** Funció per registrar-se */
  signup: (email: string, password: string, username: string, language: string) => Promise<void>;
  /** Funció per tancar sessió */
  logout: () => Promise<void>;
  /** Funció per renovar el token */
  refreshToken: (options?: TokenRefreshOptions) => Promise<string | null>;
  /** Funció per recarregar les dades de l'usuari */
  reloadUser: () => Promise<void>;
}

/**
 * Props del proveïdor d'autenticació
 */
export interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Configuració d'autenticació
 */
export interface AuthConfig {
  /** Si cal verificar l'email abans de permetre l'accés */
  requireEmailVerification?: boolean;
  /** Temps d'expiració del token en mil·lisegons */
  tokenExpirationTime?: number;
  /** Si cal renovar automàticament el token */
  autoRefreshToken?: boolean;
}
