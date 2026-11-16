import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookMarked,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  FileDiff,
  Link2,
  Scale,
  Sparkles,
  X,
} from 'lucide-react';
import { LegalArticle, LegalTerm } from '../types/legal';
import { computeAmendmentDiff } from '../utils/legalEngine';

interface ArticleReaderProps {
  article: LegalArticle;
  allArticles: LegalArticle[];
  allTerms: LegalTerm[];
  selectedTermId: string | null;
  onSelectArticle: (articleId: string) => void;
  onSelectTerm: (termId: string) => void;
}

interface InlineSegment {
  text: string;
  term?: LegalTerm;
}

function tokenizeStatuteTextWithTerms(
  text: string,
  terms: LegalTerm[]
): InlineSegment[] {
  // Build keyword -> LegalTerm map sorted by keyword length descending
  const keywordPairs: Array<{ kw: string; term: LegalTerm }> = [];
  for (const term of terms) {
    const kws =
      term.keywords && term.keywords.length > 0 ? term.keywords : [term.name];
    for (const kw of kws) {
      if (kw && kw.length >= 2) {
        keywordPairs.push({ kw, term });
      }
    }
  }
  keywordPairs.sort((a, b) => b.kw.length - a.kw.length);

  if (keywordPairs.length === 0) return [{ text }];

  const segments: InlineSegment[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    let earliestIdx = -1;
    let matchedPair: { kw: string; term: LegalTerm } | null = null;

    for (const pair of keywordPairs) {
      const idx = remaining.indexOf(pair.kw);
      if (idx !== -1 && (earliestIdx === -1 || idx < earliestIdx)) {
        earliestIdx = idx;
        matchedPair = pair;
      }
    }

    if (earliestIdx === -1 || !matchedPair) {
      segments.push({ text: remaining });
      break;
    }

    if (earliestIdx > 0) {
      segments.push({ text: remaining.slice(0, earliestIdx) });
    }

    segments.push({
      text: matchedPair.kw,
      term: matchedPair.term,
    });

    remaining = remaining.slice(earliestIdx + matchedPair.kw.length);
  }

  return segments;
}

