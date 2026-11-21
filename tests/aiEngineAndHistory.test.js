import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanAcademicQuery,
  buildCompareLinks,
  simplifyStudentNotes,
  getTutorReply,
} from '../src/utils/aiEngine.js';
import { TOPICS } from '../src/data/knowledgeBase.js';
import {
  formatDateGroupLabel,
  groupHistoryByDate,
  createInitialSearchHistory,
} from '../src/utils/historyUtils.js';

describe('AI Query Parsing, Note Simplifier & History Grouping', () => {
  it('cleans natural-language student prompts accurately', () => {
    assert.equal(cleanAcademicQuery('what is mitochondria?'), 'mitochondria');
    assert.equal(
      cleanAcademicQuery('explain me the revolt of 1857 in one paragraph'),
      'revolt of 1857'
    );
    assert.equal(
      cleanAcademicQuery('explain photosynthesis like im a 10 year old'),
      'photosynthesis'
    );
    assert.equal(cleanAcademicQuery('define luxury please'), 'luxury');
  });

  it('builds safe https compare links for external AI platforms', () => {
    const links = buildCompareLinks('what is quantum entanglement');
    assert.equal(links.length, 5);
    for (const lnk of links) {
      assert.ok(lnk.url.startsWith('https://'));
    }
  });

  it('simplifies dense textbook paragraphs offline with jargon glossary and self-test questions', async () => {
    const sample =
      'Backpropagation computes the gradient of a differentiable loss function in a neural network. Stochastic gradient descent updates weights iteratively while avoiding local instability.';
    const out = await simplifyStudentNotes(sample, 'eli5', {});
    assert.ok(out.tldr.length > 20);
    assert.ok(out.keyTakeaways.length >= 1);
    assert.ok(out.jargonGlossary.some((g) => g.term.toLowerCase() === 'backpropagation'));
    assert.equal(out.studyQuestions.length, 3);
  });

  it('handles offline Socratic quick prompts and uploaded text file sub-questions', async () => {
    const mito = TOPICS.find((t) => t.id === 'mitochondria');
    const simpleReply = await getTutorReply({
      userMessage: 'Explain this much simpler like I am 10 years old',
      topic: mito,
      levelId: 'highschool',
      socraticMode: true,
    });
    assert.ok(simpleReply.text.toLowerCase().includes('atp'));

    const fileReply = await getTutorReply({
      userMessage: 'What does my file say about cristae?',
      topic: mito,
      levelId: 'highschool',
      socraticMode: true,
      attachment: {
        kind: 'text',
        name: 'bio-notes.txt',
        textContent: 'Mitochondria inner membranes fold into cristae.\nCristae increase surface area for ATP synthesis.',
      },
    });
    assert.ok(fileReply.text.includes('bio-notes.txt'));
    assert.ok(fileReply.text.toLowerCase().includes('cristae'));
  });

  it('groups search history cleanly into Today, Yesterday, and Weekday + Date labels', () => {
    const now = new Date('2026-11-21T14:00:00');
    const todayTs = new Date('2026-11-21T10:00:00').getTime();
    const yesterdayTs = new Date('2026-11-20T10:00:00').getTime();
    const thursdayTs = new Date('2026-11-19T10:00:00').getTime();

    assert.ok(formatDateGroupLabel(todayTs, now).startsWith('Today ·'));
    assert.ok(formatDateGroupLabel(yesterdayTs, now).startsWith('Yesterday ·'));
    assert.match(formatDateGroupLabel(thursdayTs, now), /^Thursday, 19 Nov 2026$/);

    const seed = createInitialSearchHistory();
    assert.ok(seed.length >= 8);
    const grouped = groupHistoryByDate(seed);
    assert.ok(grouped.length >= 4);
  });
});
