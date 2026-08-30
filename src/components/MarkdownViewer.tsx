import React, { useState, useMemo } from 'react';
import { Copy, Check, Download, FileText, Sparkles, ChevronDown } from 'lucide-react';
import { ScanResult, SnapshotOptions } from '../types';
import { formatMarkdown } from '../lib/output';

interface MarkdownViewerProps {
  scanResult: ScanResult;
  options: SnapshotOptions;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ scanResult, options }) => {
  const [copied, setCopied] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [promptFormat, setPromptFormat] = useState<'standard' | 'gemini' | 'claude'>('standard');
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);

  const markdownContent = useMemo(() => {
    return formatMarkdown(scanResult, options);
  }, [scanResult, options]);

  const estimatedTokens = useMemo(() => {
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

  const handleCopyForAI = async (format: 'standard' | 'gemini' | 'claude' = promptFormat) => {
    let header = '';
    if (format === 'gemini') {
      header = `// Google Gemini & Antigravity Context\n// Project: ${scanResult.projectName} (${scanResult.stats.totalFiles} files)\n// Instructions: Review this complete codebase context to assist with software engineering tasks.\n\n`;
    } else if (format === 'claude') {
      header = `<project_context name="${scanResult.projectName}" files="${scanResult.stats.totalFiles}">\nThis is the complete structured codebase snapshot for "${scanResult.projectName}".\n</project_context>\n\n`;
    } else {
      header = `Here is the complete codebase snapshot for project "${scanResult.projectName}". Please analyze the project context, directory structure, and key file contents:\n\n`;
    }

    try {
      await navigator.clipboard.writeText(header + markdownContent);
      setCopiedPrompt(true);
      setShowFormatDropdown(false);
      setTimeout(() => setCopiedPrompt(false), 2500);
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

        <div className="flex items-center gap-2 relative">
          {/* Copy for AI Button with Format Selector */}
          <div className="relative inline-flex rounded-lg shadow-sm">
            <button
              onClick={() => handleCopyForAI(promptFormat)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-l-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
              title="Copy entire project context formatted for LLMs"
            >
              {copiedPrompt ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Context Copied for AI!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Copy for AI</span>
                </>
              )}
            </button>
            <button
              onClick={() => setShowFormatDropdown(!showFormatDropdown)}
              className="px-1.5 py-1.5 rounded-r-lg bg-indigo-700 hover:bg-indigo-600 border-l border-indigo-500/30 text-white text-xs transition cursor-pointer"
              title="Select AI Prompt Format"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showFormatDropdown && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-20 py-1 text-xs text-slate-300 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1 text-[10px] uppercase font-semibold text-slate-400 border-b border-slate-800">
                  Target AI Format
                </div>
                <button
                  onClick={() => {
                    setPromptFormat('standard');
                    handleCopyForAI('standard');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                >
                  <span className="font-medium">Standard Prompt Format</span>
                  {promptFormat === 'standard' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </button>
                <button
                  onClick={() => {
                    setPromptFormat('gemini');
                    handleCopyForAI('gemini');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                >
                  <span className="font-medium">Gemini / Claude Markdown</span>
                  {promptFormat === 'gemini' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </button>
                <button
                  onClick={() => {
                    setPromptFormat('claude');
                    handleCopyForAI('claude');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                >
                  <span className="font-medium">XML Tag Wrapped</span>
                  {promptFormat === 'claude' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </button>
              </div>
            )}
          </div>

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

