import {
  DiffSegment,
  GraphEdge,
  GraphNode,
  LawCategory,
  LegalArticle,
  LegalTerm,
  SubgraphResult,
} from '../types/legal';

/**
 * Filters legal articles by category, keyword query, and optional legal term ID.
 * Supports both options object and (query, category) positional arguments.
 */
export function filterLegalArticles(
  articles: LegalArticle[],
  terms: LegalTerm[],
  optionsOrQuery:
    | {
        category?: LawCategory;
        query?: string;
        termId?: string | null;
        onlyAmended?: boolean;
      }
    | string = {},
  positionalCategory: LawCategory = '全部法規'
): LegalArticle[] {
  const options =
    typeof optionsOrQuery === 'string'
      ? { query: optionsOrQuery, category: positionalCategory }
      : optionsOrQuery;

  const { category = '全部法規', query = '', termId = null, onlyAmended = false } = options;
  const normalizedQuery = query.trim().toLowerCase();

  const termMap = new Map<string, LegalTerm>();
  for (const t of terms) {
    termMap.set(t.id, t);
  }

  return articles.filter((article) => {
    if (category !== '全部法規' && article.lawName !== category) {
      return false;
    }

    if (termId && !article.termIds.includes(termId)) {
      return false;
    }

    if (onlyAmended && article.amendments.every((a) => a.changeType === '增訂')) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const articleTermNames = article.termIds
      .map((id) => {
        const term = termMap.get(id);
        return term ? `${term.name} ${term.plainDefinition} ${term.shortDefinition}` : '';
      })
      .join(' ')
      .toLowerCase();

    const amendmentText = article.amendments
      .map(
        (a) =>
          `${a.rocYear} ${a.date} ${a.whatChangedPlain} ${a.whyChangedPlain} ${a.reason} ${a.addedSummary} ${a.removedSummary} ${a.previousText}`
      )
      .join(' ')
      .toLowerCase();

    const searchableHaystack = [
      article.lawName,
      article.specificLawTitle,
      article.chapter,
      article.articleNumber,
      article.title,
      article.currentText,
      article.plainExplanation,
      article.applicabilityScope,
      article.lastAmendedYear,
      articleTermNames,
      amendmentText,
    ]
      .join(' ')
      .toLowerCase();

    // Support multi-keyword space-separated queries like "民法 184" or "刑法 酒駕"
    const keywords = normalizedQuery.split(/\s+/).filter(Boolean);
    return keywords.every((kw) => searchableHaystack.includes(kw));
  });
}

export function filterLegalTerms(
  terms: LegalTerm[],
  query: string = '',
  category: LawCategory = '全部法規'
): LegalTerm[] {
  const q = query.trim().toLowerCase();
  return terms.filter((term) => {
    if (
      category !== '全部法規' &&
      term.category !== category &&
      term.category !== '通用法理'
    ) {
      return false;
    }
    if (!q) return true;
    const haystack = [
      term.name,
      term.englishName,
      term.plainDefinition,
      term.shortDefinition,
      term.detailedExplanation,
      term.amendmentHistorySummary,
      ...(term.keywords || []),
    ]
      .join(' ')
      .toLowerCase();
    const keywords = q.split(/\s+/).filter(Boolean);
    return keywords.every((kw) => haystack.includes(kw));
  });
}

export function highlightLegalTermsInText(
  text: string,
  allTerms: LegalTerm[]
): Array<{ text: string; term?: LegalTerm }> {
  if (!text) return [];

  // Build candidate keyword -> term pairs sorted by keyword length descending
  const keywordEntries: Array<{ kw: string; term: LegalTerm }> = [];
  for (const term of allTerms) {
    const kws = Array.from(new Set([term.name, ...(term.keywords || [])])).filter(
      (k) => k && k.trim().length >= 2
    );
    for (const kw of kws) {
      keywordEntries.push({ kw: kw.trim(), term });
    }
  }
  keywordEntries.sort((a, b) => b.kw.length - a.kw.length);

  if (keywordEntries.length === 0) {
    return [{ text }];
  }

  const segments: Array<{ text: string; term?: LegalTerm }> = [];
  let cursor = 0;

  while (cursor < text.length) {
    let bestMatch: { index: number; kw: string; term: LegalTerm } | null = null;

    for (const entry of keywordEntries) {
      const idx = text.indexOf(entry.kw, cursor);
      if (idx !== -1) {
        if (
          !bestMatch ||
          idx < bestMatch.index ||
          (idx === bestMatch.index && entry.kw.length > bestMatch.kw.length)
        ) {
          bestMatch = { index: idx, kw: entry.kw, term: entry.term };
        }
      }
    }

    if (!bestMatch) {
      segments.push({ text: text.slice(cursor) });
      break;
    }

    if (bestMatch.index > cursor) {
      segments.push({ text: text.slice(cursor, bestMatch.index) });
    }

    segments.push({
      text: bestMatch.kw,
      term: bestMatch.term,
    });

    cursor = bestMatch.index + bestMatch.kw.length;
  }

  return segments;
}

