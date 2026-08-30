import { ScanResult, DiagnosticCommand, SimulationResult } from '../types';

export const PRESET_DIAGNOSTIC_COMMANDS: DiagnosticCommand[] = [
  {
    id: 'test',
    command: 'npm test',
    title: 'Run Test Suites',
    description: 'Executes Jest/Vitest automated test suite verification against scanned modules',
    category: 'testing',
    iconName: 'CheckCircle2',
  },
  {
    id: 'git-status',
    command: 'git status',
    title: 'Git Working Tree',
    description: 'Inspects modified files, untracked files, and active branch state',
    category: 'git',
    iconName: 'GitBranch',
  },
  {
    id: 'build',
    command: 'npm run build',
    title: 'Production Build',
    description: 'Simulates TypeScript compilation, bundle size evaluation, and asset emission',
    category: 'build',
    iconName: 'Sparkles',
  },
  {
    id: 'lint',
    command: 'npm run lint',
    title: 'Static Code Linter',
    description: 'Evaluates codebase for syntax warnings, formatting, and strict type safety',
    category: 'lint',
    iconName: 'Terminal',
  },
  {
    id: 'security-audit',
    command: 'npm audit --audit-level=high',
    title: 'Dependency Security Audit',
    description: 'Audits scanned dependencies, credential patterns, and token exposures',
    category: 'security',
    iconName: 'ShieldCheck',
  },
  {
    id: 'tree-summary',
    command: 'tree -L 2 --du -h',
    title: 'Directory Tree & Disk Usage',
    description: 'Lists high-level directory structure with file size metrics',
    category: 'inspect',
    iconName: 'FolderTree',
  },
  {
    id: 'loc-counter',
    command: 'cloc . --exclude-dir=node_modules,dist',
    title: 'Lines of Code Breakdown',
    description: 'Calculates physical lines, comments, and blank lines grouped by language',
    category: 'inspect',
    iconName: 'Cpu',
  },
  {
    id: 'git-log',
    command: 'git log -n 5 --oneline --graph --decorate',
    title: 'Recent Commit Graph',
    description: 'Outputs formatted commit history timeline with hashes and authors',
    category: 'git',
    iconName: 'GitCommit',
  },
];

/**
 * Simulates the execution of common CLI diagnostic commands based on actual scanned project metadata.
 */
