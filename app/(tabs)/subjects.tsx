// Subjects screen: list of subjects and a form to add one.
import React, { useState } from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { AppButton } from '../../src/components/AppButton';
import { TextField } from '../../src/components/TextField';
import { ColorPicker } from '../../src/components/controls';
import { EmptyState, ListItem, Panel, SectionTitle, textStyles } from '../../src/components/ui';
import { showError, useFocusData } from '../../src/hooks/useFocusData';
import { createSubject, listSubjects, SUBJECT_COLORS } from '../../src/services/contentService';
import { formatDay } from '../../src/utils/dates';

export default function SubjectsScreen() {
  const { data: subjects, reload } = useFocusData(listSubjects);
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(SUBJECT_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const add = async () => {
    setSaving(true);
    try {
      await createSubject(name, color);
      setName('');
      setColor(SUBJECT_COLORS[((subjects?.length ?? 0) + 1) % SUBJECT_COLORS.length]);
      await reload();
    } catch (e) {
      showError(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Panel style={{ gap: 12 }}>
        <Text style={textStyles.title}>New subject</Text>
        <TextField value={name} onChangeText={setName} placeholder="e.g. Calculus" maxLength={60} onSubmitEditing={add} />
        <ColorPicker palette={SUBJECT_COLORS} value={color} onChange={setColor} />
        <AppButton title="Add subject" onPress={add} loading={saving} disabled={!name.trim()} />
      </Panel>

      <SectionTitle>Your subjects</SectionTitle>
      {subjects && subjects.length === 0 ? (
        <EmptyState title="No subjects yet" message="Add your first subject above, for example Calculus or Discrete Math." />
      ) : null}
      {subjects?.map(s => (
        <ListItem
          key={s.id}
          color={s.color}
          title={s.name}
          subtitle={
            `${s.deckCount} deck${s.deckCount === 1 ? '' : 's'} · ${s.cardCount} card${s.cardCount === 1 ? '' : 's'}` +
            (s.examDate ? ` · exam ${formatDay(s.examDate)}` : '')
          }
          right={s.dueCount > 0 ? `${s.dueCount} due` : undefined}
          onPress={() => router.push({ pathname: '/subject/[id]', params: { id: String(s.id) } })}
        />
      ))}
    </Screen>
  );
}
