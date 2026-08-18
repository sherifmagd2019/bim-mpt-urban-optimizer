import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for state management history stack (Undo / Redo / Time Travel)
 * Tracks: assets (weights/footprints), correlationMatrix, covarianceRegime, targetRisk, scenario metadata.
 */
export function useHistoryStack(initialState) {
  // Array of state snapshots
  const [history, setHistory] = useState(() => [
    {
      id: `init-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      description: 'Initial Masterplan Setup',
      actionType: 'init',
      state: {
        assets: JSON.parse(JSON.stringify(initialState.assets)),
        correlationMatrix: JSON.parse(JSON.stringify(initialState.correlationMatrix)),
        covarianceRegime: initialState.covarianceRegime || 'low',
        targetRisk: initialState.targetRisk || 0.1012,
        scenario: initialState.scenario ? { ...initialState.scenario } : null,
        totalSiteArea: initialState.totalSiteArea !== undefined ? initialState.totalSiteArea : 17000
      }
    }
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const isUndoRedoActionRef = useRef(false);

  // Maximum snapshots stored in memory
  const MAX_HISTORY_LENGTH = 50;

  /**
   * Push a new snapshot to the history stack
   */
  const recordSnapshot = useCallback((newState, description = 'Modified Layout', actionType = 'edit') => {
    if (isUndoRedoActionRef.current) {
      isUndoRedoActionRef.current = false;
      return;
    }

    setHistory((prevHistory) => {
      // Truncate any redo branch beyond the current pointer
      const updatedHistory = prevHistory.slice(0, currentIndex + 1);

      // Avoid duplicate consecutive identical state recordings
      const lastItem = updatedHistory[updatedHistory.length - 1];
      if (lastItem) {
        const isAssetsEqual = JSON.stringify(lastItem.state.assets) === JSON.stringify(newState.assets);
        const isCorrEqual = JSON.stringify(lastItem.state.correlationMatrix) === JSON.stringify(newState.correlationMatrix);
        const isRegimeEqual = lastItem.state.covarianceRegime === newState.covarianceRegime;
        const isTargetRiskEqual = lastItem.state.targetRisk === newState.targetRisk;
        const isTotalSiteAreaEqual = lastItem.state.totalSiteArea === newState.totalSiteArea;

        if (isAssetsEqual && isCorrEqual && isRegimeEqual && isTargetRiskEqual && isTotalSiteAreaEqual) {
          return prevHistory;
        }
      }

      const newEntry = {
        id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toLocaleTimeString(),
        description,
        actionType,
        state: {
          assets: JSON.parse(JSON.stringify(newState.assets)),
          correlationMatrix: JSON.parse(JSON.stringify(newState.correlationMatrix)),
          covarianceRegime: newState.covarianceRegime,
          targetRisk: newState.targetRisk,
          scenario: newState.scenario ? { ...newState.scenario } : null,
          totalSiteArea: newState.totalSiteArea !== undefined ? newState.totalSiteArea : 17000
        }
      };

      const finalHistory = [...updatedHistory, newEntry];
      if (finalHistory.length > MAX_HISTORY_LENGTH) {
        return finalHistory.slice(finalHistory.length - MAX_HISTORY_LENGTH);
      }
      return finalHistory;
    });

    setCurrentIndex((prevIndex) => {
      return Math.min(prevIndex + 1, MAX_HISTORY_LENGTH - 1);
    });
  }, [currentIndex]);

  /**
   * Undo to previous step
   */
  const undo = useCallback((applyStateCallback) => {
    if (currentIndex <= 0) return null;
    const targetIndex = currentIndex - 1;
    const targetEntry = history[targetIndex];
    if (!targetEntry) return null;

    isUndoRedoActionRef.current = true;
    setCurrentIndex(targetIndex);
    if (applyStateCallback) {
      applyStateCallback(targetEntry.state);
    }
    return targetEntry;
  }, [currentIndex, history]);

  /**
   * Redo to next step
   */
  const redo = useCallback((applyStateCallback) => {
    if (currentIndex >= history.length - 1) return null;
    const targetIndex = currentIndex + 1;
    const targetEntry = history[targetIndex];
    if (!targetEntry) return null;

    isUndoRedoActionRef.current = true;
    setCurrentIndex(targetIndex);
    if (applyStateCallback) {
      applyStateCallback(targetEntry.state);
    }
    return targetEntry;
  }, [currentIndex, history]);

  /**
   * Jump to specific step index in history timeline
   */
  const jumpToStep = useCallback((index, applyStateCallback) => {
    if (index < 0 || index >= history.length) return null;
    const targetEntry = history[index];
    if (!targetEntry) return null;

    isUndoRedoActionRef.current = true;
    setCurrentIndex(index);
    if (applyStateCallback) {
      applyStateCallback(targetEntry.state);
    }
    return targetEntry;
  }, [history]);

  /**
   * Clear and reset history stack with a fresh baseline
   */
  const resetHistory = useCallback((initialStateObj, label = 'Reset Masterplan Layout') => {
    const freshEntry = {
      id: `reset-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      description: label,
      actionType: 'reset',
      state: {
        assets: JSON.parse(JSON.stringify(initialStateObj.assets)),
        correlationMatrix: JSON.parse(JSON.stringify(initialStateObj.correlationMatrix)),
        covarianceRegime: initialStateObj.covarianceRegime || 'low',
        targetRisk: initialStateObj.targetRisk || 0.1012,
        scenario: initialStateObj.scenario ? { ...initialStateObj.scenario } : null
      }
    };
    setHistory([freshEntry]);
    setCurrentIndex(0);
  }, []);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;
  const currentEntry = history[currentIndex] || history[0];

  return {
    history,
    currentIndex,
    currentEntry,
    canUndo,
    canRedo,
    recordSnapshot,
    undo,
    redo,
    jumpToStep,
    resetHistory
  };
}
