import React, { useState } from 'react';
import { 
  Building2, 
  RotateCw, 
  Eye, 
  Sliders, 
  Sparkles, 
  Info,
  Download,
  Boxes
} from 'lucide-react';

export const BimMasterplanViewer = ({
  assets,
  onUpdateAssetFootprint,
  onCommitAssetFootprint,
  totalFootprintM2,
  totalSiteArea = 17000,
  onUpdateTotalSiteArea,
  expectedReturn,
  portfolioVolatility,
  sharpeRatio,
  onApplyOptimalWeights,
  onExportCsv,
  onOpenRevitPlugin
}) => {
  const [viewMode, setViewMode] = useState('3d');
  const [heatmapMode, setHeatmapMode] = useState('zoning');
  const [selectedAssetId, setSelectedAssetId] = useState('res');
  const [gridSeed, setGridSeed] = useState(42);

  // Generate synthetic parcels based on asset footprint allocations and grid seed
  const generateParcels = () => {
    const blocks = [];
    let blockIdCounter = 1;

    assets.forEach((asset, assetIdx) => {
      if (asset.footprintM2 <= 0) return; // 0 m² zone renders no 3D geometry
      // Calculate number of building blocks proportional to footprint
      const count = Math.max(1, Math.round((asset.footprintM2 / Math.max(1, totalFootprintM2)) * 12));
      const baseArea = asset.footprintM2 / count;

      for (let i = 0; i < count; i++) {
        // Deterministic pseudo-random placement based on seed
        const pseudoRand1 = ((assetIdx * 17 + i * 31 + gridSeed * 7) % 100) / 100;
        const pseudoRand2 = ((assetIdx * 29 + i * 13 + gridSeed * 11) % 100) / 100;

        let gridX = Math.floor(pseudoRand1 * 6);
        let gridY = Math.floor(pseudoRand2 * 5);

        // Adjust coordinates by zone bias for realistic urban clustering
        if (asset.code === 'COMM') {
          gridX = 2 + (i % 3);
          gridY = 1 + Math.floor(i / 3);
        } else if (asset.code === 'RES') {
          gridX = (i % 2 === 0 ? 0 : 5) + (i % 2);
          gridY = (i % 4);
        } else if (asset.code === 'IND') {
          gridX = 1 + (i % 4);
          gridY = 4;
        }

        blocks.push({
          id: `block-${asset.code}-${blockIdCounter++}`,
          assetId: asset.id,
          name: `${asset.name} Block ${i + 1}`,
          type: asset.type,
          x: gridX,
          y: gridY,
          width: 1,
          height: 1,
          floors: asset.floors + (i % 3) - 1 > 0 ? asset.floors + (i % 3) - 1 : 1,
          areaM2: baseArea,
          color: asset.color
        });
      }
    });

    return blocks;
  };

  const parcels = generateParcels();
  const selectedAsset = assets.find(a => a.id === selectedAssetId) || assets[0];

  const getHeatmapColor = (block, asset) => {
    if (heatmapMode === 'zoning') {
      return asset.color;
    }
    if (heatmapMode === 'risk') {
      const vol = asset.historicalVolatility;
      if (vol > 0.18) return '#ec4899'; // High Risk (Commercial)
      if (vol > 0.10) return '#f59e0b'; // Medium Risk (Industrial)
      return '#6366f1'; // Low Risk (Residential)
    }
    if (heatmapMode === 'yield') {
      const y = asset.expectedYield;
      if (y > 0.12) return '#10b981';
      if (y > 0.08) return '#06b6d4';
      return '#6366f1';
    }
    if (heatmapMode === 'density') {
      if (block.floors >= 8) return '#8b5cf6';
      if (block.floors >= 5) return '#6366f1';
      return '#94a3b8';
    }
    return asset.color;
  };

  return (
    <div id="bim-masterplan-viewer-container" className="sleek-glass rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full">
      {/* Top Header & Visualizer Controls */}
      <div className="p-4 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="h-8 w-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white tracking-wider uppercase flex items-center gap-2">
              Revit BIM Generative Sandbox
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                Live Data Link
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Parametric spatial footprint extraction with real-time portfolio analytics
            </p>
          </div>
        </div>

        {/* View and Heatmap Controls */}
        <div className="flex items-center gap-2">
          {/* 2D / 3D Mode */}
          <div className="bg-slate-950/80 p-0.5 rounded-xl border border-slate-800 flex text-xs">
            <button
              id="view-mode-3d-btn"
              onClick={() => setViewMode('3d')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === '3d' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              3D Isometric
            </button>
            <button
              id="view-mode-2d-btn"
              onClick={() => setViewMode('2d')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                viewMode === '2d' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              2D Plan Grid
            </button>
          </div>

          {/* Heatmap Select */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
            <Eye className="h-3.5 w-3.5 text-indigo-400" />
            <select
              id="heatmap-mode-select"
              value={heatmapMode}
              onChange={(e) => setHeatmapMode(e.target.value)}
              className="bg-transparent text-slate-200 text-xs border-none focus:outline-none cursor-pointer font-medium"
            >
              <option value="zoning" className="bg-slate-900">Overlay: Zoning Type</option>
              <option value="risk" className="bg-slate-900">Overlay: Downside Risk (σ)</option>
              <option value="yield" className="bg-slate-900">Overlay: Rental Yield (μ)</option>
              <option value="density" className="bg-slate-900">Overlay: FAR Density</option>
            </select>
          </div>

          {/* Dynamic Parcel Boundary / Total Site Area Control */}
          <div id="site-area-toolbar-control" className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300 shadow-sm">
            <Building2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
            <label htmlFor="total-site-area-input" className="text-[11px] text-slate-400 font-semibold whitespace-nowrap">
              Site Area:
            </label>
            <input
              id="total-site-area-input"
              type="number"
              min={1000}
              max={500000}
              step={500}
              value={totalSiteArea}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (onUpdateTotalSiteArea && val >= 0) {
                  onUpdateTotalSiteArea(val);
                }
              }}
              className="w-20 bg-slate-950/90 px-1.5 py-0.5 rounded-lg border border-slate-700 text-indigo-300 font-mono text-xs font-bold text-right focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <span className="text-[10px] font-mono text-slate-500 font-semibold">m²</span>
          </div>

          {/* Regenerate Parametric Layout & Export CSV */}
          <button
            id="regenerate-seed-btn"
            onClick={() => setGridSeed(prev => prev + 1)}
            title="Generate new parametric variation honoring footprint constraints"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
          >
            <RotateCw className="h-3.5 w-3.5 text-indigo-400" />
          </button>

          {onOpenRevitPlugin && (
            <button
              id="open-revit-plugin-sandbox-btn"
              onClick={onOpenRevitPlugin}
              title="Push 3D Layout to Autodesk Revit 2027 via JavaScript/C# Plugin & Live Bridge"
              className="p-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold px-2.5 shadow-sm"
            >
              <Boxes className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Revit 2027</span>
            </button>
          )}

          {onExportCsv && (
            <button
              id="export-csv-sandbox-btn"
              onClick={onExportCsv}
              title="Download Masterplan Weights & Covariance Data as CSV"
              className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold px-2.5"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Sandbox Grid & Interactive Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-[440px]">
        {/* Spatial Canvas (Left 8 Cols) */}
        <div className="lg:col-span-8 bg-slate-950/40 p-5 flex flex-col justify-between relative overflow-hidden">
          {/* Canvas Background Grid Lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:28px_28px] opacity-25 pointer-events-none"></div>

          {/* Masterplan Top Info Overlay */}
          <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 mb-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-indigo-400 font-semibold text-[11px]">
                PARCEL GRID: 120m × 100m
              </span>
              <span>•</span>
              <span className="text-[11px]">Total Footprint: <strong className="text-white">{totalFootprintM2.toLocaleString()} m²</strong></span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-emerald-400 font-mono">μ_p: {(expectedReturn * 100).toFixed(2)}%</span>
              <span className="text-amber-400 font-mono">σ_p: {(portfolioVolatility * 100).toFixed(2)}%</span>
              <span className="text-indigo-300 font-mono font-bold">Sharpe: {sharpeRatio.toFixed(3)}</span>
            </div>
          </div>

          {/* 3D Isometric / 2D Masterplan Stage */}
          <div className="flex-1 flex items-center justify-center relative my-2">
            <div 
              className={`w-full max-w-[540px] aspect-[6/5] bg-slate-900/70 rounded-2xl border border-slate-800/80 p-4 grid grid-cols-6 grid-rows-5 gap-2 shadow-2xl relative transition-all duration-500 backdrop-blur-sm ${
                viewMode === '3d' ? 'transform -rotate-x-12 rotate-z-6 scale-95 perspective-1000' : ''
              }`}
              style={{
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Road Network Overlays */}
              <div className="absolute top-[58%] left-0 right-0 h-1 bg-slate-800/80 pointer-events-none"></div>
              <div className="absolute top-0 bottom-0 left-[32%] w-1 bg-slate-800/80 pointer-events-none"></div>
              <div className="absolute top-0 bottom-0 left-[68%] w-1 bg-slate-800/80 pointer-events-none"></div>

              {/* Render Building Blocks */}
              {parcels.map((block) => {
                const asset = assets.find(a => a.id === block.assetId) || assets[0];
                const blockColor = getHeatmapColor(block, asset);
                const isSelected = selectedAssetId === asset.id;
                const heightPx = Math.min(100, Math.max(16, block.floors * 9));

                return (
                  <div
                    key={block.id}
                    id={block.id}
                    onClick={() => setSelectedAssetId(asset.id)}
                    className="relative group cursor-pointer"
                    style={{
                      gridColumnStart: block.x + 1,
                      gridRowStart: block.y + 1,
                    }}
                  >
                    {viewMode === '3d' ? (
                      /* 3D Isometric Extruded Building */
                      <div 
                        className={`w-full rounded-lg transition-all duration-300 transform group-hover:scale-105 ${
                          isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 z-20' : 'z-10'
                        }`}
                        style={{
                          height: `${heightPx}px`,
                          backgroundColor: blockColor,
                          boxShadow: `0 ${heightPx / 2}px ${heightPx}px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.3)`,
                          borderTop: '2px solid rgba(255,255,255,0.4)',
                          borderLeft: '1px solid rgba(255,255,255,0.2)',
                          borderRight: '1px solid rgba(0,0,0,0.3)',
                        }}
                      >
                        {/* Windows / Floor Lines Pattern */}
                        <div className="w-full h-full opacity-30 flex flex-col justify-around p-0.5 pointer-events-none">
                          {Array.from({ length: Math.min(6, block.floors) }).map((_, f) => (
                            <div key={f} className="h-0.5 bg-white/60 rounded-full w-full"></div>
                          ))}
                        </div>

                        {/* Building Floor Badge on Hover */}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[10px] font-mono px-2 py-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl border border-slate-700">
                          {block.floors}F | {Math.round(block.areaM2)}m²
                        </div>
                      </div>
                    ) : (
                      /* 2D Plan View Box */
                      <div
                        className={`w-full h-full rounded-lg flex flex-col items-center justify-center p-1 text-[10px] font-mono font-bold transition-all group-hover:scale-105 ${
                          isSelected ? 'ring-2 ring-white z-20' : ''
                        }`}
                        style={{
                          backgroundColor: blockColor,
                          color: '#fff',
                        }}
                      >
                        <span>{asset.code}</span>
                        <span className="text-[8px] font-normal opacity-90">{block.floors}F</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Zoning Legend */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80 text-xs">
            <div className="flex items-center gap-3">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  id={`legend-asset-btn-${asset.id}`}
                  onClick={() => setSelectedAssetId(asset.id)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer ${
                    selectedAssetId === asset.id ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: asset.color }}
                  ></span>
                  <span className="font-semibold text-xs">{asset.name}</span>
                  <span className="font-mono text-slate-500 text-[11px]">
                    ({((asset.footprintM2 / totalFootprintM2) * 100).toFixed(0)}%)
                  </span>
                </button>
              ))}
            </div>

            {onApplyOptimalWeights && (
              <button
                id="apply-optimal-weights-sandbox-btn"
                onClick={onApplyOptimalWeights}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Align to MPT Max Sharpe
              </button>
            )}
          </div>
        </div>

        {/* Parcel Inspector & Footprint Sliders (Right 4 Cols) */}
        <div className="lg:col-span-4 bg-slate-900/60 p-5 border-t lg:border-t-0 lg:border-l border-slate-800/80 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="h-3.5 w-3.5 text-indigo-400" />
                Parametric Footprints
              </h3>
              {(() => {
                const activeZoneCount = assets.filter(a => a.footprintM2 > 0).length;
                return (
                  <span id="active-zone-count-badge" className="text-[11px] font-mono text-slate-400">
                    {activeZoneCount} Active {activeZoneCount === 1 ? 'Zone' : 'Zones'}
                  </span>
                );
              })()}
            </div>

            {/* Asset Sliders */}
            <div className="space-y-3.5 mt-4">
              {assets.map((asset) => {
                const proportion = totalFootprintM2 > 0 ? (asset.footprintM2 / totalFootprintM2) * 100 : 0;
                const isSelected = selectedAssetId === asset.id;
                const otherActiveCount = assets.filter(a => a.id !== asset.id && a.footprintM2 > 0).length;
                const isZeroPrevented = asset.footprintM2 > 0 && otherActiveCount < 2;
                const isInactive = asset.footprintM2 === 0;

                return (
                  <div
                    key={asset.id}
                    id={`asset-slider-card-${asset.id}`}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-slate-800/90 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                        : isInactive
                        ? 'bg-slate-950/20 border-slate-800/50 opacity-60'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: asset.color }}
                        ></span>
                        <span className="text-xs font-bold text-white">
                          {asset.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {asset.code}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-mono font-bold ${isInactive ? 'text-slate-500' : 'text-indigo-300'}`}>
                          {asset.footprintM2.toLocaleString()} m²
                        </span>
                        <span className="text-[10px] text-slate-500 ml-1">
                          ({proportion.toFixed(1)}%)
                        </span>
                      </div>
                    </div>

                    {/* Interactive Slider */}
                    <input
                      id={`footprint-slider-${asset.id}`}
                      type="range"
                      min={0}
                      max={totalSiteArea || 17000}
                      step={Math.max(10, Math.round((totalSiteArea || 17000) / 170))}
                      value={asset.footprintM2}
                      onChange={(e) => onUpdateAssetFootprint(asset.id, Number(e.target.value), false)}
                      onPointerUp={(e) => {
                        if (onCommitAssetFootprint) {
                          onCommitAssetFootprint(asset.id, Number(e.target.value));
                        }
                      }}
                      onKeyUp={(e) => {
                        if (onCommitAssetFootprint) {
                          onCommitAssetFootprint(asset.id, Number(e.target.value));
                        }
                      }}
                      className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                        isInactive
                          ? 'bg-slate-800 accent-slate-600'
                          : 'bg-slate-800 accent-indigo-500'
                      }`}
                    />

                    {/* Floor Feedback Indicator */}
                    {isZeroPrevented && (
                      <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                        <span>Minimum 2 active zones required for MPT covariance modeling</span>
                      </div>
                    )}

                    {/* Financial Specs */}
                    <div className="grid grid-cols-3 gap-1 mt-2.5 text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                      <div>
                        <span className="text-slate-500 block">Yield μ:</span>
                        <span className="text-emerald-400 font-semibold">{(asset.expectedYield * 100).toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Risk σ:</span>
                        <span className="text-amber-400 font-semibold">{(asset.historicalVolatility * 100).toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Cost/m²:</span>
                        <span className="text-slate-300">${asset.costPerM2}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Zone Deep Dive Card */}
          {selectedAsset && (
            <div id="selected-asset-diagnostic-card" className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-indigo-400" />
                  Asset Diagnostic
                </span>
                <span className="text-slate-500 font-mono text-[10px]">
                  ID: {selectedAsset.code}_REVT_01
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                <strong>{selectedAsset.name}</strong> exhibits a historical annual volatility index of <strong>{(selectedAsset.historicalVolatility * 100).toFixed(1)}%</strong> with an expected rental absorption yield of <strong>{(selectedAsset.expectedYield * 100).toFixed(1)}%</strong>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
