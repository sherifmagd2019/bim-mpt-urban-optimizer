import React, { useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Radio, 
  ExternalLink, 
  Zap 
} from 'lucide-react';

export const RevitLiveSyncIndicator = ({
  syncState,
  onOpenRevitModal,
  onManualPing
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Format relative last-synced timestamp
  const formatLastSync = (isoString) => {
    if (!isoString) return 'Never';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Unknown';
    }
  };

  const getStatusBadge = () => {
    switch (syncState?.status) {
      case 'connected':
        return {
          bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20',
          dot: 'bg-emerald-400 animate-pulse',
          icon: Wifi,
          iconColor: 'text-emerald-400',
          label: 'Revit 2027 Connected',
          shortLabel: 'Connected'
        };
      case 'syncing':
      case 'checking':
        return {
          bg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20',
          dot: 'bg-cyan-400 animate-ping',
          icon: RefreshCw,
          iconColor: 'text-cyan-400 animate-spin',
          label: 'Revit Bridge Polling...',
          shortLabel: 'Polling'
        };
      case 'disconnected':
      default:
        return {
          bg: 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-800',
          dot: 'bg-slate-500',
          icon: WifiOff,
          iconColor: 'text-slate-400',
          label: 'Revit Plugin Offline',
          shortLabel: 'Offline'
        };
    }
  };

  const badge = getStatusBadge();
  const Icon = badge.icon;

  return (
    <div className="relative inline-block">
      <button
        id="btn-revit-sync-indicator"
        onClick={onOpenRevitModal}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`group flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono border transition-all cursor-pointer shadow-sm backdrop-blur-md ${badge.bg}`}
        title="Click to view Revit 2027 live bridge and setup options"
      >
        <span className="relative flex h-2 w-2">
          <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${badge.dot}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${badge.dot}`}></span>
        </span>

        <Icon className={`h-3 w-3 ${badge.iconColor}`} />

        <span className="font-semibold hidden sm:inline text-[11px]">
          {badge.label}
        </span>
        <span className="font-semibold sm:hidden text-[10px]">
          {badge.shortLabel}
        </span>

        {syncState?.status === 'connected' && syncState?.latencyMs !== undefined && (
          <span className="text-[10px] px-1.5 py-0.2 bg-emerald-950/80 text-emerald-400 rounded-md border border-emerald-700/50 font-bold hidden md:inline">
            {syncState.latencyMs}ms
          </span>
        )}
      </button>

      {/* Floating Status Tooltip Card */}
      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 w-72 p-3.5 bg-slate-950/95 border border-slate-700/80 rounded-xl shadow-2xl z-50 text-xs font-sans backdrop-blur-xl animate-fade-in pointer-events-none">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <div className="flex items-center gap-1.5 font-bold text-white text-xs">
              <Radio className="h-3.5 w-3.5 text-cyan-400" />
              Revit 2027 Link Telemetry
            </div>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
              syncState?.status === 'connected' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
            }`}>
              {syncState?.status ? syncState.status.toUpperCase() : 'OFFLINE'}
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between text-slate-400">
              <span>Endpoint:</span>
              <span className="font-mono text-slate-200 text-[10px] truncate max-w-[140px]">
                {syncState?.endpointUrl?.replace('http://', '') || 'localhost:5000'}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>Ping Latency:</span>
              <span className="font-mono font-semibold text-slate-200">
                {syncState?.latencyMs !== undefined ? `${syncState.latencyMs} ms` : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>Last Synchronized:</span>
              <span className="font-mono text-cyan-300 font-medium">
                {formatLastSync(syncState?.lastSyncTimestamp)}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>Last Ping Checked:</span>
              <span className="font-mono text-slate-400 text-[10px]">
                {formatLastSync(syncState?.lastPingTimestamp)}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span className="text-cyan-400 font-medium flex items-center gap-1">
              <Zap className="h-2.5 w-2.5" />
              Click to Open Sync Manager
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
