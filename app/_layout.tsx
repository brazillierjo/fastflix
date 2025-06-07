import '@/global.css';

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { Text, useColorScheme } from 'react-native';

import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { QueryProvider } from '@/providers/QueryProvider';

function TabsLayout() {
  const { language } = useLanguage();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
          borderTopColor: isDark ? '#374151' : '#E5E7EB',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: isDark ? '#9CA3AF' : '#6B7280',
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: language === 'fr' ? 'Films' : 'Movies',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>🍿</Text>
          ),
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: language === 'fr' ? 'Profil' : 'Profile',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>👤</Text>
          ),
        }}
      />
      <Tabs.Screen
        name='+not-found'
        options={{
          href: null, // This hides the tab from the tab bar
        }}
      />
    </Tabs>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) return null;

  return (
    <QueryProvider>
      <LanguageProvider>
        <TabsLayout />
        <StatusBar style='auto' />
      </LanguageProvider>
    </QueryProvider>
  );
}
