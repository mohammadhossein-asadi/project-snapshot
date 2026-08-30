import React, { useState, useMemo } from 'react';
import {
  Code2,
  FileCode2,
  Scale,
  Sparkles,
  AlertTriangle,
  ArrowUpDown,
  BookOpen,
  GitPullRequest,
  Activity,
} from 'lucide-react';
import { ScanStats, ScannedFile, GitInfo } from '../types';
import { formatBytes } from '../lib/output';
import { generateProjectQualityReport } from '../lib/quality';
import { LanguageDonutChart } from './LanguageDonutChart';
import { ActivityHeatmap } from './ActivityHeatmap';

interface AnalyticsViewProps {
  stats: ScanStats;
  files?: ScannedFile[];
  gitInfo?: GitInfo;
  onSelectFile?: (path: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  stats,
  files = [],
  gitInfo,
  onSelectFile,
}) => {
  const [qualitySearch, setQualitySearch] = useState('');
  const [sortField, setSortField] = useState<
    'complexity' | 'coverage' | 'loc' | 'maintainability' | 'grade'
  >('complexity');
  const [sortAsc, setSortAsc] = useState(false);

  const maxLangCount = Math.max(...Object.values(stats.languages), 1);
  const maxExtCount = Math.max(...Object.values(stats.extensions), 1);

  // Compute code quality report
  const qualityReport = useMemo(() => {
    return generateProjectQualityReport(files);
  }, [files]);

  // Filter and sort file scores
  const sortedFileScores = useMemo(() => {
    let result = [...qualityReport.allFileScores];
    if (qualitySearch.trim()) {
      const q = qualitySearch.toLowerCase();
      result = result.filter(
        (f) => f.path.toLowerCase().includes(q) || f.language.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'complexity':
          comparison = a.cyclomaticComplexity - b.cyclomaticComplexity;
          break;
        case 'coverage':
          comparison = a.documentationCoverage - b.documentationCoverage;
          break;
        case 'loc':
          comparison = a.linesOfCode - b.linesOfCode;
          break;
        case 'maintainability':
          comparison = a.maintainabilityIndex - b.maintainabilityIndex;
          break;
        case 'grade':
          comparison = a.grade.localeCompare(b.grade);
          break;
      }
      return sortAsc ? comparison : -comparison;
    });

    return result;
  }, [qualityReport.allFileScores, qualitySearch, sortField, sortAsc]);

  const handleSort = (field: 'complexity' | 'coverage' | 'loc' | 'maintainability' | 'grade') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'B':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'C':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'D':
      case 'F':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Code Quality Score & Health Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  Code Quality & Maintainability Score
                </h3>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getGradeBadge(qualityReport.overallGrade)}`}>
                  Grade {qualityReport.overallGrade}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluated based on cyclomatic branching complexity, documentation density, and modularity
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl font-extrabold font-mono text-indigo-300">
                {qualityReport.overallScore}<span className="text-xs font-normal text-slate-400">/100</span>
              </div>
              <div className="text-[11px] text-slate-400">Maintainability Index</div>
            </div>
          </div>
        </div>

        {/* Quality Metric Gauges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5 flex flex-col">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Avg Complexity</span>
              <GitPullRequest className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-lg font-bold font-mono text-white">
              {qualityReport.avgComplexity}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {qualityReport.avgComplexity <= 5 ? '🟢 Low (Optimal)' : qualityReport.avgComplexity <= 12 ? '🟡 Moderate' : '🔴 High'}
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5 flex flex-col">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Doc Coverage</span>
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-lg font-bold font-mono text-emerald-400">
              {qualityReport.avgDocumentationCoverage}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {qualityReport.totalCommentLines} comments / {qualityReport.totalLinesOfCode} LOC
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5 flex flex-col">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Refactor Alerts</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-lg font-bold font-mono text-amber-400">
              {qualityReport.filesNeedingRefactor.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Files needing attention
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5 flex flex-col">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>High Complexity</span>
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-lg font-bold font-mono text-purple-300">
              {qualityReport.highComplexityFilesCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Files with score &gt; 15
            </div>
          </div>
        </div>

        {/* Refactoring Recommendations List */}
        {qualityReport.recommendations.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-800/60 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Actionable Refactoring Recommendations
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {qualityReport.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/80 border border-slate-800 p-3 rounded-lg flex items-start gap-2.5"
                >
                  <AlertTriangle
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      rec.severity === 'critical'
                        ? 'text-rose-400'
                        : rec.severity === 'warning'
                        ? 'text-amber-400'
                        : 'text-blue-400'
                    }`}
                  />
                  <div className="space-y-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-200">{rec.title}</div>
                    <div className="text-[11px] text-slate-400 leading-relaxed">
                      {rec.description}
                    </div>
                    {rec.file && onSelectFile && (
                      <button
                        onClick={() => onSelectFile(rec.file!)}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-mono underline inline-block cursor-pointer pt-0.5"
                      >
                        Inspect {rec.file} &rarr;
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Files Quality & Complexity Breakdown Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              File Complexity & Quality Grades
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
              {sortedFileScores.length} scored files
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={qualitySearch}
              onChange={(e) => setQualitySearch(e.target.value)}
              placeholder="Filter scored files..."
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-2.5 px-3">File Path</th>
                <th className="py-2.5 px-3">Language</th>
                <th
                  onClick={() => handleSort('complexity')}
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-200 select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Complexity</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('coverage')}
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-200 select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Docs %</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('loc')}
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-200 select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Lines</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('maintainability')}
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-slate-200 select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Index</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('grade')}
                  className="py-2.5 px-3 text-center cursor-pointer hover:text-slate-200 select-none"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Grade</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {sortedFileScores.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-slate-500">
                    No files found matching criteria.
                  </td>
                </tr>
              ) : (
                sortedFileScores.map((score) => (
                  <tr key={score.path} className="hover:bg-slate-950/40 transition">
                    <td className="py-2 px-3 text-slate-200 truncate max-w-xs font-semibold">
                      <div className="flex items-center gap-1.5">
                        {score.needsRefactoring && (
                          <span title={score.refactorReasons.join('; ')}>
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          </span>
                        )}
                        <span title={score.path}>{score.path}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-slate-400">{score.language}</td>
                    <td className="py-2 px-3 text-right font-semibold">
                      <span
                        className={
                          score.cyclomaticComplexity > 15
                            ? 'text-rose-400'
                            : score.cyclomaticComplexity > 7
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }
                      >
                        {score.cyclomaticComplexity}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className={score.documentationCoverage < 10 ? 'text-amber-400' : 'text-slate-300'}>
                        {score.documentationCoverage}%
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right text-slate-400">
                      {score.linesOfCode}
                    </td>
                    <td className="py-2 px-3 text-right text-indigo-300 font-semibold">
                      {score.maintainabilityIndex}/100
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${getGradeBadge(score.grade)}`}>
                        {score.grade}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      {onSelectFile && (
                        <button
                          onClick={() => onSelectFile(score.path)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-blue-400 hover:text-blue-300 transition cursor-pointer"
                          title="Open file in inspector"
                        >
                          Inspect
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Timeline Heatmap based on Git Commit History */}
      <ActivityHeatmap
        files={files}
        gitInfo={gitInfo}
      />

      {/* Language Composition Donut Chart using D3.js */}
      <LanguageDonutChart
        languages={stats.languages}
        totalFiles={stats.totalFiles}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Language Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Code2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Languages Breakdown
            </h3>
          </div>

          {Object.keys(stats.languages).length === 0 ? (
            <div className="text-xs text-slate-500 py-8 text-center">
              No known code languages identified.
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.languages).map(([lang, count]) => {
                const percent = ((count / stats.totalFiles) * 100).toFixed(1);
                const barWidth = `${(count / maxLangCount) * 100}%`;
                return (
                  <div key={lang} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-200">{lang}</span>
                      <span className="text-slate-400 font-mono">
                        {count} files ({percent}%)
                      </span>
                    </div>
                    <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                        style={{ width: barWidth }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* File Extensions Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <FileCode2 className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              File Extensions
            </h3>
          </div>

          {Object.keys(stats.extensions).length === 0 ? (
            <div className="text-xs text-slate-500 py-8 text-center">
              No extensions detected.
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.extensions).slice(0, 10).map(([ext, count]) => {
                const barWidth = `${(count / maxExtCount) * 100}%`;
                return (
                  <div key={ext} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-200">{ext}</span>
                      <span className="text-slate-400 font-mono">{count}</span>
                    </div>
                    <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full transition-all duration-500"
                        style={{ width: barWidth }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Largest Files Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Scale className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Top 15 Largest Files
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-2 px-3">Path</th>
                  <th className="py-2 px-3 text-right">Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {stats.largestFiles.slice(0, 15).map((lf, idx) => (
                  <tr key={idx} className="hover:bg-slate-950/40 transition">
                    <td className="py-2 px-3 text-slate-200 truncate max-w-md">{lf.path}</td>
                    <td className="py-2 px-3 text-right text-purple-400 font-semibold">{formatBytes(lf.size)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
