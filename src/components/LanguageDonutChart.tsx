import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Layers } from 'lucide-react';

interface LanguageDatum {
  language: string;
  count: number;
  percentage: number;
  color: string;
}

interface LanguageDonutChartProps {
  languages: Record<string, number>;
  totalFiles: number;
}

// Preset color map for common programming languages
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f7df1e',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  JSON: '#292929',
  Markdown: '#083fa1',
  SQL: '#e38c00',
  Shell: '#89e051',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  YAML: '#cb171e',
  Dockerfile: '#384d54',
  GraphQL: '#e10098',
};

const DEFAULT_PALETTE = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#f43f5e', // rose
  '#84cc16', // lime
];

export const LanguageDonutChart: React.FC<LanguageDonutChartProps> = ({
  languages,
  totalFiles,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredLang, setHoveredLang] = useState<LanguageDatum | null>(null);

  // Prepare data array sorted by count descending
  const data: LanguageDatum[] = useMemo(() => {
    const entries = Object.entries(languages).filter(([_, count]) => count > 0);
    entries.sort((a, b) => b[1] - a[1]);

    return entries.map(([lang, count], index) => {
      const percentage = totalFiles > 0 ? (count / totalFiles) * 100 : 0;
      const color = LANGUAGE_COLORS[lang] || DEFAULT_PALETTE[index % DEFAULT_PALETTE.length];
      return {
        language: lang,
        count,
        percentage,
        color,
      };
    });
  }, [languages, totalFiles]);

  const activeFocus = hoveredLang || data[0] || null;

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const width = 260;
    const height = 260;
    const radius = Math.min(width, height) / 2;
    const innerRadius = radius * 0.62; // Donut hole size
    const outerRadius = radius * 0.95;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // clear previous renders

    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', '100%');

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // D3 Pie Generator
    const pie = d3
      .pie<LanguageDatum>()
      .value((d) => d.count)
      .sort(null)
      .padAngle(0.03);

    // D3 Arc Generators
    const arc = d3
      .arc<d3.PieArcDatum<LanguageDatum>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .cornerRadius(4);

    const arcHover = d3
      .arc<d3.PieArcDatum<LanguageDatum>>()
      .innerRadius(innerRadius - 3)
      .outerRadius(outerRadius + 6)
      .cornerRadius(5);

    // Draw Slices
    const arcs = g
      .selectAll('.arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');

    arcs
      .append('path')
      .attr('d', (d) => arc(d) || '')
      .attr('fill', (d) => d.data.color)
      .attr('stroke', '#090d16')
      .attr('stroke-width', '2px')
      .style('cursor', 'pointer')
      .style('transition', 'all 0.2s ease-out')
      .on('mouseenter', function (_event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('d', () => arcHover(d) || '')
          .style('opacity', '1')
          .style('filter', 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.4))');
        setHoveredLang(d.data);
      })
      .on('mouseleave', function (_event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('d', () => arc(d) || '')
          .style('opacity', '0.95')
          .style('filter', 'none');
        setHoveredLang(null);
      });

  }, [data]);

  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-slate-500">
        No language metrics available to plot.
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Language Composition Donut
            </h3>
            <span className="text-[11px] text-slate-400">
              Interactive D3.js proportional breakdown
            </span>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400">
          {data.length} {data.length === 1 ? 'language' : 'languages'}
        </div>
      </div>

      {/* Main Donut + Legend Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Donut Chart Container */}
        <div
          ref={containerRef}
          className="md:col-span-6 flex items-center justify-center relative p-2"
        >
          <div className="w-[230px] h-[230px] sm:w-[260px] sm:h-[260px] relative flex items-center justify-center">
            <svg ref={svgRef} className="w-full h-full drop-shadow-md" />

            {/* Central Info Badge inside Donut Hole */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-3 select-none">
              {activeFocus ? (
                <>
                  <div
                    className="w-2.5 h-2.5 rounded-full mb-1"
                    style={{ backgroundColor: activeFocus.color }}
                  />
                  <div className="text-sm font-bold text-white tracking-wide truncate max-w-[120px]">
                    {activeFocus.language}
                  </div>
                  <div className="text-xl font-extrabold font-mono text-indigo-300">
                    {activeFocus.percentage.toFixed(1)}%
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {activeFocus.count} {activeFocus.count === 1 ? 'file' : 'files'}
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-400">Hover slice</div>
              )}
            </div>
          </div>
        </div>

        {/* Legend Column */}
        <div className="md:col-span-6 space-y-2 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
          {data.map((item) => {
            const isHovered = hoveredLang?.language === item.language;
            return (
              <div
                key={item.language}
                onMouseEnter={() => setHoveredLang(item)}
                onMouseLeave={() => setHoveredLang(null)}
                className={`p-2 rounded-lg border transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer ${
                  isHovered
                    ? 'bg-slate-950 border-indigo-500/50 ring-1 ring-indigo-500/30'
                    : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-950/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-3 h-3 rounded-sm shrink-0 shadow-sm"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs font-semibold text-slate-200 truncate">
                    {item.language}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono shrink-0">
                  <span className="text-slate-400">{item.count} files</span>
                  <span className="font-bold text-indigo-300 w-12 text-right">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LanguageDonutChart;
