import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Code2, 
  Terminal, 
  FileJson, 
  Boxes, 
  CheckCircle2, 
  AlertCircle, 
  Activity, 
  Clock, 
  Zap, 
  ArrowLeftRight, 
  Radio, 
  RefreshCw, 
  Send, 
  Wifi, 
  WifiOff 
} from 'lucide-react';
import { 
  buildRevitBridgePayload, 
  generateFullRevit2027PluginCode, 
  generateRevitAddinManifest, 
  generateCsprojFile, 
  generateDynamoPythonScript 
} from '../lib/revitBridge';
import { 
  generatePureJavaScriptEngine, 
  generateRevitJavaScriptWebhookClient 
} from '../lib/javascriptEngine';

export const RevitExportModal = ({
  isOpen,
  onClose,
  assets,
  targetRisk,
  correlationMatrix,
  expectedReturn,
  portfolioVolatility,
  sharpeRatio,
  optimalSharpeWeights,
  minVarianceWeights,
  targetWeights,
  layoutBlocks = [],
  currentScenario,
  syncState,
  onTriggerLiveSync,
  onPingRevit,
  onUpdateEndpoint,
  onSimulateIncomingRevitChange
}) => {
  const [activeTab, setActiveTab] = useState('live_sync');
  const [copied, setCopied] = useState(false);
  const [localSyncStatus, setLocalSyncStatus] = useState('idle');
  const [syncResponse, setSyncResponse] = useState(null);
  const [simulationStatus, setSimulationStatus] = useState(null);
  const [endpointInput, setEndpointInput] = useState(syncState?.endpointUrl || 'http://localhost:8080/');

  if (!isOpen) return null;

  // Generate blocks if layoutBlocks is empty
  const blocks = layoutBlocks.length > 0 ? layoutBlocks : assets.map((a, i) => ({
    id: `block-${a.id}`,
    assetId: a.id,
    name: a.name,
    type: a.type,
    x: i * 50,
    y: 0,
    width: Math.sqrt(a.footprintM2),
    height: Math.sqrt(a.footprintM2),
    floors: a.floors,
    areaM2: a.footprintM2,
    color: a.color
  }));

  const jsonPayload = buildRevitBridgePayload(
    assets,
    correlationMatrix,
    targetRisk,
    expectedReturn,
    portfolioVolatility,
    sharpeRatio,
    optimalSharpeWeights,
    minVarianceWeights,
    targetWeights,
    blocks
  );

  const jsEngineCode = generatePureJavaScriptEngine(assets, targetRisk, correlationMatrix);
  const jsWebhookClient = generateRevitJavaScriptWebhookClient(syncState?.endpointUrl || endpointInput);
  const csharpCode = generateFullRevit2027PluginCode(assets, targetRisk, correlationMatrix);
  const addinManifest = generateRevitAddinManifest();
  const csprojFile = generateCsprojFile();
  const dynamoScript = generateDynamoPythonScript();
  const jsonString = JSON.stringify(jsonPayload, null, 2);

  const getCurrentCode = () => {
    switch (activeTab) {
      case 'javascript': return jsEngineCode;
      case 'js_client': return jsWebhookClient;
      case 'plugin_cs': return csharpCode;
      case 'manifest': return addinManifest;
      case 'csproj': return csprojFile;
      case 'json_payload': return jsonString;
      case 'dynamo': return dynamoScript;
      default: return jsEngineCode;
    }
  };

  const getCurrentFilename = () => {
    switch (activeTab) {
      case 'javascript': return 'mptUrbanOptimizer.js';
      case 'js_client': return 'revitSyncClient.js';
      case 'plugin_cs': return 'RevitBimPortfolioOptimizer2027.cs';
      case 'manifest': return 'RevitMptUrbanOptimizer.addin';
      case 'csproj': return 'RevitMptOptimizer.csproj';
      case 'json_payload': return 'revit_mpt_layout_payload.json';
      case 'dynamo': return 'RevitDynamoMptImporter.py';
      default: return 'mptUrbanOptimizer.js';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCurrentCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTriggerSync = async () => {
    setLocalSyncStatus('syncing');
    setSyncResponse(null);

    const result = await onTriggerLiveSync(jsonPayload);
    if (result.success) {
      setLocalSyncStatus('success');
      setSyncResponse(result.message);
    } else {
      setLocalSyncStatus('failed');
      setSyncResponse(result.message);
    }
  };

  const handleEndpointBlur = () => {
    if (endpointInput !== syncState?.endpointUrl) {
      onUpdateEndpoint(endpointInput);
    }
  };

  return (
    <div id="revit-export-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="sleek-glass border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-950/95 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-inner">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-blue-600 to-cyan-600 text-white border border-cyan-400/40">
                  Native .NET 10
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Revit 2027 + VS 2026
                </span>
                <span className="text-[11px] font-bold text-amber-300">
                  Sherif Ahmad Magdaldin
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 font-semibold ${
                  syncState?.status === 'connected' 
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${syncState?.status === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                  {syncState?.status === 'connected' ? `Revit Connected (${syncState.latencyMs || 4}ms)` : 'Revit Offline'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mt-0.5">
                Revit 2027 C# Add-In & Two-Way Pipeline Hub
              </h3>
              <p className="text-xs text-slate-400">
                100% Pure Native Revit API in <code className="text-cyan-300 font-mono">/src/revit-addin/</code> • Real-time Ribbon Notice Display
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="close-revit-modal-btn"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 pt-2 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center gap-1.5 text-xs">
          {/* Live Two-Way Sync Tester */}
          <button
            id="tab-live-sync-btn"
            onClick={() => setActiveTab('live_sync')}
            className={`px-3.5 py-2 font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'live_sync'
                ? 'border-cyan-400 text-white bg-slate-900/90 shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowLeftRight className="h-3.5 w-3.5 text-cyan-400" />
            Live 2-Way Pipeline Tester
          </button>

          {/* Pure JavaScript Engine */}
          <button
            id="tab-javascript-btn"
            onClick={() => setActiveTab('javascript')}
            className={`px-3.5 py-2 font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'javascript'
                ? 'border-amber-400 text-white bg-slate-900/90 shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="h-3.5 w-3.5 text-amber-400" />
            Pure JS Solver
          </button>

          <button
            id="tab-json-payload-btn"
            onClick={() => setActiveTab('json_payload')}
            className={`px-3.5 py-2 font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'json_payload'
                ? 'border-pink-400 text-white bg-slate-900/90 shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileJson className="h-3.5 w-3.5 text-pink-400" />
            JSON BIM Payload
          </button>

          <button
            id="tab-dynamo-btn"
            onClick={() => setActiveTab('dynamo')}
            className={`px-3.5 py-2 font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'dynamo'
                ? 'border-purple-400 text-white bg-slate-900/90 shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="h-3.5 w-3.5 text-purple-400" />
            Dynamo Python
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden flex flex-col p-4 bg-slate-950/40">
          
          {/* TAB 1: LIVE 2-WAY PIPELINE TESTER */}
          {activeTab === 'live_sync' && (
            <div className="h-full overflow-y-auto space-y-4 p-2 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="sleek-glass p-4 rounded-xl space-y-2 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Outbound Plugin State</span>
                    {syncState?.status === 'connected' ? (
                      <span className="badge badge-online text-[10px]">Port 8080 Active</span>
                    ) : (
                      <span className="badge badge-offline text-[10px]">Revit Offline</span>
                    )}
                  </div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    {syncState?.status === 'connected' ? (
                      <>
                        <Wifi className="h-4 w-4 text-emerald-400" />
                        <span>Revit 2027 Bridge Active</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-4 w-4 text-slate-500" />
                        <span>Waiting for Revit Listener</span>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {syncState?.status === 'connected' 
                      ? 'Connected directly to Revit 2027 HttpListener on port 8080.' 
                      : 'Continuous ping loop checks Revit HttpListener at port 8080.'}
                  </p>
                </div>

                <div className="sleek-glass p-4 rounded-xl space-y-2 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Inbound Revit Telemetry</span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      syncState?.totalInboundUpdates > 0 
                        ? 'bg-emerald-500/20 text-emerald-300' 
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {syncState?.totalInboundUpdates > 0 ? 'Data Received' : 'Active (1.5s Poll)'}
                    </span>
                  </div>
                  <div className="text-sm font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-cyan-400" />
                    <span>{syncState?.totalInboundUpdates || 0} Inbound Updates</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Captures <code>Push Data to React</code> button clicks & DocumentChanged events.
                  </p>
                </div>

                <div className="sleek-glass p-4 rounded-xl space-y-2 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Two-Way Pipeline Latency</span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      syncState?.status === 'connected' 
                        ? 'bg-emerald-500/20 text-emerald-300' 
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {syncState?.status === 'connected' ? 'Real-Time' : 'Offline'}
                    </span>
                  </div>
                  <div className="text-sm font-mono font-bold text-amber-300 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-amber-400" />
                    <span>{syncState?.status === 'connected' && syncState?.latencyMs ? `${syncState.latencyMs} ms` : '—'}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Background async dispatch with zero UI hangs in Revit 2027.
                  </p>
                </div>
              </div>

              {/* Endpoint Configuration & Manual Trigger */}
              <div className="sleek-glass p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                    <Zap className="h-4 w-4 text-cyan-400" />
                    Revit Live Bridge Webhook Dispatcher (React → Revit)
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">Quick Endpoints:</span>
                    <button
                      onClick={() => {
                        setEndpointInput('http://localhost:8080/');
                        onUpdateEndpoint && onUpdateEndpoint('http://localhost:8080/');
                      }}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-300 hover:text-white border border-slate-700 hover:border-cyan-500 cursor-pointer"
                    >
                      localhost:8080
                    </button>
                    <button
                      onClick={() => {
                        setEndpointInput('http://127.0.0.1:8080/');
                        onUpdateEndpoint && onUpdateEndpoint('http://127.0.0.1:8080/');
                      }}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-300 hover:text-white border border-slate-700 hover:border-cyan-500 cursor-pointer"
                    >
                      127.0.0.1:8080
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-300 block">
                    Target Revit 2027 Listener Endpoint URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={endpointInput}
                      onChange={(e) => setEndpointInput(e.target.value)}
                      onBlur={handleEndpointBlur}
                      className="flex-1 bg-slate-900/90 border border-slate-700 text-slate-200 px-3.5 py-2 rounded-xl font-mono text-xs focus:outline-none focus:border-cyan-500"
                      placeholder="http://localhost:8080/"
                    />
                    <button
                      id="ping-revit-bridge-btn"
                      onClick={() => onPingRevit()}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-xs border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Ping Test
                    </button>
                    <button
                      id="trigger-live-sync-btn"
                      onClick={handleTriggerSync}
                      disabled={localSyncStatus === 'syncing'}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-semibold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {localSyncStatus === 'syncing' ? 'Syncing...' : 'Push Layout to Revit'}
                    </button>
                  </div>
                </div>

                {syncResponse && (
                  <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    localSyncStatus === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}>
                    {localSyncStatus === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <span>{syncResponse}</span>
                  </div>
                )}
              </div>

              {/* Inbound Telemetry Test Simulator */}
              <div className="sleek-glass p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-emerald-400" />
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                      Revit Model Change Simulation (Revit → React)
                    </h4>
                  </div>
                  <button
                    id="simulate-revit-push-btn"
                    onClick={async () => {
                      if (onSimulateIncomingRevitChange) {
                        const res = await onSimulateIncomingRevitChange();
                        setSimulationStatus(res?.message || 'Simulated Push to React event dispatched!');
                        setTimeout(() => setSimulationStatus(null), 4000);
                      }
                    }}
                    className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Simulate 'Push Data to React' Event
                  </button>
                </div>
                <p className="text-slate-300 text-[11px]">
                  When a BIM engineer clicks <strong>Push Data to React</strong> in the Revit ribbon bar, the add-in harvests all zone footprints and posts them to React.
                </p>
                {simulationStatus && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{simulationStatus}</span>
                  </div>
                )}
              </div>

              {/* Two-way Pipeline Architecture diagram */}
              <div className="sleek-glass p-5 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4 text-indigo-400" />
                  Two-Way Non-Blocking Pipeline Architecture
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                    <strong className="text-cyan-300 flex items-center gap-1.5">
                      <Send className="h-3 w-3" /> Direction 1: React Web → Revit 2027
                    </strong>
                    <p className="text-slate-400">
                      1. React sends POST payload to <code>http://localhost:8080/</code>.
                      <br />
                      2. Background <code>HttpListener</code> receives payload asynchronously.
                      <br />
                      3. Queued to Revit main thread via native <code>IExternalEventHandler</code>.
                      <br />
                      4. Revit <strong>Status Notice Bar</strong> displays change notice in real-time!
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                    <strong className="text-emerald-300 flex items-center gap-1.5">
                      <Radio className="h-3 w-3" /> Direction 2: Revit 2027 → React Web
                    </strong>
                    <p className="text-slate-400">
                      1. User clicks <strong>Push Data to React</strong> button on Revit ribbon.
                      <br />
                      2. Add-in harvests DirectShape/Mass footprints & areas.
                      <br />
                      3. Non-blocking HTTP POST streams to Express cache.
                      <br />
                      4. React polling updates layout blocks & recalculates Markowitz frontier!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OTHER CODE TABS (PURE JS, JSON, DYNAMO) */}
          {activeTab !== 'live_sync' && (
            <div className="h-full flex flex-col sleek-glass rounded-xl border border-slate-800 overflow-hidden">
              <div className="px-3 py-2 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-200">
                  {getCurrentFilename()}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
              <pre className="flex-1 p-3.5 bg-slate-950/80 font-mono text-[11px] text-slate-300 overflow-auto leading-relaxed selection:bg-amber-500 selection:text-white">
                {getCurrentCode()}
              </pre>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
