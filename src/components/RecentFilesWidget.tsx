import React, { useState, useMemo } from 'react';
import {
  Flame,
  GitCommit,
  Clock,
  User,
  Plus,
  Minus,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FileCode,
} from 'lucide-react';
import { ScannedFile, GitInfo } from '../types';
import { getHotFiles, HotFileItem } from '../lib/git';

interface RecentFilesWidgetProps {
  files: ScannedFile[];
  gitInfo?: GitInfo;
  onSelectFile: (path: string) => void;
}

export const RecentFilesWidget: React.FC<RecentFilesWidgetProps> = ({
  files,
  gitInfo,
  onSelectFile,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const hotFiles: HotFileItem[] = useMemo(() => {
    return getHotFiles(files, gitInfo, 6);
  }, [files, gitInfo]);

  if (hotFiles.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg transition-all duration-300">
      {/* Header Bar */}
      <div className="p-3.5 sm:p-4 flex items-center justify-between flex-wrap gap-2 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                Recent & Hot Files
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-mono border border-amber-500/20 font-semibold">
                Git Activity Hub
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Frequently modified modules and active working areas based on commit timeline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
            {hotFiles.length} hot files identified
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition cursor-pointer"
            title={isExpanded ? 'Collapse widget' : 'Expand widget'}
          >
            <span className="text-[11px] font-medium">{isExpanded ? 'Collapse' : 'Expand'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Grid Content */}
      {isExpanded && (
        <div className="p-3.5 sm:p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in duration-200">
          {hotFiles.map((item, idx) => (
            <div
              key={item.file.path}
              onClick={() => onSelectFile(item.file.path)}
              className="group bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-blue-500/50 rounded-lg p-3 flex flex-col justify-between gap-2.5 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-blue-500/5"
            >
              {/* File Title and Language Badge */}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="flex items-center justify-center w-4 h-4 rounded text-[10px] font-bold font-mono bg-slate-800 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition">
                      {idx + 1}
                    </span>
                    <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span
                      className="text-xs font-semibold font-mono text-slate-200 group-hover:text-blue-300 transition truncate"
                      title={item.file.path}
                    >
                      {item.file.name}
                    </span>
                  </div>

                  {item.file.language && item.file.language !== 'Unknown' && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 font-medium font-mono border border-blue-500/20 shrink-0">
                      {item.file.language}
                    </span>
                  )}
                </div>

                <div className="text-[10px] font-mono text-slate-400 truncate pl-5" title={item.file.path}>
                  {item.file.path}
                </div>
              </div>

              {/* Commit Message & Stats */}
              <div className="bg-slate-900/90 rounded-md p-2 border border-slate-850 space-y-1.5">
                <div className="flex items-start gap-1.5 text-[11px] text-slate-300">
                  <GitCommit className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
                  <span className="truncate leading-tight font-medium" title={item.latestCommit.message}>
                    {item.latestCommit.message}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-slate-500" />
                      <span>{item.relativeTime}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <User className="w-2.5 h-2.5 text-slate-500" />
                      <span className="truncate max-w-[70px]">{item.latestCommit.author.split(' ')[0]}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    <span className="text-emerald-400 flex items-center">
                      <Plus className="w-2.5 h-2.5" />
                      {item.latestCommit.insertions}
                    </span>
                    <span className="text-rose-400 flex items-center">
                      <Minus className="w-2.5 h-2.5" />
                      {item.latestCommit.deletions}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer action bar */}
              <div className="flex items-center justify-between pt-0.5 text-[11px]">
                <span className="text-[10px] text-slate-400 font-mono">
                  {item.totalCommits} commits recorded
                </span>

                <span className="text-blue-400 group-hover:text-blue-300 font-medium flex items-center gap-1 text-[11px]">
                  <span>Inspect</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentFilesWidget;
