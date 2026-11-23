// Root layout: opens the database once, then shows the navigation stack.
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getDb } from '../src/db/database';
import { AppButton } from '../src/components/AppButton';
import { colors, spacing } from '../src/theme';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const init = () => {
    setError(null);
    getDb()
      .then(() => setReady(true))
      .catch(e => setError(e instanceof Error ? e.message : String(e)));
  };

  useEffect(init, []);

  if (!ready) {
    return (
      <View style={styles.center}>
        {error ? (
          <>
            <Text style={styles.error}>Could not open the database: {error}</Text>
            <AppButton title="Try again" onPress={init} />
          </>
        ) : (
          <ActivityIndicator size="large" color={colors.primary} />
        )}
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="subject/[id]" options={{ title: 'Subject' }} />
        <Stack.Screen name="deck/[id]" options={{ title: 'Deck' }} />
        <Stack.Screen name="card/[id]" options={{ title: 'Card' }} />
        <Stack.Screen name="card/edit" options={{ title: 'Card', presentation: 'modal' }} />
        <Stack.Screen name="review" options={{ title: 'Review' }} />
        <Stack.Screen name="exam/[subjectId]" options={{ title: 'Exam Mode' }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, padding: spacing.xl, backgroundColor: colors.background },
  error: { color: colors.forgot, textAlign: 'center' },
});
