import '@/global.css';

import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { isRunningInExpoGo } from 'expo';
import * as Haptics from 'expo-haptics';
import { Tabs, useNavigationContainerRef } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { MotiView } from 'moti';
import React, { useEffect } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  ViewStyle,
} from 'react-native';
import 'react-native-reanimated';

import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { SubscriptionProvider } from '@/contexts/RevenueCatContext';
import { QueryProvider } from '@/providers/QueryProvider';
import {
  getGlassShadow,
  getGlassTabStyle,
  getSquircle,
} from '@/utils/designHelpers';
import * as Sentry from '@sentry/react-native';

// Navigation integration for performance tracking
const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: !isRunningInExpoGo(),
});

Sentry.init({
  dsn: 'https://30fa1065a683859f2063e0a098ac7dec@o4510470474825728.ingest.de.sentry.io/4510483823853648',

  // Adds more context data to events (IP address, cookies, user, etc.)
  sendDefaultPii: true,

  // Performance monitoring - reduced to minimize RAM usage at startup
  tracesSampleRate: __DEV__ ? 1.0 : 0.1,
  enableNativeFramesTracking: false, // Disabled to prevent iOS watchdog termination

  // Disable verbose logging in production
  enableLogs: __DEV__,

  // Session Replay disabled to prevent RAM overconsumption
  // mobileReplayIntegration was causing iOS watchdog termination
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  integrations: [
    navigationIntegration,
    // mobileReplayIntegration removed - causes excessive RAM usage on iOS
    Sentry.feedbackIntegration(),
  ],

  // Filter out non-actionable errors
  beforeSend(event) {
    const message = event.exception?.values?.[0]?.value || '';
    if (message.includes('canceled the authorization attempt')) {
      return null;
    }
    return event;
  },

  // Disable in development
  enabled: !__DEV__,
});

// Custom Tab Bar with Glassmorphism
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Hide tab bar on onboarding, setup, auth, and index screens
  const currentRouteName = state.routes[state.index]?.name;
  const hiddenScreens = ['onboarding', 'setup', 'auth', 'index', 'movie-detail', '+not-found'];
  if (hiddenScreens.includes(currentRouteName)) {
    return null;
  }

  return (
    <View style={styles.tabBarWrapper}>
      <View style={styles.tabBarContainer}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 80 : 60}
          tint={isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterial'}
          style={styles.blurView}
        >
          <View
            style={[
              styles.tabBarContent,
              {
                backgroundColor: isDark
                  ? 'rgba(30, 30, 30, 0.6)'
                  : 'rgba(255, 255, 255, 0.7)',
                borderWidth: 0.5,
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.06)',
              },
            ]}
          >
            {state.routes
              .filter(route =>
                ['home', 'search', 'watchlist', 'profile'].includes(
                  route.name
                )
              )
              .map(route => {
                const { options } = descriptors[route.key];
                const label = options.title;
                const isFocused = state.routes[state.index].name === route.name;

                const onPress = () => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });

                  if (!isFocused && !event.defaultPrevented) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate(route.name);
                  }
                };

                return (
                  <TouchableOpacity
                    key={route.key}
                    onPress={onPress}
                    style={styles.tabButton}
                    activeOpacity={0.6}
                  >
                    <View style={styles.tabContent}>
                      <View style={styles.tabIcon}>
                        {options.tabBarIcon?.({
                          color: isFocused
                            ? '#E50914'
                            : isDark
                              ? '#8e8e93'
                              : '#8e8e93',
                          focused: isFocused,
                          size: 22,
                        })}
                      </View>
                      <Text
                        style={[
                          styles.tabLabel,
                          {
                            color: isFocused
                              ? '#E50914'
                              : isDark
                                ? '#8e8e93'
                                : '#8e8e93',
                            fontWeight: isFocused ? '600' : '400',
                          },
                        ]}
                      >
                        {label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
          </View>
        </BlurView>
      </View>
    </View>
  );
}

function TabsLayout() {
  const { t } = useLanguage();

  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name='home'
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name='search'
        options={{
          title: t('tabs.search'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'search' : 'search-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name='watchlist'
        options={{
          title: t('tabs.watchlist'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name='onboarding'
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name='setup'
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name='auth'
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name='movie-detail'
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name='+not-found'
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name='_sitemap'
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
    paddingBottom: Platform.OS === 'ios' ? 0 : 8,
  },
  tabBarContainer: {
    width: '100%',
  },
  blurView: {
    overflow: 'hidden',
  },
  tabBarContent: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: -0.1,
  },
});

export default Sentry.wrap(function RootLayout() {
  const ref = useNavigationContainerRef();

  // Register navigation container for Sentry performance tracking
  useEffect(() => {
    if (ref?.current) {
      navigationIntegration.registerNavigationContainer(ref);
    }
  }, [ref]);

  // Initialize expo-updates
  useEffect(() => {
    async function onFetchUpdateAsync() {
      try {
        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (error) {
        Sentry.captureException(error, {
          tags: { context: 'expo-updates' },
        });
      }
    }

    // Only check for updates in production builds
    if (!__DEV__) {
      onFetchUpdateAsync();
    }
  }, []);

  return (
    <QueryProvider>
      <LanguageProvider>
        <SubscriptionProvider>
          <AuthProvider>
            <TabsLayout />
            <StatusBar style='auto' />
          </AuthProvider>
        </SubscriptionProvider>
      </LanguageProvider>
    </QueryProvider>
  );
});
