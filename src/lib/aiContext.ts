import { ScannedFile, PrioritizedContextFile, ScanResult } from '../types';
import { parseDependencies } from './dependencies';
import { generateTreeString } from './tree';
import { DEFAULT_EXCLUDED_DIRS } from './constants';

export type ContextTaskPreset = 
  | 'general'
  | 'bug_fixing'
  | 'feature_development'
  | 'refactoring_review'
  | 'api_types';

export const TASK_PRESETS: Record<
  ContextTaskPreset,
  { label: string; description: string; systemPromptSuffix: string }
> = {
  general: {
    label: 'General Assistant & Code Q&A',
    description: 'Balanced project context for exploring and understanding the codebase.',
    systemPromptSuffix: 'Analyze the following project structure and source code to answer architectural and implementation questions accurately.',
  },
  bug_fixing: {
    label: 'Bug Fixing & Debugging',
    description: 'Prioritizes core logic, entrypoints, and dependencies to diagnose and fix defects.',
    systemPromptSuffix: 'Your task is to identify potential bugs, logic errors, and edge-case vulnerabilities in this codebase. Provide concrete fixes with code snippets.',
  },
  feature_development: {
    label: 'Feature Implementation',
    description: 'Emphasizes modules with high centrality and APIs to extend new features cleanly.',
    systemPromptSuffix: 'Use this codebase architecture and conventions to implement the requested feature cleanly, preserving established patterns and type definitions.',
  },
  refactoring_review: {
    label: 'Architecture & Code Review',
    description: 'Focuses on complex hubs, maintainability, and clean code refactoring.',
    systemPromptSuffix: 'Review this codebase for architectural improvements, modularity, cyclomatic complexity reduction, and adherence to clean code principles.',
  },
  api_types: {
    label: 'API & Type Generation',
    description: 'Prioritizes data models, interfaces, schemas, and endpoints.',
    systemPromptSuffix: 'Extract and enhance the type definitions, interfaces, and API contracts defined across these files.',
  },
};

/**
 * Calculates prioritized files based on import density, graph degree, entry point heuristics, and size.
 */
export function generatePrioritizedFiles(files: ScannedFile[]): PrioritizedContextFile[] {
  const { nodes, links } = parseDependencies(files);
  const degreeMap = new Map<string, number>();

  // Count inward and outward connections (centrality / density)
  for (const node of nodes) {
    degreeMap.set(node.id, 0);
  }
  for (const link of links) {
    const sourceId = typeof link.source === 'string' ? link.source : (link.source as any).id;
    const targetId = typeof link.target === 'string' ? link.target : (link.target as any).id;
    degreeMap.set(sourceId, (degreeMap.get(sourceId) || 0) + 1);
    degreeMap.set(targetId, (degreeMap.get(targetId) || 0) + 2); // inbound imports are heavily weighted
  }

  const prioritized: PrioritizedContextFile[] = [];

  for (const f of files) {
    if (f.isDirectory || f.isBinary || f.secretInfo.hasSecrets) continue;
    if (f.path.includes('node_modules') || f.path.includes('dist/')) continue;

    const importDegree = degreeMap.get(f.path) || 0;
    const lines = f.content ? f.content.split('\n').length : 0;
    const estimatedTokens = Math.round((f.content ? f.content.length : 0) / 4);

    const isEntrypoint = 
      f.name === 'App.tsx' ||
      f.name === 'main.tsx' ||
      f.name === 'index.ts' ||
      f.name === 'index.js' ||
      f.name === 'server.ts' ||
      f.name === 'cli.py' ||
      f.name === 'project_snapshot.py' ||
      f.name === 'package.json';

    const isCoreConfigOrType =
      f.name.includes('type') ||
      f.name.includes('config') ||
      f.name.includes('constant') ||
      f.name.includes('schema');

    // Score calculation
    let importanceScore = importDegree * 15;
    let reason = 'Supporting file';

    if (isEntrypoint) {
      importanceScore += 100;
      reason = 'Core Application Entry Point';
    } else if (isCoreConfigOrType) {
      importanceScore += 65;
      reason = 'Data Schema & Shared Config';
    } else if (importDegree >= 3) {
      importanceScore += 50;
      reason = `High Import Centrality (${importDegree} connections)`;
    } else if (importDegree >= 1) {
      importanceScore += 25;
      reason = `Imported Module (${importDegree} connection)`;
    }

    prioritized.push({
      path: f.path,
      name: f.name,
      language: f.language || 'Code',
      sizeBytes: f.sizeBytes,
      sizeHuman: f.sizeHuman,
      linesCount: lines,
      estimatedTokens,
      importDegree,
      importanceScore,
      importanceReason: reason,
      selected: true,
      isEntrypoint,
      content: f.content,
    });
  }

  // Sort by importance descending
  return prioritized.sort((a, b) => b.importanceScore - a.importanceScore);
}

