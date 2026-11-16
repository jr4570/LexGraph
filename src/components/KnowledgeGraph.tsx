import React, { useMemo, useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  GraphNode,
  LegalArticle,
  LegalTerm,
  SubgraphResult,
} from '../types/legal';
import { buildLegalSubgraph } from '../utils/legalEngine';

interface KnowledgeGraphProps {
  selectedArticle: LegalArticle;
  allArticles: LegalArticle[];
  allTerms: LegalTerm[];
  subgraph?: SubgraphResult;
  focalType?: 'article' | 'term';
  selectedTerm?: LegalTerm | null;
  depth?: 1 | 2;
  onChangeDepth?: (depth: 1 | 2) => void;
  onSelectArticle: (article: LegalArticle) => void;
  onSelectTerm: (term: LegalTerm) => void;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  selectedArticle,
  allArticles,
  allTerms,
  subgraph: externalSubgraph,
  focalType = 'article',
  selectedTerm = null,
  depth: externalDepth,
  onChangeDepth,
  onSelectArticle,
  onSelectTerm,
}) => {
  const [internalDepth, setInternalDepth] = useState<1 | 2>(1);
  const depth = externalDepth ?? internalDepth;
  const handleDepthChange = (d: 1 | 2) => {
    setInternalDepth(d);
    onChangeDepth?.(d);
  };

  const [zoom, setZoom] = useState<number>(1);
  const [filterMode, setFilterMode] = useState<'all' | 'articles' | 'terms'>('all');

  const computedSubgraph = useMemo(() => {
    if (externalSubgraph) return externalSubgraph;
    return buildLegalSubgraph(allArticles, allTerms, {
      focalId: focalType === 'term' && selectedTerm ? selectedTerm.id : selectedArticle.id,
      focalType,
      depth,
    });
  }, [externalSubgraph, allArticles, allTerms, focalType, selectedTerm, selectedArticle.id, depth]);

  const visibleNodes = computedSubgraph.nodes.filter((n) => {
    if (n.isFocal) return true;
    if (filterMode === 'articles') return n.type === 'article';
    if (filterMode === 'terms') return n.type === 'term';
    return true;
  });

  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));
  const visibleEdges = computedSubgraph.edges.filter(
    (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
  );

  const nodeById = new Map<string, GraphNode>(visibleNodes.map((n) => [n.id, n]));

  const handleNodeInteraction = (node: GraphNode) => {
    if (node.type === 'article') {
      const targetArt = allArticles.find((a) => a.id === node.id);
      if (targetArt) onSelectArticle(targetArt);
    } else {
      const targetTerm = allTerms.find((t) => t.id === node.id);
      if (targetTerm) onSelectTerm(targetTerm);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Interactive Graph Stage Card */}
      <section
        aria-label="法規與名詞關聯知識圖譜"
        className="bg-white border border-[#E5DFD3] rounded-xl overflow-hidden"
      >
        <div className="px-3.5 py-2.5 border-b border-[#EFECE6] bg-[#FAF8F5] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px] text-[#8A8175]">
            <span className="font-mono">{visibleNodes.length} 節點</span>
            <span>·</span>
            <span className="font-mono">{visibleEdges.length} 關聯</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center bg-[#EFECE6] p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => handleDepthChange(1)}
                className={`px-2 py-0.5 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                  depth === 1
                    ? 'bg-white text-[#1A1D24] shadow-2xs'
                    : 'text-[#6E6559] hover:text-[#1A1D24]'
                }`}
              >
                1 階
              </button>
              <button
                type="button"
                onClick={() => handleDepthChange(2)}
                className={`px-2 py-0.5 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                  depth === 2
                    ? 'bg-white text-[#1A1D24] shadow-2xs'
                    : 'text-[#6E6559] hover:text-[#1A1D24]'
                }`}
              >
                2 階
              </button>
            </div>

            <div className="flex items-center bg-[#EFECE6] p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2 py-0.5 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-white text-[#1A1D24] shadow-2xs'
                    : 'text-[#6E6559] hover:text-[#1A1D24]'
                }`}
              >
                全部
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('articles')}
                className={`px-2 py-0.5 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                  filterMode === 'articles'
                    ? 'bg-white text-[#1A1D24] shadow-2xs'
                    : 'text-[#6E6559] hover:text-[#1A1D24]'
                }`}
              >
                法條
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('terms')}
                className={`px-2 py-0.5 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                  filterMode === 'terms'
                    ? 'bg-white text-[#1A1D24] shadow-2xs'
                    : 'text-[#6E6559] hover:text-[#1A1D24]'
                }`}
              >
                名詞
              </button>
            </div>

            <div className="flex items-center gap-0.5 border border-[#E5DFD3] bg-white rounded-lg p-0.5">
              <button
                type="button"
                aria-label="縮小圖譜"
                onClick={() => setZoom((z) => Math.max(0.75, Number((z - 0.15).toFixed(2))))}
                className="p-1 text-[#6E6559] hover:text-[#1A1D24] rounded cursor-pointer"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <button
                type="button"
                aria-label="放大圖譜"
                onClick={() => setZoom((z) => Math.min(1.45, Number((z + 0.15).toFixed(2))))}
                className="p-1 text-[#6E6559] hover:text-[#1A1D24] rounded cursor-pointer"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        <div
          className="relative bg-[#FAF8F5] overflow-hidden select-none"
          data-testid="knowledge-graph-canvas"
        >
          <svg
            viewBox="0 0 800 460"
            className="w-full h-[290px] sm:h-[330px] block"
            role="img"
            aria-label="法條引用與法律名詞關聯視覺化圖譜"
          >
            <defs>
              <pattern
                id="archival-grid"
                width="32"
                height="32"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 32 0 L 0 0 0 32"
                  fill="none"
                  stroke="#EFECE6"
                  strokeWidth="1"
                />
              </pattern>
            </defs>

            <rect width="800" height="460" fill="url(#archival-grid)" />

            <g
              transform={`translate(400, 230) scale(${zoom}) translate(-400, -230)`}
              className="transition-transform duration-150"
            >
              <ellipse
                cx="400"
                cy="250"
                rx={depth === 2 ? 185 : 225}
                ry={depth === 2 ? 140 : 165}
                fill="none"
                stroke="#E5E0D5"
                strokeDasharray="4 4"
                strokeWidth="1"
              />

              {visibleEdges.map((edge) => {
                const sourceNode = nodeById.get(edge.source);
                const targetNode = nodeById.get(edge.target);
                if (!sourceNode || !targetNode) return null;

                const midX = (sourceNode.x + targetNode.x) / 2;
                const midY = (sourceNode.y + targetNode.y) / 2;
                const strokeColor =
                  edge.relationCategory === 'citation'
                    ? '#1F242D'
                    : edge.relationCategory === 'contrast'
                    ? '#14532D'
                    : '#C68A3E';

                const pillWidth = Math.max(58, edge.label.length * 11 + 12);

                return (
                  <g key={edge.id}>
                    <line
                      x1={sourceNode.x}
                      y1={sourceNode.y}
                      x2={targetNode.x}
                      y2={targetNode.y}
                      stroke={strokeColor}
                      strokeOpacity="0.55"
                      strokeWidth="1.75"
                    />
                    <rect
                      x={midX - pillWidth / 2}
                      y={midY - 9}
                      width={pillWidth}
                      height="18"
                      rx="4"
                      fill="#FFFFFF"
                      stroke="#E5E0D5"
                      strokeWidth="1"
                    />
                    <text
                      x={midX}
                      y={midY + 3.5}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#44403C"
                      fontWeight="600"
                    >
                      {edge.label}
                    </text>
                  </g>
                );
              })}

              {visibleNodes.map((node) => {
                const isArticle = node.type === 'article';
                const isHighlighted =
                  node.isFocal ||
                  selectedTerm?.id === node.id ||
                  (focalType === 'article' && selectedArticle.id === node.id);

                const bgFill = isArticle
                  ? isHighlighted
                    ? '#0F131A'
                    : '#FFFFFF'
                  : isHighlighted
                  ? '#C68A3E'
                  : '#FDF9F3';

                const strokeColor = isArticle ? '#0F131A' : '#C68A3E';
                const textColor = isHighlighted ? '#FFFFFF' : '#1C1917';
                const subTextColor = isHighlighted ? '#E7E5E4' : '#78716C';
                const boxWidth = node.isFocal ? 168 : 148;
                const boxHeight = node.isFocal ? 50 : 44;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => handleNodeInteraction(node)}
                    className="cursor-pointer group"
                  >
                    <rect
                      x={-boxWidth / 2}
                      y={-boxHeight / 2}
                      width={boxWidth}
                      height={boxHeight}
                      rx={isArticle ? 8 : 18}
                      fill={bgFill}
                      stroke={strokeColor}
                      strokeWidth={isHighlighted ? 2.5 : 1.5}
                    />
                    <text
                      x="0"
                      y={-4}
                      textAnchor="middle"
                      fontSize={node.isFocal ? '11.5' : '11'}
                      fontWeight="700"
                      fill={textColor}
                    >
                      {isArticle
                        ? `§ ${node.label.length > 13 ? node.label.slice(0, 13) + '…' : node.label}`
                        : `◆ ${node.label.length > 11 ? node.label.slice(0, 11) + '…' : node.label}`}
                    </text>
                    <text
                      x="0"
                      y={12}
                      textAnchor="middle"
                      fontSize="9.5"
                      fill={subTextColor}
                    >
                      {node.subLabel.length > 13
                        ? `${node.subLabel.slice(0, 13)}…`
                        : node.subLabel}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Accessible Quick-Jump Node Bar */}
        <div className="px-3.5 py-2.5 border-t border-[#EFECE6] bg-white">
          <div className="flex flex-wrap gap-1.5">
            {visibleNodes.map((node) => {
              const isArt = node.type === 'article';
              const active = node.isFocal;
              return (
                <button
                  key={`quick-${node.id}`}
                  type="button"
                  onClick={() => handleNodeInteraction(node)}
                  className={`px-2 py-1 text-[11px] rounded-md border transition-colors cursor-pointer ${
                    active
                      ? isArt
                        ? 'bg-[#0F131A] text-white border-[#0F131A] font-bold'
                        : 'bg-[#C68A3E] text-white border-[#C68A3E] font-bold'
                      : 'bg-[#FAF8F5] text-[#4A453E] border-[#E5DFD3] hover:border-[#C68A3E]'
                  }`}
                >
                  {isArt ? `§ ${node.label}` : `◆ ${node.label}`}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
