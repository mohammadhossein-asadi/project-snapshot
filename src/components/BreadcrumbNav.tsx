import React from 'react';
import { ChevronRight, Folder, FolderOpen, Home, X, ArrowUp } from 'lucide-react';

interface BreadcrumbNavProps {
  filePath: string;
  activeDirectoryFilter: string | null;
  onSelectDirectory: (dirPath: string) => void;
  onClearDirectoryFilter: () => void;
  onSelectFile?: (filePath: string) => void;
}

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({
  filePath,
  activeDirectoryFilter,
  onSelectDirectory,
  onClearDirectoryFilter,
  onSelectFile,
}) => {
  const parts = filePath ? filePath.split('/') : [];
  const fileName = parts.length > 0 ? parts[parts.length - 1] : '';
  const dirParts = parts.slice(0, -1);

  // Helper to build cumulative path
  const getSubPath = (index: number) => {
    return dirParts.slice(0, index + 1).join('/');
  };

  // Navigate one level up
  const handleGoUp = () => {
    if (activeDirectoryFilter) {
      const activeParts = activeDirectoryFilter.split('/');
      if (activeParts.length > 1) {
        onSelectDirectory(activeParts.slice(0, -1).join('/'));
      } else {
        onClearDirectoryFilter();
      }
    } else if (dirParts.length > 0) {
      onSelectDirectory(dirParts.slice(0, -1).join('/') || '');
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-950/90 border-b border-slate-800 text-xs flex-wrap">
      {/* Interactive Breadcrumb trail */}
      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
        <button
          onClick={onClearDirectoryFilter}
          className={`flex items-center gap-1 px-2 py-1 rounded transition cursor-pointer font-medium ${
            !activeDirectoryFilter
              ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Project Root"
        >
          <Home className="w-3.5 h-3.5" />
          <span>root</span>
        </button>

        {dirParts.map((part, index) => {
          const subPath = getSubPath(index);
          const isFilterActive = activeDirectoryFilter === subPath;

          return (
            <React.Fragment key={subPath}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <button
                onClick={() => onSelectDirectory(subPath)}
                className={`flex items-center gap-1 px-2 py-1 rounded transition cursor-pointer font-mono ${
                  isFilterActive
                    ? 'text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title={`Scope file list to /${subPath}`}
              >
                {isFilterActive ? (
                  <FolderOpen className="w-3 h-3 text-cyan-400" />
                ) : (
                  <Folder className="w-3 h-3 text-slate-500" />
                )}
                <span>{part}</span>
              </button>
            </React.Fragment>
          );
        })}

        {fileName && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <button
              onClick={() => onSelectFile?.(filePath)}
              className="px-2 py-1 font-mono font-bold text-white bg-slate-900 rounded border border-slate-800 hover:border-slate-700 transition cursor-pointer"
              title="Current selected file"
            >
              {fileName}
            </button>
          </>
        )}
      </div>

      {/* Directory Filter controls */}
      <div className="flex items-center gap-2 shrink-0">
        {activeDirectoryFilter && (
          <div className="flex items-center gap-1.5 bg-cyan-950/40 border border-cyan-500/30 rounded-lg px-2 py-0.5 text-[11px] text-cyan-300">
            <span>Scoped: <strong>/{activeDirectoryFilter}</strong></span>
            <button
              onClick={onClearDirectoryFilter}
              className="p-0.5 hover:bg-cyan-900/50 rounded text-cyan-400 hover:text-white transition cursor-pointer"
              title="Clear directory scope"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {(dirParts.length > 0 || activeDirectoryFilter) && (
          <button
            onClick={handleGoUp}
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 transition cursor-pointer"
            title="Traverse to parent folder"
          >
            <ArrowUp className="w-3 h-3 text-slate-400" />
            <span>Up One Level</span>
          </button>
        )}
      </div>
    </div>
  );
};
