import React, { useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { AppNavigator } from './src/components/AppNavigator';
import { LoginScreen } from './src/screens/LoginScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import './src/i18n'; // Initialize i18n

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showSignUp, setShowSignUp] = useState(false);

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
      {isAuthenticated ? (
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
      <AuthProvider>
        <NavigationContainer>
          <AppContent />
        </NavigationContainer>
      </AuthProvider>
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
