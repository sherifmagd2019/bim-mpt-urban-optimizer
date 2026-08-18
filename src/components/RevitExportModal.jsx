import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  Code2, 
  FileCode, 
  Sparkles, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Send, 
  Layers, 
  Terminal, 
  FileJson, 
  Boxes, 
  CheckCircle2, 
  AlertCircle, 
  Activity, 
  Clock, 
  FileSpreadsheet,
  Zap
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
  onUpdateEndpoint
}) => {
  const [activeTab, setActiveTab] = useState('javascript');
  const [copied, setCopied] = useState(false);
  const [localSyncStatus, setLocalSyncStatus] = useState('idle');
  const [syncResponse, setSyncResponse] = useState(null);
  const [endpointInput, setEndpointInput] = useState(syncState?.endpointUrl || 'http://localhost:5000/api/revit/bridge');

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
      case 'csproj': return 'RevitMptUrbanOptimizer.csproj';
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

  const handleDownload = () => {
    const code = getCurrentCode();
    const filename = getCurrentFilename();
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllBundle = () => {
    const files = [
      { name: 'mptUrbanOptimizer.js', content: jsEngineCode },
      { name: 'revitSyncClient.js', content: jsWebhookClient },
      { name: 'RevitBimPortfolioOptimizer2027.cs', content: csharpCode },
      { name: 'RevitMptUrbanOptimizer.addin', content: addinManifest },
      { name: 'RevitMptUrbanOptimizer.csproj', content: csprojFile },
      { name: 'revit_mpt_layout_payload.json', content: jsonString }
    ];

    files.forEach((f, idx) => {
      setTimeout(() => {
        const blob = new Blob([f.content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = f.name;
        link.click();
        URL.revokeObjectURL(url);
      }, idx * 250);
    });
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
            <div className="h-10 w-10 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-inner">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Modern Portfolio Theory Code Exports & Revit Bridge
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                  JavaScript (ES6+)
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 font-semibold ${
                  syncState?.status === 'connected' 
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${syncState?.status === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                  {syncState?.status === 'connected' ? `Revit Live (${syncState.latencyMs}ms)` : 'Revit Offline'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pure JavaScript mathematical solver (no TypeScript compile needed) + C# Revit 2027 Add-in & Live HTTP sync
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="download-all-code-bundle-btn"
              onClick={handleDownloadAllBundle}
              className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hidden sm:flex"
              title="Download pure JavaScript engine, C# source, .addin manifest, .csproj, and JSON payload"
            >
              <Download className="h-3.5 w-3.5" />
              Download All (.js/.cs/bundle)
            </button>
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
          {/* Pure JavaScript Engine Tab (Primary) */}
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
            Pure JavaScript Engine (.js)
          </button>
          <button
            id="tab-js-client-btn"
            onClick={() => setActiveTab('js_client')}
            className={`px-3.5 py-2 font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'js_client'
                ? 'border-yellow-400 text-white bg-slate-900/90 shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="h-3.5 w-3.5 text-yellow-400" />
            JS Webhook Client (Node.js)
          </button>
          <button
            id="tab-live-sync-btn"
            onClick={() => setActiveTab('live_sync')}
            className={`px-3.5 py-2 font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'live_sync'
                ? 'border-cyan-400 text-white bg-slate-900/90 shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wifi className="h-3.5 w-3.5 text-cyan-400" />
            Live Revit Sync
          </button>
          <button
            id="tab-plugin-cs-btn"
            onClick={() => setActiveTab('plugin_cs')}
            className={`px-3.5 py-2 font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'plugin_cs'
                ? 'border-indigo-400 text-white bg-slate-900/90 shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="h-3.5 w-3.5 text-indigo-400" />
            Revit 2027 C# Plugin (.cs)
          </button>
          <button
            id="tab-manifest-btn"
            onClick={() => setActiveTab('manifest')}
            className={`px-3.5 py-2 font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'manifest'
                ? 'border-emerald-400 text-white bg-slate-900/90 shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-emerald-400" />
            .addin Manifest
          </button>
          <button
            id="tab-csproj-btn"
            onClick={() => setActiveTab('csproj')}
            className={`px-3.5 py-2 font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'csproj'
                ? 'border-blue-400 text-white bg-slate-900/90 shadow-sm'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Boxes className="h-3.5 w-3.5 text-blue-400" />
            .csproj Project
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
            Dynamo / Python
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden flex flex-col p-4 bg-slate-950/40">
          {activeTab === 'live_sync' ? (
            /* LIVE SYNC CONTROL PANEL */
            <div className="h-full overflow-y-auto space-y-4 p-2 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="sleek-glass p-4 rounded-xl space-y-2 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Plugin State</span>
                    {syncState?.status === 'connected' ? (
                      <span className="badge badge-online text-[10px]">Connected</span>
                    ) : (
                      <span className="badge badge-offline text-[10px]">Offline / Standby</span>
                    )}
                  </div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    {syncState?.status === 'connected' ? <Wifi className="h-4 w-4 text-emerald-400" /> : <WifiOff className="h-4 w-4 text-slate-500" />}
                    {syncState?.status === 'connected' ? 'Revit 2027 Bridge Active' : 'Waiting for Local Listener'}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Background polling every 3 seconds to ensure instant geometric synchronization.
                  </p>
                </div>

                <div className="sleek-glass p-4 rounded-xl space-y-2 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Roundtrip Latency</span>
                    <Activity className="h-3.5 w-3.5 text-cyan-400" />
                  </div>
                  <div className="text-lg font-mono font-bold text-cyan-300">
                    {syncState?.status === 'connected' ? `${syncState.latencyMs} ms` : '—'}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    HTTP asynchronous loop prevents Revit workspace UI lock.
                  </p>
                </div>

                <div className="sleek-glass p-4 rounded-xl space-y-2 border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Last Synced Time</span>
                    <Clock className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <div className="text-sm font-mono font-bold text-amber-300">
                    {syncState?.lastSyncedAt ? new Date(syncState.lastSyncedAt).toLocaleTimeString() : 'Never'}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Auto-snapshots portfolio variance parameters on every change.
                  </p>
                </div>
              </div>

              {/* Endpoint Configuration & Manual Trigger */}
              <div className="sleek-glass p-5 rounded-2xl border border-slate-800 space-y-4">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <Zap className="h-4 w-4 text-cyan-400" />
                  Revit Live Bridge Webhook Dispatcher
                </h4>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-300 block">
                    Local Revit Plugin Webhook URL:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="revit-endpoint-url-input"
                      type="text"
                      value={endpointInput}
                      onChange={(e) => setEndpointInput(e.target.value)}
                      onBlur={handleEndpointBlur}
                      className="flex-1 bg-slate-900/90 border border-slate-700 text-slate-200 px-3.5 py-2 rounded-xl font-mono text-xs focus:outline-none focus:border-cyan-500"
                      placeholder="http://localhost:5000/api/revit/bridge"
                    />
                    <button
                      id="ping-revit-bridge-btn"
                      onClick={() => onPingRevit && onPingRevit()}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-xs border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Ping
                    </button>
                    <button
                      id="trigger-live-sync-btn"
                      onClick={handleTriggerSync}
                      disabled={localSyncStatus === 'syncing'}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-semibold text-xs shadow-lg shadow-cyan-600/30 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                    >
                      {localSyncStatus === 'syncing' ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Pushing to BIM...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          <span>Push Layout to Revit</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {syncResponse && (
                  <div className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
                    localSyncStatus === 'success' 
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}>
                    {localSyncStatus === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                    <span>{syncResponse}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* CODE PREVIEW AREA */
            <div className="flex-1 flex flex-col min-h-0 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span className="font-mono text-[11px] text-amber-300 font-bold">
                  File: {getCurrentFilename()}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    id="copy-code-btn"
                    onClick={handleCopy}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                  <button
                    id="download-code-file-btn"
                    onClick={handleDownload}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download {getCurrentFilename()}</span>
                  </button>
                </div>
              </div>

              {/* Code Pre Box */}
              <div className="flex-1 overflow-auto rounded-xl bg-slate-950 border border-slate-800/80 p-4 font-mono text-[11px] leading-relaxed text-slate-300 shadow-inner">
                <pre className="whitespace-pre">{getCurrentCode()}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
