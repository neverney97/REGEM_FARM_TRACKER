/**
 * ============================================================
 * ROOT NAVIGATOR
 * ============================================================
 * The top-level navigator that decides whether to show:
 * - AuthNavigator: Login, Register, Onboarding (not logged in)
 * - MainNavigator: Full app with bottom tabs (logged in)
 *
 * HOW IT WORKS:
 * 1. App launches → isLoading = true → shows SplashScreen
 * 2. Firebase checks for existing session in AsyncStorage
 * 3. If session found → setUser() → isAuthenticated = true
 * 4. If no session → clearAuth() → isAuthenticated = false
 * 5. Navigator switches to the correct stack automatically
 *
 * The onAuthStateChanged listener in this file is the single
 * source of truth for auth state — it runs once on mount
 * and keeps the store in sync with Firebase at all times.
 * ============================================================
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { auth, db, COLLECTIONS } from '../config/firebase';
import { useAuthStore } from '../store/authStore';
import { useFarmStore } from '../store/farmStore';
import { Colors } from '../constants/colors';
import { User } from '../types/auth';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

export default function RootNavigator() {
  // Pull what we need from the auth store
  const { isAuthenticated, isLoading, setUser, setLoading, clearAuth } =
    useAuthStore();
  const { setActiveFarm, setConfig } = useFarmStore();

  useEffect(() => {
    /**
     * Firebase auth state listener.
     * Fires immediately on mount with the current auth state,
     * then again whenever the user logs in or out.
     *
     * This is the ONLY place we set isLoading to false —
     * ensuring the splash/loading screen shows until Firebase
     * has fully resolved the session.
     */
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          /**
           * User is logged in — fetch their full profile from Firestore.
           * Firebase Auth only stores basic info (email, displayName).
           * Our full User object (role, farmIds, subscriptionPlan etc.)
           * lives in the /users/{uid} Firestore document.
           */
          const userDoc = await getDoc(
            doc(db, COLLECTIONS.USERS, firebaseUser.uid)
          );

          if (userDoc.exists()) {
            // User document found — set the full user in the store
            const userData = userDoc.data() as User;
            setUser({
              ...userData,
              uid: firebaseUser.uid,
              email: firebaseUser.email ?? '',
              displayName:
                firebaseUser.displayName ?? userData.displayName ?? '',
            });

            /**
             * If the user has an active farm, load its config too.
             * This ensures the app is ready to show the dashboard
             * immediately after login without an extra loading step.
             */
            if (userData.activeFarmId) {
              await loadFarmData(userData.activeFarmId);
            }
          } else {
            /**
             * Firebase Auth has a user but no Firestore document.
             * This can happen if registration was interrupted.
             * Treat as logged out and clear the broken state.
             */
            console.warn('User authenticated but no Firestore document found');
            await auth.signOut();
            clearAuth();
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          clearAuth();
        }
      } else {
        /**
         * No Firebase user — clear all local state.
         * This covers: explicit logout, session expiry,
         * or first launch with no previous session.
         */
        clearAuth();
      }
    });

    /**
     * Cleanup: unsubscribe from the listener when the
     * component unmounts to prevent memory leaks.
     */
    return () => unsubscribe();
  }, []);

  /**
   * Loads the active farm and its config from Firestore.
   * Populates the farmStore so all screens have data ready.
   *
   * @param farmId - the ID of the farm to load
   */
  const loadFarmData = async (farmId: string) => {
    try {
      // Load farm document
      const farmDoc = await getDoc(doc(db, COLLECTIONS.FARMS, farmId));
      if (farmDoc.exists()) {
        setActiveFarm({ id: farmDoc.id, ...farmDoc.data() } as any);
      }

      // Load farm config
      const configDoc = await getDoc(
        doc(db, COLLECTIONS.FARMS, farmId, COLLECTIONS.FARM_CONFIG, 'main')
      );
      if (configDoc.exists()) {
        setConfig({ id: configDoc.id, ...configDoc.data() } as any);
      }
    } catch (error) {
      console.error('Error loading farm data:', error);
    }
  };

  /**
   * LOADING STATE
   * Show a green spinner while Firebase resolves the session.
   * This prevents the auth screen from flashing briefly
   * before the user is redirected to the main app.
   */
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  /**
   * NAVIGATION CONTAINER
   * Wraps everything in React Navigation's container.
   * Switches between Auth and Main stacks based on login state.
   */
  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgPrimary,
  },
});