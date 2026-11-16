import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookMarked,
  BookOpen,
  Building2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  GitBranch,
  History,
  Loader2,
  Menu,
  Network,
  Plus,
  Scale,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  LAW_CATEGORIES,
  LEGAL_ARTICLES,
  LEGAL_TERMS,
} from './data/legalDatabase';
import {
  LawCategory,
  LegalArticle,
  LegalTerm,
  NoteColorTag,
  PersonalStatuteNote,
  RocLawFullDocument,
  RocLawIndexEntry,
  WorkspaceTab,
} from './types/legal';
import {
  filterLegalArticles,
  filterLegalTerms,
  highlightLegalTermsInText,
} from './utils/legalEngine';
import {
  fetchFullRocLawDocument,
  fetchRocLawIndex,
  ROC_MAJOR_LAWS_CATALOG,
} from './utils/rocLawLoader';
import {
  createPersonalStatuteNote,
  deletePersonalStatuteNote,
  loadPersonalNotesFromStorage,
  savePersonalNotesToStorage,
  updatePersonalStatuteNote,
} from './utils/notesStorage';
import { LawCodeReaderView } from './components/LawCodeReaderView';
import { ArticleDetailModal } from './components/ArticleDetailModal';
import { TermDictionaryModal } from './components/TermDictionaryModal';
import { KnowledgeGraph } from './components/KnowledgeGraph';
import { PersonalNotesWidget } from './components/PersonalNotesWidget';

interface QuickChip {
  label: string;
  type: 'law' | 'article' | 'query';
  pcode?: string;
  articleNumber?: string;
  queryText?: string;
}

const HERO_QUICK_CHIPS_ROW_1: QuickChip[] = [
  { label: '民法 184', type: 'article', pcode: 'B0000001', articleNumber: '第 184 條', queryText: '民法第 184 條' },
  { label: '釋字 748', type: 'query', queryText: '釋字第 748 號' },
  { label: '酒駕', type: 'query', queryText: '不能安全駕駛' },
  { label: '民法 3', type: 'article', pcode: 'B0000001', articleNumber: '第 3 條', queryText: '使用文字之準則' },
  { label: '111 憲判字第 2 號', type: 'query', queryText: '111 年憲判字第 2 號' },
  { label: '刑法', type: 'law', pcode: 'C0000001' },
];

const HERO_QUICK_CHIPS_ROW_2: QuickChip[] = [
  { label: '行政程序法', type: 'law', pcode: 'A0030055' },
  { label: '公司法', type: 'law', pcode: 'J0080001' },
  { label: '個資法', type: 'law', pcode: 'I0050021' },
  { label: '勞動基準法', type: 'law', pcode: 'N0030001' },
  { label: '詐欺罪', type: 'query', queryText: '詐欺' },
  { label: '不當得利', type: 'query', queryText: '不當得利' },
];

