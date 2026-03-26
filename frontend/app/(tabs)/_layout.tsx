import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

import { OfflineBanner } from '@/components/OfflineBanner';
import { useLanguage } from '@/contexts/LanguageContext';

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Hide tab bar on index (redirect) screen
  const currentRouteName = state.routes[state.index]?.name;
  if (currentRouteName === 'index') {
    return null;
  }

  return (
    <View style={styles.tabBarWrapper}>
      <View style={styles.tabBarContainer}>
        <View
          style={[
            styles.tabBarContent,
            {
              backgroundColor: isDark ? '#000000' : '#ffffff',
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: isDark
                ? 'rgba(255, 255, 255, 0.15)'
                : 'rgba(0, 0, 0, 0.1)',
            },
          ]}
        >
            {state.routes
              .filter(route =>
                ['home', 'search', 'profile'].includes(route.name)
              )
              .map(route => {
                const { options } = descriptors[route.key];
                const label = options.title;
                const isFocused =
                  state.routes[state.index].name === route.name;

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
                  // Always emit tabPress so screens can listen (e.g. scroll to top)
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
                            : '#8e8e93',
                          focused: isFocused,
                          size: 22,
                        })}
                      </View>
                      <Text
                        style={[
                          styles.tabLabel,
                          {
                            color: isFocused ? '#E50914' : '#8e8e93',
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
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useLanguage();

  return (
    <>
    <OfflineBanner />
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen
        name='index'
        options={{ href: null }}
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
        options={{ href: null }}
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
    </Tabs>
    </>
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
