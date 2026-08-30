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

export interface SnapshotOptions {
  maxSizeBytes: number;
  excludedDirs: string[];
  includeDefaultHeavy: boolean;
  outputMarkdownName: string;
  outputManifestName: string;
}
