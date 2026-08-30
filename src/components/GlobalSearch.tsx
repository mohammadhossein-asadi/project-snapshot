import React, { useRef, useEffect } from 'react';
import { Search, X, Filter, Command } from 'lucide-react';
import { ScannedFile } from '../types';

interface GlobalSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  files: ScannedFile[];
  onSelectFile?: (filePath: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  searchTerm,
  onSearchChange,
  files,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut Ctrl+K or '/' to focus global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) && document.activeElement !== inputRef.current) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          inputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute matches
  const matchCount = React.useMemo(() => {
    if (!searchTerm.trim()) return files.filter(f => !f.isDirectory).length;
    const lower = searchTerm.toLowerCase();
    return files.filter(f => !f.isDirectory && f.path.toLowerCase().includes(lower)).length;
  }, [searchTerm, files]);

  // Quick filter presets
  const presets = [
    { label: 'All', query: '' },
    { label: '.tsx/.ts', query: '.ts' },
    { label: '.json', query: '.json' },
    { label: '.css', query: '.css' },
    { label: '.py', query: '.py' },
    { label: 'components', query: 'components/' },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md space-y-2.5">
      <div className="flex items-center gap-2">
        {/* Main Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Global search across all tabs (e.g., .tsx, auth, components/, package.json)..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-24 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition font-mono"
          />

          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {searchTerm ? (
              <button
                onClick={() => onSearchChange('')}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400">
                <Command className="w-2.5 h-2.5" /> K
              </span>
            )}
          </div>
        </div>

        {/* Matches Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono shrink-0">
          <span className="text-slate-400">Matches:</span>
          <span className={`font-bold ${matchCount > 0 ? 'text-blue-400' : 'text-amber-400'}`}>
            {matchCount}
          </span>
          <span className="text-slate-500">/ {files.filter(f => !f.isDirectory).length}</span>
        </div>
      </div>

      {/* Quick Filter Presets */}
      <div className="flex items-center gap-1.5 flex-wrap text-xs">
        <span className="text-slate-400 text-[11px] mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3 text-slate-500" />
          <span>Quick filters:</span>
        </span>
        {presets.map((preset) => {
          const isActive = (searchTerm === preset.query) || (!searchTerm && !preset.query);
          return (
            <button
              key={preset.label}
              onClick={() => onSearchChange(preset.query)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-mono transition cursor-pointer ${
                isActive
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 font-semibold'
                  : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
export default GlobalSearch;
