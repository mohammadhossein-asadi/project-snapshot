export interface SecretDetection {
  pattern: string;
  line: number;
  snippet: string;
}

export interface SecretInfo {
  isSecretFile: boolean;
  contentSecrets: SecretDetection[];
  hasSecrets: boolean;
}

export interface ScannedFile {
  path: string;
  name: string;
  isDirectory: boolean;
  isSymlink?: boolean;
  isBinary: boolean;
  symlinkTarget?: string;
  sizeBytes: number;
  sizeHuman: string;
  modified: string;
  permissions: string;
  mimeType: string;
  language: string;
  sha256: string;
  content: string | null;
  secretInfo: SecretInfo;
}

export interface ScanStats {
  totalFiles: number;
  totalDirectories: number;
  totalSizeBytes: number;
  totalSizeHuman: string;
  textFiles: number;
  binaryFiles: number;
  symlinks: number;
  secretDetections: number;
  languages: Record<string, number>;
  extensions: Record<string, number>;
  largestFiles: Array<{ path: string; size: number }>;
  excludedDirectories: string[];
}

export interface GitInfo {
  isRepository: boolean;
  branch?: string;
  commit?: string;
  shortCommit?: string;
  origin?: string;
  repositoryRoot?: string;
  modifiedFiles?: Array<{ path: string; status: string }>;
  untrackedFiles?: string[];
}

export interface ScanResult {
  projectName: string;
  files: ScannedFile[];
  errors: string[];
  stats: ScanStats;
  gitInfo: GitInfo;
  timestamp: string;
}

export interface GitCommit {
  hash: string;
  shortHash: string;
  author: string;
  authorEmail: string;
  date: string;
  relativeDate: string;
  message: string;
  insertions: number;
  deletions: number;
  tag?: string;
}

export interface FileGitHistory {
  filePath: string;
  commits: GitCommit[];
  lastModifiedBy: string;
  totalCommits: number;
}

export interface FileQualityScore {
  path: string;
  name: string;
  language: string;
  linesOfCode: number;
  commentLines: number;
  documentationCoverage: number; // 0 - 100%
  cyclomaticComplexity: number; // calculated branching score
  complexityRating: 'Low' | 'Moderate' | 'High' | 'Very High';
  maintainabilityIndex: number; // 0 - 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  needsRefactoring: boolean;
  refactorReasons: string[];
}

export interface ProjectQualityReport {
  overallScore: number; // 0 - 100
  overallGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  avgComplexity: number;
  avgDocumentationCoverage: number;
  totalLinesOfCode: number;
  totalCommentLines: number;
  highComplexityFilesCount: number;
  filesNeedingRefactor: FileQualityScore[];
  allFileScores: FileQualityScore[];
  recommendations: Array<{
    title: string;
    description: string;
    severity: 'critical' | 'warning' | 'info';
    file?: string;
  }>;
}

export interface PrioritizedContextFile {
  path: string;
  name: string;
  language: string;
  sizeBytes: number;
  sizeHuman: string;
  linesCount: number;
  estimatedTokens: number;
  importDegree: number;
  importanceScore: number;
  importanceReason: string;
  selected: boolean;
  isEntrypoint: boolean;
  content: string | null;
}

export interface SnapshotOptions {
  maxSizeBytes: number;
  excludedDirs: string[];
  includeDefaultHeavy: boolean;
  outputMarkdownName: string;
  outputManifestName: string;
}

export interface DiagnosticCommand {
  id: string;
  command: string;
  category: 'testing' | 'git' | 'build' | 'lint' | 'security' | 'inspect';
  title: string;
  description: string;
  iconName?: string;
}

export interface SimulationResult {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  timestamp: string;
  metrics?: Record<string, string | number>;
}
