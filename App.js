import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppNavigator } from './src/components/AppNavigator';
import { LoginScreen } from './src/screens/LoginScreen';
import './src/i18n'; // Initialize i18n

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <View style={styles.container}>
          {isLoggedIn ? (
            <AppNavigator />
          ) : (
            <LoginScreen onLoginSuccess={handleLoginSuccess} />
          )}
          <StatusBar style="auto" />
        </View>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
