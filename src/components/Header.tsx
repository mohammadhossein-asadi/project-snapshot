import React from 'react';
import { Camera, ShieldCheck, Cpu, Github, Sparkles } from 'lucide-react';
import { VERSION } from '../lib/constants';

interface HeaderProps {
  onLoadDemo: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onLoadDemo, isLoading }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">Project Snapshot</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono font-medium border border-blue-500/20">
                v{VERSION}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Cross-platform codebase snapshot, secret scanner & AI context generator
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secret Masking Active</span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span>Pure Client-Side Engine</span>
          </div>

          <button
            onClick={onLoadDemo}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium transition shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Demo Repo</span>
          </button>

          <a
            href="https://github.com/mohammadhossein-asadi/project-snapshot"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
            title="GitHub Repository"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
};
