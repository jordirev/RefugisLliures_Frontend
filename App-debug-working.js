import React from 'react';
import { View, Text } from 'react-native';

console.log('=== APP DEBUG: Starting App component ===');

export default function App() {
  console.log('=== APP DEBUG: App component rendering ===');
  console.log('=== APP DEBUG: About to return basic JSX ===');
  
  return (
    <View style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, color: '#000' }}>
        ✅ FUNCIONA! React 19 + RN 0.81.4
      </Text>
    </View>
  );
}

// const styles = StyleSheet.create({ ... });
console.log('=== APP DEBUG: End of file ===');