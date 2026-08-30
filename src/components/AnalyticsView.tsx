import React from 'react';
import { Code2, FileCode2, Scale } from 'lucide-react';
import { ScanStats } from '../types';
import { formatBytes } from '../lib/output';

interface AnalyticsViewProps {
  stats: ScanStats;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ stats }) => {
  const maxLangCount = Math.max(...Object.values(stats.languages), 1);
  const maxExtCount = Math.max(...Object.values(stats.extensions), 1);

  return (
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
  );
};
