import React from 'react';
import { 
  Layers, 
  Cpu
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { CorrelationHeatmap } from './CorrelationHeatmap';

export const PortfolioAnalytics = ({
  assets,
  calculation,
  totalFootprintM2,
  expectedReturn,
  portfolioVolatility,
  sharpeRatio,
  correlationMatrix,
  onUpdateCorrelation,
  onCommitCorrelation,
  onUpdateAllCorrelation,
  covarianceRegime,
  onSetRegime,
  onExportCsv,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  history,
  currentHistoryIndex,
  onJumpToHistoryStep
}) => {
  // Pie chart data
  const pieData = assets.map(a => ({
    name: a.name,
    code: a.code,
    value: a.footprintM2,
    color: a.color,
    yield: a.expectedYield,
    vol: a.historicalVolatility
  }));

  return (
    <div id="portfolio-analytics-container" className="space-y-6">
      {/* System Monitor Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div id="analytics-metric-yield" className="sleek-glass p-4 rounded-2xl shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Expected Yield (μ_p)</span>
            <span className="text-emerald-400 font-mono font-bold">{(expectedReturn * 100).toFixed(2)}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (expectedReturn / 0.16) * 100)}%` }}></div>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">
            Weighted return: w^T R
          </p>
        </div>

        <div id="analytics-metric-risk" className="sleek-glass p-4 rounded-2xl shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Volatility Risk (σ_p)</span>
            <span className="text-amber-400 font-mono font-bold">{(portfolioVolatility * 100).toFixed(2)}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (portfolioVolatility / 0.22) * 100)}%` }}></div>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">
            Variance risk: √(w^T Σ w)
          </p>
        </div>

        <div id="analytics-metric-sharpe" className="sleek-glass p-4 rounded-2xl shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Sharpe Ratio (R_f=2%)</span>
            <span className="text-indigo-300 font-mono font-bold">{sharpeRatio.toFixed(3)}</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (sharpeRatio / 1.0) * 100)}%` }}></div>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">
            Risk-adjusted performance
          </p>
        </div>

        <div id="analytics-metric-minvar" className="sleek-glass p-4 rounded-2xl shadow-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Min Variance Bound</span>
            <span className="text-purple-400 font-mono font-bold">{(calculation.minVolBound * 100).toFixed(2)}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, (calculation.minVolBound / 0.15) * 100)}%` }}></div>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">
            Limit: 1 / √(1^T Σ^-1 1)
          </p>
        </div>
      </div>

      {/* Interactive Correlation & Covariance Matrix Heatmap Component */}
      <CorrelationHeatmap
        assets={assets}
        correlationMatrix={correlationMatrix}
        onUpdateCorrelation={onUpdateCorrelation}
        onCommitCorrelation={onCommitCorrelation}
        onUpdateAllCorrelation={onUpdateAllCorrelation}
        covarianceRegime={covarianceRegime}
        onSetRegime={onSetRegime}
        onExportCsv={onExportCsv}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={onUndo}
        onRedo={onRedo}
        history={history}
        currentHistoryIndex={currentHistoryIndex}
        onJumpToHistoryStep={onJumpToHistoryStep}
      />

      {/* Two Column Layout: Spatial Asset Allocation Breakdown & Listing 1 Analytical Scalars */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Spatial Asset Allocation Breakdown */}
        <div className="lg:col-span-6 sleek-glass p-5 rounded-2xl shadow-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-400" />
                Spatial Zoning Breakdown
              </h3>
              <span className="text-xs font-mono text-slate-400">
                {totalFootprintM2.toLocaleString()} m² Total
              </span>
            </div>

            {/* Donut Chart */}
            <div className="h-48 my-2 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const pct = ((data.value / totalFootprintM2) * 100).toFixed(1);
                        return (
                          <div className="sleek-glass-card p-2.5 rounded-xl text-xs shadow-2xl border border-slate-700">
                            <p className="font-bold text-white text-[11px]">{data.name}</p>
                            <p className="text-slate-300 font-mono">{data.value.toLocaleString()} m² ({pct}%)</p>
                            <p className="text-emerald-400 font-mono">Yield: {(data.yield * 100).toFixed(1)}%</p>
                            <p className="text-amber-400 font-mono">Vol: {(data.vol * 100).toFixed(1)}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Footprint</span>
                <span className="text-sm font-bold text-white font-mono">{(totalFootprintM2 / 1000).toFixed(1)}k m²</span>
              </div>
            </div>

            {/* Zone Spec Cards */}
            <div className="space-y-2 mt-2">
              {assets.map((asset) => {
                const proportion = (asset.footprintM2 / totalFootprintM2) * 100;
                return (
                  <div
                    key={asset.id}
                    id={`zone-spec-card-${asset.id}`}
                    className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: asset.color }}
                      ></span>
                      <div>
                        <span className="font-bold text-white text-xs">{asset.name}</span>
                        <span className="text-slate-500 font-mono ml-1.5 text-[10px]">({asset.code})</span>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-slate-300 font-semibold">{asset.footprintM2.toLocaleString()} m²</span>
                      <span className="text-indigo-400 ml-2 font-bold">{proportion.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Listing 1 Exact Analytical Quant Scalars & Linear Algebra Solver */}
        <div className="lg:col-span-6 sleek-glass p-5 rounded-2xl shadow-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Cpu className="h-4 w-4 text-indigo-400" />
                Math.NET Analytical Markowitz Scalars (Listing 1)
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold">
                Σ^-1 Inversion Active
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              When cross-correlations &rho;<sub>ij</sub> are adjusted in the heatmap above, the inverse covariance matrix &Sigma;<sup>-1</sup> is recomputed dynamically to evaluate the hyperbolic scalars:
            </p>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div id="scalar-a-card" className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 shadow-inner">
                <span className="text-slate-400 block text-[10px] uppercase font-bold text-indigo-300">
                  Scalar A (1^T Σ^-1 R):
                </span>
                <span className="text-lg text-white font-bold block mt-1">{calculation.scalarA.toFixed(4)}</span>
                <span className="text-[10px] text-slate-500 block">Unit sum dot return</span>
              </div>
              <div id="scalar-b-card" className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 shadow-inner">
                <span className="text-slate-400 block text-[10px] uppercase font-bold text-emerald-300">
                  Scalar B (R^T Σ^-1 R):
                </span>
                <span className="text-lg text-white font-bold block mt-1">{calculation.scalarB.toFixed(4)}</span>
                <span className="text-[10px] text-slate-500 block">Return quadratic form</span>
              </div>
              <div id="scalar-c-card" className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 shadow-inner">
                <span className="text-slate-400 block text-[10px] uppercase font-bold text-purple-300">
                  Scalar C (1^T Σ^-1 1):
                </span>
                <span className="text-lg text-white font-bold block mt-1">{calculation.scalarC.toFixed(4)}</span>
                <span className="text-[10px] text-slate-500 block">Unit quadratic form</span>
              </div>
              <div id="scalar-d-card" className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 shadow-inner">
                <span className="text-slate-400 block text-[10px] uppercase font-bold text-amber-300">
                  Determinant D (BC - A²):
                </span>
                <span className="text-lg text-indigo-300 font-bold block mt-1">{calculation.determinantD.toFixed(4)}</span>
                <span className="text-[10px] text-slate-500 block">Frontier parabolic discriminant</span>
              </div>
            </div>

            {/* Subspace Vectors g & h preview */}
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Subspace Basis Vectors: w = g + h · μ_p
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div id="vector-g-card" className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-indigo-400 text-[10px] block font-bold">Vector g:</span>
                  <span className="text-slate-300 text-[11px]">
                    [{calculation.vectorG.map(v => v.toFixed(3)).join(', ')}]
                  </span>
                </div>
                <div id="vector-h-card" className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-emerald-400 text-[10px] block font-bold">Vector h:</span>
                  <span className="text-slate-300 text-[11px]">
                    [{calculation.vectorH.map(v => v.toFixed(3)).join(', ')}]
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
