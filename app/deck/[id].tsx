// Deck screen: the cards of one deck, start a review, rename or delete the deck.
import React, { useState } from 'react';
import { Alert } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { AppButton } from '../../src/components/AppButton';
import { TextField } from '../../src/components/TextField';
import { EmptyState, ListItem, Panel, Row, SectionTitle } from '../../src/components/ui';
import { paramToId, showError, useFocusData } from '../../src/hooks/useFocusData';
import { deleteDeck, getDeck, listCards, renameDeck } from '../../src/services/contentService';
import { relativeDays } from '../../src/utils/dates';
import { today } from '../../src/utils/clock';
import { spacing } from '../../src/theme';

export default function DeckScreen() {
  const id = paramToId(useLocalSearchParams<{ id: string }>().id);
  const { data, reload } = useFocusData(async () => {
    if (id === null) return null;
    const [deck, cards] = await Promise.all([getDeck(id), listCards(id)]);
    return deck ? { deck, cards } : null;
  }, [id]);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState('');

  if (!data) return <Screen>{null}</Screen>;
  const { deck, cards } = data;
  const t = today();
  const due = cards.filter(c => c.dueDate <= t).length;

  const saveName = async () => {
    try {
      await renameDeck(deck.id, name);
      setRenaming(false);
      await reload();
    } catch (e) {
      showError(e);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Delete deck?', `"${deck.name}" and its ${cards.length} card(s) will be deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDeck(deck.id);
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
      <Stack.Screen options={{ title: deck.name }} />

      <Row>
        <AppButton
          title={due > 0 ? `Review (${due})` : 'Nothing due'}
          disabled={due === 0}
          onPress={() => router.push({ pathname: '/review', params: { deckId: String(deck.id) } })}
          style={{ flex: 1 }}
        />
        <AppButton
          title="Add card"
          variant="secondary"
          onPress={() => router.push({ pathname: '/card/edit', params: { deckId: String(deck.id) } })}
          style={{ flex: 1 }}
        />
      </Row>

      <SectionTitle>{`Cards (${cards.length})`}</SectionTitle>
      {cards.length === 0 ? <EmptyState title="No cards yet" message="Tap “Add card” to write a question and its answer." /> : null}
      {cards.map(c => (
        <ListItem
          key={c.id}
          title={c.question}
          subtitle={c.lastReviewedDate === null ? 'New card' : `EF ${c.easeFactor.toFixed(2)} · interval ${c.intervalDays} d`}
          right={c.dueDate <= t ? 'due' : relativeDays(t, c.dueDate)}
          onPress={() => router.push({ pathname: '/card/[id]', params: { id: String(c.id) } })}
        />
      ))}

      {renaming ? (
        <Panel style={{ gap: spacing.md }}>
          <TextField label="Deck name" value={name} onChangeText={setName} maxLength={60} autoFocus />
          <Row>
            <AppButton title="Save" onPress={saveName} style={{ flex: 1 }} />
            <AppButton title="Cancel" variant="ghost" onPress={() => setRenaming(false)} style={{ flex: 1 }} />
          </Row>
        </Panel>
      ) : (
        <Row>
          <AppButton
            title="Rename"
            variant="ghost"
            onPress={() => {
              setName(deck.name);
              setRenaming(true);
            }}
            style={{ flex: 1 }}
          />
          <AppButton title="Delete deck" variant="danger" onPress={confirmDelete} style={{ flex: 1 }} />
        </Row>
      )}
    </Screen>
  );
}
