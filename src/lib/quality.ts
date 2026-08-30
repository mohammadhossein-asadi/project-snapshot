import { ScannedFile, FileQualityScore, ProjectQualityReport } from '../types';

/**
 * Calculates cyclomatic complexity and documentation coverage for code files
 */

// Heuristic regex patterns for branching / control flow
const JS_TS_BRANCH_REGEX = /\b(if|else\s+if|for|while|do|switch|case|catch|\?)\b|&&|\|\|/g;
const PY_BRANCH_REGEX = /\b(if|elif|for|while|except|with|assert)\b|\band\b|\bor\b/g;
const GENERAL_BRANCH_REGEX = /\b(if|elif|else\s+if|for|while|switch|case|catch|except)\b/g;

export function analyzeFileQuality(file: ScannedFile): FileQualityScore {
  if (file.isDirectory || file.isBinary || !file.content) {
    return {
      path: file.path,
      name: file.name,
      language: file.language || 'Unknown',
      linesOfCode: 0,
      commentLines: 0,
      documentationCoverage: 0,
      cyclomaticComplexity: 1,
      complexityRating: 'Low',
      maintainabilityIndex: 100,
      grade: 'A+',
      needsRefactoring: false,
      refactorReasons: [],
    };
  }

  const lines = file.content.split('\n');
  const totalLines = lines.length;
  let codeLines = 0;
  let commentLines = 0;
  let inBlockComment = false;
  let complexity = 1; // Base complexity

  const lang = (file.language || '').toLowerCase();
  const isPython = lang.includes('python');
  const isJsTs = lang.includes('javascript') || lang.includes('typescript') || lang.includes('react');

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue; // empty line

    // Comment analysis
    if (isPython) {
      if (trimmed.startsWith('#') || trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
        commentLines++;
        if ((trimmed.startsWith('"""') && !trimmed.endsWith('"""', 3)) ||
            (trimmed.startsWith("'''") && !trimmed.endsWith("'''", 3))) {
          inBlockComment = !inBlockComment;
        }
      } else if (inBlockComment) {
        commentLines++;
        if (trimmed.includes('"""') || trimmed.includes("'''")) {
          inBlockComment = false;
        }
      } else {
        codeLines++;
      }
    } else {
      // JS / TS / C / Java / etc.
      if (inBlockComment) {
        commentLines++;
        if (trimmed.includes('*/')) {
          inBlockComment = false;
        }
      } else if (trimmed.startsWith('//') || trimmed.startsWith('/*')) {
        commentLines++;
        if (trimmed.startsWith('/*') && !trimmed.includes('*/')) {
          inBlockComment = true;
        }
      } else {
        codeLines++;
      }
    }
  }

  // Branching complexity analysis on the code
  if (isJsTs) {
    const matches = file.content.match(JS_TS_BRANCH_REGEX);
    if (matches) complexity += matches.length;
  } else if (isPython) {
    const matches = file.content.match(PY_BRANCH_REGEX);
    if (matches) complexity += matches.length;
  } else {
    const matches = file.content.match(GENERAL_BRANCH_REGEX);
    if (matches) complexity += matches.length;
  }

  // Documentation coverage percentage
  const effectiveLines = Math.max(codeLines + commentLines, 1);
  const docCoverage = Math.min(100, Math.round((commentLines / effectiveLines) * 100));

  // Determine Complexity Rating
  let complexityRating: 'Low' | 'Moderate' | 'High' | 'Very High' = 'Low';
  if (complexity > 25) complexityRating = 'Very High';
  else if (complexity > 15) complexityRating = 'High';
  else if (complexity > 7) complexityRating = 'Moderate';

  // Maintainability index heuristic (scale 0 - 100)
  // Higher is better: penalized by high complexity and long code lines, boosted by comments
  const rawMaintainability = Math.max(
    0,
    Math.min(
      100,
      120 -
        complexity * 2.2 -
        Math.log(Math.max(codeLines, 1)) * 12 +
        (docCoverage > 10 ? Math.min(docCoverage * 0.4, 20) : -10)
    )
  );
  const maintainabilityIndex = Math.round(rawMaintainability);

  // Grade calculation
  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'A';
  if (maintainabilityIndex >= 90) grade = 'A+';
  else if (maintainabilityIndex >= 80) grade = 'A';
  else if (maintainabilityIndex >= 68) grade = 'B';
  else if (maintainabilityIndex >= 55) grade = 'C';
  else if (maintainabilityIndex >= 40) grade = 'D';
  else grade = 'F';

  // Refactoring Needs
  const refactorReasons: string[] = [];
  if (complexity > 18) {
    refactorReasons.push(`High cyclomatic complexity (${complexity}): Consider breaking functions down into smaller sub-methods`);
  }
  if (totalLines > 350) {
    refactorReasons.push(`Large file size (${totalLines} lines): Consider modularizing into specialized utility components`);
  }
  if (docCoverage < 6 && codeLines > 40) {
    refactorReasons.push(`Low documentation coverage (${docCoverage}%): Missing JSDoc or descriptive comments for key exports`);
  }
  if (maintainabilityIndex < 60) {
    refactorReasons.push(`Low maintainability index (${maintainabilityIndex}/100)`);
  }

  const needsRefactoring = refactorReasons.length > 0;

  return {
    path: file.path,
    name: file.name,
    language: file.language || 'Unknown',
    linesOfCode: codeLines,
    commentLines,
    documentationCoverage: docCoverage,
    cyclomaticComplexity: complexity,
    complexityRating,
    maintainabilityIndex,
    grade,
    needsRefactoring,
    refactorReasons,
  };
}

