import React, { useState, useMemo } from 'react';
import { Copy, Check, Download, Braces } from 'lucide-react';
import { ScanResult, SnapshotOptions } from '../types';
import { formatJsonManifest } from '../lib/output';

interface ManifestViewerProps {
  scanResult: ScanResult;
  options: SnapshotOptions;
}

export const ManifestViewer: React.FC<ManifestViewerProps> = ({ scanResult, options }) => {
  const [copied, setCopied] = useState(false);

  const jsonString = useMemo(() => {
    const manifest = formatJsonManifest(scanResult);
    return JSON.stringify(manifest, null, 2);
  }, [scanResult]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = options.outputManifestName || 'PROJECT-SNAPSHOT.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Braces className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            {options.outputManifestName}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {(jsonString.length / 1024).toFixed(1)} KB
          </span>
        </div>

        <div className="flex items-center gap-2">
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
                <span>Copy JSON</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-purple-400" />
            <span>Download Manifest</span>
          </button>
        </div>
      </div>

      {/* JSON Viewer */}
      <div className="p-4 bg-slate-950 overflow-y-auto max-h-[560px] font-mono text-xs text-slate-300 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
        <pre className="whitespace-pre overflow-x-auto text-purple-300/90">
          {jsonString}
        </pre>
      </div>
    </div>
  );
};
