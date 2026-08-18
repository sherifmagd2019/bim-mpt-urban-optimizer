import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileSpreadsheet, 
  Check, 
  Copy, 
  Table, 
  Sliders, 
  Activity, 
  Building2, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { generateCsvExport, downloadCsvFile } from '../lib/mptMath';

export const CsvExportModal = ({
  isOpen,
  onClose,
  assets,
  correlationMatrix,
  targetRisk,
  riskFreeRate = 0.02,
  currentScenario
}) => {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');

  if (!isOpen) return null;

  const csvContent = generateCsvExport(
    assets,
    correlationMatrix,
    targetRisk,
    riskFreeRate,
    currentScenario?.name
  );

  const filename = `BIM_MPT_Masterplan_Report_${(currentScenario?.name || 'Custom').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;

  const handleCopy = () => {
    navigator.clipboard.writeText(csvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadCsvFile(csvContent, filename);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  const totalFootprint = assets.reduce((sum, a) => sum + a.footprintM2, 0);

  return (
    <div id="csv-export-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="sleek-glass border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Export BIM Masterplan Report (CSV)
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                  Full Quantitative Dataset
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Asset weights, expected yields, historical risk, correlation matrix (ρ), and covariance matrix (Σ)
              </p>
            </div>
          </div>
          <button
            id="close-csv-modal-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Highlights Summary Bar */}
        <div className="bg-slate-900/60 px-5 py-3 border-b border-slate-800/70 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Footprint</span>
            <span className="text-white font-mono font-bold">{totalFootprint.toLocaleString()} m²</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Zoning Assets</span>
            <span className="text-indigo-300 font-mono font-bold">{assets.length} Active Categories</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Matrix Dimension</span>
            <span className="text-emerald-400 font-mono font-bold">{assets.length} × {assets.length} Covariance Σ</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Target Risk Ceiling</span>
            <span className="text-amber-400 font-mono font-bold">{(targetRisk * 100).toFixed(2)}%</span>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-5 pt-3 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              id="tab-csv-preview-btn"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'border-emerald-500 text-white bg-slate-900/80'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="h-3.5 w-3.5" />
              Raw CSV Output Preview
            </button>
            <button
              id="tab-csv-schema-btn"
              onClick={() => setActiveTab('schema')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'schema'
                  ? 'border-emerald-500 text-white bg-slate-900/80'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              Included Sections & Fields
            </button>
          </div>

          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            UTF-8 with BOM (Excel & BIM compatible)
          </span>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-4 overflow-y-auto bg-slate-950/90 font-mono text-xs text-slate-300">
          {activeTab === 'preview' ? (
            <pre className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 overflow-x-auto text-[11px] leading-relaxed text-emerald-300/90 select-all">
              {csvContent}
            </pre>
          ) : (
            <div className="space-y-4 font-sans text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                <h4 className="text-white font-bold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-emerald-400" />
                  Section 1: Portfolio Level Aggregate Summary
                </h4>
                <p className="text-slate-400">
                  Comprehensive macro-metrics including Total Generative BIM Footprint (m²), Portfolio Expected Yield (μ_p), Portfolio Volatility Risk (σ_p), Sharpe Ratio, Global Minimum Variance (GMV) bounds, and optimal tangency values.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                <h4 className="text-white font-bold flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-indigo-400" />
                  Section 2: Spatial Asset Weights & Yield Specifications
                </h4>
                <p className="text-slate-400">
                  Full tabular breakdown across all active zoning assets: Current Allocation Weight (%), Optimal Sharpe Tangency Weight (%), GMV Weight (%), Expected Annual Return (%), Historical Commodity Volatility (σ), Building Floors, and Cost/m².
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                <h4 className="text-white font-bold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-cyan-400" />
                  Section 3 & 4: Correlation Matrix (ρ_ij) and Covariance Matrix (Σ_ij)
                </h4>
                <p className="text-slate-400">
                  Exact symmetric matrices reflecting live slider adjustments, cross-product volatility scalings (Σ_ij = ρ_ij · σ_i · σ_j), and diagonal variances (σ_i²).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                <h4 className="text-white font-bold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-amber-400" />
                  Section 5 & 6: Math Analytical Scalars (Listing 1) & Efficient Frontier Curve
                </h4>
                <p className="text-slate-400">
                  Analytical scalars A, B, C, parabolic determinant D, basis vectors g and h (w = g + h · μ_p), alongside 50 sample points mapped along the continuous Markowitz Efficient Frontier.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-mono text-[11px] text-slate-300 truncate max-w-xs sm:max-w-md">
              File: {filename}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              id="copy-csv-text-btn"
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition-all flex items-center gap-2 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  Copied CSV
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy CSV Text
                </>
              )}
            </button>

            <button
              id="download-csv-btn"
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-600/25 flex items-center gap-2 cursor-pointer"
            >
              {downloaded ? (
                <>
                  <Check className="h-4 w-4" />
                  Downloaded!
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download CSV (.csv)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