export function computeCharDiff(
  previousText: string,
  updatedText: string
): Array<{ type: 'unchanged' | 'added' | 'removed'; value: string }> {
  return computeAmendmentDiff(previousText, updatedText).map((seg) => ({
    type: seg.type,
    value: seg.text,
  }));
}


/**
 * Splits Chinese/English legal text into meaningful punctuation/character tokens for clean diffing.
 */
function tokenizeLegalText(text: string): string[] {
  if (!text) return [];
  return Array.from(text);
}

/**
 * Computes an inline diff between previousText and updatedText of an amendment.
 * Merges adjacent segments of the same type for clean rendering.
 */
export function computeAmendmentDiff(previousText: string, updatedText: string): DiffSegment[] {
  if (previousText === updatedText) {
    return [{ type: 'unchanged', text: updatedText }];
  }

  if (previousText.startsWith('（') && previousText.endsWith('）')) {
    return [
      { type: 'removed', text: previousText },
      { type: 'added', text: updatedText },
    ];
  }

  const oldTokens = tokenizeLegalText(previousText);
  const newTokens = tokenizeLegalText(updatedText);
  const m = oldTokens.length;
  const n = newTokens.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (oldTokens[i] === newTokens[j]) {
        dp[i][j] = 1 + dp[i + 1][j + 1];
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const rawSegments: DiffSegment[] = [];
  let i = 0;
  let j = 0;

  while (i < m && j < n) {
    if (oldTokens[i] === newTokens[j]) {
      rawSegments.push({ type: 'unchanged', text: oldTokens[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rawSegments.push({ type: 'removed', text: oldTokens[i] });
      i++;
    } else {
      rawSegments.push({ type: 'added', text: newTokens[j] });
      j++;
    }
  }

  while (i < m) {
    rawSegments.push({ type: 'removed', text: oldTokens[i] });
    i++;
  }

  while (j < n) {
    rawSegments.push({ type: 'added', text: newTokens[j] });
    j++;
  }

  const merged: DiffSegment[] = [];
  for (const seg of rawSegments) {
    const last = merged[merged.length - 1];
    if (last && last.type === seg.type) {
      last.text += seg.text;
    } else {
      merged.push({ ...seg });
    }
  }

  const punctuationRegex = /^[，。、；：！？\n（）「」]+$/;
  const smoothed: DiffSegment[] = [];
  let idx = 0;
  while (idx < merged.length) {
    const curr = merged[idx];
    const next = merged[idx + 1];
    const afterNext = merged[idx + 2];

    if (
      curr &&
      next &&
      afterNext &&
      curr.type !== 'unchanged' &&
      next.type === 'unchanged' &&
      next.text.length <= 2 &&
      !punctuationRegex.test(next.text) &&
      afterNext.type !== 'unchanged'
    ) {
      let remText = '';
      let addText = '';
      if (curr.type === 'removed') remText += curr.text;
      if (curr.type === 'added') addText += curr.text;
      remText += next.text;
      addText += next.text;
      if (afterNext.type === 'removed') remText += afterNext.text;
      if (afterNext.type === 'added') addText += afterNext.text;

      if (remText) smoothed.push({ type: 'removed', text: remText });
      if (addText) smoothed.push({ type: 'added', text: addText });
      idx += 3;
    } else {
      smoothed.push({ ...curr });
      idx++;
    }
  }

  const finalSegments: DiffSegment[] = [];
  for (const seg of smoothed) {
    const last = finalSegments[finalSegments.length - 1];
    if (last && last.type === seg.type) {
      last.text += seg.text;
    } else {
      finalSegments.push({ ...seg });
    }
  }

  return finalSegments;
}

/**
 * Builds a deterministic, collision-free knowledge graph around a focal Article or LegalTerm.
 */
export function buildLegalSubgraph(
  articles: LegalArticle[],
  terms: LegalTerm[],
  options: {
    focalId: string;
    focalType: 'article' | 'term';
    depth?: 1 | 2;
    showArticles?: boolean;
    showTerms?: boolean;
  }
): SubgraphResult {
  const {
    focalId,
    focalType,
    depth = 1,
    showArticles = true,
    showTerms = true,
  } = options;

  const articleMap = new Map<string, LegalArticle>(articles.map((a) => [a.id, a]));
  const termMap = new Map<string, LegalTerm>(terms.map((t) => [t.id, t]));

  const nodesMap = new Map<string, Omit<GraphNode, 'x' | 'y'>>();
  const edgesMap = new Map<string, GraphEdge>();

  const addNode = (
    id: string,
    label: string,
    subLabel: string,
    type: GraphNode['type'],
    category: string,
    hopDistance: number
  ) => {
    if (type === 'article' && !showArticles && hopDistance > 0) return;
    if (type === 'term' && !showTerms && hopDistance > 0) return;

    const existing = nodesMap.get(id);
    if (!existing || existing.hopDistance > hopDistance) {
      nodesMap.set(id, {
        id,
        label,
        subLabel,
        type,
        category,
        isFocal: hopDistance === 0,
        hopDistance,
      });
    }
  };

  const addEdge = (
    source: string,
    target: string,
    label: string,
    relationCategory: GraphEdge['relationCategory']
  ) => {
    if (source === target) return;
    const sortedKey = [source, target].sort().join('--') + `--${label}`;
    if (!edgesMap.has(sortedKey)) {
      edgesMap.set(sortedKey, {
        id: sortedKey,
        source,
        target,
        label,
        relationCategory,
      });
    }
  };

  if (focalType === 'article') {
    const focalArt = articleMap.get(focalId) || articles[0];
    if (!focalArt) return { nodes: [], edges: [] };

    addNode(
      focalArt.id,
      `${focalArt.specificLawTitle.replace('中華民國', '')}${focalArt.articleNumber}`,
      focalArt.title.slice(0, 12),
      'article',
      focalArt.lawName,
      0
    );

    for (const ref of focalArt.crossReferences) {
      const targetArt = articleMap.get(ref.targetArticleId);
      if (targetArt) {
        addNode(
          targetArt.id,
          `${targetArt.specificLawTitle.replace('中華民國', '')}${targetArt.articleNumber}`,
          targetArt.title.slice(0, 12),
          'article',
          targetArt.lawName,
          1
        );
        addEdge(focalArt.id, targetArt.id, ref.relationType, 'citation');

        if (depth === 2) {
          for (const subRef of targetArt.crossReferences) {
            const subArt = articleMap.get(subRef.targetArticleId);
            if (subArt && subArt.id !== focalArt.id) {
              addNode(
                subArt.id,
                `${subArt.specificLawTitle.replace('中華民國', '')}${subArt.articleNumber}`,
                subArt.title.slice(0, 12),
                'article',
                subArt.lawName,
                2
              );
              addEdge(targetArt.id, subArt.id, subRef.relationType, 'citation');
            }
          }
        }
      }
    }

    for (const otherArt of articles) {
      if (otherArt.id === focalArt.id) continue;
      for (const ref of otherArt.crossReferences) {
        if (ref.targetArticleId === focalArt.id) {
          addNode(
            otherArt.id,
            `${otherArt.specificLawTitle.replace('中華民國', '')}${otherArt.articleNumber}`,
            otherArt.title.slice(0, 12),
            'article',
            otherArt.lawName,
            1
          );
          addEdge(otherArt.id, focalArt.id, ref.relationType, 'citation');
        }
      }
    }

    for (const tId of focalArt.termIds) {
      const term = termMap.get(tId);
      if (term) {
        addNode(term.id, term.name, term.englishName, 'term', term.category, 1);
        addEdge(focalArt.id, term.id, '包含概念', 'definition');

        if (depth === 2) {
          for (const contrast of term.contrasts) {
            const cTerm = termMap.get(contrast.contrastTermId);
            if (cTerm) {
              addNode(cTerm.id, cTerm.name, cTerm.englishName, 'term', cTerm.category, 2);
              addEdge(term.id, cTerm.id, '概念對比', 'contrast');
            }
          }
          for (const relArtId of term.relatedArticleIds) {
            const relArt = articleMap.get(relArtId);
            if (relArt && relArt.id !== focalArt.id) {
              addNode(
                relArt.id,
                `${relArt.specificLawTitle.replace('中華民國', '')}${relArt.articleNumber}`,
                relArt.title.slice(0, 12),
                'article',
                relArt.lawName,
                2
              );
              addEdge(term.id, relArt.id, '適用條文', 'definition');
            }
          }
        }
      }
    }
  } else {
    const focalTerm = termMap.get(focalId) || terms[0];
    if (!focalTerm) return { nodes: [], edges: [] };

    addNode(focalTerm.id, focalTerm.name, focalTerm.englishName, 'term', focalTerm.category, 0);

    for (const artId of focalTerm.relatedArticleIds) {
      const art = articleMap.get(artId);
      if (art) {
        addNode(
          art.id,
          `${art.specificLawTitle.replace('中華民國', '')}${art.articleNumber}`,
          art.title.slice(0, 12),
          'article',
          art.lawName,
          1
        );
        addEdge(focalTerm.id, art.id, '規範條文', 'definition');

        if (depth === 2) {
          for (const ref of art.crossReferences) {
            const targetArt = articleMap.get(ref.targetArticleId);
            if (targetArt) {
              addNode(
                targetArt.id,
                `${targetArt.specificLawTitle.replace('中華民國', '')}${targetArt.articleNumber}`,
                targetArt.title.slice(0, 12),
                'article',
                targetArt.lawName,
                2
              );
              addEdge(art.id, targetArt.id, ref.relationType, 'citation');
            }
          }
        }
      }
    }

    for (const contrast of focalTerm.contrasts) {
      const cTerm = termMap.get(contrast.contrastTermId);
      if (cTerm) {
        addNode(cTerm.id, cTerm.name, cTerm.englishName, 'term', cTerm.category, 1);
        addEdge(focalTerm.id, cTerm.id, '概念對比', 'contrast');
      }
    }

    for (const relTermId of focalTerm.relatedTermIds) {
      const rTerm = termMap.get(relTermId);
      if (rTerm) {
        addNode(rTerm.id, rTerm.name, rTerm.englishName, 'term', rTerm.category, 1);
        addEdge(focalTerm.id, rTerm.id, '法理關聯', 'principle');
      }
    }
  }

  const validEdges = Array.from(edgesMap.values()).filter(
    (e) => nodesMap.has(e.source) && nodesMap.has(e.target)
  );

  const centerX = 400;
  const centerY = 260;
  const rawNodes = Array.from(nodesMap.values());
  const hop1Nodes = rawNodes.filter((n) => n.hopDistance === 1);
  const hop2Nodes = rawNodes.filter((n) => n.hopDistance === 2);

  const positionedNodes: GraphNode[] = [];

  for (const n of rawNodes) {
    if (n.hopDistance === 0) {
      positionedNodes.push({ ...n, x: centerX, y: centerY });
    }
  }

  const r1X = hop2Nodes.length > 0 ? 185 : 225;
  const r1Y = hop2Nodes.length > 0 ? 140 : 165;
  hop1Nodes.forEach((n, idx) => {
    const angle = (2 * Math.PI * idx) / Math.max(hop1Nodes.length, 1) - Math.PI / 2;
    positionedNodes.push({
      ...n,
      x: Math.round(centerX + r1X * Math.cos(angle)),
      y: Math.round(centerY + r1Y * Math.sin(angle)),
    });
  });

  const r2X = 325;
  const r2Y = 215;
  hop2Nodes.forEach((n, idx) => {
    const angle =
      (2 * Math.PI * idx) / Math.max(hop2Nodes.length, 1) - Math.PI / 2 + Math.PI / 8;
    positionedNodes.push({
      ...n,
      x: Math.round(centerX + r2X * Math.cos(angle)),
      y: Math.round(centerY + r2Y * Math.sin(angle)),
    });
  });

  return {
    nodes: positionedNodes,
    edges: validEdges,
  };
}
