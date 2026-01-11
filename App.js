import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack'; 
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { AppNavigator } from './src/components/AppNavigator';
import { LoginScreen } from './src/screens/LoginScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { queryClient } from './src/config/queryClient';
import './src/i18n'; // Initialize i18n

function AppContent() {
  const { isAuthenticated, isLoading, isOfflineMode, exitOfflineMode } = useAuth();
  const [showSignUp, setShowSignUp] = useState(false);

  // Listener de connexió per sortir del mode offline quan es recupera la connexió
  useEffect(() => {
    if (!isOfflineMode) return;

    const unsubscribe = NetInfo.addEventListener(state => {
      // Si estem en mode offline i es recupera la connexió, tornar al login
      if (state.isConnected && isOfflineMode) {
        console.log('Connexió recuperada, sortint del mode offline...');
        exitOfflineMode();
      }
    });

    return () => unsubscribe();
  }, [isOfflineMode, exitOfflineMode]);

  const stack = createNativeStackNavigator();

  const handleNavigateToSignUp = () => {
    setShowSignUp(true);
  };

  const handleBackToLogin = () => {
    setShowSignUp(false);
  };

  const handleSignUpSuccess = () => {
    setShowSignUp(false);
  };

  // Mostrar loader mentre es carrega l'estat d'autenticació
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isAuthenticated || isOfflineMode ? (
        <AppNavigator />
      ) : showSignUp ? (
        <SignUpScreen 
          onSignUpSuccess={handleSignUpSuccess}
          onBackToLogin={handleBackToLogin}
        />
      ) : (
        <LoginScreen 
          onNavigateToSignUp={handleNavigateToSignUp}
        />
      )}
      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NavigationContainer>
            <AppContent />
          </NavigationContainer>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
