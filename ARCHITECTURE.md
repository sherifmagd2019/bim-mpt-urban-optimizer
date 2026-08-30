+--------------------------------------------------------------------------------------------------+

|                                  DESKTOP RUNTIME (Local CAD Workstation)                        |
|                                                                                                  |
|   +--------------------------+                                +------------------------------+   |
|   |   AUTODESK REVIT 2027    |                                |   RevitMPTOptimizer.dll      |   |
|   |      BIM Workspace       | <--- (DirectShape Extrusions) -| (C# .NET 8 / Math.NET Core)  |   |
|   +--------------------------+                                +------------------------------+   |
|                 |                                                            ^                   |
|                 | (FilteredElementCollector)                                 |                   |
|                 v                                                            |                   |
|   +--------------------------+                                +------------------------------+   |
|   |    Parametric Zoning     |                                |  LiveMptBridgeServerCommand  |   |
|   |  Footprints & FAR Data   |                                |  (HTTP Async Loop Listener)   |   |
|   +--------------------------+                                +------------------------------+   |
+-----------------|------------------------------------------------------------|-------------------+
                  |                                                            ^

                  |                                                            |
                  | (Live Geometrical Updates)                                 | (Asynchronous POST HTTP Payload)
                  | [JSON Block Data Array]                                    | [w Vectors / Dimensional Feet]
                  v                                                            |
+------------------------------------------------------------------------------|-------------------+

|                                  WEB BROWSER RUNTIME (Client Dashboard)                      |
|                                                                                                  |
|   +--------------------------+        (State Travel)          +------------------------------+   |
|   |    useHistoryStack.js    | <============================> |       App.jsx Main Context   |   |
|   |  (Ctrl+Z Undo/Redo Stack)|                                |     (Derived Vol/Yield KPIs) |   |
|   +--------------------------+                                +------------------------------+   |
|                                                                          |               ^       |
|                                              (Dynamic Slider Grabs /)    |               |       |
|                                              (Pairwise Correlation Shocks)               |       |
|                                                                          v               |       |
|   +--------------------------+                                +------------------------------+   |
|   |  BimMasterplanViewer.jsx |                                |          mptMath.js          |   |
|   |   (3D Isometric Canvas)  |                                | (Gaussian Matrix Inversion)   |   |
|   +--------------------------+                                |  (projectToSimplex Simplex)  |   |
|                 ^                                             +------------------------------+   |
|                 |                                                            |                   |
|                 | (Dispatches Suggested Actions: 'Apply Weights')            |                   |
|                 +--------------------------------------------+               |                   |
|                                                              v               v                   |
|                                                       +------------------------------+           |
|                                                       |      AiAgentPanel.jsx Client |           |
|                                                       |   (Telemetry UI & Input Bar) |           |
|                                                       +------------------------------+           |
+----------------------------------------------------------------------|---------------+           |

                                                                       |                           |
                                                       (Fetch API JSON | (Conversation History /   |
                                                        POST Request)  |  Live Parameters Payload) |
                                                                       v                           |
+--------------------------------------------------------------------------------------------------+

|                                  SERVER RUNTIME (Node.js & Gemini Gateway)                        |
|                                                                                                  |
|   +------------------------------------------------------------------------------------------+   |
|   |   server.js (Express Application Server Gateway Layer)                                   |   |
|   |                                                                                          |   |
|   |   +----------------------------+             +---------------------------------------+   |   |
|   |   |  executeRunOptimization()  | <---------> |   runOptimizationTool Schema Handle   |   |   |
|   |   +----------------------------+             +---------------------------------------+   |   |
|   |                                                                                          |   |
|   |   +----------------------------+             +---------------------------------------+   |   |
|   |   |  executeCheckFeasibility() | <---------> |   checkFeasibilityTool Schema Handle  |   |   |
|   |   +----------------------------+             +---------------------------------------+   |   |
|   +------------------------------------------------------------------|-----------------------+   |
+----------------------------------------------------------------------|---------------------------+
                                                                       |
                                                   (Official SDK Agent | (System Prompt Rules /
                                                    Streaming Channel) |  Real JSON Function Callbacks)
                                                                       v
+--------------------------------------------------------------------------------------------------+

|                                       EXTERNAL CLOUD LLM SYSTEM CORE                             |
|                                                                                                  |
|                       +-------------------------------------------------------+                  |
|                       |                   GEMINI 3.7 FLASH                    |                  |
|                       |    (Autonomous Multi-Turn Reasoning Optimizer Model)  |                  |
|                       +-------------------------------------------------------+                  |
+--------------------------------------------------------------------------------------------------+