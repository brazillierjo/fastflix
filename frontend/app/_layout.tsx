import '@/global.css';

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { MotiView } from 'moti';
import { useEffect } from 'react';
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

// Custom Tab Bar with Glassmorphism
function CustomTabBar({ state, descriptors, navigation }: any) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.tabBarContainer}>
      <BlurView
        intensity={Platform.OS === 'ios' ? 80 : 60}
        tint={isDark ? 'dark' : 'light'}
        style={[styles.blurView, getGlassShadow(isDark)]}
      >
        <View style={[styles.tabBarContent, getGlassTabStyle(isDark)]}>
          {state.routes
            .filter(
              (route: any) =>
                route.name !== 'auth' &&
                route.name !== '+not-found' &&
                route.name !== '_sitemap'
            )
            .map((route: any, index: number) => {
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
                    style={getTabStyle(isFocused, isDark)}
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
                        })}
                      </View>
                      {isFocused && (
                        <MotiView
                          from={{ opacity: 0, translateX: -5 }}
                          animate={{ opacity: 1, translateX: 0 }}
                          transition={{
                            type: 'timing',
                            duration: 200,
                          }}
                        >
                          <Text style={[styles.tabLabel, { color: '#fff' }]}>
                            {label}
                          </Text>
                        </MotiView>
                      )}
                    </View>
                  </MotiView>
                </TouchableOpacity>
              );
            })}
        </View>
      </BlurView>
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
  tabBarContainer: {
    position: 'absolute',
    bottom: 20,
    left: '10%', // Center with 80% width
    right: '10%',
    maxWidth: 500, // Limit width on iPad/tablets
    alignSelf: 'center',
    width: '80%',
    zIndex: 100,
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

export default function RootLayout() {
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
        console.log('Error fetching latest Expo update:', error);
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
}
