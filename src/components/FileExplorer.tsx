import React, { useState, useMemo } from 'react';
import { FileCode, FileText, Lock, Copy, Check, Search, ShieldAlert, Hash, Calendar, FileBox, Binary } from 'lucide-react';
import { ScannedFile } from '../types';

interface FileExplorerProps {
  files: ScannedFile[];
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ files }) => {
  const [selectedPath, setSelectedPath] = useState<string>(files[0]?.path || '');
  const [search, setSearch] = useState('');
  const [onlySecrets, setOnlySecrets] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [copiedContent, setCopiedContent] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const languages = useMemo(() => {
    const set = new Set<string>();
    files.forEach(f => {
      if (f.language && f.language !== 'Unknown') set.add(f.language);
    });
    return Array.from(set).sort();
  }, [files]);

  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      if (f.isDirectory) return false;
      if (search && !f.path.toLowerCase().includes(search.toLowerCase())) return false;
      if (onlySecrets && !f.secretInfo.hasSecrets) return false;
      if (selectedLanguage !== 'all' && f.language !== selectedLanguage) return false;
      return true;
    });
  }, [files, search, onlySecrets, selectedLanguage]);

  const activeFile = useMemo(() => {
    return files.find(f => f.path === selectedPath) || filteredFiles[0] || files[0];
  }, [files, selectedPath, filteredFiles]);

  const handleCopyContent = async () => {
    if (!activeFile?.content) return;
    try {
      await navigator.clipboard.writeText(activeFile.content);
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleCopyHash = async () => {
    if (!activeFile?.sha256) return;
    try {
      await navigator.clipboard.writeText(activeFile.sha256);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
      {/* File List Column */}
      <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col bg-slate-950/60">
        {/* Search and filters */}
        <div className="p-3 border-b border-slate-800 space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files by path..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500 flex-1"
            >
              <option value="all">All Languages</option>
              {languages.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>

            <button
              onClick={() => setOnlySecrets(!onlySecrets)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border flex items-center gap-1 transition cursor-pointer ${
                onlySecrets
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <Lock className="w-3 h-3" />
              <span>Secrets</span>
            </button>
          </div>
        </div>

        {/* List items */}
        <div className="flex-1 overflow-y-auto max-h-[500px] divide-y divide-slate-800/50 scrollbar-thin scrollbar-thumb-slate-800">
          {filteredFiles.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No files match your filters
            </div>
          ) : (
            filteredFiles.map((file) => {
              const isSelected = activeFile?.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedPath(file.path)}
                  className={`w-full text-left p-2.5 transition flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600/15 text-blue-300 border-l-2 border-blue-500 pl-2'
                      : 'hover:bg-slate-900/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
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
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Showing {filteredFiles.length} of {files.length} files</span>
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
                  <span className="text-sm font-semibold font-mono text-white">{activeFile.path}</span>
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

                {!activeFile.secretInfo.hasSecrets && !activeFile.isBinary && activeFile.content && (
                  <button
                    onClick={handleCopyContent}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition cursor-pointer"
                  >
                    {copiedContent ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Metadata chips */}
              <div className="flex items-center flex-wrap gap-2 text-xs text-slate-400">
                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono">
                  Size: <strong className="text-slate-200">{activeFile.sizeHuman}</strong>
                </span>

                <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono">
                  Perms: <strong className="text-slate-200">{activeFile.permissions}</strong>
                </span>

                {activeFile.modified && (
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>{activeFile.modified.substring(0, 10)}</span>
                  </span>
                )}

                <button
                  onClick={handleCopyHash}
                  className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 font-mono flex items-center gap-1 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  title="Click to copy SHA-256 hash"
                >
                  <Hash className="w-3 h-3 text-slate-500" />
                  <span className="truncate max-w-[140px] sm:max-w-[200px]">{activeFile.sha256}</span>
                  {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
                </button>
              </div>
            </div>

            {/* Content view */}
            <div className="flex-1 p-4 overflow-y-auto max-h-[500px] bg-slate-950 font-mono text-xs text-slate-300">
              {activeFile.secretInfo.hasSecrets ? (
                <div className="p-6 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-300 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-400">
                    <ShieldAlert className="w-5 h-5" />
                    <span>🔒 Potential secret detected — Content intentionally concealed</span>
                  </div>
                  <p className="text-xs text-amber-200/80 leading-relaxed">
                    This file matches protected secret filenames or contains patterns resembling API keys, tokens, or private credentials.
                    To protect sensitive assets, file content is omitted from exports.
                  </p>
                  {activeFile.secretInfo.contentSecrets.length > 0 && (
                    <div className="mt-2 space-y-1 text-xs font-mono bg-slate-950/70 p-3 rounded-lg border border-amber-500/20">
                      <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-1">
                        Detected Pattern Matches:
                      </div>
                      {activeFile.secretInfo.contentSecrets.map((d, i) => (
                        <div key={i} className="text-slate-300">
                          Line {d.line}: <span className="text-amber-400">{d.snippet}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : activeFile.isBinary ? (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <FileBox className="w-10 h-10 text-purple-400" />
                  <div className="text-sm font-semibold text-slate-200">Binary File</div>
                  <div className="text-xs max-w-sm">
                    Binary files are recorded with metadata and SHA-256 hash. Content is not embedded.
                  </div>
                </div>
              ) : activeFile.content !== null && activeFile.content !== undefined ? (
                <pre className="whitespace-pre overflow-x-auto leading-relaxed text-slate-200">
                  {activeFile.content}
                </pre>
              ) : (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <FileText className="w-10 h-10 text-slate-600" />
                  <div className="text-sm font-semibold text-slate-300">Content Exceeds Size Limit</div>
                  <div className="text-xs max-w-sm text-slate-500">
                    File size is larger than the maximum embedding limit configured in scanner options.
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="p-12 text-center text-xs text-slate-500">
            Select a file to inspect metadata and source code.
          </div>
        )}
      </div>
    </div>
  );
};
