/**
 * ============================================================
 * AUTH NAVIGATOR
 * ============================================================
 * Stack navigator for all unauthenticated screens:
 * - Splash (first launch only)
 * - Onboarding (first launch only)
 * - Login
 * - Register
 * - JoinFarm (for Farm Managers joining via invite code)
 *
 * FIRST LAUNCH DETECTION:
 * We check AsyncStorage for a 'hasLaunched' flag.
 * If not set → show Splash + Onboarding → set flag.
 * On subsequent launches → go straight to Login.
 * ============================================================
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Auth screens — we will create these next
import SplashScreen from '../screens/auth/SplashScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import JoinFarmScreen from '../screens/auth/JoinFarmScreen';

/**
 * Type definitions for the Auth stack routes.
 * Each route name maps to its screen params.
 * undefined means the screen takes no params.
 */
export type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  JoinFarm: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        /**
         * Hide the default header on all auth screens.
         * Each screen manages its own back button and title.
         */
        headerShown: false,
        /**
         * Slide animation for moving between auth screens.
         * Feels more native than the default fade.
         */
        animation: "none",
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="JoinFarm" component={JoinFarmScreen} />
    </Stack.Navigator>
  );
}