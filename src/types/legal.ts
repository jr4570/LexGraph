export type LawCategory =
  | '全部法規'
  | '民法'
  | '刑法'
  | '憲法與釋憲實務'
  | '公司法與商事法'
  | '行政程序與交通法規'
  | '勞動基準法'
  | '個人資料保護法'
  | '民刑事訴訟法';

export interface DiffSegment {
  type: 'unchanged' | 'added' | 'removed';
  text: string;
}

export interface AmendmentRecord {
  id: string;
  rocYear: string; // 幾年改了, e.g. "民國 112 年 (2023年)"
  date: string; // 修改日期, e.g. "民國 112 年 12 月 27 日修正公布"
  versionLabel: string;
  changeType: '修正' | '增訂' | '刪除部分要件' | '憲法法庭宣告';
  previousText: string;
  updatedText: string;
  whatChangedPlain: string; // 修改了什麼（白話文）
  whyChangedPlain: string; // 為何改了（白話文原因）
  addedSummary: string; // 添加了什麼
  removedSummary: string; // 刪去了什麼
  reason: string; // 正式立法理由
}

export interface CrossReference {
  targetArticleId: string;
  relationType: '準用' | '依前條規定' | '構成要件補充' | '法律效果連結' | '特別法優先' | '上位原則';
  description: string;
}

export interface LegalRequirementBreakdown {
  subjective: string;
  objective: string;
  legalEffect: string;
}

export interface LegalArticle {
  id: string;
  lawName: Exclude<LawCategory, '全部法規'>;
  specificLawTitle: string; // e.g., "民法", "中華民國刑法", "公司法"
  pcode?: string; // R.O.C. MojLaw PCode, e.g. "B0000001"
  partTitle?: string; // e.g., "第一編 總則"
  chapter: string; // e.g., "第一章 法例"
  articleNumber: string; // e.g., "第 3 條"
  title: string; // e.g., "使用文字之準則"
  currentText: string;
  summaryCallout?: string; // 重點摘要 (Image 3 style callout)
  qaPrompt?: string; // e.g., "合約只蓋章沒簽名，有效嗎？"
  qaShortAnswer?: string; // e.g., "有效，蓋章與簽名同等效力"
  plainExplanation: string; // 白話文解釋：這條法律在講什麼？
  applicabilityScope: string; // 適用範圍與生活情境
  requirements: LegalRequirementBreakdown;
  termIds: string[];
  crossReferences: CrossReference[];
  amendments: AmendmentRecord[];
  practicalExample: string;
  lastUpdated: string;
  lastAmendedYear: string; // e.g. "民國 112 年"
}

export interface TermContrast {
  contrastTermId: string;
  contrastTitle: string;
  keyDifference: string;
}

export interface LegalTerm {
  id: string;
  name: string;
  englishName: string;
  category: Exclude<LawCategory, '全部法規'> | '通用法理';
  keywords?: string[]; // Keywords to match inside any R.O.C. statute text for click-to-reveal
  plainDefinition: string; // 這詞定義是什麼（白話文直白翻譯）
  shortDefinition: string; // 法定／學理定義
  detailedExplanation: string;
  amendmentHistorySummary: string; // 這個詞歷年幾年改了、改了什麼、為何改了
  coreElements: string[];
  practicalApplication: string;
  relatedArticleIds: string[];
  relatedTermIds: string[];
  contrasts: TermContrast[];
}

export interface RocLawIndexEntry {
  PCode: string;
  name: string;
  lastUpdate: string;
  english?: string;
}

export interface RocMajorLawEntry {
  pcode: string;
  name: string;
  shortName: string;
  category: Exclude<LawCategory, '全部法規'>;
  articleCountLabel: string;
  description: string;
}

export interface RocLawChapterPill {
  index: number;
  fullChapterTitle: string; // e.g. "第一章 法例"
  shortChapterTitle: string; // e.g. "法例"
  firstArticleId: string;
}

export interface RocLawPartGroup {
  partTitle: string; // e.g. "第一編 總則"
  firstArticleId: string;
  chapters: RocLawChapterPill[];
}

export interface RocLawFullDocument {
  pcode: string;
  lawName: string;
  category: Exclude<LawCategory, '全部法規'>;
  lawCategoryPath: string; // e.g. "行政 ＞ 法務部 ＞ 法律事務目"
  enactedDateRoc: string; // e.g. "18.05.23"
  lastModifiedDateRoc: string; // e.g. "115.08.17"
  effectiveStatusLabel: string;
  effectiveStatusDetail: string;
  officialUrl: string;
  partGroups: RocLawPartGroup[];
  articles: LegalArticle[];
}

export type GraphNodeType = 'article' | 'term' | 'principle';

export interface GraphNode {
  id: string;
  label: string;
  subLabel: string;
  type: GraphNodeType;
  category: string;
  isFocal: boolean;
  hopDistance: number;
  x: number;
  y: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  relationCategory: 'citation' | 'definition' | 'contrast' | 'principle';
}

export interface SubgraphResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface WorkspaceTab {
  id: string;
  title: string;
  type: 'portal' | 'law' | 'article' | 'dictionary' | 'amendments';
  lawPCode?: string;
  articleId?: string;
}

export type NoteColorTag = 'gold' | 'emerald' | 'blue' | 'rose';

export interface PersonalStatuteNote {
  id: string;
  articleId: string;
  pcode?: string;
  lawName: string; // e.g. "民法"
  articleNumber: string; // e.g. "第 3 條"
  articleTitle: string; // e.g. "使用文字之準則"
  selectedText: string; // 使用者選取的法條文字段落
  noteContent: string; // 個人法條筆記內容
  colorTag: NoteColorTag;
  createdAt: string;
  updatedAt: string;
}

