import React, { useState } from 'react';
import { Download, FileText, Braces, Sparkles, Check, Archive, FileDown } from 'lucide-react';
import JSZip from 'jszip';
import { ScanResult, SnapshotOptions } from '../types';
import { formatMarkdown, formatJsonManifest } from '../lib/output';
import { generatePdfReport } from '../lib/pdfReport';

interface ExportToolbarProps {
  scanResult: ScanResult;
  options: SnapshotOptions;
}

export const ExportToolbar: React.FC<ExportToolbarProps> = ({ scanResult, options }) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    try {
      generatePdfReport(scanResult, options);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadMarkdown = () => {
    const md = formatMarkdown(scanResult, options);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = options.outputMarkdownName || 'README.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadManifest = () => {
    const manifest = formatJsonManifest(scanResult);
    const jsonStr = JSON.stringify(manifest, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = options.outputManifestName || 'PROJECT-SNAPSHOT.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyPrompt = async () => {
    const md = formatMarkdown(scanResult, options);
    const promptHeader = `Below is the complete codebase snapshot for project "${scanResult.projectName}". It includes the project tree, environment details, file stats, and text content:\n\n`;
    try {
      await navigator.clipboard.writeText(promptHeader + md);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleExportZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const md = formatMarkdown(scanResult, options);
      const manifest = formatJsonManifest(scanResult);

      zip.file(options.outputMarkdownName || 'README.md', md);
      zip.file(options.outputManifestName || 'PROJECT-SNAPSHOT.json', JSON.stringify(manifest, null, 2));

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${scanResult.projectName}-snapshot.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
          <Download className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Export Snapshot Artifacts</h4>
          <p className="text-xs text-slate-400">Save Markdown, machine-readable JSON manifest, or prompt payload</p>
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto justify-end">
        <button
          onClick={handleCopyPrompt}
          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
        >
          {copiedPrompt ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Prompt Copied!</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Copy AI Prompt</span>
            </>
          )}
        </button>

        <button
          onClick={handleDownloadMarkdown}
          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5 text-blue-400" />
          <span>Markdown</span>
        </button>

        <button
          onClick={handleDownloadManifest}
          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
        >
          <Braces className="w-3.5 h-3.5 text-purple-400" />
          <span>JSON</span>
        </button>

        <button
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf}
          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition disabled:opacity-50 cursor-pointer"
          title="Download comprehensive PDF architecture & quality audit report"
        >
          <FileDown className="w-3.5 h-3.5 text-rose-400" />
          <span>{isGeneratingPdf ? 'Generating PDF...' : 'PDF Report'}</span>
        </button>

        <button
          onClick={handleExportZip}
          disabled={isZipping}
          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition disabled:opacity-50 cursor-pointer"
        >
          <Archive className="w-3.5 h-3.5 text-amber-400" />
          <span>{isZipping ? 'Packaging...' : 'ZIP Bundle'}</span>
        </button>
      </div>
    </div>
  );
};
