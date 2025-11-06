import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { AuthService } from '../services/AuthService';
import type { FirebaseUser } from '../services/AuthService';
import { User } from '../models';
import { UsersService } from '../services/UsersService';
import { changeLanguage, LanguageCode, LANGUAGES } from '../i18n';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  backendUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string, username: string, language: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  reloadUser: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  changeEmail: (password: string, newEmail: string) => Promise<void>;
  updateUsername: (newUsername: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [backendUser, setBackendUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Subscriure's als canvis d'autenticació de Firebase
  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChange(async (user) => {
      setFirebaseUser(user);
      
      if (user) {
        try {
          // Obtenir token
          const token = await user.getIdToken();
          setAuthToken(token);
          
          // Carregar dades de l'usuari des del backend amb retry
          // per gestionar el cas on l'usuari s'acaba de crear i el backend encara està processant
          let userData = await UsersService.getUserByUid(user.uid, token);
          let retries = 0;
          const maxRetries = 3;
          
          while (!userData && retries < maxRetries) {
            retries++;
            console.log(`Intent ${retries} de ${maxRetries} per carregar dades d'usuari...`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segon
            userData = await UsersService.getUserByUid(user.uid, token);
          }
          
          // Validar que s'hagin obtingut dades de l'usuari
          if (userData) {
            setBackendUser(userData);
            
            // Canviar l'idioma de l'aplicació segons l'idioma de l'usuari del backend
            if (userData.idioma) {
              const userLanguage = userData.idioma.toLowerCase();
              // Verificar que l'idioma sigui suportat
              if (Object.keys(LANGUAGES).includes(userLanguage)) {
                await changeLanguage(userLanguage as LanguageCode);
              }
            }
          } else {
            console.log('No s\'han pogut carregar les dades d\'usuari del backend després de ' + maxRetries + ' intents.');
            setBackendUser(null);
          }
        } catch (error) {
          console.error('Error carregant dades d\'usuari:', error);
          setBackendUser(null);
        }
      } else {
        setAuthToken(null);
        setBackendUser(null);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const user = await AuthService.login({ email, password });
    // L'estat s'actualitzarà automàticament pel listener onAuthStateChange
  };

  const loginWithGoogle = async () => {
    const user = await AuthService.loginWithGoogle();
    // L'estat s'actualitzarà automàticament pel listener onAuthStateChange
  };

  const signup = async (email: string, password: string, username: string, language: string) => {
    await AuthService.signUp({ email, password, username, language });
    // L'estat s'actualitzarà automàticament pel listener onAuthStateChange
  };

  const logout = async () => {
    await AuthService.logout();
    // L'estat s'actualitzarà automàticament pel listener onAuthStateChange
  };

  const deleteAccount = async () => {
    await AuthService.deleteAccount();
    // L'estat s'actualitzarà automàticament pel listener onAuthStateChange
  };

  const refreshToken = async (): Promise<string | null> => {
    const token = await AuthService.getAuthToken(true);
    setAuthToken(token);
    return token;
  };

  const reloadUser = async () => {
    await AuthService.reloadUser();
    if (firebaseUser) {
      const token = await firebaseUser.getIdToken(true);
      setAuthToken(token);
      const userData = await UsersService.getUserByUid(firebaseUser.uid, token);
      
      if (userData) {
        setBackendUser(userData);
        
        // Actualitzar l'idioma de l'aplicació
        if (userData.idioma) {
          const userLanguage = userData.idioma.toLowerCase();
          if (Object.keys(LANGUAGES).includes(userLanguage)) {
            await changeLanguage(userLanguage as LanguageCode);
          }
        }
      }
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await AuthService.changePassword(currentPassword, newPassword);
  };

  const changeEmail = async (password: string, newEmail: string) => {
    await AuthService.changeEmail(password, newEmail);
  };

  const updateUsername = async (newUsername: string) => {
    if (!firebaseUser) {
      throw new Error('No user is logged in');
    }

    // Actualitzar nom d'usuari al backend
    const updatedUser = await UsersService.updateUser(
      firebaseUser.uid,
      { username: newUsername },
      authToken || undefined
    );

    if (!updatedUser) {
      throw new Error('Failed to update username');
    }

    // Actualitzar l'estat local
    setBackendUser(updatedUser);
  };

  const value: AuthContextType = {
    firebaseUser,
    backendUser,
    isLoading,
    isAuthenticated: !!firebaseUser && firebaseUser.emailVerified,
    authToken,
    login,
    loginWithGoogle,
    signup,
    logout,
    deleteAccount,
    refreshToken,
    reloadUser,
    changePassword,
    changeEmail,
    updateUsername
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
