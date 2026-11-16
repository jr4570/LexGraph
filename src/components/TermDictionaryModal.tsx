import React from 'react';
import {
  ArrowUpRight,
  BookOpen,
  Calendar,
  GitCompare,
  Layers,
  Scale,
  Sparkles,
  X,
} from 'lucide-react';
import { LegalArticle, LegalTerm } from '../types/legal';

interface TermDictionaryModalProps {
  term: LegalTerm | null;
  allArticles: LegalArticle[];
  allTerms: LegalTerm[];
  onClose: () => void;
  onSelectArticle: (article: LegalArticle) => void;
  onSelectTerm: (term: LegalTerm) => void;
}

export const TermDictionaryModal: React.FC<TermDictionaryModalProps> = ({
  term,
  allArticles,
  allTerms,
  onClose,
  onSelectArticle,
  onSelectTerm,
}) => {
  if (!term) return null;

  const relatedArticles = allArticles.filter((a) =>
    term.relatedArticleIds.includes(a.id)
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[88vh] bg-white rounded-2xl border border-[#E5DFD3] shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#EFECE6] bg-[#FAF8F5] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[#8A8175]">
            <BookOpen className="w-4 h-4 text-[#C68A3E]" />
            <span className="font-bold text-[#9A6524]">法律名詞白話字典</span>
            <span>·</span>
            <span>{term.category}</span>
            <span>·</span>
            <span className="font-mono">{term.englishName}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8A8175] hover:text-[#1A1D24] hover:bg-[#EFECE6] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <h2 className="text-2xl font-black text-[#1A1D24] flex items-center gap-2">
              <span>{term.name}</span>
              <span className="text-sm text-[#C68A3E]">◆</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#6E6559] mt-1.5 leading-relaxed">
              <strong>法定與學理定義：</strong>
              {term.shortDefinition}
            </p>
          </div>

          {/* Plain Definition Box */}
          <div className="border-l-4 border-[#C68A3E] bg-[#FBF8F2] rounded-r-2xl p-4 space-y-2">
            <div className="text-xs font-black text-[#9A6524] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              這詞定義是什麼？（白話文直白翻譯）
            </div>
            <p className="text-sm sm:text-[15px] font-bold text-[#1A1D24] leading-relaxed">
              {term.plainDefinition}
            </p>
            <p className="text-xs sm:text-sm text-[#3B352C] leading-relaxed pt-2 border-t border-[#EFE6D5]">
              {term.detailedExplanation}
            </p>
          </div>

          {/* Amendment History Box: 幾年改了、修改日期、修改了什麼、為何改了 */}
          <div className="rounded-xl border border-[#E5DFD3] bg-[#FAF8F5] p-4 space-y-2">
            <div className="text-xs font-black text-[#1A1D24] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#C68A3E]" />
              幾年改了 · 修改日期 · 修改了什麼 · 為何改了
            </div>
            <p className="text-xs sm:text-sm text-[#2D3139] leading-relaxed">
              {term.amendmentHistorySummary}
            </p>
          </div>

          {/* Core Elements */}
          {term.coreElements.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#4A453E] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#C68A3E]" />
                核心構成要件（{term.coreElements.length} 項）
              </div>
              <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#2D3139]">
                {term.coreElements.map((el, idx) => (
                  <li
                    key={idx}
                    className="rounded-xl border border-[#ECE7DF] bg-[#FAF8F5] px-3 py-2 flex items-start gap-2"
                  >
                    <span className="font-mono font-bold text-[#C68A3E]">0{idx + 1}.</span>
                    <span className="leading-relaxed">{el}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Contrasts */}
          {term.contrasts.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-[#4A453E] flex items-center gap-1.5">
                <GitCompare className="w-3.5 h-3.5 text-[#C68A3E]" />
                易混淆名詞白話比較
              </div>
              {term.contrasts.map((c, idx) => {
                const target = allTerms.find((t) => t.id === c.contrastTermId);
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-[#ECE7DF] bg-[#FAF8F5] p-3.5 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1A1D24]">{c.contrastTitle}</span>
                      {target && (
                        <button
                          type="button"
                          onClick={() => onSelectTerm(target)}
                          className="text-xs font-bold text-[#9A6524] hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          查看「{target.name}」
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-[#6E6559] leading-relaxed">{c.keyDifference}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="pt-3 border-t border-[#EFECE6] space-y-2">
              <div className="text-xs font-bold text-[#8A8175]">關聯中華民國法條：</div>
              <div className="flex flex-wrap gap-2">
                {relatedArticles.map((art) => (
                  <button
                    key={art.id}
                    type="button"
                    onClick={() => onSelectArticle(art)}
                    className="px-3 py-1.5 rounded-lg border border-[#E2DACB] bg-[#FAF8F5] hover:border-[#C68A3E] text-xs font-bold text-[#1A1D24] hover:text-[#9A6524] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Scale className="w-3 h-3 text-[#C68A3E]" />
                    <span>
                      {art.specificLawTitle} {art.articleNumber}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
