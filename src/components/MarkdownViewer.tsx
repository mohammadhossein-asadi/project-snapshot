import React, { useState, useMemo } from 'react';
import { Copy, Check, Download, FileText, Sparkles } from 'lucide-react';
import { ScanResult, SnapshotOptions } from '../types';
import { formatMarkdown } from '../lib/output';

interface MarkdownViewerProps {
  scanResult: ScanResult;
  options: SnapshotOptions;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ scanResult, options }) => {
  const [copied, setCopied] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const markdownContent = useMemo(() => {
    return formatMarkdown(scanResult, options);
  }, [scanResult, options]);

  const estimatedTokens = useMemo(() => {
    // Approx 4 characters per token
    return Math.round(markdownContent.length / 4);
  }, [markdownContent]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleCopyForAI = async () => {
    const promptHeader = `Here is the complete codebase snapshot for project "${scanResult.projectName}". Please analyze the project context, directory structure, and source files:\n\n`;
    try {
      await navigator.clipboard.writeText(promptHeader + markdownContent);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = options.outputMarkdownName || 'README.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
      {/* Action Header */}
      <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            {options.outputMarkdownName}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            ~{estimatedTokens.toLocaleString()} tokens
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {(markdownContent.length / 1024).toFixed(1)} KB
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyForAI}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
            title="Copy with prompt header for Claude / ChatGPT / Gemini"
          >
            {copiedPrompt ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Prompt Copied!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Copy for AI Prompt</span>
              </>
            )}
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Raw</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Markdown Content Box */}
      <div className="p-4 bg-slate-950 overflow-y-auto max-h-[560px] font-mono text-xs text-slate-300 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
        <pre className="whitespace-pre overflow-x-auto text-slate-300">
          {markdownContent}
        </pre>
      </div>
    </div>
  );
};
