import React, { useRef, useState } from 'react';
import { FolderUp, FileArchive, UploadCloud, Settings, Loader2, Sparkles } from 'lucide-react';
import { SnapshotOptions } from '../types';

interface ScannerUploaderProps {
  onScanFolder: (files: FileList | File[]) => void;
  onScanZip: (file: File) => void;
  onLoadDemo: () => void;
  isLoading: boolean;
  options: SnapshotOptions;
  onOpenOptions: () => void;
}

export const ScannerUploader: React.FC<ScannerUploaderProps> = ({
  onScanFolder,
  onScanZip,
  onLoadDemo,
  isLoading,
  options,
  onOpenOptions,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const firstFile = e.dataTransfer.files[0];
      if (firstFile.name.endsWith('.zip')) {
        onScanZip(firstFile);
        return;
      }
      onScanFolder(e.dataTransfer.files);
    }
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onScanFolder(e.target.files);
    }
  };

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.name.endsWith('.zip')) {
        onScanZip(file);
      }
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
      {/* Background ambient gradient */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hidden inputs */}
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFolderChange}
        // @ts-ignore
        webkitdirectory="true"
        directory="true"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={zipInputRef}
        onChange={handleZipChange}
        accept=".zip,application/zip"
        className="hidden"
      />

      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex-1 w-full">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-blue-500 bg-blue-500/10 scale-[0.99]'
                : 'border-slate-700 hover:border-slate-600 bg-slate-950/50 hover:bg-slate-950/80'
            }`}
            onClick={() => folderInputRef.current?.click()}
          >
            {isLoading ? (
              <div className="py-6 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                <div className="text-sm font-medium text-slate-200">Scanning codebase & generating snapshot...</div>
                <div className="text-xs text-slate-400">Computing SHA-256 hashes, detecting languages & masking secrets</div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    Drop your project folder or .zip file here
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    Scans entire directory tree, builds deterministic index, calculates file hashes, detects 40+ languages, and protects secrets.
                  </p>
                </div>

                <div className="flex items-center flex-wrap justify-center gap-2.5 mt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      folderInputRef.current?.click();
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
                  >
                    <FolderUp className="w-4 h-4" />
                    <span>Select Project Folder</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      zipInputRef.current?.click();
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
                  >
                    <FileArchive className="w-4 h-4 text-amber-400" />
                    <span>Upload .ZIP Archive</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLoadDemo();
                    }}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-cyan-400 text-xs font-semibold transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Try Demo Repo</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick configuration card */}
        <div className="w-full lg:w-80 bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Scanner Options</span>
            <button
              onClick={onOpenOptions}
              className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
              title="Configure Exclusions & Embedding"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Exclusion list:</span>
              <span className="font-mono text-slate-200">{options.excludedDirs.length} folders</span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Heavy dirs included:</span>
              <span className={`font-mono ${options.includeDefaultHeavy ? 'text-amber-400' : 'text-slate-400'}`}>
                {options.includeDefaultHeavy ? 'Yes (--include-default-heavy)' : 'No (default)'}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Max embed size:</span>
              <span className="font-mono text-slate-200">{(options.maxSizeBytes / (1024 * 1024)).toFixed(0)} MB</span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Markdown output:</span>
              <span className="font-mono text-blue-400">{options.outputMarkdownName}</span>
            </div>
          </div>

          <button
            onClick={onOpenOptions}
            className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>Customize Scan Rules</span>
          </button>
        </div>
      </div>
    </div>
  );
};
