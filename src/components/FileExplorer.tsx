import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  FileCode,
  Lock,
  Copy,
  Check,
  Search,
  ShieldAlert,
  Calendar,
  FileBox,
  Binary,
  X,
  Package,
  GitCommit as GitCommitIcon,
  GitBranch,
  User,
  Clock,
  Plus,
  Minus,
  Code2,
  GitCompare,
  EyeOff,
  MoreVertical,
  Undo2,
  FolderMinus,
  Trash2,
} from 'lucide-react';
import { ScannedFile, GitInfo } from '../types';
import { BreadcrumbNav } from './BreadcrumbNav';
import { getFileGitHistory } from '../lib/git';
import { DiffViewer } from './DiffViewer';

interface FileExplorerProps {
  files: ScannedFile[];
  initialSelectedPath?: string;
  globalSearch?: string;
  gitInfo?: GitInfo;
  sessionExcludedPaths?: string[];
  onQuickIgnore?: (path: string, isFolder?: boolean) => void;
  onRestoreExcludedPath?: (path: string) => void;
  onClearAllSessionExclusions?: () => void;
}

interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  file: ScannedFile;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  initialSelectedPath,
  globalSearch = '',
  gitInfo,
  sessionExcludedPaths = [],
  onQuickIgnore,
  onRestoreExcludedPath,
  onClearAllSessionExclusions,
}) => {
  const [selectedPath, setSelectedPath] = useState<string>(
    initialSelectedPath || files[0]?.path || ''
  );
  const [search, setSearch] = useState('');
  const [onlySecrets, setOnlySecrets] = useState(false);
  const [hideBinary, setHideBinary] = useState(false);
  const [hideNodeModules, setHideNodeModules] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [activeDirectoryFilter, setActiveDirectoryFilter] = useState<string | null>(null);
  const [copiedContent, setCopiedContent] = useState(false);
  const [copiedCommitHash, setCopiedCommitHash] = useState<string | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'content' | 'diff' | 'git'>('content');

  // Quick Ignore Context Menu & Toast State
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [lastIgnoredPath, setLastIgnoredPath] = useState<string | null>(null);
  const [isExclusionManagerOpen, setIsExclusionManagerOpen] = useState(false);

  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Close context menu on external click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Update selected path if initialSelectedPath changes from parent tab
  useEffect(() => {
    if (initialSelectedPath) {
      setSelectedPath(initialSelectedPath);
    }
  }, [initialSelectedPath]);

  // Keep selection valid if selected file gets ignored or filtered out
  useEffect(() => {
    if (files.length > 0 && !files.some((f) => f.path === selectedPath)) {
      setSelectedPath(files[0].path);
    }
  }, [files, selectedPath]);

  // Extract unique languages for filter dropdown
  const languages = useMemo(() => {
    const set = new Set<string>();
    files.forEach((f) => {
      if (f.language && f.language !== 'Unknown') {
        set.add(f.language);
      }
    });
    return Array.from(set).sort();
  }, [files]);

  // Filter files based on search, secrets, binary, node_modules, language, and directory
  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      if (
        hideNodeModules &&
        (f.path.includes('node_modules/') || f.path.startsWith('node_modules/'))
      ) {
        return false;
      }
      if (hideBinary && f.isBinary) {
        return false;
      }
      if (onlySecrets && !f.secretInfo.hasSecrets) {
        return false;
      }
      if (selectedLanguage !== 'all' && f.language !== selectedLanguage) {
        return false;
      }
      if (activeDirectoryFilter) {
        if (!f.path.startsWith(activeDirectoryFilter + '/')) {
          return false;
        }
      }
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = f.path.toLowerCase().includes(query);
        const matchesLang = f.language.toLowerCase().includes(query);
        return matchesName || matchesLang;
      }
      return true;
    });
  }, [
    files,
    hideNodeModules,
    hideBinary,
    onlySecrets,
    selectedLanguage,
    activeDirectoryFilter,
    search,
  ]);

  const activeFile = useMemo(() => {
    return files.find((f) => f.path === selectedPath) || filteredFiles[0] || null;
  }, [files, filteredFiles, selectedPath]);

  const activeFileGitHistory = useMemo(() => {
    if (!activeFile) return null;
    return getFileGitHistory(activeFile, gitInfo);
  }, [activeFile, gitInfo]);

  const handleContextMenu = (e: React.MouseEvent, file: ScannedFile) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: Math.min(e.clientX, window.innerWidth - 220),
      y: Math.min(e.clientY, window.innerHeight - 200),
      file,
    });
  };

  const handleTriggerQuickIgnore = (targetPath: string, isFolder = false) => {
    setContextMenu(null);
    if (onQuickIgnore) {
      onQuickIgnore(targetPath, isFolder);
      setLastIgnoredPath(targetPath);
      setTimeout(() => {
        setLastIgnoredPath((curr) => (curr === targetPath ? null : curr));
      }, 5000);
    }
  };

  const handleUndoQuickIgnore = () => {
    if (lastIgnoredPath && onRestoreExcludedPath) {
      onRestoreExcludedPath(lastIgnoredPath);
      setLastIgnoredPath(null);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleCopyCommit = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedCommitHash(hash);
      setTimeout(() => setCopiedCommitHash(null), 2000);
    } catch {
      // ignore
    }
  };

  const linesCount = activeFile?.content ? activeFile.content.split('\n').length : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col min-h-[640px] relative">
      {/* Top Breadcrumb Navigation Header */}
      <BreadcrumbNav
        filePath={activeFile?.path || ''}
        activeDirectoryFilter={activeDirectoryFilter}
        onSelectDirectory={(dir) => setActiveDirectoryFilter(dir)}
        onClearDirectoryFilter={() => setActiveDirectoryFilter(null)}
        onSelectFile={(path) => setSelectedPath(path)}
      />

      {/* Main Split Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1">
        {/* File List Column */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col bg-slate-950/60">
          {/* Search and Filters Bar */}
          <div className="p-3 border-b border-slate-800 space-y-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  globalSearch
                    ? `Global: "${globalSearch}" (or type here)`
                    : 'Search files in list...'
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Toggle Controls */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Hide node_modules toggle button */}
              <button
                onClick={() => setHideNodeModules(!hideNodeModules)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium border flex items-center gap-1 transition cursor-pointer ${
                  hideNodeModules
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
                title="Toggle hiding node_modules and vendor dependencies dynamically"
              >
                <Package className="w-3 h-3" />
                <span>{hideNodeModules ? 'Hide node_modules' : 'Show node_modules'}</span>
              </button>

              {/* Hide binary toggle button */}
              <button
                onClick={() => setHideBinary(!hideBinary)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium border flex items-center gap-1 transition cursor-pointer ${
                  hideBinary
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
                title="Toggle hiding binary files dynamically"
              >
                <Binary className="w-3 h-3" />
                <span>{hideBinary ? 'Hide Binaries' : 'Show Binaries'}</span>
              </button>

              {/* Secrets toggle button */}
              <button
                onClick={() => setOnlySecrets(!onlySecrets)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium border flex items-center gap-1 transition cursor-pointer ${
                  onlySecrets
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
                title="Filter for files containing detected secrets"
              >
                <Lock className="w-3 h-3" />
                <span>Secrets</span>
              </button>

              {/* Session Excluded Manager Badge */}
              {sessionExcludedPaths.length > 0 && (
                <button
                  onClick={() => setIsExclusionManagerOpen(!isExclusionManagerOpen)}
                  className="px-2 py-1 rounded-md text-[11px] font-medium bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 transition cursor-pointer"
                  title="View and manage session excluded files/folders"
                >
                  <EyeOff className="w-3 h-3 text-rose-400" />
                  <span>Ignored ({sessionExcludedPaths.length})</span>
                </button>
              )}
            </div>

            {/* Language dropdown */}
            <div className="flex items-center gap-2">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Languages ({languages.length})</option>
                {languages.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Session Exclusion Manager Popover / Drawer */}
          {isExclusionManagerOpen && sessionExcludedPaths.length > 0 && (
            <div className="p-3 bg-slate-950 border-b border-rose-900/40 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-rose-300 flex items-center gap-1.5">
                  <EyeOff className="w-3.5 h-3.5" />
                  Session Excluded Paths ({sessionExcludedPaths.length})
                </span>
                {onClearAllSessionExclusions && (
                  <button
                    onClick={onClearAllSessionExclusions}
                    className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
                  >
                    Restore All
                  </button>
                )}
              </div>
              <div className="max-h-32 overflow-y-auto divide-y divide-slate-800/60 font-mono text-[11px]">
                {sessionExcludedPaths.map((p) => (
                  <div key={p} className="py-1 flex items-center justify-between gap-2">
                    <span className="truncate text-slate-300" title={p}>
                      {p}
                    </span>
                    {onRestoreExcludedPath && (
                      <button
                        onClick={() => onRestoreExcludedPath(p)}
                        className="text-slate-500 hover:text-rose-400 p-0.5"
                        title="Restore this path to session"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* List items with Right-Click Context Menu Support */}
          <div className="flex-1 overflow-y-auto max-h-[500px] divide-y divide-slate-800/50 scrollbar-thin scrollbar-thumb-slate-800">
            {filteredFiles.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                <div>No files match your current filters.</div>
                {(hideNodeModules ||
                  hideBinary ||
                  activeDirectoryFilter ||
                  search ||
                  onlySecrets ||
                  sessionExcludedPaths.length > 0) && (
                  <button
                    onClick={() => {
                      setHideNodeModules(false);
                      setHideBinary(false);
                      setActiveDirectoryFilter(null);
                      setSearch('');
                      setOnlySecrets(false);
                      setSelectedLanguage('all');
                      if (onClearAllSessionExclusions) onClearAllSessionExclusions();
                    }}
                    className="text-blue-400 hover:underline text-[11px] cursor-pointer"
                  >
                    Reset all view filters & exclusions
                  </button>
                )}
              </div>
            ) : (
              filteredFiles.map((file) => {
                const isSelected = activeFile?.path === file.path;
                return (
                  <div
                    key={file.path}
                    onContextMenu={(e) => handleContextMenu(e, file)}
                    onClick={() => setSelectedPath(file.path)}
                    className={`w-full group text-left p-2.5 transition flex items-center justify-between gap-2 cursor-pointer select-none ${
                      isSelected
                        ? 'bg-blue-600/15 text-blue-300 border-l-2 border-blue-500 pl-2'
                        : 'hover:bg-slate-900/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {file.secretInfo.hasSecrets ? (
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      ) : file.isBinary ? (
                        <Binary className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      ) : (
                        <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      )}
                      <span className="text-xs font-mono truncate" title={file.path}>
                        {file.path}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-slate-400 font-mono">
                      <span>{file.sizeHuman}</span>
                      {/* Hover 3-dots context menu trigger */}
                      <button
                        onClick={(e) => handleContextMenu(e, file)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition"
                        title="Right-click or click for file actions & Quick Ignore"
                      >
                        <MoreVertical className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>
              Showing {filteredFiles.length} of {files.length} files
            </span>
            <span className="text-[10px] text-slate-500 italic hidden sm:inline">
              Right-click file to Quick Ignore
            </span>
          </div>
        </div>

        {/* File Detail & Content Column */}
        <div className="lg:col-span-8 flex flex-col bg-slate-900">
          {activeFile ? (
            <>
              {/* File info bar */}
              <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-col gap-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold font-mono text-white">
                      {activeFile.path}
                    </span>
                    {activeFile.language && activeFile.language !== 'Unknown' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium border border-blue-500/20">
                        {activeFile.language}
                      </span>
                    )}
                    {activeFile.secretInfo.hasSecrets && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium border border-amber-500/20 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        Secret Detected
                      </span>
                    )}
                  </div>

                  {/* Mode switcher tab: Source Code vs Side-by-side Diff vs Git History */}
                  <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                    <button
                      onClick={() => setActiveDetailTab('content')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                        activeDetailTab === 'content'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>Source Code</span>
                    </button>

                    <button
                      onClick={() => setActiveDetailTab('diff')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                        activeDetailTab === 'diff'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Side-by-side Git diff against previous commit state"
                    >
                      <GitCompare className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Diff Viewer</span>
                    </button>

                    <button
                      onClick={() => setActiveDetailTab('git')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                        activeDetailTab === 'git'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <GitCommitIcon className="w-3.5 h-3.5" />
                      <span>Git Timeline</span>
                      {activeFileGitHistory && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                          {activeFileGitHistory.totalCommits}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Metadata chips & Quick Ignore Button in Detail Bar */}
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-slate-400">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono">
                      Size: <strong className="text-slate-200">{activeFile.sizeHuman}</strong>
                    </span>

                    {linesCount !== null && (
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono">
                        Lines: <strong className="text-slate-200">{linesCount}</strong>
                      </span>
                    )}

                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono">
                      SHA256:{' '}
                      <strong className="text-slate-200">
                        {activeFile.sha256.substring(0, 8)}...
                      </strong>
                    </span>

                    {activeFile.modified && (
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {activeFile.modified.substring(0, 10)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Quick Ignore File Button */}
                    <button
                      onClick={() => handleTriggerQuickIgnore(activeFile.path, false)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800 transition cursor-pointer text-xs"
                      title="Quick ignore this file from current session"
                    >
                      <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                      <span>Quick Ignore</span>
                    </button>

                    <button
                      onClick={() => handleCopy(activeFile.content || '')}
                      className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium border border-slate-700 transition cursor-pointer"
                    >
                      {copiedContent ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedContent ? 'Copied' : 'Copy Source'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Detail Content Area */}
              <div className="flex-1 overflow-auto flex flex-col">
                {activeDetailTab === 'diff' ? (
                  /* Side-by-side / Accessible Diff Viewer */
                  <div className="flex-1 p-4">
                    <DiffViewer file={activeFile} gitInfo={gitInfo} />
                  </div>
                ) : activeDetailTab === 'git' ? (
                  /* Git Commit History View */
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-blue-400" />
                        <h4 className="text-sm font-semibold text-slate-200">
                          Git Version History for <span className="font-mono">{activeFile.name}</span>
                        </h4>
                      </div>
                      <span className="text-xs text-slate-400">
                        {activeFileGitHistory?.totalCommits || 0} commits affecting this file
                      </span>
                    </div>

                    {activeFileGitHistory && activeFileGitHistory.commits.length > 0 ? (
                      <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
                        {activeFileGitHistory.commits.map((commit) => (
                          <div key={commit.hash} className="relative pl-8 flex flex-col gap-1.5">
                            <div className="absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-blue-500" />
                            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex flex-col gap-2">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleCopyCommit(commit.hash)}
                                    className="font-mono text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 hover:bg-blue-500/20 transition flex items-center gap-1"
                                    title="Click to copy full commit hash"
                                  >
                                    {copiedCommitHash === commit.hash ? (
                                      <Check className="w-2.5 h-2.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-2.5 h-2.5" />
                                    )}
                                    {commit.hash.substring(0, 7)}
                                  </button>
                                  {commit.tag && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-300 font-semibold border border-purple-500/30">
                                      {commit.tag}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-400">
                                  <span className="flex items-center gap-1">
                                    <User className="w-3 h-3 text-slate-500" />
                                    {commit.author}
                                  </span>
                                  <span className="flex items-center gap-1 font-mono text-[11px]">
                                    <Clock className="w-3 h-3 text-slate-500" />
                                    {commit.relativeDate}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-slate-200 font-sans">{commit.message}</p>
                              <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-900">
                                <span className="flex items-center gap-1 text-emerald-400">
                                  <Plus className="w-3 h-3" />
                                  {commit.insertions} insertions
                                </span>
                                <span className="flex items-center gap-1 text-rose-400">
                                  <Minus className="w-3 h-3" />
                                  {commit.deletions} deletions
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-500">
                        No Git commit history available for this file.
                      </div>
                    )}
                  </div>
                ) : (
                  /* Standard Source Code Viewer */
                  <div className="flex-1 flex flex-col">
                    {activeFile.isBinary ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 space-y-3">
                        <Binary className="w-12 h-12 text-slate-600" />
                        <div className="text-sm font-medium text-slate-300">
                          Binary File Preview Unavailable
                        </div>
                        <div className="text-xs max-w-sm text-center">
                          This file contains binary data and cannot be displayed as plain text. File
                          size is {activeFile.sizeHuman}.
                        </div>
                      </div>
                    ) : activeFile.content ? (
                      <div className="p-4 bg-slate-950 font-mono text-xs leading-relaxed text-slate-200 overflow-x-auto select-text flex-1">
                        <pre>
                          <code>{activeFile.content}</code>
                        </pre>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 space-y-2">
                        <FileCode className="w-10 h-10 text-slate-600" />
                        <div className="text-xs">Empty file or no content captured.</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 space-y-2">
              <FileBox className="w-12 h-12 text-slate-600" />
              <div className="text-sm">Select a file from the explorer to view details</div>
            </div>
          )}
        </div>
      </div>

      {/* Right-Click Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-1 w-56 text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-100"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
        >
          <div className="px-2 py-1.5 font-semibold text-[11px] text-slate-400 border-b border-slate-800 truncate">
            {contextMenu.file.name}
          </div>

          <div className="py-1">
            {/* Quick Ignore File */}
            <button
              onClick={() => handleTriggerQuickIgnore(contextMenu.file.path, false)}
              className="w-full text-left px-2.5 py-1.5 hover:bg-rose-950/50 hover:text-rose-300 rounded flex items-center gap-2 cursor-pointer transition"
            >
              <EyeOff className="w-3.5 h-3.5 text-rose-400" />
              <span>Quick Ignore File</span>
            </button>

            {/* Quick Ignore Directory */}
            {contextMenu.file.path.includes('/') && (
              <button
                onClick={() => {
                  const parts = contextMenu.file.path.split('/');
                  parts.pop();
                  const dirPath = parts.join('/');
                  handleTriggerQuickIgnore(dirPath, true);
                }}
                className="w-full text-left px-2.5 py-1.5 hover:bg-rose-950/50 hover:text-rose-300 rounded flex items-center gap-2 cursor-pointer transition"
              >
                <FolderMinus className="w-3.5 h-3.5 text-rose-400" />
                <span className="truncate">
                  Ignore Folder (/{contextMenu.file.path.split('/')[0]}/*)
                </span>
              </button>
            )}

            <div className="my-1 border-t border-slate-800" />

            {/* Copy File Path */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(contextMenu.file.path);
                setContextMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded flex items-center gap-2 cursor-pointer transition"
            >
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy Relative Path</span>
            </button>

            {/* Inspect in Source Tab */}
            <button
              onClick={() => {
                setSelectedPath(contextMenu.file.path);
                setActiveDetailTab('content');
                setContextMenu(null);
              }}
              className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800 rounded flex items-center gap-2 cursor-pointer transition"
            >
              <Code2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Inspect Source</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Ignore Undo Notification Toast */}
      {lastIgnoredPath && (
        <div className="absolute bottom-4 right-4 z-40 bg-slate-900 border border-rose-600/40 text-slate-200 px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-3 duration-200">
          <EyeOff className="w-4 h-4 text-rose-400 shrink-0" />
          <div className="text-xs">
            <span className="text-slate-400">Ignored</span>{' '}
            <strong className="text-rose-300 font-mono">{lastIgnoredPath}</strong>
          </div>
          <button
            onClick={handleUndoQuickIgnore}
            className="px-2 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
          >
            <Undo2 className="w-3 h-3" />
            <span>Undo</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default FileExplorer;
