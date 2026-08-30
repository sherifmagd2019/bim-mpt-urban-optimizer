# BIM MPT Urban Optimizer AI Agent 🏢📈🤖

**An autonomous, full-stack spatial-financial engineering co-pilot that applies Harry Markowitz's Modern Portfolio Theory (MPT) to Building Information Modeling (BIM) workflows.**

---

### 🌐 Project Links & Submission Artifacts
* **GitHub Repository:** [(https://github.com/sherifmagd2019/bim-mpt-urban-optimizer))
* **Live App Demo:** (https://mptoptimizer.ai.studio/)
* **Live App Demo:** (https://bim-mpt-urban-optimizer-60r66r1lx-sherifmagd2019s-projects.vercel.app/)
* **Video Demo Walkthrough:** [(https://youtu.be/UzotNl5gPK0))
* **Devpost Submission:**  (https://devpost.com/software/bim-mpt-urban-optimize)
* **Academic Context:** Prepared for presentation at the **ICEPE 2026** conference.

---

## 💡 Inspiration
Generative Urban Design and Building Information Modeling (BIM) traditionally focus entirely on physical geometries, solar values, or generic zoning footprints. They treat building zones as isolated silos, ignoring real-world volatile market factors such as varying occupancy elasticities, financial absorption velocities, and localized rental yield risks. 

I was inspired by my own quantitative thesis work as an MScFE candidate at WorldQuant University. I realized that I could treat generative urban spatial distributions exactly like financial stock assets in a portfolio. By applying Harry Markowitz’s Modern Portfolio Theory (MPT), an architect could computationally balance competing spatial elements—minimizing macroeconomic covariance risk while maximizing the urban yield envelope.

## 🚀 What it does
BIM MPT Urban Optimizer AI Agent is a complete, full-stack, autonomous architectural financial engineering co-pilot. It allows developers and master-planners to test zoning layouts, execute macro correlation shocks, and dynamically stream the mathematically optimal configuration directly into Autodesk Revit 2027.

The system runs as two connected components: a **cloud-hosted React/Express web application** (deployed on Google Cloud Run) providing the optimization workspace and AI co-pilot, and a **local Autodesk Revit 2027 C# add-in** that receives live data from the cloud via a bridge server and materializes the optimized zoning directly into the BIM model.

The platform provides a highly visual, interactive web workspace containing:
1. **Interactive Correlation Matrix Heatmap**: Modulate cross-asset dependencies (e.g., how Residential performance correlates to Commercial demand during economic cycles) to re-evaluate the risk boundaries.
2. **Markowitz Efficient Frontier Curve**: A visual interface charting the exact boundary hyperbola where no higher architectural yield can be attained for a given volatility risk level.
3. **Generative BIM 3D Isometric Viewer**: A parametric grid rendering real-time spatial configurations that I can manipulate instantly..
4. **Quant AI Agent Panel**: An integrated conversational terminal running Gemini with explicit tool execution logic.

## 🧠 How I built it
I engineered a specialized, multi-tiered pipeline:
* **The Mathematical Engine**: Written in high-performance pure JavaScript (ES6), my core linear algebra solver runs partial-pivoting Gaussian elimination to invert the covariance matrix. It evaluates hyperbolic scalars $A$, $B$, $C$, and $D$ to solve $w = g + h\mu_p$.
* **The Front-End Interface**: Built with React 19, Vite, Tailwind CSS, and Lucide React. Recharts was used to plot continuous frontier hyperbola lines superimposed over live Monte Carlo simulation clouds.
* **The AI Co-Pilot Node Server**: An Express backend leveraging the official `@google/genai` library. It maps unstructured natural language prompts into function arrays utilizing Gemini function calls (`runOptimization` and `checkFeasibility`).
* **The BIM Automation Bridge**: A dedicated C# .NET 8.0 Add-in plugin using the Autodesk Revit 2027 API. It runs an internal asynchronous HttpListener loop (`LiveMptBridgeServerCommand`) to avoid freezing the CAD software thread while instantly materializing 3D DirectShape mass objects over local networks.

## 🛑 Challenges I faced & limits overcome
A significant hurdle emerged when resolving raw unconstrained MPT matrices: the mathematical formulas occasionally resulted in negative weight variables. While a financial fund manager can short-sell a stock, "short-selling" physical space has no logical translation in  real estate (you cannot build negative square meters of an industrial warehouse). 

To solve this physical spatial boundary constraint, I introduced an analytical projection solver using a probability simplex projection script (`projectToSimplex`). This forces the generative agent weights to gracefully conform to continuous non-negative bounds (summing to exactly 1.0, values $\ge 0$) while preserving the maximum possible Sharpe ratio.

## 📈 Accomplishments that I am proud of
* Successfully implemented real-time matrix inversion directly in a lightweight browser client with zero interface lag during mouse drag events.
* Empowered the AI agent to explicitly identify physical model impossibilities (infeasible bounds) and transparently explain to the user why a specific financial layout model requires simplex adjustment before generation.
* Achieved zero-UI-lock roundtrip polling sync between a React browser dashboard and a native desktop environment element engine (Autodesk Revit).

## 🎓 What I learned
I learned that cross-disciplinary engineering unlocks incredible opportunities. Applying advanced financial mathematics to physical urban master-planning removes a great deal of guesswork, helping designers quantify "diversification benefits" before laying the first structural foundation.

## 🔮 What's next for BIM MPT Urban Optimizer AI Agent
* **Multi-Criteria Commodity Integration**: Introduce fluctuating global material cost metrics (steel, concrete indices) directly into the volatility model matrix.
* **Geographical Vector Extraction**: Integrate live Google Maps GIS APIs to automatically approximate localized absorption risk parameters based on surrounding neighborhood infrastructure telemetry.

