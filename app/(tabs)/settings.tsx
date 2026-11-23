// Settings: demo clock, demo data, delete everything, about.
import React, { useState } from 'react';
import { Alert, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { AppButton } from '../../src/components/AppButton';
import { Panel, Row, SectionTitle, textStyles } from '../../src/components/ui';
import { showError } from '../../src/hooks/useFocusData';
import { getDemoOffset, setDemoOffset, today } from '../../src/utils/clock';
import { deleteAllData, loadDemoData } from '../../src/db/seed';
import { formatDay } from '../../src/utils/dates';
import { spacing } from '../../src/theme';

export default function SettingsScreen() {
  const [offset, setOffset] = useState(getDemoOffset());
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      setOffset(getDemoOffset());
    }, []),
  );

  const shift = (days: number) => {
    setDemoOffset(days);
    setOffset(days);
  };

  const confirm = (title: string, message: string, action: () => Promise<void>, done: string) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Continue',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await action();
            Alert.alert(done);
          } catch (e) {
            showError(e);
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <SectionTitle>Demo clock</SectionTitle>
      <Panel style={{ gap: spacing.md }}>
        <Text style={textStyles.body}>
          App date: <Text style={{ fontWeight: '700' }}>{formatDay(today())}</Text>
          {offset !== 0 ? ` (${offset > 0 ? '+' : ''}${offset} days)` : ' (real date)'}
        </Text>
        <Text style={textStyles.muted}>
          For the presentation: move the app's "today" forward to show how cards come back later. Only Recallo is affected,
          and the clock resets when the app restarts.
        </Text>
        <Row>
          <AppButton title="−1 day" small variant="secondary" onPress={() => shift(offset - 1)} style={{ flex: 1 }} />
          <AppButton title="+1 day" small variant="secondary" onPress={() => shift(offset + 1)} style={{ flex: 1 }} />
          <AppButton title="+6 days" small variant="secondary" onPress={() => shift(offset + 6)} style={{ flex: 1 }} />
        </Row>
        <AppButton title="Back to the real date" variant="ghost" onPress={() => shift(0)} disabled={offset === 0} />
      </Panel>

      <SectionTitle>Data</SectionTitle>
      <Panel style={{ gap: spacing.md }}>
        <AppButton
          title="Load demo data"
          variant="secondary"
          loading={busy}
          onPress={() =>
            confirm(
              'Load demo data?',
              'All your current subjects, cards and history will be replaced by demo data.',
              loadDemoData,
              'Demo data loaded',
            )
          }
        />
        <AppButton
          title="Delete all data"
          variant="danger"
          disabled={busy}
          onPress={() =>
            confirm('Delete everything?', 'All subjects, cards and history will be deleted. This cannot be undone.', deleteAllData, 'All data deleted')
          }
        />
        <Text style={textStyles.muted}>All data is stored only on this phone (SQLite). Recallo works without internet.</Text>
      </Panel>

      <SectionTitle>About</SectionTitle>
      <Panel style={{ gap: spacing.xs }}>
        <Text style={textStyles.title}>Recallo 1.0</Text>
        <Text style={textStyles.muted}>
          Spaced repetition flashcards with the SM-2 algorithm and Exam Mode. INF 106 research project, track Software
          Development, topic S4.
        </Text>
      </Panel>
    </Screen>
  );
}
