/**
 * ============================================================
 * MAIN NAVIGATOR
 * ============================================================
 * Bottom tab navigator shown to authenticated users.
 * Contains 5 tabs: Dashboard, Seasons, Planner, Inventory,
 * Market, Settings.
 *
 * ROLE-BASED TABS:
 * - Farm Manager: sees Dashboard, Seasons, Planner, Inventory
 * - Farm Admin: sees all tabs including Market and Settings
 *   with full Price Configurator access
 * - Super Admin: same as Farm Admin + global admin features
 *
 * TAB BAR STYLING:
 * Uses expo-blur for the frosted glass effect on iOS.
 * Falls back to solid background on Android.
 * ============================================================
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../constants/colors';
import { FontSize } from '../constants/typography';
import { useAuthStore } from '../store/authStore';

// Main screens — we will build these after auth
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import SeasonsScreen from '../screens/seasons/SeasonsScreen';
import PlannerScreen from '../screens/planner/PlannerScreen';
import InventoryScreen from '../screens/inventory/InventoryScreen';
import MarketScreen from '../screens/market/MarketScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

export type MainTabParamList = {
  Dashboard: undefined;
  Seasons: undefined;
  Planner: undefined;
  Inventory: undefined;
  Market: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Icon map for tab bar icons.
 * Uses Ionicons from @expo/vector-icons.
 * Each tab has an active (filled) and inactive (outline) icon.
 */
const TAB_ICONS: Record<
  string,
  { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }
> = {
  Dashboard: { active: 'grid', inactive: 'grid-outline' },
  Seasons: { active: 'leaf', inactive: 'leaf-outline' },
  Planner: { active: 'calendar', inactive: 'calendar-outline' },
  Inventory: { active: 'cube', inactive: 'cube-outline' },
  Market: { active: 'bar-chart', inactive: 'bar-chart-outline' },
  Settings: { active: 'settings', inactive: 'settings-outline' },
};

export default function MainNavigator() {
  const { isAdmin } = useAuthStore();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        /**
         * Dynamic icon based on active/inactive state.
         * Color changes to primary green when active.
         */
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          const iconName = focused ? icons.active : icons.inactive;
          return <Ionicons name={iconName} size={size} color={color} />;
        },

        // Active tab: primary green. Inactive: muted grey
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,

        tabBarLabelStyle: {
          fontSize: FontSize.xs,
          marginBottom: Platform.OS === 'android' ? 4 : 0,
        },

        /**
         * Tab bar background:
         * iOS → frosted glass blur effect (matches Figma design)
         * Android → solid cream background
         */
        tabBarBackground: () =>
            Platform.OS === 'ios' ? (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(248,249,244,0.92)' }]} />
            ) : null,

        tabBarStyle: {
          backgroundColor:
            Platform.OS === 'ios' ? 'transparent' : Colors.bgSecondary,
          borderTopColor: Colors.border,
          borderTopWidth: 0.5,
          elevation: 0,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Seasons" component={SeasonsScreen} />
      <Tab.Screen name="Planner" component={PlannerScreen} />
      <Tab.Screen name="Inventory" component={InventoryScreen} />

      {/**
       * Market and Settings tabs are visible to all users
       * but certain screens within them are admin-only.
       * The screens themselves handle role-based content.
       */}
      <Tab.Screen name="Market" component={MarketScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}