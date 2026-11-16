import React, { useEffect, useState } from 'react';
import {
  BookMarked,
  Check,
  Edit3,
  FileText,
  Highlighter,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  LegalArticle,
  NoteColorTag,
  PersonalStatuteNote,
} from '../types/legal';

interface PersonalNotesWidgetProps {
  notes: PersonalStatuteNote[];
  currentArticle?: LegalArticle | null;
  pendingSelection?: {
    text: string;
    article?: LegalArticle;
  } | null;
  onClearPendingSelection?: () => void;
  onAddNote: (input: {
    articleId: string;
    pcode?: string;
    lawName: string;
    articleNumber: string;
    articleTitle: string;
    selectedText: string;
    noteContent: string;
    colorTag: NoteColorTag;
  }) => void;
  onUpdateNote: (
    noteId: string,
    updates: Partial<Pick<PersonalStatuteNote, 'selectedText' | 'noteContent' | 'colorTag'>>
  ) => void;
  onDeleteNote: (noteId: string) => void;
  onJumpToNoteArticle?: (note: PersonalStatuteNote) => void;
  compact?: boolean;
}

const COLOR_TAG_META: Record<
  NoteColorTag,
  { label: string; dotClass: string; badgeClass: string; cardBorderClass: string }
> = {
  gold: {
    label: '暖金重點',
    dotClass: 'bg-[#C68A3E]',
    badgeClass: 'bg-[#FDF6EA] text-[#9A6524] border-[#E5C697]',
    cardBorderClass: 'border-l-4 border-l-[#C68A3E]',
  },
  emerald: {
    label: '實務要件',
    dotClass: 'bg-emerald-600',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    cardBorderClass: 'border-l-4 border-l-emerald-600',
  },
  blue: {
    label: '爭點解析',
    dotClass: 'bg-blue-600',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    cardBorderClass: 'border-l-4 border-l-blue-600',
  },
  rose: {
    label: '特別注意',
    dotClass: 'bg-rose-600',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    cardBorderClass: 'border-l-4 border-l-rose-600',
  },
};

