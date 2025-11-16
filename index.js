import { registerRootComponent } from 'expo';

import App from './App';
// Wire global fetch to our logger so every network request is logged during dev
try {
	// require to avoid issues in environments that don't support ES modules for this file
	const { fetchWithLog } = require('./src/services/fetchWithLog');
	if (fetchWithLog && typeof fetchWithLog === 'function') {
		// In React Native, global.fetch is used. Save original to allow the wrapper to
		// call it and avoid infinite recursion.
		try {
			if (!global.__originalFetch) global.__originalFetch = global.fetch;
		} catch (e) {
			// ignore
		}
		global.fetch = fetchWithLog;
	}
} catch (e) {
	// ignore if it fails in environments where require isn't available
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
