import React, { useState } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  LegalArticle,
  LegalTerm,
  SubgraphResult,
} from '../types/legal';
import { KnowledgeGraph } from './KnowledgeGraph';

interface TermDictionaryViewProps {
  terms: LegalTerm[];
  articles: LegalArticle[];
  selectedTerm: LegalTerm;
  selectedArticle: LegalArticle;
  subgraph: SubgraphResult;
  depth: 1 | 2;
  onChangeDepth: (depth: 1 | 2) => void;
  onSelectTerm: (termId: string) => void;
  onSelectArticleAndJump: (articleId: string) => void;
}

export const TermDictionaryView: React.FC<TermDictionaryViewProps> = ({
  terms,
  articles,
  selectedTerm,
  selectedArticle,
  subgraph,
  depth,
  onChangeDepth,
  onSelectTerm,
  onSelectArticleAndJump,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('全部領域');
  const [expandedTermIds, setExpandedTermIds] = useState<Record<string, boolean>>({});

  const categories = [
    '全部領域',
    '通用法理',
    '民法',
    '刑法',
    '憲法與釋憲實務',
    '公司法與商事法',
    '行政程序與交通法規',
    '勞動基準法',
    '個人資料保護法',
  ];

  const filteredTerms = terms.filter((t) => {
    if (selectedCategory !== '全部領域' && t.category !== selectedCategory) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.englishName.toLowerCase().includes(q) ||
      t.plainDefinition.toLowerCase().includes(q) ||
      t.shortDefinition.toLowerCase().includes(q) ||
      t.detailedExplanation.toLowerCase().includes(q)
    );
  });

  const handleToggleTermCard = (termId: string) => {
    onSelectTerm(termId);
    setExpandedTermIds((prev) => ({
      ...prev,
      [termId]: !prev[termId],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Dictionary Header */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-stone-500">
              中華民國白話法律字典 · 共收錄 {terms.length} 項關鍵法律詞條與修法脈絡
            </div>
            <h1 className="text-2xl font-bold text-stone-900 mt-1">
              白話文法律名詞字典（按一下詞條即可顯示白話文定義與修法年份）
            </h1>
            <p className="text-sm text-stone-600 mt-1">
              點擊任一法律專有名詞，按一下即展開「這詞定義是什麼（白話文）」、「相關法規幾年改了、為何而改」以及右側關聯圖譜。
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <label htmlFor="term-dict-search" className="sr-only">
              搜尋法律名詞
            </label>
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="term-dict-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋詞條（如：善意第三人、視為、但書、不當得利）..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-stone-50 border border-stone-300 rounded-full text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#C68A3E]"
            />
          </div>
        </div>

        {/* Category Filter Buttons */}
        <div className="mt-4 pt-3.5 border-t border-stone-200 flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? 'bg-[#0F131A] text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Dual-Column Dictionary + Graph Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Legal Term Cards (Click-to-reveal plain definition) */}
        <div className="lg:col-span-6 space-y-3">
          {filteredTerms.map((term) => {
            const isSelected = term.id === selectedTerm.id;
            const isExpanded = Boolean(expandedTermIds[term.id]);
            return (
              <div
                key={term.id}
                className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-[#FDF9F3] border-[#C68A3E] ring-2 ring-[#C68A3E]/20'
                    : 'bg-white border-stone-200 hover:border-stone-400'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs text-stone-500">
                  <span className="font-semibold text-[#9A5B13]">{term.category}</span>
                  <span className="font-code">{term.englishName}</span>
                </div>

                <div className="flex items-center justify-between gap-3 mt-1">
                  <h2 className="text-lg font-bold text-stone-900">
                    ◆ {term.name}
                  </h2>

                  <button
                    type="button"
                    onClick={() => handleToggleTermCard(term.id)}
                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors inline-flex items-center gap-1 whitespace-nowrap shrink-0 ${
                      isExpanded
                        ? 'bg-[#C68A3E] text-white border-[#C68A3E]'
                        : 'bg-white text-[#9A5B13] border-[#C68A3E]/50 hover:bg-[#FDF9F3]'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{isExpanded ? '收合白話定義' : '按一下顯示定義與白話文'}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-stone-600 mt-1.5">
                  法學定義：{term.shortDefinition}
                </p>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-[#E9D8BE] space-y-2.5">
                    <div className="bg-white border border-[#E9D8BE] rounded-xl p-3">
                      <div className="text-xs font-bold text-[#9A5B13] mb-0.5">
                        這詞定義是什麼？（白話文秒懂）
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-stone-900 leading-relaxed">
                        {term.plainDefinition}
                      </p>
                    </div>

                    <p className="text-xs text-stone-700 leading-relaxed">
                      {term.detailedExplanation}
                    </p>

                    <div className="pt-2 border-t border-stone-200/70 text-xs text-stone-600 flex items-start gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#1E3A8A] shrink-0 mt-0.5" />
                      <span>{term.amendmentHistorySummary}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredTerms.length === 0 && (
            <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center">
              <p className="text-sm text-stone-600">
                找不到符合「{searchQuery}」的法律詞條，請嘗試其他關鍵字。
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Synchronized Concept Dictionary Card & Graph */}
        <div className="lg:col-span-6 lg:sticky lg:top-6">
          <KnowledgeGraph
            subgraph={subgraph}
            focalType="term"
            selectedTerm={selectedTerm}
            selectedArticle={selectedArticle}
            allTerms={terms}
            allArticles={articles}
            depth={depth}
            onChangeDepth={onChangeDepth}
            onSelectArticle={(art) => onSelectArticleAndJump(art.id)}
            onSelectTerm={(t) => onSelectTerm(t.id)}
          />
        </div>
      </div>
    </div>
  );
};