export function generateProjectQualityReport(files: ScannedFile[]): ProjectQualityReport {
  const codeFiles = files.filter(
    (f) =>
      !f.isDirectory &&
      !f.isBinary &&
      f.content &&
      f.language &&
      f.language !== 'Unknown' &&
      !f.path.includes('node_modules') &&
      !f.path.includes('dist/') &&
      !f.path.includes('.vendor')
  );

  if (codeFiles.length === 0) {
    return {
      overallScore: 100,
      overallGrade: 'A+',
      avgComplexity: 1,
      avgDocumentationCoverage: 100,
      totalLinesOfCode: 0,
      totalCommentLines: 0,
      highComplexityFilesCount: 0,
      filesNeedingRefactor: [],
      allFileScores: [],
      recommendations: [],
    };
  }

  const allScores = codeFiles.map(analyzeFileQuality);

  let totalComplexity = 0;
  let totalDocCoverage = 0;
  let totalLOC = 0;
  let totalComments = 0;
  let highComplexityCount = 0;
  const filesNeedingRefactor: FileQualityScore[] = [];

  for (const score of allScores) {
    totalComplexity += score.cyclomaticComplexity;
    totalDocCoverage += score.documentationCoverage;
    totalLOC += score.linesOfCode;
    totalComments += score.commentLines;
    if (score.cyclomaticComplexity > 15) highComplexityCount++;
    if (score.needsRefactoring) filesNeedingRefactor.push(score);
  }

  const avgComplexity = Math.round((totalComplexity / allScores.length) * 10) / 10;
  const avgDoc = Math.round((totalDocCoverage / allScores.length) * 10) / 10;

  // Average maintainability
  const avgMaintainability =
    allScores.reduce((acc, curr) => acc + curr.maintainabilityIndex, 0) / allScores.length;
  const overallScore = Math.max(0, Math.min(100, Math.round(avgMaintainability)));

  let overallGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'A';
  if (overallScore >= 90) overallGrade = 'A+';
  else if (overallScore >= 80) overallGrade = 'A';
  else if (overallScore >= 68) overallGrade = 'B';
  else if (overallScore >= 55) overallGrade = 'C';
  else if (overallScore >= 40) overallGrade = 'D';
  else overallGrade = 'F';

  // Sort refactor candidates by complexity descending
  filesNeedingRefactor.sort((a, b) => b.cyclomaticComplexity - a.cyclomaticComplexity);

  // Recommendations
  const recommendations: ProjectQualityReport['recommendations'] = [];

  if (highComplexityCount > 0) {
    recommendations.push({
      title: 'Decompose High-Complexity Core Modules',
      description: `${highComplexityCount} file(s) exhibit cyclomatic complexity above standard thresholds (>15). Refactor conditional branches into strategy patterns or extracted pure functions.`,
      severity: 'critical',
    });
  }

  if (avgDoc < 15) {
    recommendations.push({
      title: 'Enhance Codebase Documentation & JSDoc',
      description: `Overall documentation coverage is currently ${avgDoc}%. Adding concise type annotations and docstrings improves developer onboarding and AI code understanding.`,
      severity: 'warning',
    });
  }

  if (filesNeedingRefactor.length > 0) {
    recommendations.push({
      title: `Prioritize Top ${Math.min(3, filesNeedingRefactor.length)} Refactoring Candidates`,
      description: `Files like "${filesNeedingRefactor[0].name}" would benefit most from immediate modularization and test coverage.`,
      severity: 'info',
      file: filesNeedingRefactor[0].path,
    });
  }

  return {
    overallScore,
    overallGrade,
    avgComplexity,
    avgDocumentationCoverage: avgDoc,
    totalLinesOfCode: totalLOC,
    totalCommentLines: totalComments,
    highComplexityFilesCount: highComplexityCount,
    filesNeedingRefactor,
    allFileScores: allScores.sort((a, b) => b.cyclomaticComplexity - a.cyclomaticComplexity),
    recommendations,
  };
}
