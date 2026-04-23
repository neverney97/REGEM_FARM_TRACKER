import React from 'react';
import { View, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

/**
 * NativeWind test — if the green background and gold text
 * appear correctly, NativeWind is configured properly.
 */

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function PlaceholderScreen({ route }: any) {
  return (
    <View className="flex-1 justify-center items-center bg-cream">
      <View className="bg-primary px-6 py-4 rounded-card">
        <Text className="text-white text-xl font-bold">
          {route.name}
        </Text>
      </View>
      <Text className="text-text-secondary mt-4 text-base">
        NativeWind ✓
      </Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#1A5C38',
        tabBarInactiveTintColor: '#8FA08F',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8E2',
          borderTopWidth: 0.5,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, any> = {
            Dashboard: focused ? 'grid' : 'grid-outline',
            Seasons: focused ? 'leaf' : 'leaf-outline',
            Planner: focused ? 'calendar' : 'calendar-outline',
            Inventory: focused ? 'cube' : 'cube-outline',
            Market: focused ? 'bar-chart' : 'bar-chart-outline',
            Settings: focused ? 'settings' : 'settings-outline',
          };
          return (
            <Ionicons name={icons[route.name]} size={size} color={color} />
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={PlaceholderScreen} />
      <Tab.Screen name="Seasons" component={PlaceholderScreen} />
      <Tab.Screen name="Planner" component={PlaceholderScreen} />
      <Tab.Screen name="Inventory" component={PlaceholderScreen} />
      <Tab.Screen name="Market" component={PlaceholderScreen} />
      <Tab.Screen name="Settings" component={PlaceholderScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <NavigationContainer>
          <MainTabs />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}