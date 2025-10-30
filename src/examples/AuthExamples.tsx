/**
 * Exemple d'ús del sistema d'autenticació
 * 
 * Aquest fitxer mostra com utilitzar el context d'autenticació
 * i el servei d'autenticació a la teva aplicació.
 */

import React, { useEffect } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { AuthService } from '../services/AuthService';
import { UsersService } from '../services/UsersService';

// =============================================================================
// EXEMPLE 1: Utilitzar el Context d'Autenticació
// =============================================================================

function ProfileScreen() {
  const { 
    firebaseUser, 
    backendUser, 
    isAuthenticated, 
    isLoading, 
    logout 
  } = useAuth();

  if (isLoading) {
    return <Text>Carregant...</Text>;
  }

  if (!isAuthenticated) {
    return <Text>No estàs autenticat</Text>;
  }

  return (
    <View>
      <Text>Email: {firebaseUser?.email}</Text>
      <Text>Nom: {backendUser?.username}</Text>
      <Text>UID: {firebaseUser?.uid}</Text>
      <Button title="Tancar sessió" onPress={logout} />
    </View>
  );
}

// =============================================================================
// EXEMPLE 2: Login Manual (sense utilitzar el context)
// =============================================================================

function ManualLoginExample() {
  const handleLogin = async () => {
    try {
      const user = await AuthService.login({
        email: 'user@example.com',
        password: 'password123'
      });

      // Comprovar verificació d'email
      if (!user.emailVerified) {
        Alert.alert(
          'Email no verificat',
          'Si us plau, verifica el teu email abans de continuar'
        );
        await AuthService.logout();
        return;
      }

      // Obtenir token
      const token = await AuthService.getAuthToken();
      console.log('Token:', token);

      // Navegar a la pantalla principal
      // navigation.navigate('Home');
    } catch (error: any) {
      const errorMessage = AuthService.getErrorMessageKey(error.code);
      Alert.alert('Error', errorMessage);
    }
  };

  return <Button title="Login" onPress={handleLogin} />;
}

// =============================================================================
// EXEMPLE 3: Registre Manual (sense utilitzar el context)
// =============================================================================

function ManualSignUpExample() {
  const handleSignUp = async () => {
    try {
      const user = await AuthService.signUp({
        email: 'newuser@example.com',
        password: 'password123',
        username: 'NewUser',
        language: 'ca'
      });

      Alert.alert(
        'Registre exitós',
        'S\'ha enviat un email de verificació. Si us plau, comprova la teva safata d\'entrada.'
      );

      // Tancar sessió fins que verifiqui l'email
      await AuthService.logout();

      // Navegar a la pantalla de login
      // navigation.navigate('Login');
    } catch (error: any) {
      const errorMessage = AuthService.getErrorMessageKey(error.code);
      Alert.alert('Error', errorMessage);
    }
  };

  return <Button title="Sign Up" onPress={handleSignUp} />;
}

// =============================================================================
// EXEMPLE 4: Recuperació de Contrasenya
// =============================================================================

function ForgotPasswordExample() {
  const handleResetPassword = async (email: string) => {
    try {
      await AuthService.resetPassword(email);
      Alert.alert(
        'Email enviat',
        'S\'ha enviat un email amb instruccions per recuperar la contrasenya.'
      );
    } catch (error: any) {
      const errorMessage = AuthService.getErrorMessageKey(error.code);
      Alert.alert('Error', errorMessage);
    }
  };

  return <Button title="Recuperar contrasenya" onPress={() => handleResetPassword('user@example.com')} />;
}

// =============================================================================
// EXEMPLE 5: Reenviar Email de Verificació
// =============================================================================

