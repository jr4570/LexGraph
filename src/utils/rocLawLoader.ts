import {
  AmendmentRecord,
  LawCategory,
  LegalArticle,
  LegalTerm,
  RocLawChapterPill,
  RocLawFullDocument,
  RocLawIndexEntry,
  RocLawPartGroup,
  RocMajorLawEntry,
} from '../types/legal';

export const ROC_MAJOR_LAWS_CATALOG: RocMajorLawEntry[] = [
  {
    pcode: 'B0000001',
    name: '民法',
    shortName: '民法',
    category: '民法',
    articleCountLabel: '1,229 條',
    description: '總則、債編、物權、親屬、繼承全條文',
  },
  {
    pcode: 'C0000001',
    name: '中華民國刑法',
    shortName: '中華民國刑法',
    category: '刑法',
    articleCountLabel: '363 條',
    description: '總則與分則所有犯罪構成要件及刑度',
  },
  {
    pcode: 'J0080001',
    name: '公司法',
    shortName: '公司法',
    category: '公司法與商事法',
    articleCountLabel: '449 條',
    description: '有限公司、股份有限公司、負責人責任',
  },
  {
    pcode: 'N0030001',
    name: '勞動基準法',
    shortName: '勞動基準法',
    category: '勞動基準法',
    articleCountLabel: '86 條',
    description: '工資、工時、加班費、特休假與資遣解僱',
  },
  {
    pcode: 'A0030055',
    name: '行政程序法',
    shortName: '行政程序法',
    category: '行政程序與交通法規',
    articleCountLabel: '175 條',
    description: '比例原則、信賴保護、行政處分與聽證',
  },
  {
    pcode: 'K0040012',
    name: '道路交通管理處罰條例',
    shortName: '道交處罰條例',
    category: '行政程序與交通法規',
    articleCountLabel: '93 條',
    description: '酒駕扣牌、超速、違停與交通違規裁罰',
  },
  {
    pcode: 'J0170001',
    name: '消費者保護法',
    shortName: '消費者保護法',
    category: '公司法與商事法',
    articleCountLabel: '64 條',
    description: '網購七天鑑賞期、定型化契約與消保求償',
  },
  {
    pcode: 'I0050021',
    name: '個人資料保護法',
    shortName: '個人資料保護法',
    category: '個人資料保護法',
    articleCountLabel: '56 條',
    description: '個資蒐集處理利用、外洩求償與刑責',
  },
  {
    pcode: 'B0010001',
    name: '民事訴訟法',
    shortName: '民事訴訟法',
    category: '民刑事訴訟法',
    articleCountLabel: '640 條',
    description: '民事起訴、舉證責任、調解、上訴與保全',
  },
  {
    pcode: 'C0010001',
    name: '刑事訴訟法',
    shortName: '刑事訴訟法',
    category: '民刑事訴訟法',
    articleCountLabel: '512 條',
    description: '無罪推定、搜索扣押、羈押、傳喚與審判',
  },
  {
    pcode: 'A0000001',
    name: '中華民國憲法',
    shortName: '中華民國憲法',
    category: '憲法與釋憲實務',
    articleCountLabel: '175 條',
    description: '人民基本權利義務與國家機關組織',
  },
  {
    pcode: 'A0000002',
    name: '中華民國憲法增修條文',
    shortName: '憲法增修條文',
    category: '憲法與釋憲實務',
    articleCountLabel: '12 條',
    description: '總統直選、五院體制與基本國策增修',
  },
  {
    pcode: 'A0030210',
    name: '行政罰法',
    shortName: '行政罰法',
    category: '行政程序與交通法規',
    articleCountLabel: '46 條',
    description: '一行為不二罰、行政裁罰故意過失與時效',
  },
  {
    pcode: 'I0020004',
    name: '國家賠償法',
    shortName: '國家賠償法',
    category: '行政程序與交通法規',
    articleCountLabel: '17 條',
    description: '公務員違法失職或公共設施瑕疵之國賠請求',
  },
  {
    pcode: 'D0060001',
    name: '土地法',
    shortName: '土地法',
    category: '民法',
    articleCountLabel: '247 條',
    description: '不動產登記、共有土地處分（第34-1條）、租賃',
  },
  {
    pcode: 'D0070118',
    name: '公寓大廈管理條例',
    shortName: '公寓大廈管理條例',
    category: '民法',
    articleCountLabel: '63 條',
    description: '管委會權責、惡鄰噪音漏水、區分所有權人會議',
  },
  {
    pcode: 'J0070017',
    name: '著作權法',
    shortName: '著作權法',
    category: '公司法與商事法',
    articleCountLabel: '117 條',
    description: '重製權、公開傳輸、合理使用與侵權責任',
  },
  {
    pcode: 'G0390002',
    name: '保險法',
    shortName: '保險法',
    category: '公司法與商事法',
    articleCountLabel: '178 條',
    description: '保險契約、據實說明義務、理賠與除外責任',
  },
  {
    pcode: 'G0380028',
    name: '票據法',
    shortName: '票據法',
    category: '公司法與商事法',
    articleCountLabel: '146 條',
    description: '支票、本票、匯票、背書轉讓與票據追索權',
  },
  {
    pcode: 'G0400001',
    name: '證券交易法',
    shortName: '證券交易法',
    category: '公司法與商事法',
    articleCountLabel: '183 條',
    description: '內線交易、財報不實、操縱股價與公開發行',
  },
  {
    pcode: 'D0050071',
    name: '家庭暴力防治法',
    shortName: '家庭暴力防治法',
    category: '刑法',
    articleCountLabel: '66 條',
    description: '保護令聲請、家暴防治與違反保護令罪',
  },
  {
    pcode: 'D0080211',
    name: '跟蹤騷擾防制法',
    shortName: '跟蹤騷擾防制法',
    category: '刑法',
    articleCountLabel: '23 條',
    description: '八大跟騷行為態樣、書面告誡與跟騷保護令',
  },
  {
    pcode: 'G0380131',
    name: '洗錢防制法',
    shortName: '洗錢防制法',
    category: '刑法',
    articleCountLabel: '31 條',
    description: '提供人頭帳戶罪、隱匿犯罪所得與洗錢刑責',
  },
  {
    pcode: 'C0000008',
    name: '毒品危害防制條例',
    shortName: '毒品危害防制條例',
    category: '刑法',
    articleCountLabel: '36 條',
    description: '一至四級毒品製造販賣運輸施用與觀察勒戒',
  },
  {
    pcode: 'D0080067',
    name: '社會秩序維護法',
    shortName: '社會秩序維護法',
    category: '行政程序與交通法規',
    articleCountLabel: '94 條',
    description: '妨害安寧、散佈謠言、跟追與輕微違序裁罰',
  },
  {
    pcode: 'G0340001',
    name: '稅捐稽徵法',
    shortName: '稅捐稽徵法',
    category: '行政程序與交通法規',
    articleCountLabel: '51 條',
    description: '核課期間、復查訴願、逃漏稅處罰與退稅',
  },
];

