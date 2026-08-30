import React from 'react';
import { 
  Building2, 
  Sparkles, 
  Code2, 
  BarChart3, 
  Activity, 
  Layers, 
  ShieldCheck, 
  FileSpreadsheet,
  Download,
  FileText,
  BookOpen,
  Undo2,
  Redo2
} from 'lucide-react';
import { RevitLiveSyncIndicator } from './RevitLiveSyncIndicator';
import { PAPER_TABLE_1_PRESETS } from '../lib/mptMath';
import { generateAndDownloadPaperPDF } from '../lib/pdfGenerator';

export const Header = ({
  currentScenario,
  onSelectScenario,
  onOpenRevitCode,
  onOpenScenarioComparison,
  onOpenCsvExport,
  onOpenPaperModal,
  activeViewTab,
  setActiveViewTab,
  revitSyncState,
  onManualRevitPing,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  historyStepText = ''
}) => {
  return (
    <header className="sleek-glass border-b border-slate-800/80 text-slate-100 sticky top-0 z-30 shadow-2xl backdrop-blur-xl">
      {/* Top Banner with Paper Attribution and Live Sync Status */}
      <div className="bg-slate-950/90 px-4 lg:px-8 py-2 border-b border-indigo-500/20 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Glowing ICEPE 2026 Recognition Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/30 border border-indigo-300/50 animate-pulse">
            <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-spin-slow" />
            <span>ICEPE 2026</span>
          </div>

          <span className="text-slate-600 hidden sm:inline">•</span>

          {/* Research Paper Name with Clickable Reader Modal */}
          <button
            id="top-banner-paper-link"
            onClick={onOpenPaperModal}
            className="text-slate-200 text-xs font-semibold flex items-center gap-1.5 hover:text-indigo-300 transition-colors cursor-pointer text-left group"
            title="Click to view ICEPE 2026 paper abstract, equations & benchmarks"
          >
            <span className="text-slate-400 font-normal">Paper:</span>
            <span className="text-white font-bold underline decoration-indigo-500/60 decoration-2 underline-offset-2 group-hover:decoration-indigo-400">
              Modern Portfolio Theory in Generative Urban BIM Layouts
            </span>
          </button>

          <span className="text-slate-600 hidden md:inline">•</span>

          {/* Author Name */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Sherif Ahmad Magdaldin
          </span>

          {/* Direct Download Paper PDF Button */}
          <button
            id="top-banner-btn-download-pdf"
            onClick={() => {
              generateAndDownloadPaperPDF();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white border border-indigo-400/50 shadow-md shadow-indigo-600/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="Download full 3-page peer-reviewed research paper PDF with ICEPE 2026 info"
          >
            <Download className="h-3.5 w-3.5 text-amber-300" />
            <span>Download Paper PDF</span>
          </button>
        </div>
        <div className="flex items-center space-x-3">
          {/* Header Undo / Redo controls */}
          {(onUndo || onRedo) && (
            <div className="flex items-center bg-slate-900/90 rounded-lg border border-slate-800 p-0.5 text-[11px]">
              <button
                id="header-btn-undo"
                onClick={onUndo}
                disabled={!canUndo}
                className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
                  canUndo ? 'text-slate-200 hover:text-white hover:bg-slate-800 cursor-pointer' : 'text-slate-600 opacity-40 cursor-not-allowed'
                }`}
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="h-3 w-3" />
                <span className="hidden sm:inline">Undo</span>
              </button>
              <button
                id="header-btn-redo"
                onClick={onRedo}
                disabled={!canRedo}
                className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
                  canRedo ? 'text-slate-200 hover:text-white hover:bg-slate-800 cursor-pointer' : 'text-slate-600 opacity-40 cursor-not-allowed'
                }`}
                title="Redo (Ctrl+Y / Cmd+Shift+Z)"
              >
                <Redo2 className="h-3 w-3" />
                <span className="hidden sm:inline">Redo</span>
              </button>
              {historyStepText && (
                <span className="px-1.5 text-[10px] font-mono text-slate-500 hidden md:inline border-l border-slate-800">
                  {historyStepText}
                </span>
              )}
            </div>
          )}
          <RevitLiveSyncIndicator 
            syncState={revitSyncState}
            onOpenRevitModal={onOpenRevitCode}
            onManualPing={onManualRevitPing}
          />
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="px-4 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title and Branding */}
        <div className="flex items-center space-x-3.5">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/25 text-white font-bold">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold text-white tracking-tight">
                BIM MPT Urban Optimizer
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                <Sparkles className="h-3 w-3 text-indigo-400" />
                AI Agent Co-Pilot (JavaScript)
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Generative Parametric BIM × Markowitz Asset Engineering
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 self-start md:self-auto overflow-x-auto max-w-full shadow-inner">
          <button
            id="tab-dashboard"
            onClick={() => setActiveViewTab('dashboard')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeViewTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Co-Pilot Workspace
          </button>
          <button
            id="tab-bim"
            onClick={() => setActiveViewTab('bim')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeViewTab === 'bim'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            Generative BIM Sandbox
          </button>
          <button
            id="tab-frontier"
            onClick={() => setActiveViewTab('frontier')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeViewTab === 'frontier'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            Efficient Frontier
          </button>
          <button
            id="tab-analytics"
            onClick={() => setActiveViewTab('analytics')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeViewTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Matrix Mathematics
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {onOpenCsvExport && (
            <button
              id="btn-export-csv"
              onClick={onOpenCsvExport}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              title="Export Masterplan Weights, Yield Data & Correlation Matrix to CSV"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              Export CSV
            </button>
          )}
          <button
            id="btn-compare-table-1"
            onClick={onOpenScenarioComparison}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            title="View Table 1 Simulation Analytics Matrix from paper"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-indigo-400" />
            Table 1 Matrix
          </button>
          <button
            id="btn-export-revit"
            onClick={onOpenRevitCode}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white transition-all shadow-lg shadow-amber-600/25 flex items-center gap-2 cursor-pointer"
            title="Open Pure JavaScript MPT Engine, Revit 2027 C# Plugin, and Live Bridge"
          >
            <Code2 className="h-3.5 w-3.5 text-amber-200" />
            Code & Revit Bridge
          </button>
        </div>
      </div>

      {/* Preset Regimes Selector Bar (From Paper Table 1) */}
      <div className="px-4 lg:px-8 py-2 bg-slate-950/50 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] whitespace-nowrap flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
          Research Benchmarks:
        </span>
        <div className="flex items-center gap-2">
          {PAPER_TABLE_1_PRESETS.map((preset) => {
            const isSelected = currentScenario.id === preset.id;
            return (
              <button
                key={preset.id}
                id={`preset-${preset.id}`}
                onClick={() => onSelectScenario(preset)}
                className={`px-3 py-1 rounded-lg transition-all font-medium whitespace-nowrap flex items-center gap-2 border cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <span className="text-xs">{preset.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  isSelected ? 'bg-indigo-500/30 text-indigo-200' : 'bg-slate-800 text-slate-500'
                }`}>
                  SR: {preset.sharpeRatio.toFixed(3)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
