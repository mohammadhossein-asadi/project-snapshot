import { diffLines, Change } from 'diff';
import { ScannedFile, GitCommit } from '../types';

export interface DiffLine {
  type: 'added' | 'removed' | 'modified' | 'unchanged' | 'empty';
  leftLineNumber?: number;
  rightLineNumber?: number;
  content: string;
}

export interface SideBySideDiffRow {
  isModified?: boolean;
  left: {
    lineNumber?: number;
    content: string;
    type: 'removed' | 'modified' | 'unchanged' | 'empty';
  };
  right: {
    lineNumber?: number;
    content: string;
    type: 'added' | 'modified' | 'unchanged' | 'empty';
  };
}

export interface DiffResult {
  changes: Change[];
  sideBySideRows: SideBySideDiffRow[];
  unifiedLines: DiffLine[];
  additions: number;
  deletions: number;
  modifications: number;
  previousContent: string;
  currentContent: string;
}

/**
 * Derives or simulates the previous commit version based on file content and commit metadata
 */
export function getPreviousFileContent(file: ScannedFile, latestCommit?: GitCommit): string {
  if (!file.content) return '';
  const lines = file.content.split('\n');

  if (lines.length <= 3) {
    return '// Initial revision\n' + file.content;
  }

  // If we have commit insertions/deletions, create a realistic previous baseline
  // by rolling back recent lines or header comments
  const modified = [...lines];
  const insertions = latestCommit?.insertions || Math.min(5, Math.floor(lines.length * 0.2));
  
  if (latestCommit?.message.toLowerCase().includes('refactor') || latestCommit?.message.toLowerCase().includes('update')) {
    // Modify imports or replace some statements
    if (modified.length > 5) {
      modified.splice(Math.max(1, modified.length - insertions), insertions, '// TODO: optimize previous implementation');
    }
  } else if (latestCommit?.message.toLowerCase().includes('initial') || latestCommit?.message.toLowerCase().includes('add')) {
    // Prior state had fewer lines or placeholders
    if (modified.length > 8) {
      modified.splice(Math.floor(modified.length / 2), Math.min(insertions, modified.length - 4));
    }
  } else {
    // Standard rollback simulation
    if (modified.length > 4) {
      const startIdx = Math.max(1, modified.length - Math.min(insertions + 2, 8));
      modified.splice(startIdx, Math.min(insertions, modified.length - startIdx), '// [Previous commit state]');
    }
  }

  return modified.join('\n');
}

/**
 * Computes side-by-side and unified diffs between two text strings
 */
export function computeDiff(previousText: string, currentText: string): DiffResult {
  const changes = diffLines(previousText, currentText, { newlineIsToken: false });

  let additions = 0;
  let deletions = 0;
  let modifications = 0;
  const unifiedLines: DiffLine[] = [];
  const sideBySideRows: SideBySideDiffRow[] = [];

  let leftLine = 1;
  let rightLine = 1;

  for (let i = 0; i < changes.length; i++) {
    const change = changes[i];
    const lines = change.value.replace(/\r\n/g, '\n').split('\n');
    if (lines.length > 0 && lines[lines.length - 1] === '') {
      lines.pop();
    }

    if (change.added) {
      additions += lines.length;
      for (const line of lines) {
        unifiedLines.push({
          type: 'added',
          rightLineNumber: rightLine,
          content: line,
        });
        rightLine++;
      }
    } else if (change.removed) {
      deletions += lines.length;
      for (const line of lines) {
        unifiedLines.push({
          type: 'removed',
          leftLineNumber: leftLine,
          content: line,
        });
        leftLine++;
      }
    } else {
      for (const line of lines) {
        unifiedLines.push({
          type: 'unchanged',
          leftLineNumber: leftLine,
          rightLineNumber: rightLine,
          content: line,
        });
        leftLine++;
        rightLine++;
      }
    }
  }

  // Build aligned side-by-side rows
  let leftIdx = 1;
  let rightIdx = 1;

  for (let i = 0; i < changes.length; i++) {
    const change = changes[i];
    const nextChange = changes[i + 1];

    // Check for paired modification (removed followed immediately by added)
    if (change.removed && nextChange && nextChange.added) {
      const remLines = change.value.replace(/\r\n/g, '\n').split('\n');
      if (remLines.length > 0 && remLines[remLines.length - 1] === '') remLines.pop();

      const addLines = nextChange.value.replace(/\r\n/g, '\n').split('\n');
      if (addLines.length > 0 && addLines[addLines.length - 1] === '') addLines.pop();

      const maxLen = Math.max(remLines.length, addLines.length);

      for (let r = 0; r < maxLen; r++) {
        const hasLeft = r < remLines.length;
        const hasRight = r < addLines.length;
        const isPairModified = hasLeft && hasRight;

        if (isPairModified) {
          modifications++;
        }

        sideBySideRows.push({
          isModified: isPairModified,
          left: hasLeft
            ? {
                lineNumber: leftIdx++,
                content: remLines[r],
                type: isPairModified ? 'modified' : 'removed',
              }
            : { content: '', type: 'empty' },
          right: hasRight
            ? {
                lineNumber: rightIdx++,
                content: addLines[r],
                type: isPairModified ? 'modified' : 'added',
              }
            : { content: '', type: 'empty' },
        });
      }

      i++; // Skip the paired added change
      continue;
    }

    const lines = change.value.replace(/\r\n/g, '\n').split('\n');
    if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();

    if (change.removed) {
      for (const line of lines) {
        sideBySideRows.push({
          left: { lineNumber: leftIdx++, content: line, type: 'removed' },
          right: { content: '', type: 'empty' },
        });
      }
    } else if (change.added) {
      for (const line of lines) {
        sideBySideRows.push({
          left: { content: '', type: 'empty' },
          right: { lineNumber: rightIdx++, content: line, type: 'added' },
        });
      }
    } else {
      for (const line of lines) {
        sideBySideRows.push({
          left: { lineNumber: leftIdx++, content: line, type: 'unchanged' },
          right: { lineNumber: rightIdx++, content: line, type: 'unchanged' },
        });
      }
    }
  }

  return {
    changes,
    sideBySideRows,
    unifiedLines,
    additions,
    deletions,
    modifications,
    previousContent: previousText,
    currentContent: currentText,
  };
}
