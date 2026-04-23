/**
 * ============================================================
 * APP ENTRY POINT
 * ============================================================
 * This is the first file React Native loads.
 * It registers the root App component with the React Native
 * runtime so the OS knows what to render on launch.
 *
 * We use registerRootComponent from Expo instead of
 * AppRegistry.registerComponent directly because it:
 * - Ensures the app works correctly with Expo Go
 * - Handles environment setup (fonts, splash screen etc.)
 * - Works for both development and production builds
 * ============================================================
 */

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);