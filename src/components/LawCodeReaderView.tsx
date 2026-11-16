import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  BookMarked,
  Check,
  Copy,
  ExternalLink,
  FileText,
  GitBranch,
  Highlighter,
  Network,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  LegalArticle,
  LegalTerm,
  NoteColorTag,
  PersonalStatuteNote,
  RocLawFullDocument,
} from '../types/legal';
import { highlightLegalTermsInText } from '../utils/legalEngine';
import { KnowledgeGraph } from './KnowledgeGraph';
import { PersonalNotesWidget } from './PersonalNotesWidget';

interface LawCodeReaderViewProps {
  doc: RocLawFullDocument;
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
  onOpenArticleModal: (article: LegalArticle, initialTab?: 'knowledge' | 'graph' | 'history') => void;
  onOpenArticleInNewTab: (article: LegalArticle) => void;
  onSelectTermModal: (term: LegalTerm) => void;
  onBackToPortal: () => void;
}

export const LawCodeReaderView: React.FC<LawCodeReaderViewProps> = ({
  doc,
  allArticles,
  allTerms,
  personalNotes,
  onAddPersonalNote,
  onUpdatePersonalNote,
  onDeletePersonalNote,
  onOpenArticleModal,
  onOpenArticleInNewTab,
  onSelectTermModal,
  onBackToPortal,
}) => {
  const [withinLawQuery, setWithinLawQuery] = useState('');
  const [activePartFilter, setActivePartFilter] = useState<string>('ALL');
  const [activeChapterFilter, setActiveChapterFilter] = useState<string>('ALL');
  const [showSideGraph, setShowSideGraph] = useState<boolean>(false);
  const [selectedGraphArticle, setSelectedGraphArticle] = useState<LegalArticle | null>(
    doc.articles[0] || null
  );
  const [bookmarked, setBookmarked] = useState(false);
  const [copiedCitation, setCopiedCitation] = useState(false);

  // Track text selection inside any article for the Personal Statute Note Widget
  const [pendingSelection, setPendingSelection] = useState<{
    text: string;
    article: LegalArticle;
  } | null>(null);
  const [inlineQuickNoteArticleId, setInlineQuickNoteArticleId] = useState<string | null>(null);
  const [inlineQuickNoteText, setInlineQuickNoteText] = useState<string>('');
  const [inlineQuickSelectedQuote, setInlineQuickSelectedQuote] = useState<string>('');

  // Track which inline term is clicked inside which article
  const [activeInlineTerm, setActiveInlineTerm] = useState<{
    articleId: string;
    term: LegalTerm;
  } | null>(null);

  const [displayLimit, setDisplayLimit] = useState<number>(120);

  const filteredArticles = useMemo(() => {
    const q = withinLawQuery.trim().toLowerCase();
    return doc.articles.filter((art) => {
      if (activePartFilter !== 'ALL' && art.partTitle !== activePartFilter) {
        return false;
      }
      if (activeChapterFilter !== 'ALL' && art.chapter !== activeChapterFilter) {
        return false;
      }
      if (!q) return true;
      const numOnly = q.replace(/[^0-9\-之]/g, '');
      if (
        numOnly &&
        (art.articleNumber === `第 ${numOnly} 條` ||
          art.articleNumber === `第${numOnly}條` ||
          art.articleNumber.includes(numOnly))
      ) {
        return true;
      }
      return (
        art.articleNumber.toLowerCase().includes(q) ||
        art.title.toLowerCase().includes(q) ||
        art.currentText.toLowerCase().includes(q) ||
        art.plainExplanation.toLowerCase().includes(q)
      );
    });
  }, [doc.articles, withinLawQuery, activePartFilter, activeChapterFilter]);

  const visibleArticles = useMemo(
    () => filteredArticles.slice(0, displayLimit),
    [filteredArticles, displayLimit]
  );

  const handleCopyCitation = () => {
    navigator.clipboard?.writeText(doc.lawName);
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 1800);
  };

  const handleJumpToChapter = (partTitle: string, fullChapterTitle: string, firstArticleId: string) => {
    setActivePartFilter('ALL');
    setActiveChapterFilter('ALL');
    setWithinLawQuery('');
    const idx = doc.articles.findIndex((a) => a.id === firstArticleId);
    if (idx >= displayLimit) {
      setDisplayLimit(idx + 80);
    }
    setTimeout(() => {
      const el = document.getElementById(`law-article-${firstArticleId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        setActivePartFilter(partTitle);
        setActiveChapterFilter(fullChapterTitle);
      }
    }, 60);
  };

  const handleArticleTextMouseUp = (article: LegalArticle) => {
    const selected = window.getSelection()?.toString().trim() || '';
    if (selected.length >= 2) {
      setSelectedGraphArticle(article);
      setPendingSelection({ text: selected, article });
      setInlineQuickNoteArticleId(article.id);
      setInlineQuickSelectedQuote(selected);
    }
  };

  const renderArticleParagraphs = (article: LegalArticle) => {
    const rawLines = article.currentText
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);

    const isMultiParagraph = rawLines.length > 1;

    return (
      <div
        className="space-y-2.5 mt-3"
        onMouseUp={(e) => {
          e.stopPropagation();
          handleArticleTextMouseUp(article);
        }}
      >
        {rawLines.map((line, lineIdx) => {
          const cleanedLine = isMultiParagraph
            ? line.replace(/^\d+\.\s*/, '')
            : line;
          const segments = highlightLegalTermsInText(cleanedLine, allTerms);

          return (
            <div
              key={lineIdx}
              className="flex items-baseline text-[15px] sm:text-base text-[#1F232B] leading-[1.9] tracking-[0.01em]"
            >
              {isMultiParagraph && (
                <span className="text-xs font-mono text-[#9A9184] w-5 shrink-0 select-none">
                  {lineIdx + 1}.
                </span>
              )}
              <p className="flex-1">
                {segments.map((seg, sIdx) => {
                  if (!seg.term) {
                    return <React.Fragment key={sIdx}>{seg.text}</React.Fragment>;
                  }
                  const matchedTerm = seg.term;
                  const isTermOpen =
                    activeInlineTerm?.articleId === article.id &&
                    activeInlineTerm?.term.id === matchedTerm.id;

                  return (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveInlineTerm((prev) =>
                          prev?.articleId === article.id && prev?.term.id === matchedTerm.id
                            ? null
                            : { articleId: article.id, term: matchedTerm }
                        );
                      }}
                      title={`點擊查看「${matchedTerm.name}」白話定義與修法沿革`}
                      className={`inline-flex items-center gap-0.5 mx-0.5 pb-0.5 border-b border-dotted transition-colors cursor-pointer ${
                        isTermOpen
                          ? 'border-[#C68A3E] bg-[#FDF6EA] text-[#9A6524] font-semibold px-1 rounded-t'
                          : 'border-[#8C7A5B] hover:border-[#C68A3E] text-[#1F232B] hover:text-[#9A6524]'
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
    );
  };

  let lastRenderedPart = '';
  let lastRenderedChapter = '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Statute Column (8 cols when side graph hidden, 7 cols when side graph active) */}
        <div className={showSideGraph ? 'lg:col-span-7' : 'lg:col-span-8'}>
          {/* Breadcrumb & Source Meta Pills (Matches Image 2) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
            <nav className="flex items-center gap-1.5 text-xs text-[#8A8175]">
              <button
                type="button"
                onClick={onBackToPortal}
                className="hover:text-[#1A1D24] transition-colors cursor-pointer"
              >
                法脈
              </button>
              <span>/</span>
              <button
                type="button"
                onClick={onBackToPortal}
                className="hover:text-[#1A1D24] transition-colors cursor-pointer"
              >
                全國法規
              </button>
              <span>/</span>
              <span className="text-[#4A453E] font-medium">{doc.lawName}</span>
            </nav>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={doc.officialUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#E5DFD3] bg-[#FAF8F5] hover:bg-[#F3EFE6] text-[11px] text-[#6E6559] transition-colors"
              >
                <FileText className="w-3 h-3 text-[#8A8175]" />
                資料來源
              </a>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#E5DFD3] bg-[#FAF8F5] text-[11px] text-[#6E6559]">
                異動 {doc.lastModifiedDateRoc}
              </span>
              <button
                type="button"
                onClick={() => setShowSideGraph((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors cursor-pointer ${
                  showSideGraph
                    ? 'border-[#C68A3E] bg-[#FDF6EA] text-[#9A6524]'
                    : 'border-[#E5DFD3] bg-white hover:bg-[#FAF8F5] text-[#6E6559]'
                }`}
              >
                <Network className="w-3 h-3 text-[#C68A3E]" />
                {showSideGraph ? '隱藏並列圖譜' : '雙欄圖譜並列'}
              </button>
            </div>
          </div>

          {/* Big Law Title with Warm Gold Underline Bar (Matches Image 2) */}
          <div className="pt-2 pb-6">
            <h1 className="text-3xl sm:text-4xl font-black text-[#1A1D24] tracking-tight">
              {doc.lawName}
            </h1>
            <div className="w-12 h-1 bg-[#C68A3E] rounded-full mt-2.5" />
          </div>

          {/* Effective Status Notice Row (Matches Image 2) */}
          {doc.effectiveStatusDetail && (
            <div className="border-t border-[#ECE7DF] py-3.5 flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 text-xs leading-relaxed">
              <span className="text-[#9A9184] font-medium shrink-0 w-20">生效狀態</span>
              <p className="text-[#6E6559] flex-1">{doc.effectiveStatusDetail}</p>
            </div>
          )}

          {/* 4-Column Law Metadata Grid (Matches Image 2) */}
          <div className="border-y border-[#ECE7DF] py-4 my-1 space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <div className="text-[#9A9184] mb-1">法規代碼</div>
                <div className="font-mono font-semibold text-[#2D3139] text-sm">{doc.pcode}</div>
              </div>
              <div>
                <div className="text-[#9A9184] mb-1">公布</div>
                <div className="font-mono font-semibold text-[#2D3139] text-sm">
                  {doc.enactedDateRoc}
                </div>
              </div>
              <div>
                <div className="text-[#9A9184] mb-1">最後修正</div>
                <div className="font-mono font-semibold text-[#2D3139] text-sm">
                  {doc.lastModifiedDateRoc}
                </div>
              </div>
              <div>
                <div className="text-[#9A9184] mb-1">狀態</div>
                <div className="font-semibold text-[#2D3139] text-sm">
                  {doc.effectiveStatusLabel === '生效' ? '有效施行中' : doc.effectiveStatusLabel}
                </div>
              </div>
            </div>

            <div className="border-t border-[#F2EFE9] pt-3.5 grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <div className="text-[#9A9184] mb-1">種類</div>
                <div className="text-[#2D3139] font-medium">{doc.lawCategoryPath}</div>
              </div>
              <div>
                <div className="text-[#9A9184] mb-1">官方原文</div>
                <a
                  href={doc.officialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[#2D3139] hover:text-[#C68A3E] font-medium transition-colors"
                >
                  閱讀官方原文
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div>
                <div className="text-[#9A9184] mb-1">引用格式</div>
                <button
                  type="button"
                  onClick={handleCopyCitation}
                  className="inline-flex items-center gap-1.5 text-[#2D3139] hover:text-[#C68A3E] font-medium cursor-pointer"
                >
                  <span>{doc.lawName}</span>
                  {copiedCitation ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3 text-[#9A9184]" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Part & Numbered Circle Chapter Index (Matches Image 2) */}
          {doc.partGroups.length > 0 && (
            <div className="border-b border-[#ECE7DF] py-5 space-y-3">
              {doc.partGroups.map((part) => (
                <div
                  key={part.partTitle}
                  className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 text-sm"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActivePartFilter(
                        activePartFilter === part.partTitle ? 'ALL' : part.partTitle
                      );
                      setActiveChapterFilter('ALL');
                    }}
                    className={`text-left font-bold shrink-0 sm:w-32 transition-colors cursor-pointer ${
                      activePartFilter === part.partTitle
                        ? 'text-[#C68A3E]'
                        : 'text-[#2D3139] hover:text-[#C68A3E]'
                    }`}
                  >
                    {part.partTitle}
                  </button>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 flex-1">
                    {part.chapters.map((ch) => {
                      const isSelected = activeChapterFilter === ch.fullChapterTitle;
                      return (
                        <button
                          key={ch.fullChapterTitle}
                          type="button"
                          onClick={() =>
                            handleJumpToChapter(
                              part.partTitle,
                              ch.fullChapterTitle,
                              ch.firstArticleId
                            )
                          }
                          className={`inline-flex items-center gap-1.5 text-xs sm:text-[13px] transition-colors cursor-pointer group ${
                            isSelected
                              ? 'text-[#C68A3E] font-bold'
                              : 'text-[#6E6559] hover:text-[#1A1D24]'
                          }`}
                        >
                          <span
                            className={`inline-flex items-center justify-center w-4 h-4 rounded-full border text-[10px] font-mono leading-none transition-colors ${
                              isSelected
                                ? 'border-[#C68A3E] bg-[#C68A3E] text-white'
                                : 'border-[#B8B0A4] text-[#8A8175] group-hover:border-[#C68A3E] group-hover:text-[#C68A3E]'
                            }`}
                          >
                            {ch.index}
                          </span>
                          <span>{ch.shortChapterTitle}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick In-Law Filter & Search Bar */}
          <div className="py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-[#ECE7DF]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#9A9184] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={withinLawQuery}
                onChange={(e) => {
                  setWithinLawQuery(e.target.value);
                  setDisplayLimit(120);
                }}
                placeholder={`在《${doc.lawName}》共 ${doc.articles.length} 條條文中搜尋條號（如：3、184）或關鍵字...`}
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-[#E5DFD3] bg-[#FAF8F5] focus:bg-white text-xs sm:text-sm text-[#1A1D24] placeholder:text-[#9A9184] focus:outline-none focus:border-[#C68A3E]"
              />
              {withinLawQuery && (
                <button
                  type="button"
                  onClick={() => setWithinLawQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9A9184] hover:text-[#1A1D24] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-[#8A8175] shrink-0">
              {(activePartFilter !== 'ALL' || activeChapterFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setActivePartFilter('ALL');
                    setActiveChapterFilter('ALL');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#FDF6EA] border border-[#E5C697] text-[#9A6524] font-medium cursor-pointer"
                >
                  顯示全部章節 ✕
                </button>
              )}
              <span>
                共顯示 <strong className="text-[#1A1D24]">{filteredArticles.length}</strong> /{' '}
                {doc.articles.length} 條
              </span>
            </div>
          </div>

          {/* Continuous Statute Stream (Matches Image 1) */}
          <div className="divide-y divide-[#EFECE6] pt-2">
            {visibleArticles.map((article) => {
              const showPartHeading =
                article.partTitle && article.partTitle !== lastRenderedPart;
              if (article.partTitle) {
                lastRenderedPart = article.partTitle;
              }

              const showChapterHeading =
                article.chapter &&
                article.chapter !== article.partTitle &&
                article.chapter !== lastRenderedChapter;
              if (article.chapter) {
                lastRenderedChapter = article.chapter;
              }

              const openedInlineTerm =
                activeInlineTerm?.articleId === article.id ? activeInlineTerm.term : null;

              const articleSavedNotes = personalNotes.filter(
                (n) => n.articleId === article.id
              );
              const isQuickNoteOpen = inlineQuickNoteArticleId === article.id;

              return (
                <React.Fragment key={article.id}>
                  {showPartHeading && (
                    <div className="pt-8 pb-3 border-b border-[#E5DFD3]">
                      <h2 className="text-xl sm:text-2xl font-black text-[#1A1D24] tracking-tight">
                        {article.partTitle}
                      </h2>
                    </div>
                  )}

                  {showChapterHeading && (
                    <div className="pt-5 pb-3 pl-2 border-b border-[#EFECE6]">
                      <h3 className="text-base sm:text-lg font-bold text-[#2D3139]">
                        {article.chapter}
                      </h3>
                    </div>
                  )}

                  <article
                    id={`law-article-${article.id}`}
                    onClick={() => {
                      const sel = window.getSelection()?.toString().trim() || '';
                      if (sel.length >= 2) return;
                      setSelectedGraphArticle(article);
                      onOpenArticleModal(article, 'knowledge');
                    }}
                    className="group relative my-1.5 px-4 sm:px-5 py-5 rounded-2xl hover:bg-[#F7F4EC] transition-colors cursor-pointer"
                  >
                    {/* Article Header Row: Article Number + Concise Title on Left, Note + Open Tab + 圖解條文 on Right */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-baseline gap-2.5">
                        <span className="text-base sm:text-[17px] font-black text-[#1A1D24] group-hover:text-[#B87D32] transition-colors whitespace-nowrap shrink-0">
                          {article.articleNumber}
                        </span>
                        <span className="text-xs sm:text-[13px] text-[#8A8175] font-medium">
                          {article.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGraphArticle(article);
                            if (inlineQuickNoteArticleId === article.id) {
                              setInlineQuickNoteArticleId(null);
                            } else {
                              const currentSel = window.getSelection()?.toString().trim() || '';
                              setInlineQuickSelectedQuote(
                                currentSel || article.currentText.split('\n')[0] || ''
                              );
                              setInlineQuickNoteArticleId(article.id);
                            }
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors cursor-pointer ${
                            isQuickNoteOpen || articleSavedNotes.length > 0
                              ? 'border-[#C68A3E] bg-[#FDF6EA] text-[#9A6524] font-bold'
                              : 'border-[#E2DACB] bg-white hover:border-[#C68A3E] text-[#6E6559] hover:text-[#9A6524]'
                          }`}
                        >
                          <BookMarked className="w-3 h-3 text-[#C68A3E]" />
                          <span>
                            筆記{articleSavedNotes.length > 0 ? ` (${articleSavedNotes.length})` : ''}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenArticleInNewTab(article);
                          }}
                          className="inline-flex items-center gap-1 text-xs text-[#9A9184] hover:text-[#B87D32] font-medium transition-colors cursor-pointer"
                        >
                          <span>開啟分頁</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGraphArticle(article);
                            onOpenArticleModal(article, 'knowledge');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#E2DACB] bg-white hover:border-[#C68A3E] text-xs font-medium text-[#6E6559] hover:text-[#9A6524] shadow-2xs transition-all cursor-pointer"
                        >
                          <GitBranch className="w-3.5 h-3.5 text-[#C68A3E]" />
                          <span>圖解條文</span>
                        </button>
                      </div>
                    </div>

                    {/* Numbered Paragraphs with Clickable Inline Legal Terms (◆) & Text Selection Support */}
                    {renderArticleParagraphs(article)}

                    {/* Inline Quick Note Composer when user selects text in this article or clicks `筆記` */}
                    {isQuickNoteOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-4 rounded-xl border border-[#C68A3E] bg-[#FDF9F1] p-4 shadow-xs space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-[#9A6524] flex items-center gap-1.5">
                            <Highlighter className="w-3.5 h-3.5 text-[#C68A3E]" />
                            新增《{doc.lawName}》{article.articleNumber} 個人法條筆記（儲存至 localStorage）
                          </span>
                          <button
                            type="button"
                            onClick={() => setInlineQuickNoteArticleId(null)}
                            className="text-xs text-[#8A8175] hover:text-[#1A1D24] cursor-pointer"
                          >
                            關閉 ✕
                          </button>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-[#6E6559]">
                            選取的法條文字段落：
                          </label>
                          <input
                            type="text"
                            value={inlineQuickSelectedQuote}
                            onChange={(e) => setInlineQuickSelectedQuote(e.target.value)}
                            placeholder="反白選取的條文文字..."
                            className="w-full rounded-lg border border-[#E5DFD3] bg-white px-3 py-1.5 text-xs text-[#2D3139]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-[#6E6559]">
                            個人法條筆記內容：
                          </label>
                          <textarea
                            rows={2}
                            value={inlineQuickNoteText}
                            onChange={(e) => setInlineQuickNoteText(e.target.value)}
                            placeholder="輸入您的個人讀書筆記、實務見解或考試重點..."
                            className="w-full rounded-lg border border-[#E5DFD3] bg-white px-3 py-1.5 text-xs sm:text-sm text-[#1A1D24]"
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (!inlineQuickNoteText.trim() && !inlineQuickSelectedQuote.trim()) {
                                return;
                              }
                              onAddPersonalNote({
                                articleId: article.id,
                                pcode: doc.pcode,
                                lawName: doc.lawName,
                                articleNumber: article.articleNumber,
                                articleTitle: article.title,
                                selectedText:
                                  inlineQuickSelectedQuote.trim() ||
                                  article.currentText.split('\n')[0] ||
                                  article.title,
                                noteContent:
                                  inlineQuickNoteText.trim() ||
                                  `重點標記：「${inlineQuickSelectedQuote.trim()}」`,
                                colorTag: 'gold',
                              });
                              setInlineQuickNoteText('');
                              setInlineQuickNoteArticleId(null);
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-[#1F242D] hover:bg-[#C68A3E] text-white text-xs font-bold transition-colors cursor-pointer"
                          >
                            儲存個人法條筆記
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Saved Personal Notes for this Article */}
                    {articleSavedNotes.length > 0 && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-3 space-y-2"
                      >
                        {articleSavedNotes.map((note) => (
                          <div
                            key={note.id}
                            className="rounded-xl border border-[#E5C697] border-l-4 border-l-[#C68A3E] bg-[#FDF9F1] px-3.5 py-2.5 flex items-start justify-between gap-3 text-xs"
                          >
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-1.5 font-bold text-[#9A6524]">
                                <BookMarked className="w-3.5 h-3.5" />
                                <span>個人法條筆記</span>
                                {note.selectedText && (
                                  <span className="font-normal text-[#6E5634] bg-white/80 px-2 py-0.2 rounded border border-[#EFE3CE]">
                                    摘錄：「{note.selectedText}」
                                  </span>
                                )}
                              </div>
                              <p className="text-[#1A1D24] leading-relaxed">{note.noteContent}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => onDeletePersonalNote(note.id)}
                              className="p-1 text-[#8A8175] hover:text-rose-600 cursor-pointer shrink-0"
                              title="刪除此筆記"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Click-to-reveal Inline Legal Term Card when user clicks a `◆` term */}
                    {openedInlineTerm && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-4 rounded-xl border border-[#E5C697] bg-[#FDF9F1] p-4 shadow-xs animate-in fade-in duration-150"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#C68A3E] text-white text-[11px] font-bold">
                              <Sparkles className="w-3 h-3" />
                              名詞白話定義
                            </span>
                            <h4 className="text-sm font-black text-[#1A1D24]">
                              {openedInlineTerm.name}
                            </h4>
                            <span className="text-[11px] text-[#8A8175] bg-white px-2 py-0.5 rounded border border-[#E5DFD3]">
                              {openedInlineTerm.category} · {openedInlineTerm.englishName}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveInlineTerm(null)}
                            className="text-xs text-[#8A8175] hover:text-[#1A1D24] px-2 py-0.5 rounded border border-[#E5DFD3] bg-white cursor-pointer"
                          >
                            收合 ✕
                          </button>
                        </div>

                        <p className="mt-2.5 text-xs sm:text-sm text-[#2D3139] leading-relaxed">
                          <strong className="text-[#9A6524]">這詞定義是什麼（白話文）：</strong>
                          {openedInlineTerm.plainDefinition}
                        </p>
                        <p className="mt-1.5 text-xs text-[#6E6559] leading-relaxed">
                          <strong className="text-[#4A453E]">法定定義：</strong>
                          {openedInlineTerm.shortDefinition}
                        </p>
                        <div className="mt-2.5 pt-2.5 border-t border-[#EFE6D5] flex flex-wrap items-center justify-between gap-2 text-xs text-[#8A8175]">
                          <span>
                            <strong className="text-[#6E6559]">幾年改了 · 為何改了：</strong>
                            {openedInlineTerm.amendmentHistorySummary}
                          </span>
                          <button
                            type="button"
                            onClick={() => onSelectTermModal(openedInlineTerm)}
                            className="text-[#9A6524] hover:underline font-bold cursor-pointer"
                          >
                            查看完整歷年修法沿革 →
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                </React.Fragment>
              );
            })}
          </div>

          {/* Load More Articles Button for Large Codes like Civil Code (1,229 articles) */}
          {filteredArticles.length > displayLimit && (
            <div className="py-8 text-center">
              <button
                type="button"
                onClick={() => setDisplayLimit((prev) => prev + 200)}
                className="px-6 py-2.5 rounded-full border border-[#D8CFC0] bg-[#FAF8F5] hover:bg-[#F2ECE1] text-xs sm:text-sm font-bold text-[#4A453E] transition-colors cursor-pointer"
              >
                繼續載入後續條文（目前已顯示 {displayLimit} / 共 {filteredArticles.length} 條）
              </button>
            </div>
          )}
        </div>

        {/* Right Side Column: Bookmark + Personal Statute Note Widget + Interactive Knowledge Graph */}
        <div
          className={`${
            showSideGraph ? 'lg:col-span-5' : 'lg:col-span-4'
          } lg:sticky lg:top-16 space-y-4`}
        >
          {/* Warm Beige Bookmark Button (Matches top-right of Image 1 & Image 2) */}
          <button
            type="button"
            onClick={() => setBookmarked((b) => !b)}
            className={`w-full py-3 px-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs ${
              bookmarked
                ? 'bg-[#C68A3E] border-[#B5792E] text-white'
                : 'bg-linear-to-r from-[#F5EFE4] via-[#EFE6D5] to-[#F5EFE4] hover:from-[#EFE6D5] hover:to-[#E6D9C3] border-[#E2D6C1] text-[#3B352C]'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>{bookmarked ? '已加入書籤' : '加入書籤'}</span>
          </button>

          {/* Personal Statute Note Widget (個人法條筆記小工具 - localStorage) */}
          <PersonalNotesWidget
            notes={personalNotes}
            currentArticle={selectedGraphArticle}
            pendingSelection={pendingSelection}
            onClearPendingSelection={() => setPendingSelection(null)}
            onAddNote={onAddPersonalNote}
            onUpdateNote={onUpdatePersonalNote}
            onDeleteNote={onDeletePersonalNote}
            onJumpToNoteArticle={(note) => {
              const el = document.getElementById(`law-article-${note.articleId}`);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }}
            compact
          />

          {/* Side-by-side Knowledge Graph */}
          {selectedGraphArticle && (
            <div className="rounded-2xl border border-[#EAE4D8] bg-white p-3 shadow-xs">
              <div className="flex items-center justify-between px-1 pb-2 mb-2 border-b border-[#F2EFE9]">
                <div>
                  <span className="text-[11px] text-[#9A9184] block">條文關聯圖譜</span>
                  <h4 className="text-xs font-bold text-[#1A1D24]">
                    {selectedGraphArticle.specificLawTitle} {selectedGraphArticle.articleNumber}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenArticleModal(selectedGraphArticle, 'graph')}
                  className="text-[11px] text-[#C68A3E] hover:underline font-semibold cursor-pointer"
                >
                  放大圖解 ↗
                </button>
              </div>
              <KnowledgeGraph
                selectedArticle={selectedGraphArticle}
                allArticles={allArticles}
                allTerms={allTerms}
                onSelectArticle={(art) => {
                  setSelectedGraphArticle(art);
                  onOpenArticleModal(art, 'knowledge');
                }}
                onSelectTerm={(term) => onSelectTermModal(term)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
