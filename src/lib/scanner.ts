import JSZip from 'jszip';
import { ScannedFile, ScanResult, ScanStats, SnapshotOptions, GitInfo, SecretInfo } from '../types';
import { detectLanguage } from './language';
import { computeSHA256 } from './hashing';
import { scanForSecrets } from './secrets';
import { formatBytes } from './output';
import { BINARY_EXTENSIONS, TEXT_EXTENSIONS, DEFAULT_EXCLUDED_DIRS, SAMPLE_PROJECT_SNAPSHOT_REPO } from './constants';

function isBinaryFile(path: string, buffer?: Uint8Array): boolean {
  const dotIdx = path.lastIndexOf('.');
  const ext = dotIdx !== -1 ? path.substring(dotIdx).toLowerCase() : '';
  
  if (BINARY_EXTENSIONS.has(ext)) return true;
  if (TEXT_EXTENSIONS.has(ext)) return false;

  if (buffer) {
    const checkLength = Math.min(buffer.length, 1024);
    for (let i = 0; i < checkLength; i++) {
      if (buffer[i] === 0) return true; // Null byte indicates binary
    }
  }

  return false;
}

function normalizePath(rawPath: string): string {
  return rawPath.replace(/\\/g, '/').replace(/^\/+/, '');
}

export async function scanFromFiles(
  files: Array<{ file: File; customPath?: string }>,
  projectName: string,
  options: SnapshotOptions,
  gitInfo: GitInfo = { isRepository: false }
): Promise<ScanResult> {
  const scannedFiles: ScannedFile[] = [];
  const errors: string[] = [];
  const excludedSet = new Set(options.excludedDirs);
  const dirSet = new Set<string>();

  for (const item of files) {
    try {
      const relPath = normalizePath(item.customPath || (item.file as any).webkitRelativePath || item.file.name);
      
      // Exclude generated snapshot files
      if (item.file.name === "README.md" && (item.file.size === 0 || relPath === "README.md")) {
        // keep unless specifically named
      }
      if (relPath === options.outputMarkdownName || relPath === options.outputManifestName) {
        continue;
      }

      // Check excluded directories
      const parts = relPath.split('/');
      let isExcluded = false;
      if (!options.includeDefaultHeavy) {
        for (let i = 0; i < parts.length - 1; i++) {
          if (excludedSet.has(parts[i])) {
            isExcluded = true;
            break;
          }
        }
      }
      if (isExcluded) continue;

      // Track parent directory paths
      for (let i = 1; i < parts.length; i++) {
        dirSet.add(parts.slice(0, i).join('/'));
      }

      const sizeBytes = item.file.size;
      const modified = new Date(item.file.lastModified || Date.now()).toISOString();
      const mimeType = item.file.type || 'application/octet-stream';
      const language = detectLanguage(relPath);

      // Read content
      const arrayBuffer = await item.file.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      const isBinary = isBinaryFile(relPath, uint8);
      const hash = await computeSHA256(arrayBuffer);

      let textContent: string | null = null;
      let secretInfo: SecretInfo = { isSecretFile: false, contentSecrets: [], hasSecrets: false };

      if (!isBinary) {
        if (sizeBytes <= options.maxSizeBytes) {
          try {
            const decoder = new TextDecoder('utf-8');
            textContent = decoder.decode(uint8);
          } catch {
            try {
              const decoder = new TextDecoder('windows-1252');
              textContent = decoder.decode(uint8);
            } catch {
              textContent = "[Error: Unable to decode file]";
            }
          }
        }
        secretInfo = scanForSecrets(item.file.name, textContent);
      } else {
        secretInfo = scanForSecrets(item.file.name, null);
      }

      scannedFiles.push({
        path: relPath,
        name: item.file.name,
        isDirectory: false,
        isBinary,
        sizeBytes,
        sizeHuman: formatBytes(sizeBytes),
        modified,
        permissions: "644",
        mimeType,
        language,
        sha256: hash,
        content: textContent,
        secretInfo,
      });
    } catch (err: any) {
      errors.push(`Error processing ${item.file.name}: ${err.message || String(err)}`);
    }
  }

  // Sort files deterministically
  scannedFiles.sort((a, b) => a.path.toLowerCase().localeCompare(b.path.toLowerCase()));

  const stats = computeStats(scannedFiles, dirSet.size, options.includeDefaultHeavy);

  return {
    projectName: projectName || "project",
    files: scannedFiles,
    errors,
    stats,
    gitInfo,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
  };
}

