import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, SUBJECTS, TOPICS, generateCustomTopic } from '../src/data/knowledgeBase.js';
import { sanitizeExternalUrl } from '../src/utils/security.js';

describe('Knowledge Base Integrity', () => {
  it('defines all 4 progressive understanding levels', () => {
    assert.equal(LEVELS.length, 4);
    assert.deepEqual(
      LEVELS.map((l) => l.id),
      ['eli5', 'highschool', 'undergrad', 'deepdive']
    );
  });

  it('contains valid curated topics across multiple academic subjects', () => {
    assert.ok(TOPICS.length >= 8, 'Should include at least 8 curated topics');
    assert.ok(SUBJECTS.includes('Computer Science'));
    assert.ok(SUBJECTS.includes('Biology'));
    assert.ok(SUBJECTS.includes('History'));

    for (const topic of TOPICS) {
      assert.ok(topic.id && topic.title && topic.subject, `Topic missing core fields: ${topic.id}`);
      for (const lvl of LEVELS) {
        const data = topic.levels[lvl.id];
        assert.ok(data, `${topic.id} missing level ${lvl.id}`);
        assert.ok(data.headline && data.summary, `${topic.id}.${lvl.id} missing headline/summary`);
        assert.ok(Array.isArray(data.steps) && data.steps.length >= 2, `${topic.id}.${lvl.id} needs >=2 steps`);
        assert.ok(data.analogy && data.formulaOrRule && data.commonMistake);
      }

      assert.ok(topic.conceptMap?.center && topic.conceptMap.nodes.length >= 4);
      assert.ok(Array.isArray(topic.resources) && topic.resources.length >= 2);
      for (const res of topic.resources) {
        assert.ok(sanitizeExternalUrl(res.url).startsWith('https://'), `Invalid URL in ${topic.id}: ${res.url}`);
      }

      for (const q of topic.quiz || []) {
        assert.equal(q.options.length, 4, `Quiz question must have 4 options in ${topic.id}`);
        assert.ok(q.correctIndex >= 0 && q.correctIndex < 4);
      }
    }
  });

  it('generates a structured fallback package for arbitrary custom queries', () => {
    const custom = generateCustomTopic('Bayesian Inference');
    assert.equal(custom.title, 'Bayesian Inference');
    assert.ok(custom.levels.eli5 && custom.levels.deepdive);
    assert.equal(custom.conceptMap.nodes.length, 5);
    assert.ok(custom.resources.length >= 4);
  });
});