export default function App() {
  // Workspace Tabs (Matches top bar of all 4 screenshots: [法脈 LexGraph ×] [民法 ×] [+ 研究分頁])
  const [tabs, setTabs] = useState<WorkspaceTab[]>([
    { id: 'tab-portal', title: '法脈 LexGraph', type: 'portal' },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab-portal');

  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [sidebarSearch, setSidebarSearch] = useState<string>('');

  // Portal search & category state
  const [heroSearchQuery, setHeroSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<LawCategory>('全部法規');
  const [nationalCatalogFilter, setNationalCatalogFilter] = useState<string>('');

  // Loaded full law documents cache & state
  const [loadedLawDocs, setLoadedLawDocs] = useState<Record<string, RocLawFullDocument>>({});
  const [loadingLawPCode, setLoadingLawPCode] = useState<string | null>(null);
  const [lawLoadError, setLawLoadError] = useState<string | null>(null);

  // National 11,805 laws index
  const [nationalLawIndex, setNationalLawIndex] = useState<RocLawIndexEntry[]>([]);
  const [isIndexLoading, setIsIndexLoading] = useState<boolean>(false);

  // Slide-over Article Detail Modal (Image 3) & Term Dictionary Modal
  const [modalArticleState, setModalArticleState] = useState<{
    article: LegalArticle;
    lawArticles: LegalArticle[];
    initialTab: 'knowledge' | 'graph' | 'history' | 'notes';
  } | null>(null);
  const [activeTermModal, setActiveTermModal] = useState<LegalTerm | null>(null);

  // Personal Statute Notes persisted in localStorage
  const [personalNotes, setPersonalNotes] = useState<PersonalStatuteNote[]>(() =>
    loadPersonalNotesFromStorage()
  );
  const [portalTargetNoteArticle, setPortalTargetNoteArticle] = useState<LegalArticle>(
    LEGAL_ARTICLES[2] || LEGAL_ARTICLES[0]
  );
  const [portalPendingSelection, setPortalPendingSelection] = useState<{
    text: string;
    article: LegalArticle;
  } | null>(null);

  const handleAddPersonalNote = (input: {
    articleId: string;
    pcode?: string;
    lawName: string;
    articleNumber: string;
    articleTitle: string;
    selectedText: string;
    noteContent: string;
    colorTag: NoteColorTag;
  }) => {
    setPersonalNotes((prev) => {
      const next = createPersonalStatuteNote(prev, input);
      savePersonalNotesToStorage(next);
      return next;
    });
  };

  const handleUpdatePersonalNote = (
    noteId: string,
    updates: Partial<Pick<PersonalStatuteNote, 'selectedText' | 'noteContent' | 'colorTag'>>
  ) => {
    setPersonalNotes((prev) => {
      const next = updatePersonalStatuteNote(prev, noteId, updates);
      savePersonalNotesToStorage(next);
      return next;
    });
  };

  const handleDeletePersonalNote = (noteId: string) => {
    setPersonalNotes((prev) => {
      const next = deletePersonalStatuteNote(prev, noteId);
      savePersonalNotesToStorage(next);
      return next;
    });
  };

  // Inline term expanded on Portal search results
  const [portalInlineTerm, setPortalInlineTerm] = useState<{
    articleId: string;
    term: LegalTerm;
  } | null>(null);

  // Load the 11,805 R.O.C. law index on mount, and pre-load Civil Code (B0000001) in background
  useEffect(() => {
    let mounted = true;
    setIsIndexLoading(true);
    fetchRocLawIndex()
      .then((list) => {
        if (mounted) setNationalLawIndex(list);
      })
      .finally(() => {
        if (mounted) setIsIndexLoading(false);
      });

    // Pre-fetch Civil Code (B0000001) so clicking 民法 is instant
    fetchFullRocLawDocument('B0000001', LEGAL_ARTICLES, LEGAL_TERMS)
      .then((doc) => {
        if (mounted) {
          setLoadedLawDocs((prev) => ({ ...prev, B0000001: doc }));
        }
      })
      .catch(() => {
        // Ignore background prefetch error
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Combined articles pool (curated + any loaded full laws)
  const allCombinedArticles = useMemo(() => {
    const byId = new Map<string, LegalArticle>();
    for (const art of LEGAL_ARTICLES) {
      byId.set(art.id, art);
    }
    for (const doc of Object.values(loadedLawDocs)) {
      for (const art of doc.articles) {
        if (!byId.has(art.id)) {
          byId.set(art.id, art);
        }
      }
    }
    return Array.from(byId.values());
  }, [loadedLawDocs]);

  // Open a full R.O.C. Law in a Workspace Tab (Matches Image 1 & Image 2)
  const handleOpenLawByPCode = async (
    pcode: string,
    targetArticleNumber?: string,
    openModalDirectly?: boolean
  ) => {
    setLawLoadError(null);
    let doc = loadedLawDocs[pcode];

    if (!doc) {
      setLoadingLawPCode(pcode);
      try {
        doc = await fetchFullRocLawDocument(pcode, LEGAL_ARTICLES, LEGAL_TERMS);
        setLoadedLawDocs((prev) => ({ ...prev, [pcode]: doc }));
      } catch (err) {
        setLawLoadError(
          err instanceof Error ? err.message : `無法載入法規 ${pcode}`
        );
        setLoadingLawPCode(null);
        return;
      }
      setLoadingLawPCode(null);
    }

    const tabId = `tab-law-${pcode}`;
    setTabs((prev) => {
      if (prev.some((t) => t.id === tabId)) return prev;
      return [
        ...prev,
        {
          id: tabId,
          title: doc.lawName,
          type: 'law',
          lawPCode: pcode,
        },
      ];
    });
    setActiveTabId(tabId);
    setMobileSidebarOpen(false);

    if (targetArticleNumber) {
      const matchedArt = doc.articles.find(
        (a) =>
          a.articleNumber === targetArticleNumber ||
          a.articleNumber.startsWith(`${targetArticleNumber}（`)
      );
      if (matchedArt) {
        if (openModalDirectly) {
          setModalArticleState({
            article: matchedArt,
            lawArticles: doc.articles,
            initialTab: 'knowledge',
          });
        } else {
          setTimeout(() => {
            const el = document.getElementById(`law-article-${matchedArt.id}`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }
      }
    }
  };

  // Open an article in its own dedicated workspace tab
  const handleOpenArticleInNewTab = (article: LegalArticle) => {
    const tabId = `tab-art-${article.id}`;
    const tabTitle = `${article.specificLawTitle} ${article.articleNumber.replace(/（.*）/, '')}`;
    setTabs((prev) => {
      if (prev.some((t) => t.id === tabId)) return prev;
      return [
        ...prev,
        {
          id: tabId,
          title: tabTitle,
          type: 'article',
          articleId: article.id,
          lawPCode: article.pcode,
        },
      ];
    });
    setActiveTabId(tabId);
    setModalArticleState(null);
  };

  const handleCloseTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabId === 'tab-portal') return;
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== tabId);
      if (activeTabId === tabId) {
        setActiveTabId(next[next.length - 1]?.id || 'tab-portal');
      }
      return next;
    });
  };

  const handleQuickChipClick = (chip: QuickChip) => {
    if (chip.type === 'law' && chip.pcode) {
      handleOpenLawByPCode(chip.pcode);
      return;
    }
    if (chip.type === 'article' && chip.pcode && chip.articleNumber) {
      handleOpenLawByPCode(chip.pcode, chip.articleNumber, true);
      return;
    }
    if (chip.queryText) {
      setHeroSearchQuery(chip.queryText);
      setActiveTabId('tab-portal');
      setTimeout(() => {
        const el = document.getElementById('portal-search-results');
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  };

  // Filtered articles & terms for Portal search
  const filteredPortalArticles = useMemo(() => {
    return filterLegalArticles(
      allCombinedArticles,
      LEGAL_TERMS,
      heroSearchQuery,
      selectedCategory
    );
  }, [allCombinedArticles, heroSearchQuery, selectedCategory]);

  const filteredPortalTerms = useMemo(() => {
    return filterLegalTerms(LEGAL_TERMS, heroSearchQuery, selectedCategory);
  }, [heroSearchQuery, selectedCategory]);

  // Filtered 11,805 national laws when user searches in the Official Source / Catalog box
  const filteredNationalLaws = useMemo(() => {
    const q = (nationalCatalogFilter || heroSearchQuery).trim().toLowerCase();
    if (!q) return nationalLawIndex.slice(0, 12);
    return nationalLawIndex
      .filter(
        (entry) =>
          entry.name.toLowerCase().includes(q) ||
          entry.PCode.toLowerCase().includes(q)
      )
      .slice(0, 24);
  }, [nationalLawIndex, nationalCatalogFilter, heroSearchQuery]);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-[#1A1D24] flex flex-col md:flex-row font-sans antialiased">
      {/* Mobile Sidebar Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Left Dark Sidebar (Matches #0F131A sidebar in all 4 screenshots, with 法脈 LEXGRAPH 🇹🇼) */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen bg-[#0F131A] text-[#D8DEE9] flex flex-col border-r border-[#1E2430] transition-all duration-200 shrink-0 ${
          mobileSidebarOpen ? 'translate-x-0 w-60' : '-translate-x-full md:translate-x-0'
        } ${sidebarCollapsed ? 'md:w-0 md:overflow-hidden md:border-r-0' : 'md:w-60'}`}
      >
        {/* Brand Header */}
        <div className="px-4 pt-5 pb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setActiveTabId('tab-portal');
              setMobileSidebarOpen(false);
            }}
            className="flex items-center gap-2.5 text-left cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-linear-to-br from-[#D89B48] to-[#9A6524] flex items-center justify-center text-white shadow-xs">
              <Scale className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-black tracking-wider text-sm text-white group-hover:text-[#E5B168] transition-colors">
                法脈 LEXGRAPH
              </span>
              <span className="text-sm leading-none" title="中華民國全國法規">
                🇹🇼
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden text-[#8A94A6] hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sidebar Quick Search Input */}
        <div className="px-3 pb-4">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#6C7689] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && sidebarSearch.trim()) {
                  const q = sidebarSearch.trim();
                  const exactLaw = ROC_MAJOR_LAWS_CATALOG.find(
                    (l) => l.name === q || l.shortName === q
                  );
                  if (exactLaw) {
                    handleOpenLawByPCode(exactLaw.pcode);
                  } else {
                    setHeroSearchQuery(q);
                    setActiveTabId('tab-portal');
                  }
                  setMobileSidebarOpen(false);
                }
              }}
              placeholder="快速搜尋"
              className="w-full bg-[#171C26] border border-[#262E3D] focus:border-[#C68A3E] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-[#6C7689] focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 space-y-5 text-xs">
          <div>
            <div className="px-2 pb-2 text-[11px] font-semibold text-[#6C7689] tracking-wider">
              快速搜尋
            </div>
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTabId('tab-portal');
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeTab.type === 'portal' || activeTab.type === 'law'
                    ? 'bg-[#1C222E] text-white border border-[#2A3344]'
                    : 'text-[#A3ADC2] hover:bg-[#171C26] hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4 text-[#C68A3E]" />
                <span>全國法規</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenLawByPCode('B0000001')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeTabId === 'tab-law-B0000001'
                    ? 'bg-[#1C222E] text-white border border-[#2A3344]'
                    : 'text-[#A3ADC2] hover:bg-[#171C26] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Search className="w-4 h-4 text-[#8A94A6]" />
                  <span>民法全典檢索</span>
                </div>
                <span className="px-1.5 py-0.5 rounded bg-[#1E2636] text-[#9BA6B8] text-[10px] font-mono">
                  FREE
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenLawByPCode('J0080001')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeTabId === 'tab-law-J0080001'
                    ? 'bg-[#1C222E] text-white border border-[#2A3344]'
                    : 'text-[#A3ADC2] hover:bg-[#171C26] hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4 text-[#8A94A6]" />
                <span>公司法規查詢</span>
              </button>
            </nav>
          </div>

          <div>
            <div className="px-2 pb-2 text-[11px] font-semibold text-[#6C7689] tracking-wider">
              專業知識與沿革
            </div>
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  const tabId = 'tab-dictionary';
                  setTabs((prev) =>
                    prev.some((t) => t.id === tabId)
                      ? prev
                      : [...prev, { id: tabId, title: '白話法律字典', type: 'dictionary' }]
                  );
                  setActiveTabId(tabId);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeTab.type === 'dictionary'
                    ? 'bg-[#1C222E] text-white border border-[#2A3344]'
                    : 'text-[#A3ADC2] hover:bg-[#171C26] hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4 text-[#C68A3E]" />
                <span>白話法律字典</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const tabId = 'tab-amendments';
                  setTabs((prev) =>
                    prev.some((t) => t.id === tabId)
                      ? prev
                      : [...prev, { id: tabId, title: '歷年修法沿革', type: 'amendments' }]
                  );
                  setActiveTabId(tabId);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeTab.type === 'amendments'
                    ? 'bg-[#1C222E] text-white border border-[#2A3344]'
                    : 'text-[#A3ADC2] hover:bg-[#171C26] hover:text-white'
                }`}
              >
                <History className="w-4 h-4 text-[#8A94A6]" />
                <span>歷年修法沿革庫</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenLawByPCode('C0000001')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeTabId === 'tab-law-C0000001'
                    ? 'bg-[#1C222E] text-white border border-[#2A3344]'
                    : 'text-[#A3ADC2] hover:bg-[#171C26] hover:text-white'
                }`}
              >
                <GitBranch className="w-4 h-4 text-[#8A94A6]" />
                <span>中華民國刑法圖譜</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Bottom Sidebar Footer */}
        <div className="p-3 border-t border-[#1E2430] space-y-2.5">
          <div className="px-2 text-[11px] text-[#6C7689] flex items-center justify-between">
            <span>法典 · 字典 · 圖譜 · 沿革</span>
            <span className="text-[#C68A3E] font-mono">
              {nationalLawIndex.length > 0 ? `${nationalLawIndex.length.toLocaleString()} 部` : '11,805 部'}
            </span>
          </div>
          <a
            href="https://law.moj.gov.tw/"
            target="_blank"
            rel="noreferrer"
            className="w-full py-2 px-3 rounded-lg border border-[#6E5634] bg-[#1A1712] hover:bg-[#252017] text-[#E5B168] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>全國法規資料庫同步</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Workspace Tab Bar (Matches [ « ] [ 法脈 LexGraph × ] [ 民法 × ] [ + 研究分頁 ] in all 4 screenshots) */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-[#ECE7DF] px-3 sm:px-6 h-13 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg border border-[#E5DFD3] text-[#4A453E]"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Desktop Sidebar Collapse Toggle `«` */}
            <button
              type="button"
              onClick={() => setSidebarCollapsed((c) => !c)}
              title={sidebarCollapsed ? '展開側邊欄' : '收合側邊欄'}
              className="hidden md:inline-flex items-center justify-center w-7 h-7 rounded-full border border-[#E5DFD3] bg-[#FAF8F5] hover:bg-[#F2ECE1] text-[#6E6559] transition-colors cursor-pointer shrink-0"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronLeft className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Workspace Tabs */}
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              return (
                <div
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                    isActive
                      ? 'bg-[#EFE6D5] border-[#DFCFAF] text-[#2D261C] shadow-2xs'
                      : 'bg-[#FAF8F5] border-[#E8E2D5] text-[#6E6559] hover:bg-[#F3EFE6]'
                  }`}
                >
                  <span className="truncate max-w-[140px]">{tab.title}</span>
                  {tab.id !== 'tab-portal' && (
                    <button
                      type="button"
                      onClick={(e) => handleCloseTab(tab.id, e)}
                      className="text-[#8A8175] hover:text-[#1A1D24] p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}

            {/* `+ 研究分頁` Button */}
            <button
              type="button"
              onClick={() => setActiveTabId('tab-portal')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-dashed border-[#D8CFC0] hover:border-[#C68A3E] text-xs text-[#8A8175] hover:text-[#4A453E] transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>研究分頁</span>
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {loadingLawPCode && (
              <span className="inline-flex items-center gap-1.5 text-xs text-[#9A6524] bg-[#FDF6EA] px-2.5 py-1 rounded-full border border-[#E5C697]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                載入法典中...
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setActiveTabId('tab-portal');
                setTimeout(() => {
                  const el = document.getElementById('portal-notes-widget-anchor');
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 60);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5C697] bg-[#FDF6EA] hover:bg-[#F8EAD0] text-xs font-bold text-[#9A6524] transition-colors cursor-pointer"
            >
              <BookMarked className="w-3.5 h-3.5 text-[#C68A3E]" />
              <span>個人法條筆記 ({personalNotes.length})</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenLawByPCode('B0000001')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1F242D] hover:bg-[#2E3542] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <span>民法全典</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const tabId = 'tab-dictionary';
                setTabs((prev) =>
                  prev.some((t) => t.id === tabId)
                    ? prev
                    : [...prev, { id: tabId, title: '白話法律字典', type: 'dictionary' }]
                );
                setActiveTabId(tabId);
              }}
              className="px-3 py-1.5 rounded-lg border border-[#E2DACB] bg-white hover:bg-[#FAF8F5] text-xs font-bold text-[#2D3139] transition-colors cursor-pointer"
            >
              白話字典
            </button>
          </div>
        </header>

        {/* Error Banner if a law failed to fetch */}
        {lawLoadError && (
          <div className="mx-6 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800 flex items-center justify-between">
            <span>{lawLoadError}</span>
            <button
              type="button"
              onClick={() => setLawLoadError(null)}
              className="font-bold hover:underline"
            >
              關閉
            </button>
          </div>
        )}

        {/* VIEW 1: Full Law Code Reader View (Matches Image 2 & Image 1 when a Law Tab is active) */}
        {activeTab.type === 'law' && activeTab.lawPCode && loadedLawDocs[activeTab.lawPCode] && (
          <LawCodeReaderView
            doc={loadedLawDocs[activeTab.lawPCode]}
            allArticles={allCombinedArticles}
            allTerms={LEGAL_TERMS}
            personalNotes={personalNotes}
            onAddPersonalNote={handleAddPersonalNote}
            onUpdatePersonalNote={handleUpdatePersonalNote}
            onDeletePersonalNote={handleDeletePersonalNote}
            onOpenArticleModal={(article, initialTab = 'knowledge') =>
              setModalArticleState({
                article,
                lawArticles: loadedLawDocs[activeTab.lawPCode!]?.articles || allCombinedArticles,
                initialTab,
              })
            }
            onOpenArticleInNewTab={handleOpenArticleInNewTab}
            onSelectTermModal={(term) => setActiveTermModal(term)}
            onBackToPortal={() => setActiveTabId('tab-portal')}
          />
        )}

        {/* VIEW 2: Single Article Research Tab */}
        {activeTab.type === 'article' && activeTab.articleId && (
          <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-6">
            {(() => {
              const art =
                allCombinedArticles.find((a) => a.id === activeTab.articleId) ||
                LEGAL_ARTICLES[0];
              const lawPool =
                (art.pcode && loadedLawDocs[art.pcode]?.articles) || allCombinedArticles;
              return (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 rounded-2xl border border-[#E5DFD3] bg-white p-6 space-y-5 shadow-2xs">
                    <div className="flex items-center justify-between text-xs text-[#8A8175]">
                      <span>
                        {art.specificLawTitle} › {art.partTitle ? `${art.partTitle} › ` : ''}
                        {art.chapter}
                      </span>
                      {art.pcode && (
                        <button
                          type="button"
                          onClick={() => handleOpenLawByPCode(art.pcode!, art.articleNumber)}
                          className="text-[#C68A3E] font-bold hover:underline cursor-pointer"
                        >
                          查看《{art.specificLawTitle}》完整法典 →
                        </button>
                      )}
                    </div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-black text-[#1A1D24]">
                        {art.specificLawTitle} {art.articleNumber}
                      </h1>
                      <p className="text-sm text-[#8A8175] mt-1">{art.title}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#ECE7DF] text-base leading-[1.95] whitespace-pre-line">
                      {art.currentText}
                    </div>
                    <div className="border-l-4 border-[#C68A3E] bg-[#FBF8F2] rounded-r-xl p-4 space-y-1.5">
                      <div className="text-xs font-black text-[#1A1D24]">重點摘要</div>
                      <p className="text-sm text-[#3B352C] leading-relaxed">
                        {art.summaryCallout || art.plainExplanation}
                      </p>
                    </div>
                    {art.qaPrompt && (
                      <div className="space-y-2">
                        <h3 className="text-base font-black text-[#1A1D24]">
                          Q · {art.qaPrompt.replace(/^Q\s*[·.]\s*/, '')}
                        </h3>
                        <p className="text-sm text-[#2D3139] leading-relaxed">
                          {art.qaShortAnswer}
                        </p>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setModalArticleState({
                          article: art,
                          lawArticles: lawPool,
                          initialTab: 'history',
                        })
                      }
                      className="px-4 py-2 rounded-xl border border-[#E2DACB] bg-[#FAF8F5] hover:border-[#C68A3E] text-xs font-bold text-[#4A453E] cursor-pointer"
                    >
                      開啟完整修法沿革與新舊條文對照視窗
                    </button>
                  </div>

                  <div className="lg:col-span-5 rounded-2xl border border-[#E5DFD3] bg-white p-4 shadow-2xs">
                    <h3 className="text-xs font-bold text-[#4A453E] mb-2 flex items-center gap-1.5">
                      <Network className="w-4 h-4 text-[#C68A3E]" />
                      條文關聯與名詞圖譜
                    </h3>
                    <KnowledgeGraph
                      selectedArticle={art}
                      allArticles={allCombinedArticles}
                      allTerms={LEGAL_TERMS}
                      onSelectArticle={(target) =>
                        setModalArticleState({
                          article: target,
                          lawArticles: lawPool,
                          initialTab: 'knowledge',
                        })
                      }
                      onSelectTerm={(term) => setActiveTermModal(term)}
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* VIEW 3: Dedicated Plain-Language Legal Dictionary Tab */}
        {activeTab.type === 'dictionary' && (
          <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#ECE7DF] pb-5">
              <div>
                <div className="text-xs font-bold text-[#C68A3E] mb-1">
                  ◆ 法律白話文詞典 · 定義與修法脈絡
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#1A1D24]">
                  中華民國法律專有名詞白話字典
                </h1>
                <p className="text-xs sm:text-sm text-[#6E6559] mt-1">
                  收錄各法典核心專有名詞之「這詞定義是什麼（白話文）」、「幾年改了」、「修改日期」、「修改了什麼」與「為何改了」
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {LEGAL_TERMS.map((term) => (
                <div
                  key={term.id}
                  onClick={() => setActiveTermModal(term)}
                  className="rounded-2xl border border-[#EAE4D8] bg-white hover:border-[#C68A3E] p-5 transition-all cursor-pointer shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E5DFD3] text-[11px] font-bold text-[#9A6524]">
                      {term.category}
                    </span>
                    <span className="text-xs text-[#8A8175] font-mono">
                      {term.englishName}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-[#1A1D24] flex items-center gap-1.5">
                    <span>{term.name}</span>
                    <span className="text-xs text-[#C68A3E]">◆</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-[#2D3139] leading-relaxed">
                    <strong className="text-[#9A6524]">白話定義：</strong>
                    {term.plainDefinition}
                  </p>
                  <p className="text-xs text-[#6E6559] leading-relaxed">
                    <strong>幾年改了 · 為何改了：</strong>
                    {term.amendmentHistorySummary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 4: Dedicated Amendment History Tab */}
        {activeTab.type === 'amendments' && (
          <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 py-8 space-y-6">
            <div className="border-b border-[#ECE7DF] pb-5">
              <div className="text-xs font-bold text-[#C68A3E] mb-1">
                ◆ 歷年修法沿革 · 新舊條文逐字比對
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#1A1D24]">
                重要法條歷年修正公布沿革與立法理由
              </h1>
              <p className="text-xs sm:text-sm text-[#6E6559] mt-1">
                點擊任一條文可展開新舊條文逐字增刪比對與關聯圖譜
              </p>
            </div>

            <div className="space-y-4">
              {LEGAL_ARTICLES.map((art) => (
                <div
                  key={art.id}
                  onClick={() =>
                    setModalArticleState({
                      article: art,
                      lawArticles: allCombinedArticles,
                      initialTab: 'history',
                    })
                  }
                  className="rounded-2xl border border-[#EAE4D8] bg-white hover:border-[#C68A3E] p-5 transition-all cursor-pointer shadow-2xs space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-[#C68A3E] text-white text-xs font-bold">
                        {art.lastAmendedYear}
                      </span>
                      <h3 className="text-base font-black text-[#1A1D24]">
                        {art.specificLawTitle} {art.articleNumber}（{art.title}）
                      </h3>
                    </div>
                    <span className="text-xs text-[#9A6524] font-bold">
                      點擊查看新舊條文對照 →
                    </span>
                  </div>
                  {art.amendments[0] && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#ECE7DF]">
                        <strong className="text-[#9A6524] block mb-1">
                          修改了什麼（{art.amendments[0].date}）：
                        </strong>
                        {art.amendments[0].whatChangedPlain}
                      </div>
                      <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#ECE7DF]">
                        <strong className="text-[#9A6524] block mb-1">為何改了（立法理由）：</strong>
                        {art.amendments[0].whyChangedPlain}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 5: Home Portal View (Exact Match to Image 4 `image_5b149bb2.png`) */}
        {activeTab.type === 'portal' && (
          <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-8 pt-10 sm:pt-14 pb-20">
            {/* Hero Section (Matches Image 4) */}
            <section className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#9A6524] mb-3">
                <span className="w-2 h-2 rounded-full bg-[#C68A3E]" />
                <span>讓每一條中華民國法規，為你所用</span>
              </div>

              <h1 className="text-3xl sm:text-[40px] font-black tracking-tight text-[#1A1D24] leading-tight">
                <span>法脈</span>
                <span className="mx-3 font-light text-[#D5CEC2]">｜</span>
                <span className="text-[#C68A3E]">讓法律，更簡單</span>
              </h1>

              <p className="text-xs sm:text-sm text-[#7A7267] mt-3 tracking-wide">
                搜尋、理解、運用、創造。讓每一條規則，為你所用。
              </p>

              {/* Rounded Search Bar with Dark Square Search Button (Matches Image 4) */}
              <div className="mt-7 relative max-w-xl mx-auto">
                <input
                  type="text"
                  value={heroSearchQuery}
                  onChange={(e) => setHeroSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && heroSearchQuery.trim()) {
                      const q = heroSearchQuery.trim();
                      const matchedMajor = ROC_MAJOR_LAWS_CATALOG.find(
                        (l) => l.name === q || l.shortName === q
                      );
                      if (matchedMajor) {
                        handleOpenLawByPCode(matchedMajor.pcode);
                      }
                    }
                  }}
                  placeholder="輸入「民法 184」、「釋字 748」或「公司法」⋯"
                  className="w-full rounded-2xl border border-[#E5DFD3] bg-white pl-5 pr-14 py-3.5 text-sm text-[#1A1D24] placeholder:text-[#A69F93] shadow-xs focus:outline-none focus:border-[#C68A3E] transition-all"
                />
                {heroSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setHeroSearchQuery('')}
                    className="absolute right-12 top-1/2 -translate-y-1/2 text-[#9A9184] hover:text-[#1A1D24] p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const q = heroSearchQuery.trim();
                    const matchedMajor = ROC_MAJOR_LAWS_CATALOG.find(
                      (l) => l.name === q || l.shortName === q
                    );
                    if (matchedMajor) {
                      handleOpenLawByPCode(matchedMajor.pcode);
                    } else {
                      const el = document.getElementById('portal-search-results');
                      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  aria-label="執行搜尋"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-[#1F242D] hover:bg-[#2E3542] text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>

              {/* Two Rows of Quick Chips (Matches Image 4) */}
              <div className="mt-5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {HERO_QUICK_CHIPS_ROW_1.map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => handleQuickChipClick(chip)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#E6E0D4] bg-white hover:border-[#C68A3E] hover:bg-[#FDF9F1] text-xs text-[#4A453E] transition-all cursor-pointer shadow-2xs"
                    >
                      <Search className="w-3 h-3 text-[#B0A79A]" />
                      <span>{chip.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  {HERO_QUICK_CHIPS_ROW_2.map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => handleQuickChipClick(chip)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#E6E0D4] bg-white hover:border-[#C68A3E] hover:bg-[#FDF9F1] text-xs text-[#4A453E] transition-all cursor-pointer shadow-2xs"
                    >
                      <Search className="w-3 h-3 text-[#B0A79A]" />
                      <span>{chip.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* ◆ 中華民國法規入口 Strip (Matches Image 4) */}
            <section className="mt-12">
              <div className="flex items-center gap-2 text-xs font-bold text-[#2D3139] pb-3 border-b border-[#ECE7DF]">
                <span className="text-[#C68A3E]">◆</span>
                <span>中華民國法規入口</span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('全部法規')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === '全部法規'
                      ? 'bg-[#F5EFE4] border-[#DEC9A4] text-[#2D261C]'
                      : 'bg-white border-[#E6E0D4] text-[#4A453E] hover:border-[#C68A3E]'
                  }`}
                >
                  <span>🇹🇼</span>
                  <span>台灣</span>
                  <span className="font-mono text-[#8A8175]">
                    {nationalLawIndex.length > 0
                      ? nationalLawIndex.length.toLocaleString()
                      : '11,805'}
                  </span>
                </button>

                {LAW_CATEGORIES.filter((c) => c !== '全部法規').map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() =>
                      setSelectedCategory(selectedCategory === cat ? '全部法規' : cat)
                    }
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-medium transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[#F5EFE4] border-[#DEC9A4] text-[#2D261C] font-bold'
                        : 'bg-white border-[#E6E0D4] text-[#6E6559] hover:border-[#C68A3E]'
                    }`}
                  >
                    <span>{cat}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Bottom Two-Column Cards: Left = 官方資料源 (全國法規資料庫), Right = 熱門法規 (CURATED) (Exact Match to Image 4) */}
            <section className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: ◆ 官方資料源 · 站內同步 */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#6E6559]">
                  <span className="text-[#C68A3E]">◆</span>
                  <span>官方資料源 · 站內同步</span>
                </div>

                <div className="rounded-2xl border border-[#EAE4D8] bg-white p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-[#F2EFE9]">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-[#F5EFE4] border border-[#E5D5B5] text-[#9A6524] text-xs font-black flex items-center justify-center shrink-0">
                        規
                      </span>
                      <div>
                        <div className="text-sm font-black text-[#1A1D24]">全國法規資料庫</div>
                        <div className="text-[11px] font-mono text-[#9A9184]">law.moj.gov.tw</div>
                      </div>
                    </div>

                    <a
                      href="https://law.moj.gov.tw/"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#E5DFD3] bg-[#FAF8F5] hover:bg-[#F3EFE6] text-[11px] text-[#6E6559] font-medium transition-colors"
                    >
                      <span>官網</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <ul className="space-y-2.5 text-xs text-[#6E6559]">
                    <li className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleOpenLawByPCode('B0000001')}
                        className="flex items-center gap-2 hover:text-[#C68A3E] transition-colors cursor-pointer"
                      >
                        <span className="text-[#C68A3E]">•</span>
                        <span>全國法規（11,805 部完整法典即時載入）</span>
                      </button>
                      <ExternalLink className="w-3 h-3 text-[#B0A79A]" />
                    </li>
                    <li className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setHeroSearchQuery('釋字第 748 號');
                        }}
                        className="flex items-center gap-2 hover:text-[#C68A3E] transition-colors cursor-pointer"
                      >
                        <span className="text-[#C68A3E]">•</span>
                        <span>司法院大法官釋字與憲法法庭判決</span>
                      </button>
                      <ExternalLink className="w-3 h-3 text-[#B0A79A]" />
                    </li>
                  </ul>

                  {/* Search Input for all 11,805 R.O.C. Laws */}
                  <div className="pt-3 border-t border-[#F2EFE9] space-y-2.5">
                    <div className="text-[11px] font-bold text-[#8A8175] flex items-center justify-between">
                      <span>檢索全國 11,805 部法規名稱或 PCode</span>
                      {isIndexLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                    </div>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-[#9A9184] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={nationalCatalogFilter}
                        onChange={(e) => setNationalCatalogFilter(e.target.value)}
                        placeholder="輸入任何法規名稱（如：建築法、專利法、稅捐）..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#E5DFD3] bg-[#FAF8F5] text-xs text-[#1A1D24] placeholder:text-[#9A9184] focus:outline-none focus:border-[#C68A3E]"
                      />
                    </div>

                    {nationalCatalogFilter.trim() && (
                      <div className="max-h-48 overflow-y-auto divide-y divide-[#F2EFE9] border border-[#ECE7DF] rounded-xl bg-[#FAF8F5] px-2">
                        {filteredNationalLaws.map((entry) => (
                          <button
                            key={entry.PCode}
                            type="button"
                            onClick={() => handleOpenLawByPCode(entry.PCode)}
                            className="w-full py-2 px-2 text-left text-xs hover:bg-white rounded flex items-center justify-between gap-2 cursor-pointer"
                          >
                            <span className="font-bold text-[#1A1D24] truncate">
                              {entry.name}
                            </span>
                            <span className="font-mono text-[10px] text-[#8A8175] shrink-0">
                              {entry.PCode}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: ◆ 熱門法規 · 條文直達 (Exact Match to Image 4) */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#6E6559]">
                  <span className="text-[#C68A3E]">◆</span>
                  <span>熱門法規 · 條文直達</span>
                </div>

                <div className="rounded-2xl border border-[#EAE4D8] bg-white p-5 shadow-2xs">
                  <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#F2EFE9]">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#2D3139]">
                      <span className="text-[#C68A3E]">◆</span>
                      <span>熱門法規</span>
                    </div>
                    <span className="text-[10px] font-mono tracking-widest text-[#9A9184] uppercase">
                      CURATED
                    </span>
                  </div>

                  <div className="divide-y divide-[#F5F2EC]">
                    {ROC_MAJOR_LAWS_CATALOG.slice(0, 12).map((law) => (
                      <button
                        key={law.pcode}
                        type="button"
                        onClick={() => handleOpenLawByPCode(law.pcode)}
                        className="w-full py-3 px-2 flex items-center justify-between gap-3 hover:bg-[#FAF8F5] rounded-xl transition-colors text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 rounded-md bg-[#F5EFE4] border border-[#E5D5B5] text-[#9A6524] text-[11px] font-black flex items-center justify-center shrink-0">
                            規
                          </span>
                          <span className="text-sm font-bold text-[#1A1D24] group-hover:text-[#C68A3E] transition-colors truncate">
                            {law.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-[#9A9184] hidden sm:inline">
                            {law.articleCountLabel}
                          </span>
                          <ChevronRight className="w-4 h-4 text-[#C8C2B8] group-hover:text-[#C68A3E] transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Instant Search Results, Curated Statute Reading Area & Personal Statute Note Widget */}
            <section id="portal-search-results" className="mt-12 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ECE7DF] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[#C68A3E] text-xs">◆</span>
                  <h2 className="text-sm font-black text-[#1A1D24]">
                    {heroSearchQuery
                      ? `「${heroSearchQuery}」條文與白話字典檢索結果（${filteredPortalArticles.length} 條）`
                      : '條文閱讀區 · 精選常用法條與個人法條筆記'}
                  </h2>
                </div>
                <span className="text-xs text-[#8A8175]">
                  反白選取條文文字即可新增 <strong className="text-[#9A6524]">個人法條筆記</strong>，或點擊 <strong className="text-[#9A6524]">虛線名詞 ◆</strong> 展開白話定義
                </span>
              </div>

              {/* Matching Dictionary Terms when searching */}
              {heroSearchQuery.trim() && filteredPortalTerms.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 py-1">
                  <span className="text-xs text-[#8A8175]">相關法律名詞字典：</span>
                  {filteredPortalTerms.map((term) => (
                    <button
                      key={term.id}
                      type="button"
                      onClick={() => setActiveTermModal(term)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FDF6EA] border border-[#E5C697] text-xs font-bold text-[#9A6524] cursor-pointer"
                    >
                      <span>{term.name}</span>
                      <span>◆</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left 7 Cols: Statute Reading Stream */}
                <div className="lg:col-span-7 divide-y divide-[#EFECE6] rounded-2xl border border-[#EAE4D8] bg-white px-4 sm:px-6 py-2 shadow-2xs">
                  {filteredPortalArticles.slice(0, 15).map((article) => {
                    const openedTerm =
                      portalInlineTerm?.articleId === article.id ? portalInlineTerm.term : null;
                    const articleSavedNotes = personalNotes.filter(
                      (n) => n.articleId === article.id
                    );
                    const lines = article.currentText
                      .split(/\n+/)
                      .map((l) => l.trim())
                      .filter(Boolean);

                    return (
                      <article
                        key={article.id}
                        onClick={() => {
                          const sel = window.getSelection()?.toString().trim() || '';
                          if (sel.length >= 2) return;
                          setModalArticleState({
                            article,
                            lawArticles:
                              (article.pcode && loadedLawDocs[article.pcode]?.articles) ||
                              allCombinedArticles,
                            initialTab: 'knowledge',
                          });
                        }}
                        className="py-5 hover:bg-[#FAF8F4] px-3 -mx-3 rounded-xl transition-colors cursor-pointer group"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <span className="px-2 py-0.5 rounded bg-[#F5EFE4] text-[#9A6524] text-xs font-bold whitespace-nowrap shrink-0">
                              {article.specificLawTitle}
                            </span>
                            <span className="text-base font-black text-[#1A1D24] group-hover:text-[#B87D32] whitespace-nowrap shrink-0">
                              {article.articleNumber}
                            </span>
                            <span className="text-xs text-[#8A8175] font-medium">
                              {article.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const sel = window.getSelection()?.toString().trim() || '';
                                setPortalTargetNoteArticle(article);
                                setPortalPendingSelection({
                                  text: sel || article.currentText.split('\n')[0] || article.title,
                                  article,
                                });
                                const el = document.getElementById('portal-notes-widget-anchor');
                                el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#E5C697] bg-[#FDF6EA] hover:border-[#C68A3E] text-xs font-bold text-[#9A6524] cursor-pointer"
                            >
                              <BookMarked className="w-3 h-3 text-[#C68A3E]" />
                              <span>
                                新增筆記{articleSavedNotes.length > 0 ? ` (${articleSavedNotes.length})` : ''}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setModalArticleState({
                                  article,
                                  lawArticles:
                                    (article.pcode && loadedLawDocs[article.pcode]?.articles) ||
                                    allCombinedArticles,
                                  initialTab: 'knowledge',
                                });
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#E2DACB] bg-white hover:border-[#C68A3E] text-xs font-medium text-[#6E6559] hover:text-[#9A6524] cursor-pointer"
                            >
                              <GitBranch className="w-3.5 h-3.5 text-[#C68A3E]" />
                              <span>圖解條文</span>
                            </button>
                          </div>
                        </div>

                        <div
                          className="mt-2.5 space-y-2"
                          onMouseUp={(e) => {
                            e.stopPropagation();
                            const sel = window.getSelection()?.toString().trim() || '';
                            if (sel.length >= 2) {
                              setPortalTargetNoteArticle(article);
                              setPortalPendingSelection({ text: sel, article });
                            }
                          }}
                        >
                          {lines.map((line, lIdx) => {
                            const cleaned = lines.length > 1 ? line.replace(/^\d+\.\s*/, '') : line;
                            const segs = highlightLegalTermsInText(cleaned, LEGAL_TERMS);
                            return (
                              <div
                                key={lIdx}
                                className="flex items-baseline text-sm sm:text-[15px] text-[#2D3139] leading-[1.85]"
                              >
                                {lines.length > 1 && (
                                  <span className="text-xs font-mono text-[#9A9184] w-5 shrink-0">
                                    {lIdx + 1}.
                                  </span>
                                )}
                                <p className="flex-1">
                                  {segs.map((seg, sIdx) => {
                                    if (!seg.term) {
                                      return <React.Fragment key={sIdx}>{seg.text}</React.Fragment>;
                                    }
                                    const t = seg.term;
                                    return (
                                      <button
                                        key={sIdx}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setPortalInlineTerm((prev) =>
                                            prev?.articleId === article.id && prev?.term.id === t.id
                                              ? null
                                              : { articleId: article.id, term: t }
                                          );
                                        }}
                                        className="inline-flex items-center gap-0.5 mx-0.5 border-b border-dotted border-[#8C7A5B] hover:border-[#C68A3E] font-medium text-[#1A1D24] hover:text-[#9A6524] cursor-pointer"
                                      >
                                        <span>{seg.text}</span>
                                        <span className="text-[10px] text-[#C68A3E]">◆</span>
                                      </button>
                                    );
                                  })}
                                </p>
                              </div>
                            );
                          })}
                        </div>

                        {/* Saved Personal Notes for this Article */}
                        {articleSavedNotes.length > 0 && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="mt-3 space-y-2"
                          >
                            {articleSavedNotes.map((note) => (
                              <div
                                key={note.id}
                                className="rounded-xl border border-[#E5C697] border-l-4 border-l-[#C68A3E] bg-[#FDF9F1] px-3 py-2 flex items-start justify-between gap-2 text-xs"
                              >
                                <div className="space-y-0.5 flex-1">
                                  <div className="font-bold text-[#9A6524] flex items-center gap-1.5 flex-wrap">
                                    <BookMarked className="w-3 h-3" />
                                    <span>個人法條筆記</span>
                                    {note.selectedText && (
                                      <span className="font-normal text-[#6E5634] bg-white/80 px-1.5 py-0.2 rounded border border-[#EFE3CE]">
                                        「{note.selectedText}」
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[#1A1D24]">{note.noteContent}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePersonalNote(note.id)}
                                  className="p-1 text-[#8A8175] hover:text-rose-600 cursor-pointer"
                                  title="刪除此筆記"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {openedTerm && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="mt-3 rounded-xl border border-[#E5C697] bg-[#FDF9F1] p-3.5 text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-black text-[#1A1D24] text-sm">
                                <Sparkles className="w-3.5 h-3.5 text-[#C68A3E] inline mr-1" />
                                {openedTerm.name}（{openedTerm.category}）
                              </span>
                              <button
                                type="button"
                                onClick={() => setPortalInlineTerm(null)}
                                className="text-[#8A8175] hover:text-[#1A1D24] cursor-pointer"
                              >
                                收合 ✕
                              </button>
                            </div>
                            <p className="text-[#2D3139] leading-relaxed">
                              <strong className="text-[#9A6524]">這詞定義是什麼（白話文）：</strong>
                              {openedTerm.plainDefinition}
                            </p>
                            <p className="text-[#6E6559]">
                              <strong>幾年改了 · 為何改了：</strong>
                              {openedTerm.amendmentHistorySummary}
                            </p>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>

                {/* Right 5 Cols: Sticky Personal Statute Note Widget (個人法條筆記小工具) */}
                <div
                  id="portal-notes-widget-anchor"
                  className="lg:col-span-5 lg:sticky lg:top-16"
                >
                  <PersonalNotesWidget
                    notes={personalNotes}
                    currentArticle={portalTargetNoteArticle}
                    pendingSelection={portalPendingSelection}
                    onClearPendingSelection={() => setPortalPendingSelection(null)}
                    onAddNote={handleAddPersonalNote}
                    onUpdateNote={handleUpdatePersonalNote}
                    onDeleteNote={handleDeletePersonalNote}
                    onJumpToNoteArticle={(note) => {
                      const found = allCombinedArticles.find((a) => a.id === note.articleId);
                      if (found) {
                        setModalArticleState({
                          article: found,
                          lawArticles: allCombinedArticles,
                          initialTab: 'notes',
                        });
                      } else if (note.pcode) {
                        handleOpenLawByPCode(note.pcode, note.articleNumber);
                      }
                    }}
                  />
                </div>
              </div>
            </section>
          </main>
        )}

        {/* Global Footer with Clear AI-Assistance Disclaimer & Official Source Links */}
        <footer
          aria-label="AI 輔助免責聲明與官方資料源"
          data-testid="ai-disclaimer-footer"
          className="mt-auto border-t border-[#E6DFD3] bg-[#F6F3EC] px-4 sm:px-8 py-6 text-xs text-[#6E6559]"
        >
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-2.5 leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-[#C68A3E] shrink-0 mt-0.5" />
              <p>
                <strong className="text-[#1A1D24]">AI 輔助整理與免責聲明：</strong>
                本網站提供之法條白話文翻譯、重點摘要、實務問答（Q&amp;A）及關聯知識圖譜均包含 AI 輔助解析與自動化彙整，內容可能有誤或未能即時反映最新實務見解，僅供法學檢索與學習參考，不構成正式法律意見。如需確認最新有效法規原文或作為實務、訴訟依據，
                <strong className="text-[#9A6524]">建議直接查閱政府官方資料庫為準</strong>。
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <a
                href="https://law.moj.gov.tw/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#DCD3C2] bg-white hover:border-[#C68A3E] text-[#1A1D24] font-bold transition-colors"
              >
                <span>法務部全國法規資料庫</span>
                <ExternalLink className="w-3 h-3 text-[#C68A3E]" />
              </a>
              <a
                href="https://lis.ly.gov.tw/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#DCD3C2] bg-white hover:border-[#C68A3E] text-[#1A1D24] font-bold transition-colors"
              >
                <span>立法院法律系統</span>
                <ExternalLink className="w-3 h-3 text-[#C68A3E]" />
              </a>
            </div>
          </div>
        </footer>
      </div>

      {/* Slide-over / Modal Article Detail View (Matches Image 3 `image_58ca1456.png`) */}
      {modalArticleState && (
        <ArticleDetailModal
          article={modalArticleState.article}
          lawArticles={modalArticleState.lawArticles}
          allArticles={allCombinedArticles}
          allTerms={LEGAL_TERMS}
          personalNotes={personalNotes}
          onAddPersonalNote={handleAddPersonalNote}
          onUpdatePersonalNote={handleUpdatePersonalNote}
          onDeletePersonalNote={handleDeletePersonalNote}
          initialTab={modalArticleState.initialTab}
          onClose={() => setModalArticleState(null)}
          onSelectArticle={(nextArt) =>
            setModalArticleState((prev) =>
              prev ? { ...prev, article: nextArt } : null
            )
          }
          onOpenInNewTab={handleOpenArticleInNewTab}
          onSelectTermModal={(term) => setActiveTermModal(term)}
        />
      )}

      {/* Term Dictionary Modal */}
      <TermDictionaryModal
        term={activeTermModal}
        allArticles={allCombinedArticles}
        allTerms={LEGAL_TERMS}
        onClose={() => setActiveTermModal(null)}
        onSelectArticle={(art) => {
          setActiveTermModal(null);
          setModalArticleState({
            article: art,
            lawArticles: allCombinedArticles,
            initialTab: 'knowledge',
          });
        }}
        onSelectTerm={(t) => setActiveTermModal(t)}
      />
    </div>
  );
}
