import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ScanResult, SnapshotOptions } from '../types';
import { generateProjectQualityReport } from './quality';

export function generatePdfReport(scanResult: ScanResult, _options?: SnapshotOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const qualityReport = generateProjectQualityReport(scanResult.files);
  const nowStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Primary Theme Colors
  const primaryColor = [15, 23, 42]; // Slate 900
  const slateLight = [241, 245, 249];

  // Header Banner Background
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('PROJECT ARCHITECTURE & QUALITY AUDIT', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text(`Project: ${scanResult.projectName}  |  Generated: ${nowStr}`, 14, 26);
  doc.text(
    `Total Files: ${scanResult.stats.totalFiles}  |  Total Size: ${scanResult.stats.totalSizeHuman}  |  Languages: ${Object.keys(scanResult.stats.languages).length}`,
    14,
    33
  );

  // Executive Summary Card Grid
  let curY = 50;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('1. Executive Overview & Health Index', 14, curY);
  curY += 6;

  // 4 Metric Highlight Cards
  const cardWidth = (pageWidth - 28 - 9) / 4;
  const cardHeight = 22;

  const metrics = [
    { label: 'Quality Grade', value: `Grade ${qualityReport.overallGrade}`, sub: `${qualityReport.overallScore}/100 Index`, color: [37, 99, 235] },
    { label: 'Codebase Volume', value: `${qualityReport.totalLinesOfCode.toLocaleString()} LOC`, sub: `${scanResult.stats.totalFiles} Files`, color: [16, 185, 129] },
    { label: 'Avg Complexity', value: `${qualityReport.avgComplexity}`, sub: qualityReport.avgComplexity <= 5 ? 'Optimal (Low)' : 'Moderate', color: [147, 51, 234] },
    { label: 'Doc Coverage', value: `${qualityReport.avgDocumentationCoverage}%`, sub: `${qualityReport.totalCommentLines} comment lines`, color: [245, 158, 11] },
  ];

  metrics.forEach((m, idx) => {
    const x = 14 + idx * (cardWidth + 3);
    doc.setFillColor(slateLight[0], slateLight[1], slateLight[2]);
    doc.roundedRect(x, curY, cardWidth, cardHeight, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(m.label.toUpperCase(), x + 3.5, curY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.text(m.value, x + 3.5, curY + 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(m.sub, x + 3.5, curY + 18.5);
  });

  curY += cardHeight + 10;

  // Environment & Git Status
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('2. Repository Context & Version Control', 14, curY);
  curY += 4;

  const envData = [
    ['Project / Root Folder', scanResult.projectName, 'Git Branch', scanResult.gitInfo?.branch || 'main'],
    ['Repository Remote', scanResult.gitInfo?.origin || 'Local Workspace', 'Commit SHA', scanResult.gitInfo?.shortCommit || scanResult.gitInfo?.commit?.substring(0, 8) || 'Head'],
    ['Total Directories', scanResult.stats.totalDirectories.toString(), 'Secret Audit', scanResult.stats.secretDetections === 0 ? '✓ CLEAN (0 secrets detected)' : `⚠ WARNING (${scanResult.stats.secretDetections} secrets found)`],
    ['Refactor Flags', `${qualityReport.filesNeedingRefactor.length} files flagged`, 'Scan Timestamp', scanResult.timestamp.substring(0, 19).replace('T', ' ')],
  ];

  autoTable(doc, {
    startY: curY,
    margin: { left: 14, right: 14 },
    body: envData,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [51, 65, 85], cellWidth: 42 },
      1: { textColor: [15, 23, 42], cellWidth: 48 },
      2: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [51, 65, 85], cellWidth: 42 },
      3: { textColor: [15, 23, 42] },
    },
  });

  curY = (doc as any).lastAutoTable.finalY + 10;

  // Language Breakdown Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('3. Language Distribution Breakdown', 14, curY);
  curY += 4;

  const langRows = Object.entries(scanResult.stats.languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([lang, count]) => [
      lang,
      count.toString(),
      `${((count / scanResult.stats.totalFiles) * 100).toFixed(1)}%`,
    ]);

  autoTable(doc, {
    startY: curY,
    margin: { left: 14, right: 14 },
    head: [['Language', 'File Count', 'Proportion']],
    body: langRows,
    theme: 'striped',
    headStyles: { fillColor: primaryColor as [number, number, number], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2 },
  });

  curY = (doc as any).lastAutoTable.finalY + 10;

  // Code Complexity & File Health Table (Top Files)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('4. Module Complexity & Maintainability Index', 14, curY);
  curY += 4;

  const fileRows = qualityReport.allFileScores
    .slice(0, 10)
    .map((f) => [
      f.path.length > 40 ? `...${f.path.slice(-37)}` : f.path,
      f.language,
      f.linesOfCode.toString(),
      f.cyclomaticComplexity.toString(),
      `${f.documentationCoverage}%`,
      `${f.maintainabilityIndex}/100`,
      f.grade,
    ]);

  autoTable(doc, {
    startY: curY,
    margin: { left: 14, right: 14 },
    head: [['File Path', 'Lang', 'LOC', 'Complexity', 'Docs %', 'Maintainability', 'Grade']],
    body: fileRows,
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'normal' },
      6: { fontStyle: 'bold', halign: 'center' },
    },
  });

  // Footer on each page
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Project Snapshot Audit Report — Generated for ${scanResult.projectName} — Page ${i} of ${totalPages}`,
      pageWidth / 2,
      288,
      { align: 'center' }
    );
  }

  // Download the PDF file
  doc.save(`${scanResult.projectName}-audit-report.pdf`);
}
