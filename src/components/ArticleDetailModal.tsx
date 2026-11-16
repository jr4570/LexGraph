import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookMarked,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  GitBranch,
  History,
  Maximize2,
  Minimize2,
  Network,
  Sparkles,
  X,
} from 'lucide-react';
import {
  LegalArticle,
  LegalTerm,
  NoteColorTag,
  PersonalStatuteNote,
} from '../types/legal';
import { computeCharDiff, highlightLegalTermsInText } from '../utils/legalEngine';
import { KnowledgeGraph } from './KnowledgeGraph';
import { PersonalNotesWidget } from './PersonalNotesWidget';

interface ArticleDetailModalProps {
  article: LegalArticle;
  lawArticles: LegalArticle[];
  allArticles: LegalArticle[];
  allTerms: LegalTerm[];
  personalNotes: PersonalStatuteNote[];
  onAddPersonalNote: (input: {
    articleId: string;
    pcode?: string;
    lawName: string;
    articleNumber: string;
    articleTitle: string;
    selectedText: string;
    noteContent: string;
    colorTag: NoteColorTag;
  }) => void;
  onUpdatePersonalNote: (
    noteId: string,
    updates: Partial<Pick<PersonalStatuteNote, 'selectedText' | 'noteContent' | 'colorTag'>>
  ) => void;
  onDeletePersonalNote: (noteId: string) => void;
  initialTab?: 'knowledge' | 'graph' | 'history' | 'notes';
  onClose: () => void;
  onSelectArticle: (article: LegalArticle) => void;
  onOpenInNewTab: (article: LegalArticle) => void;
  onSelectTermModal: (term: LegalTerm) => void;
}

