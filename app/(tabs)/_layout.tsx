// Bottom tabs: Today, Subjects, Stats, Settings.
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function icon(name: IconName) {
  return ({ color, size }: { color: string; size: number }) => <Ionicons name={name} color={color} size={size} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: icon('today-outline') }} />
      <Tabs.Screen name="subjects" options={{ title: 'Subjects', tabBarIcon: icon('library-outline') }} />
      <Tabs.Screen name="stats" options={{ title: 'Stats', tabBarIcon: icon('stats-chart-outline') }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: icon('settings-outline') }} />
    </Tabs>
  );
}
