import { NoteColorTag, PersonalStatuteNote } from '../types/legal';

export const PERSONAL_NOTES_STORAGE_KEY = 'lexgraph_personal_statute_notes_v1';

export function parseStoredNotes(rawJson: string | null): PersonalStatuteNote[] {
  if (!rawJson) return [];
  try {
    const parsed = JSON.parse(rawJson);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is PersonalStatuteNote =>
        item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.articleId === 'string' &&
        typeof item.lawName === 'string' &&
        typeof item.articleNumber === 'string' &&
        typeof item.selectedText === 'string' &&
        typeof item.noteContent === 'string'
    );
  } catch {
    return [];
  }
}

export function loadPersonalNotesFromStorage(): PersonalStatuteNote[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(PERSONAL_NOTES_STORAGE_KEY);
    return parseStoredNotes(raw);
  } catch {
    return [];
  }
}

export function savePersonalNotesToStorage(notes: PersonalStatuteNote[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(PERSONAL_NOTES_STORAGE_KEY, JSON.stringify(notes));
  } catch {
    // Ignore storage quota errors
  }
}

export function createPersonalStatuteNote(
  existingNotes: PersonalStatuteNote[],
  input: {
    articleId: string;
    pcode?: string;
    lawName: string;
    articleNumber: string;
    articleTitle: string;
    selectedText: string;
    noteContent: string;
    colorTag?: NoteColorTag;
  },
  nowIso: string = new Date().toISOString()
): PersonalStatuteNote[] {
  const newNote: PersonalStatuteNote = {
    id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    articleId: input.articleId,
    pcode: input.pcode,
    lawName: input.lawName.trim(),
    articleNumber: input.articleNumber.trim(),
    articleTitle: input.articleTitle.trim(),
    selectedText: input.selectedText.trim(),
    noteContent: input.noteContent.trim(),
    colorTag: input.colorTag || 'gold',
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  return [newNote, ...existingNotes];
}

export function updatePersonalStatuteNote(
  existingNotes: PersonalStatuteNote[],
  noteId: string,
  updates: Partial<Pick<PersonalStatuteNote, 'selectedText' | 'noteContent' | 'colorTag'>>,
  nowIso: string = new Date().toISOString()
): PersonalStatuteNote[] {
  return existingNotes.map((note) => {
    if (note.id !== noteId) return note;
    return {
      ...note,
      selectedText:
        updates.selectedText !== undefined ? updates.selectedText.trim() : note.selectedText,
      noteContent:
        updates.noteContent !== undefined ? updates.noteContent.trim() : note.noteContent,
      colorTag: updates.colorTag !== undefined ? updates.colorTag : note.colorTag,
      updatedAt: nowIso,
    };
  });
}

export function deletePersonalStatuteNote(
  existingNotes: PersonalStatuteNote[],
  noteId: string
): PersonalStatuteNote[] {
  return existingNotes.filter((note) => note.id !== noteId);
}
