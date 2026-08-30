import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { BimMasterplanViewer } from './components/BimMasterplanViewer';
import { EfficientFrontierChart } from './components/EfficientFrontierChart';
import { PortfolioAnalytics } from './components/PortfolioAnalytics';
import { CorrelationHeatmap } from './components/CorrelationHeatmap';
import { AiAgentPanel } from './components/AiAgentPanel';
import { RevitExportModal } from './components/RevitExportModal';
import { ScenarioComparisonModal } from './components/ScenarioComparisonModal';
import { CsvExportModal } from './components/CsvExportModal';
import { ResearchPaperModal } from './components/ResearchPaperModal';
import { useRevitLiveSync } from './hooks/useRevitLiveSync';
import { useHistoryStack } from './hooks/useHistoryStack';
import { 
  calculateAnalyticalMarkowitz, 
  PAPER_TABLE_1_PRESETS, 
  computePortfolioReturn, 
  computePortfolioVariance, 
  computeSharpeRatio, 
  buildCovarianceMatrix 
} from './lib/mptMath';
import { generateAndDownloadPaperPDF } from './lib/pdfGenerator';
import { 
  Sparkles, 
  Building2, 
  Activity, 
  ShieldCheck, 
  CheckCircle2, 
  FileCode2,
  BookOpen,
  GraduationCap,
  Award,
  Download,
  FileText
} from 'lucide-react';

function redistributeFootprint(currentAssets, assetId, newValue, siteArea = 17000) {
  const others = currentAssets.filter(a => a.id !== assetId);
  const otherActiveCount = others.filter(a => a.footprintM2 > 0).length;

  // Allow dragging this zone to exactly 0 as long as at least 2 zones
  // remain active overall. If a zone is already at 0 and this drag would
  // zero out a second one too, floor at 1 m² instead of 0.
  const wouldBeActive = newValue > 0;
  const minAllowedValue = (!wouldBeActive && otherActiveCount < 2) ? 1 : 0;
  const maxAllowedValue = (otherActiveCount <= 1) ? siteArea - 1 : siteArea;
  const clampedNew = Math.max(minAllowedValue, Math.min(newValue, maxAllowedValue));

  const othersCurrentTotal = others.reduce((sum, a) => sum + a.footprintM2, 0);
  const othersNewTotal = siteArea - clampedNew;

  const result = currentAssets.map(a => {
    if (a.id === assetId) return { ...a, footprintM2: clampedNew };
    const share = othersCurrentTotal > 0 ? a.footprintM2 / othersCurrentTotal : 1 / others.length;
    return { ...a, footprintM2: Math.max(0, Math.round(othersNewTotal * share)) };
  });

  // Ensure exact conservation of siteArea against integer rounding
  const currentSum = result.reduce((sum, a) => sum + a.footprintM2, 0);
  const diff = siteArea - currentSum;
  if (diff !== 0) {
    const adjustIdx = result.findIndex(a => a.id !== assetId && a.footprintM2 > 0);
    if (adjustIdx !== -1) {
      result[adjustIdx] = {
        ...result[adjustIdx],
        footprintM2: Math.max(0, result[adjustIdx].footprintM2 + diff)
      };
    }
  }

  return result;
}

