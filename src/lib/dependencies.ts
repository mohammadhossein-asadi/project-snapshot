import { ScannedFile } from '../types';

export interface GraphNode {
  id: string; // File path or module name
  label: string;
  type: 'file' | 'package' | 'directory';
  language?: string;
  size?: number;
  sizeHuman?: string;
  linesCount?: number;
  mimeType?: string;
  lastModified?: string;
  sha256?: string;
  isExternal?: boolean;
  group?: string;
  degree?: number;
  importsCount?: number;
  importedByCount?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type: 'import' | 'require' | 'export';
  rawSpecifier: string;
}

export interface DependencyGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  fileDependencies: Map<string, string[]>;
}

// Clean relative path resolution
function resolveRelativePath(sourcePath: string, specifier: string, allFilePaths: Set<string>): string | null {
  if (!specifier.startsWith('.')) {
    return null; // External package
  }

  const sourceDir = sourcePath.includes('/') ? sourcePath.substring(0, sourcePath.lastIndexOf('/')) : '';
  const parts = (sourceDir ? sourceDir.split('/') : []);
  const specParts = specifier.split('/');

  for (const part of specParts) {
    if (part === '.') continue;
    if (part === '..') {
      parts.pop();
    } else {
      parts.push(part);
    }
  }

  const resolvedBase = parts.join('/');
  
  // Try exact match first
  if (allFilePaths.has(resolvedBase)) return resolvedBase;

  // Try standard code extensions
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.vue', '.svelte', '.py', '.go', '.rs'];
  for (const ext of extensions) {
    if (allFilePaths.has(resolvedBase + ext)) {
      return resolvedBase + ext;
    }
    // Index file in folder
    if (allFilePaths.has(resolvedBase + '/index' + ext)) {
      return resolvedBase + '/index' + ext;
    }
  }

  return null;
}

export function parseDependencies(files: ScannedFile[]): DependencyGraphData {
  const nodesMap = new Map<string, GraphNode>();
  const links: GraphLink[] = [];
  const linkKeySet = new Set<string>();
  const fileDependencies = new Map<string, string[]>();

  const allFilePaths = new Set(files.map(f => f.path));

  // Initialize file nodes
  for (const f of files) {
    if (f.isDirectory) continue;
    
    // Group by top-level directory
    const parts = f.path.split('/');
    const group = parts.length > 1 ? parts[0] : 'root';

    const linesCount = f.content ? f.content.split('\n').length : 0;

    nodesMap.set(f.path, {
      id: f.path,
      label: parts[parts.length - 1],
      type: 'file',
      language: f.language || 'Unknown',
      size: f.sizeBytes,
      sizeHuman: f.sizeHuman,
      linesCount,
      mimeType: f.mimeType,
      lastModified: f.modified,
      sha256: f.sha256,
      isExternal: false,
      group,
      degree: 0,
      importsCount: 0,
      importedByCount: 0,
    });

    fileDependencies.set(f.path, []);
  }

  // Regex patterns for various languages
  const jsImportRegex = /(?:import\s+(?:[\w*\s{},]+from\s+)?['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]\s*\)|from\s+['"]([^'"]+)['"])/g;
  const pyImportRegex = /(?:from\s+([\w.]+)\s+import|import\s+([\w.]+))/g;

  for (const file of files) {
    if (file.isDirectory || !file.content) continue;

    const sourcePath = file.path;
    const content = file.content;
    const depsForFile = fileDependencies.get(sourcePath) || [];

    // JS/TS parsing
    if (['TypeScript', 'JavaScript', 'TypeScript React', 'JavaScript React', 'Vue', 'Svelte'].includes(file.language || '')) {
      let match: RegExpExecArray | null;
      jsImportRegex.lastIndex = 0;
      while ((match = jsImportRegex.exec(content)) !== null) {
        const specifier = match[1] || match[2] || match[3];
        if (!specifier) continue;

        let targetId: string | null = null;

        if (specifier.startsWith('.')) {
          targetId = resolveRelativePath(sourcePath, specifier, allFilePaths);
        } else {
          // External package (e.g. 'react', 'lucide-react', 'd3')
          const pkgName = specifier.startsWith('@') 
            ? specifier.split('/').slice(0, 2).join('/') 
            : specifier.split('/')[0];
          targetId = `pkg:${pkgName}`;

          if (!nodesMap.has(targetId)) {
            nodesMap.set(targetId, {
              id: targetId,
              label: pkgName,
              type: 'package',
              language: 'External Library',
              isExternal: true,
              group: 'node_modules',
              degree: 0,
              importsCount: 0,
              importedByCount: 0,
            });
          }
        }

        if (targetId && targetId !== sourcePath) {
          const linkKey = `${sourcePath}->${targetId}`;
          if (!linkKeySet.has(linkKey)) {
            linkKeySet.add(linkKey);
            links.push({
              source: sourcePath,
              target: targetId,
              type: 'import',
              rawSpecifier: specifier,
            });
            depsForFile.push(targetId);
          }
        }
      }
    }

    // Python parsing
    if (file.language === 'Python') {
      let match: RegExpExecArray | null;
      pyImportRegex.lastIndex = 0;
      while ((match = pyImportRegex.exec(content)) !== null) {
        const specifier = match[1] || match[2];
        if (!specifier) continue;

        const specPath = specifier.replace(/\./g, '/');
        const resolved = resolveRelativePath(sourcePath, './' + specPath, allFilePaths) ||
                         resolveRelativePath(sourcePath, specPath, allFilePaths);
        
        const targetId = resolved || `pkg:${specifier.split('.')[0]}`;
        const isExternal = !resolved;

        if (isExternal && !nodesMap.has(targetId)) {
          nodesMap.set(targetId, {
            id: targetId,
            label: specifier.split('.')[0],
            type: 'package',
            language: 'Python Package',
            isExternal: true,
            group: 'site-packages',
            degree: 0,
            importsCount: 0,
            importedByCount: 0,
          });
        }

        if (targetId && targetId !== sourcePath) {
          const linkKey = `${sourcePath}->${targetId}`;
          if (!linkKeySet.has(linkKey)) {
            linkKeySet.add(linkKey);
            links.push({
              source: sourcePath,
              target: targetId,
              type: 'import',
              rawSpecifier: specifier,
            });
            depsForFile.push(targetId);
          }
        }
      }
    }
  }

  // Calculate degrees and directed counts for node importance
  for (const link of links) {
    const src = nodesMap.get(link.source);
    const tgt = nodesMap.get(link.target);
    if (src) {
      src.degree = (src.degree || 0) + 1;
      src.importsCount = (src.importsCount || 0) + 1;
    }
    if (tgt) {
      tgt.degree = (tgt.degree || 0) + 1;
      tgt.importedByCount = (tgt.importedByCount || 0) + 1;
    }
  }

  return {
    nodes: Array.from(nodesMap.values()),
    links,
    fileDependencies,
  };
}
