import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../providers/AuthProvider';
import { AuthScreen } from '../screens/AuthScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ScannerScreen } from '../screens/ScannerScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { GroupsScreen } from '../screens/GroupsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { useT } from '../lib/i18n';
import { Colors, Radii, Spacing } from '../lib/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, { default: string; active: string }> = {
  Dashboard: { default: '⌂', active: '⌂' },
  Scanner:   { default: '⊕', active: '⊕' },
  Groups:    { default: '◎', active: '◎' },
  Settings:  { default: '⊙', active: '⊙' },
};

function CustomTabBar({ state, descriptors, navigation }: any) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const LABELS: Record<string, string> = {
    Dashboard: t('today'),
    Scanner: t('meals'),
    Groups: t('groups'),
    Settings: t('settings'),
  };
  const EMOJIS: Record<string, string> = {
    Dashboard: '🏠',
    Scanner: '🍽',
    Groups: '👥',
    Settings: '⚙️',
  };

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 12 }]}>
      <View style={styles.tabInner}>
        {state.routes.slice(0, 2).map((route: any, index: number) => {
          const active = state.index === index;
          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              style={[styles.tabBtn, active && styles.tabBtnActive]}
              activeOpacity={0.8}
            >
              <Text style={styles.tabEmoji}>{EMOJIS[route.name]}</Text>
              {active && <Text style={styles.tabLabel}>{LABELS[route.name]}</Text>}
            </TouchableOpacity>
          );
        })}

        {/* Center scan button */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Scanner')}
          style={styles.scanBtn}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 22, color: '#fff' }}>+</Text>
        </TouchableOpacity>

        {state.routes.slice(2).map((route: any, index: number) => {
          const active = state.index === index + 2;
          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              style={[styles.tabBtn, active && styles.tabBtnActive]}
              activeOpacity={0.8}
            >
              <Text style={styles.tabEmoji}>{EMOJIS[route.name]}</Text>
              {active && <Text style={styles.tabLabel}>{LABELS[route.name]}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Scanner" component={ScannerScreen} />
      <Tab.Screen name="Groups" component={GroupsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
}

export function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashText}>bitfit</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  splashText: { fontSize: 36, fontWeight: '900', color: Colors.primary, letterSpacing: -1 },
  tabBar: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 14,
    minWidth: 44,
    justifyContent: 'center',
  },
  tabBtnActive: { backgroundColor: Colors.brandSoft },
  tabEmoji: { fontSize: 18 },
  tabLabel: { fontSize: 11, fontWeight: '700', color: Colors.primary, letterSpacing: 0.3 },
  scanBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