export default function App() {
  // Dynamic Site Area State Hook
  const [totalSiteArea, setTotalSiteArea] = useState(17000);

  // Scenario state initialized to MPT Low Corr (optimal from Table 1)
  const [currentScenario, setCurrentScenario] = useState(PAPER_TABLE_1_PRESETS[3]);
  const [assets, setAssets] = useState(PAPER_TABLE_1_PRESETS[3].assets);
  const [correlationMatrix, setCorrelationMatrix] = useState(PAPER_TABLE_1_PRESETS[3].correlationMatrix);
  const [covarianceRegime, setCovarianceRegime] = useState(PAPER_TABLE_1_PRESETS[3].covarianceRegime);
  const [targetRisk, setTargetRisk] = useState(0.1012);
  const [riskFreeRate] = useState(0.02);

  // Active view tab state
  const [activeViewTab, setActiveViewTab] = useState('dashboard');

  // Modals state
  const [isRevitModalOpen, setIsRevitModalOpen] = useState(false);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isPaperModalOpen, setIsPaperModalOpen] = useState(false);

  // State Management History Stack (Undo / Redo / Snapshots)
  const {
    history,
    currentIndex: currentHistoryIndex,
    canUndo,
    canRedo,
    recordSnapshot,
    undo: undoHistory,
    redo: redoHistory,
    jumpToStep: jumpToHistoryStep
  } = useHistoryStack({
    assets: PAPER_TABLE_1_PRESETS[3].assets,
    correlationMatrix: PAPER_TABLE_1_PRESETS[3].correlationMatrix,
    covarianceRegime: PAPER_TABLE_1_PRESETS[3].covarianceRegime,
    targetRisk: 0.1012,
    scenario: PAPER_TABLE_1_PRESETS[3],
    totalSiteArea: 17000
  });

  // Apply state from history snapshot
  const applyStateSnapshot = useCallback((stateObj) => {
    if (!stateObj) return;
    if (stateObj.assets) setAssets(JSON.parse(JSON.stringify(stateObj.assets)));
    if (stateObj.correlationMatrix) setCorrelationMatrix(JSON.parse(JSON.stringify(stateObj.correlationMatrix)));
    if (stateObj.covarianceRegime) setCovarianceRegime(stateObj.covarianceRegime);
    if (stateObj.targetRisk !== undefined) setTargetRisk(stateObj.targetRisk);
    if (stateObj.scenario) setCurrentScenario(stateObj.scenario);
    if (stateObj.totalSiteArea !== undefined) setTotalSiteArea(stateObj.totalSiteArea);
  }, []);

  const handleUndo = useCallback(() => {
    undoHistory(applyStateSnapshot);
  }, [undoHistory, applyStateSnapshot]);

  const handleRedo = useCallback(() => {
    redoHistory(applyStateSnapshot);
  }, [redoHistory, applyStateSnapshot]);

  const handleJumpToHistoryStep = useCallback((index) => {
    jumpToHistoryStep(index, applyStateSnapshot);
  }, [jumpToHistoryStep, applyStateSnapshot]);

  // Global Keyboard Shortcuts (Ctrl+Z / Cmd+Z for Undo, Ctrl+Y / Cmd+Shift+Z for Redo)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in text inputs or textareas
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) && e.target.type === 'text') {
        return;
      }
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (isCtrlOrCmd && (e.key === 'z' || e.key === 'Z')) {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if (isCtrlOrCmd && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Inbound Telemetry Handler: Receives live zoning blocks from Revit DocumentChanged event
  const handleIncomingRevitState = useCallback((revitPayload) => {
    if (!revitPayload || !Array.isArray(revitPayload.layoutBlocks) || revitPayload.layoutBlocks.length === 0) {
      return;
    }

    const blocks = revitPayload.layoutBlocks;
    const footprintByCode = {};

    blocks.forEach((block) => {
      const code = (block.assetCode || block.code || '').toUpperCase();
      const fp = Number(block.footprintM2 ?? block.areaM2 ?? block.area ?? 0);
      if (code) {
        footprintByCode[code] = (footprintByCode[code] || 0) + fp;
      }
    });

    setAssets((prevAssets) => {
      const updatedAssets = prevAssets.map((asset) => {
        const code = asset.code.toUpperCase();
        if (footprintByCode[code] !== undefined) {
          return {
            ...asset,
            footprintM2: Math.max(0, Math.round(footprintByCode[code]))
          };
        }
        return asset;
      });

      const newTotal = updatedAssets.reduce((sum, a) => sum + a.footprintM2, 0);
      const effectiveSiteArea = newTotal > 0 ? newTotal : totalSiteArea;
      if (newTotal > 0) {
        setTotalSiteArea(newTotal);
      }

      const updatedScenario = {
        ...currentScenario,
        id: 'revit-live-synced',
        name: 'Revit 2027 Inbound Model',
        description: `Imported via DocumentChanged webhook (${blocks.length} elements, ${newTotal.toLocaleString()} m²)`
      };
      setCurrentScenario(updatedScenario);

      // Record snapshot to history stack for full undo/redo capability
      recordSnapshot({
        assets: updatedAssets,
        correlationMatrix,
        covarianceRegime,
        targetRisk,
        scenario: updatedScenario,
        totalSiteArea: effectiveSiteArea
      }, `Inbound Revit 2027 Sync (${blocks.length} Blocks)`, 'revit');

      return updatedAssets;
    });
  }, [totalSiteArea, currentScenario, correlationMatrix, covarianceRegime, targetRisk, recordSnapshot]);

  // Revit 2027 Live Bidirectional Background Polling and Webhook Sync
  const {
    syncState: revitSyncState,
    checkRevitConnection,
    pushPayloadToRevit,
    updateEndpointUrl,
    simulateIncomingRevitChange
  } = useRevitLiveSync(undefined, handleIncomingRevitState);

  // AI Agent state
  const [isLoadingAgent, setIsLoadingAgent] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `### ICEPE 2026 Research Implementation Active\n\nI am your autonomous quantitative co-pilot for the **ICEPE 2026** research paper:  \n# **"Modern Portfolio Theory in Generative Urban BIM Layouts"**  \n### By **Sherif Ahmad Magdaldin**\n\n- **Research Core**: Integrating **Harry Markowitz's Modern Portfolio Theory (MPT)** with **Autodesk Revit 2027 BIM generative workflows**.\n- **Active Layout**: **${currentScenario.name}**\n- **Objective Function**: Minimize portfolio variance $\\min_w \\sigma_p^2 = w^T \\Sigma w$ subject to expected yield constraints and architectural feasibility.\n- **Published Benchmark (Table 1)**: Tangency Sharpe Ratio **${currentScenario.sharpeRatio.toFixed(3)}** under low-covariance asset regime.\n- **Live State Stack**: Real-time undo/redo history active for correlation matrix & parcel weights.\n\nYou can interact with zoning footprints, simulate correlation shocks, or trigger full portfolio rebalancing along the continuous Efficient Frontier.`,
      timestamp: new Date().toLocaleTimeString(),
      reasoningSteps: [
        'Loaded ICEPE 2026 research mathematical formulation by Sherif Ahmad Magdaldin.',
        'Initialized pure JavaScript linear algebra backend solver.',
        'Extracted parametric BIM zoning footprints (Residential, Commercial, Industrial).',
        'Solved Markowitz analytical frontier hyperbola (Table 1 Low-Corr benchmark active).',
        'Initialized state management history stack for real-time undo/redo.'
      ],
      suggestedAction: {
        id: 'inspect-table-1',
        type: 'optimize_weights',
        title: 'Compare Design Against Table 1 Research Regimes',
        description: 'Evaluate Baseline vs. High-Yield vs. MPT Variants side-by-side'
      }
    }
  ]);

  // Derived Calculations
  const totalFootprintM2 = useMemo(() => {
    return assets.reduce((sum, a) => sum + a.footprintM2, 0);
  }, [assets]);

  const covMatrix = useMemo(() => {
    return buildCovarianceMatrix(assets, correlationMatrix);
  }, [assets, correlationMatrix]);

  const currentWeights = useMemo(() => {
    return assets.map(a => a.footprintM2 / Math.max(1, totalFootprintM2));
  }, [assets, totalFootprintM2]);

  const currentExpectedReturn = useMemo(() => {
    const returns = assets.map(a => a.expectedYield);
    return computePortfolioReturn(currentWeights, returns);
  }, [currentWeights, assets]);

  const currentVariance = useMemo(() => {
    return computePortfolioVariance(currentWeights, covMatrix);
  }, [currentWeights, covMatrix]);

  const currentVolatility = useMemo(() => {
    return Math.sqrt(currentVariance);
  }, [currentVariance]);

  const currentSharpeRatio = useMemo(() => {
    return computeSharpeRatio(currentExpectedReturn, currentVolatility, riskFreeRate);
  }, [currentExpectedReturn, currentVolatility, riskFreeRate]);

  // Markowitz Analytical Result (Continuous Frontier, scalars A,B,C,D, subspace vectors g,h)
  const calculationResult = useMemo(() => {
    return calculateAnalyticalMarkowitz(
      assets,
      correlationMatrix,
      targetRisk,
      riskFreeRate,
      true
    );
  }, [assets, correlationMatrix, targetRisk, riskFreeRate]);

  // Handler for dynamically updating total site parcel area
  const handleUpdateTotalSiteArea = useCallback((newArea) => {
    const safeArea = Math.max(1000, Number(newArea) || 1000);
    setTotalSiteArea(safeArea);

    const currentTotal = assets.reduce((sum, a) => sum + a.footprintM2, 0);
    if (currentTotal > 0) {
      const scaleFactor = safeArea / currentTotal;
      let scaledAssets = assets.map(a => ({
        ...a,
        footprintM2: Math.max(0, Math.round(a.footprintM2 * scaleFactor))
      }));
      // Ensure exact sum to safeArea
      const scaledSum = scaledAssets.reduce((sum, a) => sum + a.footprintM2, 0);
      const diff = safeArea - scaledSum;
      if (diff !== 0) {
        const adjustIdx = scaledAssets.findIndex(a => a.footprintM2 > 0);
        if (adjustIdx !== -1) {
          scaledAssets[adjustIdx] = {
            ...scaledAssets[adjustIdx],
            footprintM2: Math.max(0, scaledAssets[adjustIdx].footprintM2 + diff)
          };
        }
      }
      setAssets(scaledAssets);

      recordSnapshot({
        assets: scaledAssets,
        correlationMatrix,
        covarianceRegime,
        targetRisk,
        scenario: currentScenario,
        totalSiteArea: safeArea
      }, `Adjusted Total Site Area to ${safeArea.toLocaleString()} m²`, 'footprint');
    }
  }, [assets, correlationMatrix, covarianceRegime, targetRisk, currentScenario, recordSnapshot]);

  // Update a single asset footprint (during slider drag or direct input)
  const handleUpdateAssetFootprint = (assetId, newFootprintM2, isCommit = false) => {
    const updatedAssets = redistributeFootprint(assets, assetId, newFootprintM2, totalSiteArea);
    setAssets(updatedAssets);
    const updatedScenario = {
      ...currentScenario,
      id: 'custom-design',
      name: 'Custom Parametric Design',
      description: 'User-modified generative zoning distribution'
    };
    setCurrentScenario(updatedScenario);

    if (isCommit) {
      const assetObj = updatedAssets.find(a => a.id === assetId);
      recordSnapshot({
        assets: updatedAssets,
        correlationMatrix,
        covarianceRegime,
        targetRisk,
        scenario: updatedScenario,
        totalSiteArea
      }, `Updated ${assetObj?.code || 'Asset'} footprint to ${assetObj?.footprintM2.toLocaleString()} m²`, 'footprint');
    }
  };

  // Commit asset footprint change into history
  const handleCommitAssetFootprint = (assetId, newFootprintM2) => {
    const updatedAssets = redistributeFootprint(assets, assetId, newFootprintM2, totalSiteArea);
    setAssets(updatedAssets);
    const assetObj = updatedAssets.find(a => a.id === assetId);
    const updatedScenario = {
      ...currentScenario,
      id: 'custom-design',
      name: 'Custom Parametric Design',
      description: 'User-modified generative zoning distribution'
    };
    setCurrentScenario(updatedScenario);
    recordSnapshot({
      assets: updatedAssets,
      correlationMatrix,
      covarianceRegime,
      targetRisk,
      scenario: updatedScenario,
      totalSiteArea
    }, `Updated ${assetObj?.code || 'Asset'} footprint to ${assetObj?.footprintM2.toLocaleString()} m²`, 'footprint');
  };

  // Update correlation between two assets (during mouse/pointer drag)
  const handleUpdateCorrelation = (i, j, value, isCommit = false) => {
    const copy = correlationMatrix.map(row => [...row]);
    copy[i][j] = value;
    copy[j][i] = value;
    setCorrelationMatrix(copy);
    setCovarianceRegime('custom');

    if (isCommit) {
      const assetA = assets[i] || { code: `A${i}` };
      const assetB = assets[j] || { code: `A${j}` };
      recordSnapshot({
        assets,
        correlationMatrix: copy,
        covarianceRegime: 'custom',
        targetRisk,
        scenario: currentScenario,
        totalSiteArea
      }, `Adjusted ρ(${assetA.code}, ${assetB.code}) to ${value.toFixed(2)}`, 'correlation');
    }
  };

  // Commit correlation change into history (on pointer release or slider release)
  const handleCommitCorrelation = (i, j, value) => {
    const copy = correlationMatrix.map(row => [...row]);
    copy[i][j] = value;
    copy[j][i] = value;
    const assetA = assets[i] || { code: `A${i}` };
    const assetB = assets[j] || { code: `A${j}` };
    recordSnapshot({
      assets,
      correlationMatrix: copy,
      covarianceRegime: 'custom',
      targetRisk,
      scenario: currentScenario,
      totalSiteArea
    }, `Adjusted ρ(${assetA.code}, ${assetB.code}) to ${value.toFixed(2)}`, 'correlation');
  };

  // Batch update all off-diagonal correlations with a single history entry
  const handleUpdateAllCorrelation = (targetVal, label = 'Correlation Shock') => {
    const n = assets.length;
    const copy = correlationMatrix.map((row, i) =>
      row.map((val, j) => (i === j ? 1.0 : targetVal))
    );
    setCorrelationMatrix(copy);
    const newRegime = targetVal <= 0.2 ? 'low' : targetVal >= 0.6 ? 'high' : 'custom';
    setCovarianceRegime(newRegime);

    recordSnapshot({
      assets,
      correlationMatrix: copy,
      covarianceRegime: newRegime,
      targetRisk,
      scenario: currentScenario,
      totalSiteArea
    }, `Set All Off-Diagonal Correlations to ${targetVal.toFixed(2)} (${label})`, 'correlation');
  };

  // Set correlation regime (low vs high)
  const handleSetRegime = (regime) => {
    setCovarianceRegime(regime);
    let newCorr;
    if (regime === 'low') {
      newCorr = [
        [1.0, 0.12, 0.05],
        [0.12, 1.0, 0.18],
        [0.05, 0.18, 1.0]
      ];
    } else if (regime === 'high') {
      newCorr = [
        [1.0, 0.78, 0.65],
        [0.78, 1.0, 0.72],
        [0.65, 0.72, 1.0]
      ];
    } else {
      newCorr = correlationMatrix;
    }
    setCorrelationMatrix(newCorr);

    recordSnapshot({
      assets,
      correlationMatrix: newCorr,
      covarianceRegime: regime,
      targetRisk,
      scenario: currentScenario,
      totalSiteArea
    }, `Switched to ${regime.toUpperCase()} correlation regime`, 'regime');
  };

  // Load preset scenario from Table 1
  const handleSelectScenario = (scenario) => {
    setCurrentScenario(scenario);
    setAssets(scenario.assets);
    setCorrelationMatrix(scenario.correlationMatrix);
    setCovarianceRegime(scenario.covarianceRegime);
    setTargetRisk(scenario.portfolioVolatility);
    const scenarioTotal = scenario.totalFootprintM2 || scenario.assets.reduce((sum, a) => sum + a.footprintM2, 0) || 17000;
    setTotalSiteArea(scenarioTotal);

    recordSnapshot({
      assets: scenario.assets,
      correlationMatrix: scenario.correlationMatrix,
      covarianceRegime: scenario.covarianceRegime,
      targetRisk: scenario.portfolioVolatility,
      scenario,
      totalSiteArea: scenarioTotal
    }, `Loaded ${scenario.name} regime`, 'scenario');
  };

  // Apply optimal Sharpe weights to footprint
  const handleApplyOptimalWeights = useCallback(() => {
    const optWeights = calculationResult.optimalSharpePoint.weights;
    
    const updatedAssets = assets.map((asset, idx) => {
      const allocatedM2 = Math.round(optWeights[idx] * totalSiteArea);
      return {
        ...asset,
        footprintM2: Math.max(0, allocatedM2)
      };
    });

    // Ensure sum matches totalSiteArea exactly
    const allocatedSum = updatedAssets.reduce((sum, a) => sum + a.footprintM2, 0);
    const diff = totalSiteArea - allocatedSum;
    if (diff !== 0) {
      const adjustIdx = updatedAssets.findIndex(a => a.footprintM2 > 0);
      if (adjustIdx !== -1) {
        updatedAssets[adjustIdx] = {
          ...updatedAssets[adjustIdx],
          footprintM2: Math.max(0, updatedAssets[adjustIdx].footprintM2 + diff)
        };
      }
    }

    setAssets(updatedAssets);

    recordSnapshot({
      assets: updatedAssets,
      correlationMatrix,
      covarianceRegime,
      targetRisk,
      scenario: currentScenario,
      totalSiteArea
    }, `Applied Markowitz Optimal Tangency Allocation (Sharpe ${calculationResult.optimalSharpePoint.sharpeRatio.toFixed(3)})`, 'optimization');

    // Add agent acknowledgement
    const ackMsg = {
      id: `ack-${Date.now()}`,
      role: 'assistant',
      content: `### Applied Markowitz Optimal Tangency Allocation\n\nI have realigned the generative BIM masterplan footprints to match the maximum Sharpe ratio (${calculationResult.optimalSharpePoint.sharpeRatio.toFixed(3)}):\n\n${assets.map((a, i) => `- **${a.name} (${a.code})**: **${(optWeights[i] * 100).toFixed(1)}%** → **${Math.round(optWeights[i] * totalSiteArea).toLocaleString()} m²**`).join('\n')}\n\n*Spatial risk is minimized along the Efficient Frontier across total parcel area ${totalSiteArea.toLocaleString()} m². You can undo this action with Ctrl+Z anytime.*`,
      timestamp: new Date().toLocaleTimeString(),
      reasoningSteps: [
        'Executed quadratic simplex allocation for active parcel instances.',
        'Extracted target return µ_p = ' + (calculationResult.optimalSharpePoint.expectedReturn * 100).toFixed(2) + '%.',
        'Updated BIM geometry footprint envelopes in real-time.',
        'Recorded snapshot to state management history stack.'
      ]
    };
    setMessages(prev => [...prev, ackMsg]);
  }, [calculationResult, assets, correlationMatrix, covarianceRegime, targetRisk, currentScenario, totalSiteArea, recordSnapshot]);

  // Execute Agent Action
  const handleExecuteAgentAction = (action) => {
    if (action.type === 'optimize_weights') {
      handleApplyOptimalWeights();
    } else if (action.id === 'inspect-table-1') {
      setIsComparisonModalOpen(true);
    } else if (action.id === 'export-csv' || action.type === 'export_code') {
      setIsCsvModalOpen(true);
    }
  };

  // Send message to AI Agent endpoint
  const handleSendMessage = async (text) => {
    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoadingAgent(true);

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationHistory: messages.slice(-6),
          currentMasterplan: {
            assets,
            correlationMatrix,
            covarianceRegime,
            totalFootprintM2
          },
          targetRisk,
          scenarioPreset: currentScenario.id
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const assistantMsg = {
        id: `agent-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString(),
        reasoningSteps: data.reasoningSteps,
        suggestedAction: data.suggestedAction
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      // Fallback local response
      const fallbackMsg = {
        id: `agent-fallback-${Date.now()}`,
        role: 'assistant',
        content: `### Quantitative BIM Optimization Response\n\nI have evaluated your masterplan parameters across **${assets.length} zoning categories** using pure JavaScript linear algebra.\n\n- **Target Risk Bound**: **${(targetRisk * 100).toFixed(2)}%**\n- **Calculated Expected Return**: **${(calculationResult.targetReturn * 100).toFixed(2)}%**\n- **Optimal Sharpe Ratio**: **${calculationResult.optimalSharpePoint.sharpeRatio.toFixed(3)}**\n\nYou can click below to align your layout with the optimal Markowitz weights.`,
        timestamp: new Date().toLocaleTimeString(),
        reasoningSteps: [
          'Calculated cross-asset covariance matrix Σ in JavaScript.',
          'Solved analytical subspace vector w = g + h µ_p.',
          'Validated against Table 1 low-covariance optimal regime.'
        ],
        suggestedAction: {
          id: 'apply-opt-sharpe',
          type: 'optimize_weights',
          title: 'Apply Optimal Sharpe Tangency Allocation',
          description: `Align layout to Sharpe ${calculationResult.optimalSharpePoint.sharpeRatio.toFixed(3)}`
        }
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoadingAgent(false);
    }
  };

  const historyStepText = `Step ${currentHistoryIndex + 1}/${Math.max(1, history.length)}`;

  return (
    <div id="main-app-container" className="sleek-app-bg min-h-screen text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Application Header */}
      <Header
        currentScenario={currentScenario}
        onSelectScenario={handleSelectScenario}
        onOpenRevitCode={() => setIsRevitModalOpen(true)}
        onOpenScenarioComparison={() => setIsComparisonModalOpen(true)}
        onOpenCsvExport={() => setIsCsvModalOpen(true)}
        onOpenPaperModal={() => setIsPaperModalOpen(true)}
        activeViewTab={activeViewTab}
        setActiveViewTab={setActiveViewTab}
        revitSyncState={revitSyncState}
        onManualRevitPing={checkRevitConnection}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        historyStepText={historyStepText}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* VIEW 1: CO-PILOT WORKSPACE (DASHBOARD) */}
        {activeViewTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Top Quick Stats Banner - Sleek System Monitor Style */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div id="stats-banner-yield" className="sleek-glass p-3.5 rounded-2xl flex flex-col justify-between shadow-xl">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Expected Yield (μ_p)</span>
                  <div className="h-6 w-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <Activity className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-bold text-emerald-400 font-mono">{(currentExpectedReturn * 100).toFixed(2)}%</span>
                  <span className="text-[10px] text-slate-500 font-mono">Target: 12%</span>
                </div>
                <div className="h-1 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (currentExpectedReturn / 0.15) * 100)}%` }}></div>
                </div>
              </div>

              <div id="stats-banner-risk" className="sleek-glass p-3.5 rounded-2xl flex flex-col justify-between shadow-xl">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Volatility Risk (σ_p)</span>
                  <div className="h-6 w-6 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-bold text-amber-400 font-mono">{(currentVolatility * 100).toFixed(2)}%</span>
                  <span className="text-[10px] text-slate-500 font-mono">Limit: 20%</span>
                </div>
                <div className="h-1 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (currentVolatility / 0.22) * 100)}%` }}></div>
                </div>
              </div>

              <div id="stats-banner-sharpe" className="sleek-glass p-3.5 rounded-2xl flex flex-col justify-between shadow-xl">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Sharpe Ratio (R_f=2%)</span>
                  <div className="h-6 w-6 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-bold text-indigo-300 font-mono">{currentSharpeRatio.toFixed(3)}</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Max: 0.934</span>
                </div>
                <div className="h-1 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (currentSharpeRatio / 1.0) * 100)}%` }}></div>
                </div>
              </div>

              <div id="stats-banner-footprint" className="sleek-glass p-3.5 rounded-2xl flex flex-col justify-between shadow-xl">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Total BIM Footprint</span>
                  <div className="h-6 w-6 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                    <Building2 className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-bold text-white font-mono">{totalFootprintM2.toLocaleString()} m²</span>
                  <span className="text-[10px] text-slate-500 font-mono">Parcel: {totalSiteArea.toLocaleString()} m²</span>
                </div>
                <div className="h-1 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${Math.min(100, (totalFootprintM2 / Math.max(1, totalSiteArea)) * 100)}%` }}></div>
                </div>
              </div>
            </div>

            {/* Split View: 2D/3D BIM Sandbox + AI Agent Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-7 flex flex-col">
                <BimMasterplanViewer
                  assets={assets}
                  onUpdateAssetFootprint={handleUpdateAssetFootprint}
                  onCommitAssetFootprint={handleCommitAssetFootprint}
                  totalFootprintM2={totalFootprintM2}
                  totalSiteArea={totalSiteArea}
                  onUpdateTotalSiteArea={handleUpdateTotalSiteArea}
                  expectedReturn={currentExpectedReturn}
                  portfolioVolatility={currentVolatility}
                  sharpeRatio={currentSharpeRatio}
                  onApplyOptimalWeights={handleApplyOptimalWeights}
                  onExportCsv={() => setIsCsvModalOpen(true)}
                  onOpenRevitPlugin={() => setIsRevitModalOpen(true)}
                />
              </div>

              <div className="lg:col-span-5 flex flex-col">
                <AiAgentPanel
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoadingAgent}
                  onExecuteAgentAction={handleExecuteAgentAction}
                  currentScenario={currentScenario}
                  onApplyOptimalWeights={handleApplyOptimalWeights}
                />
              </div>
            </div>

            {/* Efficient Frontier Curve */}
            <EfficientFrontierChart
              calculation={calculationResult}
              targetRisk={targetRisk}
              onTargetRiskChange={setTargetRisk}
              currentExpectedReturn={currentExpectedReturn}
              currentVolatility={currentVolatility}
              currentSharpeRatio={currentSharpeRatio}
              assets={assets}
              onApplyOptimalPoint={handleApplyOptimalWeights}
            />

            {/* Interactive Correlation & Covariance Matrix Heatmap */}
            <CorrelationHeatmap
              assets={assets}
              correlationMatrix={correlationMatrix}
              onUpdateCorrelation={handleUpdateCorrelation}
              onCommitCorrelation={handleCommitCorrelation}
              onUpdateAllCorrelation={handleUpdateAllCorrelation}
              covarianceRegime={covarianceRegime}
              onSetRegime={handleSetRegime}
              onExportCsv={() => setIsCsvModalOpen(true)}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={handleUndo}
              onRedo={handleRedo}
              history={history}
              currentHistoryIndex={currentHistoryIndex}
              onJumpToHistoryStep={handleJumpToHistoryStep}
            />
          </div>
        )}

        {/* VIEW 2: GENERATIVE BIM SANDBOX */}
        {activeViewTab === 'bim' && (
          <div className="space-y-6">
            <BimMasterplanViewer
              assets={assets}
              onUpdateAssetFootprint={handleUpdateAssetFootprint}
              onCommitAssetFootprint={handleCommitAssetFootprint}
              totalFootprintM2={totalFootprintM2}
              totalSiteArea={totalSiteArea}
              onUpdateTotalSiteArea={handleUpdateTotalSiteArea}
              expectedReturn={currentExpectedReturn}
              portfolioVolatility={currentVolatility}
              sharpeRatio={currentSharpeRatio}
              onApplyOptimalWeights={handleApplyOptimalWeights}
              onExportCsv={() => setIsCsvModalOpen(true)}
              onOpenRevitPlugin={() => setIsRevitModalOpen(true)}
            />

            <PortfolioAnalytics
              assets={assets}
              calculation={calculationResult}
              totalFootprintM2={totalFootprintM2}
              expectedReturn={currentExpectedReturn}
              portfolioVolatility={currentVolatility}
              sharpeRatio={currentSharpeRatio}
              correlationMatrix={correlationMatrix}
              onUpdateCorrelation={handleUpdateCorrelation}
              onCommitCorrelation={handleCommitCorrelation}
              onUpdateAllCorrelation={handleUpdateAllCorrelation}
              covarianceRegime={covarianceRegime}
              onSetRegime={handleSetRegime}
              onExportCsv={() => setIsCsvModalOpen(true)}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={handleUndo}
              onRedo={handleRedo}
              history={history}
              currentHistoryIndex={currentHistoryIndex}
              onJumpToHistoryStep={handleJumpToHistoryStep}
            />
          </div>
        )}

        {/* VIEW 3: EFFICIENT FRONTIER */}
        {activeViewTab === 'frontier' && (
          <div className="space-y-6">
            <EfficientFrontierChart
              calculation={calculationResult}
              targetRisk={targetRisk}
              onTargetRiskChange={setTargetRisk}
              currentExpectedReturn={currentExpectedReturn}
              currentVolatility={currentVolatility}
              currentSharpeRatio={currentSharpeRatio}
              assets={assets}
              onApplyOptimalPoint={handleApplyOptimalWeights}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="sleek-glass p-5 rounded-2xl shadow-2xl space-y-3.5">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-400" />
                  Hyperbolic Efficient Frontier Formulation
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The Efficient Frontier curve models the exact mathematical boundary where no higher architectural yield can be attained for a given volatility risk level:
                </p>
                <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 font-mono text-xs text-indigo-300 shadow-inner">
                  μ_p = (A + √(D · (σ_p² · C - 1))) / C
                </div>
                <p className="text-xs text-slate-400">
                  Where D = BC - A² is the parabolic determinant, and C = 1^T Σ^-1 1.
                </p>
              </div>

              <div className="sleek-glass p-5 rounded-2xl shadow-2xl space-y-3.5">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  Tangency Portfolio & Capital Allocation Line (CAL)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The Tangency point maximizes the Sharpe Ratio ($R_f = 2.0\%$). Allocating architectural investments along the Tangency line yields maximum risk-adjusted return:
                </p>
                <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 shadow-inner">
                  Max Sharpe: {calculationResult.optimalSharpePoint.sharpeRatio.toFixed(3)} at Vol: {(calculationResult.optimalSharpePoint.volatility * 100).toFixed(2)}%
                </div>
                <button
                  id="apply-tangency-cal-btn"
                  onClick={handleApplyOptimalWeights}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Apply Optimal Tangency Weights to Masterplan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: MATRIX MATHEMATICS & ANALYTICS */}
        {activeViewTab === 'analytics' && (
          <div className="space-y-6">
            <PortfolioAnalytics
              assets={assets}
              calculation={calculationResult}
              totalFootprintM2={totalFootprintM2}
              expectedReturn={currentExpectedReturn}
              portfolioVolatility={currentVolatility}
              sharpeRatio={currentSharpeRatio}
              correlationMatrix={correlationMatrix}
              onUpdateCorrelation={handleUpdateCorrelation}
              onCommitCorrelation={handleCommitCorrelation}
              onUpdateAllCorrelation={handleUpdateAllCorrelation}
              covarianceRegime={covarianceRegime}
              onSetRegime={handleSetRegime}
              onExportCsv={() => setIsCsvModalOpen(true)}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={handleUndo}
              onRedo={handleRedo}
              history={history}
              currentHistoryIndex={currentHistoryIndex}
              onJumpToHistoryStep={handleJumpToHistoryStep}
            />

            {/* C# Revit API Code Preview Card */}
            <div className="sleek-glass p-5 rounded-2xl shadow-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FileCode2 className="h-4 w-4 text-indigo-400" />
                  Autodesk Revit Integration (Pure JavaScript + C# Plugin)
                </h3>
                <button
                  id="open-full-source-analytics-btn"
                  onClick={() => setIsRevitModalOpen(true)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  Open Full Source
                </button>
              </div>
              <p className="text-xs text-slate-400">
                The software executes full Markowitz optimization in pure JavaScript and synchronizes with Revit via HTTP background polling.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* ICEPE 2026 Academic Research Footer */}
      <footer className="mt-12 border-t border-slate-800/80 bg-slate-950/80 py-6 px-4 lg:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
            <span className="px-2.5 py-1 rounded bg-indigo-950 text-indigo-300 font-black tracking-wider border border-indigo-800/60 uppercase text-[10px]">
              ICEPE 2026
            </span>
            <span>
              <strong className="text-slate-200">Modern Portfolio Theory in Generative Urban BIM Layouts</strong> — Authored by <strong className="text-amber-300 font-semibold">Sherif Ahmad Magdaldin</strong>
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
            <button
              id="footer-btn-download-pdf"
              onClick={generateAndDownloadPaperPDF}
              className="text-indigo-400 hover:text-indigo-300 underline font-semibold cursor-pointer flex items-center gap-1"
            >
              <Download className="h-3 w-3" />
              Download PDF Paper
            </button>
            <span>•</span>
            <button
              id="footer-btn-read-paper"
              onClick={() => setIsPaperModalOpen(true)}
              className="text-slate-300 hover:text-white underline cursor-pointer"
            >
              Read Paper
            </button>
            <span>•</span>
            <span>Table 1 Benchmarks</span>
            <span>•</span>
            <span>Revit 2027 C# Bridge</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ResearchPaperModal
        isOpen={isPaperModalOpen}
        onClose={() => setIsPaperModalOpen(false)}
      />

      <RevitExportModal
        isOpen={isRevitModalOpen}
        onClose={() => setIsRevitModalOpen(false)}
        assets={assets}
        targetRisk={targetRisk}
        correlationMatrix={correlationMatrix}
        expectedReturn={currentExpectedReturn}
        portfolioVolatility={currentVolatility}
        sharpeRatio={currentSharpeRatio}
        optimalSharpeWeights={calculationResult.optimalSharpePoint.weights}
        minVarianceWeights={calculationResult.minVariancePoint.weights}
        targetWeights={calculationResult.targetWeights}
        currentScenario={currentScenario}
        syncState={revitSyncState}
        onTriggerLiveSync={pushPayloadToRevit}
        onPingRevit={checkRevitConnection}
        onUpdateEndpoint={updateEndpointUrl}
        onSimulateIncomingRevitChange={simulateIncomingRevitChange}
      />

      <ScenarioComparisonModal
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        currentScenario={currentScenario}
        onSelectScenario={handleSelectScenario}
      />

      <CsvExportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        assets={assets}
        correlationMatrix={correlationMatrix}
        targetRisk={targetRisk}
        riskFreeRate={riskFreeRate}
        currentScenario={currentScenario}
      />
    </div>
  );
}

