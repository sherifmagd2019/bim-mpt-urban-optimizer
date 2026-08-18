import React, { useState, useRef, useEffect } from 'react';
import { 
  Sliders, 
  Activity, 
  HelpCircle, 
  Lock, 
  MoveVertical, 
  Sparkles, 
  RotateCcw, 
  RotateCw,
  Undo2,
  Redo2,
  History,
  ShieldAlert, 
  TrendingUp,
  Layers,
  ArrowUpDown,
  Zap,
  Info,
  Download,
  Clock,
  ChevronDown,
  Check
} from 'lucide-react';

export const CorrelationHeatmap = ({
  assets,
  correlationMatrix,
  onUpdateCorrelation,
  onCommitCorrelation,
  onUpdateAllCorrelation,
  covarianceRegime,
  onSetRegime,
  onExportCsv,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  history = [],
  currentHistoryIndex = 0,
  onJumpToHistoryStep
}) => {
  const [activeCell, setActiveCell] = useState({ i: 0, j: 1 });
  const [viewMode, setViewMode] = useState('correlation');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const historyDropdownRef = useRef(null);

  // Close history dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (historyDropdownRef.current && !historyDropdownRef.current.contains(e.target)) {
        setIsHistoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Drag handling with pointer events for ultra-smooth interaction
  const handlePointerDown = (e, i, j) => {
    if (i === j) return; // Diagonal is locked at 1.0
    e.preventDefault();
    e.target.setPointerCapture(e.pointerId);

    const currentVal = correlationMatrix[i]?.[j] ?? 0.15;
    setIsDragging(true);
    setDragStart({
      y: e.clientY,
      initialVal: currentVal,
      i,
      j,
      hasMoved: false
    });
    setActiveCell({ i, j });
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !dragStart) return;
    
    // Vertical drag: Dragging UP increases correlation, dragging DOWN decreases correlation
    const deltaY = dragStart.y - e.clientY;
    if (Math.abs(deltaY) > 2) {
      dragStart.hasMoved = true;
    }
    const sensitivity = 0.005; // 200px drag = 1.0 change
    let newVal = dragStart.initialVal + deltaY * sensitivity;

    // Clamp between -0.80 and 0.98
    newVal = Math.max(-0.80, Math.min(0.98, newVal));
    // Round to 2 decimals
    newVal = Math.round(newVal * 100) / 100;

    onUpdateCorrelation(dragStart.i, dragStart.j, newVal, false);
  };

  const handlePointerUp = (e) => {
    if (isDragging && dragStart) {
      try {
        e.target.releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
      
      const finalVal = correlationMatrix[dragStart.i]?.[dragStart.j] ?? 0.15;
      if (dragStart.hasMoved && onCommitCorrelation) {
        onCommitCorrelation(dragStart.i, dragStart.j, finalVal);
      }
      setIsDragging(false);
      setDragStart(null);
    }
  };

  // Preset macro shock buttons
  const applyAllOffDiagonal = (targetVal, label) => {
    if (onUpdateAllCorrelation) {
      onUpdateAllCorrelation(targetVal, label);
    } else {
      const n = assets.length;
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          onUpdateCorrelation(i, j, targetVal, true);
        }
      }
    }
  };

  // Color mapping based on correlation value
  const getCorrelationColor = (val, isDiag) => {
    if (isDiag) {
      return {
        bg: 'rgba(99, 102, 241, 0.25)',
        border: 'rgba(99, 102, 241, 0.5)',
        text: '#c7d2fe'
      };
    }

    if (val < -0.2) {
      // Strong negative hedge (Cyan / Sky)
      const intensity = Math.min(1, Math.abs(val));
      return {
        bg: `rgba(6, 182, 212, ${0.15 + intensity * 0.45})`,
        border: `rgba(6, 182, 212, ${0.3 + intensity * 0.5})`,
        text: '#67e8f9'
      };
    } else if (val <= 0.25) {
      // Low correlation / Ideal diversification (Emerald / Green)
      return {
        bg: `rgba(16, 185, 129, ${0.15 + (0.25 - val) * 0.6})`,
        border: 'rgba(16, 185, 129, 0.45)',
        text: '#6ee7b7'
      };
    } else if (val <= 0.6) {
      // Moderate correlation (Amber / Indigo blend)
      return {
        bg: `rgba(245, 158, 11, ${0.15 + (val - 0.25) * 0.5})`,
        border: 'rgba(245, 158, 11, 0.45)',
        text: '#fcd34d'
      };
    } else {
      // High correlation / Systemic risk shock (Rose / Crimson)
      const intensity = (val - 0.6) / 0.4;
      return {
        bg: `rgba(244, 63, 94, ${0.25 + intensity * 0.55})`,
        border: `rgba(244, 63, 94, ${0.4 + intensity * 0.5})`,
        text: '#fda4af'
      };
    }
  };

  // Inspect current or hovered pair
  const inspectedPair = hoveredCell || activeCell || { i: 0, j: 1 };
  const assetA = assets[inspectedPair.i] || assets[0];
  const assetB = assets[inspectedPair.j] || assets[1];
  const isDiagInspected = inspectedPair.i === inspectedPair.j;
  const currentCorr = isDiagInspected ? 1.0 : (correlationMatrix[inspectedPair.i]?.[inspectedPair.j] ?? 0.15);
  const currentCovariance = isDiagInspected
    ? Math.pow(assetA.historicalVolatility, 2)
    : currentCorr * assetA.historicalVolatility * assetB.historicalVolatility;

  return (
    <div className="sleek-glass rounded-2xl p-5 shadow-2xl space-y-4">
      {/* Header with Mode Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Sliders className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Interactive Correlation & Covariance Matrix (ρ_ij)
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold lowercase">
                click & drag cells
              </span>
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Drag any non-diagonal cell up/down to dynamically modulate pairwise correlation and update Σ in real-time
          </p>
        </div>

        {/* View Mode Pills, Undo/Redo Controls & History Stack */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Undo / Redo Group */}
          <div className="flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-slate-800 text-xs">
            <button
              id="heatmap-btn-undo"
              onClick={onUndo}
              disabled={!canUndo}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                canUndo
                  ? 'text-slate-200 hover:text-white hover:bg-slate-800 active:scale-95'
                  : 'text-slate-600 cursor-not-allowed opacity-50'
              }`}
              title={canUndo ? "Undo last adjustment (Ctrl+Z)" : "No previous adjustments"}
            >
              <Undo2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Undo</span>
            </button>
            <button
              id="heatmap-btn-redo"
              onClick={onRedo}
              disabled={!canRedo}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                canRedo
                  ? 'text-slate-200 hover:text-white hover:bg-slate-800 active:scale-95'
                  : 'text-slate-600 cursor-not-allowed opacity-50'
              }`}
              title={canRedo ? "Redo adjustment (Ctrl+Y / Cmd+Shift+Z)" : "No redo steps available"}
            >
              <Redo2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Redo</span>
            </button>
          </div>

          {/* History Stack Dropdown */}
          <div className="relative" ref={historyDropdownRef}>
            <button
              id="heatmap-btn-history-stack"
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                isHistoryOpen
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-600/30'
                  : 'bg-slate-900/90 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700'
              }`}
              title="View masterplan adjustment history timeline"
            >
              <History className="h-3.5 w-3.5 text-indigo-400" />
              <span className="font-mono text-[11px]">
                Step {currentHistoryIndex + 1}/{Math.max(1, history.length)}
              </span>
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isHistoryOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* History Timeline Popover */}
            {isHistoryOpen && (
              <div 
                id="heatmap-history-popover" 
                className="absolute right-0 top-full mt-2 w-80 bg-slate-950/95 border border-slate-800 rounded-2xl shadow-2xl z-50 p-3 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
                    <Clock className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Adjustment History</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {history.length} snapshots
                  </span>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar text-xs">
                  {history.map((entry, idx) => {
                    const isCurrent = idx === currentHistoryIndex;
                    const isFuture = idx > currentHistoryIndex;
                    return (
                      <button
                        key={entry.id || idx}
                        onClick={() => {
                          if (onJumpToHistoryStep) {
                            onJumpToHistoryStep(idx);
                          }
                          setIsHistoryOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer border ${
                          isCurrent
                            ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-sm'
                            : isFuture
                            ? 'bg-slate-900/30 border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/60'
                            : 'bg-slate-900/70 border-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-900'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isCurrent ? (
                            <span className="h-3.5 w-3.5 rounded-full bg-indigo-500 flex items-center justify-center text-[9px] font-bold text-white shadow-sm">
                              ✓
                            </span>
                          ) : (
                            <span className={`h-3 w-3 rounded-full border ${isFuture ? 'border-slate-700 bg-slate-900' : 'border-slate-600 bg-slate-800'}`}></span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`font-semibold truncate text-[11px] ${isCurrent ? 'text-indigo-300' : 'text-slate-200'}`}>
                              {entry.description || 'Adjustment'}
                            </span>
                            <span className="text-[9px] font-mono text-slate-500 shrink-0">
                              {entry.timestamp}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                            <span>Step {idx + 1}</span>
                            <span>•</span>
                            <span className="capitalize">{entry.actionType || 'edit'}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Popover Footer */}
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>Ctrl+Z (Undo) / Ctrl+Y (Redo)</span>
                  <button
                    onClick={() => {
                      if (onJumpToHistoryStep) onJumpToHistoryStep(0);
                      setIsHistoryOpen(false);
                    }}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                  >
                    Revert to Baseline
                  </button>
                </div>
              </div>
            )}
          </div>

          {onExportCsv && (
            <button
              onClick={onExportCsv}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Download full CSV matrix dataset"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              Export CSV
            </button>
          )}

          <div className="flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('correlation')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === 'correlation'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Correlation (ρ)
            </button>
            <button
              onClick={() => setViewMode('covariance')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === 'covariance'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Covariance (Σ)
            </button>
            <button
              onClick={() => setViewMode('diversification')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === 'diversification'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Diversification (1-ρ)
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid + Pair Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: The Interactive Heatmap Canvas (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
          {/* Quick Regime Presets Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              Quick Regimes:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => {
                  onSetRegime('low');
                  applyAllOffDiagonal(0.12);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                  covarianceRegime === 'low'
                    ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
                title="Table 1 Low-Corr Regime (Optimal Markowitz Sharpe 0.934)"
              >
                Low Corr (0.12)
              </button>
              <button
                onClick={() => {
                  onSetRegime('high');
                  applyAllOffDiagonal(0.75);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                  covarianceRegime === 'high'
                    ? 'bg-rose-600/20 text-rose-300 border-rose-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
                title="Table 1 High-Corr Stress Test (Sharpe 0.715)"
              >
                Macro Shock (0.75)
              </button>
              <button
                onClick={() => applyAllOffDiagonal(0.0)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200 transition-all cursor-pointer"
                title="Zero correlation (Orthogonal assets)"
              >
                Zero (0.00)
              </button>
              <button
                onClick={() => applyAllOffDiagonal(-0.25)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200 transition-all cursor-pointer"
                title="Synthetic Hedge (Negative correlation)"
              >
                Hedge (-0.25)
              </button>
            </div>
          </div>

          {/* Interactive Heatmap Matrix Grid */}
          <div className="bg-slate-950/70 rounded-2xl border border-slate-800/80 p-4 shadow-inner relative overflow-hidden select-none">
            {/* Table layout with asset headers */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-[10px] text-slate-500 font-mono font-semibold uppercase tracking-wider w-24">
                      Asset Pair
                    </th>
                    {assets.map((asset) => (
                      <th key={asset.id} className="p-2 text-center">
                        <div className="flex flex-col items-center">
                          <span
                            className="w-2.5 h-2.5 rounded-full mb-1"
                            style={{ backgroundColor: asset.color }}
                          ></span>
                          <span className="text-xs font-bold text-white font-mono">{asset.code}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            σ:{(asset.historicalVolatility * 100).toFixed(0)}%
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assets.map((rowAsset, i) => (
                    <tr key={rowAsset.id}>
                      {/* Row Label */}
                      <td className="p-2 font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: rowAsset.color }}
                          ></span>
                          <div>
                            <span className="font-bold text-white block leading-tight">{rowAsset.code}</span>
                            <span className="text-[10px] text-slate-500 truncate block max-w-[80px]">
                              {rowAsset.name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Matrix Cells */}
                      {assets.map((colAsset, j) => {
                        const isDiag = i === j;
                        const corrVal = isDiag ? 1.0 : (correlationMatrix[i]?.[j] ?? 0.15);
                        const covVal = isDiag 
                          ? Math.pow(rowAsset.historicalVolatility, 2)
                          : corrVal * rowAsset.historicalVolatility * colAsset.historicalVolatility;
                        const colors = getCorrelationColor(corrVal, isDiag);
                        const isCellActive = (activeCell?.i === i && activeCell?.j === j) || (activeCell?.i === j && activeCell?.j === i);
                        const isCellHovered = (hoveredCell?.i === i && hoveredCell?.j === j) || (hoveredCell?.i === j && hoveredCell?.j === i);

                        let displayValue = corrVal.toFixed(2);
                        if (viewMode === 'covariance') {
                          displayValue = (covVal * 10000).toFixed(1) + '‱';
                        } else if (viewMode === 'diversification') {
                          displayValue = isDiag ? '0.00' : (1 - corrVal).toFixed(2);
                        }

                        return (
                          <td key={colAsset.id} className="p-1.5 text-center">
                            <div
                              id={`heatmap-cell-${rowAsset.code}-${colAsset.code}`}
                              onPointerDown={(e) => handlePointerDown(e, i, j)}
                              onPointerMove={handlePointerMove}
                              onPointerUp={handlePointerUp}
                              onMouseEnter={() => setHoveredCell({ i, j })}
                              onMouseLeave={() => setHoveredCell(null)}
                              className={`relative rounded-xl p-3 flex flex-col items-center justify-center transition-all duration-150 border ${
                                isDiag 
                                    ? 'cursor-default opacity-85 shadow-sm'
                                    : 'cursor-ns-resize active:cursor-grabbing hover:scale-105 shadow-md group'
                              } ${
                                isCellActive
                                  ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950 z-20'
                                  : isCellHovered
                                  ? 'ring-1 ring-indigo-400 z-10'
                                  : ''
                              }`}
                              style={{
                                backgroundColor: colors.bg,
                                borderColor: colors.border,
                                touchAction: 'none'
                              }}
                            >
                              {/* Drag Visual Indicator & Lock Icons */}
                              <div className="absolute top-1 right-1.5 pointer-events-none opacity-60 group-hover:opacity-100">
                                {isDiag ? (
                                  <Lock className="h-2.5 w-2.5 text-indigo-300" />
                                ) : (
                                  <MoveVertical className="h-2.5 w-2.5 text-slate-300 group-hover:text-white group-hover:animate-pulse" />
                                )}
                              </div>

                              {/* Value Display */}
                              <span
                                className="font-mono text-sm font-bold tracking-tight pointer-events-none"
                                style={{ color: colors.text }}
                              >
                                {displayValue}
                              </span>

                              {/* Subtitle label */}
                              <span className="text-[9px] font-mono text-slate-400 pointer-events-none mt-0.5">
                                {isDiag ? 'σ² variance' : `ρ(${rowAsset.code},${colAsset.code})`}
                              </span>

                              {/* Vertical scrub indicator bar on hover */}
                              {!isDiag && (
                                <div className="w-full bg-slate-900/60 h-1 rounded-full mt-1 overflow-hidden pointer-events-none">
                                  <div
                                    className="h-full transition-all duration-75"
                                    style={{
                                      width: `${Math.max(0, Math.min(100, ((corrVal + 0.8) / 1.78) * 100))}%`,
                                      backgroundColor: colors.text
                                    }}
                                  ></div>
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Instruction Footer Inside Heatmap */}
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-indigo-300 font-medium">
                  <ArrowUpDown className="h-3 w-3" />
                  Drag Up: +ρ (Higher Shock)
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-cyan-300 font-medium">
                  Drag Down: -ρ (Hedge)
                </span>
              </div>
              <span className="text-slate-500">Symmetric auto-sync active</span>
            </div>
          </div>

          {/* Color Gradient Scale Legend */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              <span className="text-cyan-400 font-semibold">Synthetic Hedge (-0.50)</span>
              <span className="text-emerald-400 font-semibold">Uncorrelated / Low (0.12)</span>
              <span className="text-amber-400 font-semibold">Moderate (0.45)</span>
              <span className="text-rose-400 font-semibold">Macro Shock (+0.95)</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gradient-to-r from-cyan-500 via-emerald-500 via-amber-500 to-rose-500 shadow-inner"></div>
          </div>
        </div>

        {/* Right Side: Active Asset Pair Diagnostic & Real-time Math Calculator (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-indigo-400" />
                Pairwise Covariance Diagnostic
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {assetA.code} ⇄ {assetB.code}
              </span>
            </div>

            {/* Selected Pair Detail Card */}
            <div className="mt-3 p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    <span className="w-4 h-4 rounded-full border border-slate-900" style={{ backgroundColor: assetA.color }}></span>
                    <span className="w-4 h-4 rounded-full border border-slate-900" style={{ backgroundColor: assetB.color }}></span>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">
                      {assetA.name} × {assetB.name}
                    </h5>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {assetA.code} ({assetA.type}) vs. {assetB.code} ({assetB.type})
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-indigo-300">
                    ρ = {currentCorr.toFixed(2)}
                  </span>
                  <span className="text-[10px] block text-slate-500 font-mono">
                    Σ = {(currentCovariance * 10000).toFixed(2)}‱
                  </span>
                </div>
              </div>

              {/* Mathematical Equation Breakdown */}
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 font-mono text-[11px] space-y-1">
                <div className="text-slate-400 text-[10px] uppercase font-bold text-indigo-400">
                  Covariance Cross-Product Formula:
                </div>
                <div className="text-slate-200">
                  Σ_ij = ρ_ij · σ_i · σ_j
                </div>
                <div className="text-indigo-300 text-[10px] pt-1 border-t border-slate-800">
                  = ({currentCorr.toFixed(2)}) × ({(assetA.historicalVolatility * 100).toFixed(1)}%) × ({(assetB.historicalVolatility * 100).toFixed(1)}%)
                </div>
                <div className="text-emerald-400 font-bold text-xs">
                  = {(currentCovariance * 100).toFixed(4)}% Variance Term
                </div>
              </div>

              {/* Qualitative Financial Impact */}
              <div className="text-xs text-slate-300 leading-relaxed space-y-1.5 pt-1">
                <p className="text-[11px]">
                  {currentCorr < 0.2 ? (
                    <span className="text-emerald-400 font-semibold">
                      ★ High Diversification Benefit: Low cross-correlation suppresses portfolio volatility, pulling the Markowitz efficient frontier upward and boosting Sharpe Ratio.
                    </span>
                  ) : currentCorr > 0.6 ? (
                    <span className="text-rose-400 font-semibold">
                      ⚠ Systemic Co-Movement: High correlation aligns downside price drops, degrading diversification and reducing the frontier curvature.
                    </span>
                  ) : (
                    <span className="text-amber-300 font-semibold">
                      Moderate Correlation: Standard architectural market elasticity with balanced risk spreading.
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Direct Slider Scrubber for Precision Adjustment */}
            {!isDiagInspected && (
              <div className="mt-3 p-3 bg-slate-950/50 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium text-[11px]">
                    Precision Scrubber ({assetA.code}, {assetB.code}):
                  </span>
                  <span className="font-mono font-bold text-white text-xs bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60">
                    {currentCorr.toFixed(2)}
                  </span>
                </div>
                <input
                  id="heatmap-precision-slider"
                  type="range"
                  min={-0.80}
                  max={0.98}
                  step={0.01}
                  value={currentCorr}
                  onChange={(e) => onUpdateCorrelation(inspectedPair.i, inspectedPair.j, Number(e.target.value), false)}
                  onPointerUp={(e) => {
                    if (onCommitCorrelation) {
                      onCommitCorrelation(inspectedPair.i, inspectedPair.j, Number(e.target.value));
                    }
                  }}
                  onKeyUp={(e) => {
                    if (onCommitCorrelation) {
                      onCommitCorrelation(inspectedPair.i, inspectedPair.j, Number(e.target.value));
                    }
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>-0.80 (Hedge)</span>
                  <span>0.00 (Orthogonal)</span>
                  <span>+0.98 (Lockstep)</span>
                </div>
              </div>
            )}
          </div>

          {/* Table 1 Reference Note */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
            <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              Real-time matrix inversion calculates analytical vectors $g$ and $h$ inside JavaScript solver on every drag event.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
