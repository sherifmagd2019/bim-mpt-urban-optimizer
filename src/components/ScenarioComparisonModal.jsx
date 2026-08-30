import React from 'react';
import { X, FileSpreadsheet, TrendingUp, ShieldAlert, Sparkles, Download, FileText } from 'lucide-react';
import { PAPER_TABLE_1_PRESETS } from '../lib/mptMath';
import { generateAndDownloadPaperPDF } from '../lib/pdfGenerator';

export const ScenarioComparisonModal = ({
  isOpen,
  onClose,
  currentScenario,
  onSelectScenario
}) => {
  if (!isOpen) return null;

  return (
    <div id="scenario-comparison-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="sleek-glass border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-md shadow-indigo-500/10">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-indigo-600 to-purple-600 text-white border border-indigo-400/40">
                  ICEPE 2026 Paper
                </span>
                <span className="text-[11px] font-bold text-amber-300">
                  Sherif Ahmad Magdaldin
                </span>
              </div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
                Table 1 Benchmark Matrix: Portfolio Optimization Variations
              </h3>
              <p className="text-xs text-slate-400">
                "Modern Portfolio Theory in Generative Urban BIM Layouts" — Empirical comparative analysis of architectural footprints, expected yield (μ_p), volatility (σ_p), and Sharpe Ratio (R_f = 2%)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="table1-btn-download-pdf"
              onClick={generateAndDownloadPaperPDF}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/40 transition-all cursor-pointer flex items-center gap-1.5"
              title="Download 3-page research paper PDF"
            >
              <Download className="h-3.5 w-3.5 text-amber-300" />
              <span>Download PDF Paper</span>
            </button>
            <button
              id="close-comparison-modal-btn"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Content / Comparison Table */}
        <div className="p-6 flex-1 overflow-auto space-y-6">
          <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950/70 shadow-inner">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <th className="p-3.5">BIM Optimization Metric</th>
                  <th className="p-3.5 text-center">
                    <span className="text-slate-200 block font-bold">Baseline Design</span>
                    <span className="text-[10px] text-slate-500 font-normal">Traditional Silo</span>
                  </th>
                  <th className="p-3.5 text-center">
                    <span className="text-amber-300 block font-bold">High-Yield Variant</span>
                    <span className="text-[10px] text-slate-500 font-normal">Max Commercial</span>
                  </th>
                  <th className="p-3.5 text-center">
                    <span className="text-indigo-300 block font-bold">MPT (High Corr)</span>
                    <span className="text-[10px] text-slate-500 font-normal">Macro Shock Regime</span>
                  </th>
                  <th className="p-3.5 text-center">
                    <span className="text-emerald-300 block font-bold">MPT (Low Corr)</span>
                    <span className="text-[10px] text-emerald-500 font-bold">Optimal Diversified</span>
                  </th>
                  <th className="p-3.5 text-center bg-indigo-950/40 border-l border-slate-800">
                    <span className="text-indigo-300 block font-bold">Active Masterplan</span>
                    <span className="text-[10px] text-indigo-500 font-normal">Live Custom</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono text-xs">
                {/* Res Footprint */}
                <tr className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-3 font-semibold text-slate-300">Res. Footprint (m²)</td>
                  <td className="p-3 text-center text-slate-300">12,500</td>
                  <td className="p-3 text-center text-slate-300">5,000</td>
                  <td className="p-3 text-center text-slate-300">8,884</td>
                  <td className="p-3 text-center text-emerald-400 font-bold">8,750</td>
                  <td className="p-3 text-center text-indigo-300 bg-indigo-950/20 border-l border-slate-800 font-bold">
                    {(currentScenario.assets.find(a => a.code === 'RES')?.footprintM2 || 0).toLocaleString()}
                  </td>
                </tr>

                {/* Comm Footprint */}
                <tr className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-3 font-semibold text-slate-300">Comm. Footprint (m²)</td>
                  <td className="p-3 text-center text-slate-300">3,000</td>
                  <td className="p-3 text-center text-amber-400 font-bold">11,000</td>
                  <td className="p-3 text-center text-slate-300">5,648</td>
                  <td className="p-3 text-center text-emerald-400 font-bold">5,500</td>
                  <td className="p-3 text-center text-indigo-300 bg-indigo-950/20 border-l border-slate-800 font-bold">
                    {(currentScenario.assets.find(a => a.code === 'COMM')?.footprintM2 || 0).toLocaleString()}
                  </td>
                </tr>

                {/* Ind Footprint */}
                <tr className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-3 font-semibold text-slate-300">Ind. Footprint (m²)</td>
                  <td className="p-3 text-center text-slate-300">1,500</td>
                  <td className="p-3 text-center text-slate-300">1,000</td>
                  <td className="p-3 text-center text-slate-300">2,468</td>
                  <td className="p-3 text-center text-emerald-400 font-bold">2,750</td>
                  <td className="p-3 text-center text-indigo-300 bg-indigo-950/20 border-l border-slate-800 font-bold">
                    {(currentScenario.assets.find(a => a.code === 'IND')?.footprintM2 || 0).toLocaleString()}
                  </td>
                </tr>

                {/* Expected Return */}
                <tr className="hover:bg-slate-900/40 bg-slate-900/20 transition-colors">
                  <td className="p-3 font-bold text-white flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                    Expected Return (μ_p)
                  </td>
                  <td className="p-3 text-center text-slate-300">6.82%</td>
                  <td className="p-3 text-center text-amber-300 font-bold">14.15%</td>
                  <td className="p-3 text-center text-indigo-300">10.90%</td>
                  <td className="p-3 text-center text-emerald-300 font-bold">11.45%</td>
                  <td className="p-3 text-center text-indigo-300 bg-indigo-950/20 border-l border-slate-800 font-bold">
                    {(currentScenario.expectedReturn * 100).toFixed(2)}%
                  </td>
                </tr>

                {/* Volatility */}
                <tr className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-3 font-bold text-white flex items-center gap-2">
                    <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                    Portfolio Volatility (σ_p)
                  </td>
                  <td className="p-3 text-center text-slate-300">8.41%</td>
                  <td className="p-3 text-center text-pink-400 font-bold">22.38%</td>
                  <td className="p-3 text-center text-amber-300">12.45%</td>
                  <td className="p-3 text-center text-emerald-400 font-bold">10.12%</td>
                  <td className="p-3 text-center text-indigo-300 bg-indigo-950/20 border-l border-slate-800 font-bold">
                    {(currentScenario.portfolioVolatility * 100).toFixed(2)}%
                  </td>
                </tr>

                {/* Sharpe Ratio */}
                <tr className="hover:bg-slate-900/40 bg-slate-900/40 text-sm transition-colors">
                  <td className="p-3 font-bold text-indigo-300 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    Sharpe Ratio (R_f = 2%)
                  </td>
                  <td className="p-3 text-center text-slate-300 font-bold">0.573</td>
                  <td className="p-3 text-center text-pink-400 font-bold">0.543</td>
                  <td className="p-3 text-center text-indigo-300 font-bold">0.715</td>
                  <td className="p-3 text-center text-emerald-400 font-bold bg-emerald-950/40 rounded-lg">
                    0.934 ★
                  </td>
                  <td className="p-3 text-center text-indigo-300 bg-indigo-950/40 border-l border-slate-800 font-bold text-base">
                    {currentScenario.sharpeRatio.toFixed(3)}
                  </td>
                </tr>

                {/* Quick Action Row */}
                <tr>
                  <td className="p-3 text-slate-400 font-sans">Switch Active Layout:</td>
                  {PAPER_TABLE_1_PRESETS.map(preset => (
                    <td key={preset.id} className="p-3 text-center">
                      <button
                        id={`load-scenario-preset-${preset.id}`}
                        onClick={() => {
                          onSelectScenario(preset);
                          onClose();
                        }}
                        className={`px-3 py-1.5 text-xs rounded-xl font-sans font-semibold transition-all cursor-pointer ${
                          currentScenario.id === preset.id
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {currentScenario.id === preset.id ? 'Active' : 'Load'}
                      </button>
                    </td>
                  ))}
                  <td className="p-3 text-center bg-indigo-950/20 border-l border-slate-800 font-sans text-slate-400">
                    Live
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Research Takeaways Card */}
          <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800/80 text-xs text-slate-300 space-y-2 leading-relaxed">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              Key Research Findings & Architectural Implications
            </h4>
            <p>
              1. <strong>The High-Yield Fallacy</strong>: Maximizing raw commercial footprint yield (14.15%) incurs severe downside volatility (22.38%), causing its Sharpe Ratio (0.543) to degrade below even the conservative baseline (0.573).
            </p>
            <p>
              2. <strong>Low-Covariance Diversification</strong>: Under low-correlation asset regimes, Markowitz portfolio engineering unlocks superior risk mitigation, achieving the optimal Sharpe Ratio of <strong>0.934</strong> with only <strong>10.12%</strong> volatility exposure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
