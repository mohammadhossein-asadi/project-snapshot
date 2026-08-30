import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import {
  Share2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Layers,
  Search,
  FileCode,
  Package,
  ArrowRight,
  Info,
  Camera,
  Check,
  X,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Pause,
  Play,
  Copy,
  HardDrive,
  Sparkles,
  FileText,
} from 'lucide-react';
import { ScannedFile } from '../types';
import { parseDependencies, GraphNode, DependencyGraphData } from '../lib/dependencies';

interface DependencyGraphProps {
  files: ScannedFile[];
  onSelectFile?: (path: string) => void;
  projectName?: string;
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3b82f6', // blue-500
  'TypeScript React': '#60a5fa', // blue-400
  JavaScript: '#f59e0b', // amber-500
  'JavaScript React': '#fbbf24', // amber-400
  Python: '#10b981', // emerald-500
  JSON: '#8b5cf6', // purple-500
  CSS: '#ec4899', // pink-500
  HTML: '#f97316', // orange-500
  Rust: '#ef4444', // red-500
  Go: '#06b6d4', // cyan-500
  Markdown: '#a855f7',
  'External Library': '#64748b', // slate-500
  'Python Package': '#64748b',
  Default: '#94a3b8',
};

type SearchMode = 'highlight' | 'isolate';

