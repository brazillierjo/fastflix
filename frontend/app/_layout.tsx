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
} from 'react-native';
import 'react-native-reanimated';

import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { SubscriptionProvider } from '@/contexts/RevenueCatContext';
import { QueryProvider } from '@/providers/QueryProvider';
import {
  getGlassShadow,
  getGlassTabStyle,
  getTabStyle,
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

  // Performance monitoring
  tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  enableNativeFramesTracking: !isRunningInExpoGo(),

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,

  integrations: [
    navigationIntegration,
    Sentry.mobileReplayIntegration(),
    Sentry.feedbackIntegration(),
  ],

  // Disable in development
  enabled: !__DEV__,
});

// Custom Tab Bar with Glassmorphism
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.tabBarWrapper}>
      <View style={styles.tabBarContainer}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 80 : 60}
          tint={isDark ? 'dark' : 'light'}
          style={[styles.blurView, getGlassShadow(isDark)]}
        >
          <View style={[styles.tabBarContent, getGlassTabStyle(isDark)]}>
            {state.routes
              .filter(
                route =>
                  route.name !== 'auth' &&
                  route.name !== '+not-found' &&
                  route.name !== '_sitemap' &&
                  route.name !== 'watchlist'
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
                    activeOpacity={0.7}
                  >
                    <MotiView
                      animate={{
                        scale: isFocused ? 1 : 0.95,
                        opacity: isFocused ? 1 : 0.7,
                      }}
                      transition={{
                        type: 'timing',
                        duration: 200,
                      }}
                      style={[
                        getTabStyle(isFocused, isDark),
                        isFocused && styles.tabButtonActive,
                      ]}
                    >
                      <View style={styles.tabContent}>
                        <View style={styles.tabIcon}>
                          {options.tabBarIcon?.({
                            color: isFocused
                              ? '#fff'
                              : isDark
                                ? '#a3a3a3'
                                : '#737373',
                            focused: isFocused,
                            size: 24,
                          })}
                        </View>
                        <Text
                          style={[
                            styles.tabLabel,
                            {
                              color: isFocused
                                ? '#fff'
                                : isDark
                                  ? '#a3a3a3'
                                  : '#737373',
                            },
                          ]}
                        >
                          {label}
                        </Text>
                      </View>
                    </MotiView>
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
          title: t('tabs.movies'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'film' : 'film-outline'}
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
        name='watchlist'
        options={{
          title: 'Watchlist',
        }}
      />
      <Tabs.Screen
        name='auth'
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
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  tabBarContainer: {
    width: '80%',
    maxWidth: 500, // Limit width on iPad/tablets
  },
  blurView: {
    ...getSquircle(24), // Apple squircle corners for tab bar
    overflow: 'hidden',
  },
  tabBarContent: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
  },
  tabButtonActive: {
    width: '100%',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.3,
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
