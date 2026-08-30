import React, { useState, useMemo } from 'react';
import { Copy, Check, Search, FolderTree, Terminal } from 'lucide-react';
import { generateTreeString } from '../lib/tree';
import { ScannedFile } from '../types';
import { DEFAULT_EXCLUDED_DIRS } from '../lib/constants';

interface TreeViewerProps {
  files: ScannedFile[];
  includeDefaultHeavy: boolean;
}

export const TreeViewer: React.FC<TreeViewerProps> = ({ files, includeDefaultHeavy }) => {
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState('');

  const treeString = useMemo(() => {
    const excluded = includeDefaultHeavy ? new Set<string>() : new Set(DEFAULT_EXCLUDED_DIRS);
    return generateTreeString(
      files.map(f => ({ path: f.path, isDirectory: f.isDirectory })),
      excluded
    );
  }, [files, includeDefaultHeavy]);

  const filteredTreeLines = useMemo(() => {
    if (!filter.trim()) return treeString.split('\n');
    const lower = filter.toLowerCase();
    return treeString.split('\n').filter(line => line.toLowerCase().includes(lower) || line === '.');
  }, [treeString, filter]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(treeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
      {/* Header controls */}
      <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Deterministic Directory Tree
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            ({treeString.split('\n').length} nodes)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter tree nodes..."
              className="bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-44 sm:w-56"
            />
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition cursor-pointer"
            title="Copy ASCII tree to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Tree</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Terminal View */}
      <div className="p-4 bg-slate-950 overflow-x-auto max-h-[500px] font-mono text-xs text-slate-300 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
        <div className="flex items-center gap-1.5 text-slate-600 mb-3 select-none pb-2 border-b border-slate-900">
          <Terminal className="w-3.5 h-3.5" />
          <span>project_snapshot::tree_view</span>
        </div>
        <pre className="text-emerald-400/90 whitespace-pre">
          {filteredTreeLines.join('\n')}
        </pre>
      </div>
    </div>
  );
};