export const DependencyGraph: React.FC<DependencyGraphProps> = ({
  files,
  onSelectFile,
  projectName = 'Project Snapshot',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const simulationRef = useRef<d3.Simulation<any, any> | null>(null);

  // View & Filter States
  const [includeExternal, setIncludeExternal] = useState(true);
  const [minDegree, setMinDegree] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('highlight');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [colorMode, setColorMode] = useState<'language' | 'group'>('language');
  const [isPhysicsPaused, setIsPhysicsPaused] = useState(false);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);

  // Quick filter categories
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'components' | 'lib' | 'packages' | 'high-degree'>('all');

  // Compute full dependency graph from scanned files
  const graphData: DependencyGraphData = useMemo(() => {
    return parseDependencies(files);
  }, [files]);

  // Set of connected nodes for highlighting or isolation
  const connectedNodeIds = useMemo(() => {
    if (!searchTerm.trim()) return new Set<string>();
    const term = searchTerm.toLowerCase();
    const matches = graphData.nodes.filter(
      n => n.id.toLowerCase().includes(term) || n.label.toLowerCase().includes(term)
    );
    const ids = new Set<string>(matches.map(m => m.id));

    // Also include 1st degree connected neighbors
    for (const link of graphData.links) {
      const srcId = typeof link.source === 'object' ? (link.source as any).id : link.source;
      const tgtId = typeof link.target === 'object' ? (link.target as any).id : link.target;
      if (ids.has(srcId)) ids.add(tgtId);
      if (ids.has(tgtId)) ids.add(srcId);
    }
    return ids;
  }, [searchTerm, graphData]);

  // Filtered nodes and links based on UI controls and search mode
  const filteredData = useMemo(() => {
    let nodes = graphData.nodes;

    // External packages toggle
    if (!includeExternal) {
      nodes = nodes.filter(n => !n.isExternal);
    }

    // Min degree slider
    if (minDegree > 0) {
      nodes = nodes.filter(n => (n.degree || 0) >= minDegree);
    }

    // Category quick filters
    if (activeCategoryFilter === 'components') {
      nodes = nodes.filter(n => n.id.toLowerCase().includes('component') || n.group?.toLowerCase().includes('component'));
    } else if (activeCategoryFilter === 'lib') {
      nodes = nodes.filter(n => n.id.toLowerCase().includes('lib') || n.id.toLowerCase().includes('util') || n.group?.toLowerCase().includes('lib'));
    } else if (activeCategoryFilter === 'packages') {
      nodes = nodes.filter(n => n.isExternal);
    } else if (activeCategoryFilter === 'high-degree') {
      nodes = nodes.filter(n => (n.degree || 0) >= 3);
    }

    // Search Isolation mode: hide nodes not matching or connected
    if (searchTerm.trim() && searchMode === 'isolate') {
      nodes = nodes.filter(n => connectedNodeIds.has(n.id));
    }

    const nodeIds = new Set(nodes.map(n => n.id));
    const links = graphData.links.filter(l => {
      const srcId = typeof l.source === 'object' ? (l.source as any).id : l.source;
      const tgtId = typeof l.target === 'object' ? (l.target as any).id : l.target;
      return nodeIds.has(srcId) && nodeIds.has(tgtId);
    });

    return { nodes, links };
  }, [graphData, includeExternal, minDegree, activeCategoryFilter, searchTerm, searchMode, connectedNodeIds]);

  // Matching node count for search
  const matchingSearchCount = useMemo(() => {
    if (!searchTerm.trim()) return 0;
    const term = searchTerm.toLowerCase();
    return graphData.nodes.filter(
      n => n.id.toLowerCase().includes(term) || n.label.toLowerCase().includes(term)
    ).length;
  }, [searchTerm, graphData.nodes]);

  // D3 force graph initialization and render
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 900;
    const height = 620;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    // Define defs & arrow markers & glow filters
    const defs = svg.append('defs');

    // Standard arrow
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#475569');

    // Active connection arrow
    defs.append('marker')
      .attr('id', 'arrowhead-active')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#38bdf8');

    // Search match arrow
    defs.append('marker')
      .attr('id', 'arrowhead-search')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#10b981');

    // Glow filter for search highlight
    const glowFilter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-30%')
      .attr('y', '-30%')
      .attr('width', '160%')
      .attr('height', '160%');
    glowFilter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'coloredBlur');
    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Create container group for zoom and pan
    const g = svg.append('g').attr('class', 'everything');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomPercent(Math.round(event.transform.k * 100));
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    // Deep clone data for D3 mutation
    const nodes = filteredData.nodes.map(d => ({ ...d }));
    const links = filteredData.links.map(d => ({ ...d }));

    // Color scales
    const groupColorScale = d3.scaleOrdinal(d3.schemeTableau10);

    const getNodeColor = (d: any) => {
      if (colorMode === 'language') {
        return LANGUAGE_COLORS[d.language || ''] || LANGUAGE_COLORS.Default;
      }
      return groupColorScale(d.group || 'default');
    };

    // Force simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(85).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-240))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius((d: any) => (d.isExternal ? 16 : 22)).iterations(2));

    simulationRef.current = simulation;

    // Render Links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#334155')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.6)
      .attr('marker-end', 'url(#arrowhead)');

    // Render Nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node-group')
      .attr('cursor', 'pointer')
      .call(
        d3.drag<any, any>()
          .on('start', (event, d) => {
            if (!event.active && !isPhysicsPaused) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active && !isPhysicsPaused) simulation.alphaTarget(0);
            if (!isPhysicsPaused) {
              d.fx = null;
              d.fy = null;
            }
          })
      );

    // Node outer selection/search pulse ring
    node.append('circle')
      .attr('class', 'node-halo')
      .attr('r', (d: any) => (d.isExternal ? 14 : Math.min(26, 16 + (d.degree || 0) * 1.5)))
      .attr('fill', 'none')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 2)
      .attr('opacity', 0);

    // Node circles
    node.append('circle')
      .attr('class', 'node-core')
      .attr('r', (d: any) => (d.isExternal ? 8 : Math.min(18, 10 + (d.degree || 0) * 1.5)))
      .attr('fill', (d: any) => (d.isExternal ? '#1e293b' : getNodeColor(d)))
      .attr('stroke', (d: any) => (d.isExternal ? '#475569' : '#0f172a'))
      .attr('stroke-width', 2)
      .attr('opacity', (d: any) => (d.isExternal ? 0.85 : 0.95));

    // Inner icon dot for external packages
    node.filter((d: any) => d.isExternal)
      .append('circle')
      .attr('r', 3)
      .attr('fill', '#94a3b8');

    // Node labels
    node.append('text')
      .text((d: any) => d.label)
      .attr('x', (d: any) => (d.isExternal ? 12 : 16))
      .attr('y', 4)
      .attr('font-size', '11px')
      .attr('font-family', 'ui-monospace, monospace')
      .attr('fill', '#cbd5e1')
      .attr('pointer-events', 'none')
      .style('text-shadow', '0 1px 3px rgba(0,0,0,0.85)');

    // Apply Search Highlights if in 'highlight' mode
    if (searchTerm.trim() && searchMode === 'highlight') {
      const term = searchTerm.toLowerCase();
      
      node.each(function (d: any) {
        const isMatch = d.id.toLowerCase().includes(term) || d.label.toLowerCase().includes(term);
        const isConnected = connectedNodeIds.has(d.id);
        const el = d3.select(this);

        if (isMatch) {
          el.select('.node-halo')
            .attr('stroke', '#10b981')
            .attr('stroke-width', 2.5)
            .attr('opacity', 1)
            .attr('filter', 'url(#glow)');
          el.select('.node-core')
            .attr('stroke', '#34d399')
            .attr('stroke-width', 3);
          el.attr('opacity', 1);
        } else if (isConnected) {
          el.select('.node-halo')
            .attr('stroke', '#38bdf8')
            .attr('stroke-width', 1.5)
            .attr('opacity', 0.6);
          el.attr('opacity', 0.9);
        } else {
          el.attr('opacity', 0.2);
        }
      });

      link
        .attr('stroke', (l: any) => {
          const s = l.source.id || l.source;
          const t = l.target.id || l.target;
          return connectedNodeIds.has(s) && connectedNodeIds.has(t) ? '#10b981' : '#1e293b';
        })
        .attr('stroke-width', (l: any) => {
          const s = l.source.id || l.source;
          const t = l.target.id || l.target;
          return connectedNodeIds.has(s) && connectedNodeIds.has(t) ? 2 : 0.8;
        })
        .attr('stroke-opacity', (l: any) => {
          const s = l.source.id || l.source;
          const t = l.target.id || l.target;
          return connectedNodeIds.has(s) && connectedNodeIds.has(t) ? 0.9 : 0.15;
        })
        .attr('marker-end', (l: any) => {
          const s = l.source.id || l.source;
          const t = l.target.id || l.target;
          return connectedNodeIds.has(s) && connectedNodeIds.has(t) ? 'url(#arrowhead-search)' : 'url(#arrowhead)';
        });
    }

    // Node click handler: open side panel & highlight connections
    node.on('click', (event, d: any) => {
      event.stopPropagation();
      const orig = graphData.nodes.find(n => n.id === d.id) || d;
      setSelectedNode(orig);

      // Reset any previous node halos
      node.selectAll('.node-halo').attr('opacity', 0);

      // Highlight selected node halo
      d3.select(event.currentTarget).select('.node-halo')
        .attr('stroke', '#38bdf8')
        .attr('stroke-width', 3)
        .attr('opacity', 1)
        .attr('filter', 'url(#glow)');

      // Highlight connection links
      link
        .attr('stroke', (l: any) => {
          const srcId = l.source.id || l.source;
          const tgtId = l.target.id || l.target;
          return srcId === d.id || tgtId === d.id ? '#38bdf8' : '#1e293b';
        })
        .attr('stroke-width', (l: any) => {
          const srcId = l.source.id || l.source;
          const tgtId = l.target.id || l.target;
          return srcId === d.id || tgtId === d.id ? 2.5 : 1;
        })
        .attr('stroke-opacity', (l: any) => {
          const srcId = l.source.id || l.source;
          const tgtId = l.target.id || l.target;
          return srcId === d.id || tgtId === d.id ? 1 : 0.15;
        })
        .attr('marker-end', (l: any) => {
          const srcId = l.source.id || l.source;
          const tgtId = l.target.id || l.target;
          return srcId === d.id || tgtId === d.id ? 'url(#arrowhead-active)' : 'url(#arrowhead)';
        });

      // Dim unrelated nodes
      node.attr('opacity', (n: any) => {
        if (n.id === d.id) return 1;
        const isConnected = links.some((l: any) => {
          const srcId = l.source.id || l.source;
          const tgtId = l.target.id || l.target;
          return (srcId === d.id && tgtId === n.id) || (tgtId === d.id && srcId === n.id);
        });
        return isConnected ? 1 : 0.25;
      });
    });

    // Background click to deselect node
    svg.on('click', () => {
      setSelectedNode(null);
      node.selectAll('.node-halo').attr('opacity', 0);
      link
        .attr('stroke', '#334155')
        .attr('stroke-width', 1.5)
        .attr('stroke-opacity', 0.6)
        .attr('marker-end', 'url(#arrowhead)');
      node.attr('opacity', 1);
    });

    // Simulation tick update
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [filteredData, colorMode, graphData, searchTerm, searchMode, connectedNodeIds, isPhysicsPaused]);

  // Manual Zoom Controls
  const handleZoom = useCallback((scaleFactor: number) => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(250).call(zoomRef.current.scaleBy as any, scaleFactor);
  }, []);

  const handleResetZoom = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(400).call(zoomRef.current.transform as any, d3.zoomIdentity);
    setZoomPercent(100);
  }, []);

  const handleZoomToFit = useCallback(() => {
    if (!svgRef.current || !zoomRef.current || !containerRef.current) return;
    const svg = d3.select(svgRef.current);
    const g = svg.select('g.everything');
    if (g.empty()) return;

    const bounds = (g.node() as SVGGraphicsElement).getBBox();
    const width = containerRef.current.clientWidth || 900;
    const height = 620;

    if (bounds.width === 0 || bounds.height === 0) return;

    const dx = bounds.width;
    const dy = bounds.height;
    const x = bounds.x + bounds.width / 2;
    const y = bounds.y + bounds.height / 2;
    const scale = Math.max(0.15, Math.min(2.5, 0.85 / Math.max(dx / width, dy / height)));
    const translate = [width / 2 - scale * x, height / 2 - scale * y];

    const transform = d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale);

    svg.transition().duration(600).call(zoomRef.current.transform as any, transform);
    setZoomPercent(Math.round(scale * 100));
  }, []);

  const handleManualPan = useCallback((dx: number, dy: number) => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(200).call(zoomRef.current.translateBy as any, dx, dy);
  }, []);

  const togglePhysics = useCallback(() => {
    if (!simulationRef.current) return;
    if (isPhysicsPaused) {
      simulationRef.current.alphaTarget(0.3).restart();
      setIsPhysicsPaused(false);
    } else {
      simulationRef.current.stop();
      setIsPhysicsPaused(true);
    }
  }, [isPhysicsPaused]);

  // Connected nodes details for selected node
  const connections = useMemo(() => {
    if (!selectedNode) return { imports: [], importedBy: [] };

    const imports = graphData.links
      .filter(l => {
        const srcId = typeof l.source === 'object' ? (l.source as any).id : l.source;
        return srcId === selectedNode.id;
      })
      .map(l => {
        const tgtId = typeof l.target === 'object' ? (l.target as any).id : l.target;
        const targetNode = graphData.nodes.find(n => n.id === tgtId);
        return {
          id: tgtId,
          specifier: l.rawSpecifier,
          isExternal: targetNode?.isExternal || false,
          language: targetNode?.language,
          sizeHuman: targetNode?.sizeHuman,
        };
      });

    const importedBy = graphData.links
      .filter(l => {
        const tgtId = typeof l.target === 'object' ? (l.target as any).id : l.target;
        return tgtId === selectedNode.id;
      })
      .map(l => {
        const srcId = typeof l.source === 'object' ? (l.source as any).id : l.source;
        const sourceNode = graphData.nodes.find(n => n.id === srcId);
        return {
          id: srcId,
          specifier: l.rawSpecifier,
          isExternal: sourceNode?.isExternal || false,
          language: sourceNode?.language,
          sizeHuman: sourceNode?.sizeHuman,
        };
      });

    return { imports, importedBy };
  }, [selectedNode, graphData]);

  // Select node programmatically (e.g. from connection list)
  const handleSelectNodeById = (nodeId: string) => {
    const node = graphData.nodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedNode(node);
    }
  };

  // Copy path helper
  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  // High-Resolution Export as PNG
  const handleExportPNG = async () => {
    if (!svgRef.current || !containerRef.current) return;
    setIsExporting(true);

    try {
      const svgElement = svgRef.current;
      const width = containerRef.current.clientWidth || 1000;
      const height = 620;
      const scaleFactor = 2; // 2x Retina resolution

      // Clone SVG to modify styles for export
      const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
      clonedSvg.setAttribute('width', `${width * scaleFactor}`);
      clonedSvg.setAttribute('height', `${height * scaleFactor}`);
      clonedSvg.style.backgroundColor = '#0b0f19';

      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width * scaleFactor;
        canvas.height = height * scaleFactor;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Dark background
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw graph image
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        // Draw Watermark & Header Banner
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px monospace';
        ctx.fillText(`${projectName} — Dependency & Module Graph`, 30, 45);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '16px monospace';
        const dateStr = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
        ctx.fillText(
          `${filteredData.nodes.length} Modules • ${filteredData.links.length} Import Links • Exported ${dateStr}`,
          30,
          75
        );

        // Convert canvas to PNG and trigger download
        canvas.toBlob((blob) => {
          if (!blob) return;
          const downloadUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `${projectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-dependencies-${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(downloadUrl);
          URL.revokeObjectURL(blobURL);

          setIsExporting(false);
          setExportSuccess(true);
          setTimeout(() => setExportSuccess(false), 3000);
        }, 'image/png');
      };

      image.src = blobURL;
    } catch (err) {
      console.error('Failed to export graph as PNG:', err);
      setIsExporting(false);
    }
  };

  return (
    <div id="dependency-graph-container" className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col">
      {/* Top Header & Search Navigation Toolbar */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Title and description */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">Dependency & Import Graph</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono font-semibold border border-cyan-500/20">
                  D3.js Force Layout
                </span>
                {isPhysicsPaused && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-mono font-semibold border border-amber-500/20 flex items-center gap-1">
                    <Pause className="w-2.5 h-2.5" /> Physics Paused
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Analyze module imports, cross-file relationships, dependency depth, and package architecture
              </p>
            </div>
          </div>

          {/* Quick Actions & View Configurations */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Toggle External Packages */}
            <button
              id="btn-toggle-packages"
              onClick={() => setIncludeExternal(!includeExternal)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition cursor-pointer ${
                includeExternal
                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="Toggle external npm / pip packages"
            >
              <Package className="w-3.5 h-3.5" />
              <span>{includeExternal ? 'External Pkgs: ON' : 'External Pkgs: OFF'}</span>
            </button>

            {/* Color Mode Toggle */}
            <button
              id="btn-toggle-color-mode"
              onClick={() => setColorMode(colorMode === 'language' ? 'group' : 'language')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
              title="Toggle between language and folder directory coloring"
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Color: {colorMode === 'language' ? 'Language' : 'Folder'}</span>
            </button>

            {/* Physics simulation toggle */}
            <button
              id="btn-toggle-physics"
              onClick={togglePhysics}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                isPhysicsPaused
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title={isPhysicsPaused ? 'Resume Force Physics' : 'Freeze Simulation Physics'}
            >
              {isPhysicsPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isPhysicsPaused ? 'Resume' : 'Freeze'}</span>
            </button>
          </div>
        </div>

        {/* Local Search Bar & Mode Switcher */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center flex-1 max-w-xl gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="dep-graph-search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search file or module to highlight/isolate..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                  title="Clear Search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Search Mode Toggle (Highlight vs Isolate) */}
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 shrink-0">
              <button
                id="btn-search-mode-highlight"
                onClick={() => setSearchMode('highlight')}
                className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                  searchMode === 'highlight'
                    ? 'bg-emerald-500/20 text-emerald-300 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Highlight matching nodes & connected links"
              >
                <Sparkles className="w-3 h-3" />
                <span>Highlight</span>
              </button>
              <button
                id="btn-search-mode-isolate"
                onClick={() => setSearchMode('isolate')}
                className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                  searchMode === 'isolate'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Isolate subtree: Only render matches & direct connections"
              >
                <Filter className="w-3 h-3" />
                <span>Isolate File</span>
              </button>
            </div>

            {/* Search Match Badge */}
            {searchTerm.trim() && (
              <span className="text-[11px] font-mono px-2 py-1 rounded bg-slate-800 border border-slate-700 text-emerald-400 whitespace-nowrap">
                {matchingSearchCount} match{matchingSearchCount === 1 ? '' : 'es'}
              </span>
            )}
          </div>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
            <span className="text-[11px] text-slate-500 font-medium mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filters:
            </span>
            <button
              onClick={() => setActiveCategoryFilter('all')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                activeCategoryFilter === 'all'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveCategoryFilter('components')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                activeCategoryFilter === 'components'
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Components
            </button>
            <button
              onClick={() => setActiveCategoryFilter('lib')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                activeCategoryFilter === 'lib'
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Lib / Utils
            </button>
            <button
              onClick={() => setActiveCategoryFilter('high-degree')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                activeCategoryFilter === 'high-degree'
                  ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              High Degree (≥3)
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas & Metadata Side Panel Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 relative min-h-[620px] bg-slate-950">
        {/* SVG Force Visualization Canvas Area */}
        <div
          ref={containerRef}
          className="lg:col-span-8 xl:col-span-8 2xl:col-span-9 relative overflow-hidden flex items-center justify-center select-none"
        >
          <svg
            ref={svgRef}
            className="w-full h-[620px] cursor-grab active:cursor-grabbing"
          />

          {/* Floating Manual Zoom & Pan Controls + Reset View */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
            {/* Primary Zoom & Reset Controls Bar */}
            <div className="flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-lg gap-0.5">
              <button
                id="btn-zoom-in"
                onClick={() => handleZoom(1.25)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                title="Zoom In (+25%)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                id="btn-zoom-out"
                onClick={() => handleZoom(0.8)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                title="Zoom Out (-20%)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-slate-700 mx-1" />

              {/* Reset View Button */}
              <button
                id="btn-reset-view"
                onClick={handleResetZoom}
                className="px-2 py-1 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-1 transition cursor-pointer"
                title="Reset Zoom and Centering to 100%"
              >
                <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Reset View</span>
              </button>

              {/* Fit All to Screen */}
              <button
                id="btn-zoom-fit"
                onClick={handleZoomToFit}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                title="Zoom to Fit All Nodes"
              >
                <Maximize2 className="w-4 h-4 text-purple-400" />
              </button>

              <span className="px-2 py-0.5 font-mono text-[11px] text-slate-400 select-none">
                {zoomPercent}%
              </span>
            </div>

            {/* Directional Manual Pan D-Pad */}
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1.5 shadow-lg flex flex-col items-center gap-1 w-24 self-end">
              <button
                onClick={() => handleManualPan(0, 60)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
                title="Pan Up"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleManualPan(60, 0)}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
                  title="Pan Left"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[9px] font-mono text-slate-500">PAN</span>
                <button
                  onClick={() => handleManualPan(-60, 0)}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
                  title="Pan Right"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                onClick={() => handleManualPan(0, -60)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
                title="Pan Down"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Floating Export as PNG Button */}
          <div className="absolute bottom-4 right-4 z-10">
            <button
              id="btn-export-graph-png"
              onClick={handleExportPNG}
              disabled={isExporting}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-2xl transition cursor-pointer border ${
                exportSuccess
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/50'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-cyan-400/30 shadow-cyan-900/40'
              }`}
              title="Export high-resolution PNG of the dependency graph"
            >
              {isExporting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating PNG...</span>
                </>
              ) : exportSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Exported as PNG!</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 text-white" />
                  <span>Export Graph as PNG</span>
                </>
              )}
            </button>
          </div>

          {/* Bottom-left graph statistics badge */}
          <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg px-3 py-1.5 text-[11px] font-mono text-slate-400 flex items-center gap-3 z-10">
            <span>
              <strong className="text-slate-200">{filteredData.nodes.length}</strong> modules
            </span>
            <span>•</span>
            <span>
              <strong className="text-slate-200">{filteredData.links.length}</strong> import links
            </span>
          </div>

          {/* Language Color Legend */}
          <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg p-2.5 text-[11px] space-y-1.5 hidden sm:block max-w-[190px] z-10">
            <div className="font-semibold text-slate-300 text-[10px] uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Legend</span>
              <span className="text-slate-500">{colorMode}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
              <span className="text-slate-300 truncate">TypeScript (.ts/.tsx)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <span className="text-slate-300 truncate">JavaScript (.js/.jsx)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-slate-300 truncate">Python (.py)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
              <span className="text-slate-300 truncate">JSON / Config</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600 border border-slate-500 shrink-0" />
              <span className="text-slate-300 truncate">External Package</span>
            </div>
          </div>
        </div>

        {/* Rich Node Detail & Metadata Inspector Side Panel */}
        <div
          id="dep-graph-side-panel"
          className="lg:col-span-4 xl:col-span-4 2xl:col-span-3 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/95 p-4 flex flex-col justify-between overflow-y-auto max-h-[620px]"
        >
          {selectedNode ? (
            <div className="space-y-4">
              {/* Header with Close Button & File/Package Icon */}
              <div className="space-y-2 pb-3 border-b border-slate-800">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        selectedNode.isExternal
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {selectedNode.isExternal ? (
                        <Package className="w-4 h-4" />
                      ) : (
                        <FileCode className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white font-mono truncate" title={selectedNode.id}>
                        {selectedNode.label}
                      </h4>
                      <div className="text-[10px] text-slate-400 truncate" title={selectedNode.id}>
                        {selectedNode.id}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Copy Path & Close */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleCopyPath(selectedNode.id)}
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
                      title="Copy path to clipboard"
                    >
                      {copiedPath ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
                      title="Deselect and close details"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Badges row */}
                <div className="flex items-center flex-wrap gap-1.5 pt-1">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-medium border"
                    style={{
                      backgroundColor: `${LANGUAGE_COLORS[selectedNode.language || ''] || '#64748b'}20`,
                      color: LANGUAGE_COLORS[selectedNode.language || ''] || '#94a3b8',
                      borderColor: `${LANGUAGE_COLORS[selectedNode.language || ''] || '#64748b'}40`,
                    }}
                  >
                    {selectedNode.language || 'Unknown'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                    Folder: {selectedNode.group || 'root'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                      selectedNode.isExternal
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}
                  >
                    {selectedNode.isExternal ? 'External Package' : 'Source File'}
                  </span>
                </div>
              </div>

              {/* Detailed Metadata Metrics Grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* File Size */}
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <HardDrive className="w-3 h-3 text-cyan-400" />
                    <span>File Size</span>
                  </div>
                  <div className="text-xs font-bold text-white font-mono">
                    {selectedNode.sizeHuman || (selectedNode.isExternal ? 'N/A (Package)' : '0 B')}
                  </div>
                </div>

                {/* Lines of Code */}
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <FileText className="w-3 h-3 text-blue-400" />
                    <span>Line Count</span>
                  </div>
                  <div className="text-xs font-bold text-white font-mono">
                    {selectedNode.linesCount ? `${selectedNode.linesCount} lines` : selectedNode.isExternal ? 'N/A' : '0 lines'}
                  </div>
                </div>

                {/* Imports (Outgoing) */}
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <ArrowRight className="w-3 h-3 text-emerald-400" />
                    <span>Imports (Out)</span>
                  </div>
                  <div className="text-xs font-bold text-emerald-400 font-mono">
                    {connections.imports.length} modules
                  </div>
                </div>

                {/* Imported By (Incoming) */}
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <Layers className="w-3 h-3 text-indigo-400" />
                    <span>Imported By (In)</span>
                  </div>
                  <div className="text-xs font-bold text-indigo-400 font-mono">
                    {connections.importedBy.length} dependents
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-1.5">
                {!selectedNode.isExternal && onSelectFile && (
                  <button
                    id="btn-inspect-node-file"
                    onClick={() => onSelectFile(selectedNode.id)}
                    className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-blue-900/30"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>Inspect Code in File Explorer</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setSearchTerm(selectedNode.id);
                    setSearchMode('isolate');
                  }}
                  className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Filter className="w-3 h-3 text-cyan-400" />
                  <span>Isolate This Module Subtree</span>
                </button>
              </div>

              {/* Outgoing Imports List */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Imports ({connections.imports.length})</span>
                  </span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1 text-xs pr-1">
                  {connections.imports.length === 0 ? (
                    <div className="text-[11px] text-slate-500 py-1 italic">No outbound imports detected</div>
                  ) : (
                    connections.imports.map((imp, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectNodeById(imp.id)}
                        className="w-full p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800/80 font-mono text-[11px] text-slate-300 flex items-center justify-between gap-2 transition text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          {imp.isExternal ? (
                            <Package className="w-3 h-3 text-amber-400 shrink-0" />
                          ) : (
                            <FileCode className="w-3 h-3 text-blue-400 shrink-0" />
                          )}
                          <span className="truncate group-hover:text-cyan-300" title={imp.id}>
                            {imp.id}
                          </span>
                        </div>
                        {imp.sizeHuman && (
                          <span className="text-[10px] text-slate-500 shrink-0 font-sans">
                            {imp.sizeHuman}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Incoming Dependents (Imported By) */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Imported By ({connections.importedBy.length})</span>
                  </span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1 text-xs pr-1">
                  {connections.importedBy.length === 0 ? (
                    <div className="text-[11px] text-slate-500 py-1 italic">Not imported by any local project files</div>
                  ) : (
                    connections.importedBy.map((imp, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectNodeById(imp.id)}
                        className="w-full p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800/80 font-mono text-[11px] text-slate-300 flex items-center justify-between gap-2 transition text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <FileCode className="w-3 h-3 text-blue-400 shrink-0" />
                          <span className="truncate group-hover:text-indigo-300" title={imp.id}>
                            {imp.id}
                          </span>
                        </div>
                        {imp.sizeHuman && (
                          <span className="text-[10px] text-slate-500 shrink-0 font-sans">
                            {imp.sizeHuman}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Empty State Guide */
            <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-slate-400">
                <Info className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-slate-300">No Module Selected</div>
                <p className="text-[11px] text-slate-400 max-w-[210px] leading-relaxed">
                  Click any circle in the graph to inspect detailed file size, code lines, language specs, and direct import chains.
                </p>
              </div>
              <div className="pt-2 text-[10px] text-slate-500 font-mono">
                Tip: Drag nodes to rearrange physics layout
              </div>
            </div>
          )}

          {/* Degree Filter Slider at bottom of panel */}
          <div className="pt-4 border-t border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Min Connections Filter:</span>
              <span className="font-mono font-bold text-cyan-400">≥ {minDegree}</span>
            </div>
            <input
              id="slider-min-degree"
              type="range"
              min="0"
              max="8"
              value={minDegree}
              onChange={(e) => setMinDegree(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DependencyGraph;
