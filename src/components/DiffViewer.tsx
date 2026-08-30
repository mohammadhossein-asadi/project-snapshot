import React, { useState, useMemo } from 'react';
import {
  GitCommit,
  Split,
  AlignJustify,
  Check,
  Copy,
  Clock,
  User,
  Palette,
  Eye,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { ScannedFile, GitInfo } from '../types';
import { getFileGitHistory } from '../lib/git';
import { computeDiff, getPreviousFileContent } from '../lib/diffHelper';

export type DiffThemeKey =
  | 'colorblind' // Sky Blue & Vermilion Orange (Deuteranopia / Protanopia safe)
  | 'github-dark' // Vivid Emerald & Crimson Red (High Contrast Dark)
  | 'solarized' // High Contrast Cyan & Magenta
  | 'monochrome'; // High Contrast Patterned / Grayscale

interface DiffThemeConfig {
  name: string;
  badge: string;
  description: string;
  addBg: string;
  addText: string;
  addGutter: string;
  addBorder: string;
  addSign: string;
  addSymbol: string;
  remBg: string;
  remText: string;
  remGutter: string;
  remBorder: string;
  remSign: string;
  remSymbol: string;
  modBg: string;
  modText: string;
  modGutter: string;
  modBorder: string;
  modSign: string;
  modSymbol: string;
  unchangedBg: string;
  unchangedText: string;
  gutterBg: string;
  gutterText: string;
  gutterBorder: string;
  headerAddText: string;
  headerRemText: string;
  headerModText: string;
}

export const DIFF_THEMES: Record<DiffThemeKey, DiffThemeConfig> = {
  colorblind: {
    name: 'Accessible Colorblind (Blue / Orange)',
    badge: 'Colorblind Safe',
    description: 'Deuteranopia & Protanopia optimized with high-contrast Sky Blue and Vivid Orange',
    addBg: 'bg-sky-950/40 hover:bg-sky-950/60',
    addText: 'text-sky-200 font-medium',
    addGutter: 'bg-sky-950/80 text-sky-300 border-sky-600/60 font-bold',
    addBorder: 'border-l-4 border-l-sky-400',
    addSign: 'text-sky-300 font-bold',
    addSymbol: '+',
    remBg: 'bg-amber-950/40 hover:bg-amber-950/60',
    remText: 'text-amber-200 font-medium',
    remGutter: 'bg-amber-950/80 text-amber-300 border-amber-600/60 font-bold',
    remBorder: 'border-l-4 border-l-amber-400',
    remSign: 'text-amber-300 font-bold',
    remSymbol: '−',
    modBg: 'bg-purple-950/40 hover:bg-purple-950/60',
    modText: 'text-purple-200 font-medium',
    modGutter: 'bg-purple-950/80 text-purple-300 border-purple-600/60 font-bold',
    modBorder: 'border-l-4 border-l-purple-400',
    modSign: 'text-purple-300 font-bold',
    modSymbol: '~',
    unchangedBg: 'bg-slate-950 hover:bg-slate-900/40',
    unchangedText: 'text-slate-300',
    gutterBg: 'bg-slate-950/90',
    gutterText: 'text-slate-500',
    gutterBorder: 'border-slate-800',
    headerAddText: 'text-sky-300',
    headerRemText: 'text-amber-300',
    headerModText: 'text-purple-300',
  },
  'github-dark': {
    name: 'GitHub Review Dark (Emerald / Crimson)',
    badge: 'Standard Pro',
    description: 'Vivid Emerald Green and Ruby Crimson with high luminance contrast',
    addBg: 'bg-emerald-950/40 hover:bg-emerald-950/60',
    addText: 'text-emerald-200 font-medium',
    addGutter: 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60 font-bold',
    addBorder: 'border-l-4 border-l-emerald-400',
    addSign: 'text-emerald-300 font-bold',
    addSymbol: '+',
    remBg: 'bg-rose-950/40 hover:bg-rose-950/60',
    remText: 'text-rose-200 font-medium',
    remGutter: 'bg-rose-950/80 text-rose-300 border-rose-600/60 font-bold',
    remBorder: 'border-l-4 border-l-rose-400',
    remSign: 'text-rose-300 font-bold',
    remSymbol: '−',
    modBg: 'bg-amber-950/40 hover:bg-amber-950/60',
    modText: 'text-amber-200 font-medium',
    modGutter: 'bg-amber-950/80 text-amber-300 border-amber-600/60 font-bold',
    modBorder: 'border-l-4 border-l-amber-400',
    modSign: 'text-amber-300 font-bold',
    modSymbol: '~',
    unchangedBg: 'bg-slate-950 hover:bg-slate-900/40',
    unchangedText: 'text-slate-300',
    gutterBg: 'bg-slate-950/90',
    gutterText: 'text-slate-500',
    gutterBorder: 'border-slate-800',
    headerAddText: 'text-emerald-300',
    headerRemText: 'text-rose-300',
    headerModText: 'text-amber-300',
  },
  solarized: {
    name: 'Solarized Cyber (Cyan / Magenta)',
    badge: 'Solarized',
    description: 'High contrast luminous Cyan additions and Deep Magenta deletions',
    addBg: 'bg-cyan-950/40 hover:bg-cyan-950/60',
    addText: 'text-cyan-200 font-medium',
    addGutter: 'bg-cyan-950/80 text-cyan-300 border-cyan-600/60 font-bold',
    addBorder: 'border-l-4 border-l-cyan-400',
    addSign: 'text-cyan-300 font-bold',
    addSymbol: '+',
    remBg: 'bg-fuchsia-950/40 hover:bg-fuchsia-950/60',
    remText: 'text-fuchsia-200 font-medium',
    remGutter: 'bg-fuchsia-950/80 text-fuchsia-300 border-fuchsia-600/60 font-bold',
    remBorder: 'border-l-4 border-l-fuchsia-400',
    remSign: 'text-fuchsia-300 font-bold',
    remSymbol: '−',
    modBg: 'bg-yellow-950/40 hover:bg-yellow-950/60',
    modText: 'text-yellow-200 font-medium',
    modGutter: 'bg-yellow-950/80 text-yellow-300 border-yellow-600/60 font-bold',
    modBorder: 'border-l-4 border-l-yellow-400',
    modSign: 'text-yellow-300 font-bold',
    modSymbol: '~',
    unchangedBg: 'bg-slate-950 hover:bg-slate-900/40',
    unchangedText: 'text-slate-300',
    gutterBg: 'bg-slate-950/90',
    gutterText: 'text-slate-500',
    gutterBorder: 'border-slate-800',
    headerAddText: 'text-cyan-300',
    headerRemText: 'text-fuchsia-300',
    headerModText: 'text-yellow-300',
  },
  monochrome: {
    name: 'High-Contrast Structured (Monochrome)',
    badge: 'WCAG AAA',
    description: 'Solid high-contrast borders and clear structural symbols for maximum readability',
    addBg: 'bg-slate-900/90 hover:bg-slate-850',
    addText: 'text-white font-semibold',
    addGutter: 'bg-white text-slate-950 border-white font-black',
    addBorder: 'border-l-4 border-l-white ring-1 ring-white/20',
    addSign: 'text-white font-black',
    addSymbol: '[+]',
    remBg: 'bg-slate-950 hover:bg-slate-900/60',
    remText: 'text-slate-400 line-through',
    remGutter: 'bg-slate-800 text-slate-200 border-slate-600 font-bold',
    remBorder: 'border-l-4 border-l-slate-500',
    remSign: 'text-slate-400 font-bold',
    remSymbol: '[−]',
    modBg: 'bg-slate-900 hover:bg-slate-800/80',
    modText: 'text-slate-200 font-medium italic',
    modGutter: 'bg-slate-700 text-white border-slate-500 font-bold',
    modBorder: 'border-l-4 border-l-slate-300',
    modSign: 'text-slate-300 font-bold',
    modSymbol: '[~]',
    unchangedBg: 'bg-slate-950 hover:bg-slate-900/40',
    unchangedText: 'text-slate-400',
    gutterBg: 'bg-slate-950/90',
    gutterText: 'text-slate-600',
    gutterBorder: 'border-slate-800',
    headerAddText: 'text-white',
    headerRemText: 'text-slate-400',
    headerModText: 'text-slate-300',
  },
};

interface DiffViewerProps {
  file: ScannedFile;
  gitInfo?: GitInfo;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ file, gitInfo }) => {
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');
  const [selectedCommitIdx, setSelectedCommitIdx] = useState<number>(0);
  const [themeKey, setThemeKey] = useState<DiffThemeKey>('colorblind');
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('sm');
  const [copied, setCopied] = useState(false);

  const theme = DIFF_THEMES[themeKey];

  const history = useMemo(() => {
    return getFileGitHistory(file, gitInfo);
  }, [file, gitInfo]);

  const commits = history.commits || [];
  const currentCommit = commits[selectedCommitIdx] || null;

  const previousContent = useMemo(() => {
    return getPreviousFileContent(file, currentCommit || undefined);
  }, [file, currentCommit]);

  const diffResult = useMemo(() => {
    return computeDiff(previousContent, file.content || '');
  }, [previousContent, file.content]);

  const handleCopyCurrent = async () => {
    if (!file.content) return;
    try {
      await navigator.clipboard.writeText(file.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const fontClass =
    fontSize === 'base'
      ? 'text-[13px] leading-relaxed'
      : fontSize === 'lg'
      ? 'text-[14px] leading-relaxed'
      : 'text-xs leading-5';

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 rounded-lg overflow-hidden border border-slate-800">
      {/* Diff Controls Header */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Commit Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <GitCommit className="w-3.5 h-3.5 text-blue-400" />
              Compare with:
            </span>
            {commits.length > 0 ? (
              <select
                value={selectedCommitIdx}
                onChange={(e) => setSelectedCommitIdx(Number(e.target.value))}
                className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-2.5 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none font-mono"
              >
                {commits.map((c, idx) => (
                  <option key={c.hash} value={idx}>
                    {c.hash.substring(0, 7)} — {c.message.slice(0, 32)} ({c.relativeDate})
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-slate-400 italic">Previous HEAD commit</span>
            )}
          </div>

          {/* Stats Badges with Accessibility Markers */}
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-700 flex items-center gap-1">
              <span className={theme.addSign}>{theme.addSymbol}</span>
              <span className="text-slate-200 font-semibold">{diffResult.additions}</span>
              <span className="text-slate-400">added</span>
            </span>

            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-700 flex items-center gap-1">
              <span className={theme.remSign}>{theme.remSymbol}</span>
              <span className="text-slate-200 font-semibold">{diffResult.deletions}</span>
              <span className="text-slate-400">removed</span>
            </span>

            {diffResult.modifications > 0 && (
              <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-700 flex items-center gap-1">
                <span className={theme.modSign}>{theme.modSymbol}</span>
                <span className="text-slate-200 font-semibold">{diffResult.modifications}</span>
                <span className="text-slate-400">modified</span>
              </span>
            )}
          </div>
        </div>

        {/* Right Action Tools: Accessible Theme Selector, View Toggle, Font Size & Copy */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Accessible Theme Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded px-2 py-0.5">
            <Palette className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={themeKey}
              onChange={(e) => setThemeKey(e.target.value as DiffThemeKey)}
              className="bg-transparent text-slate-200 text-xs outline-none cursor-pointer pr-1"
              title="Select high-contrast and colorblind accessible diff color scheme"
            >
              <option value="colorblind" className="bg-slate-900 text-slate-200">
                Accessible Colorblind (Blue / Orange)
              </option>
              <option value="github-dark" className="bg-slate-900 text-slate-200">
                GitHub Review Dark (Emerald / Crimson)
              </option>
              <option value="solarized" className="bg-slate-900 text-slate-200">
                Solarized Cyber (Cyan / Magenta)
              </option>
              <option value="monochrome" className="bg-slate-900 text-slate-200">
                High-Contrast Patterned (WCAG AAA)
              </option>
            </select>
          </div>

          {/* Font Size Zoom */}
          <div className="bg-slate-950 border border-slate-800 rounded p-0.5 flex items-center">
            <button
              onClick={() => setFontSize(fontSize === 'lg' ? 'base' : 'sm')}
              disabled={fontSize === 'sm'}
              className="p-1 rounded text-slate-400 hover:text-slate-200 disabled:opacity-40"
              title="Decrease Font Size"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <button
              onClick={() => setFontSize(fontSize === 'sm' ? 'base' : 'lg')}
              disabled={fontSize === 'lg'}
              className="p-1 rounded text-slate-400 hover:text-slate-200 disabled:opacity-40"
              title="Increase Font Size"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="bg-slate-950 border border-slate-800 rounded p-0.5 flex items-center">
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 rounded flex items-center gap-1 transition ${
                viewMode === 'split'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Side-by-side split comparison"
            >
              <Split className="w-3 h-3" />
              <span>Split</span>
            </button>
            <button
              onClick={() => setViewMode('unified')}
              className={`px-2.5 py-1 rounded flex items-center gap-1 transition ${
                viewMode === 'unified'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Inline unified diff"
            >
              <AlignJustify className="w-3 h-3" />
              <span>Unified</span>
            </button>
          </div>

          <button
            onClick={handleCopyCurrent}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition"
            title="Copy current file contents"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Theme Info & Commit Context Banner */}
      <div className="px-3.5 py-1.5 bg-slate-950/90 border-b border-slate-800 text-[11px] text-slate-400 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-slate-300 font-medium">
            <Eye className="w-3 h-3 text-blue-400" />
            <span className="font-semibold text-white">{theme.name}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
              {theme.badge}
            </span>
          </span>
          <span className="hidden sm:inline text-slate-500">•</span>
          <span className="hidden sm:inline text-slate-400">{theme.description}</span>
        </div>

        {currentCommit && (
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-slate-300">
              <User className="w-3 h-3 text-slate-500" />
              {currentCommit.author}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              {currentCommit.relativeDate}
            </span>
          </div>
        )}
      </div>

      {/* Main Diff Code Display */}
      <div className={`flex-1 overflow-auto font-mono ${fontClass} select-text`}>
        {viewMode === 'split' ? (
          /* Side-by-Side Split View */
          <div className="min-w-[720px]">
            {/* Split Column Headers */}
            <div className="grid grid-cols-2 bg-slate-900/90 border-b border-slate-800 text-[11px] font-semibold sticky top-0 z-10">
              <div className="p-2 border-r border-slate-800 flex items-center justify-between bg-slate-900/95">
                <span className={`flex items-center gap-1.5 ${theme.headerRemText}`}>
                  <span className="font-bold">{theme.remSymbol}</span>
                  Previous Revision ({currentCommit ? currentCommit.hash.substring(0, 7) : 'Base'})
                </span>
                <span className="text-[10px] text-slate-500 font-normal">Original Content</span>
              </div>
              <div className="p-2 flex items-center justify-between bg-slate-900/95">
                <span className={`flex items-center gap-1.5 ${theme.headerAddText}`}>
                  <span className="font-bold">{theme.addSymbol}</span>
                  Current Revision (Head Workspace)
                </span>
                <span className="text-[10px] text-slate-500 font-normal">Active Scanned File</span>
              </div>
            </div>

            {/* Split Rows */}
            <div className="divide-y divide-slate-900/40">
              {diffResult.sideBySideRows.map((row, index) => {
                const isLeftRemoved = row.left.type === 'removed';
                const isLeftModified = row.left.type === 'modified';
                const isRightAdded = row.right.type === 'added';
                const isRightModified = row.right.type === 'modified';

                // Left cell styling
                const leftBg = isLeftModified
                  ? `${theme.modBg} ${theme.modBorder}`
                  : isLeftRemoved
                  ? `${theme.remBg} ${theme.remBorder}`
                  : row.left.type === 'empty'
                  ? 'bg-slate-950/40'
                  : theme.unchangedBg;

                const leftText = isLeftModified
                  ? theme.modText
                  : isLeftRemoved
                  ? theme.remText
                  : theme.unchangedText;

                const leftGutter = isLeftModified
                  ? theme.modGutter
                  : isLeftRemoved
                  ? theme.remGutter
                  : `${theme.gutterBg} ${theme.gutterText}`;

                // Right cell styling
                const rightBg = isRightModified
                  ? `${theme.modBg} ${theme.modBorder}`
                  : isRightAdded
                  ? `${theme.addBg} ${theme.addBorder}`
                  : row.right.type === 'empty'
                  ? 'bg-slate-950/40'
                  : theme.unchangedBg;

                const rightText = isRightModified
                  ? theme.modText
                  : isRightAdded
                  ? theme.addText
                  : theme.unchangedText;

                const rightGutter = isRightModified
                  ? theme.modGutter
                  : isRightAdded
                  ? theme.addGutter
                  : `${theme.gutterBg} ${theme.gutterText}`;

                return (
                  <div key={index} className="grid grid-cols-2 transition-colors">
                    {/* Left Column (Previous) */}
                    <div className={`flex border-r border-slate-800/90 ${leftBg} ${leftText}`}>
                      <div
                        className={`w-11 px-2 py-0.5 text-right select-none border-r ${theme.gutterBorder} text-[11px] ${leftGutter}`}
                      >
                        {row.left.lineNumber || ''}
                      </div>
                      <div className="w-6 text-center select-none py-0.5 shrink-0">
                        {isLeftModified ? (
                          <span className={theme.modSign}>{theme.modSymbol}</span>
                        ) : isLeftRemoved ? (
                          <span className={theme.remSign}>{theme.remSymbol}</span>
                        ) : (
                          ''
                        )}
                      </div>
                      <div className="flex-1 px-2 py-0.5 whitespace-pre overflow-x-auto">
                        {row.left.content}
                      </div>
                    </div>

                    {/* Right Column (Current) */}
                    <div className={`flex ${rightBg} ${rightText}`}>
                      <div
                        className={`w-11 px-2 py-0.5 text-right select-none border-r ${theme.gutterBorder} text-[11px] ${rightGutter}`}
                      >
                        {row.right.lineNumber || ''}
                      </div>
                      <div className="w-6 text-center select-none py-0.5 shrink-0">
                        {isRightModified ? (
                          <span className={theme.modSign}>{theme.modSymbol}</span>
                        ) : isRightAdded ? (
                          <span className={theme.addSign}>{theme.addSymbol}</span>
                        ) : (
                          ''
                        )}
                      </div>
                      <div className="flex-1 px-2 py-0.5 whitespace-pre overflow-x-auto">
                        {row.right.content}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Inline Unified View */
          <div className="divide-y divide-slate-900/40 min-w-[640px]">
            {/* Header info */}
            <div className="bg-slate-900/90 border-b border-slate-800 p-2 text-[11px] text-slate-400 flex items-center justify-between sticky top-0 z-10">
              <span className="font-semibold text-slate-300">Unified Inline Diff Stream</span>
              <span className="text-[10px] text-slate-500 font-mono">
                {diffResult.unifiedLines.length} total lines
              </span>
            </div>

            {diffResult.unifiedLines.map((line, index) => {
              const isAdded = line.type === 'added';
              const isRemoved = line.type === 'removed';
              const isModified = line.type === 'modified';

              const rowBg = isModified
                ? `${theme.modBg} ${theme.modBorder}`
                : isAdded
                ? `${theme.addBg} ${theme.addBorder}`
                : isRemoved
                ? `${theme.remBg} ${theme.remBorder}`
                : theme.unchangedBg;

              const rowText = isModified
                ? theme.modText
                : isAdded
                ? theme.addText
                : isRemoved
                ? theme.remText
                : theme.unchangedText;

              const gutterL = isRemoved
                ? theme.remGutter
                : `${theme.gutterBg} ${theme.gutterText}`;

              const gutterR = isAdded
                ? theme.addGutter
                : `${theme.gutterBg} ${theme.gutterText}`;

              return (
                <div key={index} className={`flex ${rowBg} ${rowText}`}>
                  {/* Left Line Number */}
                  <div
                    className={`w-11 px-2 py-0.5 text-right select-none border-r ${theme.gutterBorder} text-[11px] ${gutterL}`}
                  >
                    {line.leftLineNumber || ''}
                  </div>

                  {/* Right Line Number */}
                  <div
                    className={`w-11 px-2 py-0.5 text-right select-none border-r ${theme.gutterBorder} text-[11px] ${gutterR}`}
                  >
                    {line.rightLineNumber || ''}
                  </div>

                  {/* Marker Sign */}
                  <div className="w-6 text-center select-none py-0.5 shrink-0">
                    {isAdded ? (
                      <span className={theme.addSign}>{theme.addSymbol}</span>
                    ) : isRemoved ? (
                      <span className={theme.remSign}>{theme.remSymbol}</span>
                    ) : isModified ? (
                      <span className={theme.modSign}>{theme.modSymbol}</span>
                    ) : (
                      ' '
                    )}
                  </div>

                  {/* Code Line */}
                  <div className="flex-1 px-2 py-0.5 whitespace-pre overflow-x-auto">
                    {line.content}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiffViewer;
