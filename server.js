import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import {
  calculateAnalyticalMarkowitz,
  PAPER_TABLE_1_PRESETS,
  generateRevitCSharpSnippet
} from './src/lib/mptMath.js';
import { runAgentCoPilot } from './src/lib/agentCoPilot.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;  // ✅ Cloud Run sets PORT env var

  app.use(express.json({ limit: '10mb' }));

  // Global CORS and Private Network Access middleware
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Private-Network', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Requested-With');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // ============================================================================
  // API Health & Metadata Endpoints
  // ============================================================================
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiApiKey: Boolean(process.env.GEMINI_API_KEY),
      framework: 'Modern Portfolio Theory (MPT) in Generative Urban BIM Layouts',
      conference: 'ICEPE 2026',
      author: 'Sherif Ahmad Magdaldin, WorldQuant University',
      runtime: 'Pure JavaScript (ES6+ / Node.js)',
    });
  });

  app.get('/api/paper', (req, res) => {
    res.json({
      title:
        'A C# Application of Modern Portfolio Theory for Financial Risk-Return Optimization in Generative Urban BIM Layouts',
      shortTitle: 'Modern Portfolio Theory in Generative Urban BIM Layouts',
      conference: 'ICEPE 2026',
      author: 'Sherif Ahmad Magdaldin',
      credentials:
        'Civil and Structural Engineer, Master of Financial Engineering Program, WorldQuant University',
      location: 'New Orleans, Louisiana, USA',
      email: 'sherifmagd@gmail.com',
      keywords: [
        'ICEPE 2026',
        'Revit API',
        'C#',
        'Modern Portfolio Theory',
        'Generative BIM',
        'Architectural Financial Engineering',
      ],
      pageCount: 3,
      downloadPdfFilename: 'ICEPE2026_MPT_BIM_Sherif_Magdaldin.pdf',
      table1Metrics: {
        baseline: { resM2: 12500, commM2: 3000, indM2: 1500, returnPct: 6.82, riskPct: 8.41, sharpe: 0.573 },
        highYield: { resM2: 5000, commM2: 11000, indM2: 1000, returnPct: 14.15, riskPct: 22.38, sharpe: 0.543 },
        mptHighCorr: { resM2: 8100, commM2: 5150, indM2: 2250, returnPct: 10.9, riskPct: 12.45, sharpe: 0.715 },
        mptLowCorr: { resM2: 8750, commM2: 5500, indM2: 2750, returnPct: 11.45, riskPct: 10.12, sharpe: 0.934 },
      },
    });
  });

  // ============================================================================
  // Quantitative Portfolio Optimization Solver Endpoint
  // ============================================================================
  app.post('/api/optimize', (req, res) => {
    try {
      const { assets, correlationMatrix, targetRisk, riskFreeRate = 0.02, enforceNonNegative = true } = req.body;
      if (!assets || !Array.isArray(assets) || assets.length === 0) {
        return res.status(400).json({ error: 'Assets array is required.' });
      }

      const result = calculateAnalyticalMarkowitz(
        assets,
        correlationMatrix || [[1, 0.15, 0.08], [0.15, 1, 0.22], [0.08, 0.22, 1]],
        targetRisk || 0.10,
        riskFreeRate,
        enforceNonNegative
      );

      res.json(result);
    } catch (err) {
      console.error('Optimization error:', err);
      res.status(500).json({ error: err.message || 'Error during portfolio optimization' });
    }
  });

  // ============================================================================
  // AI Agent Co-Pilot Endpoint (Gemini Multi-Turn Tool Loop Integration)
  // ============================================================================
  app.post('/api/agent/chat', async (req, res) => {
    try {
      const {
        message,
        conversationHistory = [],
        currentMasterplan,
        targetRisk = 0.1012,
        riskFreeRate = 0.02,
        scenarioPreset,
      } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message string is required' });
      }

      // Delegate directly to the production agentCoPilot execution engine
      const agentResponse = await runAgentCoPilot({
        message,
        conversationHistory,
        currentMasterplan: currentMasterplan || {
          assets: PAPER_TABLE_1_PRESETS[3].assets,
          correlationMatrix: PAPER_TABLE_1_PRESETS[3].correlationMatrix,
          covarianceRegime: 'low',
          totalFootprintM2: 17000,
        },
        targetRisk,
        riskFreeRate,
      });

      res.json(agentResponse);
    } catch (err) {
      console.error('Agent chat endpoint error:', err);
      res.status(500).json({
        status: 'TEXT_REPLY',
        error: err.message || 'Error executing agent chat prompt',
        reply: 'An error occurred while executing the quantitative agent pipeline. Please try again.',
        reasoningSteps: [`Agent execution error: ${err.message}`],
      });
    }
  });

  // ============================================================================
  // Revit 2027 C# Bridge & Bi-Directional Telemetry Endpoints
  // ============================================================================
  let latestRevitState = null;
  let pendingOutboundLayout = null;
  let outboundVersion = 0;
  let lastRevitHeartbeat = null;

  // Catches incoming telemetry from Autodesk Revit DocumentChanged event
  app.post('/api/revit/model-changed', (req, res) => {
    try {
      const { timestamp, layoutBlocks, blocks } = req.body || {};
      const blocksList = layoutBlocks || blocks;

      if (!blocksList || !Array.isArray(blocksList)) {
        return res.status(400).json({
          error: 'Invalid payload: layoutBlocks array is required.',
          example: {
            timestamp: new Date().toISOString(),
            layoutBlocks: [
              { elementId: 'REVIT_101', assetCode: 'RES', name: 'Residential Tower A', footprintM2: 7500, floors: 8 },
              { elementId: 'REVIT_102', assetCode: 'COMM', name: 'Commercial Plaza B', footprintM2: 6000, floors: 12 },
              { elementId: 'REVIT_103', assetCode: 'IND', name: 'Logistics Center C', footprintM2: 3500, floors: 2 },
            ],
          },
        });
      }

      latestRevitState = {
        timestamp: timestamp || new Date().toISOString(),
        receivedAt: new Date().toISOString(),
        layoutBlocks: blocksList.map((b, index) => ({
          elementId: String(b.elementId ?? b.id ?? `revit_elem_${index + 1}`),
          assetCode: String(b.assetCode ?? b.code ?? 'RES').toUpperCase(),
          name: String(b.name ?? `Zone ${b.assetCode || 'Asset'}`),
          footprintM2: Number(b.footprintM2 ?? b.areaM2 ?? b.area ?? 0),
          floors: Number(b.floors ?? 1),
        })),
      };

      lastRevitHeartbeat = {
        timestamp: Date.now(),
        status: 'online',
        source: 'model-changed-event',
      };

      console.log(`[Revit Telemetry] Received DocumentChanged event with ${latestRevitState.layoutBlocks.length} blocks.`);

      res.json({
        success: true,
        message: 'Revit model changes received and queued for React client consumption.',
        receivedBlocksCount: latestRevitState.layoutBlocks.length,
        timestamp: latestRevitState.timestamp,
      });
    } catch (err) {
      console.error('[Revit Telemetry Error]:', err);
      res.status(500).json({ error: err.message || 'Internal server error processing Revit model change' });
    }
  });

  // React client polling endpoint that flushes cached state once read
  app.get('/api/client/latest-revit-state', (req, res) => {
    try {
      if (!latestRevitState) {
        return res.json({
          hasUpdate: false,
          timestamp: new Date().toISOString(),
        });
      }

      const stateToDispatch = { ...latestRevitState };
      latestRevitState = null;

      res.json({
        hasUpdate: true,
        data: stateToDispatch,
      });
    } catch (err) {
      console.error('Error in /api/client/latest-revit-state:', err);
      res.status(500).json({ hasUpdate: false, error: err.message });
    }
  });

  // React client pushes layout into Relay Queue for Revit Add-in
  app.post('/api/revit/outbound-queue', (req, res) => {
    try {
      outboundVersion++;
      pendingOutboundLayout = {
        version: outboundVersion,
        timestamp: new Date().toISOString(),
        payload: req.body,
      };

      res.json({
        success: true,
        version: outboundVersion,
        message: 'Layout queued in cloud/local relay. Ready for Revit add-in retrieval.',
        queuedAt: pendingOutboundLayout.timestamp,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Revit Add-in background poller pulls pending layout from Relay Queue
  app.get('/api/revit/outbound-queue', (req, res) => {
    try {
      const clientVersion = parseInt(req.query.lastVersion || '0', 10);
      const isFromRevit = req.headers['x-revit-client'] === 'RevitMptOptimizer' || req.query.fromRevit === 'true';

      if (isFromRevit) {
        lastRevitHeartbeat = {
          timestamp: Date.now(),
          status: 'online',
          source: 'relay-poll',
        };
      }

      if (pendingOutboundLayout && pendingOutboundLayout.version > clientVersion) {
        return res.json({
          hasPendingLayout: true,
          version: pendingOutboundLayout.version,
          timestamp: pendingOutboundLayout.timestamp,
          data: pendingOutboundLayout.payload,
        });
      }

      res.json({
        hasPendingLayout: false,
        currentVersion: outboundVersion,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({ hasPendingLayout: false, error: err.message });
    }
  });

  // Heartbeat from Revit Add-in
  app.post('/api/revit/heartbeat', (req, res) => {
    try {
      lastRevitHeartbeat = {
        timestamp: Date.now(),
        status: 'online',
        documentName: req.body?.documentName || 'Revit Project',
        framework: req.body?.framework || 'Native Revit 2027 API',
      };
      res.json({ status: 'ok', timestamp: lastRevitHeartbeat.timestamp });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Bridge Status check for UI indicator
  app.get('/api/revit/bridge-status', (req, res) => {
    const now = Date.now();
    const isOnline = Boolean(lastRevitHeartbeat && now - lastRevitHeartbeat.timestamp < 4500);

    res.json({
      isOnline,
      lastHeartbeatAgeMs: lastRevitHeartbeat ? now - lastRevitHeartbeat.timestamp : null,
      lastHeartbeat: isOnline ? lastRevitHeartbeat : null,
      outboundVersion,
      hasPendingLayout: Boolean(pendingOutboundLayout),
    });
  });

  // Export C# Revit Snippet Endpoint
  app.post('/api/export/revit-csharp', (req, res) => {
    try {
      const { assets, targetRisk, correlationMatrix } = req.body;
      const code = generateRevitCSharpSnippet(
        assets,
        targetRisk || 0.10,
        correlationMatrix || [[1, 0.15, 0.08], [0.15, 1, 0.22], [0.08, 0.22, 1]]
      );
      res.json({ code });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ============================================================================
  // Vite Middleware (Dev) & Static Assets (Prod)
  // ============================================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BIM MPT Urban Optimizer server running on port ${PORT}`);
  });
}

startServer();
