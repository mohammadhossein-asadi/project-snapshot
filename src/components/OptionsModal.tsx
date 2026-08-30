import React, { useState } from 'react';
import { X, Plus, RotateCcw, Check, Sliders, Shield, FileText } from 'lucide-react';
import { SnapshotOptions } from '../types';
import { DEFAULT_EXCLUDED_DIRS, DEFAULT_OUTPUT, DEFAULT_MANIFEST } from '../lib/constants';

interface OptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: SnapshotOptions;
  onOptionsChange: (newOptions: SnapshotOptions) => void;
  onApplyAndRescan?: () => void;
}

export const OptionsModal: React.FC<OptionsModalProps> = ({
  isOpen,
  onClose,
  options,
  onOptionsChange,
  onApplyAndRescan,
}) => {
  const [newDir, setNewDir] = useState('');
  const [localOptions, setLocalOptions] = useState<SnapshotOptions>(options);

  if (!isOpen) return null;

  const handleAddDir = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDir.trim()) return;
    const clean = newDir.trim().replace(/^\/+|\/+$/g, '');
    if (!localOptions.excludedDirs.includes(clean)) {
      setLocalOptions({
        ...localOptions,
        excludedDirs: [...localOptions.excludedDirs, clean],
      });
    }
    setNewDir('');
  };

  const handleRemoveDir = (dir: string) => {
    setLocalOptions({
      ...localOptions,
      excludedDirs: localOptions.excludedDirs.filter(d => d !== dir),
    });
  };

  const handleResetDefaults = () => {
    setLocalOptions({
      maxSizeBytes: 10 * 1024 * 1024,
      excludedDirs: [...DEFAULT_EXCLUDED_DIRS],
      includeDefaultHeavy: false,
      outputMarkdownName: DEFAULT_OUTPUT,
      outputManifestName: DEFAULT_MANIFEST,
    });
  };

  const handleSave = () => {
    onOptionsChange(localOptions);
    onClose();
    if (onApplyAndRescan) {
      onApplyAndRescan();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Scanner Configuration</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Excluded directories */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
                Excluded Directories ({localOptions.excludedDirs.length})
              </label>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to defaults</span>
              </button>
            </div>

            <form onSubmit={handleAddDir} className="flex gap-2">
              <input
                type="text"
                value={newDir}
                onChange={(e) => setNewDir(e.target.value)}
                placeholder="e.g. target, .cache, temp_logs"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              {localOptions.excludedDirs.map((dir) => (
                <span
                  key={dir}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 font-mono text-[11px] text-slate-300"
                >
                  <span>{dir}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDir(dir)}
                    className="hover:text-red-400 p-0.5 rounded transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Heavy Dirs Toggle */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Include Default Heavy Directories</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Corresponds to <code className="text-amber-400">--include-default-heavy</code>. Includes <code className="text-slate-300">node_modules</code>, <code className="text-slate-300">.git</code>, <code className="text-slate-300">dist</code>, <code className="text-slate-300">.venv</code> in scans.
              </p>
            </div>
            <input
              type="checkbox"
              checked={localOptions.includeDefaultHeavy}
              onChange={(e) => setLocalOptions({ ...localOptions, includeDefaultHeavy: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer mt-1"
            />
          </div>

          {/* Max Size for Embedding */}
          <div className="space-y-2">
            <label className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
              Max Text Embedding Size Limit (<code className="text-blue-400">--max-size</code>)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1048576"
                max="52428800"
                step="1048576"
                value={localOptions.maxSizeBytes}
                onChange={(e) => setLocalOptions({ ...localOptions, maxSizeBytes: Number(e.target.value) })}
                className="flex-1 accent-blue-500 cursor-pointer"
              />
              <span className="font-mono text-xs font-bold text-blue-400 w-16 text-right">
                {(localOptions.maxSizeBytes / (1024 * 1024)).toFixed(0)} MB
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Files larger than this limit have their metadata recorded in the snapshot, but content is omitted to save token space.
            </p>
          </div>

          {/* Output file names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>Markdown Output Filename</span>
              </label>
              <input
                type="text"
                value={localOptions.outputMarkdownName}
                onChange={(e) => setLocalOptions({ ...localOptions, outputMarkdownName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                <span>JSON Manifest Filename</span>
              </label>
              <input
                type="text"
                value={localOptions.outputManifestName}
                onChange={(e) => setLocalOptions({ ...localOptions, outputManifestName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Save & Apply Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