/**
 * Builds a context-optimized prompt string ready for LLM consumption
 */
export function buildOptimizedAiPrompt(
  scanResult: ScanResult,
  selectedFiles: PrioritizedContextFile[],
  preset: ContextTaskPreset = 'general',
  userGoal: string = '',
  includeTree: boolean = true
): { prompt: string; totalTokens: number } {
  const sections: string[] = [];
  const presetConfig = TASK_PRESETS[preset];

  // System context header
  sections.push(`### ROLE & INSTRUCTION: Codebase Context for AI`);
  sections.push(`You are an expert software engineer analyzing the project "${scanResult.projectName}".`);
  sections.push(presetConfig.systemPromptSuffix);
  if (userGoal.trim()) {
    sections.push(`\n**Specific User Task / Objective:**\n${userGoal.trim()}`);
  }
  sections.push(`\n---`);

  // Project summary metadata
  sections.push(`\n### PROJECT OVERVIEW`);
  sections.push(`- **Project Name:** ${scanResult.projectName}`);
  sections.push(`- **Total Files in Repo:** ${scanResult.stats.totalFiles}`);
  sections.push(`- **Primary Languages:** ${Object.keys(scanResult.stats.languages).slice(0, 4).join(', ') || 'Mixed'}`);
  if (scanResult.gitInfo.isRepository) {
    sections.push(`- **Git Branch:** ${scanResult.gitInfo.branch || 'main'} (Commit: ${scanResult.gitInfo.shortCommit || 'latest'})`);
  }

  // Directory Tree
  if (includeTree) {
    sections.push(`\n### DIRECTORY HIERARCHY`);
    sections.push(`\`\`\`text`);
    const treeStr = generateTreeString(
      scanResult.files.map(f => ({ path: f.path, isDirectory: f.isDirectory })),
      new Set(DEFAULT_EXCLUDED_DIRS)
    );
    sections.push(treeStr);
    sections.push(`\`\`\``);
  }

  // Selected High-Value Files
  sections.push(`\n### KEY SOURCE FILES (Optimized by Import Density & Centrality)`);
  sections.push(`Below are the ${selectedFiles.length} most critical files selected for this task:\n`);

  for (const file of selectedFiles) {
    sections.push(`#### File: \`${file.path}\``);
    sections.push(`<!-- Relevance: ${file.importanceReason} | Tokens: ~${file.estimatedTokens} -->`);
    const ext = file.path.split('.').pop() || '';
    sections.push(`\`\`\`${ext}`);
    sections.push(file.content ? file.content.trimEnd() : '// No text content');
    sections.push(`\`\`\`\n`);
  }

  sections.push(`\n### INSTRUCTIONS`);
  sections.push(`Please provide your solution adhering to the architectural patterns, types, and style observed in the files above.`);

  const prompt = sections.join('\n');
  const totalTokens = Math.round(prompt.length / 4);

  return { prompt, totalTokens };
}
