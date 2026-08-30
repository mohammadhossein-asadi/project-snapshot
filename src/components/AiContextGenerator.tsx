import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Check,
  Download,
  Sliders,
  FileCode,
  Layers,
  Zap,
  Target,
  Brain,
  FolderTree,
} from 'lucide-react';
import { ScanResult } from '../types';
import {
  generatePrioritizedFiles,
  buildOptimizedAiPrompt,
  TASK_PRESETS,
  ContextTaskPreset,
} from '../lib/aiContext';

interface AiContextGeneratorProps {
  scanResult: ScanResult;
  onSelectFile?: (path: string) => void;
}

const TOKEN_BUDGETS = [
  { label: '4k Tokens', value: 4000, desc: 'Ultra compact (Fastest)' },
  { label: '8k Tokens', value: 8000, desc: 'Compact context' },
  { label: '16k Tokens', value: 16000, desc: 'Standard balance' },
  { label: '32k Tokens', value: 32000, desc: 'Deep architecture' },
  { label: '64k Tokens', value: 64000, desc: 'Comprehensive context' },
  { label: 'Unlimited', value: Infinity, desc: 'All selected files' },
];

export const AiContextGenerator: React.FC<AiContextGeneratorProps> = ({
  scanResult,
  onSelectFile,
}) => {
  const [preset, setPreset] = useState<ContextTaskPreset>('general');
  const [userGoal, setUserGoal] = useState('');
  const [tokenBudget, setTokenBudget] = useState<number>(32000);
  const [includeTree, setIncludeTree] = useState(true);
  const [copied, setCopied] = useState(false);

  // Generate ranked files based on import centrality
  const initialRankedFiles = useMemo(() => {
    return generatePrioritizedFiles(scanResult.files);
  }, [scanResult.files]);

  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(() => {
    const set = new Set<string>();
    // Auto-select files within the initial budget
    let runningTokens = 0;
    for (const f of initialRankedFiles) {
      if (runningTokens + f.estimatedTokens <= 32000) {
        set.add(f.path);
        runningTokens += f.estimatedTokens;
      }
    }
    return set;
  });

  const toggleFile = (path: string) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedPaths(new Set(initialRankedFiles.map((f) => f.path)));
  };

  const handleDeselectAll = () => {
    setSelectedPaths(new Set());
  };

  const handleAutoOptimizeForBudget = (budget: number) => {
    setTokenBudget(budget);
    const set = new Set<string>();
    let runningTokens = 0;
    for (const f of initialRankedFiles) {
      if (budget === Infinity || runningTokens + f.estimatedTokens <= budget) {
        set.add(f.path);
        runningTokens += f.estimatedTokens;
      }
    }
    setSelectedPaths(set);
  };

  const activeSelectedFiles = useMemo(() => {
    return initialRankedFiles.filter((f) => selectedPaths.has(f.path));
  }, [initialRankedFiles, selectedPaths]);

  // Build the live prompt
  const { prompt, totalTokens } = useMemo(() => {
    return buildOptimizedAiPrompt(
      scanResult,
      activeSelectedFiles,
      preset,
      userGoal,
      includeTree
    );
  }, [scanResult, activeSelectedFiles, preset, userGoal, includeTree]);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownloadPrompt = () => {
    const blob = new Blob([prompt], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${scanResult.projectName}-ai-context.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950/50 via-slate-900 to-indigo-950/50 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  AI Context Generator & Prompt Optimizer
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                  Import Density Centrality
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically identifies core architectural hubs and dependency nodes to generate a high-signal, context-optimized prompt for LLMs (Gemini, Claude, ChatGPT).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyPrompt}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Optimized Prompt Copied!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Copy Optimized AI Context</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadPrompt}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition cursor-pointer"
              title="Download prompt as Markdown"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Task Objective / Goal Input */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-blue-400" />
              <span>Specific Task / User Goal (Optional):</span>
            </label>
            <input
              type="text"
              value={userGoal}
              onChange={(e) => setUserGoal(e.target.value)}
              placeholder="e.g. Implement real-time WebSocket sync, or refactor dependency parsing..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="lg:col-span-4 space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Task Preset:</span>
            </label>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value as ContextTaskPreset)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {Object.entries(TASK_PRESETS).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Token Budget Presets */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Token Budget:</span>
            </span>
            {TOKEN_BUDGETS.map((b) => (
              <button
                key={b.label}
                onClick={() => handleAutoOptimizeForBudget(b.value)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition cursor-pointer ${
                  tokenBudget === b.value
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
                title={b.desc}
              >
                {b.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 select-none">
              <input
                type="checkbox"
                checked={includeTree}
                onChange={(e) => setIncludeTree(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
              />
              <FolderTree className="w-3.5 h-3.5 text-cyan-400" />
              <span>Include Directory Hierarchy</span>
            </label>

            <div className="font-mono text-xs px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-indigo-300">
              ~{totalTokens.toLocaleString()} tokens ({activeSelectedFiles.length} files)
            </div>
          </div>
        </div>
      </div>

      {/* Main Split: Prioritized Files List & Live Prompt Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Prioritized Files Selector Column */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Ranked Files by Centrality
              </h4>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={handleSelectAll}
                className="text-blue-400 hover:underline cursor-pointer"
              >
                All
              </button>
              <span className="text-slate-600">•</span>
              <button
                onClick={handleDeselectAll}
                className="text-slate-400 hover:underline cursor-pointer"
              >
                None
              </button>
            </div>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[540px] pr-1 scrollbar-thin scrollbar-thumb-slate-800">
            {initialRankedFiles.map((file) => {
              const isSelected = selectedPaths.has(file.path);
              return (
                <div
                  key={file.path}
                  onClick={() => toggleFile(file.path)}
                  className={`p-3 rounded-lg border transition cursor-pointer flex flex-col gap-2 ${
                    isSelected
                      ? 'bg-slate-950/80 border-blue-500/40 ring-1 ring-blue-500/20'
                      : 'bg-slate-950/30 border-slate-800/80 hover:border-slate-700 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by parent div onClick
                        className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 shrink-0"
                      />
                      <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="text-xs font-semibold font-mono text-slate-200 truncate" title={file.path}>
                        {file.name}
                      </span>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-slate-800 text-slate-300">
                      ~{file.estimatedTokens} tokens
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pl-6">
                    <span className="truncate text-cyan-300/80 font-medium">
                      {file.importanceReason}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500">
                        {file.linesCount} lines
                      </span>
                      {onSelectFile && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectFile(file.path);
                          }}
                          className="text-blue-400 hover:text-blue-300 underline cursor-pointer text-[10px]"
                        >
                          Inspect
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Optimized Prompt Preview */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Generated AI Prompt Preview
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>{activeSelectedFiles.length} files embedded</span>
            </div>
          </div>

          <div className="p-4 bg-slate-950 overflow-y-auto max-h-[540px] font-mono text-xs text-slate-300 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
            <pre className="whitespace-pre overflow-x-auto text-slate-300">
              {prompt}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiContextGenerator;