export const PersonalNotesWidget: React.FC<PersonalNotesWidgetProps> = ({
  notes,
  currentArticle,
  pendingSelection,
  onClearPendingSelection,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onJumpToNoteArticle,
  compact = false,
}) => {
  const [isComposerOpen, setIsComposerOpen] = useState<boolean>(true);
  const [selectedText, setSelectedText] = useState<string>('');
  const [noteContent, setNoteContent] = useState<string>('');
  const [colorTag, setColorTag] = useState<NoteColorTag>('gold');
  const [targetArticle, setTargetArticle] = useState<LegalArticle | null>(
    currentArticle || null
  );
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [onlyCurrentArticle, setOnlyCurrentArticle] = useState<boolean>(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [editSelectedText, setEditSelectedText] = useState<string>('');
  const [justSavedToast, setJustSavedToast] = useState<boolean>(false);

  useEffect(() => {
    if (currentArticle) {
      setTargetArticle(currentArticle);
    }
  }, [currentArticle]);

  useEffect(() => {
    if (pendingSelection && pendingSelection.text.trim()) {
      setSelectedText(pendingSelection.text.trim());
      if (pendingSelection.article) {
        setTargetArticle(pendingSelection.article);
      }
      setIsComposerOpen(true);
    }
  }, [pendingSelection]);

  const handleGrabBrowserSelection = () => {
    const sel = window.getSelection()?.toString().trim() || '';
    if (sel) {
      setSelectedText(sel);
      setIsComposerOpen(true);
    } else if (targetArticle) {
      setSelectedText(targetArticle.currentText.split('\n')[0] || targetArticle.currentText);
      setIsComposerOpen(true);
    }
  };

  const handleSaveNewNote = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveSelected =
      selectedText.trim() ||
      (targetArticle
        ? targetArticle.currentText.split('\n')[0]?.slice(0, 60) || targetArticle.title
        : '法條重點摘錄');

    if (!noteContent.trim() && !selectedText.trim()) return;

    const lawName = targetArticle?.specificLawTitle || '中華民國法規';
    const articleNumber = targetArticle?.articleNumber || '條文筆記';
    const articleTitle = targetArticle?.title || '個人研讀筆記';
    const articleId = targetArticle?.id || 'general-note';

    onAddNote({
      articleId,
      pcode: targetArticle?.pcode,
      lawName,
      articleNumber,
      articleTitle,
      selectedText: effectiveSelected,
      noteContent: noteContent.trim() || `摘錄重點：「${effectiveSelected}」`,
      colorTag,
    });

    setSelectedText('');
    setNoteContent('');
    onClearPendingSelection?.();
    setJustSavedToast(true);
    setTimeout(() => setJustSavedToast(false), 2000);
  };

  const filteredNotes = notes.filter((n) => {
    if (onlyCurrentArticle && targetArticle && n.articleId !== targetArticle.id) {
      return false;
    }
    const q = filterQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      n.lawName.toLowerCase().includes(q) ||
      n.articleNumber.toLowerCase().includes(q) ||
      n.articleTitle.toLowerCase().includes(q) ||
      n.selectedText.toLowerCase().includes(q) ||
      n.noteContent.toLowerCase().includes(q)
    );
  });

  return (
    <section
      aria-label="個人法條筆記小工具"
      data-testid="personal-notes-widget"
      className="rounded-2xl border border-[#E5C697] bg-white shadow-xs overflow-hidden"
    >
      {/* Header Bar */}
      <div className="px-4 py-3 bg-linear-to-r from-[#FDF8EE] via-[#FAF3E4] to-[#FDF8EE] border-b border-[#EFE3CE] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#C68A3E] text-white flex items-center justify-center shadow-2xs">
            <BookMarked className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-[#1A1D24] flex items-center gap-1.5">
              <span>個人法條筆記小工具</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#C68A3E]/15 text-[#9A6524] text-[11px] font-mono">
                {notes.length} 則
              </span>
            </h3>
            <p className="text-[11px] text-[#8A8175]">
              反白選取條文文字即可摘錄，自動儲存於瀏覽器 localStorage
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsComposerOpen((v) => !v)}
          className="px-2.5 py-1 rounded-lg border border-[#E2D6C1] bg-white hover:bg-[#FAF8F5] text-xs font-bold text-[#6E6559] cursor-pointer shrink-0"
        >
          {isComposerOpen ? '收合編輯' : '+ 新增筆記'}
        </button>
      </div>

      {/* Note Composer Form */}
      {isComposerOpen && (
        <form onSubmit={handleSaveNewNote} className="p-4 bg-[#FCFBF9] border-b border-[#EFECE6] space-y-3">
          {/* Target Article Indicator */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-[#4A453E] font-bold">
              <FileText className="w-3.5 h-3.5 text-[#C68A3E]" />
              <span>
                對應條文：
                {targetArticle
                  ? `${targetArticle.specificLawTitle} ${targetArticle.articleNumber}（${targetArticle.title}）`
                  : '通用法條筆記'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleGrabBrowserSelection}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#E5C697] bg-[#FDF6EA] hover:bg-[#F9EBD2] text-[11px] font-bold text-[#9A6524] transition-colors cursor-pointer"
            >
              <Highlighter className="w-3 h-3" />
              <span>擷取反白選取文字</span>
            </button>
          </div>

          {/* Selected Statute Text Excerpt Box */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-[#6E6559]">
              選取的法條文字段落（可直接反白條文自動帶入或手動調整）：
            </label>
            <div className="relative">
              <textarea
                rows={2}
                value={selectedText}
                onChange={(e) => setSelectedText(e.target.value)}
                data-testid="note-selected-text-input"
                placeholder="請在條文閱讀區用滑鼠反白選取文字，或在此輸入想標記的法條原文段落..."
                className="w-full rounded-xl border border-[#E5DFD3] bg-white px-3 py-2 text-xs text-[#2D3139] placeholder:text-[#A69F93] focus:outline-none focus:border-[#C68A3E] leading-relaxed"
              />
              {selectedText && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedText('');
                    onClearPendingSelection?.();
                  }}
                  className="absolute right-2 top-2 text-[#9A9184] hover:text-[#1A1D24] p-0.5 cursor-pointer"
                  title="清除選取文字"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Personal Note Content Input */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-[#6E6559]">
              個人法條筆記內容（心得、實務爭點、背誦口訣或案例提醒）：
            </label>
            <textarea
              rows={compact ? 2 : 3}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              data-testid="note-content-input"
              placeholder="輸入您的個人法條筆記（例如：簽約時蓋公司章與親筆簽名同效，但按指印必須有兩位見證人簽名）..."
              className="w-full rounded-xl border border-[#E5DFD3] bg-white px-3 py-2 text-xs sm:text-sm text-[#1A1D24] placeholder:text-[#A69F93] focus:outline-none focus:border-[#C68A3E] leading-relaxed"
            />
          </div>

          {/* Color Tag Selector & Submit Button */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5">
              {(Object.keys(COLOR_TAG_META) as NoteColorTag[]).map((tagKey) => {
                const meta = COLOR_TAG_META[tagKey];
                const active = colorTag === tagKey;
                return (
                  <button
                    key={tagKey}
                    type="button"
                    onClick={() => setColorTag(tagKey)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[11px] font-bold transition-all cursor-pointer ${
                      active
                        ? `${meta.badgeClass} ring-1 ring-[#C68A3E]`
                        : 'border-[#E5DFD3] bg-white text-[#8A8175] hover:text-[#1A1D24]'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${meta.dotClass}`} />
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="submit"
              data-testid="save-personal-note-btn"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#1F242D] hover:bg-[#C68A3E] text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            >
              {justSavedToast ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>已儲存至 localStorage</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>新增個人法條筆記</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Saved Notes Filter & List */}
      <div className="p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="w-3.5 h-3.5 text-[#9A9184] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="搜尋已儲存的個人筆記..."
              className="w-full pl-8 pr-3 py-1 rounded-lg border border-[#E5DFD3] bg-[#FAF8F5] text-xs text-[#1A1D24] placeholder:text-[#9A9184] focus:outline-none focus:border-[#C68A3E]"
            />
          </div>

          {targetArticle && (
            <button
              type="button"
              onClick={() => setOnlyCurrentArticle((v) => !v)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-colors cursor-pointer ${
                onlyCurrentArticle
                  ? 'border-[#C68A3E] bg-[#FDF6EA] text-[#9A6524]'
                  : 'border-[#E5DFD3] bg-[#FAF8F5] text-[#6E6559]'
              }`}
            >
              {onlyCurrentArticle ? '顯示全部條文筆記' : `僅看${targetArticle.articleNumber}`}
            </button>
          )}
        </div>

        {filteredNotes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#E2DACB] bg-[#FAF8F5] p-4 text-center space-y-1">
            <p className="text-xs font-bold text-[#6E6559]">
              目前尚無已儲存的個人法條筆記
            </p>
            <p className="text-[11px] text-[#9A9184]">
              在左側條文閱讀區用滑鼠反白選取文字，或直接在上方輸入筆記並點擊「新增個人法條筆記」，即可永久保存在本機瀏覽器中。
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1" data-testid="saved-notes-list">
            {filteredNotes.map((note) => {
              const tagMeta = COLOR_TAG_META[note.colorTag || 'gold'];
              const isEditing = editingNoteId === note.id;

              return (
                <div
                  key={note.id}
                  data-testid="saved-note-item"
                  className={`rounded-xl border border-[#EAE4D8] bg-[#FAF8F5] p-3 space-y-2 ${tagMeta.cardBorderClass}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => onJumpToNoteArticle?.(note)}
                        className="text-xs font-black text-[#1A1D24] hover:text-[#C68A3E] transition-colors cursor-pointer"
                      >
                        {note.lawName} {note.articleNumber}
                      </button>
                      <span className="text-[11px] text-[#8A8175]">{note.articleTitle}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded border text-[10px] font-bold ${tagMeta.badgeClass}`}
                      >
                        {tagMeta.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (isEditing) {
                            setEditingNoteId(null);
                          } else {
                            setEditingNoteId(note.id);
                            setEditSelectedText(note.selectedText);
                            setEditContent(note.noteContent);
                          }
                        }}
                        className="p-1 rounded hover:bg-white text-[#8A8175] hover:text-[#1A1D24] cursor-pointer"
                        title="編輯筆記"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteNote(note.id)}
                        className="p-1 rounded hover:bg-rose-50 text-[#8A8175] hover:text-rose-600 cursor-pointer"
                        title="刪除筆記"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2 pt-1">
                      <input
                        type="text"
                        value={editSelectedText}
                        onChange={(e) => setEditSelectedText(e.target.value)}
                        className="w-full rounded-lg border border-[#E5DFD3] bg-white px-2.5 py-1 text-xs text-[#2D3139]"
                        placeholder="選取的法條段落"
                      />
                      <textarea
                        rows={2}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full rounded-lg border border-[#E5DFD3] bg-white px-2.5 py-1.5 text-xs text-[#1A1D24]"
                        placeholder="個人筆記內容"
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingNoteId(null)}
                          className="px-2.5 py-1 rounded border border-[#E5DFD3] bg-white text-[11px] text-[#6E6559] cursor-pointer"
                        >
                          取消
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateNote(note.id, {
                              selectedText: editSelectedText,
                              noteContent: editContent,
                            });
                            setEditingNoteId(null);
                          }}
                          className="px-2.5 py-1 rounded bg-[#C68A3E] text-white text-[11px] font-bold cursor-pointer"
                        >
                          儲存修改
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {note.selectedText && (
                        <blockquote className="px-2.5 py-1.5 rounded-lg bg-[#FDF6EA] border border-[#EFE3CE] text-[11px] text-[#6E5634] leading-relaxed">
                          <Sparkles className="w-3 h-3 inline mr-1 text-[#C68A3E]" />
                          「{note.selectedText}」
                        </blockquote>
                      )}
                      <p className="text-xs text-[#1A1D24] leading-relaxed whitespace-pre-line">
                        {note.noteContent}
                      </p>
                      <div className="text-[10px] text-[#9A9184] font-mono">
                        儲存於 localStorage · {new Date(note.updatedAt).toLocaleString('zh-TW')}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
