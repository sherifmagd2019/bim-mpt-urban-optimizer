import { useState, useEffect, useCallback, useRef } from 'react';

const DEFAULT_ENDPOINT = 'http://localhost:8080/revit-mpt-bridge/';
const POLL_INTERVAL_MS = 3500; // Poll every 3.5 seconds

export function useRevitLiveSync(customEndpoint) {
  const [syncState, setSyncState] = useState({
    status: 'disconnected',
    latencyMs: undefined,
    lastPingTimestamp: undefined,
    lastSyncTimestamp: undefined,
    lastErrorMessage: undefined,
    endpointUrl: customEndpoint || DEFAULT_ENDPOINT,
    autoPollEnabled: true,
    totalSyncedPayloads: 0
  });

  const abortControllerRef = useRef(null);

  // Ping test function to measure latency and check server availability
  const checkRevitConnection = useCallback(async (endpoint = syncState.endpointUrl) => {
    // If previous ping is in-flight, cancel it
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout

    const startTime = performance.now();

    try {
      // Send an HTTP OPTIONS pre-flight probe or lightweight GET
      const response = await fetch(endpoint, {
        method: 'OPTIONS',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });

      clearTimeout(timeoutId);
      const latency = Math.round(performance.now() - startTime);

      if (response.ok || response.status === 200 || response.status === 204) {
        setSyncState(prev => ({
          ...prev,
          status: 'connected',
          latencyMs: latency,
          lastPingTimestamp: new Date().toISOString(),
          lastErrorMessage: undefined
        }));
        return true;
      } else {
        setSyncState(prev => ({
          ...prev,
          status: 'disconnected',
          latencyMs: undefined,
          lastPingTimestamp: new Date().toISOString(),
          lastErrorMessage: `Server responded with HTTP ${response.status}`
        }));
        return false;
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        // Timed out
        setSyncState(prev => ({
          ...prev,
          status: 'disconnected',
          latencyMs: undefined,
          lastPingTimestamp: new Date().toISOString(),
          lastErrorMessage: 'Connection timed out'
        }));
      } else {
        setSyncState(prev => ({
          ...prev,
          status: 'disconnected',
          latencyMs: undefined,
          lastPingTimestamp: new Date().toISOString(),
          lastErrorMessage: 'Local Revit bridge server not running'
        }));
      }
      return false;
    }
  }, [syncState.endpointUrl]);

  // Execute full payload push to Revit
  const pushPayloadToRevit = useCallback(async (payload, endpoint = syncState.endpointUrl) => {
    setSyncState(prev => ({ ...prev, status: 'syncing' }));
    const startTime = performance.now();

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const latency = Math.round(performance.now() - startTime);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const resData = await response.json();
      const nowIso = new Date().toISOString();

      setSyncState(prev => ({
        ...prev,
        status: 'connected',
        latencyMs: latency,
        lastSyncTimestamp: nowIso,
        lastPingTimestamp: nowIso,
        lastErrorMessage: undefined,
        totalSyncedPayloads: prev.totalSyncedPayloads + 1
      }));

      return { success: true, message: resData.message || 'Synchronized successfully to Autodesk Revit 2027!' };
    } catch (err) {
      setSyncState(prev => ({
        ...prev,
        status: 'disconnected',
        lastErrorMessage: err.message
      }));
      return { 
        success: false, 
        message: err.message?.includes('Failed to fetch')
          ? `Could not reach ${endpoint}. Please ensure Revit 2027 is running and LiveMptBridgeServerCommand is active.`
          : err.message 
      };
    }
  }, [syncState.endpointUrl]);

  // Periodic polling effect
  useEffect(() => {
    if (!syncState.autoPollEnabled) return;

    // Initial check
    checkRevitConnection();

    // Periodic timer
    const interval = setInterval(() => {
      checkRevitConnection();
    }, POLL_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [syncState.autoPollEnabled, checkRevitConnection]);

  const updateEndpointUrl = useCallback((newUrl) => {
    setSyncState(prev => ({ ...prev, endpointUrl: newUrl }));
    checkRevitConnection(newUrl);
  }, [checkRevitConnection]);

  const toggleAutoPoll = useCallback((enabled) => {
    setSyncState(prev => ({ ...prev, autoPollEnabled: enabled }));
  }, []);

  return {
    syncState,
    checkRevitConnection,
    pushPayloadToRevit,
    updateEndpointUrl,
    toggleAutoPoll
  };
}
