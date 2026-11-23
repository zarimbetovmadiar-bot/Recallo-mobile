// Card form: create a new card (?deckId=...) or edit one (?id=...).
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { AppButton } from '../../src/components/AppButton';
import { TextField } from '../../src/components/TextField';
import { paramToId, showError } from '../../src/hooks/useFocusData';
import { createCard, deleteCard, getCard, updateCard } from '../../src/services/contentService';

export default function CardEditScreen() {
  const params = useLocalSearchParams<{ id?: string; deckId?: string }>();
  const cardId = paramToId(params.id);
  const deckId = paramToId(params.deckId);
  const isNew = cardId === null;

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [saving, setSaving] = useState(false);
  const [cardDeckId, setCardDeckId] = useState<number | null>(deckId);

  useEffect(() => {
    if (cardId === null) return;
    getCard(cardId)
      .then(card => {
        if (card) {
          setQuestion(card.question);
          setAnswer(card.answer);
          setCardDeckId(card.deckId);
        }
      })
      .catch(showError);
  }, [cardId]);

  const save = async (addAnother: boolean) => {
    setSaving(true);
    try {
      if (isNew) {
        if (deckId === null) throw new Error('No deck selected');
        await createCard(deckId, question, answer);
      } else {
        await updateCard(cardId, question, answer);
      }
      if (addAnother) {
        setQuestion('');
        setAnswer('');
      } else {
        router.back();
      }
    } catch (e) {
      showError(e);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (cardId === null) return;
    Alert.alert('Delete card?', 'The card and its review history will be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCard(cardId);
            // Go back to the deck, skipping the card screen of the deleted card.
            if (cardDeckId !== null) router.dismissTo({ pathname: '/deck/[id]', params: { id: String(cardDeckId) } });
            else router.back();
          } catch (e) {
            showError(e);
          }
        },
      },
    ]);
  };

  const ready = question.trim().length > 0 && answer.trim().length > 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <Stack.Screen options={{ title: isNew ? 'New card' : 'Edit card' }} />
        <TextField label="Question" value={question} onChangeText={setQuestion} multiline maxLength={1000} autoFocus={isNew} />
        <TextField label="Answer" value={answer} onChangeText={setAnswer} multiline maxLength={1000} />
        <AppButton title="Save" onPress={() => save(false)} loading={saving} disabled={!ready} />
        {isNew ? (
          <AppButton title="Save and add another" variant="secondary" onPress={() => save(true)} disabled={!ready || saving} />
        ) : (
          <AppButton title="Delete card" variant="danger" onPress={confirmDelete} />
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}