function ResendVerificationExample() {
  const handleResendVerification = async () => {
    try {
      await AuthService.resendVerificationEmail();
      Alert.alert(
        'Email enviat',
        'S\'ha reenviat l\'email de verificació.'
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return <Button title="Reenviar email de verificació" onPress={handleResendVerification} />;
}

// =============================================================================
// EXEMPLE 6: Actualitzar Dades d'Usuari amb Token
// =============================================================================

function UpdateUserExample() {
  const { firebaseUser, authToken, reloadUser } = useAuth();

  const handleUpdateUser = async () => {
    if (!firebaseUser || !authToken) {
      Alert.alert('Error', 'No estàs autenticat');
      return;
    }

    try {
      const updatedUser = await UsersService.updateUser(
        firebaseUser.uid,
        {
          username: 'NouNomUsuari',
          idioma: 'en',
          refugis_favorits: [1, 2, 3]
        },
        authToken
      );

      if (updatedUser) {
        Alert.alert('Èxit', 'Perfil actualitzat correctament');
        // Recarregar dades de l'usuari
        await reloadUser();
      } else {
        Alert.alert('Error', 'No s\'ha pogut actualitzar el perfil');
      }
    } catch (error) {
      Alert.alert('Error', 'No s\'ha pogut actualitzar el perfil');
    }
  };

  return <Button title="Actualitzar perfil" onPress={handleUpdateUser} />;
}

// =============================================================================
// EXEMPLE 7: Escoltar Canvis d'Autenticació
// =============================================================================

function AuthListenerExample() {
  useEffect(() => {
    // Subscriure's als canvis d'estat d'autenticació
    const unsubscribe = AuthService.onAuthStateChange((user) => {
      if (user) {
        console.log('Usuari autenticat:', user.email);
        console.log('Email verificat:', user.emailVerified);
      } else {
        console.log('Sessió tancada');
      }
    });

    // Netejar subscripció quan el component es desmunti
    return () => unsubscribe();
  }, []);

  return <Text>Escoltant canvis d'autenticació...</Text>;
}

// =============================================================================
// EXEMPLE 8: Renovar Token
// =============================================================================

function RefreshTokenExample() {
  const { refreshToken } = useAuth();

  const handleRefreshToken = async () => {
    try {
      const newToken = await refreshToken();
      if (newToken) {
        console.log('Token renovat:', newToken);
        Alert.alert('Èxit', 'Token renovat correctament');
      } else {
        Alert.alert('Error', 'No s\'ha pogut renovar el token');
      }
    } catch (error) {
      Alert.alert('Error', 'No s\'ha pogut renovar el token');
    }
  };

  return <Button title="Renovar token" onPress={handleRefreshToken} />;
}

// =============================================================================
// EXEMPLE 9: Protegir Rutes/Pantalles
// =============================================================================

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Text>Carregant...</Text>;
  }

  if (!isAuthenticated) {
    return <Text>Accés denegat. Si us plau, inicia sessió.</Text>;
  }

  return <>{children}</>;
}

// Ús:
// <ProtectedRoute>
//   <ProfileScreen />
// </ProtectedRoute>

// =============================================================================
// EXEMPLE 10: Obtenir Dades d'Usuari del Backend
// =============================================================================

function GetUserDataExample() {
  const { firebaseUser, authToken } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const fetchUserData = async () => {
    if (!firebaseUser || !authToken) return;

    setLoading(true);
    try {
      const userData = await UsersService.getUserByUid(
        firebaseUser.uid,
        authToken
      );

      if (userData) {
        console.log('Dades d\'usuari:', userData);
        Alert.alert('Èxit', `Hola ${userData.username}!`);
      } else {
        Alert.alert('Error', 'No s\'han pogut obtenir les dades');
      }
    } catch (error) {
      Alert.alert('Error', 'No s\'han pogut obtenir les dades');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      title={loading ? 'Carregant...' : 'Obtenir dades'} 
      onPress={fetchUserData}
      disabled={loading}
    />
  );
}

export {
  ProfileScreen,
  ManualLoginExample,
  ManualSignUpExample,
  ForgotPasswordExample,
  ResendVerificationExample,
  UpdateUserExample,
  AuthListenerExample,
  RefreshTokenExample,
  ProtectedRoute,
  GetUserDataExample
};