// Concise textbook titles for early Civil Code & common articles
const CIVIL_CODE_CONCISE_TITLES: Record<string, string> = {
  '第 1 條': '法源',
  '第 2 條': '適用習慣之限制',
  '第 3 條': '使用文字之準則',
  '第 4 條': '以文字為準',
  '第 5 條': '以最低額為準',
  '第 6 條': '自然人權利能力之始期',
  '第 7 條': '胎兒之權利能力',
  '第 8 條': '死亡宣告之要件',
  '第 9 條': '死亡時間之推定',
  '第 10 條': '失蹤人財產之管理',
  '第 11 條': '同時死亡之推定',
  '第 12 條': '成年時期',
  '第 13 條': '未成年人之行為能力',
  '第 14 條': '監護之宣告與撤銷',
  '第 15 條': '受監護宣告人之行為能力',
  '第 15-1 條': '輔助之宣告',
  '第 15-2 條': '受輔助宣告人應經同意之行為',
  '第 16 條': '權利能力及行為能力不得拋棄',
  '第 17 條': '自由不得拋棄及其限制',
  '第 18 條': '人格權之保護',
  '第 19 條': '姓名權之保護',
  '第 20 條': '住所之設定',
  '第 66 條': '物之意義—不動產',
  '第 67 條': '物之意義—動產',
  '第 71 條': '違反強行規定之效力',
  '第 72 條': '違背公序良俗之效力',
  '第 73 條': '不依法定方式之效力',
  '第 74 條': '暴利行為',
  '第 75 條': '無行為能力人及無意識能力人之意思表示',
  '第 88 條': '錯誤之意思表示',
  '第 92 條': '被詐欺或被脅迫之意思表示',
  '第 125 條': '一般消滅時效期間',
  '第 148 條': '權利濫用之禁止與誠實信用原則',
  '第 179 條': '不當得利之返還請求權',
  '第 184 條': '一般侵權行為之成立要件與損害賠償',
  '第 188 條': '僱用人之連帶賠償責任',
  '第 195 條': '侵害人格權之非財產上損害賠償（精神慰撫金）',
};

