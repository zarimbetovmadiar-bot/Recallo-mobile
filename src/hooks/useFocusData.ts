// useFocusData — loads data every time a screen becomes visible.
//
// Why "on focus" and not only once? When you add a card and go back,
// the previous screen is still in memory. Loading on focus makes the
// counters fresh without any global state library (plan test T9.2).

import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';

export function useFocusData<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(loader, deps);

  const reload = useCallback(async () => {
    try {
      setData(await load());
    } catch (error) {
      Alert.alert('Something went wrong', error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return { data, loading, reload };
}

/** Shows a friendly message for validation errors and a generic one for others. */
export function showError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  Alert.alert(error instanceof Error && error.name === 'ValidationError' ? 'Check your input' : 'Something went wrong', message);
}

/** Expo Router gives params as string | string[]; this returns a number or null. */
export function paramToId(value: string | string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}