export function simulateCommandExecution(
  rawCommand: string,
  scanResult: ScanResult
): SimulationResult {
  const command = rawCommand.trim();
  const timestamp = new Date().toLocaleTimeString();

  const { projectName, files, stats, gitInfo } = scanResult;
  const nonDirFiles = files.filter((f) => !f.isDirectory);
  const totalFiles = nonDirFiles.length;
  const totalSizeHuman = stats.totalSizeHuman;

  // 1. npm test / vitest / jest
  if (
    command === 'npm test' ||
    command === 'npm run test' ||
    command === 'vitest' ||
    command === 'jest'
  ) {
    const testFiles = nonDirFiles.filter(
      (f) =>
        f.path.includes('.test.') ||
        f.path.includes('.spec.') ||
        f.path.includes('__tests__')
    );
    const numTestSuites = Math.max(testFiles.length, 3);
    const numTests = numTestSuites * 4 + 2;

    const stdout = `
\x1b[36m RUN \x1b[0m \x1b[1mv1.4.0\x1b[0m /workspace/${projectName}

\x1b[32m ✓ \x1b[0m ${testFiles[0]?.path || 'src/lib/scanner.test.ts'} \x1b[2m(4 tests)\x1b[0m \x1b[32m42ms\x1b[0m
\x1b[32m ✓ \x1b[0m ${testFiles[1]?.path || 'src/lib/secrets.test.ts'} \x1b[2m(5 tests)\x1b[0m \x1b[32m28ms\x1b[0m
\x1b[32m ✓ \x1b[0m ${testFiles[2]?.path || 'src/components/FileExplorer.test.tsx'} \x1b[2m(5 tests)\x1b[0m \x1b[32m64ms\x1b[0m
${
  testFiles.length > 3
    ? `\x1b[32m ✓ \x1b[0m ${testFiles[3].path} \x1b[2m(4 tests)\x1b[0m \x1b[32m31ms\x1b[0m\n`
    : ''
}
\x1b[1m\x1b[32m Test Files \x1b[0m \x1b[1m\x1b[32m${numTestSuites} passed\x1b[0m (${numTestSuites})
\x1b[1m\x1b[32m      Tests \x1b[0m \x1b[1m\x1b[32m${numTests} passed\x1b[0m (${numTests})
\x1b[1m\x1b[37m   Start at \x1b[0m ${timestamp}
\x1b[1m\x1b[37m   Duration \x1b[0m 318ms (transform 82ms, setup 0ms, collect 45ms, tests 165ms)

\x1b[32m PASS \x1b[0m All test suites completed with exit status 0.
`.trim();

    return {
      command,
      stdout,
      stderr: '',
      exitCode: 0,
      durationMs: 320,
      timestamp,
      metrics: {
        'Test Suites': `${numTestSuites} passed`,
        Tests: `${numTests} passed`,
        'Pass Rate': '100%',
      },
    };
  }

  // 2. git status
  if (command === 'git status') {
    const branch = gitInfo?.branch || 'main';
    const modifiedFiles = gitInfo?.modifiedFiles || [];
    const untracked = gitInfo?.untrackedFiles || [];

    let body = `On branch \x1b[32m${branch}\x1b[0m\nYour branch is up to date with 'origin/${branch}'.\n\n`;

    if (modifiedFiles.length > 0) {
      body += `Changes not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n  (use "git restore <file>..." to discard changes in working directory)\n`;
      modifiedFiles.forEach((m) => {
        body += `\t\x1b[31mmodified:   ${m.path}\x1b[0m\n`;
      });
      body += '\n';
    }

    if (untracked.length > 0) {
      body += `Untracked files:\n  (use "git add <file>..." to include in what will be committed)\n`;
      untracked.forEach((u) => {
        body += `\t\x1b[31m${u}\x1b[0m\n`;
      });
      body += '\n';
    }

    if (modifiedFiles.length === 0 && untracked.length === 0) {
      body += `nothing to commit, working tree clean\n`;
    } else {
      body += `no changes added to commit (use "git add" to stage)\n`;
    }

    return {
      command,
      stdout: body.trim(),
      stderr: '',
      exitCode: 0,
      durationMs: 45,
      timestamp,
      metrics: {
        Branch: branch,
        'Modified Files': modifiedFiles.length.toString(),
        'Untracked Files': untracked.length.toString(),
      },
    };
  }

  // 3. git log
  if (command.startsWith('git log')) {
    const branch = gitInfo?.branch || 'main';
    const commitHash = gitInfo?.commit || '7f9a2b8';
    const shortCommit = gitInfo?.shortCommit || commitHash.substring(0, 7);

    const logLines = [
      `* \x1b[33m${shortCommit}\x1b[0m - \x1b[32m(HEAD -> ${branch}, origin/${branch})\x1b[0m feat: update core scanning engine with performance optimizations \x1b[34m(2 hours ago)\x1b[0m \x1b[35m<developer@ai.studio>\x1b[0m`,
      `* \x1b[33m9d4e1c2\x1b[0m - refactor: enhance secret detection patterns and token entropy validation \x1b[34m(1 day ago)\x1b[0m \x1b[35m<alice@example.com>\x1b[0m`,
      `* \x1b[33m3f8b0aa\x1b[0m - \x1b[36m(tag: v1.0.0)\x1b[0m feat: add export toolbar with markdown snapshot and manifest \x1b[34m(3 days ago)\x1b[0m \x1b[35m<bob@example.com>\x1b[0m`,
      `* \x1b[33ma2c5e71\x1b[0m - chore: add dependency graph and AST import link extractor \x1b[34m(5 days ago)\x1b[0m \x1b[35m<developer@ai.studio>\x1b[0m`,
      `* \x1b[33me1f90d4\x1b[0m - init: bootstrap codebase snapshot generator architecture \x1b[34m(1 week ago)\x1b[0m \x1b[35m<alice@example.com>\x1b[0m`,
    ];

    return {
      command,
      stdout: logLines.join('\n'),
      stderr: '',
      exitCode: 0,
      durationMs: 50,
      timestamp,
      metrics: {
        Branch: branch,
        'Current Commit': shortCommit,
      },
    };
  }

  // 4. npm run build / vite build
  if (command === 'npm run build' || command === 'vite build' || command === 'npm build') {
    const jsTsFiles = nonDirFiles.filter(
      (f) => f.language === 'TypeScript' || f.language === 'JavaScript'
    );
    let totalLines = 0;
    nonDirFiles.forEach((f) => {
      if (f.content) {
        totalLines += f.content.split('\n').length;
      }
    });

    const stdout = `
> ${projectName}@1.0.0 build
> tsc -b && vite build

\x1b[36mvite v5.4.14 \x1b[32mbuilding for production...\x1b[0m
transforming (48) ...
\x1b[32m✓\x1b[0m ${jsTsFiles.length} modules transformed.
\x1b[35mdist/index.html\x1b[0m                   0.82 kB │ gzip:  0.45 kB
\x1b[34mdist/assets/index-C8vK1.css\x1b[0m       14.28 kB │ gzip:  3.84 kB
\x1b[32mdist/assets/index-B7jM9.js\x1b[0m       318.42 kB │ gzip: 96.12 kB
\x1b[32m✓ built in 482ms\x1b[0m

\x1b[32m[BUILD SUCCESS]\x1b[0m Bundle created without compilation errors.
`.trim();

    return {
      command,
      stdout,
      stderr: '',
      exitCode: 0,
      durationMs: 485,
      timestamp,
      metrics: {
        'Dist Size': '333.52 kB',
        'Gzip Size': '100.41 kB',
        Modules: jsTsFiles.length.toString(),
        'Total LOC': totalLines.toString(),
      },
    };
  }

  // 5. npm run lint / eslint
  if (
    command === 'npm run lint' ||
    command === 'eslint .' ||
    command === 'tsc --noEmit'
  ) {
    const stdout = `
> ${projectName}@1.0.0 lint
> eslint . --ext .ts,.tsx --max-warnings 0 && tsc --noEmit

\x1b[32m✔ No ESLint warnings or errors found.\x1b[0m
\x1b[32m✔ TypeScript compilation type-check passed.\x1b[0m
Checked ${nonDirFiles.length} source files across ${Object.keys(stats.languages).length} language targets.
`.trim();

    return {
      command,
      stdout,
      stderr: '',
      exitCode: 0,
      durationMs: 240,
      timestamp,
      metrics: {
        'Files Checked': nonDirFiles.length.toString(),
        Warnings: '0',
        Errors: '0',
      },
    };
  }

  // 6. npm audit / security
  if (
    command.startsWith('npm audit') ||
    command === 'snyk test' ||
    command === 'safety check'
  ) {
    const secretsFound = stats.secretDetections;
    let stdout = `
\x1b[1m=== Security Audit Diagnostic Summary ===\x1b[0m
Scanning manifest dependencies & scanned secrets in \x1b[36m${projectName}\x1b[0m...

\x1b[32mfound 0 vulnerabilities\x1b[0m in 84 scanned external packages.
`.trim();

    if (secretsFound > 0) {
      stdout += `\n\n\x1b[33m[AUDIT WARNING]\x1b[0m Detected ${secretsFound} hardcoded secrets/credentials in scanned project files:\n`;
      const secretFiles = nonDirFiles.filter((f) => f.secretInfo.hasSecrets);
      secretFiles.slice(0, 5).forEach((sf) => {
        sf.secretInfo.contentSecrets.forEach((cs) => {
          stdout += `  \x1b[31m●\x1b[0m \x1b[33m${sf.path}:${cs.line}\x1b[0m [${cs.pattern}]\n`;
        });
      });
    } else {
      stdout += `\n\x1b[32m✔\x1b[0m No unmasked credentials or high-entropy secrets identified in workspace files.`;
    }

    return {
      command,
      stdout,
      stderr: '',
      exitCode: secretsFound > 0 ? 1 : 0,
      durationMs: 190,
      timestamp,
      metrics: {
        'Vulnerabilities': '0',
        'Detected Secrets': secretsFound.toString(),
      },
    };
  }

  // 7. cloc . (Lines of Code)
  if (command.startsWith('cloc') || command.startsWith('scc') || command.startsWith('tokei')) {
    let linesOutput = `
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
`;
    let totalCode = 0;
    Object.entries(stats.languages).forEach(([lang, count]) => {
      const approxCode = count * 65;
      const approxComment = count * 8;
      const approxBlank = count * 12;
      totalCode += approxCode;
      linesOutput += `${lang.padEnd(25)} ${count.toString().padStart(8)} ${approxBlank.toString().padStart(14)} ${approxComment.toString().padStart(14)} ${approxCode.toString().padStart(14)}\n`;
    });

    linesOutput += `-------------------------------------------------------------------------------
\x1b[1mSUM:                      ${totalFiles.toString().padStart(8)} ${(totalFiles * 12).toString().padStart(14)} ${(totalFiles * 8).toString().padStart(14)} ${totalCode.toString().padStart(14)}\x1b[0m
-------------------------------------------------------------------------------`;

    return {
      command,
      stdout: linesOutput.trim(),
      stderr: '',
      exitCode: 0,
      durationMs: 120,
      timestamp,
      metrics: {
        'Total Code Lines': totalCode.toLocaleString(),
        'Language Count': Object.keys(stats.languages).length.toString(),
      },
    };
  }

  // 8. tree / directory summary
  if (command.startsWith('tree') || command.startsWith('ls -la') || command.startsWith('dir')) {
    let treeOutput = `.\n├── ${projectName}\n`;
    const dirs = new Set<string>();
    nonDirFiles.forEach((f) => {
      const parts = f.path.split('/');
      if (parts.length > 1) {
        dirs.add(parts[0]);
      }
    });

    Array.from(dirs)
      .slice(0, 8)
      .forEach((d, idx, arr) => {
        const isLast = idx === arr.length - 1;
        treeOutput += `${isLast ? '└── ' : '├── '}\x1b[34m${d}/\x1b[0m\n`;
      });

    treeOutput += `\n\x1b[1m${stats.totalDirectories} directories, ${stats.totalFiles} files (${totalSizeHuman})\x1b[0m`;

    return {
      command,
      stdout: treeOutput.trim(),
      stderr: '',
      exitCode: 0,
      durationMs: 60,
      timestamp,
      metrics: {
        Directories: stats.totalDirectories.toString(),
        Files: stats.totalFiles.toString(),
      },
    };
  }

  // Fallback Generic Diagnostic Execution
  const stdout = `
\x1b[1m$ ${command}\x1b[0m
Workspace: /workspace/${projectName}
Scanned Files: ${totalFiles} (${totalSizeHuman})
Branch: ${gitInfo?.branch || 'main'}

Executed diagnostic command against current project metadata.
Exit status: 0 (OK)
`.trim();

  return {
    command,
    stdout,
    stderr: '',
    exitCode: 0,
    durationMs: Math.floor(Math.random() * 80 + 30),
    timestamp,
    metrics: {
      Status: 'Completed',
    },
  };
}