export const ArticleReader: React.FC<ArticleReaderProps> = ({
  article,
  allArticles,
  allTerms,
  onSelectArticle,
  onSelectTerm,
}) => {
  const [diffViewMode, setDiffViewMode] = useState<'inline' | 'side-by-side'>('inline');
  // Click-to-reveal states ("有些詞定義及白話文按一下再顯示出來")
  const [showPlainArticleBox, setShowPlainArticleBox] = useState<boolean>(false);
  const [revealedTermId, setRevealedTermId] = useState<string | null>(null);
  const [expandedAmendmentIds, setExpandedAmendmentIds] = useState<Record<string, boolean>>({});

  const articleTerms = useMemo(() => {
    const explicit = article.termIds
      .map((id) => allTerms.find((t) => t.id === id))
      .filter((t): t is LegalTerm => Boolean(t));
    return explicit;
  }, [article.termIds, allTerms]);

  const inlineSegments = useMemo(
    () => tokenizeStatuteTextWithTerms(article.currentText, allTerms),
    [article.currentText, allTerms]
  );

  const revealedTerm = useMemo(
    () => (revealedTermId ? allTerms.find((t) => t.id === revealedTermId) || null : null),
    [revealedTermId, allTerms]
  );

  const incomingReferences = useMemo(
    () =>
      allArticles
        .slice(0, 250)
        .flatMap((other) =>
          other.id === article.id
            ? []
            : other.crossReferences
                .filter((ref) => ref.targetArticleId === article.id)
                .map((ref) => ({
                  sourceArticle: other,
                  relationType: ref.relationType,
                  description: ref.description,
                }))
        ),
    [allArticles, article.id]
  );

  const handleToggleTermReveal = (termId: string) => {
    onSelectTerm(termId);
    setRevealedTermId((prev) => (prev === termId ? null : termId));
  };

  const toggleAmendmentDetail = (amdId: string) => {
    setExpandedAmendmentIds((prev) => ({
      ...prev,
      [amdId]: !prev[amdId],
    }));
  };

  return (
    <article
      aria-label={`${article.specificLawTitle} ${article.articleNumber} 條文與白話字典詳情`}
      className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs"
      data-testid="article-reader-panel"
    >
      {/* Article Header & Metadata */}
      <div className="border-b border-stone-200 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-stone-900">{article.specificLawTitle}</span>
            <span aria-hidden="true">·</span>
            <span>{article.chapter}</span>
          </div>
          <div className="flex items-center gap-2 font-code text-stone-600">
            <span>幾年改了：{article.lastAmendedYear}</span>
            <span aria-hidden="true">·</span>
            <span>修改日期：{article.lastUpdated}</span>
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mt-2 tracking-tight">
          {article.specificLawTitle.replace('中華民國', '')} {article.articleNumber}：{article.title}
        </h2>
      </div>

      {/* 1. 中華民國現行法條原文 + 點擊條文內專有名詞再顯示白話定義 */}
      <section
        aria-label="現行法條原文與點擊詞彙解釋"
        className="bg-stone-50 border border-stone-200 rounded-xl p-4 sm:p-5 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-stone-600 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-stone-800" />
            全國法規資料庫 · 現行有效條文原文
          </span>
          <span className="text-xs font-medium text-[#9A5B13]">
            💡 點擊條文中畫線詞彙或下方詞條按鈕，按一下即顯示「這詞定義是什麼（白話文）」
          </span>
        </div>

        {/* Interactive Statute Text where legal terms can be clicked to reveal definition */}
        <div className="text-base sm:text-lg text-stone-900 font-editorial leading-relaxed whitespace-pre-line">
          {inlineSegments.map((seg, idx) => {
            if (!seg.term) {
              return <span key={idx}>{seg.text}</span>;
            }
            const isTermOpen = revealedTermId === seg.term.id;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleToggleTermReveal(seg.term!.id)}
                title={`按一下顯示「${seg.term.name}」的白話文定義`}
                className={`inline font-editorial px-1 py-0.5 mx-0.5 rounded-xs border-b-2 transition-colors cursor-pointer ${
                  isTermOpen
                    ? 'bg-[#C68A3E] text-white border-[#9A5B13] font-semibold'
                    : 'bg-[#FDF9F3] text-[#9A5B13] border-dashed border-[#C68A3E] hover:bg-[#F5E8D3] font-semibold'
                }`}
              >
                {seg.text}
              </button>
            );
          })}
        </div>

        {/* Click-to-Reveal Term Pills Bar */}
        {articleTerms.length > 0 && (
          <div className="pt-3 border-t border-stone-200/80 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-stone-700">
              本條專有名詞（按一下顯示定義與白話文）：
            </span>
            {articleTerms.map((term) => {
              const isRevealed = revealedTermId === term.id;
              return (
                <button
                  key={term.id}
                  type="button"
                  onClick={() => handleToggleTermReveal(term.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    isRevealed
                      ? 'bg-[#C68A3E] text-white border-[#C68A3E]'
                      : 'bg-white text-[#9A5B13] border-[#C68A3E]/50 hover:bg-[#FDF9F3]'
                  }`}
                >
                  <span>◆ {term.name}</span>
                  <span className="text-[11px] opacity-80">
                    {isRevealed ? '▲ 收合' : '▼ 按一下顯示'}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Inline Revealed Term Definition Card (Only shown when user clicks a term!) */}
        {revealedTerm && (
          <div
            data-testid="inline-revealed-term-card"
            className="bg-white border-2 border-[#C68A3E] rounded-xl p-4 shadow-sm space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[11px] font-semibold text-[#9A5B13] font-code">
                  名詞字典白話卡 · {revealedTerm.category} · {revealedTerm.englishName}
                </span>
                <h4 className="text-base font-bold text-stone-900 mt-0.5">
                  這詞定義是什麼：「{revealedTerm.name}」
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setRevealedTermId(null)}
                aria-label="收合名詞解釋"
                className="p-1 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#FDF9F3] border border-[#E9D8BE] rounded-lg p-3 text-xs sm:text-sm font-semibold text-stone-900 leading-relaxed">
              {revealedTerm.plainDefinition}
            </div>

            <p className="text-xs text-stone-700 leading-relaxed">
              <span className="font-bold text-stone-900">白話詳解：</span>
              {revealedTerm.detailedExplanation}
            </p>

            <div className="pt-2 border-t border-stone-100 text-xs text-stone-600 flex items-start gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#1E3A8A] shrink-0 mt-0.5" />
              <span>
                <strong className="text-stone-800">幾年改了：</strong>
                {revealedTerm.amendmentHistorySummary}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* 2. 整條法規的白話文翻譯：按一下再顯示出來 (Click-to-Reveal Plain-Language Translation) */}
      <section
        aria-label="白話文法律字典解釋"
        className="bg-[#FDF9F3] border border-[#E9D8BE] rounded-xl overflow-hidden"
      >
        <button
          type="button"
          onClick={() => setShowPlainArticleBox((v) => !v)}
          data-testid="toggle-plain-article-btn"
          className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-[#F9F1E4] transition-colors"
        >
          <div className="flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-[#C68A3E] shrink-0" />
            <span className="text-sm sm:text-base font-bold text-[#9A5B13]">
              白話文法律字典解釋（這條法規白話文是什麼意思？）
            </span>
          </div>
          <span className="px-3 py-1 rounded-full bg-white border border-[#C68A3E]/50 text-xs font-bold text-[#9A5B13] inline-flex items-center gap-1 whitespace-nowrap shrink-0">
            <Sparkles className="w-3 h-3" />
            {showPlainArticleBox ? '收合白話文解釋' : '按一下顯示白話文'}
            {showPlainArticleBox ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </span>
        </button>

        {showPlainArticleBox && (
          <div
            data-testid="plain-article-content"
            className="px-4 sm:px-5 pb-4 sm:pb-5 pt-2 border-t border-[#E9D8BE]/70 space-y-3"
          >
            <div className="text-sm sm:text-base text-stone-900 leading-relaxed whitespace-pre-line">
              {article.plainExplanation}
            </div>

            <div className="pt-3 border-t border-[#E9D8BE]/70 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="font-bold text-stone-900 block mb-0.5">
                  什麼情況會用到？（適用範圍）：
                </span>
                <p className="text-stone-700 leading-relaxed">{article.applicabilityScope}</p>
              </div>
              <div>
                <span className="font-bold text-stone-900 block mb-0.5">
                  實際生活例子：
                </span>
                <p className="text-stone-700 leading-relaxed">{article.practicalExample}</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 3. 歷年修法全紀錄：幾年改了、修改日期、修改了什麼、為何改了（支援按一下展開詳細比對） */}
      <section aria-label="歷年修改日期、修改了什麼、為何改了" className="border-t border-stone-200 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-1.5">
              <FileDiff className="w-4 h-4 text-[#C68A3E]" />
              歷年修法沿革：幾年改了 · 修改日期 · 修改了什麼 · 為何改了
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              摘要直接顯示「幾年改了、修改日期、修改了什麼」，按一下即可展開「為何改了（白話修法原因）」與新舊條文逐字比對
            </p>
          </div>

          <div
            role="group"
            aria-label="新舊條文對照顯示模式"
            className="flex items-center bg-stone-200/70 p-0.5 rounded-lg"
          >
            <button
              type="button"
              onClick={() => setDiffViewMode('inline')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                diffViewMode === 'inline'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              行內添加／刪去標示
            </button>
            <button
              type="button"
              onClick={() => setDiffViewMode('side-by-side')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                diffViewMode === 'side-by-side'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              新舊條文雙欄對照
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {article.amendments.map((amd) => {
            const diffSegments = computeAmendmentDiff(amd.previousText, amd.updatedText);
            const isExpanded = Boolean(expandedAmendmentIds[amd.id]);

            return (
              <div
                key={amd.id}
                className="bg-stone-50/70 border border-stone-200 rounded-xl p-4 sm:p-5 space-y-3.5"
              >
                {/* 幾年改了 & 修改日期 Header Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-stone-200">
                  <div className="bg-white border border-stone-200 rounded-lg px-3.5 py-2.5">
                    <div className="text-[11px] font-semibold text-stone-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#C68A3E]" />
                      幾年改了（修法民國／西元年份）
                    </div>
                    <div className="text-sm font-bold text-stone-900 mt-0.5 font-code">
                      {amd.rocYear} · [{amd.changeType}]
                    </div>
                  </div>

                  <div className="bg-white border border-stone-200 rounded-lg px-3.5 py-2.5">
                    <div className="text-[11px] font-semibold text-stone-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#1E3A8A]" />
                      修改日期（正式公布與施行日）
                    </div>
                    <div className="text-sm font-bold text-stone-900 mt-0.5 font-code">
                      {amd.date}
                    </div>
                  </div>
                </div>

                {/* 修改了什麼（白話重點） */}
                <div className="bg-[#FDF9F3] border border-[#E9D8BE] rounded-xl p-3.5">
                  <div className="text-xs font-bold text-[#9A5B13] mb-1">
                    修改了什麼？（白話重點整理）
                  </div>
                  <p className="text-xs sm:text-sm text-stone-900 leading-relaxed whitespace-pre-line">
                    {amd.whatChangedPlain}
                  </p>
                </div>

                {/* Click-to-reveal button for "為何改了" & "新舊條文逐字比對" */}
                <button
                  type="button"
                  onClick={() => toggleAmendmentDetail(amd.id)}
                  className="w-full py-2 px-3.5 rounded-lg bg-white border border-stone-300 hover:border-[#C68A3E] text-xs font-bold text-stone-800 flex items-center justify-between transition-colors"
                >
                  <span>
                    🔍 {isExpanded ? '收合' : '按一下顯示'}：「為何改了（白話修法原因）」與「新舊條文 [+新增]/[-刪去] 逐字比對」
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-stone-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-stone-500" />
                  )}
                </button>

                {isExpanded && (
                  <div className="space-y-3 pt-1">
                    <div className="bg-white border border-stone-200 rounded-xl p-3.5">
                      <div className="text-xs font-bold text-[#1E3A8A] mb-1">
                        為何改了？（白話修法原因與背景）
                      </div>
                      <p className="text-xs sm:text-sm text-stone-800 leading-relaxed whitespace-pre-line">
                        {amd.whyChangedPlain}
                      </p>
                    </div>

                    {/* 新舊條文逐字比對 */}
                    {diffViewMode === 'inline' ? (
                      <div className="bg-white border border-stone-200 rounded-lg p-3.5">
                        <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 mb-2 pb-2 border-b border-stone-100">
                          <span className="font-semibold">新舊條文逐字比對：</span>
                          <span className="inline-flex items-center gap-1 text-emerald-900 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded">
                            [+新增文字]
                          </span>
                          <span className="inline-flex items-center gap-1 text-rose-900 bg-rose-50 border border-rose-300 line-through px-1.5 py-0.5 rounded">
                            [-刪去舊文字]
                          </span>
                        </div>
                        <div className="text-sm leading-relaxed whitespace-pre-line font-editorial text-stone-800">
                          {diffSegments.map((seg, i) => {
                            if (seg.type === 'added') {
                              return (
                                <span
                                  key={i}
                                  className="bg-emerald-50 text-emerald-950 border-b-2 border-emerald-600 px-1 py-0.5 mx-0.5 rounded-xs font-medium"
                                >
                                  <span className="text-[11px] font-sans font-bold text-emerald-800 mr-0.5">
                                    [+新增]
                                  </span>
                                  {seg.text}
                                </span>
                              );
                            }
                            if (seg.type === 'removed') {
                              return (
                                <span
                                  key={i}
                                  className="bg-rose-50 text-rose-900 line-through decoration-rose-700 px-1 py-0.5 mx-0.5 rounded-xs"
                                >
                                  <span className="text-[11px] font-sans font-bold text-rose-800 no-underline mr-0.5">
                                    [-刪去]
                                  </span>
                                  {seg.text}
                                </span>
                              );
                            }
                            return <span key={i}>{seg.text}</span>;
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-rose-50/50 border border-rose-200 rounded-lg p-3.5">
                          <div className="text-xs font-bold text-rose-900 mb-1.5">
                            [-修改前舊條文]
                          </div>
                          <p className="text-xs text-stone-700 font-editorial leading-relaxed whitespace-pre-line">
                            {amd.previousText}
                          </p>
                        </div>
                        <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-3.5">
                          <div className="text-xs font-bold text-emerald-900 mb-1.5">
                            [+修改後新條文]
                          </div>
                          <p className="text-xs text-stone-900 font-editorial leading-relaxed whitespace-pre-line">
                            {amd.updatedText}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="bg-white border border-stone-200 rounded-lg p-3">
                        <span className="font-bold text-emerald-900 block mb-1">
                          + 具體添加了什麼：
                        </span>
                        <p className="text-stone-700 leading-relaxed">{amd.addedSummary}</p>
                      </div>
                      <div className="bg-white border border-stone-200 rounded-lg p-3">
                        <span className="font-bold text-rose-900 block mb-1">
                          - 具體刪去了什麼：
                        </span>
                        <p className="text-stone-700 leading-relaxed">{amd.removedSummary}</p>
                      </div>
                    </div>

                    <div className="bg-white border border-stone-200 rounded-lg p-3 text-xs text-stone-600">
                      <span className="font-bold text-stone-800">立法院公報正式修正理由：</span>
                      {amd.reason}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. 各條文間之引用連結 (Cross-References) */}
      <section aria-label="各條文間之引用連結" className="border-t border-stone-200 pt-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
            <Link2 className="w-4 h-4 text-[#0F131A]" />
            跨條文引用連結與適用脈絡追溯
          </h3>
          <span className="text-xs text-stone-500">點擊即可跳轉至關聯法條</span>
        </div>

        <div className="space-y-2.5">
          {article.crossReferences.map((ref, idx) => {
            const targetArt = allArticles.find((a) => a.id === ref.targetArticleId);
            if (!targetArt) return null;
            return (
              <div
                key={`out-${idx}`}
                className="bg-stone-50 border border-stone-200 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-[#9A5B13]">
                      [{ref.relationType}]
                    </span>
                    <span aria-hidden="true">→</span>
                    <span className="font-bold text-stone-900">
                      {targetArt.specificLawTitle.replace('中華民國', '')} {targetArt.articleNumber}（{targetArt.title}）
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {ref.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectArticle(targetArt.id)}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-[#0F131A] rounded-lg hover:bg-stone-800 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 self-start sm:self-center"
                >
                  跳轉此條文
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}

          {incomingReferences.map((inc, idx) => (
            <div
              key={`inc-${idx}`}
              className="bg-white border border-stone-200 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-[#1E3A8A]">
                    [被引用：{inc.relationType}]
                  </span>
                  <span aria-hidden="true">←</span>
                  <span className="font-bold text-stone-900">
                    由 {inc.sourceArticle.specificLawTitle.replace('中華民國', '')} {inc.sourceArticle.articleNumber} 引用
                  </span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {inc.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onSelectArticle(inc.sourceArticle.id)}
                className="px-3 py-1.5 text-xs font-medium text-stone-800 bg-stone-100 border border-stone-300 rounded-lg hover:bg-stone-200 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 self-start sm:self-center"
              >
                查看引用來源
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
};