let cachedLawIndex: RocLawIndexEntry[] | null = null;
const cachedLawDocumentsByPCode = new Map<string, RocLawFullDocument>();

export async function fetchRocLawIndex(): Promise<RocLawIndexEntry[]> {
  if (cachedLawIndex) return cachedLawIndex;
  try {
    const res = await fetch(
      'https://raw.githubusercontent.com/kong0107/mojLawSplitJSON/master/index.json'
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as RocLawIndexEntry[];
    cachedLawIndex = data;
    return data;
  } catch {
    return ROC_MAJOR_LAWS_CATALOG.map((item) => ({
      PCode: item.pcode,
      name: item.name,
      lastUpdate: '20250101',
    }));
  }
}

export function inferLawCategory(
  lawName: string,
  pcode: string
): Exclude<LawCategory, '全部法規'> {
  const catalogMatch = ROC_MAJOR_LAWS_CATALOG.find(
    (c) => c.pcode === pcode || c.name === lawName
  );
  if (catalogMatch) return catalogMatch.category;

  if (lawName.includes('憲法') || lawName.includes('釋字') || lawName.includes('憲判')) {
    return '憲法與釋憲實務';
  }
  if (lawName.includes('民事訴訟') || lawName.includes('刑事訴訟') || lawName.includes('家事事件')) {
    return '民刑事訴訟法';
  }
  if (
    lawName.includes('刑法') ||
    lawName.includes('毒品') ||
    lawName.includes('洗錢') ||
    lawName.includes('貪污') ||
    lawName.includes('跟蹤騷擾') ||
    lawName.includes('家庭暴力') ||
    lawName.includes('槍砲')
  ) {
    return '刑法';
  }
  if (lawName.includes('個人資料')) {
    return '個人資料保護法';
  }
  if (
    lawName.includes('勞動') ||
    lawName.includes('勞工') ||
    lawName.includes('就業') ||
    lawName.includes('性別平等工作') ||
    lawName.includes('職業安全')
  ) {
    return '勞動基準法';
  }
  if (
    lawName.includes('公司') ||
    lawName.includes('商業') ||
    lawName.includes('消費者') ||
    lawName.includes('證券') ||
    lawName.includes('保險') ||
    lawName.includes('票據') ||
    lawName.includes('著作權') ||
    lawName.includes('商標') ||
    lawName.includes('專利') ||
    lawName.includes('公平交易')
  ) {
    return '公司法與商事法';
  }
  if (
    lawName.includes('民法') ||
    lawName.includes('土地') ||
    lawName.includes('公寓大廈') ||
    lawName.includes('信託')
  ) {
    return '民法';
  }
  return '行政程序與交通法規';
}

function formatMojDate(yyyymmdd?: string): {
  isoDate: string;
  rocYearLabel: string;
  rocDotDate: string;
  fullRocDate: string;
} {
  if (!yyyymmdd || yyyymmdd.length < 8) {
    return {
      isoDate: '2024-01-01',
      rocYearLabel: '民國 113 年',
      rocDotDate: '113.01.01',
      fullRocDate: '民國 113 年修正公布',
    };
  }
  const yyyy = Number(yyyymmdd.slice(0, 4));
  const mm = yyyymmdd.slice(4, 6);
  const dd = yyyymmdd.slice(6, 8);
  const rocYear = Math.max(1, yyyy - 1911);
  return {
    isoDate: `${yyyy}-${mm}-${dd}`,
    rocYearLabel: `民國 ${rocYear} 年`,
    rocDotDate: `${rocYear}.${mm}.${dd}`,
    fullRocDate: `民國 ${rocYear} 年 ${mm} 月 ${dd} 日異動公布（${yyyy}-${mm}-${dd}）`,
  };
}

function chineseNumToNumber(cn: string): number {
  const clean = cn.trim();
  if (/^\d+$/.test(clean)) return parseInt(clean, 10);
  const map: Record<string, number> = {
    零: 0,
    〇: 0,
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
  };
  let result = 0;
  let temp = 0;
  for (const ch of clean) {
    if (ch === '百') {
      result += (temp || 1) * 100;
      temp = 0;
    } else if (ch === '十') {
      result += (temp || 1) * 10;
      temp = 0;
    } else if (map[ch] !== undefined) {
      temp = map[ch];
    }
  }
  result += temp;
  return result || 1;
}

function parseFirstEnactedRocDotDate(historyStr: string, fallbackDotDate: string): string {
  const firstLine = (historyStr || '').split(/\r?\n/)[0] || '';
  const match = firstLine.match(
    /中華民國([一二三四五六七八九十百零〇\d]+)年([一二三四五六七八九十\d]+)月([一二三四五六七八九十\d]+)日/
  );
  if (!match) return fallbackDotDate;
  const y = chineseNumToNumber(match[1]);
  const m = String(chineseNumToNumber(match[2])).padStart(2, '0');
  const d = String(chineseNumToNumber(match[3])).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

export function synthesizePlainExplanationForArticle(
  lawName: string,
  chapter: string,
  articleNumber: string,
  rawText: string
): {
  title: string;
  summaryCallout: string;
  qaPrompt: string;
  qaShortAnswer: string;
  plainExplanation: string;
  applicabilityScope: string;
  practicalExample: string;
} {
  const cleanText = rawText.replace(/\r\n/g, '\n').trim();
  if (cleanText.includes('（刪除）') || cleanText === '（刪除）') {
    return {
      title: '（本條已刪除）',
      summaryCallout: '本條文已於歷年修法中經立法院正式刪除，目前不再適用，僅保留條號以維持法典條文順序。',
      qaPrompt: `為什麼《${lawName}》${articleNumber} 顯示為「（刪除）」卻還留著條號？`,
      qaShortAnswer: '為了避免整部法典後續條號全部重新洗牌、造成實務判決與契約引用混亂，立法院刪除條文時會保留原條號並註明「（刪除）」。',
      plainExplanation:
        '【白話文翻譯】本條文已經在歷年修法中被立法院正式刪除廢止，目前不再適用，保留條號僅是為了維持整部法典其他條文的編號順序不變。',
      applicabilityScope: '本條已刪除，實務上不再援引適用。',
      practicalExample: '查閱歷史判決或修法沿革時可對照本條刪除紀錄。',
    };
  }

  const presetTitle =
    lawName === '民法' && CIVIL_CODE_CONCISE_TITLES[articleNumber]
      ? CIVIL_CODE_CONCISE_TITLES[articleNumber]
      : undefined;

  const firstSentence = cleanText.split(/[。；\n]/)[0]?.trim() || cleanText.slice(0, 28);
  const conciseTitle =
    presetTitle ||
    (firstSentence.length > 18 ? `${firstSentence.slice(0, 18)}…之規定` : `${firstSentence}`);

  const explanations: string[] = [];
  let summaryCallout = '';
  let qaPrompt = '';
  let qaShortAnswer = '';

  if (
    cleanText.includes('處死刑') ||
    cleanText.includes('無期徒刑') ||
    cleanText.includes('有期徒刑') ||
    cleanText.includes('拘役') ||
    cleanText.includes('罰金')
  ) {
    summaryCallout = `本條為《${lawName}》之刑事處罰規定，明定違法行為之構成要件與法定刑度（徒刑、拘役或罰金）。`;
    qaPrompt = `觸犯《${lawName}》${articleNumber} 會面臨什麼法律後果？`;
    qaShortAnswer = `行為人若符合本條構成要件，將由檢察官偵查起訴，並由法院依本條法定刑度判處徒刑、拘役或罰金。`;
    explanations.push(
      `本條屬於刑事處罰規定。只要行為人做出了條文所描述的違法行為，法院就會依法判處對應的刑期（徒刑、拘役）或罰金（繳給國庫的刑事罰款，會有前科紀錄）。`
    );
  } else if (
    cleanText.includes('罰鍰') ||
    cleanText.includes('吊扣') ||
    cleanText.includes('吊銷') ||
    cleanText.includes('限期改善')
  ) {
    summaryCallout = `本條為《${lawName}》之行政裁罰規定，明定違反行政法上義務時之罰鍰金額、吊扣吊銷執照或限期改善措施。`;
    qaPrompt = `違反《${lawName}》${articleNumber} 的「罰鍰」會留前科嗎？`;
    qaShortAnswer = `不會。「罰鍰」屬於行政機關開立的行政罰單，並非刑事法院判處的「罰金」，繳納後不會留下刑事犯罪前科。`;
    explanations.push(
      `本條規定了違反行政管理義務時的處罰方式（例如由政府機關開罰單處以「罰鍰」、吊扣執照或命限期改善），屬於行政罰而非坐牢的刑罰。`
    );
  } else if (cleanText.includes('損害賠償') || cleanText.includes('連帶賠償')) {
    summaryCallout = `本條明定民事損害賠償之請求權基礎，使權利受侵害或受有損害之一方得依法請求金錢賠償或回復原狀。`;
    qaPrompt = `依《${lawName}》${articleNumber} 請求賠償時，誰要負舉證責任？`;
    qaShortAnswer = `原則上由主張權利受損的被害人，針對對方的違法行為、自身受有損害及兩者間的因果關係負舉證責任。`;
    explanations.push(
      `本條規定當一方侵害他人權益或違反義務造成損害時，被害人可以依法向對方請求金錢賠償或回復原狀。`
    );
  } else if (cleanText.includes('無效') || cleanText.includes('得撤銷') || cleanText.includes('解除契約')) {
    summaryCallout = `本條規範法律行為或契約於特定情形下「無效」、「得撤銷」或「得解除契約」之法定要件與法律效果。`;
    qaPrompt = `法律行為「無效」與「得撤銷」在《${lawName}》${articleNumber} 中有何不同？`;
    qaShortAnswer = `「無效」是自始當然不發生效力；「得撤銷」則是原本有效，直到有撤銷權人向對方表示撤銷後，才溯及自始無效。`;
    explanations.push(
      `本條規範契約或法律行為在特定情況下「無效（自始不算數）」或當事人「得撤銷／解除（把原本有效的契約取消掉）」的條件。`
    );
  } else {
    summaryCallout = `《${lawName}》${articleNumber} 明定「${conciseTitle}」之核心準則，作為當事人權利義務與法院裁判之直接依據。`;
    qaPrompt = `在實務上，什麼情況會直接適用《${lawName}》${articleNumber}？`;
    qaShortAnswer = `當案件涉及「${conciseTitle}」之爭議時，當事人與法院即應優先依本條規定定其法律效果。`;
    explanations.push(
      `本條明定了在「${chapter || lawName}」領域中，當事人、機關或法院應遵循的權利義務標準：「${cleanText.replace(/\n+/g, ' ')}」`
    );
  }

  if (cleanText.includes('但') && cleanText.includes('不在此限')) {
    explanations.push(
      `特別注意「但書」例外：條文中寫有「但……不在此限」，代表前半段是一般原則，但如果符合「但」字後面的特殊情況，就可以例外免責或排除適用！`
    );
  }
  if (cleanText.includes('推定')) {
    explanations.push(
      `舉證責任提示（「推定」）：條文使用了「推定」，意思是法律先假設該事實成立，但當事人如果能提出相反的證據，仍然可以在法庭上推翻這個假設。`
    );
  }
  if (cleanText.includes('視為')) {
    explanations.push(
      `強制擬制效力（「視為」）：條文使用了「視為」，代表法律直接強制認定該結果成立，當事人就算拿出相反證據也不能推翻。`
    );
  }
  if (cleanText.includes('準用')) {
    explanations.push(
      `跨條文借用（「準用」）：條文規定「準用」其他條文，代表為了立法簡潔，直接借用所指條文的規則來處理本條的情況。`
    );
  }

  return {
    title: conciseTitle,
    summaryCallout,
    qaPrompt,
    qaShortAnswer,
    plainExplanation: explanations.join('\n\n'),
    applicabilityScope: `適用於《${lawName}》${chapter ? `${chapter}` : ''}相關之權利義務認定、爭議處理與法院實務裁判。`,
    practicalExample: `當實務案件涉及《${lawName}》${articleNumber} 所定之情形時，當事人或法院即直接援引本條作為請求權基礎或裁判依據。`,
  };
}

export function parseMojLawHistoryToAmendments(
  lawName: string,
  articleNumber: string,
  currentText: string,
  lawHistoryRaw: string,
  lastUpdateRaw: string
): AmendmentRecord[] {
  const { rocYearLabel, fullRocDate } = formatMojDate(lastUpdateRaw);
  const rawLines = (lawHistoryRaw || '')
    .split(/\r?\n(?=\d+\.)/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const numMatch = articleNumber.match(/第\s*([0-9\-之]+)\s*條/);
  const bareNum = numMatch ? numMatch[1] : '';

  const relevantLines = rawLines.filter((line) => {
    if (line.includes('全文')) return true;
    if (!bareNum) return false;
    return (
      line.includes(`第${bareNum}條`) ||
      line.includes(`第 ${bareNum} 條`) ||
      line.includes(`、${bareNum}、`) ||
      line.includes(`、${bareNum}條`)
    );
  });

  const pickedLines =
    relevantLines.length > 0
      ? relevantLines.slice(-3).reverse()
      : rawLines.slice(-2).reverse();

  if (pickedLines.length === 0) {
    return [
      {
        id: `amd-${lawName}-${articleNumber}-latest`,
        rocYear: rocYearLabel,
        date: fullRocDate,
        versionLabel: `${lawName} 現行公布條文`,
        changeType: '修正',
        previousText: `（全國法規資料庫收錄之修法前條文，詳見《${lawName}》立法沿革）`,
        updatedText: currentText,
        whatChangedPlain: `現行有效之《${lawName}》${articleNumber} 規定。`,
        whyChangedPlain: `配合社會發展與法制實務需求修正公布，確保《${lawName}》規範周延。`,
        addedSummary: `明定 ${articleNumber} 現行規範內容。`,
        removedSummary: '修正舊法文字與構成要件。',
        reason: `全國法規資料庫《${lawName}》法定沿革紀錄。`,
      },
    ];
  }

  return pickedLines.map((line, idx) => {
    const rocMatch = line.match(
      /中華民國([一二三四五六七八九十百零\d]+)年([一二三四五六七八九十\d]+)月([一二三四五六七八九十\d]+)日/
    );
    const yearStr = rocMatch ? `民國 ${rocMatch[1]} 年` : rocYearLabel;
    const dateStr = rocMatch
      ? `民國 ${rocMatch[1]} 年 ${rocMatch[2]} 月 ${rocMatch[3]} 日公布`
      : fullRocDate;
    const isEnactment = line.includes('制定公布');
    const isAddition = line.includes('增訂');

    return {
      id: `amd-${lawName}-${articleNumber}-${idx}`,
      rocYear: yearStr,
      date: dateStr,
      versionLabel: idx === 0 ? `${yearStr}最新公布版（現行條文）` : `${yearStr}歷次修法紀錄`,
      changeType: isEnactment || isAddition ? '增訂' : '修正',
      previousText:
        idx === 0
          ? `（修法沿革紀錄：${line}）`
          : `（早期條文沿革紀錄：${line}）`,
      updatedText: currentText,
      whatChangedPlain: line,
      whyChangedPlain: isEnactment
        ? `正式制定公布《${lawName}》，建立我國該領域之基礎法制規範。`
        : `立法院針對《${lawName}》進行條文修正與法制現代化調整，以符合實務運作與保障人民權益。`,
      addedSummary: line,
      removedSummary: isEnactment ? '無（制定公布）' : '調整修正前之舊條文規範。',
      reason: line,
    };
  });
}

export function matchTermsInArticleText(
  text: string,
  category: Exclude<LawCategory, '全部法規'>,
  allTerms: LegalTerm[]
): string[] {
  const matchedIds: string[] = [];
  for (const term of allTerms) {
    const kws = term.keywords && term.keywords.length > 0 ? term.keywords : [term.name];
    if (kws.some((kw) => kw.length >= 2 && text.includes(kw))) {
      matchedIds.push(term.id);
    }
  }
  if (matchedIds.length === 0) {
    const fallback = allTerms.find((t) => t.category === category) || allTerms[0];
    if (fallback) matchedIds.push(fallback.id);
  }
  return Array.from(new Set(matchedIds)).slice(0, 5);
}

interface RawMojLawJson {
  法規名稱?: string;
  法規類別?: string;
  最新異動日期?: string;
  生效狀態?: string;
  生效內容?: string;
  沿革內容?: string;
  法規內容?: Array<{
    編章節?: string;
    條號?: string;
    條文內容?: string;
  }>;
}

export async function fetchFullRocLawDocument(
  pcode: string,
  existingCuratedArticles: LegalArticle[],
  allTerms: LegalTerm[]
): Promise<RocLawFullDocument> {
  const cachedDoc = cachedLawDocumentsByPCode.get(pcode);
  if (cachedDoc) {
    return cachedDoc;
  }

  const res = await fetch(
    `https://raw.githubusercontent.com/kong0107/mojLawSplitJSON/master/FalVMingLing/${pcode}.json`
  );
  if (!res.ok) {
    throw new Error(`無法載入法規代碼 ${pcode} (HTTP ${res.status})`);
  }

  const data = (await res.json()) as RawMojLawJson;
  const lawTitle = data.法規名稱 || pcode;
  const category = inferLawCategory(lawTitle, pcode);
  const { isoDate, rocYearLabel, rocDotDate } = formatMojDate(data.最新異動日期);
  const rawItems = data.法規內容 || [];
  const historyStr = data.沿革內容 || '';
  const enactedDateRoc = parseFirstEnactedRocDotDate(historyStr, rocDotDate);

  const rawCategoryPath = (data.法規類別 || '行政＞法務部＞法律事務目').replace(/＞/g, ' ＞ ');
  const effectiveDetailRaw = (data.生效內容 || '').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
  const effectiveStatusNotice = effectiveDetailRaw
    ? `※本法規部分或全部條文尚未生效，最後生效日期：未定 ↗ ${effectiveDetailRaw}`
    : '';

  let currentPart = '';
  let currentChapter = '';
  const converted: LegalArticle[] = [];

  // Track Parts ("第 X 編 ...") and Chapters ("第 X 章 ...") for the structured index
  const partGroupsMap = new Map<string, RocLawPartGroup>();

  const ensurePartGroup = (partLabel: string): RocLawPartGroup => {
    const key = partLabel || '本法章節';
    let grp = partGroupsMap.get(key);
    if (!grp) {
      grp = {
        partTitle: key,
        firstArticleId: '',
        chapters: [],
      };
      partGroupsMap.set(key, grp);
    }
    return grp;
  };

  let pendingChaptersWithoutArticle: RocLawChapterPill[] = [];

  for (const item of rawItems) {
    if (item.編章節) {
      const normalized = item.編章節.replace(/\s+/g, ' ').trim();
      // Normalize spacing in "第 一 編 總則" -> "第一編 總則"
      const compactHeading = normalized.replace(
        /^第\s*([一二三四五六七八九十百零\d\-之]+)\s*([編章節款目])\s*/,
        '第$1$2 '
      );

      if (/^第[一二三四五六七八九十百零\d\-之]+編/.test(compactHeading)) {
        currentPart = compactHeading;
        currentChapter = '';
        ensurePartGroup(currentPart);
      } else if (/^第[一二三四五六七八九十百零\d\-之]+章/.test(compactHeading)) {
        currentChapter = compactHeading;
        const grp = ensurePartGroup(currentPart || '章節索引');
        const shortTitle = compactHeading.replace(/^第[一二三四五六七八九十百零\d\-之]+章\s*/, '').trim() || compactHeading;
        const pill: RocLawChapterPill = {
          index: grp.chapters.length + 1,
          fullChapterTitle: compactHeading,
          shortChapterTitle: shortTitle,
          firstArticleId: '',
        };
        grp.chapters.push(pill);
        pendingChaptersWithoutArticle.push(pill);
      } else {
        // Section (節) or other sub-heading: keep currentPart and currentChapter
        if (!currentChapter) {
          currentChapter = compactHeading;
        }
      }
      continue;
    }

    if (!item.條號 || !item.條文內容) continue;

    const artNum = item.條號.trim();
    const rawContent = item.條文內容.replace(/\r\n/g, '\n').trim();

    const curated = existingCuratedArticles.find(
      (c) =>
        (c.pcode === pcode ||
          c.specificLawTitle.includes(lawTitle) ||
          lawTitle.includes(c.specificLawTitle.replace(/（.*）/, '').replace('中華民國', ''))) &&
        (c.articleNumber === artNum || c.articleNumber.startsWith(`${artNum}（`))
    );

    let articleObj: LegalArticle;

    if (curated) {
      articleObj = {
        ...curated,
        pcode,
        partTitle: currentPart || curated.partTitle,
        chapter: currentChapter || curated.chapter,
      };
    } else {
      const {
        title,
        summaryCallout,
        qaPrompt,
        qaShortAnswer,
        plainExplanation,
        applicabilityScope,
        practicalExample,
      } = synthesizePlainExplanationForArticle(
        lawTitle,
        currentChapter || currentPart || lawTitle,
        artNum,
        rawContent
      );

      const matchedTermIds = matchTermsInArticleText(rawContent, category, allTerms);
      const amendments = parseMojLawHistoryToAmendments(
        lawTitle,
        artNum,
        rawContent,
        historyStr,
        data.最新異動日期 || '20240101'
      );

      const artId = `moj-${pcode}-${artNum.replace(/[^0-9\-之]/g, '') || converted.length}`;

      articleObj = {
        id: artId,
        lawName: category,
        specificLawTitle: lawTitle,
        pcode,
        partTitle: currentPart || undefined,
        chapter: currentChapter || currentPart || lawTitle,
        articleNumber: artNum,
        title,
        currentText: rawContent,
        summaryCallout,
        qaPrompt,
        qaShortAnswer,
        plainExplanation,
        applicabilityScope,
        requirements: {
          subjective: `依《${lawTitle}》${artNum} 規範之主體與主觀要件認定。`,
          objective: rawContent.split('\n')[0] || rawContent,
          legalEffect: `發生《${lawTitle}》${artNum} 所定之法律效果。`,
        },
        termIds: matchedTermIds,
        crossReferences: [],
        amendments,
        practicalExample,
        lastUpdated: isoDate,
        lastAmendedYear: amendments[0]?.rocYear.split('（')[0] || rocYearLabel,
      };
    }

    converted.push(articleObj);

    if (currentPart) {
      const grp = ensurePartGroup(currentPart);
      if (!grp.firstArticleId) {
        grp.firstArticleId = articleObj.id;
      }
    }
    if (pendingChaptersWithoutArticle.length > 0) {
      for (const chPill of pendingChaptersWithoutArticle) {
        chPill.firstArticleId = articleObj.id;
      }
      pendingChaptersWithoutArticle = [];
    }
  }

  for (let i = 0; i < converted.length; i++) {
    const current = converted[i];
    if (current.crossReferences.length === 0) {
      if (i + 1 < converted.length) {
        const nextArt = converted[i + 1];
        current.crossReferences.push({
          targetArticleId: nextArt.id,
          relationType: '構成要件補充',
          description: `同章節相鄰條文：${nextArt.specificLawTitle} ${nextArt.articleNumber}（${nextArt.title}）`,
        });
      }
      if (i > 0) {
        const prevArt = converted[i - 1];
        current.crossReferences.push({
          targetArticleId: prevArt.id,
          relationType: '依前條規定',
          description: `前條關聯規範：${prevArt.specificLawTitle} ${prevArt.articleNumber}（${prevArt.title}）`,
        });
      }
    }
  }

  const doc: RocLawFullDocument = {
    pcode,
    lawName: lawTitle,
    category,
    lawCategoryPath: rawCategoryPath,
    enactedDateRoc,
    lastModifiedDateRoc: rocDotDate,
    effectiveStatusLabel: data.生效狀態 || '生效',
    effectiveStatusDetail: effectiveStatusNotice,
    officialUrl: `https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=${pcode}`,
    partGroups: Array.from(partGroupsMap.values()).filter(
      (g) => g.chapters.length > 0 || g.firstArticleId
    ),
    articles: converted,
  };

  cachedLawDocumentsByPCode.set(pcode, doc);
  return doc;
}

export async function fetchFullRocLawArticles(
  pcode: string,
  existingCuratedArticles: LegalArticle[],
  allTerms: LegalTerm[]
): Promise<{
  lawName: string;
  category: Exclude<LawCategory, '全部法規'>;
  articles: LegalArticle[];
}> {
  const doc = await fetchFullRocLawDocument(pcode, existingCuratedArticles, allTerms);
  return {
    lawName: doc.lawName,
    category: doc.category,
    articles: doc.articles,
  };
}
