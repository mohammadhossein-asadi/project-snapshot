import React, { useState, useEffect, useMemo } from 'react';
import {
  FileCode,
  FolderTree,
  ShieldAlert,
  FileText,
  Braces,
  BarChart3,
  Share2,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { Header } from './components/Header';
import { ScannerUploader } from './components/ScannerUploader';
import { StatsGrid } from './components/StatsGrid';
import { TreeViewer } from './components/TreeViewer';
import { FileExplorer } from './components/FileExplorer';
import { SecretAudit } from './components/SecretAudit';
import { MarkdownViewer } from './components/MarkdownViewer';
import { ManifestViewer } from './components/ManifestViewer';
import { AnalyticsView } from './components/AnalyticsView';
import { DependencyGraph } from './components/DependencyGraph';
import { AiContextGenerator } from './components/AiContextGenerator';
import { ExecutionSimulationView } from './components/ExecutionSimulationView';
import { GlobalSearch } from './components/GlobalSearch';
import { ExportToolbar } from './components/ExportToolbar';
import { OptionsModal } from './components/OptionsModal';
import { RecentFilesWidget } from './components/RecentFilesWidget';
import { motion, AnimatePresence } from 'motion/react';
import { ScanResult, SnapshotOptions } from './types';
import { DEFAULT_EXCLUDED_DIRS, DEFAULT_OUTPUT, DEFAULT_MANIFEST } from './lib/constants';
import { loadSampleProject, scanFromFiles, scanFromZip } from './lib/scanner';

export const App: React.FC = () => {
  const [options, setOptions] = useState<SnapshotOptions>({
    maxSizeBytes: 10 * 1024 * 1024,
    excludedDirs: [...DEFAULT_EXCLUDED_DIRS],
    includeDefaultHeavy: false,
    outputMarkdownName: DEFAULT_OUTPUT,
    outputManifestName: DEFAULT_MANIFEST,
  });

  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    | 'explorer'
    | 'tree'
    | 'simulation'
    | 'dependencies'
    | 'ai-context'
    | 'secrets'
    | 'markdown'
    | 'manifest'
    | 'analytics'
  >('explorer');
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [currentUploadedFiles, setCurrentUploadedFiles] = useState<File[] | null>(null);
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [focusedFilePath, setFocusedFilePath] = useState<string>('');
  const [sessionExcludedPaths, setSessionExcludedPaths] = useState<string[]>([]);

  // Initialize with sample project snapshot on startup
  useEffect(() => {
    handleLoadDemo();
  }, []);

  const handleLoadDemo = async () => {
    setIsLoading(true);
    setCurrentUploadedFiles(null);
    try {
      const result = await loadSampleProject(options);
      setScanResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanFolder = async (filesList: FileList | File[]) => {
    setIsLoading(true);
    const filesArray = Array.from(filesList);
    setCurrentUploadedFiles(filesArray);

    try {
      let projectName = 'uploaded-project';
      if (filesArray.length > 0) {
        const first = filesArray[0];
        const rel = (first as any).webkitRelativePath;
        if (rel) {
          projectName = rel.split('/')[0] || projectName;
        }
      }

      const files = filesArray.map((f) => ({ file: f }));
      const result = await scanFromFiles(files, projectName, options);
      setScanResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanZip = async (zipFile: File) => {
    setIsLoading(true);
    setCurrentUploadedFiles(null);
    try {
      const result = await scanFromZip(zipFile, options);
      setScanResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRescanWithNewOptions = async (newOptions: SnapshotOptions) => {
    setOptions(newOptions);
    setIsLoading(true);
    try {
      if (currentUploadedFiles && currentUploadedFiles.length > 0) {
        let projectName = 'uploaded-project';
        const first = currentUploadedFiles[0];
        const rel = (first as any).webkitRelativePath;
        if (rel) {
          projectName = rel.split('/')[0] || projectName;
        }
        const files = currentUploadedFiles.map((f) => ({ file: f }));
        const result = await scanFromFiles(files, projectName, newOptions);
        setScanResult(result);
      } else {
        const result = await loadSampleProject(newOptions);
        setScanResult(result);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFileFromGraph = (path: string) => {
    setFocusedFilePath(path);
    setActiveTab('explorer');
  };

  // Quick Ignore handler
  const handleQuickIgnore = (path: string) => {
    setSessionExcludedPaths((prev) => {
      if (prev.includes(path)) return prev;
      return [...prev, path];
    });
  };

  const handleRestoreExcludedPath = (path: string) => {
    setSessionExcludedPaths((prev) => prev.filter((p) => p !== path));
  };

  const handleClearAllSessionExclusions = () => {
    setSessionExcludedPaths([]);
  };

  // Filter files by global search and session exclusions
  const globalFilteredFiles = useMemo(() => {
    if (!scanResult) return [];
    let list = scanResult.files;

    if (sessionExcludedPaths.length > 0) {
      list = list.filter((f) => {
        return !sessionExcludedPaths.some((ex) => {
          return f.path === ex || f.path.startsWith(ex + '/') || f.path.includes('/' + ex + '/');
        });
      });
    }

    if (!globalSearch.trim()) return list;
    const lower = globalSearch.toLowerCase();
    return list.filter(
      (f) =>
        f.path.toLowerCase().includes(lower) ||
        (f.language && f.language.toLowerCase().includes(lower))
    );
  }, [scanResult, globalSearch, sessionExcludedPaths]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500/30 selection:text-blue-200">
      <Header onLoadDemo={handleLoadDemo} isLoading={isLoading} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Scanner Dropzone Card */}
        <ScannerUploader
          onScanFolder={handleScanFolder}
          onScanZip={handleScanZip}
          onLoadDemo={handleLoadDemo}
          isLoading={isLoading}
          options={options}
          onOpenOptions={() => setIsOptionsOpen(true)}
        />

        {scanResult && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Metric Cards */}
            <StatsGrid
              stats={scanResult.stats}
              gitInfo={scanResult.gitInfo}
              projectName={scanResult.projectName}
            />

            {/* Quick Export Toolbar */}
            <ExportToolbar scanResult={scanResult} options={options} />

            {/* Hot & Recent Files Activity Widget */}
            <RecentFilesWidget
              files={globalFilteredFiles}
              gitInfo={scanResult.gitInfo}
              onSelectFile={(p) => {
                setFocusedFilePath(p);
                setActiveTab('explorer');
              }}
            />

            {/* Global Search Input Field above Tab Navigation */}
            <GlobalSearch
              searchTerm={globalSearch}
              onSearchChange={(val) => setGlobalSearch(val)}
              files={scanResult.files}
              onSelectFile={(p) => {
                setFocusedFilePath(p);
                setActiveTab('explorer');
              }}
            />

            {/* Navigation Tabs */}
            <div className="border-b border-slate-800">
              <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-px scrollbar-none">
                <button
                  onClick={() => setActiveTab('explorer')}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-lg text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
                    activeTab === 'explorer'
                      ? 'border-blue-500 text-blue-400 bg-slate-900/60'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                  }`}
                >
                  <FileCode className="w-4 h-4" />
                  <span>File Explorer</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {globalFilteredFiles.filter((f) => !f.isDirectory).length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('tree')}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-lg text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
                    activeTab === 'tree'
                      ? 'border-cyan-500 text-cyan-400 bg-slate-900/60'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                  }`}
                >
                  <FolderTree className="w-4 h-4" />
                  <span>Directory Tree</span>
                </button>

                {/* Execution Simulation Tab */}
                <button
                  onClick={() => setActiveTab('simulation')}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-lg text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
                    activeTab === 'simulation'
                      ? 'border-emerald-500 text-emerald-400 bg-slate-900/60'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                  }`}
                >
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Execution Simulation</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-semibold">
                    CLI
                  </span>
                </button>

                {/* D3.js Import Relationships & Dependency Graph Tab */}
                <button
                  onClick={() => setActiveTab('dependencies')}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-lg text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
                    activeTab === 'dependencies'
                      ? 'border-indigo-500 text-indigo-400 bg-slate-900/60'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                  }`}
                >
                  <Share2 className="w-4 h-4 text-indigo-400" />
                  <span>Dependency Graph</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-medium">
                    D3
                  </span>
                </button>

                {/* AI Context Generator Tab */}
                <button
                  onClick={() => setActiveTab('ai-context')}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-lg text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
                    activeTab === 'ai-context'
                      ? 'border-blue-500 text-blue-400 bg-slate-900/60'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>AI Context Generator</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-mono font-bold">
                    LLM
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('secrets')}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-lg text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
                    activeTab === 'secrets'
                      ? 'border-amber-500 text-amber-400 bg-slate-900/60'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Security Audit</span>
                  {scanResult.stats.secretDetections > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 font-mono font-bold">
                      {scanResult.stats.secretDetections}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('markdown')}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-lg text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
                    activeTab === 'markdown'
                      ? 'border-blue-500 text-blue-400 bg-slate-900/60'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Markdown Snapshot</span>
                </button>

                <button
                  onClick={() => setActiveTab('manifest')}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-lg text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
                    activeTab === 'manifest'
                      ? 'border-purple-500 text-purple-400 bg-slate-900/60'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                  }`}
                >
                  <Braces className="w-4 h-4" />
                  <span>JSON Manifest</span>
                </button>

                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-lg text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
                    activeTab === 'analytics'
                      ? 'border-emerald-500 text-emerald-400 bg-slate-900/60'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Analytics & Quality</span>
                </button>
              </div>
            </div>

            {/* Tab Views with Smooth Fade/Slide-Up Transitions */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                {activeTab === 'explorer' && (
                  <FileExplorer
                    files={globalFilteredFiles}
                    initialSelectedPath={focusedFilePath}
                    globalSearch={globalSearch}
                    gitInfo={scanResult.gitInfo}
                    sessionExcludedPaths={sessionExcludedPaths}
                    onQuickIgnore={handleQuickIgnore}
                    onRestoreExcludedPath={handleRestoreExcludedPath}
                    onClearAllSessionExclusions={handleClearAllSessionExclusions}
                  />
                )}

                {activeTab === 'tree' && (
                  <TreeViewer
                    files={globalFilteredFiles}
                    includeDefaultHeavy={options.includeDefaultHeavy}
                  />
                )}

                {activeTab === 'simulation' && (
                  <ExecutionSimulationView scanResult={scanResult} />
                )}

                {activeTab === 'dependencies' && (
                  <DependencyGraph
                    files={globalFilteredFiles}
                    onSelectFile={handleSelectFileFromGraph}
                    projectName={scanResult.projectName}
                  />
                )}

                {activeTab === 'ai-context' && (
                  <AiContextGenerator
                    scanResult={scanResult}
                    onSelectFile={handleSelectFileFromGraph}
                  />
                )}

                {activeTab === 'secrets' && (
                  <SecretAudit files={globalFilteredFiles} />
                )}

                {activeTab === 'markdown' && (
                  <MarkdownViewer scanResult={scanResult} options={options} />
                )}

                {activeTab === 'manifest' && (
                  <ManifestViewer scanResult={scanResult} options={options} />
                )}

                {activeTab === 'analytics' && (
                  <AnalyticsView
                    stats={scanResult.stats}
                    files={globalFilteredFiles}
                    gitInfo={scanResult.gitInfo}
                    onSelectFile={handleSelectFileFromGraph}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Options Modal */}
      <OptionsModal
        isOpen={isOptionsOpen}
        onClose={() => setIsOptionsOpen(false)}
        options={options}
        onOptionsChange={(newOpts) => handleRescanWithNewOptions(newOpts)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between flex-wrap gap-2">
          <span>Project Snapshot — Zero-dependency codebase snapshot generator</span>
          <span className="font-mono text-[11px]">MIT License • Clean Code for AI Prompts</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
