import React, { useState } from 'react';
import { 
  Activity, 
  Target, 
  Sparkles, 
  Sliders, 
  TrendingUp, 
  HelpCircle,
  Maximize2,
  CheckCircle2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  Scatter, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Line, 
  ComposedChart, 
  ReferenceDot
} from 'recharts';
import { PAPER_TABLE_1_PRESETS } from '../lib/mptMath';

export const EfficientFrontierChart = ({
  calculation,
  targetRisk,
  onTargetRiskChange,
  currentExpectedReturn,
  currentVolatility,
  currentSharpeRatio,
  assets,
  onApplyOptimalPoint
}) => {
  const [showMonteCarlo, setShowMonteCarlo] = useState(true);
  const [showBenchmarks, setShowBenchmarks] = useState(true);
  const [showCalLine, setShowCalLine] = useState(true);

  // Format data points for recharts
  const frontierData = calculation.frontierPoints.map(p => ({
    volatility: Number((p.volatility * 100).toFixed(2)),
    expectedReturn: Number((p.expectedReturn * 100).toFixed(2)),
    sharpeRatio: Number(p.sharpeRatio.toFixed(3)),
    raw: p
  }));

  const monteCarloData = calculation.monteCarloPoints.map(p => ({
    volatility: Number((p.volatility * 100).toFixed(2)),
    expectedReturn: Number((p.expectedReturn * 100).toFixed(2)),
    sharpeRatio: Number(p.sharpeRatio.toFixed(3)),
  }));

  // Table 1 Benchmark points from paper
  const benchmarkData = PAPER_TABLE_1_PRESETS.map(p => ({
    name: p.name,
    volatility: Number((p.portfolioVolatility * 100).toFixed(2)),
    expectedReturn: Number((p.expectedReturn * 100).toFixed(2)),
    sharpeRatio: Number(p.sharpeRatio.toFixed(3)),
  }));

  // Capital Allocation Line (from Rf=2% through optimal Sharpe point)
  const rfVal = 2.0; // 2%
  const optX = calculation.optimalSharpePoint.volatility * 100;
  const optY = calculation.optimalSharpePoint.expectedReturn * 100;
  const slope = (optY - rfVal) / Math.max(0.1, optX);
  
  const calLineData = [
    { volatility: 0, expectedReturn: rfVal },
    { volatility: optX, expectedReturn: optY },
    { volatility: 25, expectedReturn: rfVal + slope * 25 }
  ];

  const currentPoint = {
    volatility: Number((currentVolatility * 100).toFixed(2)),
    expectedReturn: Number((currentExpectedReturn * 100).toFixed(2)),
    sharpeRatio: Number(currentSharpeRatio.toFixed(3))
  };

  const minVarPoint = {
    volatility: Number((calculation.minVariancePoint.volatility * 100).toFixed(2)),
    expectedReturn: Number((calculation.minVariancePoint.expectedReturn * 100).toFixed(2)),
    sharpeRatio: Number(calculation.minVariancePoint.sharpeRatio.toFixed(3))
  };

  const optSharpePoint = {
    volatility: Number((calculation.optimalSharpePoint.volatility * 100).toFixed(2)),
    expectedReturn: Number((calculation.optimalSharpePoint.expectedReturn * 100).toFixed(2)),
    sharpeRatio: Number(calculation.optimalSharpePoint.sharpeRatio.toFixed(3))
  };

  return (
    <div id="efficient-frontier-chart-container" className="sleek-glass rounded-2xl p-5 shadow-2xl flex flex-col space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="h-8 w-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white tracking-wider uppercase flex items-center gap-2">
              Markowitz Efficient Frontier Mapping
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold">
                min w^T Σ w
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Downside volatility vs. expected spatial yield hyperbola with Tangency Capital Allocation Line
            </p>
          </div>
        </div>

        {/* Visibility Toggles */}
        <div className="flex items-center gap-3 text-xs">
          <label className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 cursor-pointer select-none">
            <input
              id="toggle-monte-carlo-checkbox"
              type="checkbox"
              checked={showMonteCarlo}
              onChange={(e) => setShowMonteCarlo(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <span className="text-[11px]">Monte Carlo Cloud</span>
          </label>
          <span className="text-slate-700">•</span>
          <label className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 cursor-pointer select-none">
            <input
              id="toggle-benchmarks-checkbox"
              type="checkbox"
              checked={showBenchmarks}
              onChange={(e) => setShowBenchmarks(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
            />
            <span className="text-[11px]">Table 1 Benchmarks</span>
          </label>
          <span className="text-slate-700">•</span>
          <label className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 cursor-pointer select-none">
            <input
              id="toggle-cal-line-checkbox"
              type="checkbox"
              checked={showCalLine}
              onChange={(e) => setShowCalLine(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-emerald-600 focus:ring-0"
            />
            <span className="text-[11px]">CAL Line (Rf=2%)</span>
          </label>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="h-[360px] w-full relative bg-slate-950/40 rounded-xl p-3 border border-slate-800/80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            margin={{ top: 20, right: 30, bottom: 20, left: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
            
            <XAxis 
              dataKey="volatility" 
              type="number" 
              name="Portfolio Volatility (σ)" 
              unit="%" 
              domain={[0, 26]}
              stroke="#64748b"
              fontSize={11}
              label={{ value: 'Downside Portfolio Volatility Risk: σ_p (%)', position: 'insideBottom', offset: -12, fill: '#94a3b8', fontSize: 11 }}
            />
            <YAxis 
              dataKey="expectedReturn" 
              type="number" 
              name="Expected Return (μ)" 
              unit="%" 
              domain={[0, 18]}
              stroke="#64748b"
              fontSize={11}
              label={{ value: 'Expected Architectural Yield: μ_p (%)', angle: -90, position: 'insideLeft', offset: 5, fill: '#94a3b8', fontSize: 11 }}
            />
            
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="sleek-glass-card p-3 rounded-xl shadow-2xl text-xs space-y-1.5 border border-slate-700/80">
                      <p className="font-bold text-white text-[11px]">{data.name || 'Portfolio Allocation'}</p>
                      <p className="text-indigo-400 font-mono">
                        Expected Return (μ): <strong>{data.expectedReturn}%</strong>
                      </p>
                      <p className="text-amber-400 font-mono">
                        Volatility Risk (σ): <strong>{data.volatility}%</strong>
                      </p>
                      {data.sharpeRatio !== undefined && (
                        <p className="text-emerald-400 font-mono">
                          Sharpe Ratio: <strong>{data.sharpeRatio}</strong>
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Monte Carlo Simulated Generative Feasible Cloud */}
            {showMonteCarlo && (
              <Scatter
                name="Monte Carlo Spatial Variations"
                data={monteCarloData}
                fill="#6366f1"
                fillOpacity={0.16}
              />
            )}

            {/* Capital Allocation Line */}
            {showCalLine && (
              <Line
                name="Capital Allocation Line (CAL)"
                data={calLineData}
                type="monotone"
                dataKey="expectedReturn"
                stroke="#10b981"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
              />
            )}

            {/* Continuous Markowitz Efficient Frontier Hyperbola */}
            <Line
              name="Markowitz Efficient Frontier"
              data={frontierData}
              type="monotone"
              dataKey="expectedReturn"
              stroke="#6366f1"
              strokeWidth={3}
              dot={false}
              isAnimationActive={true}
            />

            {/* Table 1 Benchmark Reference Scatter */}
            {showBenchmarks && (
              <Scatter
                name="Research Paper Benchmarks"
                data={benchmarkData}
                fill="#f59e0b"
                shape="diamond"
              />
            )}

            {/* Global Minimum Variance Portfolio Point */}
            <ReferenceDot
              x={minVarPoint.volatility}
              y={minVarPoint.expectedReturn}
              r={6}
              fill="#8b5cf6"
              stroke="#fff"
              strokeWidth={2}
              label={{ value: 'Min Var', position: 'bottom', fill: '#a78bfa', fontSize: 10 }}
            />

            {/* Optimal Sharpe (Tangency) Point */}
            <ReferenceDot
              x={optSharpePoint.volatility}
              y={optSharpePoint.expectedReturn}
              r={7}
              fill="#10b981"
              stroke="#fff"
              strokeWidth={2}
              label={{ value: `Max Sharpe (${optSharpePoint.sharpeRatio})`, position: 'top', fill: '#34d399', fontSize: 11, fontWeight: 'bold' }}
            />

            {/* Current BIM Layout Point */}
            <ReferenceDot
              x={currentPoint.volatility}
              y={currentPoint.expectedReturn}
              r={8}
              fill="#ec4899"
              stroke="#fff"
              strokeWidth={2}
              label={{ value: 'Current Design', position: 'right', fill: '#f472b6', fontSize: 11, fontWeight: 'bold' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Target Risk Bound & Dynamic Weight Solver Slider */}
      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Target Risk Bound (σ_max) Solver:
            </span>
            <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded-lg border border-indigo-800/60">
              {(targetRisk * 100).toFixed(2)}% Volatility
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400 text-[11px]">
              Min Vol Bound: <strong className="text-purple-400 font-mono">{(calculation.minVolBound * 100).toFixed(2)}%</strong>
            </span>
            <span className="text-slate-700">•</span>
            <span className="text-slate-400 text-[11px]">
              Frontier Target Return: <strong className="text-emerald-400 font-mono">{(calculation.targetReturn * 100).toFixed(2)}%</strong>
            </span>
          </div>
        </div>

        {/* Risk Bound Range Slider */}
        <div className="flex items-center gap-4">
          <span className="text-[11px] font-mono text-slate-500">{(calculation.minVolBound * 100).toFixed(1)}%</span>
          <input
            id="target-risk-slider"
            type="range"
            min={Math.max(0.05, calculation.minVolBound)}
            max={0.24}
            step={0.002}
            value={targetRisk}
            onChange={(e) => onTargetRiskChange(Number(e.target.value))}
            className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <span className="text-[11px] font-mono text-slate-500">24.0%</span>
        </div>

        {/* Real-time Derived Weights (Listing 1: w = g + h * targetReturn) */}
        <div className="pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs">
            <span className="text-slate-400 text-[11px] font-medium">Derived Weights w:</span>
            {assets.map((asset, i) => (
              <span key={asset.id} className="inline-flex items-center gap-1.5 font-mono text-[11px] px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: asset.color }}></span>
                <strong className="text-slate-200">{asset.code}:</strong>
                <span className="text-indigo-300 font-bold">{((calculation.targetWeights[i] || 0) * 100).toFixed(1)}%</span>
              </span>
            ))}
          </div>

          {onApplyOptimalPoint && (
            <button
              id="apply-tangency-allocation-btn"
              onClick={() => onApplyOptimalPoint(calculation.optimalSharpePoint)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-600/25 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Apply Tangency Allocation (SR: {calculation.optimalSharpePoint.sharpeRatio.toFixed(3)})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
