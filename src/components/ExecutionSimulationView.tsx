import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Play,
  Copy,
  Check,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Command,
  Maximize2,
  Minimize2,
  Zap,
} from 'lucide-react';
import { ScanResult, SimulationResult } from '../types';
import {
  PRESET_DIAGNOSTIC_COMMANDS,
  simulateCommandExecution,
} from '../lib/executionSimulator';

interface ExecutionSimulationViewProps {
  scanResult: ScanResult;
}

export const ExecutionSimulationView: React.FC<ExecutionSimulationViewProps> = ({
  scanResult,
}) => {
  const [commandInput, setCommandInput] = useState<string>('npm test');
  const [history, setHistory] = useState<string[]>(['npm test', 'git status', 'npm run build']);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<SimulationResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [animateStream, setAnimateStream] = useState<boolean>(true);
  const [displayedStdout, setDisplayedStdout] = useState<string>('');

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-run initial command on load
  useEffect(() => {
    runCommand('npm test');
  }, [scanResult]);

  const runCommand = (cmdToRun: string) => {
    if (!cmdToRun.trim() || isRunning) return;
    const trimmed = cmdToRun.trim();

    setIsRunning(true);
    setHistory((prev) => [trimmed, ...prev.filter((c) => c !== trimmed)]);
    setHistoryIdx(-1);

    const res = simulateCommandExecution(trimmed, scanResult);

    if (animateStream) {
      setDisplayedStdout('');
      setCurrentResult(res);

      let idx = 0;
      const fullText = res.stdout;
      const stepSize = Math.max(12, Math.floor(fullText.length / 25));

      const interval = setInterval(() => {
        idx += stepSize;
        if (idx >= fullText.length) {
          setDisplayedStdout(fullText);
          setIsRunning(false);
          clearInterval(interval);
        } else {
          setDisplayedStdout(fullText.substring(0, idx));
        }
      }, 20);
    } else {
      setCurrentResult(res);
      setDisplayedStdout(res.stdout);
      setIsRunning(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      runCommand(commandInput);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx = Math.min(historyIdx + 1, history.length - 1);
        setHistoryIdx(nextIdx);
        setCommandInput(history[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        setCommandInput(history[nextIdx]);
      } else if (historyIdx === 0) {
        setHistoryIdx(-1);
        setCommandInput('');
      }
    }
  };

  const handleCopyTerminal = async () => {
    if (!currentResult) return;
    const textToCopy = `$ ${currentResult.command}\n${currentResult.stdout}${currentResult.stderr ? '\n[STDERR]\n' + currentResult.stderr : ''}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownloadLog = () => {
    if (!currentResult) return;
    const logContent = `=== Execution Simulation Log ===
Project: ${scanResult.projectName}
Timestamp: ${currentResult.timestamp}
Command: ${currentResult.command}
Duration: ${currentResult.durationMs}ms
Exit Code: ${currentResult.exitCode}

--- STDOUT ---
${currentResult.stdout}

--- STDERR ---
${currentResult.stderr || '(none)'}
`;

    const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulation-${currentResult.command.replace(/[^a-zA-Z0-9_-]/g, '_')}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Convert basic ANSI escape codes to colored spans
  const renderAnsiTerminalOutput = (raw: string) => {
    const lines = raw.split('\n');

    return lines.map((line, lIdx) => {
      // Parse ANSI color patterns
      const tokens: React.ReactNode[] = [];
      let lastIndex = 0;
      const regex = /\x1b\[([0-9;]+)m/g;
      let match;
      let curColor = '';
      let isBold = false;
      let isDim = false;
      let isUnderline = false;

      while ((match = regex.exec(line)) !== null) {
        const textChunk = line.substring(lastIndex, match.index);
        if (textChunk) {
          tokens.push(
            <span
              key={`${lIdx}-${lastIndex}`}
              className={`${curColor} ${isBold ? 'font-bold' : ''} ${isDim ? 'opacity-60 text-slate-400' : ''} ${isUnderline ? 'underline' : ''}`}
            >
              {textChunk}
            </span>
          );
        }

        const codes = match[1].split(';');
        for (const code of codes) {
          if (code === '0') {
            curColor = '';
            isBold = false;
            isDim = false;
            isUnderline = false;
          } else if (code === '1') isBold = true;
          else if (code === '2') isDim = true;
          else if (code === '4') isUnderline = true;
          else if (code === '31') curColor = 'text-rose-400';
          else if (code === '32') curColor = 'text-emerald-400';
          else if (code === '33') curColor = 'text-amber-300';
          else if (code === '34') curColor = 'text-blue-400';
          else if (code === '35') curColor = 'text-purple-400';
          else if (code === '36') curColor = 'text-cyan-300';
          else if (code === '30') curColor = 'text-slate-500';
        }

        lastIndex = regex.lastIndex;
      }

      const remaining = line.substring(lastIndex);
      if (remaining || tokens.length === 0) {
        tokens.push(
          <span
            key={`${lIdx}-end`}
            className={`${curColor} ${isBold ? 'font-bold' : ''} ${isDim ? 'opacity-60 text-slate-400' : ''} ${isUnderline ? 'underline' : ''}`}
          >
            {remaining}
          </span>
        );
      }

      return (
        <div key={lIdx} className="min-h-[1.25rem] whitespace-pre font-mono">
          {tokens}
        </div>
      );
    });
  };

  const filteredPresets = PRESET_DIAGNOSTIC_COMMANDS.filter((p) =>
    selectedCategory === 'all' ? true : p.category === selectedCategory
  );

  return (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col transition-all duration-200 ${
        isFullscreen ? 'fixed inset-4 z-50 bg-slate-950 flex flex-col' : 'min-h-[640px]'
      }`}
    >
      {/* Header Bar */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">
                Execution & Diagnostic Simulation
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-mono font-semibold border border-emerald-500/30">
                CLI Environment
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Run diagnostic commands, test assertions, build bundles, and inspect Git metadata
            </p>
          </div>
        </div>

        {/* Right Header Toolbar */}
        <div className="flex items-center gap-2">
          {/* Animated Streaming Toggle */}
          <button
            onClick={() => setAnimateStream(!animateStream)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition cursor-pointer ${
              animateStream
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Toggle realistic streaming typing animation"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{animateStream ? 'Streaming: On' : 'Streaming: Instant'}</span>
          </button>

          {/* Copy Terminal Button */}
          <button
            onClick={handleCopyTerminal}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition cursor-pointer"
            title="Copy terminal output"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Download Log Button */}
          <button
            onClick={handleDownloadLog}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition cursor-pointer"
            title="Download execution log"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Log</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Preset Command Quick Launchers */}
      <div className="bg-slate-950/70 border-b border-slate-800 p-3 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
            <Command className="w-3.5 h-3.5 text-blue-400" />
            <span>1-Click Diagnostic Presets:</span>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 text-xs">
            {['all', 'testing', 'git', 'build', 'lint', 'security', 'inspect'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-0.5 rounded text-[11px] capitalize transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Command Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800">
          {filteredPresets.map((preset) => {
            const isActive = currentResult?.command === preset.command;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  setCommandInput(preset.command);
                  runCommand(preset.command);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2 transition shrink-0 border cursor-pointer ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-300 border-blue-500/50 shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-700 hover:border-slate-600'
                }`}
                title={preset.description}
              >
                <Play className="w-3 h-3 text-emerald-400" />
                <span className="font-semibold">{preset.command}</span>
                <span className="text-[10px] text-slate-400 font-sans">({preset.title})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Terminal Window Frame */}
      <div className="flex-1 flex flex-col bg-slate-950 min-h-[380px] overflow-hidden">
        {/* Terminal Title Bar */}
        <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-2 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-slate-400 ml-2 font-sans font-medium text-[11px]">
              bash — developer@workspace: ~/{scanResult.projectName}
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            {currentResult && (
              <>
                <span className="flex items-center gap-1 text-slate-300">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {currentResult.durationMs}ms
                </span>
                <span className="text-slate-600">•</span>
                <span
                  className={`flex items-center gap-1 font-bold ${
                    currentResult.exitCode === 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {currentResult.exitCode === 0 ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <AlertTriangle className="w-3 h-3" />
                  )}
                  Exit {currentResult.exitCode}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Terminal Output Stream Area */}
        <div className="flex-1 p-4 overflow-y-auto font-mono text-xs leading-relaxed text-slate-200 select-text scrollbar-thin scrollbar-thumb-slate-800">
          {currentResult ? (
            <div className="space-y-3">
              {/* Command Prompt Line */}
              <div className="flex items-center gap-2 text-slate-400 pb-1 border-b border-slate-900">
                <span className="text-emerald-400 font-bold">developer@workspace</span>
                <span className="text-slate-600">:</span>
                <span className="text-blue-400 font-bold">~/{scanResult.projectName}</span>
                <span className="text-slate-400">$</span>
                <span className="text-white font-bold">{currentResult.command}</span>
              </div>

              {/* Stdout Output */}
              <div>{renderAnsiTerminalOutput(displayedStdout)}</div>

              {/* Stderr Output if present */}
              {currentResult.stderr && (
                <div className="p-2.5 rounded bg-rose-950/30 border border-rose-800/40 text-rose-300">
                  <div className="font-bold text-[11px] mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    STDERR DIAGNOSTIC:
                  </div>
                  <div>{currentResult.stderr}</div>
                </div>
              )}

              {/* Live Streaming Indicator */}
              {isRunning && (
                <div className="flex items-center gap-2 text-emerald-400 text-xs animate-pulse">
                  <span className="w-2 h-4 bg-emerald-400 inline-block animate-ping" />
                  <span>Processing diagnostic streams...</span>
                </div>
              )}

              <div ref={terminalEndRef} />
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <Terminal className="w-8 h-8 mx-auto text-slate-600" />
              <div>No command executed yet. Select a preset or type a command below.</div>
            </div>
          )}
        </div>

        {/* Bottom Interactive Command Input Prompt */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 shrink-0 select-none">
            <span className="font-bold">$</span>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type command (e.g. npm test, git status, tree, npm run build) & press Enter..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />

          <button
            onClick={() => runCommand(commandInput)}
            disabled={isRunning || !commandInput.trim()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isRunning ? 'Running...' : 'Execute'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Strip if metrics available */}
      {currentResult?.metrics && Object.keys(currentResult.metrics).length > 0 && (
        <div className="bg-slate-950/90 border-t border-slate-800 px-4 py-2 flex items-center gap-4 flex-wrap text-xs font-mono text-slate-400">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
            Execution Metrics:
          </span>
          {Object.entries(currentResult.metrics).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1">
              <span className="text-slate-400">{key}:</span>
              <span className="text-slate-200 font-bold">{val}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExecutionSimulationView;
