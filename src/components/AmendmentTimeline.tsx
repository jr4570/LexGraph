import React, { useState } from 'react';
import {
  ArrowRight,
  Calendar,
  Clock,
  FileDiff,
  Search,
} from 'lucide-react';
import { LawCategory, LegalArticle } from '../types/legal';
import { computeAmendmentDiff } from '../utils/legalEngine';

interface AmendmentTimelineProps {
  articles: LegalArticle[];
  onSelectArticleAndJump: (articleId: string) => void;
}

export const AmendmentTimeline: React.FC<AmendmentTimelineProps> = ({
  articles,
  onSelectArticleAndJump,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<LawCategory>('全部法規');
  const [query, setQuery] = useState('');

  const allAmendmentItems = articles
    .filter((a) => selectedCategory === '全部法規' || a.lawName === selectedCategory)
    .flatMap((article) =>
      article.amendments.map((amd) => ({
        article,
        amendment: amd,
      }))
    )
    .filter(({ article, amendment }) => {
      if (!query.trim()) return true;
      const q = query.trim().toLowerCase();
      return (
        article.lawName.toLowerCase().includes(q) ||
        article.specificLawTitle.toLowerCase().includes(q) ||
        article.articleNumber.toLowerCase().includes(q) ||
        article.title.toLowerCase().includes(q) ||
        amendment.rocYear.toLowerCase().includes(q) ||
        amendment.date.toLowerCase().includes(q) ||
        amendment.whatChangedPlain.toLowerCase().includes(q) ||
        amendment.whyChangedPlain.toLowerCase().includes(q) ||
        amendment.reason.toLowerCase().includes(q)
      );
    });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="text-xs text-stone-500">
            中華民國歷年修法沿革總覽 · 共 {allAmendmentItems.length} 筆重大修法紀錄
          </div>
          <h1 className="text-2xl font-bold text-stone-900 mt-1">
            歷年修法查詢：幾年改了 · 修改日期 · 修改了什麼 · 為何改了
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            用白話文完整解析各法條歷年修改年份、公布日期、具體新增與刪去內容，以及背後修法原因。
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜尋民國年份（如 112 年）、修法原因或條號..."
            aria-label="搜尋歷年修法紀錄"
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-300 rounded-full text-stone-900 focus:outline-none focus:border-[#C68A3E]"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(
          [
            '全部法規',
            '民法',
            '刑法',
            '憲法與釋憲實務',
            '公司法與商事法',
            '行政程序與交通法規',
            '勞動基準法',
            '個人資料保護法',
            '民刑事訴訟法',
          ] as LawCategory[]
        ).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap shrink-0 ${
              selectedCategory === cat
                ? 'bg-[#0F131A] text-white'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Amendment Cards */}
      <div className="space-y-4">
        {allAmendmentItems.map(({ article, amendment }) => {
          const diffSegments = computeAmendmentDiff(
            amendment.previousText,
            amendment.updatedText
          );

          return (
            <div
              key={amendment.id}
              className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4 shadow-2xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-3.5">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                    <span className="font-bold text-[#9A5B13] inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      幾年改了：{amendment.rocYear}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-code flex items-center gap-1 text-stone-700">
                      <Clock className="w-3.5 h-3.5" />
                      修改日期：{amendment.date}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-stone-900 mt-1">
                    {article.specificLawTitle.replace('中華民國', '')} {article.articleNumber}：{article.title}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectArticleAndJump(article.id)}
                  className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#0F131A] rounded-full hover:bg-stone-800 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  查看完整條文與圖譜
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 白話文：修改了什麼 & 為何改了 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="bg-[#FDF9F3] border border-[#E9D8BE] rounded-xl p-4">
                  <div className="font-bold text-[#9A5B13] mb-1">
                    修改了什麼？（白話文修法重點）
                  </div>
                  <p className="text-stone-900 leading-relaxed whitespace-pre-line">
                    {amendment.whatChangedPlain}
                  </p>
                </div>
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
                  <div className="font-bold text-[#1E3A8A] mb-1">
                    為何改了？（白話文修法原因）
                  </div>
                  <p className="text-stone-800 leading-relaxed whitespace-pre-line">
                    {amendment.whyChangedPlain}
                  </p>
                </div>
              </div>

              {/* Inline Diff Block */}
              <div className="bg-stone-50/70 border border-stone-200 rounded-xl p-4">
                <div className="text-xs font-semibold text-stone-500 mb-2 flex items-center gap-1.5">
                  <FileDiff className="w-3.5 h-3.5 text-[#C68A3E]" />
                  新舊條文逐字添加／刪去對照：
                </div>
                <div className="text-sm font-editorial leading-relaxed whitespace-pre-line text-stone-800">
                  {diffSegments.map((seg, idx) => {
                    if (seg.type === 'added') {
                      return (
                        <span
                          key={idx}
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
                          key={idx}
                          className="bg-rose-50 text-rose-900 line-through decoration-rose-700 px-1 py-0.5 mx-0.5 rounded-xs"
                        >
                          <span className="text-[11px] font-sans font-bold text-rose-800 no-underline mr-0.5">
                            [-刪去]
                          </span>
                          {seg.text}
                        </span>
                      );
                    }
                    return <span key={idx}>{seg.text}</span>;
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
