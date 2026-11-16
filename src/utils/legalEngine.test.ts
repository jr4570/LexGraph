import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_LEGAL_ARTICLES, INITIAL_LEGAL_TERMS } from '../data/legalDatabase';
import {
  buildLegalSubgraph,
  computeAmendmentDiff,
  filterLegalArticles,
} from './legalEngine';

test('filterLegalArticles supports compound queries like "民法 184", "酒駕", "釋字 748", and amendment reasons', () => {
  const byCompound = filterLegalArticles(INITIAL_LEGAL_ARTICLES, INITIAL_LEGAL_TERMS, {
    query: '民法 184',
  });
  assert.ok(byCompound.some((a) => a.id === 'art-civil-184'));

  const byDrunkDriving = filterLegalArticles(INITIAL_LEGAL_ARTICLES, INITIAL_LEGAL_TERMS, {
    query: '酒駕',
  });
  assert.ok(byDrunkDriving.some((a) => a.id === 'art-crim-185-3'));
  assert.ok(byDrunkDriving.some((a) => a.id === 'art-traffic-35'));

  const by748 = filterLegalArticles(INITIAL_LEGAL_ARTICLES, INITIAL_LEGAL_TERMS, {
    query: '釋字 748',
  });
  assert.equal(by748.length, 1);
  assert.equal(by748[0].id, 'art-const-748');
});

test('computeAmendmentDiff accurately segments added, removed, and unchanged text', () => {
  const prev = '滿二十歲為成年。';
  const next = '滿十八歲為成年。';
  const diff = computeAmendmentDiff(prev, next);

  const removedSeg = diff.find((d) => d.type === 'removed');
  const addedSeg = diff.find((d) => d.type === 'added');

  assert.ok(removedSeg);
  assert.ok(addedSeg);
  assert.equal(removedSeg.text, '二十');
  assert.equal(addedSeg.text, '十八');
});

test('buildLegalSubgraph constructs connected nodes and edges around focal article and term', () => {
  const articleGraph = buildLegalSubgraph(INITIAL_LEGAL_ARTICLES, INITIAL_LEGAL_TERMS, {
    focalId: 'art-civil-184',
    focalType: 'article',
    depth: 1,
  });

  const focalNode = articleGraph.nodes.find((n) => n.id === 'art-civil-184');
  assert.ok(focalNode);
  assert.equal(focalNode.isFocal, true);
  assert.ok(articleGraph.nodes.some((n) => n.id === 'art-civil-195'));
  assert.ok(articleGraph.nodes.some((n) => n.id === 'term-tort'));

  const termGraph = buildLegalSubgraph(INITIAL_LEGAL_ARTICLES, INITIAL_LEGAL_TERMS, {
    focalId: 'term-statute-limitations',
    focalType: 'term',
    depth: 1,
  });
  assert.ok(termGraph.nodes.some((n) => n.id === 'term-exclusion-period'));
  assert.ok(termGraph.edges.some((e) => e.label === '概念對比'));
});

import {
  createPersonalStatuteNote,
  deletePersonalStatuteNote,
  parseStoredNotes,
  updatePersonalStatuteNote,
} from './notesStorage';

test('personal statute notes support creation with selected text, updating, JSON persistence, and deletion', () => {
  const afterCreate = createPersonalStatuteNote(
    [],
    {
      articleId: 'art-civil-3',
      pcode: 'B0000001',
      lawName: '民法',
      articleNumber: '第 3 條',
      articleTitle: '使用文字之準則',
      selectedText: '如有用印章代簽名者，其蓋章與簽名生同等之效力。',
      noteContent: '實務上簽約只蓋公司大小章或私章也算數！',
      colorTag: 'gold',
    },
    '2026-11-16T00:00:00.000Z'
  );

  assert.equal(afterCreate.length, 1);
  assert.equal(afterCreate[0].lawName, '民法');
  assert.equal(afterCreate[0].selectedText, '如有用印章代簽名者，其蓋章與簽名生同等之效力。');

  const serialized = JSON.stringify(afterCreate);
  const restored = parseStoredNotes(serialized);
  assert.equal(restored.length, 1);
  assert.equal(restored[0].noteContent, '實務上簽約只蓋公司大小章或私章也算數！');

  const afterUpdate = updatePersonalStatuteNote(restored, restored[0].id, {
    noteContent: '更新筆記：蓋印章與親筆簽名完全同效。',
  });
  assert.equal(afterUpdate[0].noteContent, '更新筆記：蓋印章與親筆簽名完全同效。');

  const afterDelete = deletePersonalStatuteNote(afterUpdate, afterUpdate[0].id);
  assert.equal(afterDelete.length, 0);
});