export const ArticleDetailModal: React.FC<ArticleDetailModalProps> = ({
  article,
  lawArticles,
  allArticles,
  allTerms,
  personalNotes,
  onAddPersonalNote,
  onUpdatePersonalNote,
  onDeletePersonalNote,
  initialTab = 'knowledge',
  onClose,
  onSelectArticle,
  onOpenInNewTab,
  onSelectTermModal,
}) => {
  const [activeTab, setActiveTab] = useState<'knowledge' | 'graph' | 'history' | 'notes'>(
    initialTab
  );
  const [isExpandedWidth, setIsExpandedWidth] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [expandedTermIds, setExpandedTermIds] = useState<string[]>([]);
  const [selectedInlineTerm, setSelectedInlineTerm] = useState<LegalTerm | null>(null);
  const [pendingSelection, setPendingSelection] = useState<{
    text: string;
    article: LegalArticle;
  } | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, article.id]);

  useEffect(() => {
    setSelectedInlineTerm(null);
    setPendingSelection(null);
  }, [article.id]);

  const articleNotes = personalNotes.filter((n) => n.articleId === article.id);

  // Find previous & next article in the same law (or fallback to allArticles)
  const pool = lawArticles.length > 0 ? lawArticles : allArticles;
  const currentIndex = pool.findIndex((a) => a.id === article.id);
  const prevArticle = currentIndex > 0 ? pool[currentIndex - 1] : null;
  const nextArticle =
    currentIndex >= 0 && currentIndex < pool.length - 1 ? pool[currentIndex + 1] : null;

  const articleTerms = allTerms.filter((t) => article.termIds.includes(t.id));

  const toggleTermExpand = (termId: string) => {
    setExpandedTermIds((prev) =>
      prev.includes(termId) ? prev.filter((id) => id !== termId) : [...prev, termId]
    );
  };

  const rawLines = article.currentText
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const isMultiParagraph = rawLines.length > 1;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] flex items-center justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Floating Left Prev Button (Matches Image 3) */}
      {prevArticle && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectArticle(prevArticle);
          }}
          title={`上一條：${prevArticle.articleNumber} ${prevArticle.title}`}
          className="hidden md:flex fixed left-4 lg:left-8 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full bg-white/95 hover:bg-white border border-[#E5DFD3] shadow-lg items-center justify-center text-[#4A453E] hover:text-[#C68A3E] transition-all cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* Floating Right Next Button (Matches Image 3) */}
      {nextArticle && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectArticle(nextArticle);
          }}
          title={`下一條：${nextArticle.articleNumber} ${nextArticle.title}`}
          className="hidden md:flex fixed right-4 lg:right-8 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full bg-white/95 hover:bg-white border border-[#E5DFD3] shadow-lg items-center justify-center text-[#4A453E] hover:text-[#C68A3E] transition-all cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Main Drawer / Modal Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative bg-white sm:rounded-2xl border border-[#E5DFD3] shadow-2xl flex flex-col h-full sm:h-[92vh] transition-all duration-200 overflow-hidden ${
          isExpandedWidth ? 'w-full max-w-6xl' : 'w-full max-w-4xl'
        }`}
      >
        {/* Top Action Bar (Matches Image 3 top bar) */}
        <div className="px-5 py-3 border-b border-[#EFECE6] flex items-center justify-between bg-[#FAF8F5] shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsExpandedWidth((v) => !v)}
              title={isExpandedWidth ? '縮小視窗寬度' : '展開寬版檢視'}
              className="p-1.5 rounded-lg border border-[#E5DFD3] bg-white hover:bg-[#F3EFE6] text-[#6E6559] transition-colors cursor-pointer"
            >
              {isExpandedWidth ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setBookmarked((b) => !b)}
              title="加入書籤"
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                bookmarked
                  ? 'border-[#C68A3E] bg-[#FDF6EA] text-[#C68A3E]'
                  : 'border-[#E5DFD3] bg-white hover:bg-[#F3EFE6] text-[#6E6559]'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onOpenInNewTab(article)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E5DFD3] bg-white hover:bg-[#F3EFE6] text-xs text-[#6E6559] font-medium transition-colors cursor-pointer"
            >
              <span>跳轉獨立分頁</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="關閉條文視窗"
            className="p-1.5 rounded-lg text-[#8A8175] hover:text-[#1A1D24] hover:bg-[#EFECE6] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-10 pt-6 pb-24">
          {/* Breadcrumb & Source / Reading Time Pills (Matches Image 3) */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
            <div className="flex items-center gap-1.5 text-xs text-[#8A8175]">
              <span>{article.specificLawTitle}</span>
              {article.partTitle && (
                <>
                  <span>›</span>
                  <span>{article.partTitle}</span>
                </>
              )}
              {article.chapter && article.chapter !== article.partTitle && (
                <>
                  <span>›</span>
                  <span className="text-[#4A453E] font-medium">{article.chapter}</span>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#E5DFD3] bg-[#FAF8F5] text-[11px] text-[#6E6559]">
                <FileText className="w-3 h-3 text-[#8A8175]" />
                資料來源：全國法規資料庫、立法院法律系統
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#E5DFD3] bg-[#FAF8F5] text-[11px] text-[#6E6559]">
                <Clock className="w-3 h-3 text-[#8A8175]" />
                閱讀時間 3 分鐘
              </span>
            </div>
          </div>

          {/* Big Title & Concise Subtitle (Matches Image 3: 民法 第 3 條 / 使用文字之準則) */}
          <div className="pb-5">
            <h1 className="text-2xl sm:text-3xl font-black text-[#1A1D24] tracking-tight">
              {article.specificLawTitle} {article.articleNumber}
            </h1>
            <p className="text-xs sm:text-sm text-[#8A8175] mt-1.5 font-medium">
              {article.title}
            </p>
          </div>

          {/* Numbered Statute Text with Dotted Underline & Clickable ◆ Terms (Matches Image 3) */}
          <div
            className="space-y-3.5 py-3"
            onMouseUp={() => {
              const sel = window.getSelection()?.toString().trim() || '';
              if (sel.length >= 2) {
                setPendingSelection({ text: sel, article });
                setActiveTab('notes');
              }
            }}
          >
            {rawLines.map((line, idx) => {
              const cleanedLine = isMultiParagraph ? line.replace(/^\d+\.\s*/, '') : line;
              const segments = highlightLegalTermsInText(cleanedLine, allTerms);

              return (
                <div
                  key={idx}
                  className="flex items-baseline text-base sm:text-[17px] text-[#1A1D24] leading-[2.05]"
                >
                  {isMultiParagraph && (
                    <span className="text-xs font-mono text-[#9A9184] w-6 shrink-0 select-none">
                      {idx + 1}.
                    </span>
                  )}
                  <p className="flex-1">
                    {segments.map((seg, sIdx) => {
                      if (!seg.term) {
                        return (
                          <span
                            key={sIdx}
                            className="border-b border-dotted border-[#D5CEC2] pb-0.5"
                          >
                            {seg.text}
                          </span>
                        );
                      }
                      const matchedTerm = seg.term;
                      const isSelected = selectedInlineTerm?.id === matchedTerm.id;
                      return (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() =>
                            setSelectedInlineTerm((prev) =>
                              prev?.id === matchedTerm.id ? null : matchedTerm
                            )
                          }
                          className={`inline-flex items-center gap-0.5 mx-0.5 pb-0.5 border-b-2 transition-colors cursor-pointer ${
                            isSelected
                              ? 'border-[#C68A3E] bg-[#FDF6EA] text-[#9A6524] font-bold px-1 rounded-t'
                              : 'border-[#C68A3E] text-[#1A1D24] hover:text-[#9A6524] font-semibold'
                          }`}
                        >
                          <span>{seg.text}</span>
                          <span className="text-[10px] text-[#C68A3E] leading-none">◆</span>
                        </button>
                      );
                    })}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Inline Term Popover when user clicks a ◆ term in the statute text */}
          {selectedInlineTerm && (
            <div className="my-4 rounded-xl border border-[#E5C697] bg-[#FDF9F1] p-4 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-[#C68A3E] text-white text-[11px] font-bold">
                    名詞白話定義
                  </span>
                  <span className="text-sm font-black text-[#1A1D24]">
                    {selectedInlineTerm.name}
                  </span>
                  <span className="text-[11px] text-[#8A8175]">
                    {selectedInlineTerm.category} · {selectedInlineTerm.englishName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedInlineTerm(null)}
                  className="text-xs text-[#8A8175] hover:text-[#1A1D24] cursor-pointer"
                >
                  收合 ✕
                </button>
              </div>
              <p className="mt-2 text-xs sm:text-sm text-[#2D3139] leading-relaxed">
                <strong className="text-[#9A6524]">這詞定義是什麼（白話文）：</strong>
                {selectedInlineTerm.plainDefinition}
              </p>
              <p className="mt-1 text-xs text-[#6E6559] leading-relaxed">
                <strong>幾年改了 · 為何改了：</strong>
                {selectedInlineTerm.amendmentHistorySummary}
              </p>
            </div>
          )}

          {/* Action Pills Row (Matches Image 3 pill buttons below text) */}
          <div className="flex flex-wrap items-center gap-2.5 pt-3 pb-6">
            <button
              type="button"
              onClick={() => setActiveTab('graph')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#E2DACB] bg-[#FAF8F5] hover:border-[#C68A3E] text-xs font-medium text-[#4A453E] hover:text-[#9A6524] transition-colors cursor-pointer"
            >
              <GitBranch className="w-3.5 h-3.5 text-[#C68A3E]" />
              <span>圖解條文關聯</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#E2DACB] bg-[#FAF8F5] hover:border-[#C68A3E] text-xs font-medium text-[#4A453E] hover:text-[#9A6524] transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-[#C68A3E]" />
              <span>歷年修法沿革（{article.lastAmendedYear}）</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const sel = window.getSelection()?.toString().trim() || '';
                if (sel) {
                  setPendingSelection({ text: sel, article });
                }
                setActiveTab('notes');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#E5C697] bg-[#FDF6EA] hover:border-[#C68A3E] text-xs font-bold text-[#9A6524] transition-colors cursor-pointer"
            >
              <BookMarked className="w-3.5 h-3.5 text-[#C68A3E]" />
              <span>個人法條筆記（{articleNotes.length}）</span>
            </button>
          </div>

          {/* Underlined Section Tabs (Exact match to Image 3: 關鍵知識 | 內容連結 | 立法理由 | 個人法條筆記) */}
          <div className="border-b border-[#E5DFD3] flex flex-wrap items-center gap-6 sm:gap-8">
            <button
              type="button"
              onClick={() => setActiveTab('knowledge')}
              className={`pb-3 text-sm transition-colors relative cursor-pointer ${
                activeTab === 'knowledge'
                  ? 'font-black text-[#1A1D24] border-b-2 border-[#C68A3E]'
                  : 'font-medium text-[#8A8175] hover:text-[#1A1D24]'
              }`}
            >
              關鍵知識
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('graph')}
              className={`pb-3 text-sm transition-colors relative cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'graph'
                  ? 'font-black text-[#1A1D24] border-b-2 border-[#C68A3E]'
                  : 'font-medium text-[#8A8175] hover:text-[#1A1D24]'
              }`}
            >
              <span>內容連結 & 關聯圖譜</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-[#F3EFE6] text-[#6E6559]">
                {article.crossReferences.length + articleTerms.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`pb-3 text-sm transition-colors relative cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'font-black text-[#1A1D24] border-b-2 border-[#C68A3E]'
                  : 'font-medium text-[#8A8175] hover:text-[#1A1D24]'
              }`}
            >
              <span>立法理由 & 修法沿革</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-[#F3EFE6] text-[#6E6559]">
                {article.amendments.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={`pb-3 text-sm transition-colors relative cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'notes'
                  ? 'font-black text-[#1A1D24] border-b-2 border-[#C68A3E]'
                  : 'font-medium text-[#8A8175] hover:text-[#1A1D24]'
              }`}
            >
              <span>個人法條筆記</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-[#FDF6EA] border border-[#E5C697] text-[#9A6524] font-mono">
                {articleNotes.length}
              </span>
            </button>
          </div>

          {/* TAB 1: 關鍵知識 (Matches Image 3: 白話與解析 + 重點摘要 beige box + Q · Q&A) */}
          {activeTab === 'knowledge' && (
            <div className="pt-6 space-y-6">
              <div className="flex items-baseline gap-2.5">
                <h2 className="text-lg font-black text-[#1A1D24]">白話與解析</h2>
                <span className="text-xs text-[#9A9184]">白話字典整理，以原文為準</span>
              </div>

              {/* Warm Beige Summary Callout Box with Gold Left Border (Matches Image 3) */}
              <div className="border-l-4 border-[#C68A3E] bg-[#FBF8F2] rounded-r-2xl p-5 space-y-2">
                <div className="text-sm font-black text-[#1A1D24]">重點摘要</div>
                <p className="text-sm sm:text-[15px] text-[#3B352C] leading-[1.85]">
                  {article.summaryCallout || article.plainExplanation}
                </p>
              </div>

              {/* Q&A Section (Matches Image 3: Q · 合約只蓋章沒簽名，有效嗎？) */}
              {article.qaPrompt && (
                <div className="space-y-3 pt-1">
                  <h3 className="text-base sm:text-lg font-black text-[#1A1D24]">
                    Q · {article.qaPrompt.replace(/^Q\s*[·.]\s*/, '')}
                  </h3>
                  {article.qaShortAnswer && (
                    <p className="text-sm sm:text-[15px] text-[#2D3139] leading-[1.9]">
                      {article.qaShortAnswer}
                    </p>
                  )}
                </div>
              )}

              {/* Full Plain-Language Explanation & Practical Example */}
              <div className="space-y-3 pt-2 border-t border-[#F2EFE9]">
                <h4 className="text-sm font-bold text-[#4A453E]">條文白話逐段拆解</h4>
                <div className="text-sm text-[#2D3139] leading-[1.9] whitespace-pre-line">
                  {article.plainExplanation}
                </div>

                <div className="rounded-xl border border-[#ECE7DF] bg-[#FAF8F5] p-4 mt-3">
                  <div className="text-xs font-bold text-[#8A8175] mb-1">
                    生活實務案例與適用範圍
                  </div>
                  <p className="text-xs sm:text-sm text-[#3B352C] leading-relaxed">
                    {article.practicalExample}
                  </p>
                  <p className="text-xs text-[#8A8175] mt-2">
                    適用範圍：{article.applicabilityScope}
                  </p>
                </div>
              </div>

              {/* Click-to-Reveal Legal Terms Dictionary in this Article */}
              {articleTerms.length > 0 && (
                <div className="pt-4 border-t border-[#EFECE6] space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#1A1D24] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#C68A3E]" />
                      本條專有名詞白話字典（點擊名詞展開定義與修法年份）
                    </h4>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {articleTerms.map((term) => {
                      const isExpanded = expandedTermIds.includes(term.id);
                      return (
                        <button
                          key={term.id}
                          type="button"
                          onClick={() => toggleTermExpand(term.id)}
                          className={`px-3 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                            isExpanded
                              ? 'border-[#C68A3E] bg-[#C68A3E] text-white'
                              : 'border-[#E2DACB] bg-[#FAF8F5] hover:border-[#C68A3E] text-[#3B352C]'
                          }`}
                        >
                          <span>{term.name}</span>
                          <span className="text-[10px] opacity-80">
                            {isExpanded ? '收合 ▲' : '點擊展開 ▼'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {expandedTermIds.length > 0 && (
                    <div className="space-y-3 pt-1">
                      {articleTerms
                        .filter((t) => expandedTermIds.includes(t.id))
                        .map((term) => (
                          <div
                            key={term.id}
                            className="rounded-xl border border-[#E5C697] bg-[#FDF9F1] p-4 space-y-2"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-sm font-black text-[#1A1D24]">
                                {term.name}
                              </span>
                              <span className="text-xs text-[#8A8175]">
                                {term.category} · {term.englishName}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-[#2D3139] leading-relaxed">
                              <strong className="text-[#9A6524]">這詞定義是什麼（白話文）：</strong>
                              {term.plainDefinition}
                            </p>
                            <p className="text-xs text-[#6E6559] leading-relaxed">
                              <strong>法定定義：</strong>
                              {term.shortDefinition}
                            </p>
                            <div className="text-xs text-[#6E6559] pt-1 border-t border-[#EFE6D5] flex flex-wrap items-center justify-between gap-2">
                              <span>
                                <strong>幾年改了 · 為何改了：</strong>
                                {term.amendmentHistorySummary}
                              </span>
                              <button
                                type="button"
                                onClick={() => onSelectTermModal(term)}
                                className="text-[#9A6524] font-bold hover:underline cursor-pointer"
                              >
                                開啟名詞完整修法卡片 →
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 內容連結 & 關聯圖譜 */}
          {activeTab === 'graph' && (
            <div className="pt-6 space-y-6">
              <div className="rounded-2xl border border-[#E5DFD3] bg-[#FAF8F5] p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-black text-[#1A1D24] flex items-center gap-1.5">
                      <Network className="w-4 h-4 text-[#C68A3E]" />
                      法規與名詞關聯圖譜
                    </h3>
                    <p className="text-xs text-[#8A8175] mt-0.5">
                      點擊圖譜中的「引用條文節點」可直接切換至該條文；點擊「名詞節點」可查看白話定義
                    </p>
                  </div>
                </div>
                <KnowledgeGraph
                  selectedArticle={article}
                  allArticles={allArticles}
                  allTerms={allTerms}
                  onSelectArticle={(target) => onSelectArticle(target)}
                  onSelectTerm={(term) => onSelectTermModal(term)}
                />
              </div>

              {/* Cross-Referenced Articles List */}
              <div className="space-y-3">
                <h4 className="text-sm font-black text-[#1A1D24]">
                  跨條文引用與體系連結（{article.crossReferences.length} 筆）
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {article.crossReferences.map((ref, idx) => {
                    const targetArt =
                      allArticles.find((a) => a.id === ref.targetArticleId) ||
                      lawArticles.find((a) => a.id === ref.targetArticleId);
                    return (
                      <div
                        key={idx}
                        onClick={() => targetArt && onSelectArticle(targetArt)}
                        className="rounded-xl border border-[#E5DFD3] bg-white hover:border-[#C68A3E] p-3.5 transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5DFD3] text-[11px] font-bold text-[#9A6524]">
                            {ref.relationType}
                          </span>
                          {targetArt && (
                            <span className="text-xs font-bold text-[#1A1D24]">
                              {targetArt.specificLawTitle} {targetArt.articleNumber} →
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#6E6559] leading-relaxed">{ref.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 立法理由 & 修法沿革 (幾年改了、修改日期、修改了什麼、為何改了 + 新舊條文逐字比對) */}
          {activeTab === 'history' && (
            <div className="pt-6 space-y-5">
              <div className="flex items-baseline justify-between">
                <div>
                  <h3 className="text-base font-black text-[#1A1D24]">
                    歷年修法沿革與立法理由
                  </h3>
                  <p className="text-xs text-[#8A8175] mt-0.5">
                    完整記載本條「幾年改了、修改日期、修改了什麼、為何改了」及新舊條文逐字增刪比對
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {article.amendments.map((amd) => {
                  const diffs = computeCharDiff(amd.previousText, amd.updatedText);
                  return (
                    <div
                      key={amd.id}
                      className="rounded-2xl border border-[#E5DFD3] bg-[#FAF8F5] p-5 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-[#C68A3E] text-white text-xs font-bold">
                            幾年改了：{amd.rocYear}
                          </span>
                          <span className="text-xs font-bold text-[#4A453E]">
                            修改日期：{amd.date}
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded border border-[#E5DFD3] bg-white text-[11px] font-semibold text-[#6E6559]">
                          {amd.changeType} ｜ {amd.versionLabel}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="rounded-xl bg-white border border-[#ECE7DF] p-3">
                          <div className="text-[11px] font-bold text-[#9A6524] mb-1">
                            修改了什麼（白話重點）
                          </div>
                          <p className="text-xs text-[#2D3139] leading-relaxed">
                            {amd.whatChangedPlain}
                          </p>
                        </div>
                        <div className="rounded-xl bg-white border border-[#ECE7DF] p-3">
                          <div className="text-[11px] font-bold text-[#9A6524] mb-1">
                            為何改了（立法理由與背景）
                          </div>
                          <p className="text-xs text-[#2D3139] leading-relaxed">
                            {amd.whyChangedPlain}
                          </p>
                        </div>
                      </div>

                      {/* Added / Removed Summary */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="px-3 py-2 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-900">
                          <strong>[+新增內容]：</strong> {amd.addedSummary}
                        </div>
                        <div className="px-3 py-2 rounded-lg bg-rose-50/80 border border-rose-200 text-rose-900">
                          <strong>[-刪去內容]：</strong> {amd.removedSummary}
                        </div>
                      </div>

                      {/* Character-level Diff */}
                      <div className="rounded-xl bg-white border border-[#ECE7DF] p-3.5">
                        <div className="text-[11px] font-bold text-[#8A8175] mb-1.5">
                          新舊條文逐字比對（紅底刪除線為舊法刪去，綠底粗體為新法增訂）
                        </div>
                        <p className="text-xs sm:text-sm leading-relaxed font-mono">
                          {diffs.map((part, pIdx) => {
                            if (part.type === 'added') {
                              return (
                                <span
                                  key={pIdx}
                                  className="bg-emerald-100 text-emerald-900 font-bold px-0.5 rounded"
                                >
                                  {part.value}
                                </span>
                              );
                            }
                            if (part.type === 'removed') {
                              return (
                                <span
                                  key={pIdx}
                                  className="bg-rose-100 text-rose-800 line-through px-0.5 rounded opacity-80"
                                >
                                  {part.value}
                                </span>
                              );
                            }
                            return (
                              <span key={pIdx} className="text-[#2D3139]">
                                {part.value}
                              </span>
                            );
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: 個人法條筆記 (Personal Statute Notes stored in localStorage) */}
          {activeTab === 'notes' && (
            <div className="pt-6">
              <PersonalNotesWidget
                notes={personalNotes}
                currentArticle={article}
                pendingSelection={pendingSelection}
                onClearPendingSelection={() => setPendingSelection(null)}
                onAddNote={onAddPersonalNote}
                onUpdateNote={onUpdatePersonalNote}
                onDeleteNote={onDeletePersonalNote}
                onJumpToNoteArticle={(note) => {
                  const found =
                    lawArticles.find((a) => a.id === note.articleId) ||
                    allArticles.find((a) => a.id === note.articleId);
                  if (found) onSelectArticle(found);
                }}
              />
            </div>
          )}
        </div>

        {/* Floating Bottom Navigation Bar (Matches bottom bar of Image 3: ← 上一條 | 第 3 條 使用文字之準則 | 開新分頁 ↗ | 下一條 →) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-xl">
          <div className="rounded-full border border-[#E2DACB] bg-white/95 backdrop-blur-md shadow-lg px-4 py-2.5 flex items-center justify-between gap-2 text-xs">
            <button
              type="button"
              disabled={!prevArticle}
              onClick={() => prevArticle && onSelectArticle(prevArticle)}
              className={`inline-flex items-center gap-1 font-medium transition-colors ${
                prevArticle
                  ? 'text-[#4A453E] hover:text-[#C68A3E] cursor-pointer'
                  : 'text-[#C8C2B8] cursor-not-allowed'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>上一條</span>
            </button>

            <div className="flex items-center gap-3 truncate">
              <span className="font-bold text-[#1A1D24] truncate">
                {article.articleNumber} {article.title}
              </span>
              <span className="text-[#D5CEC2]">|</span>
              <button
                type="button"
                onClick={() => onOpenInNewTab(article)}
                className="inline-flex items-center gap-1 text-[#8A8175] hover:text-[#C68A3E] font-medium shrink-0 cursor-pointer"
              >
                <span>開新分頁</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <button
              type="button"
              disabled={!nextArticle}
              onClick={() => nextArticle && onSelectArticle(nextArticle)}
              className={`inline-flex items-center gap-1 font-medium transition-colors ${
                nextArticle
                  ? 'text-[#4A453E] hover:text-[#C68A3E] cursor-pointer'
                  : 'text-[#C8C2B8] cursor-not-allowed'
              }`}
            >
              <span>下一條</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
