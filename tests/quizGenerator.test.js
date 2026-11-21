import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TOPICS } from '../src/data/knowledgeBase.js';
import { buildAdaptiveQuizSet, buildAdaptiveFlashcardDeck } from '../src/utils/quizGenerator.js';

describe('Adaptive Quiz & Flashcard Generators', () => {
  const neuralTopic = TOPICS.find((t) => t.id === 'neural-networks');
  const mathTopic = TOPICS.find((t) => t.id === 'calculus-derivatives');
  const bioTopic = TOPICS.find((t) => t.id === 'mitochondria');

  it('generates the requested number of questions with 4 distinct same-domain options', () => {
    for (const count of [3, 5, 8]) {
      const qs = buildAdaptiveQuizSet(neuralTopic, 'undergrad', count);
      assert.equal(qs.length, count);
      for (const q of qs) {
        assert.equal(q.options.length, 4);
        assert.ok(q.correctIndex >= 0 && q.correctIndex < 4);
        const unique = new Set(q.options.map((o) => o.toLowerCase().slice(0, 50)));
        assert.equal(unique.size, 4, `Duplicate option detected in: ${q.question}`);
      }
    }
  });

  it('never injects unrelated cross-subject giveaway options into Mathematics quizzes', () => {
    const qs = buildAdaptiveQuizSet(mathTopic, 'highschool', 5);
    assert.equal(qs.length, 5);
    for (const q of qs) {
      const joined = q.options.join(' ').toLowerCase();
      assert.equal(joined.includes('encrypted email packets'), false);
      assert.equal(joined.includes('microprocessor caches'), false);
      assert.equal(joined.includes('macroeconomic tax policy'), false);
    }
  });

  it('generates Exam Perspective flashcards with High-Yield and explicit "Not Exam POV" tags', () => {
    const deck = buildAdaptiveFlashcardDeck(bioTopic, 'exam', 6);
    assert.equal(deck.length, 6);
    const hasHighYield = deck.some((c) => c.badge.includes('Exam POV') && c.badgeType !== 'knowledge-only');
    const hasKnowledgeOnly = deck.some((c) => c.badgeType === 'knowledge-only' && c.badge.includes('Not Exam POV'));
    assert.equal(hasHighYield, true, 'Should include High-Yield Exam POV cards');
    assert.equal(hasKnowledgeOnly, true, 'Should explicitly label enrichment cards as Not Exam POV');
  });

  it('generates Quick Revision flashcards tailored for active recall', () => {
    const deck = buildAdaptiveFlashcardDeck(neuralTopic, 'revision', 8);
    assert.equal(deck.length, 8);
    assert.ok(deck[0].badge.includes('Revision') || deck[0].badge.includes('Recall'));
    for (const card of deck) {
      assert.ok(card.front && card.back);
      assert.notEqual(card.badgeType, 'knowledge-only');
    }
  });
});
