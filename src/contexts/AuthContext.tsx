import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { AuthService } from '../services/AuthService';
import type { FirebaseUser } from '../services/AuthService';
import { User, Location } from '../models';
import { UsersService } from '../services/UsersService';
import { changeLanguage, LanguageCode, LANGUAGES } from '../i18n';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  backendUser: User | null;
  favouriteRefuges: Location[];
  visitedRefuges: Location[];
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
  getFavouriteRefuges: () => Promise<Location[] | null>;
  addFavouriteRefuge: (refugeId: number) => Promise<Location[] | null>;
  removeFavouriteRefuge: (refugeId: number) => Promise<Location[] | null>;
  getVisitedRefuges: () => Promise<Location[] | null>;
  addVisitedRefuge: (refugeId: number) => Promise<Location[] | null>;
  removeVisitedRefuge: (refugeId: number) => Promise<Location[] | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [backendUser, setBackendUser] = useState<User | null>(null);
  const [favouriteRefuges, setFavouriteRefuges] = useState<Location[]>([]);
  const [visitedRefuges, setVisitedRefuges] = useState<Location[]>([]);
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
            
            // Carregar refugis favorits i visitats
            const [favourites, visited] = await Promise.all([
              UsersService.getFavouriteRefuges(user.uid, token),
              UsersService.getVisitedRefuges(user.uid, token)
            ]);
            
            if (favourites) setFavouriteRefuges(favourites);
            if (visited) setVisitedRefuges(visited);
            
            // Canviar l'idioma de l'aplicació segons l'idioma de l'usuari del backend
            if (userData.language) {
              const userLanguage = userData.language.toLowerCase();
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
        setFavouriteRefuges([]);
        setVisitedRefuges([]);
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
        
        // Recarregar refugis favorits i visitats
        const [favourites, visited] = await Promise.all([
          UsersService.getFavouriteRefuges(firebaseUser.uid, token),
          UsersService.getVisitedRefuges(firebaseUser.uid, token)
        ]);
        
        if (favourites) setFavouriteRefuges(favourites);
        if (visited) setVisitedRefuges(visited);
        
        // Actualitzar l'idioma de l'aplicació
        if (userData.language) {
          const userLanguage = userData.language.toLowerCase();
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

  const getFavouriteRefuges = async (): Promise<Location[] | null> => {
    if (!firebaseUser) {
      throw new Error('No user is logged in');
    }
    return await UsersService.getFavouriteRefuges(firebaseUser.uid, authToken || undefined);
  };

  const addFavouriteRefuge = async (refugeId: number): Promise<Location[] | null> => {
    if (!firebaseUser) {
      throw new Error('No user is logged in');
    }
    const result = await UsersService.addFavouriteRefuge(firebaseUser.uid, refugeId, authToken || undefined);
    console.log('addFavouriteRefuge result:', result);
    
    if (result !== null && backendUser) {
      const ids = result.filter(r => r.id != null).map(r => String(r.id));
      console.log('Updating backendUser.favourite_refuges with IDs:', ids);
      setBackendUser({ ...backendUser, favourite_refuges: ids });
      setFavouriteRefuges(result);
    }
    return result;
  };

  const removeFavouriteRefuge = async (refugeId: number): Promise<Location[] | null> => {
    if (!firebaseUser) {
      throw new Error('No user is logged in');
    }
    const result = await UsersService.removeFavouriteRefuge(firebaseUser.uid, refugeId, authToken || undefined);
    console.log('removeFavouriteRefuge result:', result);
    
    if (result !== null && backendUser) {
      const ids = result.filter(r => r.id != null).map(r => String(r.id));
      console.log('Updating backendUser.favourite_refuges with IDs:', ids);
      setBackendUser({ ...backendUser, favourite_refuges: ids });
      setFavouriteRefuges(result);
    }
    return result;
  };

  const getVisitedRefuges = async (): Promise<Location[] | null> => {
    if (!firebaseUser) {
      throw new Error('No user is logged in');
    }
    return await UsersService.getVisitedRefuges(firebaseUser.uid, authToken || undefined);
  };

  const addVisitedRefuge = async (refugeId: number): Promise<Location[] | null> => {
    if (!firebaseUser) {
      throw new Error('No user is logged in');
    }
    const result = await UsersService.addVisitedRefuge(firebaseUser.uid, refugeId, authToken || undefined);
    if (result !== null && backendUser) {
      const ids = result.filter(r => r.id != null).map(r => String(r.id));
      setBackendUser({ ...backendUser, visited_refuges: ids });
      setVisitedRefuges(result);
    }
    return result;
  };

  const removeVisitedRefuge = async (refugeId: number): Promise<Location[] | null> => {
    if (!firebaseUser) {
      throw new Error('No user is logged in');
    }
    const result = await UsersService.removeVisitedRefuge(firebaseUser.uid, refugeId, authToken || undefined);
    if (result !== null && backendUser) {
      const ids = result.filter(r => r.id != null).map(r => String(r.id));
      setBackendUser({ ...backendUser, visited_refuges: ids });
      setVisitedRefuges(result);
    }
    return result;
  };

  const value: AuthContextType = {
    firebaseUser,
    backendUser,
    favouriteRefuges,
    visitedRefuges,
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
    updateUsername,
    getFavouriteRefuges,
    addFavouriteRefuge,
    removeFavouriteRefuge,
    getVisitedRefuges,
    addVisitedRefuge,
    removeVisitedRefuge
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
