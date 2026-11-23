// Subject screen: exam status, decks, add a deck, edit or delete the subject.
import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { AppButton } from '../../src/components/AppButton';
import { TextField } from '../../src/components/TextField';
import { ColorPicker } from '../../src/components/controls';
import { Badge, EmptyState, ListItem, Panel, Row, SectionTitle, textStyles } from '../../src/components/ui';
import { paramToId, showError, useFocusData } from '../../src/hooks/useFocusData';
import {
  createDeck,
  deleteSubject,
  getSubject,
  listDecks,
  SUBJECT_COLORS,
  updateSubject,
} from '../../src/services/contentService';
import { isExamActive } from '../../src/scheduling/examScheduler';
import { daysBetween, formatDay } from '../../src/utils/dates';
import { today } from '../../src/utils/clock';
import { colors, spacing } from '../../src/theme';

export default function SubjectScreen() {
  const id = paramToId(useLocalSearchParams<{ id: string }>().id);
  const { data, reload } = useFocusData(async () => {
    if (id === null) return null;
    const [subject, decks] = await Promise.all([getSubject(id), listDecks(id)]);
    return subject ? { subject, decks } : null;
  }, [id]);

  const [deckName, setDeckName] = useState('');
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState<string>(SUBJECT_COLORS[0]);

  if (!data) return <Screen>{null}</Screen>;
  const { subject, decks } = data;
  const t = today();
  const examActive = isExamActive(t, subject.examDate);
  const dueTotal = decks.reduce((s, d) => s + d.dueCount, 0);

  const addDeck = async () => {
    try {
      await createDeck(subject.id, deckName);
      setDeckName('');
      await reload();
    } catch (e) {
      showError(e);
    }
  };

  const startEdit = () => {
    setEditName(subject.name);
    setEditColor(subject.color);
    setEditing(true);
  };

  const saveEdit = async () => {
    try {
      await updateSubject(subject.id, editName, editColor);
      setEditing(false);
      await reload();
    } catch (e) {
      showError(e);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Delete subject?', `"${subject.name}" and all its decks, cards and history will be deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSubject(subject.id);
            router.back();
          } catch (e) {
            showError(e);
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: subject.name }} />

      {editing ? (
        <Panel style={{ gap: spacing.md }}>
          <TextField label="Name" value={editName} onChangeText={setEditName} maxLength={60} />
          <ColorPicker palette={SUBJECT_COLORS} value={editColor} onChange={setEditColor} />
          <Row>
            <AppButton title="Save" onPress={saveEdit} style={{ flex: 1 }} />
            <AppButton title="Cancel" variant="ghost" onPress={() => setEditing(false)} style={{ flex: 1 }} />
          </Row>
          <AppButton title="Delete subject" variant="danger" onPress={confirmDelete} />
        </Panel>
      ) : null}

      <Panel style={{ gap: spacing.sm }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={textStyles.title}>Exam</Text>
          {examActive ? <Badge text="Exam Mode on" color={colors.exam} background={colors.examSoft} /> : null}
        </Row>
        <Text style={textStyles.body}>
          {subject.examDate
            ? examActive
              ? `${formatDay(subject.examDate)} — in ${daysBetween(t, subject.examDate)} day(s)`
              : `${formatDay(subject.examDate)} — already passed`
            : 'No exam date set'}
        </Text>
        <AppButton
          title={subject.examDate ? 'Exam plan' : 'Set exam date'}
          variant="secondary"
          onPress={() => router.push({ pathname: '/exam/[subjectId]', params: { subjectId: String(subject.id) } })}
        />
      </Panel>

      {dueTotal > 0 ? (
        <AppButton
          title={`Review ${subject.name} (${dueTotal})`}
          onPress={() => router.push({ pathname: '/review', params: { subjectId: String(subject.id) } })}
        />
      ) : null}

      <SectionTitle>Decks</SectionTitle>
      {decks.length === 0 ? <EmptyState title="No decks yet" message="A deck is a set of cards, for example one topic." /> : null}
      {decks.map(d => (
        <ListItem
          key={d.id}
          title={d.name}
          subtitle={`${d.cardCount} card${d.cardCount === 1 ? '' : 's'}`}
          right={d.dueCount > 0 ? `${d.dueCount} due` : undefined}
          onPress={() => router.push({ pathname: '/deck/[id]', params: { id: String(d.id) } })}
        />
      ))}

      <Panel style={{ gap: spacing.md }}>
        <TextField value={deckName} onChangeText={setDeckName} placeholder="New deck name, e.g. Integrals" maxLength={60} onSubmitEditing={addDeck} />
        <AppButton title="Add deck" variant="secondary" onPress={addDeck} disabled={!deckName.trim()} />
      </Panel>

      {!editing ? (
        <View>
          <AppButton title="Edit subject" variant="ghost" onPress={startEdit} />
        </View>
      ) : null}
    </Screen>
  );
}
