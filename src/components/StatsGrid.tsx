import React from 'react';
import { Files, FolderTree, HardDrive, ShieldAlert, Code2, Binary } from 'lucide-react';
import { ScanStats, GitInfo } from '../types';

interface StatsGridProps {
  stats: ScanStats;
  gitInfo: GitInfo;
  projectName: string;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats, gitInfo, projectName }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {/* Total Files */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">Total Files</span>
          <Files className="w-4 h-4 text-blue-400" />
        </div>
        <div className="mt-2">
          <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">{stats.totalFiles}</div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
            <span>{stats.textFiles} text</span>
            <span>•</span>
            <span>{stats.binaryFiles} bin</span>
          </div>
        </div>
      </div>

      {/* Total Directories */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">Directories</span>
          <FolderTree className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="mt-2">
          <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">{stats.totalDirectories}</div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate" title={projectName}>
            {projectName}
          </div>
        </div>
      </div>

      {/* Total Size */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">Total Size</span>
          <HardDrive className="w-4 h-4 text-purple-400" />
        </div>
        <div className="mt-2">
          <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">{stats.totalSizeHuman}</div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
            {stats.totalSizeBytes.toLocaleString()} bytes
          </div>
        </div>
      </div>

      {/* Languages */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">Languages</span>
          <Code2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="mt-2">
          <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {Object.keys(stats.languages).length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
            {Object.keys(stats.languages).slice(0, 2).join(', ') || 'None'}
          </div>
        </div>
      </div>

      {/* Secret Detections */}
      <div className={`border rounded-xl p-3.5 sm:p-4 flex flex-col justify-between transition ${
        stats.secretDetections > 0
          ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
          : 'bg-slate-900/90 border-slate-800 text-slate-300'
      }`}>
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">Secret Alerts</span>
          <ShieldAlert className={`w-4 h-4 ${stats.secretDetections > 0 ? 'text-amber-400' : 'text-emerald-400'}`} />
        </div>
        <div className="mt-2">
          <div className={`text-xl sm:text-2xl font-bold tracking-tight ${
            stats.secretDetections > 0 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {stats.secretDetections}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {stats.secretDetections > 0 ? 'Auto-concealed' : 'Clean scan'}
          </div>
        </div>
      </div>

      {/* Git Status */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-medium">Git Branch</span>
          <Binary className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="mt-2">
          <div className="text-base sm:text-lg font-bold text-white tracking-tight truncate font-mono">
            {gitInfo.isRepository ? (gitInfo.branch || 'main') : 'No Git'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-mono truncate">
            {gitInfo.shortCommit || (gitInfo.isRepository ? 'tracked' : 'untracked')}
          </div>
        </div>
      </div>
    </div>
  );
};