export async function scanFromZip(
  zipFile: File,
  options: SnapshotOptions
): Promise<ScanResult> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(zipFile);
  const scannedFiles: ScannedFile[] = [];
  const errors: string[] = [];
  const excludedSet = new Set(options.excludedDirs);
  const dirSet = new Set<string>();

  const entries: Array<{ path: string; entry: JSZip.JSZipObject }> = [];
  loadedZip.forEach((relativePath, entry) => {
    entries.push({ path: relativePath, entry });
  });

  for (const { path: rawPath, entry } of entries) {
    if (entry.dir) {
      dirSet.add(normalizePath(rawPath));
      continue;
    }

    try {
      const relPath = normalizePath(rawPath);
      if (relPath === options.outputMarkdownName || relPath === options.outputManifestName) {
        continue;
      }

      const parts = relPath.split('/');
      let isExcluded = false;
      if (!options.includeDefaultHeavy) {
        for (let i = 0; i < parts.length - 1; i++) {
          if (excludedSet.has(parts[i])) {
            isExcluded = true;
            break;
          }
        }
      }
      if (isExcluded) continue;

      for (let i = 1; i < parts.length; i++) {
        dirSet.add(parts.slice(0, i).join('/'));
      }

      const fileName = parts[parts.length - 1];
      const uint8 = await entry.async('uint8array');
      const sizeBytes = uint8.length;
      const modified = (entry.date || new Date()).toISOString();
      const language = detectLanguage(relPath);
      const isBinary = isBinaryFile(relPath, uint8);
      const hash = await computeSHA256(uint8);

      let textContent: string | null = null;
      let secretInfo: SecretInfo = { isSecretFile: false, contentSecrets: [], hasSecrets: false };

      if (!isBinary) {
        if (sizeBytes <= options.maxSizeBytes) {
          try {
            const decoder = new TextDecoder('utf-8');
            textContent = decoder.decode(uint8);
          } catch {
            textContent = "[Error: Unable to decode file]";
          }
        }
        secretInfo = scanForSecrets(fileName, textContent);
      } else {
        secretInfo = scanForSecrets(fileName, null);
      }

      scannedFiles.push({
        path: relPath,
        name: fileName,
        isDirectory: false,
        isBinary,
        sizeBytes,
        sizeHuman: formatBytes(sizeBytes),
        modified,
        permissions: "644",
        mimeType: "text/plain",
        language,
        sha256: hash,
        content: textContent,
        secretInfo,
      });
    } catch (err: any) {
      errors.push(`Error processing ${rawPath}: ${err.message || String(err)}`);
    }
  }

  scannedFiles.sort((a, b) => a.path.toLowerCase().localeCompare(b.path.toLowerCase()));
  const stats = computeStats(scannedFiles, dirSet.size, options.includeDefaultHeavy);

  const projectName = zipFile.name.replace(/\.zip$/i, '') || "project";

  return {
    projectName,
    files: scannedFiles,
    errors,
    stats,
    gitInfo: { isRepository: false },
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
  };
}

export async function loadSampleProject(options: SnapshotOptions): Promise<ScanResult> {
  const sample = SAMPLE_PROJECT_SNAPSHOT_REPO;
  const scannedFiles: ScannedFile[] = [];
  const dirSet = new Set<string>();

  for (const f of sample.files) {
    const parts = f.path.split('/');
    for (let i = 1; i < parts.length; i++) {
      dirSet.add(parts.slice(0, i).join('/'));
    }

    const encoder = new TextEncoder();
    const bytes = encoder.encode(f.content);
    const sizeBytes = bytes.length;
    const hash = await computeSHA256(bytes);
    const language = detectLanguage(f.path);
    const secretInfo = scanForSecrets(f.name, f.content);

    scannedFiles.push({
      path: f.path,
      name: f.name,
      isDirectory: false,
      isBinary: false,
      sizeBytes,
      sizeHuman: formatBytes(sizeBytes),
      modified: new Date().toISOString(),
      permissions: f.name.endsWith('.py') ? "755" : "644",
      mimeType: "text/plain",
      language,
      sha256: hash,
      content: f.content,
      secretInfo,
    });
  }

  scannedFiles.sort((a, b) => a.path.toLowerCase().localeCompare(b.path.toLowerCase()));
  const stats = computeStats(scannedFiles, dirSet.size, options.includeDefaultHeavy);

  return {
    projectName: sample.name,
    files: scannedFiles,
    errors: [],
    stats,
    gitInfo: sample.gitInfo,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
  };
}

function computeStats(
  files: ScannedFile[],
  dirCount: number,
  includeDefaultHeavy: boolean
): ScanStats {
  let textFiles = 0;
  let binaryFiles = 0;
  let secretCount = 0;
  let totalBytes = 0;
  const languages: Record<string, number> = {};
  const extensions: Record<string, number> = {};
  const largestFiles: Array<{ path: string; size: number }> = [];

  for (const f of files) {
    if (f.isDirectory) continue;

    totalBytes += f.sizeBytes;
    if (f.isBinary) {
      binaryFiles++;
    } else {
      textFiles++;
    }

    if (f.secretInfo.hasSecrets) {
      secretCount++;
    }

    if (f.language && f.language !== 'Unknown') {
      languages[f.language] = (languages[f.language] || 0) + 1;
    }

    const dotIndex = f.path.lastIndexOf('.');
    if (dotIndex !== -1) {
      const ext = f.path.substring(dotIndex).toLowerCase();
      extensions[ext] = (extensions[ext] || 0) + 1;
    }

    largestFiles.push({
      path: f.path,
      size: f.sizeBytes,
    });
  }

  largestFiles.sort((a, b) => b.size - a.size);

  const sortedLanguages = Object.fromEntries(
    Object.entries(languages).sort(([, a], [, b]) => b - a)
  );

  const sortedExtensions = Object.fromEntries(
    Object.entries(extensions).sort(([, a], [, b]) => b - a)
  );

  return {
    totalFiles: textFiles + binaryFiles,
    totalDirectories: Math.max(dirCount, 1),
    totalSizeBytes: totalBytes,
    totalSizeHuman: formatBytes(totalBytes),
    textFiles,
    binaryFiles,
    symlinks: 0,
    secretDetections: secretCount,
    languages: sortedLanguages,
    extensions: sortedExtensions,
    largestFiles: largestFiles.slice(0, 20),
    excludedDirectories: includeDefaultHeavy ? [] : Array.from(DEFAULT_EXCLUDED_DIRS).sort(),
  };
}
