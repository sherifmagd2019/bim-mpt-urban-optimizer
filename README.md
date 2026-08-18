# BIM MPT Urban Optimizer AI Agent 🏢📊🤖

An autonomous, full-stack spatial-financial engineering co-pilot that applies **Harry Markowitz's Modern Portfolio Theory (MPT)** to Building Information Modeling (BIM) workflows. The platform maps spatial programmatic asset allocations to optimized financial yield boundaries, streaming results asynchronously directly into **Autodesk Revit 2027**.

---

## 🏗️ System Architecture
The application runs on a distributed, asynchronous, multi-tiered infrastructure:
1. **Frontend Dashboard**: A high-performance React 19 interface visualizing quantitative models, dynamic correlation matrices, and live Continuous Efficient Frontier hyperbolas via Recharts.
2. **AI Co-Pilot Backend**: An Express Node.js instance integrated with the official `@google/genai` library leveraging **Gemini 3.7 Flash** function calling capabilities to parse design constraints down to deterministic analytical parameters.
3. **BIM Integration Webhook**: A native asynchronous C# .NET 8.0 Windows Class Library plugin executing a local low-overhead `HttpListener` context thread loop on port 8080 to update BIM DirectShape primitives instantly without halting user-interface threads.

---

## 🧮 Core Mathematical Optimization Engine
The algorithmic layer processes asset rebalancing matrices in pure client-side JavaScript. By evaluating the cross-asset covariance matrix $\mathbf{\Sigma}$ alongside expected returns vector $\mathbf{E}$, the engine solves the fundamental Markowitz Hyperbolic structural scalars:

$$A = \mathbf{E}^T \mathbf{\Sigma}^{-1} \mathbf{E}, \quad B = \mathbf{E}^T \mathbf{\Sigma}^{-1} \mathbf{1}, \quad C = \mathbf{1}^T \mathbf{\Sigma}^{-1} \mathbf{1}, \quad D = AC - B^2$$

Using these foundational scalars, the system calculates optimization basis vectors $g$ and $h$ to resolve weights across target yields $\mu_p$:

$$g = \frac{1}{D} [A(\mathbf{\Sigma}^{-1}\mathbf{1}) - B(\mathbf{\Sigma}^{-1}\mathbf{E})], \quad h = \frac{1}{D} [C(\mathbf{\Sigma}^{-1}\mathbf{E}) - B(\mathbf{\Sigma}^{-1}\mathbf{1})]$$

$$w = g + h\mu_p$$

*Note: To resolve structural boundary conflicts where negative allocation models emerge, a continuous simplex vector projection ($w \ge 0, \sum w_i = 1$) is calculated sequentially.*

---

## 🛠️ Step-by-Step Local Deployment & Setup Instructions

### 1. Initialize the Web Engine Frontend & Server
Ensure you have **Node.js v18+** installed locally before launching.
```bash
# Clone and enter the project workspace
cd bim-mpt-urban-optimizer

# Extract and install required dependencies
npm install

# Establish local background environment configurations
echo 'GEMINI_API_KEY="your_actual_google_ai_studio_api_key_here"' > .env

# Run the concurrent Vite development environment and Express backend server
npm run dev
```
Once initialized, navigate your browser layout directly to `http://localhost:3000` to review the dashboard.

### 2. Stand Up the Native Autodesk Revit C# Connection
1. Launch Microsoft Visual Studio and open the source solution within the `RevitPlugin/` folder subdirectory.
2. Verify target build compiler links resolve smoothly against **.NET 8.0 Windows** and the Autodesk Revit 2027 API binary assemblies (`RevitAPI.dll` / `RevitAPIUI.dll`).
3. Compile the solution to output `RevitMptUrbanOptimizer.dll` and map its structural companion file configuration manifest `RevitMptUrbanOptimizer.addin` directly into your system's native application folder path:  
   `%AppData%\Autodesk\Revit\Addins\2027\`
4. Boot up Autodesk Revit 2027, choose any active workspace model instance, open your external panels layout, and execute the **Live MPT Bridge Server Command** tool asset option to open the Port 8080 listening node connection safely.
